(() => {
  const STORE_SESSIONS = "gym.sessions.v1";
  const STORE_VIDEOS = "gym.videos.v1";
  const STORE_DAYS = "gym.days.v1";
  const STORE_FOODS = "gym.foods.v1";
  const STORE_SHOP = "gym.shop.v1";
  const STORE_PROFILE = "gym.profile.v1";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  // ---------- armazenamento ----------
  // Por omissão guarda no browser (localStorage). Quando o site corre como
  // Artifact no claude.ai, passa a guardar na base de dados privada do
  // utilizador (sincroniza entre aparelhos) e as fotos/vídeos ficam em assets.
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function saveLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  let sessions = load(STORE_SESSIONS, []);
  // media[exId] = { link?: url, asset?: id, type?: contentType }
  let media = normalizeMedia(load(STORE_VIDEOS, {}));
  // days[date] = { date, steps?, flowDone?, flowMin?, coreDone?, notes? }
  let days = load(STORE_DAYS, {});
  // Atalhos de proteína (editáveis); começam com os valores de data.js.
  let foods = withKcal(load(STORE_FOODS, null) || PROTEIN_FOODS.map((f) => ({ ...f })));
  let foodsCustomized = !!load(STORE_FOODS, null);
  // Lista de compras: [{ id, cat, name, qty, price?, done }]; começa com SHOP_DEFAULT.
  const defaultShop = () => SHOP_DEFAULT.map((it, i) => ({ id: "d" + i, ...it, done: false }));
  // Lista guardada numa versão antiga da sugestão: passa à nova, mantendo o que já
  // estava no carrinho e os alimentos que o utilizador acrescentou.
  function migrateShop(items, v) {
    if (v >= SHOP_VERSION) return items;
    const done = new Set(items.filter((it) => it.done).map((it) => it.name));
    return [
      ...defaultShop().map((it) => ({ ...it, done: done.has(it.name) })),
      ...items.filter((it) => String(it.id).startsWith("u")),
    ];
  }
  const storedShop = load(STORE_SHOP, null);
  let shop = storedShop
    ? Array.isArray(storedShop) ? migrateShop(storedShop, 1) : migrateShop(storedShop.items || [], storedShop.v || 1)
    : defaultShop();
  let shopCustomized = !!storedShop;
  // Dados para o gasto em repouso: { height, age, sex: "m" | "f" }.
  let profile = load(STORE_PROFILE, {});
  let remote = null; // { col } quando a base de dados está disponível
  let assets = null;
  let currentWorkout = "A";
  // Programa ativo: "gym" (treinos A/B) ou "home" (kettlebell em casa).
  let mode = "gym";
  try { mode = PROGRAMS[localStorage.getItem("gym.mode")] ? localStorage.getItem("gym.mode") : "gym"; } catch {}
  const slotWorkout = (slot, m = mode) => PROGRAMS[m].workouts[slot];
  // Sessão de força feita nesse dia nesse slot, em qualquer programa.
  const slotSession = (slot, date) =>
    Object.keys(PROGRAMS).map((m) => sessionFor(slotWorkout(slot, m), date)).find(Boolean);
  let dirty = false;

  // Atalhos guardados antes de haver calorias: usa as kcal do atalho original com o mesmo nome.
  function withKcal(list) {
    return list.map((f) => (f.kcal != null ? f : { ...f, kcal: (PROTEIN_FOODS.find((d) => d.name === f.name) || {}).kcal || 0 }));
  }

  function normalizeMedia(m) {
    const out = {};
    Object.entries(m || {}).forEach(([k, v]) => (out[k] = typeof v === "string" ? { link: v } : v));
    return out;
  }

  const sessionId = (workout, date) => `s_${workout}_${date}`;

  async function persistSession(s) {
    if (remote) {
      await remote.col.doc(s.id).set({ ...s, kind: "session" });
      return true;
    }
    return saveLocal(STORE_SESSIONS, sessions);
  }
  async function removeSession(id) {
    if (remote) await remote.col.doc(id).delete();
    else saveLocal(STORE_SESSIONS, sessions);
  }
  async function persistDay(d) {
    if (remote) await remote.col.doc("d_" + d.date).set({ ...d, kind: "day" });
    else saveLocal(STORE_DAYS, days);
  }
  async function persistProfile() {
    if (remote) await remote.col.doc("profile").set({ kind: "profile", ...profile });
    else saveLocal(STORE_PROFILE, profile);
  }
  async function persistFoods() {
    foodsCustomized = true;
    if (remote) await remote.col.doc("foods").set({ kind: "foods", items: foods });
    else saveLocal(STORE_FOODS, foods);
  }
  async function persistShop() {
    shopCustomized = true;
    if (remote) await remote.col.doc("shop").set({ kind: "shop", items: shop, v: SHOP_VERSION });
    else saveLocal(STORE_SHOP, { v: SHOP_VERSION, items: shop });
  }
  async function persistMedia() {
    if (remote) await remote.col.doc("media").set({ kind: "media", items: media });
    else saveLocal(STORE_VIDEOS, media);
  }

  const allExercises = Object.entries(WORKOUTS).flatMap(([w, def]) =>
    def.exercises.map((ex) => ({ ...ex, workout: w }))
  );

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const roundTo = (n, step = 2.5) => Math.round(n / step) * step;
  const fmtKg = (n) => (Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, "")) + " kg";
  const fmtDate = (d) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
  const escapeHtml = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function sortedSessions() {
    return [...sessions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.savedAt - b.savedAt));
  }

  // ---------- plano B ----------
  // Cada sessão guarda em `variants[exId]` o id da alternativa usada (sem entrada = exercício principal).
  const variantKey = (s, exId) => (s && s.variants && s.variants[exId]) || "main";
  let variants = {}; // escolha atual no formulário do treino

  function variantOf(ex, key) {
    const alt = key && key !== "main" && (ex.alts || []).find((a) => a.id === key);
    if (!alt) return { key: "main", name: ex.name, cues: ex.cues, q: ex.video, photo: ex.photo === false ? null : `img/${ex.photo || ex.id}`, photoNote: ex.photoNote, vids: ex.vids };
    return { key: alt.id, name: alt.name, cues: alt.cues, q: alt.q, photo: alt.photo === false ? null : `img/alt-${alt.id}`, alt: true };
  }

  // Último registo de um exercício (na mesma variante) antes de uma data (exclusive).
  function lastEntry(exId, beforeDate, key = "main") {
    const list = sortedSessions().filter(
      (s) =>
        s.entries[exId] && s.entries[exId].some((r) => r.reps) && (!beforeDate || s.date < beforeDate) && variantKey(s, exId) === key
    );
    const s = list[list.length - 1];
    return s ? { date: s.date, sets: s.entries[exId] } : null;
  }

  // ---------- sugestão de progressão dupla ----------
  function suggestion(ex, last) {
    if (!last)
      return ex.home
        ? "Primeira vez: usa o peso indicado e vê quantas reps fazes com boa técnica, parando 1–2 antes da falha."
        : "Primeira vez: escolhe uma carga em que chegues ao fundo da faixa com boa técnica.";
    const top = last.sets[0];
    if (!top || !top.reps) return "";
    const range = ex.sets[0];
    const kg = Number(top.kg) || 0;
    if (ex.home) {
      const allTop = last.sets.every((r) => r.reps >= range.max);
      if (allTop) return `✅ Chegaste ao topo nas ${last.sets.length} séries. Próximo passo: <strong>${escapeHtml(ex.next)}</strong>`;
      const lowest = Math.min(...last.sets.map((r) => r.reps || 0));
      return `Mantém o peso e tenta <strong>+1 ${range.unit && range.unit.startsWith("s") ? "a 5 s" : "rep"}</strong> nas séries mais fracas (a mais baixa foi ${lowest}). Objetivo: ${range.max} em todas.`;
    }
    if (top.reps >= range.max) {
      if (!kg) return `Chegaste a ${top.reps} reps. Aumenta a resistência e volta às ${range.min} reps.`;
      const inc = Math.max(ex.compound ? 5 : 2.5, roundTo(kg * 0.05));
      return `✅ Chegaste ao topo (${top.reps} reps). Sobe para <strong>${fmtKg(kg + inc)}</strong> × ${range.min}.`;
    }
    return `Mantém <strong>${kg ? fmtKg(kg) : "a carga"}</strong> e tenta <strong>${top.reps + 1} reps</strong> (objetivo: ${range.max}).`;
  }

  // ---------- vídeos e fotos ----------
  const inViewer = !!(window.claude && window.claude.use);
  function youtubeId(url) {
    const m = String(url).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  function safeUrl(url) {
    return /^https?:\/\//i.test(url) ? url : null;
  }
  function demoHtml(ex, v) {
    const m = media[ex.id] || {};
    const search = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
    let block = "";
    if (m.asset) {
      const src = "/_blob/" + m.asset;
      block = /^video\//.test(m.type || "")
        ? `<div class="video"><video src="${src}" controls playsinline muted loop></video></div>`
        : `<div class="video"><img src="${src}" alt="${escapeHtml(ex.name)}" loading="lazy"></div>`;
    } else if (m.link && !inViewer && youtubeId(m.link)) {
      // Fora do claude.ai o vídeo do YouTube aparece embutido.
      block = `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${youtubeId(m.link)}" title="${escapeHtml(ex.name)}" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture"></iframe></div>`;
    } else if (m.link && !inViewer && (/^data:image\//.test(m.link) || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(m.link))) {
      block = `<div class="video"><img src="${escapeHtml(m.link)}" alt="${escapeHtml(ex.name)}" loading="lazy"></div>`;
    }
    const link = m.link && safeUrl(m.link);
    const photos = v.photo
      ? `
      <figure class="photos">
        <div class="photo-pair">
          <div><img src="${v.photo}-0.jpg" alt="${escapeHtml(v.name)}: fase 1" loading="lazy" width="640" height="427"><span>Fase 1</span></div>
          <div><img src="${v.photo}-1.jpg" alt="${escapeHtml(v.name)}: fase 2" loading="lazy" width="640" height="427"><span>Fase 2</span></div>
        </div>
        ${v.photoNote ? `<figcaption>${escapeHtml(v.photoNote)}</figcaption>` : ""}
      </figure>`
      : "";
    const vids = (v.vids || []).length
      ? `<div class="vids ex-vids">
          ${!inViewer ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${v.vids[0].id}" title="${escapeHtml(v.vids[0].title)}" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture"></iframe></div>` : ""}
          ${v.vids
            .map(
              (x, i) => `<a class="vid ${i === 0 ? "featured" : ""}" href="https://www.youtube.com/watch?v=${x.id}" target="_blank" rel="noopener">
                <span class="vid-play" aria-hidden="true"></span>
                <span class="vid-text">${i === 0 ? "<em>Vídeo de demonstração</em>" : ""}<strong>${escapeHtml(x.title)}</strong><small>YouTube · em inglês</small></span>
              </a>`
            )
            .join("")}
        </div>`
      : "";
    return `
      ${photos}
      ${block}
      ${vids}
      <div class="chips">
        <a target="_blank" rel="noopener" href="${search(v.q)}">▶ ${vids ? "Mais vídeos" : "Vídeos de demonstração"}</a>
        ${link ? `<a target="_blank" rel="noopener" href="${escapeHtml(link)}">▶ O meu vídeo</a>` : ""}
        <button class="link set-video" data-ex="${ex.id}" aria-expanded="false">${m.link || m.asset ? "Trocar vídeo/foto" : "Fixar vídeo/foto"}</button>
      </div>
      <div class="media-panel" data-panel="${ex.id}" hidden>
        <div class="row">
          <input type="url" id="link-${ex.id}" placeholder="Link de um vídeo (YouTube, Instagram…)" value="${escapeHtml(m.link || "")}">
          <button data-save-link="${ex.id}">Guardar link</button>
        </div>
        ${
          assets || !inViewer
            ? `<div class="row">
                <label class="button-like small" for="file-${ex.id}">${assets ? "Carregar foto ou vídeo" : "Escolher foto"}</label>
                <input type="file" id="file-${ex.id}" data-upload="${ex.id}" accept="image/*,video/mp4,video/webm" hidden>
              </div>`
            : ""
        }
        ${m.link || m.asset ? `<div class="row"><button data-clear-media="${ex.id}">Remover vídeo/foto</button></div>` : ""}
        <span class="msg" data-msg="${ex.id}"></span>
      </div>`;
  }

  // ---------- treino ----------
  function sessionFor(workout, date) {
    return sessions.find((s) => s.workout === workout && s.date === date);
  }

  function renderWorkout() {
    const def = WORKOUTS[currentWorkout];
    const dateInput = $("#session-date");
    if (!dateInput.value) dateInput.value = today();
    const date = dateInput.value;
    const existing = sessionFor(currentWorkout, date);
    dirty = false;

    $("#workout-title").textContent = def.short || def.name;
    $("#warmup-callout").innerHTML = def.warmup || "";
    $("#workout-day").textContent = def.day + (def.home ? " · kettlebell em casa" : "");
    $("#session-notes").value = existing ? existing.notes || "" : "";
    $("#session-minutes").value = existing && existing.minutes ? existing.minutes : "";
    $("#session-minutes").placeholder = def.minutes || 60;
    updateWorkoutKcal();

    variants = existing && existing.variants ? { ...existing.variants } : {};
    $("#exercise-list").innerHTML = def.exercises.map((ex, i) => renderCard(ex, i, date, existing)).join("");

    def.exercises.forEach((ex, i) => i < 3 && updateWarmup(ex));
  }

  function planBHtml(ex, v) {
    const opts = [variantOf(ex, "main"), ...(ex.alts || []).map((a) => variantOf(ex, a.id))];
    return `
      <div class="planb">
        <button class="planb-toggle" data-planb="${ex.id}" aria-expanded="false">${v.alt ? "Trocar exercício" : "Máquina ocupada? Plano B"}</button>
        <div class="planb-list" data-planb-list="${ex.id}" hidden>
          ${opts
            .map(
              (o) => `
            <button class="planb-opt ${o.key === v.key ? "active" : ""}" data-swap-ex="${ex.id}" data-swap="${o.key}">
              ${o.photo ? `<img src="${o.photo}-0.jpg" alt="" loading="lazy">` : `<span class="planb-noimg" aria-hidden="true"></span>`}
              <span><small>${o.alt ? "Plano B" : "Principal"}</small>${escapeHtml(o.name)}</span>
            </button>`
            )
            .join("")}
        </div>
      </div>`;
  }

  function renderCard(ex, i, date, existing) {
    const v = variantOf(ex, variants[ex.id]);
    const last = lastEntry(ex.id, date, v.key);
    const current = existing && variantKey(existing, ex.id) === v.key && existing.entries[ex.id];
    const circuit = WORKOUTS[currentWorkout].circuit;
    const rest = circuit ? 90 : ex.compound ? 210 : 90;
    const rows = ex.sets
      .map((set, si) => {
        const prev = last && last.sets[si];
        const cur = current && current[si];
        return `
          <div class="set-row">
            <span class="set-label">${set.label}<small>${set.min}–${set.max} ${set.unit || "reps"}</small></span>
            <label><span>kg</span><input type="number" inputmode="decimal" step="0.5" min="0" id="in-${ex.id}-${si}-kg" data-ex="${ex.id}" data-set="${si}" data-field="kg"
              value="${cur && cur.kg !== "" ? cur.kg : ""}" placeholder="${prev && prev.kg !== "" ? prev.kg : "–"}"></label>
            <label><span>reps</span><input type="number" inputmode="numeric" step="1" min="0" id="in-${ex.id}-${si}-reps" data-ex="${ex.id}" data-set="${si}" data-field="reps"
              value="${cur && cur.reps ? cur.reps : ""}" placeholder="${prev && prev.reps ? prev.reps : "–"}"></label>
          </div>`;
      })
      .join("");
    return `
      <article class="card ${v.alt ? "is-alt" : ""}" data-ex="${ex.id}" data-index="${i}">
        <header>
          <span class="num">${i + 1}</span>
          <div>
            ${v.alt ? `<span class="planb-tag">Plano B · em vez de ${escapeHtml(ex.name)}</span>` : ""}
            <h3>${escapeHtml(v.name)}</h3>
            <span class="tag ${ex.compound ? "compound" : ""}">${ex.compound ? "Composto · parar a 1–2 reps da falha" : "Isolamento · podes ir à falha"}</span>
          </div>
        </header>
        ${(ex.alts || []).length ? planBHtml(ex, v) : ""}
        <ul class="cues">${v.cues.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
        ${demoHtml(ex, v)}
        ${i < 3 && !ex.home ? `<div class="warmup" data-warmup="${ex.id}"></div>` : ""}
        ${ex.load ? `<div class="warmup"><strong>Peso:</strong> ${escapeHtml(ex.load)}</div>` : ""}
        <div class="hint">${last ? `<span class="muted">Último (${fmtDate(last.date)}): ${last.sets
          .filter((r) => r.reps)
          .map((r) => `${r.kg !== "" ? r.kg + "×" : ""}${r.reps}`)
          .join(" · ")}</span><br>` : v.alt ? `<span class="muted">Primeira vez com este exercício: começa leve e ajusta.</span><br>` : ""}${last || !v.alt ? suggestion(ex, last) : ""}</div>
        <div class="sets">${rows}</div>
        <button class="rest" data-rest="${rest}" data-name="${escapeHtml(v.name)}">⏱ Descanso ${circuit ? "90 s (fim da volta)" : ex.compound ? "3–4 min" : "1–2 min"}</button>
      </article>`;
  }

  function swapVariant(exId, key) {
    const ex = allExercises.find((x) => x.id === exId);
    const card = $(`.card[data-ex="${exId}"]`);
    if (!ex || !card) return;
    if (key === "main") delete variants[exId];
    else variants[exId] = key;
    dirty = true;
    const date = $("#session-date").value || today();
    card.outerHTML = renderCard(ex, Number(card.dataset.index), date, sessionFor(currentWorkout, date));
    updateWarmup(ex);
    $(`.card[data-ex="${exId}"]`).scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function topKg(exId) {
    const input = $(`input[data-ex="${exId}"][data-set="0"][data-field="kg"]`);
    if (!input) return 0;
    return Number(input.value || input.placeholder) || 0;
  }

  function updateWarmup(ex) {
    const box = $(`[data-warmup="${ex.id}"]`);
    if (!box) return;
    const kg = topKg(ex.id);
    box.innerHTML = kg
      ? `<strong>Aquecimento:</strong> ${fmtKg(roundTo(kg * 0.5))} × 6 → ${fmtKg(roundTo(kg * 0.7))} × 3`
      : `<strong>Aquecimento:</strong> 50% × 6 → 70% × 3 (introduz o peso do top set para calcular)`;
  }

  function collectSession() {
    const def = WORKOUTS[currentWorkout];
    const entries = {};
    def.exercises.forEach((ex) => {
      const sets = ex.sets.map((_, si) => {
        const kg = $(`input[data-ex="${ex.id}"][data-set="${si}"][data-field="kg"]`).value;
        const reps = $(`input[data-ex="${ex.id}"][data-set="${si}"][data-field="reps"]`).value;
        return { kg: kg === "" ? "" : Number(kg), reps: reps === "" ? 0 : Number(reps) };
      });
      if (sets.some((s) => s.reps || s.kg !== "")) entries[ex.id] = sets;
    });
    return entries;
  }

  function collectVariants(entries) {
    const out = {};
    Object.keys(entries).forEach((id) => variants[id] && (out[id] = variants[id]));
    return out;
  }

  async function saveSession() {
    const date = $("#session-date").value || today();
    const entries = collectSession();
    const status = $("#save-status");
    if (!Object.keys(entries).length) {
      status.textContent = "Nada para guardar. Preenche pelo menos uma série.";
      return;
    }
    const notes = $("#session-notes").value.trim();
    const minutes = Math.round(Number($("#session-minutes").value)) || 0;
    const used = collectVariants(entries);
    let s = sessionFor(currentWorkout, date);
    if (s) {
      Object.assign(s, { entries, variants: used, notes, minutes, savedAt: Date.now() });
    } else {
      s = { id: sessionId(currentWorkout, date), workout: currentWorkout, date, entries, variants: used, notes, minutes, savedAt: Date.now() };
      sessions.push(s);
    }
    status.textContent = "A guardar…";
    try {
      const ok = await persistSession(s);
      dirty = false;
      status.textContent = ok ? `Guardado (${fmtDate(date)})` : "Não foi possível guardar neste browser.";
    } catch (err) {
      status.textContent = "Não foi possível guardar. Verifica a ligação e tenta outra vez.";
    }
  }

  // ---------- evolução ----------
  function renderProgress() {
    const select = $("#progress-exercise");
    if (!select.options.length) {
      select.innerHTML = Object.entries(WORKOUTS)
        .map(
          ([w, def]) =>
            `<optgroup label="${def.name}">${def.exercises.map((ex) => `<option value="${ex.id}">${escapeHtml(ex.name)}</option>`).join("")}</optgroup>`
        )
        .join("");
    }
    const ex = allExercises.find((e) => e.id === select.value) || allExercises[0];
    const withData = sortedSessions().filter((s) => s.entries[ex.id] && s.entries[ex.id][0] && s.entries[ex.id][0].reps);
    const keys = [...new Set(withData.map((s) => variantKey(s, ex.id)))];
    const vSel = $("#progress-variant");
    if (vSel.dataset.ex !== ex.id || [...vSel.options].map((o) => o.value).join() !== ["main", ...keys.filter((k) => k !== "main")].join()) {
      vSel.dataset.ex = ex.id;
      vSel.innerHTML = ["main", ...keys.filter((k) => k !== "main")]
        .map((k) => `<option value="${k}">${k === "main" ? "Principal" : "Plano B"}: ${escapeHtml(variantOf(ex, k).name)}</option>`)
        .join("");
    }
    $("#progress-variant-field").hidden = !keys.some((k) => k !== "main");
    const key = vSel.value || "main";
    const points = withData
      .filter((s) => variantKey(s, ex.id) === key)
      .map((s) => {
        const top = s.entries[ex.id][0];
        const kg = Number(top.kg) || 0;
        return { date: s.date, kg, reps: top.reps, e1rm: kg ? kg * (1 + top.reps / 30) : 0, sets: s.entries[ex.id] };
      });

    $("#progress-chart").innerHTML = chartSvg(points);
    $("#progress-table").innerHTML = points.length
      ? `<table><thead><tr><th>Data</th>${ex.sets.map((s) => `<th>${s.label}</th>`).join("")}<th title="1RM estimado (Epley)">1RM est.</th></tr></thead><tbody>${points
          .slice()
          .reverse()
          .map(
            (p) =>
              `<tr><td>${fmtDate(p.date)}</td>${ex.sets
                .map((_, i) => {
                  const r = p.sets[i];
                  return `<td>${r && r.reps ? `${r.kg !== "" ? r.kg + " kg × " : ""}${r.reps}` : "–"}</td>`;
                })
                .join("")}<td>${p.e1rm ? fmtKg(Math.round(p.e1rm)) : "–"}</td></tr>`
          )
          .join("")}</tbody></table>`
      : "";

    const hist = sortedSessions().reverse();
    $("#session-history").innerHTML = hist.length
      ? hist
          .map(
            (s) => `
        <div class="history-item">
          <div><strong>${WORKOUTS[s.workout].name}</strong> · ${fmtDate(s.date)}
            <span class="muted">· ${Object.keys(s.entries).length} exercícios</span>
            ${s.notes ? `<div class="muted small">${escapeHtml(s.notes)}</div>` : ""}</div>
          <div class="history-actions">
            <button class="link" data-open="${s.id}">Abrir</button>
            <button class="link danger-text" data-delete="${s.id}">Apagar</button>
          </div>
        </div>`
          )
          .join("")
      : `<p class="muted">Ainda não há treinos registados. Abre o Treino A ou B, preenche os pesos e carrega em "Guardar treino".</p>`;
  }

  function chartSvg(points) {
    if (!points.length) return `<p class="empty">Sem registos para este exercício. Guarda um treino para começar a ver a evolução.</p>`;
    const W = 640, H = 260, P = { l: 44, r: 16, t: 24, b: 36 };
    const kgs = points.map((p) => p.kg);
    let min = Math.min(...kgs), max = Math.max(...kgs);
    if (min === max) { min -= 5; max += 5; }
    const pad = (max - min) * 0.15;
    min = Math.max(0, min - pad); max += pad;
    const x = (i) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (i * (W - P.l - P.r)) / (points.length - 1));
    const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
    const ticks = 4;
    const grid = Array.from({ length: ticks + 1 }, (_, i) => {
      const v = min + ((max - min) * i) / ticks;
      return `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${P.l - 6}" y="${y(v) + 4}" class="axis" text-anchor="end">${Math.round(v)}</text>`;
    }).join("");
    const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");
    const step = Math.ceil(points.length / 8);
    const dots = points
      .map(
        (p, i) => `<g><circle cx="${x(i)}" cy="${y(p.kg)}" r="5" class="dot"><title>${fmtDate(p.date)}: ${p.kg} kg × ${p.reps}</title></circle>
        <text x="${x(i)}" y="${y(p.kg) - 10}" class="label" text-anchor="middle">×${p.reps}</text>
        ${i % step === 0 || i === points.length - 1 ? `<text x="${x(i)}" y="${H - 12}" class="axis" text-anchor="middle">${p.date.slice(5).split("-").reverse().join("/")}</text>` : ""}</g>`
      )
      .join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do peso no top set">
      ${grid}<text x="8" y="14" class="axis">kg</text>
      <path d="${path}" class="line"/>${dots}</svg>
      <p class="muted small">Peso da 1.ª série (top set) ao longo do tempo; o número em cima de cada ponto são as repetições.</p>`;
  }

  // ---------- cronómetro de descanso ----------
  let timerInt = null;
  function startTimer(seconds, name) {
    clearInterval(timerInt);
    const end = Date.now() + seconds * 1000;
    const box = $("#timer");
    box.hidden = false;
    box.classList.remove("done");
    $("#timer-label").textContent = name;
    const tick = () => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      $("#timer-time").textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (!left) {
        clearInterval(timerInt);
        box.classList.add("done");
        $("#timer-label").textContent = "Descanso terminado. Próxima série!";
        try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch {}
      }
    };
    tick();
    timerInt = setInterval(tick, 500);
  }

  // ---------- semana ----------
  const DOW_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  let weekOffset = 0;

  const isoDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  function weekDates(offset) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7); // segunda-feira
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(d);
      x.setDate(d.getDate() + i);
      return x;
    });
  }

  function dayStatus(plan, date) {
    const d = days[date] || {};
    if (plan.type === "workout") {
      const s = slotSession(plan.slot, date);
      return { done: !!s, label: s ? `Feito · ${Object.keys(s.entries).length} exercícios registados` : "" };
    }
    if (plan.type === "steps") {
      const n = Number(d.steps) || 0;
      return { done: n >= STEPS_GOAL, label: n ? `${n.toLocaleString("pt-PT")} passos` : "" };
    }
    if (plan.type === "mixed") {
      const s = sessionFor(plan.workout, date);
      if (s) return { done: true, label: `Feito · ${Object.keys(s.entries).length} exercícios registados` };
    }
    if (plan.type === "flow" || plan.type === "mixed") return { done: !!d.flowDone, label: d.flowDone ? `Feito${d.flowMin ? ` · ${d.flowMin} min` : ""}` : "" };
    return { done: !!d.coreDone, label: d.coreDone ? "Estabilização lombar feita" : "" };
  }

  function coreCheck(date, d) {
    return `<label class="check"><input type="checkbox" id="core-${date}" data-day="${date}" data-field="coreDone" ${d.coreDone ? "checked" : ""}>
      <span>10 min de estabilização lombar (bird dog, side plank, dead bug)</span></label>`;
  }

  // Semana do programa (1 = semana de FLOW_START) para escolher o vídeo recomendado.
  function programWeek(date) {
    const ms = new Date(date + "T12:00:00") - new Date(FLOW_START + "T12:00:00");
    return Math.max(1, Math.floor(ms / (7 * 864e5)) + 1);
  }

  function flowVideosHtml(date) {
    const wk = programWeek(date);
    const pick =
      FLOW_VIDEOS.find((v) => v.weeks.includes(wk)) || FLOW_VIDEOS[FLOW_VIDEOS.length - 1];
    const url = (v) => "https://www.youtube.com/watch?v=" + v.id;
    const card = (v, featured) => `
      <a class="vid ${featured ? "featured" : ""}" href="${url(v)}" target="_blank" rel="noopener">
        <span class="vid-play" aria-hidden="true"></span>
        <span class="vid-text">
          ${featured ? `<em>Recomendado · semana ${wk}</em>` : ""}
          <strong>${escapeHtml(v.title)}</strong>
          <small>${escapeHtml(v.level)} · ${escapeHtml(v.length)}</small>
          ${featured ? `<span class="vid-note">${escapeHtml(v.note)}</span>` : ""}
        </span>
      </a>`;
    const embed =
      !inViewer
        ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${pick.id}" title="${escapeHtml(pick.title)}" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture"></iframe></div>`
        : "";
    return `
      <div class="vids">
        ${embed}
        ${card(pick, true)}
        <details class="vid-more">
          <summary>Outros vídeos para iniciantes</summary>
          <div class="vid-list">${FLOW_VIDEOS.filter((v) => v !== pick).map((v) => card(v, false)).join("")}</div>
        </details>
      </div>`;
  }

  function flowTipsHtml() {
    return `
        <details class="flow-tips">
          <summary>Cuidados com as hérnias e a anca</summary>
          <ul>
            <li>Segue a ordem dos vídeos recomendados: primeiro as posições base, depois sessões mais longas.</li>
            <li>Sempre que o vídeo tiver ape ou agachamento profundo, desce só até a anca ficar a ~90°.</li>
            <li><strong>Boas escolhas:</strong> beast hold e beast crawl (coluna neutra, abdominal ativo), crab hold, wrist prep e os movimentos de ativação.</li>
            <li><strong>Com cuidado ou adaptados:</strong> side kickthrough e crab reach envolvem rotação e extensão da coluna. Faz amplitude curta e lenta, ou salta-os.</li>
            <li><strong>Evitar no início:</strong> scorpion reach (extensão com rotação da lombar) e o ape em agachamento profundo (passa os ~90° de flexão da anca).</li>
            <li>Mantém o pescoço neutro, sem atirar a cabeça para trás no crab.</li>
            <li>Os mesmos sinais para parar: dor que irradia, formigueiro, dormência ou perda de força.</li>
            <li>Mostra um dos vídeos ao teu fisioterapeuta para confirmar o que podes fazer.</li>
          </ul>
        </details>`;
  }

  // Bloco da manhã, igual em todos os dias: caminhada e intervalos 3×3.
  function morningHtml(date, d) {
    const dow = new Date(date + "T12:00:00").getDay();
    const good = MORNING.intervalDays.includes(dow);
    return `
      <div class="morning">
        <p class="day-desc"><span class="morning-tag">Manhã</span> Caminhada de ~${MORNING.steps.toLocaleString("pt-PT")} passos.
          ${good ? `<strong>Bom dia para os 3×3:</strong> ${escapeHtml(MORNING.intervals)}.` : `Sugestão: só caminhada, sem intervalos${morningHint(dow)}.`}</p>
        <div class="flow-row">
          <label class="check"><input type="checkbox" id="walk-${date}" data-day="${date}" data-field="walkDone" ${d.walkDone ? "checked" : ""}><span>Caminhada feita</span></label>
          <label class="check"><input type="checkbox" id="hiit-${date}" data-day="${date}" data-field="hiitDone" ${d.hiitDone ? "checked" : ""}><span>3×3 feito</span></label>
        </div>
      </div>`;
  }
  const morningHint = (dow) => (dow === 1 || dow === 5 ? " (dia de treino de força)" : dow === 3 ? " (já há circuito)" : " (recuperação)");

  function dayBody(plan, date) {
    return morningHtml(date, days[date] || {}) + dayPlanBody(plan, date);
  }

  function dayPlanBody(plan, date) {
    const d = days[date] || {};
    if (plan.type === "workout") {
      const def = WORKOUTS[slotWorkout(plan.slot)];
      return `
        <p class="day-desc">${def.exercises.length} exercícios · 2 séries · ~60 min com aquecimento.</p>
        <button class="pill-btn dark" data-open-workout="${plan.slot ? "B" : "A"}" data-date="${date}">Abrir ${def.short}</button>`;
    }
    if (plan.type === "steps") {
      const n = Number(d.steps) || 0;
      const pct = Math.min(100, Math.round((n / STEPS_GOAL) * 100));
      return `
        <p class="day-desc">Pelo menos ${STEPS_GOAL.toLocaleString("pt-PT")} passos ao longo do dia; os ~${MORNING.steps.toLocaleString("pt-PT")} da manhã já contam. Regista aqui o total do dia.</p>
        <div class="steps-row">
          <label for="steps-${date}">Passos</label>
          <input type="number" inputmode="numeric" min="0" step="100" id="steps-${date}" data-day="${date}" data-field="steps" value="${n || ""}" placeholder="0">
        </div>
        <div class="bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
        <p class="bar-label">${pct}% do objetivo</p>
        ${coreCheck(date, d)}`;
    }
    if (plan.type === "mixed") {
      const def = WORKOUTS[plan.workout];
      return `
        <p class="day-desc"><strong>1. Aquecimento:</strong> 10 min de Animal Flow com o vídeo da semana (podes parar a meio).</p>
        ${flowVideosHtml(date)}
        ${flowTipsHtml()}
        <p class="day-desc"><strong>2. Circuito:</strong> ${def.exercises.length} exercícios, 3 voltas, corpo e uma kettlebell (6 ou 12 kg) · ~35 min no total.</p>
        <ul class="mixed-list">${def.exercises.map((ex) => `<li>${escapeHtml(ex.name)} <span class="muted">· ${escapeHtml(ex.load)}</span></li>`).join("")}</ul>
        <button class="pill-btn dark" data-open-workout="W" data-date="${date}">Abrir circuito</button>`;
    }
    if (plan.type === "flow") {
      return `
        <p class="day-desc">Sessão follow-along de 20–30 min, a intensidade leve a moderada: deves acabar com energia, não exausto.</p>
        ${flowVideosHtml(date)}
        <div class="chips">
          <a target="_blank" rel="noopener" href="${FLOW_CHANNEL}/videos">▶ Mais vídeos: Strength Side</a>
        </div>
        ${flowTipsHtml()}
        <div class="flow-row">
          <label class="check"><input type="checkbox" id="flow-${date}" data-day="${date}" data-field="flowDone" ${d.flowDone ? "checked" : ""}><span>Sessão feita</span></label>
          <label class="inline-num" for="flowmin-${date}">Minutos
            <input type="number" inputmode="numeric" min="0" step="5" id="flowmin-${date}" data-day="${date}" data-field="flowMin" value="${d.flowMin || ""}" placeholder="–">
          </label>
        </div>
        <input type="text" id="flownotes-${date}" data-day="${date}" data-field="notes" value="${escapeHtml(d.notes || "")}" placeholder="Que vídeo fizeste? Como te sentiste?">`;
    }
    return `
      <p class="day-desc">Recuperação. Caminhada leve se te apetecer, sem ginásio.</p>
      ${coreCheck(date, d)}`;
  }

  function renderWeek() {
    const dates = weekDates(weekOffset);
    const todayIso = today();
    const fmt = (d) => d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
    $("#week-range").textContent = `${fmt(dates[0])} – ${fmt(dates[6])}`;
    $("#week-today").disabled = weekOffset === 0;

    let planned = 0, done = 0, stepsTotal = 0, stepsDays = 0, burnWeek = 0, balWeek = 0, balDays = 0;
    const cards = dates.map((dt) => {
      const date = isoDate(dt);
      const plan = WEEK.find((w) => w.dow === dt.getDay());
      const st = dayStatus(plan, date);
      if (plan.type !== "rest") {
        planned++;
        if (st.done) done++;
      }
      const n = Number((days[date] || {}).steps) || 0;
      if (n) { stepsTotal += n; stepsDays++; }
      const tone = plan.type === "workout" ? `workout-${plan.slot ? "B" : "A"}` : plan.type;
      const burn = burnOf(date);
      burnWeek += burn.kcal;
      const eaten = eatenOf(date), rest = restKcal(date);
      const bal = eaten && rest ? eaten - rest - burn.kcal : null;
      if (bal !== null) { balWeek += bal; balDays++; }
      return `
        <article class="day ${date === todayIso ? "today" : ""} ${st.done ? "done" : ""}" data-tone="${tone}">
          <header class="day-head">
            <div class="day-date"><span>${DOW_NAMES[dt.getDay()]}</span><b>${dt.getDate()}</b></div>
            <div class="day-title">
              <h3>${escapeHtml(plan.type === "workout" ? WORKOUTS[slotWorkout(plan.slot)].name : plan.title)}</h3>
              <span class="day-status">${date === todayIso ? `<em>Hoje</em>` : ""}${st.done ? `<i class="ok">✓ ${escapeHtml(st.label)}</i>` : st.label ? escapeHtml(st.label) : plan.type === "rest" ? "" : "Por fazer"}${burn.kcal ? `<span class="burn-tag" title="${escapeHtml(burn.parts.map((p) => `${p.label}: ${p.kcal} kcal`).join(" · "))}">🔥 ≈${burn.kcal} kcal</span>` : ""}${bal !== null ? `<span class="bal-tag ${bal < 0 ? "deficit" : "surplus"}" title="Comido ${eaten} − repouso ${rest} − exercício ${burn.kcal}">⚖ ${fmtSigned(bal)} kcal</span>` : ""}</span>
            </div>
          </header>
          <div class="day-body">${dayBody(plan, date)}</div>
        </article>`;
    });
    $("#week-days").innerHTML = cards.join("");
    $("#week-stats").innerHTML = `
      <li><b>${done}/${planned}</b><span>dias cumpridos</span></li>
      <li><b>${stepsDays ? Math.round(stepsTotal / stepsDays).toLocaleString("pt-PT") : "–"}</b><span>média de passos</span></li>
      <li><b>${dates.filter((dt) => { const p = WEEK.find((w) => w.dow === dt.getDay()); return p.type === "workout" && slotSession(p.slot, isoDate(dt)); }).length}/2</b><span>treinos de força</span></li>
      <li><b>${dates.filter((dt) => (days[isoDate(dt)] || {}).hiitDone).length}/${MORNING.intervalDays.length}</b><span>3×3 de manhã</span></li>`;
    $("#week-burn").innerHTML = [
      burnWeek ? `Gasto estimado em exercício esta semana: ≈${burnWeek.toLocaleString("pt-PT")} kcal (média ≈${Math.round(burnWeek / 7)} por dia).` : "",
      balDays
        ? `<span class="bal-tag ${balWeek < 0 ? "deficit" : "surplus"}">⚖ Balanço: ${fmtSigned(balWeek)} kcal</span> em ${balDays} ${balDays === 1 ? "dia" : "dias"} com registo (média ${fmtSigned(Math.round(balWeek / balDays))} por dia, ${kgWeek((balWeek / balDays) * 7)}).`
        : restKcal(today()) ? "" : "Para veres o balanço de cada dia, regista o que comes e preenche os teus dados no separador Corpo.",
    ].filter(Boolean).join("<br>");
  }

  // ---------- calorias gastas (estimativa) ----------
  const kgFor = (date) => latestWeight(date) || latestWeight() || 0;
  const metKcal = (met, minutes, kg) => Math.round((met * kg * minutes) / 60);
  function workoutKcal(s, kg) {
    const def = WORKOUTS[s.workout];
    return metKcal(def.met || 3.5, Number(s.minutes) || def.minutes || 60, kg);
  }
  // Gasto estimado em exercício num dia: treinos registados, passos (ou a caminhada da manhã),
  // intervalos 3×3 e estabilização lombar.
  function burnOf(date) {
    const kg = kgFor(date) || BURN.defaultKg;
    const d = days[date] || {};
    const parts = sessions.filter((s) => s.date === date && WORKOUTS[s.workout]).map((s) => ({ label: WORKOUTS[s.workout].short, kcal: workoutKcal(s, kg) }));
    const steps = Number(d.steps) || (d.walkDone ? MORNING.steps : 0);
    if (steps) parts.push({ label: `${steps.toLocaleString("pt-PT")} passos`, kcal: Math.round(steps * BURN.kcalPerStepPerKg * kg) });
    if (d.hiitDone) parts.push({ label: "3×3", kcal: metKcal(BURN.intervals.met, BURN.intervals.minutes, kg) });
    if (d.coreDone) parts.push({ label: "estabilização", kcal: metKcal(BURN.core.met, BURN.core.minutes, kg) });
    if (d.flowDone && !parts.some((p) => p.label === WORKOUTS.W.short)) parts.push({ label: "Animal Flow", kcal: metKcal(BURN.flow.met, Number(d.flowMin) || BURN.flow.minutes, kg) });
    return { kcal: parts.reduce((t, p) => t + p.kcal, 0), parts, kgKnown: !!kgFor(date) };
  }
  // Gasto em repouso (Mifflin-St Jeor × 1,2); 0 se faltarem dados.
  function restKcal(date) {
    const kg = kgFor(date);
    const { height, age, sex } = profile;
    if (!kg || !height || !age || !sex) return 0;
    return Math.round((10 * kg + 6.25 * height - 5 * age + (sex === "m" ? 5 : -161)) * 1.2);
  }
  // Balanço semanal em kcal → "≈0,6 kg a menos por semana" (7700 kcal ≈ 1 kg).
  const kgWeek = (kcal) => `≈${fmt1(Math.abs(kcal) / 7700)} kg ${kcal < 0 ? "a menos" : "a mais"} por semana`;
  const fmtSigned = (n) => (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toLocaleString("pt-PT");
  const eatenOf = (date) => ((days[date] || {}).protein || []).reduce((t, it) => t + (Number(it.kcal) || 0), 0);

  function renderBalance(date) {
    const eaten = eatenOf(date);
    const burn = burnOf(date).kcal;
    const rest = restKcal(date);
    const bal = eaten - rest - burn;
    $("#balance-stats").innerHTML = `
      <li><b>${eaten ? eaten.toLocaleString("pt-PT") : "–"}</b><span>comido (kcal)</span></li>
      <li><b>${rest ? (rest + burn).toLocaleString("pt-PT") : "–"}</b><span>gasto: ${rest ? `${rest.toLocaleString("pt-PT")} repouso + ${burn} exercício` : `${burn} em exercício`}</span></li>
      <li class="${!rest || !eaten ? "" : bal < 0 ? "deficit" : "surplus"}"><b>${rest && eaten ? fmtSigned(bal) : "–"}</b><span>${!rest || !eaten ? "balanço" : bal < 0 ? "défice" : "excedente"}</span></li>`;
    const msg = $("#balance-msg");
    if (!rest) {
      msg.textContent = !kgFor(date) ? "Regista o teu peso em baixo e preenche os teus dados para calcular o balanço." : "Preenche a altura, a idade e o sexo em baixo para calcular o balanço.";
      $("#profile-box").open = true;
    } else if (!eaten) {
      msg.textContent = "Ainda não registaste o que comeste neste dia. O balanço só é fiável se registares tudo (refeições da ementa, atalhos e outros alimentos).";
    } else if (bal < -1000) {
      msg.innerHTML = `<strong>Défice muito grande.</strong> Mais de 1000 kcal por dia, com treino de força, aumenta o risco de perderes músculo. Se for um dia normal, come mais um pouco (proteína e uma porção de hidratos).`;
    } else if (bal < 0) {
      msg.textContent = `Se todos os dias fossem assim, perderias ≈${fmt1((-bal * 7) / 7700)} kg por semana (7700 kcal ≈ 1 kg de gordura).`;
    } else {
      msg.textContent = "Comeste mais do que gastaste neste dia. Um dia assim não estraga nada; conta a média da semana.";
    }

    // média dos últimos 7 dias com refeições registadas, e o que diz a balança
    const end = new Date(date + "T12:00:00");
    const logged = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      return isoDate(d);
    }).filter((d) => eatenOf(d) && restKcal(d));
    const rate = weeklyRate();
    if (logged.length >= 2) {
      const avg = Math.round(logged.reduce((t, d) => t + eatenOf(d) - restKcal(d) - burnOf(d).kcal, 0) / logged.length);
      $("#balance-week").innerHTML = `<strong>Últimos 7 dias</strong> (${logged.length} com registo): balanço médio <b>${fmtSigned(avg)} kcal/dia</b>, o que dá ${kgWeek(avg * 7)}.${
        rate !== null ? ` A balança diz ${rate > 0 ? "+" : ""}${fmt1(rate)} kg por semana${Math.abs(rate - (avg * 7) / 7700) > 0.4 ? ": a diferença é normal, mas se se mantiver ajusta as porções registadas ou os teus dados." : "."}` : ""
      }`;
    } else $("#balance-week").innerHTML = "";
    if (document.activeElement !== $("#profile-height")) $("#profile-height").value = profile.height || "";
    if (document.activeElement !== $("#profile-age")) $("#profile-age").value = profile.age || "";
    $("#profile-sex").value = profile.sex || "";
  }

  function updateWorkoutKcal() {
    const def = WORKOUTS[currentWorkout];
    const date = $("#session-date").value || today();
    const minutes = Number($("#session-minutes").value) || def.minutes || 60;
    const kg = kgFor(date);
    $("#workout-kcal").innerHTML = `Gasto estimado: <b>≈${metKcal(def.met || 3.5, minutes, kg || BURN.defaultKg)} kcal</b> (${minutes} min, ${kg ? fmt1(kg) + " kg" : "80 kg por omissão: regista o peso no separador Corpo"}).`;
  }

  async function saveDayField(date, field, value) {
    const d = { ...(days[date] || {}), date, [field]: value };
    days[date] = d;
    try {
      await persistDay(d);
    } catch {}
  }

  // ---------- corpo: proteína, peso e cintura ----------
  let proteinFactor = 1.8;
  try { proteinFactor = Number(localStorage.getItem("gym.proteinFactor")) || 1.8; } catch {}

  const bodyDate = () => $("#body-date").value || today();
  const proteinOf = (date) => ((days[date] || {}).protein || []).reduce((t, i) => t + (Number(i.g) || 0), 0);

  function weightEntries() {
    return Object.values(days)
      .filter((d) => Number(d.weight) > 0 || Number(d.waist) > 0)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  // Peso mais recente até à data (inclusive).
  function latestWeight(upTo) {
    const w = weightEntries().filter((d) => Number(d.weight) > 0 && (!upTo || d.date <= upTo));
    return w.length ? Number(w[w.length - 1].weight) : 0;
  }

  const proteinGoal = (date) => {
    const w = latestWeight(date) || latestWeight();
    return w ? Math.round((w * proteinFactor) / 5) * 5 : 0;
  };

  // Ritmo semanal (kg/semana) por regressão linear nas pesagens dos últimos 28 dias.
  function weeklyRate() {
    const w = weightEntries().filter((d) => Number(d.weight) > 0);
    if (w.length < 3) return null;
    const lastT = new Date(w[w.length - 1].date + "T12:00:00").getTime();
    const pts = w
      .map((d) => ({ x: (new Date(d.date + "T12:00:00").getTime() - lastT) / 864e5, y: Number(d.weight) }))
      .filter((p) => p.x >= -28);
    if (pts.length < 3 || -pts[0].x < 7) return null;
    const mx = pts.reduce((t, p) => t + p.x, 0) / pts.length;
    const my = pts.reduce((t, p) => t + p.y, 0) / pts.length;
    const num = pts.reduce((t, p) => t + (p.x - mx) * (p.y - my), 0);
    const den = pts.reduce((t, p) => t + (p.x - mx) ** 2, 0);
    return den ? (num / den) * 7 : null;
  }

  const fmt1 = (n) => n.toLocaleString("pt-PT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function renderBody() {
    const dateInput = $("#body-date");
    if (!dateInput.value) dateInput.value = today();
    const date = bodyDate();

    // proteína
    const sel = $("#protein-factor");
    if (!sel.options.length) {
      sel.innerHTML = PROTEIN_FACTORS.map((f) => `<option value="${f}">${fmt1(f)} g por kg</option>`).join("");
    }
    sel.value = String(proteinFactor);
    const goal = proteinGoal(date);
    const total = proteinOf(date);
    $("#protein-total").textContent = total;
    $("#protein-goal-label").textContent = goal ? `/ ${goal} g` : "g";
    const pct = goal ? Math.min(100, Math.round((total / goal) * 100)) : 0;
    $("#protein-bar").style.width = pct + "%";
    $("#protein-bar").classList.toggle("ok", goal > 0 && total >= goal);
    $("#protein-msg").textContent = !goal
      ? "Regista o teu peso em baixo para calcular o objetivo de proteína."
      : total >= goal
      ? "Objetivo cumprido."
      : `Faltam ${goal - total} g (${fmt1(proteinFactor)} g × ${fmt1(latestWeight(date) || latestWeight())} kg).`;
    $("#food-grid").hidden = editingFoods;
    $("#foods-editor").hidden = !editingFoods;
    $("#foods-edit").textContent = editingFoods ? "Concluído" : "Editar atalhos";
    if (editingFoods) {
      if (!$("#foods-editor").contains(document.activeElement)) renderFoodsEditor();
    } else {
      $("#food-grid").innerHTML = foods.length
        ? foods.map((f, i) => `<button class="food-btn" data-food="${i}"><span>${escapeHtml(f.name)}</span><b>+${f.g} g</b><small>${f.kcal || 0} kcal</small></button>`).join("")
        : `<p class="muted small">Sem atalhos. Carrega em "Editar atalhos" para criar.</p>`;
    }
    const items = (days[date] || {}).protein || [];

    // refeições da ementa para este dia da semana
    const plan = MEAL_PLAN.find((d) => d.day === DOW_NAMES[new Date(date + "T12:00:00").getDay()]);
    if (plan) {
      const eaten = plan.meals.filter((m, i) => items.some((it) => it.meal === `${plan.day}:${i}`));
      const kcalPlan = plan.meals.reduce((t, m) => t + m.kcal, 0);
      const kcalDay = items.reduce((t, it) => t + (Number(it.kcal) || 0), 0);
      $("#body-meals").innerHTML = `
        <div class="food-head"><span>Ementa de ${escapeHtml(plan.day.toLowerCase())}</span><span class="muted small">${eaten.length}/${plan.meals.length} refeições · ≈${kcalDay} / ${kcalPlan} kcal</span></div>
        <div class="body-meal-list">${plan.meals
          .map((m, i) => {
            const on = items.some((it) => it.meal === `${plan.day}:${i}`);
            return `<button class="body-meal ${on ? "on" : ""}" data-meal="${plan.day}:${i}" aria-pressed="${on}">
              <span class="body-meal-text"><small>${escapeHtml(m.meal)}</small>${escapeHtml(m.food)}</span>
              <span class="body-meal-num"><b>${on ? "✓" : "+"}${m.p} g</b><small>${m.kcal} kcal</small></span>
            </button>`;
          })
          .join("")}</div>
        <p class="muted small">Toca numa refeição quando a comeres: a proteína entra no total do dia. Toca outra vez para tirar. Se comeres outra coisa, usa os atalhos em baixo.</p>`;
    } else $("#body-meals").innerHTML = "";
    const kcalLogged = items.reduce((t, it) => t + (Number(it.kcal) || 0), 0);
    const kcalTarget = plan ? plan.meals.reduce((t, m) => t + m.kcal, 0) : 1600;
    renderBalance(date);
    const burn = burnOf(date);
    $("#kcal-msg").innerHTML = `<b>≈${kcalLogged} kcal</b> registadas · objetivo ≈${kcalTarget} kcal${kcalLogged > kcalTarget ? ` <span class="danger-text">(+${kcalLogged - kcalTarget})</span>` : kcalLogged ? ` · faltam ≈${kcalTarget - kcalLogged}` : ""}
      ${burn.kcal ? `<br><span class="burn-tag">🔥 ≈${burn.kcal} kcal gastas em exercício</span> <span class="muted small">(${escapeHtml(burn.parts.map((p) => `${p.label} ${p.kcal}`).join(" · "))}). As ~1600 kcal já contam com o exercício normal da semana, por isso não é para comer estas calorias de volta.</span>` : ""}`;

    $("#food-log").innerHTML = items.length
      ? items
          .map(
            (it, i) => `<li><span>${escapeHtml(it.name)}</span><label class="log-g"><input type="number" inputmode="numeric" min="0" step="1" id="log-g-${i}" data-food-edit="${i}" data-food-field="g" value="${it.g}" aria-label="Proteína de ${escapeHtml(it.name)}"> g</label><label class="log-g"><input type="number" inputmode="numeric" min="0" step="1" id="log-kcal-${i}" data-food-edit="${i}" data-food-field="kcal" value="${Number(it.kcal) || 0}" aria-label="Calorias de ${escapeHtml(it.name)}"> kcal</label><button class="link" data-food-del="${i}" aria-label="Remover ${escapeHtml(it.name)}">✕</button></li>`
          )
          .join("")
      : `<li class="empty">Ainda nada registado neste dia. Toca num alimento para somar.</li>`;

    // últimos 7 dias
    const end = new Date(date + "T12:00:00");
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - 6 + i);
      return isoDate(d);
    });
    const max = Math.max(goal, ...last7.map(proteinOf), 1) * 1.12;
    $("#protein-week").innerHTML = last7
      .map((d) => {
        const v = proteinOf(d);
        const g = proteinGoal(d);
        return `<div class="pw-day ${d === date ? "sel" : ""}">
          <span class="pw-val">${v || ""}</span>
          <div class="pw-bar"><span class="${g && v >= g ? "ok" : ""}" style="height:${Math.round((v / max) * 100)}%"></span>
            ${g ? `<i style="bottom:${Math.round((g / max) * 100)}%"></i>` : ""}</div>
          <span class="pw-lbl">${DOW_NAMES[new Date(d + "T12:00:00").getDay()].slice(0, 3)}</span>
        </div>`;
      })
      .join("");

    // peso e cintura
    const today_ = days[date] || {};
    if (document.activeElement !== $("#body-weight")) $("#body-weight").value = today_.weight || "";
    if (document.activeElement !== $("#body-waist")) $("#body-waist").value = today_.waist || "";
    const entries = weightEntries();
    const ws = entries.filter((d) => Number(d.weight) > 0);
    const waists = entries.filter((d) => Number(d.waist) > 0);
    const rate = weeklyRate();
    const cur = ws.length ? Number(ws[ws.length - 1].weight) : 0;
    const first = ws.length ? Number(ws[0].weight) : 0;
    const waistDiff = waists.length > 1 ? Number(waists[waists.length - 1].waist) - Number(waists[0].waist) : null;
    $("#body-stats").innerHTML = `
      <li><b>${cur ? fmt1(cur) : "–"}</b><span>peso atual (kg)</span></li>
      <li><b>${ws.length > 1 ? (cur - first > 0 ? "+" : "") + fmt1(cur - first) : "–"}</b><span>desde o início (kg)</span></li>
      <li><b>${waistDiff !== null ? (waistDiff > 0 ? "+" : "") + fmt1(waistDiff) : waists.length ? fmt1(Number(waists[0].waist)) : "–"}</b><span>${waistDiff !== null ? "cintura desde o início (cm)" : "cintura (cm)"}</span></li>`;

    const trend = $("#body-trend");
    trend.className = "callout";
    if (rate === null) {
      trend.textContent = "Com pelo menos 3 pesagens ao longo de uma semana ou mais, aparece aqui o teu ritmo semanal.";
    } else {
      const pctW = cur ? (-rate / cur) * 100 : 0;
      const r = `${rate > 0 ? "+" : ""}${fmt1(rate)} kg por semana`;
      if (pctW > 1) {
        trend.classList.add("danger");
        trend.innerHTML = `<strong>${r}.</strong> Estás a perder mais de 1% do peso por semana. Com treino de força, um ritmo tão rápido aumenta o risco de perderes músculo e força: considera comer um pouco mais e garante a proteína.`;
      } else if (pctW >= 0.25) {
        trend.classList.add("good");
        trend.innerHTML = `<strong>${r}.</strong> Bom ritmo (cerca de ${fmt1(pctW)}% do peso por semana). Se a força nos treinos se mantém ou sobe, estás a perder sobretudo gordura.`;
      } else if (rate <= 0.1) {
        trend.classList.add("warn");
        trend.innerHTML = `<strong>${r}.</strong> Peso praticamente estável. Se a cintura também não desce há 3–4 semanas, revê as calorias ou aumenta os passos.`;
      } else {
        trend.classList.add("warn");
        trend.innerHTML = `<strong>${r}.</strong> O peso está a subir. Se a cintura também sobe, revê o que estás a comer.`;
      }
    }

    $("#weight-chart").innerHTML = lineChart(ws.map((d) => ({ date: d.date, v: Number(d.weight) })), "kg");
    $("#body-table").innerHTML = entries.length
      ? `<table><thead><tr><th>Data</th><th>Peso</th><th>Cintura</th><th></th></tr></thead><tbody>${entries
          .slice()
          .reverse()
          .map(
            (d) => `<tr><td>${fmtDate(d.date)}</td><td>${Number(d.weight) > 0 ? fmt1(Number(d.weight)) + " kg" : "–"}</td><td>${
              Number(d.waist) > 0 ? fmt1(Number(d.waist)) + " cm" : "–"
            }</td><td><button class="link danger-text" data-body-del="${d.date}">Apagar</button></td></tr>`
          )
          .join("")}</tbody></table>`
      : "";
  }

  function renderFoodsEditor() {
    $("#foods-editor").innerHTML = `
      <p class="muted small">Muda o nome, os gramas de proteína ou as calorias de cada atalho. Os registos antigos não mudam.</p>
      ${foods
        .map(
          (f, i) => `
        <div class="food-edit-row">
          <input type="text" id="fe-name-${i}" data-fe="${i}" data-fe-field="name" value="${escapeHtml(f.name)}" aria-label="Nome do alimento">
          <label class="log-g"><input type="number" inputmode="numeric" min="0" step="1" id="fe-g-${i}" data-fe="${i}" data-fe-field="g" value="${f.g}" aria-label="Gramas de proteína"> g</label>
          <label class="log-g"><input type="number" inputmode="numeric" min="0" step="1" id="fe-kcal-${i}" data-fe="${i}" data-fe-field="kcal" value="${f.kcal || 0}" aria-label="Calorias"> kcal</label>
          <button class="link danger-text" data-fe-del="${i}" aria-label="Apagar ${escapeHtml(f.name)}">✕</button>
        </div>`
        )
        .join("")}
      <div class="foods-editor-actions">
        <button class="pill-btn" id="fe-add">+ Novo atalho</button>
        <button class="link" id="fe-reset">Repor valores originais</button>
      </div>`;
  }

  function lineChart(points, unit) {
    if (!points.length) return `<p class="empty">Ainda sem pesagens. Regista a primeira em cima.</p>`;
    const W = 640, H = 240, P = { l: 44, r: 16, t: 20, b: 36 };
    const vs = points.map((p) => p.v);
    let min = Math.min(...vs), max = Math.max(...vs);
    if (max - min < 2) { min -= 1; max += 1; }
    const pad = (max - min) * 0.15;
    min -= pad; max += pad;
    const t0 = new Date(points[0].date + "T12:00:00").getTime();
    const t1 = new Date(points[points.length - 1].date + "T12:00:00").getTime();
    const x = (d) => (t1 === t0 ? (P.l + W - P.r) / 2 : P.l + ((new Date(d + "T12:00:00").getTime() - t0) / (t1 - t0)) * (W - P.l - P.r));
    const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
    const grid = Array.from({ length: 5 }, (_, i) => {
      const v = min + ((max - min) * i) / 4;
      return `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${P.l - 6}" y="${y(v) + 4}" class="axis" text-anchor="end">${fmt1(v)}</text>`;
    }).join("");
    const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const step = Math.ceil(points.length / 7);
    const dots = points
      .map(
        (p, i) => `<circle cx="${x(p.date)}" cy="${y(p.v)}" r="4.5" class="dot"><title>${fmtDate(p.date)}: ${fmt1(p.v)} ${unit}</title></circle>
        ${i % step === 0 || i === points.length - 1 ? `<text x="${x(p.date)}" y="${H - 12}" class="axis" text-anchor="middle">${p.date.slice(5).split("-").reverse().join("/")}</text>` : ""}`
      )
      .join("");
    const lastP = points[points.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do peso">
      ${grid}<text x="8" y="14" class="axis">${unit}</text>
      <path d="${path}" class="line"/>${dots}
      <text x="${Math.min(x(lastP.date), W - P.r - 20)}" y="${y(lastP.v) - 10}" class="label" text-anchor="middle">${fmt1(lastP.v)}</text></svg>`;
  }

  // ---------- compras ----------
  let shopHide = false;
  try { shopHide = localStorage.getItem("gym.shopHide") === "1"; } catch {}
  function renderShop() {
    const sel = $("#shop-cat");
    if (!sel.options.length) sel.innerHTML = SHOP_CATEGORIES.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
    if (!sel.value) sel.value = "other";
    $("#shop-hide").checked = shopHide;
    const done = shop.filter((it) => it.done).length;
    $("#shop-done").textContent = done;
    $("#shop-total").textContent = `/ ${shop.length} no carrinho`;
    $("#shop-bar").style.width = (shop.length ? Math.round((done / shop.length) * 100) : 0) + "%";
    $("#shop-bar").classList.toggle("ok", shop.length > 0 && done === shop.length);
    const cost = (list) => list.reduce((t, it) => t + (Number(it.price) || 0), 0);
    const total = cost(shop);
    const left = cost(shop.filter((it) => !it.done));
    $("#shop-cost").innerHTML = `
      <li><b>${fmtEur(total)}</b><span>estimativa da semana</span></li>
      <li><b>${fmtEur(left)}</b><span>falta comprar</span></li>
      <li><b>${fmtEur(total - left)}</b><span>já no carrinho</span></li>`;
    const cats = [...SHOP_CATEGORIES, ...[...new Set(shop.map((it) => it.cat))].filter((c) => !SHOP_CATEGORIES.some((x) => x.id === c)).map((id) => ({ id, name: id }))];
    const groups = cats
      .map((c) => {
        const all = shop.filter((it) => (it.cat || "other") === c.id);
        const items = shopHide ? all.filter((it) => !it.done) : all;
        if (!all.length) return "";
        const left = all.filter((it) => !it.done).length;
        return `<div class="shop-group">
          <div class="food-head"><span>${escapeHtml(c.name)}</span><span class="muted small">${left ? `faltam ${left}` : "tudo no carrinho"} · ${fmtEur(cost(all))}</span></div>
          ${items.length ? `<ul class="food-log">${items
            .map(
              (it) => `<li class="${it.done ? "done" : ""}">
              <label class="check"><input type="checkbox" data-shop-done="${it.id}" ${it.done ? "checked" : ""}> <span>${escapeHtml(it.name)}</span></label>
              <input type="text" class="shop-qty" data-shop-qty="${it.id}" value="${escapeHtml(it.qty || "")}" placeholder="qtd." aria-label="Quantidade de ${escapeHtml(it.name)}">
              <label class="shop-price">€<input type="number" inputmode="decimal" min="0" step="0.01" data-shop-price="${it.id}" value="${Number(it.price) ? Number(it.price).toFixed(2) : ""}" placeholder="–" aria-label="Preço de ${escapeHtml(it.name)}"></label>
              <button class="link" data-shop-del="${it.id}" aria-label="Remover ${escapeHtml(it.name)}">✕</button></li>`
            )
            .join("")}</ul>` : ""}
        </div>`;
      })
      .join("");
    $("#shop-list").innerHTML = groups || `<p class="empty muted">A lista está vazia. Acrescenta alimentos em cima ou repõe a lista sugerida.</p>`;
  }
  const fmtEur = (n) => n.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

  // ---------- ementa ----------
  function renderMeals() {
    const todayName = DOW_NAMES[new Date().getDay()];
    $("#meal-days").innerHTML = MEAL_PLAN.map((d) => {
      const kcal = d.meals.reduce((t, m) => t + m.kcal, 0);
      const p = d.meals.reduce((t, m) => t + m.p, 0);
      const isToday = d.day === todayName;
      return `<details class="meal-day ${isToday ? "today" : ""}" ${isToday ? "open" : ""}>
        <summary><span class="meal-day-name">${escapeHtml(d.day)}${isToday ? " <em>Hoje</em>" : ""}</span><span class="muted small">≈${kcal} kcal · ≈${p} g proteína</span></summary>
        <ul class="meal-list">${d.meals
          .map((m) => `<li><span class="meal-name">${escapeHtml(m.meal)}</span><span class="meal-food">${escapeHtml(m.food)}</span><span class="meal-num">${m.kcal} kcal · ${m.p} g</span></li>`)
          .join("")}</ul>
        <p class="meal-kid"><strong>Filho:</strong> ${escapeHtml(d.kid)}</p>
      </details>`;
    }).join("");
  }
  function shopItem(id) {
    return shop.find((it) => it.id === id);
  }
  function saveShop() {
    persistShop().catch(() => {});
    renderShop();
  }

  async function updateDay(date, patch) {
    const d = { ...(days[date] || {}), date, ...patch };
    days[date] = d;
    try {
      await persistDay(d);
    } catch {}
    renderBody();
  }

  // ---------- navegação ----------
  let currentTab = "week";
  function renderModeSwitches() {
    $$(".mode-switch").forEach((el) => {
      el.innerHTML = Object.entries(PROGRAMS)
        .map(
          ([k, p]) => `<button role="radio" aria-checked="${k === mode}" class="${k === mode ? "on" : ""}" data-mode="${k}">${escapeHtml(p.label)}</button>`
        )
        .join("");
    });
    $$('.tabs button[data-tab="A"], .tabs button[data-tab="B"]').forEach((b) => {
      b.textContent = WORKOUTS[slotWorkout(b.dataset.tab === "A" ? 0 : 1)].short;
    });
  }

  async function setMode(m, save = true) {
    if (!PROGRAMS[m] || m === mode) return;
    mode = m;
    try { localStorage.setItem("gym.mode", m); } catch {}
    if (save && remote) remote.col.doc("settings").set({ kind: "settings", mode: m }).catch(() => {});
    renderModeSwitches();
    if (currentTab === "A" || currentTab === "B") showTab(currentTab);
    else refresh();
  }

  function showTab(tab, workoutKey) {
    currentTab = tab;
    $$(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    const isWorkout = tab === "A" || tab === "B" || tab === "W";
    $("#tab-workout").hidden = !isWorkout;
    $("#tab-progress").hidden = tab !== "progress";
    $("#tab-info").hidden = tab !== "info";
    $("#tab-week").hidden = tab !== "week";
    $("#tab-body").hidden = tab !== "body";
    $("#tab-shop").hidden = tab !== "shop";
    $("#tab-meals").hidden = tab !== "meals";
    if (tab === "week") renderWeek();
    if (tab === "meals") renderMeals();
    if (tab === "shop") renderShop();
    if (tab === "body") renderBody();
    const active = $(`.tabs button[data-tab="${tab}"]`);
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest", inline: "nearest" });
    if (isWorkout) {
      currentWorkout = workoutKey || (tab === "W" ? "W" : slotWorkout(tab === "A" ? 0 : 1));
      $("#tab-workout").dataset.workout = tab;
      $("#tab-workout > .mode-row").hidden = tab === "W";
      $("#save-status").textContent = sessionFor(currentWorkout, $("#session-date").value || today()) ? "A editar o registo desta data." : "";
      renderWorkout();
    } else if (tab === "progress") {
      renderProgress();
    }
    try { localStorage.setItem("gym.tab", tab); } catch {}
  }

  // Volta a desenhar depois de chegarem dados novos, sem apagar o que está a ser escrito.
  function refresh() {
    if (currentTab === "progress") renderProgress();
    else if (currentTab === "week" && !$("#tab-week").contains(document.activeElement)) renderWeek();
    else if (currentTab === "body") renderBody();
    else if (currentTab === "shop" && !$("#tab-shop").contains(document.activeElement)) renderShop();
    else if ((currentTab === "A" || currentTab === "B" || currentTab === "W") && !dirty) renderWorkout();
  }

  // ---------- eventos ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (b) setMode(b.dataset.mode);
  });
  $("#body-date").addEventListener("change", renderBody);
  $("#protein-factor").addEventListener("change", (e) => {
    proteinFactor = Number(e.target.value) || 1.8;
    try { localStorage.setItem("gym.proteinFactor", String(proteinFactor)); } catch {}
    renderBody();
  });
  let editingFoods = false;
  $("#foods-edit").addEventListener("click", () => {
    editingFoods = !editingFoods;
    if (editingFoods) renderFoodsEditor();
    renderBody();
  });
  $("#foods-editor").addEventListener("change", (e) => {
    const inp = e.target.closest("[data-fe]");
    if (!inp) return;
    const i = Number(inp.dataset.fe);
    if (inp.dataset.feField === "name") foods[i].name = inp.value.trim() || foods[i].name;
    else foods[i][inp.dataset.feField] = Math.max(0, Math.round(Number(inp.value) || 0));
    persistFoods().catch(() => {});
  });
  $("#foods-editor").addEventListener("click", (e) => {
    const del = e.target.closest("[data-fe-del]");
    if (del) {
      foods.splice(Number(del.dataset.feDel), 1);
      persistFoods().catch(() => {});
      renderFoodsEditor();
    }
    if (e.target.closest("#fe-add")) {
      foods.push({ name: "Novo alimento", g: 10, kcal: 100 });
      persistFoods().catch(() => {});
      renderFoodsEditor();
      const n = $(`#fe-name-${foods.length - 1}`);
      n.focus();
      n.select();
    }
    const reset = e.target.closest("#fe-reset");
    if (reset) {
      if (!reset.dataset.armed) {
        reset.dataset.armed = "1";
        reset.textContent = "Confirmar: repor todos os atalhos";
        return;
      }
      foods = PROTEIN_FOODS.map((f) => ({ ...f }));
      persistFoods().catch(() => {});
      renderFoodsEditor();
    }
  });
  $("#food-log").addEventListener("change", (e) => {
    const inp = e.target.closest("[data-food-edit]");
    if (!inp) return;
    const date = bodyDate();
    const list = [...((days[date] || {}).protein || [])];
    const i = Number(inp.dataset.foodEdit);
    if (!list[i]) return;
    const v = Math.max(0, Math.round(Number(inp.value) || 0));
    if (inp.dataset.foodField === "kcal") list[i] = { ...list[i], kcal: v };
    else {
      // mais ou menos proteína = porção maior ou menor: as calorias acompanham
      const kcal = list[i].g ? Math.round(((Number(list[i].kcal) || 0) * v) / list[i].g) : Number(list[i].kcal) || 0;
      list[i] = { ...list[i], g: v, kcal };
    }
    inp.blur();
    updateDay(date, { protein: list });
  });
  $("#profile-box").addEventListener("change", (e) => {
    const f = { "profile-height": "height", "profile-age": "age", "profile-sex": "sex" }[e.target.id];
    if (!f) return;
    profile = { ...profile, [f]: f === "sex" ? e.target.value : Math.round(Number(e.target.value)) || 0 };
    persistProfile().catch(() => {});
    e.target.blur();
    renderBody();
  });
  $("#body-meals").addEventListener("click", (e) => {
    const b = e.target.closest("[data-meal]");
    if (!b) return;
    const [day, i] = b.dataset.meal.split(":");
    const m = MEAL_PLAN.find((d) => d.day === day).meals[Number(i)];
    const date = bodyDate();
    const list = (days[date] || {}).protein || [];
    const on = list.some((it) => it.meal === b.dataset.meal);
    updateDay(date, {
      protein: on ? list.filter((it) => it.meal !== b.dataset.meal) : [...list, { name: `${m.meal} (ementa)`, g: m.p, kcal: m.kcal, meal: b.dataset.meal }],
    });
  });
  $("#food-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-food]");
    if (!b) return;
    const f = foods[Number(b.dataset.food)];
    const date = bodyDate();
    updateDay(date, { protein: [...((days[date] || {}).protein || []), { name: f.name, g: f.g, kcal: f.kcal || 0 }] });
  });
  $("#food-add").addEventListener("click", () => {
    const g = Math.round(Number($("#food-g").value));
    if (!g || g < 1) {
      $("#food-g").focus();
      return;
    }
    const name = $("#food-name").value.trim() || "Outro";
    const kcal = Math.max(0, Math.round(Number($("#food-kcal").value) || 0));
    const date = bodyDate();
    $("#food-g").value = "";
    $("#food-kcal").value = "";
    $("#food-name").value = "";
    updateDay(date, { protein: [...((days[date] || {}).protein || []), { name, g, kcal }] });
  });
  $("#food-log").addEventListener("click", (e) => {
    const b = e.target.closest("[data-food-del]");
    if (!b) return;
    const date = bodyDate();
    const list = [...((days[date] || {}).protein || [])];
    list.splice(Number(b.dataset.foodDel), 1);
    updateDay(date, { protein: list });
  });
  $("#body-save").addEventListener("click", async () => {
    const w = Number($("#body-weight").value);
    const c = Number($("#body-waist").value);
    const status = $("#body-status");
    if (!(w > 0) && !(c > 0)) {
      status.textContent = "Escreve o peso, a cintura ou os dois.";
      return;
    }
    const date = bodyDate();
    $("#body-weight").blur();
    $("#body-waist").blur();
    await updateDay(date, { weight: w > 0 ? w : 0, waist: c > 0 ? c : 0 });
    status.textContent = `Guardado (${fmtDate(date)}).`;
  });
  $("#body-table").addEventListener("click", (e) => {
    const b = e.target.closest("[data-body-del]");
    if (!b) return;
    if (!b.dataset.armed) {
      b.dataset.armed = "1";
      b.textContent = "Confirmar";
      setTimeout(() => {
        if (b.isConnected) {
          delete b.dataset.armed;
          b.textContent = "Apagar";
        }
      }, 4000);
      return;
    }
    updateDay(b.dataset.bodyDel, { weight: 0, waist: 0 });
  });

  function addShopItem() {
    const name = $("#shop-name").value.trim();
    if (!name) {
      $("#shop-name").focus();
      return;
    }
    const price = Math.max(0, Math.round((Number($("#shop-price").value) || 0) * 100) / 100);
    shop.push({ id: "u" + Date.now().toString(36), cat: $("#shop-cat").value || "other", name, qty: $("#shop-qty").value.trim(), price, done: false });
    $("#shop-name").value = "";
    $("#shop-qty").value = "";
    $("#shop-price").value = "";
    $("#shop-status").textContent = `"${name}" adicionado.`;
    saveShop();
    $("#shop-name").focus();
  }
  $("#shop-add").addEventListener("click", addShopItem);
  ["#shop-name", "#shop-qty", "#shop-price"].forEach((s) =>
    $(s).addEventListener("keydown", (e) => {
      if (e.key === "Enter") addShopItem();
    })
  );
  $("#shop-list").addEventListener("change", (e) => {
    const cb = e.target.closest("[data-shop-done]");
    const q = e.target.closest("[data-shop-qty]");
    const pr = e.target.closest("[data-shop-price]");
    const it = shopItem(cb ? cb.dataset.shopDone : q ? q.dataset.shopQty : pr ? pr.dataset.shopPrice : "");
    if (!it) return;
    if (cb) it.done = cb.checked;
    else if (q) {
      it.qty = q.value.trim();
      q.blur();
    } else {
      it.price = Math.max(0, Math.round((Number(pr.value) || 0) * 100) / 100);
      pr.blur();
    }
    saveShop();
  });
  $("#shop-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-shop-del]");
    if (!b) return;
    shop = shop.filter((it) => it.id !== b.dataset.shopDel);
    saveShop();
  });
  $("#shop-hide").addEventListener("change", (e) => {
    shopHide = e.target.checked;
    try { localStorage.setItem("gym.shopHide", shopHide ? "1" : "0"); } catch {}
    renderShop();
  });
  $("#shop-new").addEventListener("click", () => {
    shop.forEach((it) => (it.done = false));
    $("#shop-status").textContent = "Lista pronta para a próxima ida às compras.";
    saveShop();
  });
  $("#shop-copy").addEventListener("click", async () => {
    const text = SHOP_CATEGORIES.concat({ id: null })
      .map((c) => {
        const items = shop.filter((it) => !it.done && (c.id ? (it.cat || "other") === c.id : !SHOP_CATEGORIES.some((x) => x.id === it.cat)));
        return items.length ? `${c.name || "Outros"}\n${items.map((it) => `- ${it.name}${it.qty ? ` (${it.qty})` : ""}`).join("\n")}` : "";
      })
      .filter(Boolean)
      .join("\n\n") + `\n\nEstimativa: ${fmtEur(shop.filter((it) => !it.done).reduce((t, it) => t + (Number(it.price) || 0), 0))}`;
    const status = $("#shop-status");
    if (!text) {
      status.textContent = "Já está tudo no carrinho.";
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Lista copiada. Cola-a numa mensagem ou nas notas do telemóvel.";
    } catch {
      status.textContent = "Não foi possível copiar nesta vista.";
    }
  });
  $("#shop-reset").addEventListener("click", (e) => {
    const b = e.target;
    if (!b.dataset.armed) {
      b.dataset.armed = "1";
      b.textContent = "Confirmar: apagar alterações e repor";
      setTimeout(() => {
        if (b.isConnected) {
          delete b.dataset.armed;
          b.textContent = "Repor lista sugerida";
        }
      }, 4000);
      return;
    }
    delete b.dataset.armed;
    b.textContent = "Repor lista sugerida";
    shop = defaultShop();
    $("#shop-status").textContent = "Lista sugerida reposta.";
    saveShop();
  });

  $("#week-prev").addEventListener("click", () => { weekOffset--; renderWeek(); });
  $("#week-next").addEventListener("click", () => { weekOffset++; renderWeek(); });
  $("#week-today").addEventListener("click", () => { weekOffset = 0; renderWeek(); });
  $("#week-days").addEventListener("click", (e) => {
    const b = e.target.closest("[data-open-workout]");
    if (!b) return;
    $("#session-date").value = b.dataset.date;
    showTab(b.dataset.openWorkout);
    window.scrollTo({ top: 0 });
  });
  $("#week-days").addEventListener("change", async (e) => {
    const inp = e.target.closest("[data-day]");
    if (!inp) return;
    const { day, field } = inp.dataset;
    const value = inp.type === "checkbox" ? inp.checked : inp.type === "number" ? Number(inp.value) || 0 : inp.value.trim();
    await saveDayField(day, field, value);
    inp.blur();
    renderWeek();
  });

  $(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tab]");
    if (b) showTab(b.dataset.tab);
  });
  $("#session-date").addEventListener("change", () => {
    $("#save-status").textContent = sessionFor(currentWorkout, $("#session-date").value) ? "A editar o registo desta data." : "";
    renderWorkout();
  });
  $("#save-session").addEventListener("click", saveSession);
  $("#session-notes").addEventListener("input", () => (dirty = true));
  $("#session-minutes").addEventListener("input", () => {
    dirty = true;
    updateWorkoutKcal();
  });
  $("#progress-exercise").addEventListener("change", renderProgress);
  $("#progress-variant").addEventListener("change", renderProgress);

  $("#exercise-list").addEventListener("input", (e) => {
    const inp = e.target;
    if (!inp.dataset.field) return;
    dirty = true;
    if (inp.dataset.field === "kg" && inp.dataset.set === "0") {
      const ex = allExercises.find((x) => x.id === inp.dataset.ex);
      updateWarmup(ex);
      // Back-off: sugere −10% do top set
      if (ex.compound) {
        const bo = $(`input[data-ex="${ex.id}"][data-set="1"][data-field="kg"]`);
        if (bo && !bo.value && inp.value) bo.placeholder = roundTo(Number(inp.value) * 0.9);
      }
    }
  });

  async function setMedia(exId, value) {
    if (value) media[exId] = value;
    else delete media[exId];
    try {
      await persistMedia();
    } catch {
      const msg = $(`[data-msg="${exId}"]`);
      if (msg) msg.textContent = "Não foi possível guardar. Tenta outra vez.";
      return;
    }
    if (!dirty) renderWorkout();
  }

  $("#exercise-list").addEventListener("click", (e) => {
    const rest = e.target.closest("[data-rest]");
    if (rest) startTimer(Number(rest.dataset.rest), rest.dataset.name);

    const pb = e.target.closest("[data-planb]");
    if (pb) {
      const list = $(`[data-planb-list="${pb.dataset.planb}"]`);
      list.hidden = !list.hidden;
      pb.setAttribute("aria-expanded", String(!list.hidden));
    }
    const sw = e.target.closest("[data-swap]");
    if (sw) swapVariant(sw.dataset.swapEx, sw.dataset.swap);

    const sv = e.target.closest(".set-video");
    if (sv) {
      const panel = $(`[data-panel="${sv.dataset.ex}"]`);
      panel.hidden = !panel.hidden;
      sv.setAttribute("aria-expanded", String(!panel.hidden));
    }

    const saveLink = e.target.closest("[data-save-link]");
    if (saveLink) {
      const id = saveLink.dataset.saveLink;
      const url = $(`#link-${id}`).value.trim();
      const msg = $(`[data-msg="${id}"]`);
      if (!safeUrl(url)) {
        msg.textContent = "O link tem de começar por https://";
        return;
      }
      setMedia(id, { link: url });
    }

    const clear = e.target.closest("[data-clear-media]");
    if (clear) setMedia(clear.dataset.clearMedia, null);
  });

  $("#exercise-list").addEventListener("change", async (e) => {
    const inp = e.target.closest("[data-upload]");
    if (!inp || !inp.files[0]) return;
    const id = inp.dataset.upload;
    const file = inp.files[0];
    const msg = $(`[data-msg="${id}"]`);
    if (assets) {
      msg.textContent = "A carregar…";
      try {
        const res = await assets.upload(file);
        setMedia(id, { asset: res.id, type: res.contentType });
      } catch (err) {
        msg.textContent =
          err && err.code === "too_large"
            ? "Ficheiro demasiado grande (máx. 20 MB)."
            : err && err.code === "unsupported_type"
            ? "Formato não suportado. Usa JPG, PNG, GIF, WebP, MP4 ou WebM."
            : "Não foi possível carregar. Tenta outra vez.";
      }
    } else {
      // Fora do claude.ai: guarda a imagem no browser como data URL (só imagens pequenas).
      if (!file.type.startsWith("image/") || file.size > 1.5e6) {
        msg.textContent = "Aqui só dá para guardar imagens até 1,5 MB.";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setMedia(id, { link: reader.result });
      reader.readAsDataURL(file);
    }
  });

  $("#timer-stop").addEventListener("click", () => {
    clearInterval(timerInt);
    $("#timer").hidden = true;
  });

  $("#session-history").addEventListener("click", async (e) => {
    const del = e.target.closest("[data-delete]");
    const open = e.target.closest("[data-open]");
    if (del) {
      // Confirmação em dois cliques (sem janelas do browser).
      if (!del.dataset.armed) {
        del.dataset.armed = "1";
        del.textContent = "Confirmar apagar";
        setTimeout(() => {
          if (del.isConnected) {
            delete del.dataset.armed;
            del.textContent = "Apagar";
          }
        }, 4000);
        return;
      }
      sessions = sessions.filter((s) => s.id !== del.dataset.delete);
      try {
        await removeSession(del.dataset.delete);
      } catch {}
      renderProgress();
    }
    if (open) {
      const s = sessions.find((x) => x.id === open.dataset.open);
      $("#session-date").value = s.date;
      const m = Object.keys(PROGRAMS).find((k) => PROGRAMS[k].workouts.includes(s.workout));
      if (!m) showTab("W", s.workout);
      else showTab(PROGRAMS[m].workouts.indexOf(s.workout) ? "B" : "A", s.workout);
    }
  });

  let downloads = null;
  $("#export-btn").addEventListener("click", async () => {
    const data = JSON.stringify({ sessions, videos: media, days, foods, shop, profile }, null, 2);
    const filename = `treino-backup-${today()}.json`;
    const status = $("#backup-status");
    if (downloads) {
      try {
        await downloads.save({ filename, data });
        status.textContent = "Cópia exportada.";
      } catch {
        status.textContent = "Exportação cancelada.";
      }
      return;
    }
    if (inViewer) {
      try {
        await navigator.clipboard.writeText(data);
        status.textContent = "Dados copiados para a área de transferência.";
      } catch {
        status.textContent = "Não foi possível exportar nesta vista.";
      }
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("#import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const status = $("#backup-status");
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.sessions)) throw new Error();
      // Junta aos treinos existentes (o do ficheiro ganha se for a mesma data e treino).
      let n = 0;
      for (const raw of data.sessions) {
        if (!raw || !WORKOUTS[raw.workout] || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date) || typeof raw.entries !== "object") continue;
        const s = { id: sessionId(raw.workout, raw.date), workout: raw.workout, date: raw.date, entries: raw.entries, variants: raw.variants && typeof raw.variants === "object" ? raw.variants : {}, notes: String(raw.notes || ""), minutes: Number(raw.minutes) || 0, savedAt: Number(raw.savedAt) || Date.now() };
        sessions = sessions.filter((x) => !(x.workout === s.workout && x.date === s.date));
        sessions.push(s);
        if (remote) await persistSession(s);
        n++;
      }
      if (!remote) saveLocal(STORE_SESSIONS, sessions);
      if (data.days && typeof data.days === "object") {
        for (const [date, d] of Object.entries(data.days)) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !d || typeof d !== "object") continue;
          days[date] = { ...d, date };
          if (remote) await persistDay(days[date]);
        }
        if (!remote) saveLocal(STORE_DAYS, days);
      }
      if (Array.isArray(data.foods)) {
        foods = data.foods
          .filter((f) => f && typeof f.name === "string")
          .map((f) => ({ name: f.name, g: Math.max(0, Math.round(Number(f.g) || 0)), kcal: Math.max(0, Math.round(Number(f.kcal) || 0)) }));
        await persistFoods();
      }
      if (data.profile && typeof data.profile === "object") {
        profile = { height: Number(data.profile.height) || 0, age: Number(data.profile.age) || 0, sex: data.profile.sex === "f" ? "f" : data.profile.sex === "m" ? "m" : "" };
        await persistProfile();
      }
      if (Array.isArray(data.shop)) {
        shop = data.shop
          .filter((it) => it && typeof it.name === "string")
          .map((it, i) => ({ id: String(it.id || "i" + i), cat: String(it.cat || "other"), name: it.name, qty: String(it.qty || ""), price: Number(it.price) || 0, done: !!it.done }));
        await persistShop();
      }
      if (data.videos) {
        media = { ...media, ...normalizeMedia(data.videos) };
        await persistMedia();
      }
      status.textContent = `Importados ${n} treinos.`;
      renderProgress();
    } catch {
      status.textContent = "Ficheiro inválido. Escolhe um ficheiro exportado por este site.";
    }
    e.target.value = "";
  });

  // ---------- ligação à base de dados (claude.ai) ----------
  async function connectRemote() {
    const sync = $("#sync");
    if (!inViewer) {
      sync.textContent = "Os dados ficam guardados neste browser.";
      return;
    }
    sync.textContent = "A ligar…";
    let db = null, user = null;
    try {
      [db, user, assets, downloads] = await Promise.all(["db", "user", "assets", "downloads"].map((n) => window.claude.use(n)));
    } catch {}
    const uid = user && (await user.id().catch(() => null));
    if (!db || !uid) {
      sync.textContent = "Sem sessão iniciada: os dados ficam só neste browser.";
      refresh();
      return;
    }
    const col = db.collection("data/users/" + uid);
    let first = true;
    col.onSnapshot(
      (snap) => {
        const docs = snap.docs.map((d) => d.data());
        const remoteSessions = docs.filter((d) => d.kind === "session").map(({ kind, ...s }) => s);
        const m = docs.find((d) => d.kind === "media");
        const fd = docs.find((d) => d.kind === "foods");
        const pf = docs.find((d) => d.kind === "profile");
        const sd = docs.find((d) => d.kind === "shop");
        const st = docs.find((d) => d.kind === "settings");
        if (st && PROGRAMS[st.mode] && st.mode !== mode) setMode(st.mode, false);
        else if (!st && first && mode !== "gym") col.doc("settings").set({ kind: "settings", mode }).catch(() => {});
        const remoteDays = {};
        docs.filter((d) => d.kind === "day").forEach(({ kind, ...d }) => (remoteDays[d.date] = d));
        if (first) {
          first = false;
          remote = { col };
          // Primeira ligação: envia o que já estava guardado neste browser.
          const known = new Set(remoteSessions.map((s) => s.id));
          const pending = sessions.filter((s) => !known.has(s.id));
          if (pending.length) {
            (async () => {
              for (const s of pending) await persistSession(s).catch(() => {});
            })();
            remoteSessions.push(...pending);
          }
          const pendingDays = Object.values(days).filter((d) => !remoteDays[d.date]);
          if (pendingDays.length) {
            (async () => {
              for (const d of pendingDays) await persistDay(d).catch(() => {});
            })();
            pendingDays.forEach((d) => (remoteDays[d.date] = d));
          }
        }
        sessions = remoteSessions;
        days = remoteDays;
        if (m) media = normalizeMedia(m.items);
        if (pf) {
          const { kind, ...rest } = pf;
          profile = rest;
        }
        else if (profile.height || profile.age || profile.sex) persistProfile().catch(() => {});
        if (fd && Array.isArray(fd.items)) foods = withKcal(fd.items);
        else if (foodsCustomized) persistFoods().catch(() => {});
        if (sd && Array.isArray(sd.items)) {
          shop = migrateShop(sd.items, sd.v || 1);
          if ((sd.v || 1) < SHOP_VERSION) persistShop().catch(() => {});
        } else if (shopCustomized) persistShop().catch(() => {});
        sync.textContent = "Guardado na tua conta, sincroniza entre aparelhos.";
        sync.classList.add("ok");
        refresh();
      },
      () => {
        remote = null;
        sync.classList.remove("ok");
        sync.textContent = "Sem ligação à conta: os dados ficam só neste browser.";
      }
    );
  }

  renderModeSwitches();
  showTab("week");
  connectRemote();
})();
