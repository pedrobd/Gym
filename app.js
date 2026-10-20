(() => {
  const STORE_SESSIONS = "gym.sessions.v1";
  const STORE_VIDEOS = "gym.videos.v1";

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
  let remote = null; // { col } quando a base de dados está disponível
  let assets = null;
  let currentWorkout = "A";
  let dirty = false;

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

  // Último registo de um exercício antes de uma data (exclusive).
  function lastEntry(exId, beforeDate) {
    const list = sortedSessions().filter(
      (s) => s.entries[exId] && s.entries[exId].some((r) => r.reps) && (!beforeDate || s.date < beforeDate)
    );
    const s = list[list.length - 1];
    return s ? { date: s.date, sets: s.entries[exId] } : null;
  }

  // ---------- sugestão de progressão dupla ----------
  function suggestion(ex, last) {
    if (!last) return "Primeira vez: escolhe uma carga em que chegues ao fundo da faixa com boa técnica.";
    const top = last.sets[0];
    if (!top || !top.reps) return "";
    const range = ex.sets[0];
    const kg = Number(top.kg) || 0;
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
  function demoHtml(ex) {
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
    return `
      ${block}
      <div class="chips">
        <a target="_blank" rel="noopener" href="${search(ex.video)}">▶ Vídeos de demonstração</a>
        ${ex.alt ? `<a target="_blank" rel="noopener" href="${search(ex.alt + " technique")}">▶ Alternativa: ${escapeHtml(ex.alt)}</a>` : ""}
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

    $("#workout-title").textContent = def.name;
    $("#workout-day").textContent = def.day;
    $("#session-notes").value = existing ? existing.notes || "" : "";

    $("#exercise-list").innerHTML = def.exercises
      .map((ex, i) => {
        const last = lastEntry(ex.id, date);
        const current = existing && existing.entries[ex.id];
        const rest = ex.compound ? 210 : 90;
        const rows = ex.sets
          .map((set, si) => {
            const prev = last && last.sets[si];
            const cur = current && current[si];
            return `
              <div class="set-row">
                <span class="set-label">${set.label}<small>${set.min}–${set.max} reps</small></span>
                <label><span>kg</span><input type="number" inputmode="decimal" step="0.5" min="0" id="in-${ex.id}-${si}-kg" data-ex="${ex.id}" data-set="${si}" data-field="kg"
                  value="${cur && cur.kg !== "" ? cur.kg : ""}" placeholder="${prev && prev.kg !== "" ? prev.kg : "–"}"></label>
                <label><span>reps</span><input type="number" inputmode="numeric" step="1" min="0" id="in-${ex.id}-${si}-reps" data-ex="${ex.id}" data-set="${si}" data-field="reps"
                  value="${cur && cur.reps ? cur.reps : ""}" placeholder="${prev && prev.reps ? prev.reps : "–"}"></label>
              </div>`;
          })
          .join("");
        return `
          <article class="card" data-ex="${ex.id}">
            <header>
              <span class="num">${i + 1}</span>
              <div>
                <h3>${escapeHtml(ex.name)}</h3>
                <span class="tag ${ex.compound ? "compound" : ""}">${ex.compound ? "Composto · parar a 1–2 reps da falha" : "Isolamento · podes ir à falha"}</span>
              </div>
            </header>
            <ul class="cues">${ex.cues.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
            ${demoHtml(ex)}
            ${i < 3 ? `<div class="warmup" data-warmup="${ex.id}"></div>` : ""}
            <div class="hint">${last ? `<span class="muted">Último (${fmtDate(last.date)}): ${last.sets
              .filter((r) => r.reps)
              .map((r) => `${r.kg !== "" ? r.kg + "×" : ""}${r.reps}`)
              .join(" · ")}</span><br>` : ""}${suggestion(ex, last)}</div>
            <div class="sets">${rows}</div>
            <button class="rest" data-rest="${rest}" data-name="${escapeHtml(ex.name)}">⏱ Descanso ${ex.compound ? "3–4 min" : "1–2 min"}</button>
          </article>`;
      })
      .join("");

    def.exercises.forEach((ex, i) => i < 3 && updateWarmup(ex));
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

  async function saveSession() {
    const date = $("#session-date").value || today();
    const entries = collectSession();
    const status = $("#save-status");
    if (!Object.keys(entries).length) {
      status.textContent = "Nada para guardar. Preenche pelo menos uma série.";
      return;
    }
    const notes = $("#session-notes").value.trim();
    let s = sessionFor(currentWorkout, date);
    if (s) {
      Object.assign(s, { entries, notes, savedAt: Date.now() });
    } else {
      s = { id: sessionId(currentWorkout, date), workout: currentWorkout, date, entries, notes, savedAt: Date.now() };
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
    const points = sortedSessions()
      .filter((s) => s.entries[ex.id] && s.entries[ex.id][0] && s.entries[ex.id][0].reps)
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

  // ---------- navegação ----------
  let currentTab = "A";
  function showTab(tab) {
    currentTab = tab;
    $$(".tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    const isWorkout = tab === "A" || tab === "B";
    $("#tab-workout").hidden = !isWorkout;
    $("#tab-progress").hidden = tab !== "progress";
    $("#tab-info").hidden = tab !== "info";
    if (isWorkout) {
      currentWorkout = tab;
      $("#save-status").textContent = sessionFor(tab, $("#session-date").value || today()) ? "A editar o registo desta data." : "";
      renderWorkout();
    } else if (tab === "progress") {
      renderProgress();
    }
    try { localStorage.setItem("gym.tab", tab); } catch {}
  }

  // Volta a desenhar depois de chegarem dados novos, sem apagar o que está a ser escrito.
  function refresh() {
    if (currentTab === "progress") renderProgress();
    else if ((currentTab === "A" || currentTab === "B") && !dirty) renderWorkout();
  }

  // ---------- eventos ----------
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
  $("#progress-exercise").addEventListener("change", renderProgress);

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
      showTab(s.workout);
    }
  });

  let downloads = null;
  $("#export-btn").addEventListener("click", async () => {
    const data = JSON.stringify({ sessions, videos: media }, null, 2);
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
        const s = { id: sessionId(raw.workout, raw.date), workout: raw.workout, date: raw.date, entries: raw.entries, notes: String(raw.notes || ""), savedAt: Number(raw.savedAt) || Date.now() };
        sessions = sessions.filter((x) => !(x.workout === s.workout && x.date === s.date));
        sessions.push(s);
        if (remote) await persistSession(s);
        n++;
      }
      if (!remote) saveLocal(STORE_SESSIONS, sessions);
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
        }
        sessions = remoteSessions;
        if (m) media = normalizeMedia(m.items);
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

  let startTab = "A";
  try { startTab = localStorage.getItem("gym.tab") || "A"; } catch {}
  showTab(["A", "B", "progress", "info"].includes(startTab) ? startTab : "A");
  connectRemote();
})();
