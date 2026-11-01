/* Casa Forte — app */
(() => {
  'use strict';

  // ---------- estado ----------
  const KEY = 'casaForte.v1';
  const ALL = [...WORKOUTS, ...EXTRAS];
  const byId = id => ALL.find(w => w.id === id) || ALL.find(w => w.id === 'descanso');

  const fresh = () => ({ template: DEFAULT_PLAN.slice(), overrides: {}, done: {}, loads: {}, ticks: {} });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = fresh(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* sem storage */ } };

  // ---------- datas ----------
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const wd = d => (d.getDay() + 6) % 7; // 0 = segunda
  const monday = d => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -wd(d));
  const todayKey = () => keyOf(new Date());
  const weekKeys = mon => [...Array(7)].map((_, i) => keyOf(addDays(mon, i)));
  const fmtDate = k => fromKey(k).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
  const fmtLong = k => `${DAY_NAMES[wd(fromKey(k))]}, ${fmtDate(k)}`;
  const mmss = s => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);

  // ---------- plano ----------
  const planned = k => S.overrides[k] || S.template[wd(fromKey(k))];
  const planFor = k => (S.done[k] && S.done[k].w) || planned(k);

  // Muda o treino de um dia. Se esse treino estava noutro dia da mesma semana, troca os dois.
  function setDay(k, id) {
    const old = planFor(k);
    if (old === id) return;
    let swapped = null;
    if (!byId(id).extra) {
      for (const o of weekKeys(monday(fromKey(k)))) {
        if (o !== k && !S.done[o] && planned(o) === id) { assign(o, old); swapped = o; break; }
      }
    }
    assign(k, id);
    save();
    toast(swapped
      ? `Trocado: ${DAY_NAMES[wd(fromKey(k))]} ↔ ${DAY_NAMES[wd(fromKey(swapped))]}`
      : `${DAY_NAMES[wd(fromKey(k))]}: ${byId(id).name}`);
  }
  function assign(k, id) {
    if (S.template[wd(fromKey(k))] === id) delete S.overrides[k]; else S.overrides[k] = id;
  }

  // ---------- UI base ----------
  const $ = (s, r = document) => r.querySelector(s);
  const view = $('#view');
  let tab = 'hoje';
  let weekOffset = 0;

  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => go(b.dataset.tab)));
  function go(t) {
    tab = t;
    document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    ({ hoje: renderHoje, semana: renderSemana, treinos: renderTreinos, progresso: renderProgresso, dicas: renderDicas })[tab]();
  }

  const optionList = sel => `
    <optgroup label="Treinos em casa">${WORKOUTS.map(w => `<option value="${w.id}" ${w.id === sel ? 'selected' : ''}>${w.emoji} ${esc(w.name)}</option>`).join('')}</optgroup>
    <optgroup label="Outros">${EXTRAS.map(w => `<option value="${w.id}" ${w.id === sel ? 'selected' : ''}>${w.emoji} ${esc(w.name)}</option>`).join('')}</optgroup>`;

  const feelEmoji = ['', '😮‍💨', '😕', '🙂', '😃', '🤩'];

  // ---------- HOJE ----------
  function renderHoje() {
    const k = todayKey();
    const w = byId(planFor(k));
    const done = S.done[k];
    const wk = weekKeys(monday(new Date()));
    const doneCount = wk.filter(x => S.done[x] && !byId(S.done[x].w).extra).length;
    const others = wk.filter(x => x !== k && !S.done[x] && !byId(planned(x)).extra);
    const h = new Date().getHours();
    const hello = h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';

    view.innerHTML = `
      <section class="hello">
        <p class="eyebrow">${fmtLong(k)}</p>
        <h2>${hello}! ${done ? 'Treino feito. 👏' : w.extra ? '' : 'Bora treinar?'}</h2>
      </section>

      <article class="hero" style="--c:${w.color}">
        <div class="hero-top">
          <span class="big-emoji">${w.emoji}</span>
          <div>
            <p class="eyebrow light">${esc(w.focus)}</p>
            <h3>${esc(w.name)}</h3>
            ${w.minutes ? `<p class="light">⏱ ${w.minutes} min</p>` : ''}
          </div>
        </div>
        <p class="light">${esc(w.intro)}</p>
        ${done
          ? `<p class="done-badge">✅ Concluído${done.min ? ` · ${done.min} min` : ''}${done.feel ? ` · ${feelEmoji[done.feel]}` : ''}</p>`
          : ''}
        <div class="row">
          ${w.extra
            ? (done ? '' : `<button class="btn white" data-mark="${k}">Marcar como feito</button>`)
            : `<button class="btn white" data-open="${w.id}" data-date="${k}">${done ? 'Ver treino' : 'Começar treino ▶'}</button>`}
        </div>
      </article>

      ${!done && others.length ? `
      <section class="card">
        <h4>Hoje apetece outro?</h4>
        <p class="muted small">Toca num treino desta semana para o trazer para hoje — os dias trocam automaticamente.</p>
        <div class="chips">
          ${others.map(x => { const o = byId(planned(x)); return `<button class="chip" data-swap="${x}" style="--c:${o.color}">${o.emoji} ${esc(o.name)} <small>${DAY_SHORT[wd(fromKey(x))]}</small></button>`; }).join('')}
          ${w.id !== 'crossfit' ? `<button class="chip" data-set="crossfit">🏋️‍♀️ Hoje é CrossFit</button>` : ''}
          ${w.id !== 'descanso' ? `<button class="chip" data-set="descanso">😴 Descansar</button>` : ''}
        </div>
      </section>` : ''}

      <section class="card">
        <div class="between">
          <h4>Esta semana</h4>
          <span class="pill">${doneCount} treino${doneCount === 1 ? '' : 's'}</span>
        </div>
        <div class="strip">
          ${wk.map(x => { const o = byId(planFor(x)); return `
            <button class="strip-day ${x === k ? 'today' : ''} ${S.done[x] ? 'done' : ''}" data-open="${o.extra ? '' : o.id}" data-date="${x}" style="--c:${o.color}">
              <small>${DAY_SHORT[wd(fromKey(x))]}</small>
              <span>${S.done[x] ? '✓' : o.emoji}</span>
            </button>`; }).join('')}
        </div>
      </section>`;

    bindCommon();
    view.querySelectorAll('[data-swap]').forEach(b => b.addEventListener('click', () => { setDay(k, planned(b.dataset.swap)); render(); }));
    view.querySelectorAll('[data-set]').forEach(b => b.addEventListener('click', () => { setDay(k, b.dataset.set); render(); }));
  }

  function bindCommon() {
    view.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.open) openWorkout(b.dataset.open, b.dataset.date || todayKey());
    }));
    view.querySelectorAll('[data-mark]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.mark;
      S.done[k] = { w: planFor(k), min: byId(planFor(k)).minutes, ts: Date.now() };
      save(); toast('Registado 💪'); render();
    }));
  }

  // ---------- SEMANA ----------
  function renderSemana() {
    const mon = addDays(monday(new Date()), weekOffset * 7);
    const wk = weekKeys(mon);
    const tk = todayKey();
    const label = weekOffset === 0 ? 'Esta semana' : weekOffset === 1 ? 'Próxima semana' : weekOffset === -1 ? 'Semana passada' : `${fmtDate(wk[0])} – ${fmtDate(wk[6])}`;

    view.innerHTML = `
      <section class="between week-nav">
        <button class="icon-btn" data-wk="-1" aria-label="Semana anterior">‹</button>
        <div class="center"><h2>${label}</h2><p class="muted small">${fmtDate(wk[0])} – ${fmtDate(wk[6])}</p></div>
        <button class="icon-btn" data-wk="1" aria-label="Semana seguinte">›</button>
      </section>
      <p class="muted small hint">Muda o treino de qualquer dia no menu. Se escolheres um treino que já está noutro dia, <b>os dois dias trocam</b> (ex.: o treino de quinta passa para terça e o de terça vai para quinta).</p>

      <div class="days">
        ${wk.map(k => {
          const w = byId(planFor(k)); const d = S.done[k]; const moved = !!S.overrides[k] && !d;
          return `
          <article class="day ${k === tk ? 'today' : ''} ${d ? 'done' : ''}" style="--c:${w.color}">
            <div class="day-head">
              <div><b>${DAY_NAMES[wd(fromKey(k))]}</b> <span class="muted small">${fmtDate(k)}</span></div>
              ${d ? `<span class="pill ok">✓ feito</span>` : k === tk ? `<span class="pill hot">hoje</span>` : moved ? `<span class="pill">alterado</span>` : ''}
            </div>
            <div class="day-body" ${w.extra ? '' : `data-open="${w.id}" data-date="${k}" role="button" tabindex="0"`}>
              <span class="mid-emoji">${w.emoji}</span>
              <div><h4>${esc(w.name)}</h4><p class="muted small">${esc(w.focus)}${w.minutes ? ` · ${w.minutes} min` : ''}</p></div>
            </div>
            ${d ? `<div class="row"><button class="btn ghost sm" data-undo="${k}">Desfazer registo</button></div>` : `
            <div class="row">
              <label class="sel"><span class="sr">Treino de ${DAY_NAMES[wd(fromKey(k))]}</span>
                <select data-day="${k}">${optionList(w.id)}</select></label>
              ${moved ? `<button class="btn ghost sm" data-reset="${k}" title="Repor o treino original">↺</button>` : ''}
              ${w.extra && k <= tk ? `<button class="btn sm" data-mark="${k}">Feito</button>` : ''}
            </div>`}
          </article>`;
        }).join('')}
      </div>

      <details class="card">
        <summary><b>Plano base (todas as semanas)</b></summary>
        <p class="muted small">Isto define o plano que se repete. As trocas feitas acima só valem para essa semana.</p>
        <div class="base">
          ${S.template.map((id, i) => `<label><span>${DAY_NAMES[i]}</span><select data-base="${i}">${optionList(id)}</select></label>`).join('')}
        </div>
        <div class="row"><button class="btn ghost sm" id="resetBase">Repor plano sugerido</button></div>
      </details>`;

    bindCommon();
    view.querySelectorAll('[data-wk]').forEach(b => b.addEventListener('click', () => { weekOffset += +b.dataset.wk; render(); }));
    view.querySelectorAll('[data-day]').forEach(s => s.addEventListener('change', () => { setDay(s.dataset.day, s.value); render(); }));
    view.querySelectorAll('[data-reset]').forEach(b => b.addEventListener('click', () => { delete S.overrides[b.dataset.reset]; save(); render(); }));
    view.querySelectorAll('[data-undo]').forEach(b => b.addEventListener('click', () => { delete S.done[b.dataset.undo]; save(); render(); }));
    view.querySelectorAll('[data-base]').forEach(s => s.addEventListener('change', () => { S.template[+s.dataset.base] = s.value; save(); toast('Plano base atualizado'); render(); }));
    $('#resetBase').addEventListener('click', () => { S.template = DEFAULT_PLAN.slice(); save(); toast('Plano sugerido reposto'); render(); });
    view.querySelectorAll('.day-body[role=button]').forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') el.click(); }));
  }

  // ---------- TREINOS ----------
  function renderTreinos() {
    view.innerHTML = `
      <section class="hello"><h2>Biblioteca de treinos</h2>
      <p class="muted">7 treinos para rodar durante a semana. Abre qualquer um para o fazer hoje.</p></section>
      <div class="lib">
        ${WORKOUTS.map(w => `
          <article class="lib-card" data-open="${w.id}" data-date="${todayKey()}" role="button" tabindex="0" style="--c:${w.color}">
            <span class="mid-emoji">${w.emoji}</span>
            <div>
              <h4>${esc(w.name)}</h4>
              <p class="muted small">${esc(w.focus)} · ${w.minutes} min</p>
              <div class="kit">${w.kit.map(x => `<span>${esc(x)}</span>`).join('')}</div>
            </div>
          </article>`).join('')}
      </div>`;
    bindCommon();
    view.querySelectorAll('.lib-card').forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') el.click(); }));
  }

  // ---------- PROGRESSO ----------
  function renderProgresso() {
    const entries = Object.entries(S.done).sort((a, b) => b[0].localeCompare(a[0]));
    const home = entries.filter(([, d]) => !byId(d.w).extra);
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    const monthMin = entries.filter(([k]) => k.startsWith(monthPrefix)).reduce((s, [, d]) => s + (+d.min || 0), 0);
    const thisMon = monday(now);
    const weeks = [...Array(8)].map((_, i) => {
      const keys = weekKeys(addDays(thisMon, -7 * (7 - i)));
      return { label: fmtDate(keys[0]), n: keys.filter(k => S.done[k] && byId(S.done[k].w).id !== 'descanso').length };
    });
    let streak = 0;
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (weeks[i].n >= 3) streak++; else if (i !== weeks.length - 1) break;
    }
    const max = Math.max(5, ...weeks.map(w => w.n));
    const loads = Object.entries(S.loads).filter(([, v]) => v);

    view.innerHTML = `
      <section class="hello"><h2>Progresso</h2></section>
      <div class="stats">
        <div class="stat"><b>${weeks[7].n}</b><span>treinos esta semana</span></div>
        <div class="stat"><b>${monthMin}</b><span>minutos este mês</span></div>
        <div class="stat"><b>${streak}</b><span>semanas seguidas com 3+ treinos</span></div>
        <div class="stat"><b>${home.length}</b><span>treinos em casa no total</span></div>
      </div>

      <section class="card">
        <h4>Últimas 8 semanas</h4>
        <div class="bars" role="img" aria-label="Treinos por semana nas últimas 8 semanas: ${weeks.map(w => w.n).join(', ')}">
          ${weeks.map((w, i) => `<div class="bar ${i === 7 ? 'cur' : ''}"><i style="height:${(w.n / max) * 100}%"></i><b>${w.n}</b><small>${w.label}</small></div>`).join('')}
        </div>
      </section>

      <section class="card">
        <h4>Cargas registadas</h4>
        ${loads.length ? `<ul class="loads">${loads.map(([n, v]) => `<li><span>${esc(n)}</span><b>${esc(v)}</b></li>`).join('')}</ul>`
          : `<p class="muted small">Dentro de cada treino podes apontar a carga que usaste em cada exercício. Aparece aqui.</p>`}
      </section>

      <section class="card">
        <h4>Histórico</h4>
        ${entries.length ? `<ul class="hist">${entries.slice(0, 60).map(([k, d]) => { const w = byId(d.w); return `
          <li style="--c:${w.color}">
            <span class="mid-emoji">${w.emoji}</span>
            <div><b>${esc(w.name)}</b><p class="muted small">${fmtLong(k)}${d.min ? ` · ${d.min} min` : ''}${d.feel ? ` · ${feelEmoji[d.feel]}` : ''}${d.rounds ? ` · AMRAP ${esc(d.rounds)} voltas` : ''}</p>
            ${d.note ? `<p class="small">“${esc(d.note)}”</p>` : ''}</div>
            <button class="icon-btn sm" data-del="${k}" aria-label="Apagar registo">✕</button>
          </li>`; }).join('')}</ul>`
          : `<p class="muted small">Ainda sem treinos registados. O primeiro é o mais importante!</p>`}
      </section>

      <section class="card">
        <h4>Cópia de segurança</h4>
        <p class="muted small">Os dados ficam guardados só neste telemóvel/browser. Exporta de vez em quando para não os perderes.</p>
        <div class="row">
          <button class="btn ghost sm" id="exp">Exportar</button>
          <label class="btn ghost sm">Importar<input type="file" id="imp" accept="application/json" hidden></label>
        </div>
      </section>`;

    view.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.confirm) { delete S.done[b.dataset.del]; save(); render(); }
      else { b.dataset.confirm = '1'; b.textContent = 'Apagar?'; b.classList.add('warn'); }
    }));
    $('#exp').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
      a.download = `casa-forte-${todayKey()}.json`; a.click();
    });
    $('#imp').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { S = Object.assign(fresh(), JSON.parse(t)); save(); toast('Dados importados'); render(); })
        .catch(() => toast('Ficheiro inválido'));
    });
  }

  // ---------- DICAS ----------
  function renderDicas() {
    const age = new Date().getFullYear() - PROFILE.born;
    const prot = [Math.round(PROFILE.weightKg * 1.6), Math.round(PROFILE.weightKg * 2)];
    view.innerHTML = `
      <section class="hello"><h2>Como tirar o máximo</h2>
      <p class="muted">Plano pensado para ${age} anos, ${PROFILE.weightKg} kg e ${PROFILE.crossfitPerWeek} aulas de CrossFit por semana.</p></section>

      <section class="card tips">
        <h4>🗓 A semana sugerida</h4>
        <ul>
          ${S.template.map((id, i) => `<li><b>${DAY_SHORT[i]}</b> ${byId(id).emoji} ${esc(byId(id).name)}</li>`).join('')}
        </ul>
        <p class="small">Nos dias de <b>CrossFit</b>, escolhe "CrossFit na box" nesse dia. Evita fazer <i>Glúteos de Aço</i> ou <i>Kettlebell Fire</i> no dia antes de uma aula pesada de pernas.</p>
      </section>

      <section class="card tips">
        <h4>📈 Como progredir</h4>
        <ul>
          <li>Cada exercício tem um intervalo de repetições (ex.: 10–12). Quando fizeres <b>o máximo em todas as séries</b> com boa técnica, sobe a carga.</li>
          <li>Os saltos de peso em casa são grandes (5 → 9 kg). Antes de subir: abranda a descida para <b>3–4 segundos</b>, junta uma pausa ou faz mais 2–3 repetições.</li>
          <li>Glúteos: aperta 1–2 s no topo de cada repetição. Sentir o músculo a trabalhar conta tanto como a carga.</li>
          <li>Aponta a carga em cada treino — vês tudo no separador Progresso.</li>
        </ul>
      </section>

      <section class="card tips">
        <h4>🍳 Comer para tonificar</h4>
        <ul>
          <li>Proteína: cerca de <b>${prot[0]}–${prot[1]} g por dia</b> (1,6–2 g/kg), repartida por 3–4 refeições.</li>
          <li>Depois do treino ao fim do dia: um jantar com proteína (ovos, peixe, frango, tofu, iogurte grego) chega.</li>
          <li>Depois dos 40, o treino de força e a proteína são os melhores aliados para manter músculo e ossos fortes.</li>
        </ul>
      </section>

      <section class="card tips">
        <h4>🌙 Treinar depois do trabalho</h4>
        <ul>
          <li>Deixa o material num canto à vista — reduz a desculpa "tenho de ir buscar".</li>
          <li>Come um snack leve 1 h antes (banana, iogurte, tosta).</li>
          <li>Dia muito cansativo? Faz só o aquecimento e o bloco A. 20 minutos contam.</li>
          <li>Treinos intensos muito perto da hora de dormir podem atrapalhar o sono — nesses dias escolhe <i>Domingo Leve</i> ou <i>Corrida Zen</i>.</li>
        </ul>
      </section>

      <section class="card tips">
        <h4>🧰 Material</h4>
        <ul>
          <li>Kettlebells: 12 kg e 6 kg</li>
          <li>Halteres: 2 × 9 kg, 2 × 5 kg, 2 × 1 kg</li>
          <li>Perneiras de 1 kg</li>
          <li>Elásticos de resistência</li>
        </ul>
      </section>

      <p class="muted small disclaimer">Os treinos são sugestões gerais. Em caso de dor, lesão ou gravidez, fala com um profissional de saúde antes de continuar.</p>`;
  }

  // ---------- PAINEL DO TREINO ----------
  const panel = $('#workout');
  let cur = null; // { w, date }
  let session = { start: 0, timer: null };
  let rest = { end: 0, timer: null };

  const tickKey = () => `${cur.date}|${cur.w.id}`;

  function openWorkout(id, date) {
    cur = { w: byId(id), date };
    renderPanel();
    panel.hidden = false;
    document.body.classList.add('locked');
    panel.scrollTop = 0;
    history.pushState({ panel: 1 }, '');
  }
  function closePanel(fromPop) {
    if (panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove('locked');
    stopSession(); stopRest(); stopInterval();
    if (!fromPop && history.state && history.state.panel) history.back();
    render();
  }
  window.addEventListener('popstate', () => closePanel(true));

  function renderPanel() {
    const { w, date } = cur;
    const ticks = S.ticks[tickKey()] || [];
    const done = S.done[date] && S.done[date].w === w.id ? S.done[date] : null;
    const isToday = date === todayKey();

    panel.style.setProperty('--c', w.color);
    panel.innerHTML = `
      <header class="panel-head">
        <button class="icon-btn" id="back" aria-label="Voltar">←</button>
        <div><p class="eyebrow">${isToday ? 'Hoje' : fmtLong(date)}</p><h2>${w.emoji} ${esc(w.name)}</h2></div>
      </header>
      <div class="panel-body">
        <div class="meta">
          <span class="pill">⏱ ${w.minutes} min</span><span class="pill">${esc(w.focus)}</span>
        </div>
        <div class="kit">${w.kit.map(x => `<span>${esc(x)}</span>`).join('')}</div>
        <p>${esc(w.intro)}</p>
        ${done ? `<p class="done-badge dark">✅ Feito${done.min ? ` em ${done.min} min` : ''}</p>` : ''}

        ${w.blocks.map((b, bi) => `
          <section class="block">
            <div class="block-head">
              <div><h3>${esc(b.title)}</h3><p class="muted small">${esc(b.info)}</p></div>
            </div>
            ${b.interval ? `<button class="btn sm accent" data-interval="${bi}">⏱ Iniciar cronómetro</button>` : ''}
            <ol class="ex-list">
              ${b.ex.map((e, ei) => `
                <li class="ex">
                  <div class="ex-main">
                    <b>${esc(e.n)}</b>
                    <span class="dose">${esc(e.d)}</span>
                  </div>
                  ${e.l ? `<p class="load">🏋️ ${esc(e.l)}</p>` : ''}
                  ${e.tip || e.q ? `<details><summary>Como fazer</summary>
                    ${e.tip ? `<p class="small">${esc(e.tip)}</p>` : ''}
                    ${e.q ? `<a class="small" href="${yt(e.q)}" target="_blank" rel="noopener">▶ Ver vídeos de demonstração</a>` : ''}
                  </details>` : ''}
                  ${b.rest ? `<label class="load-in"><span>Carga que usei</span>
                    <input type="text" inputmode="text" placeholder="ex.: 12 kg" value="${esc(S.loads[e.n] || '')}" data-load="${esc(e.n)}"></label>` : ''}
                </li>`).join('')}
            </ol>
            ${b.rounds > 1 || b.rest ? `
            <div class="rounds">
              <span class="small muted">Séries feitas:</span>
              ${[...Array(b.rounds)].map((_, r) => `<button class="round ${(ticks[bi] || 0) > r ? 'on' : ''}" data-b="${bi}" data-r="${r}" aria-label="Série ${r + 1}">${r + 1}</button>`).join('')}
            </div>` : ''}
          </section>`).join('')}

        <section class="finish card">
          <h3>Terminar</h3>
          <div class="fin-grid">
            <label>Minutos<input type="number" id="finMin" min="0" max="180" value="${done ? done.min : w.minutes}"></label>
            ${w.id === 'kettlebell-fire' ? `<label>Voltas AMRAP<input type="text" id="finRounds" value="${esc(done?.rounds || '')}" placeholder="ex.: 4 + 10"></label>` : ''}
          </div>
          <p class="small muted">Como correu?</p>
          <div class="feel">${[1, 2, 3, 4, 5].map(n => `<button data-feel="${n}" class="${done && done.feel === n ? 'on' : ''}">${feelEmoji[n]}</button>`).join('')}</div>
          <label class="note">Nota (opcional)<textarea id="finNote" rows="2" placeholder="Ex.: subi o goblet para 12 kg!">${esc(done?.note || '')}</textarea></label>
          <button class="btn big" id="finish">${done ? 'Atualizar registo' : 'Concluir treino ✓'}</button>
        </section>
      </div>

      <footer class="timerbar">
        <div class="tb-session"><small>Treino</small><b id="sesClock">${session.start ? mmss((Date.now() - session.start) / 1000) : '0:00'}</b>
          <button class="btn sm" id="sesBtn">${session.start ? 'Pausa' : 'Começar'}</button></div>
        <div class="tb-rest"><small>Descanso</small><b id="restClock">—</b>
          <div class="rest-btns">${[30, 45, 60, 90].map(s => `<button data-rest="${s}">${s}s</button>`).join('')}</div></div>
      </footer>`;

    $('#back', panel).addEventListener('click', () => closePanel());
    panel.querySelectorAll('[data-load]').forEach(inp => inp.addEventListener('change', () => {
      S.loads[inp.dataset.load] = inp.value.trim(); save();
    }));
    panel.querySelectorAll('.round').forEach(btn => btn.addEventListener('click', () => {
      const bi = +btn.dataset.b, r = +btn.dataset.r;
      const t = S.ticks[tickKey()] = S.ticks[tickKey()] || [];
      const was = t[bi] || 0;
      t[bi] = was > r ? r : r + 1;
      pruneTicks(); save();
      panel.querySelectorAll(`.round[data-b="${bi}"]`).forEach(x => x.classList.toggle('on', t[bi] > +x.dataset.r));
      const b = w.blocks[bi];
      if (t[bi] > was && b.rest) startRest(b.rest);
      if (!session.start && t[bi] > was) startSession();
    }));
    panel.querySelectorAll('[data-interval]').forEach(btn => btn.addEventListener('click', () => {
      if (!session.start) startSession();
      startInterval(w.blocks[+btn.dataset.interval]);
    }));
    panel.querySelectorAll('[data-rest]').forEach(btn => btn.addEventListener('click', () => startRest(+btn.dataset.rest)));
    $('#sesBtn', panel).addEventListener('click', () => session.start ? pauseSession() : startSession());

    let feel = done ? done.feel : 0;
    panel.querySelectorAll('[data-feel]').forEach(btn => btn.addEventListener('click', () => {
      feel = +btn.dataset.feel;
      panel.querySelectorAll('[data-feel]').forEach(x => x.classList.toggle('on', x === btn));
    }));
    $('#finish', panel).addEventListener('click', () => {
      const min = Math.max(0, Math.round(+$('#finMin', panel).value || 0));
      const roundsEl = $('#finRounds', panel);
      if (planFor(date) !== w.id) setDay(date, w.id);
      S.done[date] = { w: w.id, min, feel, note: $('#finNote', panel).value.trim(), rounds: roundsEl ? roundsEl.value.trim() : '', ts: Date.now() };
      save();
      stopSession();
      celebrate();
      closePanel();
    });

    // se a sessão foi retomada, atualiza o botão/relógio
    if (session.start) tickSession();
  }

  function pruneTicks() {
    const cutoff = keyOf(addDays(new Date(), -21));
    for (const k of Object.keys(S.ticks)) if (k.split('|')[0] < cutoff) delete S.ticks[k];
  }

  // relógio da sessão (com pausa)
  let paused = 0;
  function startSession() {
    session.start = Date.now() - paused * 1000;
    clearInterval(session.timer);
    session.timer = setInterval(tickSession, 1000);
    tickSession();
    const b = $('#sesBtn'); if (b) b.textContent = 'Pausa';
  }
  function pauseSession() {
    paused = (Date.now() - session.start) / 1000;
    session.start = 0; clearInterval(session.timer);
    const b = $('#sesBtn'); if (b) b.textContent = 'Continuar';
  }
  function stopSession() { session.start = 0; paused = 0; clearInterval(session.timer); }
  function tickSession() {
    const el = $('#sesClock'); if (!el || !session.start) return;
    const s = (Date.now() - session.start) / 1000;
    el.textContent = mmss(s);
    const fm = $('#finMin'); if (fm && !fm.dataset.touched && s > 60) fm.value = Math.round(s / 60);
  }
  document.addEventListener('input', e => { if (e.target.id === 'finMin') e.target.dataset.touched = '1'; });

  // descanso
  function startRest(sec) {
    rest.end = Date.now() + sec * 1000;
    clearInterval(rest.timer);
    rest.timer = setInterval(tickRest, 250);
    tickRest();
  }
  function stopRest() { clearInterval(rest.timer); rest.end = 0; }
  let lastBeep = -1;
  function tickRest() {
    const el = $('#restClock');
    const left = Math.ceil((rest.end - Date.now()) / 1000);
    if (left <= 0) {
      stopRest();
      if (el) { el.textContent = 'Vai! 💥'; el.classList.add('go'); setTimeout(() => el.classList.remove('go'), 2500); }
      beep(880, 0.35); vibrate([200, 80, 200]);
      return;
    }
    if (el) el.textContent = mmss(left);
    if (left <= 3 && left !== lastBeep) { lastBeep = left; beep(600, 0.12); }
  }

  // ---------- cronómetro de intervalos ----------
  const iv = { el: $('#interval'), timer: null, phases: [], i: 0, end: 0, pausedLeft: 0 };
  function startInterval(block) {
    const { work, rest: r, rounds, labels } = block.interval;
    iv.phases = [{ label: 'Prepara-te', sec: 10, kind: 'prep' }];
    for (let n = 0; n < rounds; n++) {
      const lab = labels ? labels[n % labels.length] : 'Rápido!';
      iv.phases.push({ label: lab, sec: work, kind: 'work', round: n + 1, rounds });
      if (r) iv.phases.push({ label: 'Lento / recupera', sec: r, kind: 'rest', round: n + 1, rounds });
    }
    iv.i = 0; iv.pausedLeft = 0; iv.title = block.title;
    iv.el.hidden = false;
    ivSkeleton();
    nextPhase(true);
  }
  function nextPhase(first) {
    if (!first) iv.i++;
    if (iv.i >= iv.phases.length) {
      say('Terminado. Muito bem!'); beep(1000, 0.5); vibrate([300, 100, 300]);
      stopInterval(); toast('Bloco terminado 🎉'); return;
    }
    const p = iv.phases[iv.i];
    iv.end = Date.now() + p.sec * 1000;
    if (!first || p.kind !== 'prep') { beep(p.kind === 'work' ? 900 : 500, 0.3); vibrate(150); }
    say(p.label.replace(/^Minuto (ímpar|par): /, ''));
    clearInterval(iv.timer);
    iv.timer = setInterval(tickInterval, 200);
    const pb = $('#ivPause'); if (pb) pb.textContent = 'Pausa';
    tickInterval();
  }
  let ivLastBeep = -1;
  function ivSkeleton() {
    iv.el.innerHTML = `
      <div class="iv-box">
        <p class="eyebrow light">${esc(iv.title)}</p>
        <p class="iv-label" id="ivLabel"></p>
        <p class="iv-time" id="ivTime"></p>
        <p class="light" id="ivRound">&nbsp;</p>
        <div class="iv-progress"><i id="ivBar"></i></div>
        <div class="row center">
          <button class="btn white" id="ivPause">Pausa</button>
          <button class="btn ghost-light" id="ivSkip">Saltar ›</button>
          <button class="btn ghost-light" id="ivStop">Parar</button>
        </div>
      </div>`;
    $('#ivPause').onclick = () => {
      if (iv.timer) { clearInterval(iv.timer); iv.timer = null; iv.pausedLeft = iv.end - Date.now(); $('#ivPause').textContent = 'Continuar'; }
      else { iv.end = Date.now() + iv.pausedLeft; iv.timer = setInterval(tickInterval, 200); $('#ivPause').textContent = 'Pausa'; tickInterval(); }
    };
    $('#ivSkip').onclick = () => nextPhase();
    $('#ivStop').onclick = () => stopInterval();
  }
  function tickInterval() {
    const p = iv.phases[iv.i];
    const left = Math.ceil((iv.end - Date.now()) / 1000);
    if (left <= 0) return nextPhase();
    if (left <= 3 && left !== ivLastBeep) { ivLastBeep = left; beep(650, 0.1); }
    iv.el.className = `interval ${p.kind}`;
    $('#ivLabel').textContent = p.label;
    $('#ivTime').textContent = mmss(left);
    $('#ivRound').textContent = p.round ? `Ronda ${p.round} de ${p.rounds}` : '\u00a0';
    $('#ivBar').style.width = `${100 - (left / p.sec) * 100}%`;
  }
  function stopInterval() { clearInterval(iv.timer); iv.timer = null; iv.el.hidden = true; }

  // ---------- som / voz / vibração ----------
  let actx;
  function beep(freq, dur) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = freq; o.type = 'sine';
      g.gain.setValueAtTime(0.25, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
      o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
    } catch { /* sem áudio */ }
  }
  function say(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'pt-PT'; u.rate = 1.05;
      speechSynthesis.speak(u);
    } catch { /* sem voz */ }
  }
  const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch { /* */ } };

  function celebrate() {
    const msgs = ['Treino feito! 💪', 'Mais forte que ontem 🔥', 'Arrasaste! 🍑', 'Uma rainha não falha 👑', 'Missão cumprida ✨'];
    toast(msgs[Math.floor(Math.random() * msgs.length)]);
    beep(660, 0.15); setTimeout(() => beep(880, 0.2), 160);
  }

  // ---------- arranque ----------
  render();
})();
