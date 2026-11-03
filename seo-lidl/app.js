import { analyze, overview, compareCompetitors, autoDraft, fleschLabel, DOMAIN_LABELS, slugify } from './analyzer.js';
import { aiAnalyze, aiCompetitors, aiOverview, DEFAULT_MODEL } from './ai.js';
import { SAMPLES } from './samples.js';

const KEY = 'lidl-seo-auditor-v1';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);

// ---------------- estado ----------------
const blank = () => ({
  id: uid(), name: 'Novo texto', type: 'categoria', brand: 'Esmara', domain: 'moda', keyword: '', secondary: '', slug: '',
  metaTitle: '', metaDescription: '', h1: '', body: '', notes: '', competitors: [], ai: null, aiComp: null, updated: Date.now()
});

let state = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.items)) return { view: 'overview', tab: 'analysis', filter: 'all', q: '', overviewAI: null, sort: 'score', ...s, busy: {} };
  } catch { /* storage indisponível */ }
  return { items: [], selectedId: null, view: 'overview', tab: 'analysis', filter: 'all', q: '', settings: { apiKey: '', model: DEFAULT_MODEL, effort: 'high', theme: 'auto' }, overviewAI: null, sort: 'score', busy: {} };
}
function save() {
  try {
    const { busy, ...rest } = state;
    localStorage.setItem(KEY, JSON.stringify(rest));
  } catch { toast('Não foi possível guardar no browser (armazenamento cheio ou bloqueado).'); }
}
const current = () => state.items.find(i => i.id === state.selectedId);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove('show'), 2600);
}

function applyTheme() {
  const t = state.settings.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

const scoreClass = s => (s >= 75 ? 'ok' : s >= 50 ? 'warn' : 'bad');
const scoreColor = s => `var(--${scoreClass(s)})`;

// ---------------- markdown seguro ----------------
function md(src) {
  const inline = s => esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, href) => {
      const h = href.replace(/&amp;/g, '&');
      if (/^https?:\/\//i.test(h)) return `<a href="${esc(h)}" target="_blank" rel="noopener noreferrer">${t}</a>`;
      if (/^\//.test(h)) return `<a href="${esc(h)}" title="Link interno sugerido: ${esc(h)}" data-rel="">${t}</a>`;
      return t;
    });
  const lines = String(src || '').split(/\r?\n/);
  let html = '', list = null, para = [];
  const flushP = () => { if (para.length) { html += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
  const flushL = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const l = raw.trim();
    let m;
    if (!l) { flushP(); flushL(); continue; }
    if ((m = l.match(/^(#{1,4})\s+(.*)$/))) { flushP(); flushL(); const lv = Math.min(4, m[1].length + 1); html += `<h${lv}>${inline(m[2])}</h${lv}>`; continue; }
    if ((m = l.match(/^[-*•]\s+(.*)$/))) { flushP(); if (list !== 'ul') { flushL(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = l.match(/^\d+[.)]\s+(.*)$/))) { flushP(); if (list !== 'ol') { flushL(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(m[1])}</li>`; continue; }
    flushL(); para.push(l);
  }
  flushP(); flushL();
  return html;
}

// ---------------- sidebar ----------------
function renderSidebar() {
  const q = state.q.toLowerCase();
  const list = state.items
    .filter(i => state.filter === 'all' || i.type === state.filter)
    .filter(i => !q || [i.name, i.keyword, i.brand].join(' ').toLowerCase().includes(q))
    .map(i => ({ i, s: analyze(i).score }));
  $('#sidebar').innerHTML = `
    <div class="side-head">
      <input type="search" id="q" placeholder="Procurar textos…" value="${esc(state.q)}" aria-label="Procurar textos">
      <button class="btn primary" id="new" title="Novo texto">＋</button>
    </div>
    <div class="filters">
      ${[['all', 'Todos'], ['categoria', 'Categorias'], ['produto', 'Produtos']].map(([k, l]) => `<button class="btn sm ${state.filter === k ? 'on' : ''}" data-filter="${k}">${l}</button>`).join('')}
    </div>
    ${list.length ? `<ul class="item-list">${list.map(({ i, s }) => `
      <li><button data-open="${i.id}" class="${i.id === state.selectedId && state.view === 'item' ? 'active' : ''}">
        <span class="pill ${scoreClass(s)}">${s}</span>
        <span class="nm"><b>${esc(i.name || 'Sem nome')}</b><small>${esc(i.type)}${i.keyword ? ' · ' + esc(i.keyword) : ''}${i.ai ? ' · IA ✓' : ''}</small></span>
      </button></li>`).join('')}</ul>`
      : `<p class="muted small">${state.items.length ? 'Nenhum texto corresponde ao filtro.' : 'Ainda não tens textos. Cria um novo, importa um CSV ou carrega os exemplos.'}</p>
         ${state.items.length ? '' : '<button class="btn sm" id="samples">Carregar exemplos Esmara</button>'}`}
  `;
  $('#q').oninput = e => { state.q = e.target.value; renderSidebar(); $('#q').focus(); $('#q').setSelectionRange(state.q.length, state.q.length); };
  $('#new').onclick = () => { const it = blank(); state.items.unshift(it); state.selectedId = it.id; state.view = 'item'; state.tab = 'edit'; save(); render(); };
  $$('[data-filter]').forEach(b => b.onclick = () => { state.filter = b.dataset.filter; renderSidebar(); });
  $$('[data-open]').forEach(b => b.onclick = () => { state.selectedId = b.dataset.open; state.view = 'item'; if (state.tab === 'edit' && current()?.body) state.tab = 'analysis'; save(); render(); window.scrollTo(0, 0); });
  const s = $('#samples'); if (s) s.onclick = loadSamples;
}

function loadSamples() {
  SAMPLES.forEach(x => state.items.push({ ...blank(), ...structuredClone(x), id: uid() }));
  state.selectedId = state.items[0].id;
  save(); render(); toast('Exemplos carregados.');
}

// ---------------- vista: item ----------------
function renderItem() {
  const it = current();
  if (!it) {
    $('#main').innerHTML = `<div class="empty card"><h2>Escolhe ou cria um texto</h2><p class="muted">Seleciona um texto na lista ou cria um novo para começares a análise.</p>
      <div class="row" style="justify-content:center"><button class="btn primary" id="new2">Novo texto</button>${state.items.length ? '' : '<button class="btn" id="samples2">Carregar exemplos</button>'}</div></div>`;
    $('#new2').onclick = () => $('#new').click();
    const s = $('#samples2'); if (s) s.onclick = loadSamples;
    return;
  }
  const a = analyze(it);
  const tabs = [['edit', 'Editar texto'], ['analysis', 'Análise SEO'], ['rewrite', 'Texto corrigido'], ['competition', 'Concorrência']];
  $('#main').innerHTML = `
    <div class="row" style="margin-bottom:10px">
      <div><h2 style="margin:0">${esc(it.name || 'Sem nome')}</h2>
      <span class="muted small">${esc(it.type)} · ${esc(it.brand || 'sem marca')} · keyword: <b>${esc(it.keyword || '—')}</b></span></div>
      <span class="spacer"></span>
      <span class="pill ${scoreClass(a.score)}" style="font-size:1rem;padding:6px 12px">${a.score}/100</span>
      <button class="btn sm" id="dup">Duplicar</button>
      <button class="btn sm danger" id="del">Apagar</button>
    </div>
    <nav class="subtabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${state.tab === k ? 'active' : ''}">${l}</button>`).join('')}</nav>
    <div id="tab"></div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; save(); renderItem(); });
  $('#del').onclick = () => {
    if (!confirm(`Apagar "${it.name}"?`)) return;
    state.items = state.items.filter(x => x.id !== it.id); state.selectedId = state.items[0]?.id || null; save(); render();
  };
  $('#dup').onclick = () => { const c = { ...structuredClone(it), id: uid(), name: it.name + ' (cópia)', ai: null, aiComp: null }; state.items.unshift(c); state.selectedId = c.id; save(); render(); };
  ({ edit: renderEdit, analysis: renderAnalysis, rewrite: renderRewrite, competition: renderCompetition })[state.tab](it, a);
}

function counter(len, min, max) {
  return `<span class="counter ${len > max ? 'over' : len >= min ? 'good' : ''}">${len}/${max}</span>`;
}

function renderEdit(it) {
  $('#tab').innerHTML = `
  <div class="cols">
    <div class="card stack">
      <h3>Dados da página</h3>
      <div class="grid2">
        <label class="f">Nome interno<input type="text" data-f="name" value="${esc(it.name)}"></label>
        <label class="f">Tipo de página<select data-f="type"><option value="categoria" ${it.type === 'categoria' ? 'selected' : ''}>Categoria</option><option value="produto" ${it.type === 'produto' ? 'selected' : ''}>Produto</option></select></label>
        <label class="f">Marca<input type="text" data-f="brand" value="${esc(it.brand)}" placeholder="Esmara"></label>
        <label class="f">Domínio<select data-f="domain">${Object.entries(DOMAIN_LABELS).map(([k, l]) => `<option value="${k}" ${it.domain === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <label class="f">Palavra-chave principal <span class="hint">A pesquisa que esta página deve ganhar (ex.: "roupa de mulher").</span><input type="text" data-f="keyword" value="${esc(it.keyword)}"></label>
      <label class="f">Palavras-chave secundárias <span class="hint">Separadas por vírgulas.</span><input type="text" data-f="secondary" value="${esc(it.secondary)}"></label>
      <label class="f">URL / slug<input type="text" data-f="slug" value="${esc(it.slug)}" placeholder="/c/roupa-de-senhora"></label>
      <label class="f"><span>Meta title ${counter((it.metaTitle || '').length, 30, 60)}</span><input type="text" data-f="metaTitle" value="${esc(it.metaTitle)}"></label>
      <label class="f"><span>Meta description ${counter((it.metaDescription || '').length, 120, 155)}</span><textarea data-f="metaDescription" rows="3">${esc(it.metaDescription)}</textarea></label>
      <label class="f">H1<input type="text" data-f="h1" value="${esc(it.h1)}"></label>
      <label class="f">Notas / contexto <span class="hint">Ex.: público, campanha, o que não pode mudar. É enviado à IA.</span><textarea data-f="notes" rows="2">${esc(it.notes)}</textarea></label>
    </div>
    <div class="card stack">
      <h3>Texto</h3>
      <p class="muted small" style="margin:0">Cola o texto tal como está no site. Aceita HTML (&lt;h2&gt;, &lt;p&gt;, &lt;a&gt;…), Markdown (## Subtítulo, - lista, [âncora](/url)) ou texto simples.</p>
      <textarea class="body" data-f="body" placeholder="Cola aqui o texto da categoria ou do produto…">${esc(it.body)}</textarea>
      <div class="row"><span class="muted small" id="live"></span><span class="spacer"></span><button class="btn primary" id="go">Analisar →</button></div>
    </div>
  </div>`;
  const live = () => { const a = analyze(it); $('#live').innerHTML = `Pontuação: <b style="color:${scoreColor(a.score)}">${a.score}</b> · ${a.stats.words} palavras`; };
  live();
  let t;
  $$('[data-f]').forEach(el => el.addEventListener('input', () => {
    it[el.dataset.f] = el.value; it.updated = Date.now();
    const c = el.closest('label')?.querySelector('.counter');
    if (c) { const [min, max] = el.dataset.f === 'metaTitle' ? [30, 60] : [120, 155]; c.outerHTML = counter(el.value.length, min, max); }
    clearTimeout(t); t = setTimeout(() => { save(); renderSidebar(); live(); }, 300);
  }));
  $('#go').onclick = () => { state.tab = 'analysis'; save(); renderItem(); };
}

function serpPreview(it, h1) {
  const title = it.metaTitle || h1 || it.name;
  const cut = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + ' …' : s);
  return `<div class="serp" aria-label="Pré-visualização no Google">
    <div class="url">lidl.pt › ${esc((it.slug || slugify(it.keyword || it.name)).replace(/^\//, '').split('/').join(' › '))}</div>
    <div class="t">${esc(cut(title, 60))}</div>
    <div class="d">${esc(cut(it.metaDescription || '(Sem meta description — o Google vai escolher um excerto do texto.)', 158))}</div>
  </div>`;
}

function checksList(checks) {
  const groups = [...new Set(checks.map(c => c.group))];
  const icon = { ok: '✓', warn: '!', bad: '✕' };
  return groups.map(g => `<div class="group-title">${esc(g)}</div><ul class="checks">${checks.filter(c => c.group === g).map(c => `
    <li class="${c.status}"><span class="ic">${icon[c.status]}</span><div><b>${esc(c.label)}</b>${c.status !== 'ok' ? `<span class="prio ${c.priority}">${c.priority}</span>` : ''}
    <div>${esc(c.msg)}</div>${c.fix ? `<div class="fix">${esc(c.fix)}</div>` : ''}</div></li>`).join('')}</ul>`).join('');
}

function renderAnalysis(it, a) {
  if (!it.body.trim()) { $('#tab').innerHTML = `<div class="notice">Ainda não há texto. Vai a <b>Editar texto</b> e cola o conteúdo.</div>`; return; }
  const prios = a.checks.filter(c => c.status !== 'ok').sort((x, y) => (y.weight * (y.status === 'bad' ? 2 : 1)) - (x.weight * (x.status === 'bad' ? 2 : 1)));
  const good = a.checks.filter(c => c.status === 'ok');
  $('#tab').innerHTML = `
  <div class="cols">
    <div>
      <div class="card">
        <div class="score">
          <div class="ring" style="--v:${a.score};--c:${scoreColor(a.score)}"><span>${a.score}<small>/100</small></span></div>
          <div class="bars">${Object.entries(a.groups).map(([g, v]) => `<div class="bar"><span>${esc(g)}</span><span class="track"><i style="width:${v.score}%;background:${scoreColor(v.score)}"></i></span><b>${v.score}</b></div>`).join('')}</div>
        </div>
        <div class="stats">
          <div class="stat"><b>${a.stats.words}</b><span>palavras</span></div>
          <div class="stat"><b>${a.stats.flesch ?? '—'}</b><span>Flesch · ${fleschLabel(a.stats.flesch)}</span></div>
          <div class="stat"><b>${a.stats.avgSentence}</b><span>palavras/frase</span></div>
          <div class="stat"><b>${a.stats.headings}</b><span>subtítulos</span></div>
          <div class="stat"><b>${a.stats.links}</b><span>links</span></div>
          <div class="stat"><b>${a.stats.readingTime} min</b><span>leitura</span></div>
        </div>
      </div>
      <div class="card">
        <h3>Pré-visualização no Google</h3>
        ${serpPreview(it, a.h1)}
      </div>
      <div class="card">
        <h3>O que mudar primeiro</h3>
        ${prios.length ? `<ol class="stack" style="padding-left:18px;margin:0">${prios.slice(0, 7).map(c => `<li><b>${esc(c.label)}</b><span class="prio ${c.priority}">${c.priority}</span><br><span class="small">${esc(c.fix || c.msg)}</span></li>`).join('')}</ol>` : '<p>Nada crítico — o texto cumpre as verificações automáticas. 🎉</p>'}
      </div>
      <div class="card">
        <h3>O que está bem</h3>
        ${good.length ? `<div class="tags">${good.map(c => `<span class="tag">✓ ${esc(c.label)}</span>`).join('')}</div>` : '<p class="muted">Ainda nada — começa pelas prioridades acima.</p>'}
        <h3 style="margin-top:16px">Termos mais usados</h3>
        <div class="tags">${a.topTerms.map(t => `<span class="tag">${esc(t.term)} <b>${t.count}</b></span>`).join('')}</div>
      </div>
    </div>
    <div class="card">
      <h3>Análise detalhada</h3>
      ${checksList(a.checks)}
      <p class="muted small" style="margin-top:14px">Para uma análise de conteúdo mais profunda (intenção de pesquisa, tom, keywords sugeridas) e um texto reescrito, usa o separador <b>Texto corrigido</b>.</p>
    </div>
  </div>`;
}

function copyBtn(text, label = 'Copiar') {
  return `<button class="btn sm" data-copy="${esc(text)}">${label}</button>`;
}
function bindCopy(root = document) {
  $$('[data-copy]', root).forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); toast('Copiado.'); } catch { toast('Não foi possível copiar.'); }
  });
}

function correctedBlock(fix, source) {
  const corpo = fix.corpo + (fix.faq?.length ? '\n\n## Perguntas frequentes\n\n' + fix.faq.map(f => `**${f.pergunta}**\n${f.resposta}`).join('\n\n') : '');
  return `
    <div class="stack">
      ${[['Meta title', fix.meta_title, `${fix.meta_title.length} car.`], ['Meta description', fix.meta_description, `${fix.meta_description.length} car.`], ['H1', fix.h1, ''], ['Slug', fix.slug, '']]
        .map(([l, v, n]) => `<div class="field-out"><div><small>${l} ${n ? '· ' + n : ''}</small>${esc(v)}</div>${copyBtn(v)}</div>`).join('')}
      <div class="row"><b>Corpo do texto</b><span class="spacer"></span>${copyBtn(corpo, 'Copiar Markdown')}<button class="btn sm" data-copyhtml>Copiar HTML</button><button class="btn sm primary" data-apply="${source}">Guardar como nova versão</button></div>
      <div class="compare">
        <div class="pane"><div class="group-title" style="margin-top:0">Original</div><div class="md">${md(analyze(current()).body.text)}</div></div>
        <div class="pane"><div class="group-title" style="margin-top:0">Corrigido</div><div class="md" data-html>${md(corpo)}</div></div>
      </div>
    </div>`;
}

function bindCorrected(root, it, fix) {
  bindCopy(root);
  $$('[data-copyhtml]', root).forEach(b => b.onclick = async () => {
    const html = b.closest('.stack').querySelector('[data-html]').innerHTML.replace(/ title="Link interno sugerido: [^"]*" data-rel=""/g, '');
    try { await navigator.clipboard.writeText(html); toast('HTML copiado.'); } catch { toast('Não foi possível copiar.'); }
  });
  $$('[data-apply]', root).forEach(b => b.onclick = () => {
    const corpo = fix.corpo + (fix.faq?.length ? '\n\n## Perguntas frequentes\n\n' + fix.faq.map(f => `**${f.pergunta}**\n${f.resposta}`).join('\n\n') : '');
    const v = { ...structuredClone(it), id: uid(), name: it.name.replace(/ \(v\d+\)$/, '') + ` (v${state.items.filter(x => x.name.startsWith(it.name.replace(/ \(v\d+\)$/, ''))).length + 1})`,
      metaTitle: fix.meta_title, metaDescription: fix.meta_description, h1: fix.h1, slug: fix.slug, body: corpo, ai: null, aiComp: null, updated: Date.now() };
    const before = analyze(it).score, after = analyze(v).score;
    state.items.splice(state.items.indexOf(it), 0, v);
    state.selectedId = v.id; state.tab = 'analysis'; save(); render();
    toast(`Nova versão criada: ${before} → ${after} pontos.`);
  });
}

function renderRewrite(it, a) {
  const busy = state.busy[it.id + ':ai'];
  const hasKey = !!state.settings.apiKey;
  const ai = it.ai;
  const draft = autoDraft(it, a);
  $('#tab').innerHTML = `
    <div class="card">
      <div class="row">
        <div><h3 style="margin:0">Análise aprofundada e texto corrigido com IA</h3>
        <span class="muted small">Usa as regras automáticas + textos dos concorrentes como contexto. Modelo: ${esc(state.settings.model)}.</span></div>
        <span class="spacer"></span>
        <button class="btn primary" id="runai" ${busy || !it.body.trim() ? 'disabled' : ''}>${ai ? 'Gerar de novo' : 'Analisar com IA'}</button>
      </div>
      ${!hasKey ? `<div class="notice info" style="margin-top:12px">Para usar a IA, adiciona a tua chave da API da Anthropic em <a href="#" data-goto="settings">Definições</a>. Sem chave, tens em baixo um rascunho automático.</div>` : ''}
      ${busy ? `<div class="loading" style="margin-top:12px"><span class="spinner"></span><span id="prog">A analisar o texto… isto pode demorar 1–2 minutos.</span></div>` : ''}
      ${it.aiError ? `<div class="error" style="margin-top:12px">${esc(it.aiError)}</div>` : ''}
    </div>
    ${ai ? `
    <div class="cols" style="margin-top:16px">
      <div>
        <div class="card">
          <div class="score"><div class="ring" style="--v:${ai.pontuacao};--c:${scoreColor(ai.pontuacao)}"><span>${ai.pontuacao}<small>IA</small></span></div>
          <div style="flex:1;min-width:200px"><p style="margin-top:0">${esc(ai.resumo)}</p><p class="small"><b>Intenção de pesquisa:</b> ${esc(ai.intencao_pesquisa)}</p></div></div>
        </div>
        <div class="card"><h3>O que está bem</h3><ul>${ai.pontos_fortes.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>
        <div class="card"><h3>Problemas e sugestões</h3>
          <ul class="checks">${ai.problemas.map(p => `<li class="${p.prioridade === 'alta' ? 'bad' : 'warn'}"><span class="ic">!</span><div><b>${esc(p.titulo)}</b><span class="prio ${esc(p.prioridade)}">${esc(p.prioridade)}</span><div>${esc(p.detalhe)}</div><div class="fix">${esc(p.sugestao)}</div></div></li>`).join('')}</ul>
        </div>
        <div class="card"><h3>Keywords sugeridas</h3>
          <div class="tablewrap"><table><thead><tr><th>Termo</th><th>Tipo</th><th>Porquê</th></tr></thead><tbody>
          ${ai.keywords_sugeridas.map(k => `<tr><td><b>${esc(k.termo)}</b></td><td><span class="tag">${esc(k.tipo)}</span></td><td class="small">${esc(k.justificacao)}</td></tr>`).join('')}
          </tbody></table></div>
        </div>
        <div class="card"><h3>O que a concorrência faz bem</h3>
          <ul class="stack" style="padding-left:18px">${ai.concorrencia.map(c => `<li><b>${esc(c.insight)}</b><br><span class="small">→ ${esc(c.como_aplicar)}</span></li>`).join('')}</ul>
        </div>
      </div>
      <div>
        <div class="card"><h3>Texto corrigido</h3><div id="aifix">${correctedBlock(ai.texto_corrigido, 'ai')}</div></div>
        <div class="card"><h3>Alterações feitas</h3><ul>${ai.alteracoes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      </div>
    </div>` : ''}
    <div class="card" style="margin-top:16px">
      <details ${ai ? '' : 'open'}>
        <summary>Rascunho automático (sem IA)</summary>
        <p class="muted small">Correções mecânicas: metadados no formato recomendado, keyword na introdução, termos pt-BR substituídos, parágrafos longos divididos, estrutura de FAQ e CTA quando faltam. Revê sempre antes de publicar — os campos entre [ ] têm de ser preenchidos.</p>
        <div id="draft">${correctedBlock(draft, 'draft')}</div>
      </details>
    </div>`;
  const g = $('[data-goto]'); if (g) g.onclick = e => { e.preventDefault(); state.view = 'settings'; render(); };
  bindCorrected($('#draft'), it, draft);
  if (ai) bindCorrected($('#aifix'), it, ai.texto_corrigido);
  $('#runai').onclick = async () => {
    if (!hasKey) { state.view = 'settings'; render(); return; }
    state.busy[it.id + ':ai'] = true; it.aiError = null; renderItem();
    try {
      it.ai = await aiAnalyze({ ...settingsArgs(), item: it, ruleAnalysis: a, competitors: it.competitors, onProgress: n => { const p = $('#prog'); if (p) p.textContent = `A escrever a análise… (${n} caracteres)`; } });
      toast('Análise com IA concluída.');
    } catch (e) { it.aiError = e.message; }
    delete state.busy[it.id + ':ai']; save();
    if (state.selectedId === it.id && state.view === 'item') renderItem(); renderSidebar();
  };
}

const settingsArgs = () => ({ apiKey: state.settings.apiKey, model: state.settings.model || DEFAULT_MODEL, effort: state.settings.effort });

const PRACTICES = [
  ['Texto de categoria acima e abaixo da grelha', 'Uma introdução curta (2–3 frases com a keyword) acima dos produtos e um texto mais longo com H2, dicas e FAQ abaixo da grelha — não atrasa a compra e dá contexto ao Google.'],
  ['FAQ com perguntas reais', 'Perguntas como "Que tamanho escolher?", "Como lavar…?" ou "Posso devolver?" respondem a pesquisas long-tail e aparecem em "As pessoas também perguntam".'],
  ['Links para subcategorias', 'Retalhistas de moda ligam a partir do texto às subcategorias (vestidos, calças, pijamas…) com âncoras descritivas — reforça a arquitetura do site.'],
  ['Guias de tamanhos e materiais', 'Informação de composição, corte e guia de tamanhos reduz devoluções e cobre pesquisas de comparação.'],
  ['Sazonalidade e tendências', 'Atualizam textos por estação ("vestidos de verão", "casacos de inverno") e criam páginas para momentos (regresso às aulas, Natal).'],
  ['Metadados com benefício + marca', 'Títulos no formato "Keyword | Benefício | Marca" e descrições com CTA aumentam o CTR.'],
  ['Prova de qualidade concreta', 'Certificações (OEKO-TEX®, algodão sustentável), avaliações e números concretos em vez de "a melhor qualidade".'],
  ['Conteúdo único por página', 'Evitam textos repetidos entre categorias parecidas e entre produtos de variantes (cor/tamanho).']
];

function renderCompetition(it) {
  const cmp = compareCompetitors(it, it.competitors || []);
  const busy = state.busy[it.id + ':comp'];
  $('#tab').innerHTML = `
  <div class="cols">
    <div>
      <div class="card stack">
        <div class="row"><h3 style="margin:0">Textos da concorrência</h3><span class="spacer"></span><button class="btn sm" id="addc">＋ Adicionar concorrente</button></div>
        <p class="muted small" style="margin:0">Cola o texto (e subtítulos) da página equivalente de um concorrente — ex.: a categoria "roupa de mulher" de outro retalhista. A ferramenta compara estrutura, comprimento e termos que te faltam. Os textos também são enviados à IA na análise.</p>
        ${(it.competitors || []).map((c, i) => `
          <div class="comp-item">
            <div class="row"><input type="text" data-cn="${i}" value="${esc(c.name)}" placeholder="Nome do concorrente" style="flex:1"><button class="btn sm danger" data-cdel="${i}">Remover</button></div>
            <textarea data-ct="${i}" rows="6" placeholder="Texto do concorrente (HTML, Markdown ou texto simples)">${esc(c.text)}</textarea>
          </div>`).join('') || '<p class="muted small">Nenhum concorrente adicionado.</p>'}
        ${(it.competitors || []).length ? '<button class="btn primary" id="cmpgo">Comparar</button>' : ''}
      </div>
      ${cmp ? `
      <div class="card">
        <h3>Comparação</h3>
        <div class="tablewrap"><table><thead><tr><th></th><th>Palavras</th><th>Flesch</th><th>Subtítulos</th><th>Links</th><th>Itens lista</th><th>FAQ</th></tr></thead><tbody>
        ${cmp.rows.map((r, i) => `<tr${i === 0 ? ' style="font-weight:700"' : ''}><td>${esc(r.name)}</td><td>${r.words}</td><td>${r.flesch ?? '—'}</td><td>${r.headings}</td><td>${r.links}</td><td>${r.listItems}</td><td>${r.faq ? '✓' : '—'}</td></tr>`).join('')}
        </tbody></table></div>
        ${cmp.insights.length ? `<h3 style="margin-top:16px">Conclusões</h3><ul>${cmp.insights.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${cmp.gaps.length ? `<h3 style="margin-top:16px">Termos usados pela concorrência que não usas</h3><div class="tags">${cmp.gaps.map(g => `<span class="tag">${esc(g.term)} <b>${g.count}</b></span>`).join('')}</div>` : ''}
        ${cmp.rows.slice(1).some(r => r.headingTexts?.length) ? `<h3 style="margin-top:16px">Subtítulos dos concorrentes</h3>${cmp.rows.slice(1).map(r => r.headingTexts.length ? `<p class="small"><b>${esc(r.name)}:</b> ${r.headingTexts.map(esc).join(' · ')}</p>` : '').join('')}` : ''}
      </div>` : ''}
    </div>
    <div>
      <div class="card">
        <div class="row"><h3 style="margin:0">Pesquisa da concorrência com IA</h3><span class="spacer"></span>
        <button class="btn primary" id="compai" ${busy ? 'disabled' : ''}>${it.aiComp ? 'Pesquisar de novo' : 'Pesquisar na web'}</button></div>
        <p class="muted small">Pesquisa no Google Portugal quem aparece para "${esc(it.keyword || it.name)}" e o que estão a fazer bem. Requer chave da API e a pesquisa web ativa na consola da Anthropic.</p>
        ${busy ? `<div class="loading"><span class="spinner"></span><span id="cprog">A pesquisar a concorrência…</span></div>` : ''}
        ${it.aiCompError ? `<div class="error">${esc(it.aiCompError)}</div>` : ''}
        ${it.aiComp ? `<div class="md">${md(it.aiComp.markdown)}</div>
          ${it.aiComp.sources.length ? `<details><summary>Fontes (${it.aiComp.sources.length})</summary><ul class="small">${it.aiComp.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></li>`).join('')}</ul></details>` : ''}` : ''}
      </div>
      <div class="card">
        <h3>Boas práticas comuns no retalho de moda</h3>
        <ul class="checks">${PRACTICES.map(([t, d]) => {
          const done = practiceDone(t, it);
          return `<li class="${done ? 'ok' : 'warn'}"><span class="ic">${done ? '✓' : '?'}</span><div><b>${esc(t)}</b><div class="small">${esc(d)}</div></div></li>`;
        }).join('')}</ul>
      </div>
    </div>
  </div>`;
  $('#addc').onclick = () => { it.competitors = [...(it.competitors || []), { name: '', text: '' }]; save(); renderItem(); };
  $$('[data-cdel]').forEach(b => b.onclick = () => { it.competitors.splice(+b.dataset.cdel, 1); save(); renderItem(); });
  $$('[data-cn]').forEach(el => el.oninput = () => { it.competitors[+el.dataset.cn].name = el.value; save(); });
  $$('[data-ct]').forEach(el => el.oninput = () => { it.competitors[+el.dataset.ct].text = el.value; save(); });
  const go = $('#cmpgo'); if (go) go.onclick = () => renderItem();
  $('#compai').onclick = async () => {
    if (!state.settings.apiKey) { state.view = 'settings'; render(); return; }
    state.busy[it.id + ':comp'] = true; it.aiCompError = null; renderItem();
    try {
      it.aiComp = await aiCompetitors({ ...settingsArgs(), item: it, onProgress: n => { const p = $('#cprog'); if (p) p.textContent = `A escrever o relatório… (${n} caracteres)`; } });
    } catch (e) { it.aiCompError = e.message; }
    delete state.busy[it.id + ':comp']; save();
    if (state.selectedId === it.id && state.view === 'item') renderItem();
  };
}

function practiceDone(title, it) {
  const a = analyze(it);
  const st = id => a.checks.find(c => c.id === id)?.status === 'ok';
  return ({
    'FAQ com perguntas reais': st('faq'),
    'Links para subcategorias': st('links'),
    'Metadados com benefício + marca': st('title') && st('desc'),
    'Prova de qualidade concreta': st('tone') && /oeko|certific|avalia/i.test(it.body),
    'Guias de tamanhos e materiais': /tamanho/i.test(it.body) && /(algodão|material|composição|tecido)/i.test(it.body),
    'Sazonalidade e tendências': /verão|inverno|primavera|outono|tendênc/i.test(it.body),
    'Texto de categoria acima e abaixo da grelha': it.type === 'produto' || a.stats.headings >= 2,
    'Conteúdo único por página': !overview(state.items).duplicates.some(d => d.a.id === it.id || d.b.id === it.id)
  })[title] ?? false;
}

// ---------------- vista: visão geral ----------------
function renderOverview() {
  if (!state.items.length) {
    $('#main').innerHTML = `<div class="empty card">
      <h2>Auditoria SEO dos teus textos</h2>
      <p class="muted" style="max-width:620px;margin:0 auto 18px">Adiciona textos de categorias e produtos (ex.: Esmara) para obteres uma análise detalhada do que está bem e mal, sugestões de melhoria, um texto corrigido, comparação com a concorrência e uma visão geral de todo o conteúdo.</p>
      <div class="row" style="justify-content:center"><button class="btn primary" id="e-new">Novo texto</button><button class="btn" id="e-imp">Importar CSV</button><button class="btn" id="e-smp">Carregar exemplos Esmara</button></div>
    </div>`;
    $('#e-new').onclick = () => $('#new').click();
    $('#e-imp').onclick = () => { state.view = 'import'; render(); };
    $('#e-smp').onclick = loadSamples;
    return;
  }
  const o = overview(state.items);
  const sorters = {
    score: (x, y) => x.a.score - y.a.score, name: (x, y) => x.item.name.localeCompare(y.item.name),
    words: (x, y) => x.a.stats.words - y.a.stats.words, type: (x, y) => x.item.type.localeCompare(y.item.type)
  };
  const rows = [...o.analyses].sort(sorters[state.sort] || sorters.score);
  const dist = { ok: 0, warn: 0, bad: 0 };
  o.analyses.forEach(x => dist[scoreClass(x.a.score)]++);
  const plan = buildPlan(o);
  $('#main').innerHTML = `
    <div class="row" style="margin-bottom:14px"><h2 style="margin:0">Visão geral</h2><span class="spacer"></span>
      <button class="btn" id="csv">Exportar relatório (CSV)</button></div>
    <div class="kpis">
      <div class="kpi"><b>${state.items.length}</b><span>textos (${state.items.filter(i => i.type === 'categoria').length} categorias · ${state.items.filter(i => i.type === 'produto').length} produtos)</span></div>
      <div class="kpi"><b style="color:${scoreColor(o.avg)}">${o.avg}</b><span>pontuação média</span></div>
      <div class="kpi"><b>${dist.ok} / ${dist.warn} / ${dist.bad}</b><span>bons · a melhorar · fracos</span></div>
      <div class="kpi"><b>${o.avgWords}</b><span>palavras em média</span></div>
      <div class="kpi"><b>${o.avgFlesch ?? '—'}</b><span>legibilidade média (${fleschLabel(o.avgFlesch)})</span></div>
      <div class="kpi"><b style="color:${o.duplicates.length + o.cannibal.length + o.dupTitles.length ? 'var(--bad)' : 'var(--ok)'}">${o.duplicates.length + o.cannibal.length + o.dupTitles.length}</b><span>riscos entre páginas</span></div>
    </div>
    <div class="cols overview-cols">
      <div>
        <div class="card">
          <h3>Todos os textos</h3>
          <div class="tablewrap"><table>
            <thead><tr><th data-sort="score">Pont.</th><th data-sort="name">Texto</th><th data-sort="type">Tipo</th><th data-sort="words">Palavras</th><th>Principais problemas</th></tr></thead>
            <tbody>${rows.map(({ item, a }) => `<tr class="click" data-open="${item.id}">
              <td><span class="pill ${scoreClass(a.score)}">${a.score}</span></td>
              <td><b>${esc(item.name)}</b><br><span class="muted small">${esc(item.keyword || 'sem keyword')}</span></td>
              <td>${esc(item.type)}</td><td>${a.stats.words}</td>
              <td class="small problems">${a.checks.filter(c => c.status === 'bad').slice(0, 3).map(c => esc(c.label)).join(' · ') || '<span class="muted">—</span>'}</td>
            </tr>`).join('')}</tbody>
          </table></div>
        </div>
        <div class="card">
          <h3>Problemas mais frequentes</h3>
          ${o.issues.length ? `<div class="stack">${o.issues.slice(0, 10).map(e => `<div class="bar" style="grid-template-columns:minmax(0,1fr) 140px 60px">
            <span><b>${esc(e.label)}</b> <span class="muted small">· ${esc(e.group)}</span></span>
            <span class="track"><i style="width:${Math.round(((e.bad + e.warn) / state.items.length) * 100)}%;background:${e.bad ? 'var(--bad)' : 'var(--warn)'}"></i></span>
            <span class="small">${e.bad + e.warn}/${state.items.length}</span></div>`).join('')}</div>` : '<p>Sem problemas recorrentes. 🎉</p>'}
        </div>
      </div>
      <div>
        <div class="card">
          <h3>Plano de melhoria</h3>
          <ol class="stack" style="padding-left:18px;margin:0">${plan.map(p => `<li><b>${esc(p.title)}</b><br><span class="small">${esc(p.detail)}</span></li>`).join('')}</ol>
        </div>
        <div class="card">
          <h3>Riscos entre páginas</h3>
          ${!o.duplicates.length && !o.cannibal.length && !o.dupTitles.length ? '<p class="muted">Sem conteúdo duplicado, canibalização ou títulos repetidos detetados.</p>' : ''}
          ${o.cannibal.map(c => `<div class="notice" style="margin-bottom:8px"><b>Canibalização:</b> ${c.list.length} páginas com a keyword "${esc(c.kw)}": ${c.list.map(i => esc(i.name)).join(', ')}. Define uma keyword diferente para cada página.</div>`).join('')}
          ${o.duplicates.map(d => `<div class="notice" style="margin-bottom:8px"><b>Conteúdo semelhante (${Math.round(d.sim * 100)}%):</b> ${esc(d.a.name)} ↔ ${esc(d.b.name)}. Reescreve para tornar cada texto único.</div>`).join('')}
          ${o.dupTitles.map(d => `<div class="notice" style="margin-bottom:8px"><b>Meta title repetido:</b> ${d.list.map(i => esc(i.name)).join(', ')}.</div>`).join('')}
        </div>
        <div class="card">
          <div class="row"><h3 style="margin:0">Relatório global com IA</h3><span class="spacer"></span>
          <button class="btn primary" id="ovai" ${state.busy.overview ? 'disabled' : ''}>${state.overviewAI ? 'Gerar de novo' : 'Gerar relatório'}</button></div>
          <p class="muted small">Diagnóstico, padrões, plano priorizado e um guia de redação para a equipa, com base em todos os textos.</p>
          ${state.busy.overview ? '<div class="loading"><span class="spinner"></span><span id="oprog">A preparar o relatório…</span></div>' : ''}
          ${state.overviewAIError ? `<div class="error">${esc(state.overviewAIError)}</div>` : ''}
          ${state.overviewAI ? `<div class="md">${md(state.overviewAI)}</div>` : ''}
        </div>
      </div>
    </div>`;
  $$('[data-sort]').forEach(th => th.onclick = () => { state.sort = th.dataset.sort; save(); renderOverview(); });
  $$('tr[data-open]').forEach(tr => tr.onclick = () => { state.selectedId = tr.dataset.open; state.view = 'item'; state.tab = 'analysis'; save(); render(); window.scrollTo(0, 0); });
  $('#csv').onclick = () => exportCSV(o);
  $('#ovai').onclick = async () => {
    if (!state.settings.apiKey) { state.view = 'settings'; render(); return; }
    state.busy.overview = true; state.overviewAIError = null; renderOverview();
    try {
      state.overviewAI = await aiOverview({ ...settingsArgs(), summary: overviewSummary(o), onProgress: n => { const p = $('#oprog'); if (p) p.textContent = `A escrever… (${n} caracteres)`; } });
    } catch (e) { state.overviewAIError = e.message; }
    delete state.busy.overview; save();
    if (state.view === 'overview') renderOverview();
  };
}

function buildPlan(o) {
  const plan = [];
  const n = state.items.length;
  const top = id => o.issues.find(e => e.id === id);
  const add = (id, title, detail) => { const e = top(id); if (e) plan.push({ title: `${title} (${e.bad + e.warn}/${n} textos)`, detail, impact: e.impact }); };
  if (o.cannibal.length) plan.push({ title: 'Resolver canibalização de keywords', detail: 'Atribui uma keyword principal única a cada página e liga as páginas entre si.', impact: 99 });
  if (o.duplicates.length) plan.push({ title: 'Eliminar conteúdo duplicado', detail: 'Reescreve os pares de textos semelhantes para que cada página tenha valor próprio.', impact: 98 });
  add('title', 'Otimizar meta titles', 'Formato "Keyword | Benefício | Lidl", 50–60 caracteres.');
  add('desc', 'Escrever meta descriptions com CTA', '120–155 caracteres, keyword + benefício + "Descobre/Compra".');
  add('kw-intro', 'Colocar a keyword na primeira frase', 'O Google e o utilizador devem perceber logo do que trata a página.');
  add('h1', 'Corrigir H1', 'Um único H1 por página, com a keyword principal.');
  add('length', 'Aprofundar textos curtos', 'Categorias com 300+ palavras e produtos com 150+ palavras úteis.');
  add('attrs', 'Completar informação essencial', 'Materiais, tamanhos, cuidados, ocasiões e disponibilidade.');
  add('subs', 'Estruturar com subtítulos', 'H2 a cada 150–300 palavras, um deles com a keyword.');
  add('links', 'Reforçar links internos', 'Ligar categorias ↔ subcategorias ↔ produtos com âncoras descritivas.');
  add('ptbr', 'Uniformizar para português de Portugal', 'Substituir termos de pt-BR (você, camiseta, tênis…).');
  add('brand', 'Uniformizar menções à marca', 'Mesma grafia da marca em todos os textos.');
  add('faq', 'Acrescentar FAQs às categorias', '3–5 perguntas reais para captar pesquisas long-tail.');
  add('sent', 'Simplificar frases longas', 'Frases até ~20 palavras; legibilidade Flesch 50+.');
  add('semantic', 'Enriquecer o vocabulário', 'Usar termos relacionados do domínio (tecidos, cortes, ocasiões…).');
  return plan.sort((a, b) => b.impact - a.impact).slice(0, 8);
}

function overviewSummary(o) {
  const lines = o.analyses.map(({ item, a }) => `- "${item.name}" (${item.type}, keyword: ${item.keyword || '—'}, ${a.stats.words} palavras, Flesch ${a.stats.flesch ?? '—'}, pontuação ${a.score}). Falhas: ${a.checks.filter(c => c.status !== 'ok').map(c => `${c.label} [${c.status}]: ${c.msg}`).join(' | ') || 'nenhuma'}\n  Início do texto: ${a.body.text.slice(0, 300).replace(/\s+/g, ' ')}…`);
  const risks = [
    ...o.cannibal.map(c => `Canibalização "${c.kw}": ${c.list.map(i => i.name).join(', ')}`),
    ...o.duplicates.map(d => `Semelhança ${Math.round(d.sim * 100)}%: ${d.a.name} ↔ ${d.b.name}`),
    ...o.dupTitles.map(d => `Meta title repetido: ${d.list.map(i => i.name).join(', ')}`)
  ];
  return { count: o.analyses.length, text: `Pontuação média: ${o.avg}. Palavras médias: ${o.avgWords}.\n\nTextos:\n${lines.join('\n')}\n\nRiscos:\n${risks.join('\n') || 'nenhum'}` };
}

// ---------------- import / export ----------------
const CSV_COLS = [['name', 'nome'], ['type', 'tipo'], ['brand', 'marca'], ['domain', 'dominio'], ['keyword', 'keyword'], ['secondary', 'keywords_secundarias'], ['slug', 'url'], ['metaTitle', 'meta_title'], ['metaDescription', 'meta_description'], ['h1', 'h1'], ['body', 'texto'], ['notes', 'notas']];

function parseCSV(text) {
  const sep = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : (text.split('\n')[0].includes('\t') ? '\t' : ',');
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}

function csvCell(v) { v = String(v ?? ''); return /[",;\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function exportCSV(o) {
  const head = ['nome', 'tipo', 'keyword', 'pontuacao', 'palavras', 'flesch', ...[...new Set(o.analyses.flatMap(x => x.a.checks.map(c => c.label)))], 'prioridades'];
  const labels = head.slice(6, -1);
  const lines = o.analyses.map(({ item, a }) => [item.name, item.type, item.keyword, a.score, a.stats.words, a.stats.flesch ?? '',
    ...labels.map(l => { const c = a.checks.find(x => x.label === l); return c ? ({ ok: 'OK', warn: 'Melhorar', bad: 'Mau' })[c.status] : ''; }),
    a.checks.filter(c => c.status !== 'ok').map(c => c.fix || c.msg).join(' | ')]);
  download(`relatorio-seo-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + [head, ...lines].map(r => r.map(csvCell).join(';')).join('\n'), 'text/csv;charset=utf-8');
}

function renderImport() {
  $('#main').innerHTML = `
  <div class="cols">
    <div class="card stack">
      <h3>Importar vários textos (CSV)</h3>
      <p class="muted small" style="margin:0">Exporta da tua folha de cálculo como CSV (separado por vírgulas ou ponto e vírgula), com uma linha de cabeçalho. Colunas reconhecidas:</p>
      <code class="small" style="overflow-wrap:anywhere">${CSV_COLS.map(c => c[1]).join(', ')}</code>
      <p class="muted small" style="margin:0">Só <b>nome</b> e <b>texto</b> são obrigatórias. <b>tipo</b> = categoria ou produto.</p>
      <input type="file" id="csvfile" accept=".csv,.tsv,.txt">
      <textarea id="csvtext" rows="8" placeholder="…ou cola aqui o conteúdo do CSV"></textarea>
      <div class="row"><button class="btn primary" id="csvimp">Importar</button><button class="btn" id="csvtpl">Descarregar modelo</button></div>
    </div>
    <div>
      <div class="card stack">
        <h3>Cópia de segurança</h3>
        <p class="muted small" style="margin:0">Os textos ficam guardados apenas neste browser. Exporta uma cópia para não os perderes ou para os passares a um colega.</p>
        <div class="row"><button class="btn" id="jsonexp">Exportar tudo (JSON)</button><label class="btn">Importar JSON<input type="file" id="jsonimp" accept=".json" hidden></label></div>
      </div>
      <div class="card stack">
        <h3>Exemplos</h3>
        <p class="muted small" style="margin:0">Três textos fictícios da Esmara com erros propositados, para veres como funciona a análise.</p>
        <div><button class="btn" id="smp">Carregar exemplos</button></div>
      </div>
      <div class="card stack">
        <h3>Zona de perigo</h3>
        <div><button class="btn danger" id="wipe">Apagar todos os textos</button></div>
      </div>
    </div>
  </div>`;
  $('#csvfile').onchange = async e => { const f = e.target.files[0]; if (f) $('#csvtext').value = await f.text(); };
  $('#csvimp').onclick = () => {
    const rows = parseCSV($('#csvtext').value.replace(/^﻿/, ''));
    if (rows.length < 2) { toast('CSV vazio ou sem linhas de dados.'); return; }
    const head = rows[0].map(h => h.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_'));
    const map = CSV_COLS.map(([k, col]) => [k, head.indexOf(col)]).filter(([, i]) => i >= 0);
    if (!map.some(([k]) => k === 'body')) { toast('Falta a coluna "texto".'); return; }
    let n = 0;
    rows.slice(1).forEach(r => {
      const it = blank();
      map.forEach(([k, i]) => { if (r[i] != null && r[i] !== '') it[k] = r[i].trim(); });
      it.type = /prod/i.test(it.type) ? 'produto' : 'categoria';
      if (!DOMAIN_LABELS[it.domain]) it.domain = 'moda';
      if (it.body) { state.items.push(it); n++; }
    });
    save(); state.view = 'overview'; render(); toast(`${n} texto(s) importado(s).`);
  };
  $('#csvtpl').onclick = () => download('modelo-textos-seo.csv', '﻿' + [CSV_COLS.map(c => c[1]), ['Roupa de senhora', 'categoria', 'Esmara', 'moda', 'roupa de mulher', 'roupa de senhora, vestidos de mulher', '/c/roupa-de-senhora', 'Roupa de mulher Esmara | Lidl', 'Descobre…', 'Roupa de mulher', 'Texto da categoria…', '']].map(r => r.map(csvCell).join(';')).join('\n'), 'text/csv;charset=utf-8');
  $('#jsonexp').onclick = () => download(`textos-seo-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ version: 1, items: state.items }, null, 2), 'application/json');
  $('#jsonimp').onchange = async e => {
    try {
      const d = JSON.parse(await e.target.files[0].text());
      const items = (d.items || d).filter(x => x && typeof x === 'object').map(x => ({ ...blank(), ...x, id: uid() }));
      state.items.push(...items); save(); render(); toast(`${items.length} texto(s) importado(s).`);
    } catch { toast('Ficheiro JSON inválido.'); }
  };
  $('#smp').onclick = () => { loadSamples(); state.view = 'overview'; render(); };
  $('#wipe').onclick = () => { if (confirm('Apagar todos os textos deste browser? Não é possível desfazer.')) { state.items = []; state.selectedId = null; state.overviewAI = null; save(); render(); } };
}

function renderSettings() {
  const s = state.settings;
  $('#main').innerHTML = `
  <div class="card stack" style="max-width:720px">
    <h3>Inteligência artificial (opcional)</h3>
    <p class="muted small" style="margin:0">A análise automática funciona sem IA. Para a análise aprofundada, o texto corrigido escrito por IA, a pesquisa da concorrência na web e o relatório global, adiciona uma chave da API da Anthropic (cria-a em <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>).</p>
    <div class="notice small">A chave fica guardada apenas neste browser e é enviada diretamente à API da Anthropic. Não uses este site num computador partilhado com a chave guardada.</div>
    <label class="f">Chave da API<input type="password" id="k" value="${esc(s.apiKey)}" placeholder="sk-ant-…" autocomplete="off"></label>
    <div class="grid2">
      <label class="f">Modelo<select id="m">
        ${[['claude-opus-5-5', 'Claude Opus 5.5 (recomendado)'], ['claude-sonnet-5-5', 'Claude Sonnet 5.5 (mais rápido e barato)'], ['claude-fable-5-1', 'Claude Fable 5.1 (o mais capaz)']].map(([v, l]) => `<option value="${v}" ${s.model === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>
      <label class="f">Profundidade (effort)<select id="ef">
        ${[['medium', 'Média — mais rápido'], ['high', 'Alta (recomendado)'], ['xhigh', 'Muito alta — mais lento']].map(([v, l]) => `<option value="${v}" ${s.effort === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>
    </div>
    <h3 style="margin-top:8px">Aparência</h3>
    <label class="f">Tema<select id="th">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([v, l]) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <div class="row"><button class="btn primary" id="sv">Guardar</button>${s.apiKey ? '<button class="btn danger" id="rk">Remover chave</button>' : ''}</div>
  </div>`;
  $('#sv').onclick = () => {
    Object.assign(s, { apiKey: $('#k').value.trim(), model: $('#m').value, effort: $('#ef').value, theme: $('#th').value });
    applyTheme(); save(); toast('Definições guardadas.'); renderSettings();
  };
  const rk = $('#rk'); if (rk) rk.onclick = () => { s.apiKey = ''; save(); renderSettings(); toast('Chave removida.'); };
}

// ---------------- router ----------------
function render() {
  $$('.mainnav button').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  renderSidebar();
  ({ overview: renderOverview, item: renderItem, import: renderImport, settings: renderSettings })[state.view]?.();
}

$$('.mainnav button').forEach(b => b.onclick = () => {
  state.view = b.dataset.view;
  if (state.view === 'item' && !state.selectedId && state.items[0]) state.selectedId = state.items[0].id;
  save(); render();
});
// links internos sugeridos (relativos) são só ilustrativos — não navegar
document.addEventListener('click', e => { if (e.target.closest('a[data-rel]')) e.preventDefault(); });
applyTheme();
render();
