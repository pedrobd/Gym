// Motor de análise SEO (corre 100% no browser, sem IA).
// Focado em textos de categoria e de produto da Lidl Portugal (pt-PT).

export const STOPWORDS = new Set(`a à às ao aos as o os um uma uns umas de do da dos das dum duma em no na nos nas num numa
por pelo pela pelos pelas para pra com sem sob sobre entre até desde e ou mas nem que se como quando onde porque pois
é são ser foi foram está estão estar ter tem têm há seu sua seus suas teu tua meu minha nosso nossa este esta estes estas
esse essa esses essas aquele aquela isto isso aquilo lhe lhes te ti me mim nós vós eles elas ele ela eu tu você vocês já
mais muito muita muitos muitas pouco também só ainda cada todo toda todos todas qualquer outro outra outros outras
the and of to in for with on at by from your you our é foi será serão seja sejam pode podem vai vão ao num numa não sim
tão tal tais qual quais quem lá aqui ali então assim bem nas pelos tens temos têm precisas precisa podes posso pode
fazer faz tudo nada algo coisa coisas especial sempre nunca vez vezes agora`.split(/\s+/));

// Palavras/expressões de transição em português
const TRANSITIONS = [
  'além disso', 'além de', 'por isso', 'por exemplo', 'assim', 'deste modo', 'desta forma', 'contudo', 'no entanto',
  'porém', 'todavia', 'ainda assim', 'também', 'ou seja', 'isto é', 'primeiro', 'em primeiro lugar', 'depois',
  'por fim', 'finalmente', 'em suma', 'em resumo', 'portanto', 'logo', 'pois', 'porque', 'já que', 'visto que',
  'enquanto', 'por outro lado', 'da mesma forma', 'igualmente', 'sobretudo', 'principalmente', 'especialmente',
  'nomeadamente', 'como tal', 'consequentemente', 'mesmo assim', 'seja para', 'quer seja', 'ao mesmo tempo',
  'graças a', 'para além de', 'acima de tudo', 'em contrapartida', 'de seguida', 'em seguida', 'afinal'
];

const CTA_RE = /\b(descobre|descubra|compra|compre|encontra|encontre|aproveita|aproveite|experimenta|experimente|explora|explore|escolhe|escolha|visita|visite|garante|garanta|adiciona|adicione|v[êe] (já|agora|a nossa|as nossas|os nossos)|consulta|consulte|conhece|conheça|renova|renove|completa|complete)\b/i;

// Termos de português do Brasil que não devem aparecer num site pt-PT
const PT_BR = [
  ['você', 'tu / o cliente (ou reformular)'], ['vocês', 'vocês → tu/vós ou reformular'], ['camiseta', 't-shirt'],
  ['tênis', 'sapatilhas'], ['moletom', 'sweatshirt / camisola'], ['calcinha', 'cuecas'], ['sutiã', 'soutien'],
  ['jaqueta', 'casaco / blusão'], ['terno', 'fato'], ['regata', 'top de alças / camisola de alças'], ['meia-calça', 'collants'],
  ['bermuda', 'calções (bermudas também é usado)'], ['maiô', 'fato de banho'], ['biquíni', 'biquíni (ok) — verificar acentuação'],
  ['celular', 'telemóvel'], ['time', 'equipa'], ['ônibus', 'autocarro'], ['trem', 'comboio'], ['geladeira', 'frigorífico'],
  ['banheiro', 'casa de banho'], ['café da manhã', 'pequeno-almoço'], ['academia', 'ginásio'], ['sorvete', 'gelado'],
  ['legal', 'fixe / interessante'], ['bacana', 'fixe'], ['xícara', 'chávena'], ['suco', 'sumo'], ['grama', 'relva (se jardim)'],
  ['fato', 'facto (se significa "acontecimento")'], ['contato', 'contacto'], ['ótimo', 'ótimo (ok em pt-PT AO90)'],
  ['tela', 'ecrã'], ['mouse', 'rato'], ['usuário', 'utilizador'], ['arquivo', 'ficheiro'], ['salvar', 'guardar']
].filter(([t]) => !['biquíni', 'ótimo', 'bermuda', 'fato', 'grama'].includes(t)); // evitar falsos positivos frequentes

// Afirmações arriscadas (publicidade enganosa / exigências legais) — atenção em retalho
const RISKY = [
  /\bo melhor\b/i, /\ba melhor\b/i, /\bos melhores\b/i, /\bas melhores\b/i, /\bn[ºo.]?\s?1\b/i, /\bnúmero 1\b/i,
  /\b100\s?% (sustentável|ecológic[oa]|natural)\b/i, /\bgrátis\b/i, /\bgaranti(do|da|mos)\b/i, /\bmais barat[oa]s? do mercado\b/i,
  /\beco-?friendly\b/i, /\bamig[oa] do ambiente\b/i
];

// Léxico semântico por domínio (para a "cobertura de tópicos")
export const LEXICONS = {
  moda: ['tecido', 'algodão', 'material', 'tamanho', 'tamanhos', 'coleção', 'estilo', 'conforto', 'confortável', 'look',
    'combinar', 'peça', 'peças', 'básico', 'básicos', 'tendência', 'tendências', 'estação', 'verão', 'inverno', 'primavera',
    'outono', 'cor', 'cores', 'padrão', 'corte', 'ajuste', 'elástico', 'lavagem', 'lavar', 'máquina', 'qualidade', 'preço',
    'sustentável', 'reciclado', 'certificado', 'oeko-tex', 'dia a dia', 'ocasião', 'guarda-roupa', 'mulher', 'senhora',
    'casual', 'elegante', 'respirável', 'macio', 'suave'],
  casa: ['material', 'dimensões', 'medidas', 'resistente', 'fácil de limpar', 'design', 'decoração', 'divisão', 'sala',
    'quarto', 'cozinha', 'arrumação', 'qualidade', 'preço', 'garantia', 'montagem', 'cor', 'estilo', 'conforto', 'durável'],
  bricolage: ['potência', 'bateria', 'voltagem', 'acessórios', 'garantia', 'segurança', 'utilização', 'resistente',
    'peso', 'ergonómico', 'compatível', 'parkside', 'carregador', 'rotações', 'material', 'preço', 'qualidade', 'projeto'],
  alimentar: ['ingredientes', 'sabor', 'origem', 'fresco', 'receita', 'nutricional', 'calorias', 'proteína', 'qualidade',
    'preço', 'conservação', 'embalagem', 'porção', 'refeição', 'português', 'nacional', 'biológico', 'sem glúten', 'lanche'],
  geral: ['qualidade', 'preço', 'material', 'cor', 'tamanho', 'utilização', 'conforto', 'design', 'garantia', 'oferta']
};

export const DOMAIN_LABELS = { moda: 'Moda / têxtil (ex.: Esmara)', casa: 'Casa / decoração', bricolage: 'Bricolage / jardim', alimentar: 'Alimentar', geral: 'Geral' };

// ---------- utilitários de texto ----------
export const norm = s => (s || '').toLowerCase().normalize('NFC');
const strip = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

export function words(text) {
  return (text || '').toLowerCase().match(/[a-zà-öø-ÿ0-9]+(?:[-'][a-zà-öø-ÿ0-9]+)*/gi) || [];
}

export function sentences(text) {
  return (text || '')
    .replace(/\n+/g, '. ')
    .split(/(?<=[.!?…])\s+(?=[A-ZÀ-Ö0-9"«(])/)
    .map(s => s.trim().replace(/^[.\s]+/, ''))
    .filter(s => words(s).length > 0);
}

export function syllables(word) {
  let w = word.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
  if (!w) return 0;
  // hiatos com vogal acentuada (saúde, país, juízo) contam como sílaba extra
  const hiatus = (w.match(/[aeiou][íú]|[íú][aeiou]/g) || []).length;
  const groups = (w.match(/[aeiouáéíóúâêôãõàüy]+/g) || []).length;
  return Math.max(1, groups + hiatus);
}

// Flesch adaptado ao português (Martins et al., 1996)
export function fleschPT(text) {
  const ws = words(text);
  const ss = sentences(text);
  if (!ws.length || !ss.length) return null;
  const syl = ws.reduce((n, w) => n + syllables(w), 0);
  const v = 248.835 - 1.015 * (ws.length / ss.length) - 84.6 * (syl / ws.length);
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function fleschLabel(v) {
  if (v == null) return '—';
  if (v >= 75) return 'Muito fácil';
  if (v >= 50) return 'Fácil';
  if (v >= 25) return 'Difícil';
  return 'Muito difícil';
}

function countPhrase(textNorm, phrase) {
  const p = norm(phrase).trim();
  if (!p) return 0;
  const re = new RegExp(`(^|[^a-zà-ÿ0-9])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^a-zà-ÿ0-9])`, 'gi');
  return (textNorm.match(re) || []).length;
}

// Corresponde à keyword mesmo com pequenas variações (plural, acentos, ordem)
function looseContains(text, kw) {
  const t = strip(norm(text));
  const k = strip(norm(kw)).trim();
  if (!k) return false;
  if (t.includes(k)) return true;
  const kws = words(k).filter(w => !STOPWORDS.has(w));
  if (!kws.length) return false;
  const tw = new Set(words(t).map(stem));
  return kws.every(w => tw.has(stem(w)));
}

function stem(w) {
  return w.replace(/(oes|aes|ais|eis|is|es|s)$/, '').replace(/[ao]$/, '');
}

export function slugify(s) {
  return strip(norm(s)).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .split('-').filter(w => w && !STOPWORDS.has(w)).join('-').slice(0, 60).replace(/-+$/, '');
}

// ---------- parsing do corpo (HTML, Markdown ou texto simples) ----------
export function parseBody(raw) {
  const out = { text: '', headings: [], paragraphs: [], lists: 0, listItems: 0, links: [], bold: 0, isHtml: false };
  raw = raw || '';
  if (/<\/?(p|h[1-6]|ul|ol|li|a|strong|b|div|br)\b/i.test(raw)) {
    out.isHtml = true;
    const doc = new DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
    doc.querySelectorAll('h1,h2,h3,h4').forEach(h => out.headings.push({ level: +h.tagName[1], text: h.textContent.trim() }));
    doc.querySelectorAll('a').forEach(a => out.links.push({ text: a.textContent.trim(), href: a.getAttribute('href') || '' }));
    out.lists = doc.querySelectorAll('ul,ol').length;
    out.listItems = doc.querySelectorAll('li').length;
    out.bold = doc.querySelectorAll('strong,b').length;
    const blocks = doc.querySelectorAll('p,li');
    if (blocks.length) blocks.forEach(p => { const t = p.textContent.trim(); if (t && p.tagName === 'P') out.paragraphs.push(t); });
    doc.querySelectorAll('br').forEach(b => b.replaceWith('\n'));
    doc.querySelectorAll('p,h1,h2,h3,h4,li,div').forEach(el => el.append('\n'));
    out.text = doc.body.textContent.replace(/\n{2,}/g, '\n\n').trim();
    if (!out.paragraphs.length) out.paragraphs = out.text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    return out;
  }
  const lines = raw.split(/\r?\n/);
  const plain = [];
  let para = [];
  let inList = false;
  const flush = () => { if (para.length) { out.paragraphs.push(para.join(' ')); para = []; } };
  for (let line of lines) {
    const l = line.trim();
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flush(); inList = false; out.headings.push({ level: h[1].length, text: h[2].trim() }); plain.push(h[2]); continue; }
    const li = l.match(/^([-*•]|\d+[.)])\s+(.*)$/);
    if (li) { flush(); if (!inList) out.lists++; inList = true; out.listItems++; plain.push(li[2]); continue; }
    inList = false;
    if (!l) { flush(); plain.push(''); continue; }
    para.push(l); plain.push(l);
  }
  flush();
  let text = plain.join('\n');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, href) => { out.links.push({ text: t, href }); return t; });
  out.bold = (text.match(/\*\*[^*]+\*\*/g) || []).length;
  out.text = text.replace(/\*\*/g, '').trim();
  return out;
}

// ---------- verificações ----------
const OK = 'ok', WARN = 'warn', BAD = 'bad';

function check(id, group, label, weight, status, msg, fix = '', priority = null) {
  return { id, group, label, weight, status, msg, fix, priority: priority || (weight >= 3 ? 'alta' : weight >= 2 ? 'média' : 'baixa') };
}

export function analyze(item) {
  const type = item.type || 'categoria';
  const kw = (item.keyword || '').trim();
  const secondary = (item.secondary || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  const body = parseBody(item.body);
  const text = body.text;
  const tn = norm(text);
  const ws = words(text);
  const wc = ws.length;
  const ss = sentences(text);
  const title = (item.metaTitle || '').trim();
  const desc = (item.metaDescription || '').trim();
  const h1 = (item.h1 || '').trim() || (body.headings.find(h => h.level === 1)?.text || '');
  const brand = (item.brand || '').trim();
  const checks = [];

  // 1. Comprimento
  const [minW, idealW, maxW] = type === 'produto' ? [120, 180, 450] : [200, 300, 900];
  checks.push(wc < minW
    ? check('length', 'Conteúdo', 'Comprimento do texto', 3, BAD, `${wc} palavras — curto para uma página de ${type} (mín. recomendado ${minW}, ideal ${idealW}+).`, `Acrescenta conteúdo útil: ${type === 'produto' ? 'materiais, medidas, cuidados, utilizações e benefícios' : 'subcategorias, ocasiões de uso, dicas de estilo e uma secção de perguntas frequentes'}.`)
    : wc < idealW
      ? check('length', 'Conteúdo', 'Comprimento do texto', 3, WARN, `${wc} palavras — aceitável, mas abaixo do ideal (${idealW}+).`, 'Expande com informação que responda a dúvidas reais dos clientes.')
      : wc > maxW
        ? check('length', 'Conteúdo', 'Comprimento do texto', 3, WARN, `${wc} palavras — longo para ${type}; garante que tudo é útil e escaneável.`, 'Divide em secções com subtítulos e listas, ou move parte para um guia/blog.')
        : check('length', 'Conteúdo', 'Comprimento do texto', 3, OK, `${wc} palavras — bom comprimento para ${type}.`));

  // 2. Keyword principal
  if (!kw) {
    checks.push(check('kw', 'Palavra-chave', 'Palavra-chave principal definida', 3, BAD, 'Não definiste a palavra-chave principal — muitas verificações ficam limitadas.', 'Define a pesquisa principal (ex.: "roupa de mulher esmara", "leggings de senhora").'));
  } else {
    const kwCount = countPhrase(tn, kw);
    const kwWords = Math.max(1, words(kw).length);
    const density = wc ? (kwCount * kwWords * 100) / wc : 0;
    const first = ws.slice(0, 100).join(' ');
    checks.push(looseContains(first, kw)
      ? check('kw-intro', 'Palavra-chave', 'Keyword no início do texto', 3, OK, 'A palavra-chave aparece nas primeiras 100 palavras.')
      : check('kw-intro', 'Palavra-chave', 'Keyword no início do texto', 3, BAD, 'A palavra-chave não aparece nas primeiras 100 palavras.', `Reescreve a primeira frase para incluir "${kw}" de forma natural.`));
    checks.push(kwCount === 0
      ? check('kw-density', 'Palavra-chave', 'Densidade da keyword', 2, BAD, `"${kw}" não aparece de forma exata no texto (${looseContains(text, kw) ? 'só em variações' : 'nem em variações'}).`, 'Usa a keyword exata 2–4 vezes, mais sinónimos e variações.')
      : density > 3
        ? check('kw-density', 'Palavra-chave', 'Densidade da keyword', 2, BAD, `Densidade de ${density.toFixed(1)}% (${kwCount}×) — risco de keyword stuffing.`, 'Substitui algumas ocorrências por sinónimos ou pronomes.')
        : density < 0.5 && wc > 150
          ? check('kw-density', 'Palavra-chave', 'Densidade da keyword', 2, WARN, `Densidade de ${density.toFixed(1)}% (${kwCount}×) — baixa.`, 'Acrescenta mais 1–2 menções naturais, idealmente num subtítulo.')
          : check('kw-density', 'Palavra-chave', 'Densidade da keyword', 2, OK, `Densidade de ${density.toFixed(1)}% (${kwCount}×) — equilibrada.`));
    if (body.headings.filter(h => h.level >= 2).length) {
      const inSub = body.headings.some(h => h.level >= 2 && looseContains(h.text, kw));
      checks.push(inSub
        ? check('kw-sub', 'Palavra-chave', 'Keyword em subtítulos', 1, OK, 'Pelo menos um subtítulo (H2/H3) usa a keyword ou variação.')
        : check('kw-sub', 'Palavra-chave', 'Keyword em subtítulos', 1, WARN, 'Nenhum subtítulo usa a keyword.', 'Usa a keyword (ou variação) num H2.'));
    }
    if (secondary.length) {
      const found = secondary.filter(s => looseContains(text, s));
      const missing = secondary.filter(s => !found.includes(s));
      const r = found.length / secondary.length;
      checks.push(check('kw-sec', 'Palavra-chave', 'Keywords secundárias', 2, r >= 0.8 ? OK : r >= 0.4 ? WARN : BAD,
        `${found.length}/${secondary.length} keywords secundárias presentes.${missing.length ? ' Em falta: ' + missing.join(', ') + '.' : ''}`,
        missing.length ? `Integra naturalmente: ${missing.join(', ')}.` : ''));
    }
  }

  // 3. Meta title
  if (!title) {
    checks.push(check('title', 'Metadados', 'Meta title', 3, BAD, 'Sem meta title.', 'Escreve um título de 50–60 caracteres com a keyword no início e "| Lidl" no fim.'));
  } else {
    const issues = [];
    let st = OK;
    if (title.length > 60) { issues.push(`${title.length} caracteres — será cortado no Google (máx. ~60)`); st = WARN; }
    if (title.length < 30) { issues.push(`${title.length} caracteres — curto, desperdiça espaço`); st = WARN; }
    if (kw && !looseContains(title, kw)) { issues.push('não contém a keyword'); st = BAD; }
    else if (kw && strip(norm(title)).indexOf(strip(norm(words(kw)[0] || ''))) > 25) { issues.push('a keyword aparece tarde no título'); if (st === OK) st = WARN; }
    if (!/lidl/i.test(title)) { issues.push('não termina com a marca "Lidl"'); if (st === OK) st = WARN; }
    checks.push(check('title', 'Metadados', 'Meta title', 3, st, issues.length ? `"${title}" — ${issues.join('; ')}.` : `"${title}" (${title.length} car.) — bem otimizado.`, issues.length ? 'Formato sugerido: "Keyword principal | Benefício ou marca | Lidl".' : ''));
  }

  // 4. Meta description
  if (!desc) {
    checks.push(check('desc', 'Metadados', 'Meta description', 2, BAD, 'Sem meta description.', 'Escreve 120–155 caracteres com a keyword, um benefício e um apelo à ação.'));
  } else {
    const issues = [];
    let st = OK;
    if (desc.length > 158) { issues.push(`${desc.length} caracteres — será cortada (máx. ~155)`); st = WARN; }
    if (desc.length < 110) { issues.push(`${desc.length} caracteres — curta`); st = WARN; }
    if (kw && !looseContains(desc, kw)) { issues.push('não contém a keyword'); st = BAD; }
    if (!CTA_RE.test(desc)) { issues.push('sem apelo à ação (ex.: "Descobre", "Compra")'); if (st === OK) st = WARN; }
    if (title && norm(desc) === norm(title)) { issues.push('igual ao título'); st = BAD; }
    checks.push(check('desc', 'Metadados', 'Meta description', 2, st, issues.length ? issues.join('; ') + '.' : `${desc.length} caracteres, com keyword e CTA — bem otimizada.`, issues.length ? 'Estrutura: o que é + benefício/diferenciador + CTA.' : ''));
  }

  // 5. H1
  if (!h1) {
    checks.push(check('h1', 'Estrutura', 'H1', 3, BAD, 'Sem H1 definido.', 'Cada página deve ter um único H1 com a keyword principal.'));
  } else {
    const issues = [];
    let st = OK;
    if (kw && !looseContains(h1, kw)) { issues.push('não contém a keyword'); st = BAD; }
    if (h1.length > 70) { issues.push('muito longo'); if (st === OK) st = WARN; }
    if (body.headings.filter(h => h.level === 1).length > 1) { issues.push('há mais do que um H1 no corpo'); st = BAD; }
    checks.push(check('h1', 'Estrutura', 'H1', 3, st, issues.length ? `"${h1}" — ${issues.join('; ')}.` : `"${h1}" — correto.`, issues.length ? 'Um H1 curto, descritivo e com a keyword.' : ''));
  }

  // 6. Subtítulos
  const subs = body.headings.filter(h => h.level >= 2);
  if (wc > 250) {
    const per = subs.length ? wc / (subs.length + 1) : wc;
    checks.push(!subs.length
      ? check('subs', 'Estrutura', 'Subtítulos (H2/H3)', 2, BAD, 'Texto longo sem subtítulos — difícil de ler e de interpretar pelo Google.', 'Divide em secções com H2 (ex.: "Como escolher…", "Materiais e cuidados", "Perguntas frequentes").')
      : per > 300
        ? check('subs', 'Estrutura', 'Subtítulos (H2/H3)', 2, WARN, `${subs.length} subtítulos para ${wc} palavras — secções longas (~${Math.round(per)} palavras).`, 'Acrescenta um subtítulo a cada 150–300 palavras.')
        : check('subs', 'Estrutura', 'Subtítulos (H2/H3)', 2, OK, `${subs.length} subtítulos — boa estrutura.`));
  }

  // 7. Parágrafos
  const longParas = body.paragraphs.filter(p => words(p).length > 120);
  if (body.paragraphs.length) {
    checks.push(longParas.length
      ? check('paras', 'Legibilidade', 'Tamanho dos parágrafos', 1, WARN, `${longParas.length} parágrafo(s) com mais de 120 palavras.`, 'Parte parágrafos longos em blocos de 2–4 frases.')
      : check('paras', 'Legibilidade', 'Tamanho dos parágrafos', 1, OK, 'Parágrafos com tamanho adequado.'));
  }

  // 8. Frases longas
  if (ss.length) {
    const long = ss.filter(s => words(s).length > 25);
    const pct = (long.length / ss.length) * 100;
    checks.push(check('sent', 'Legibilidade', 'Frases longas', 2, pct > 30 ? BAD : pct > 20 ? WARN : OK,
      `${Math.round(pct)}% das frases têm mais de 25 palavras (${long.length}/${ss.length}).`,
      pct > 20 ? 'Encurta as frases mais longas: ' + long.slice(0, 2).map(s => `"${s.slice(0, 80)}…"`).join(' ') : ''));
  }

  // 9. Flesch
  const flesch = fleschPT(text);
  if (flesch != null) {
    checks.push(check('flesch', 'Legibilidade', 'Índice de legibilidade (Flesch PT)', 2, flesch >= 50 ? OK : flesch >= 35 ? WARN : BAD,
      `${flesch}/100 — ${fleschLabel(flesch)}.`, flesch < 50 ? 'Usa frases mais curtas e palavras mais simples. Alvo para retalho: 50+.' : ''));
  }

  // 10. Voz passiva
  if (ss.length) {
    const passive = ss.filter(s => /\b(é|são|foi|foram|ser|será|serão|é|está|estão|sido|seja|sejam)\s+(\w+\s+)?\w+(ad|id)[oa]s?\b/i.test(s));
    const pct = (passive.length / ss.length) * 100;
    checks.push(check('passive', 'Legibilidade', 'Voz passiva', 1, pct > 15 ? WARN : OK, `${Math.round(pct)}% das frases parecem estar na voz passiva.`, pct > 15 ? 'Prefere voz ativa: "Lavas na máquina a 30 °C" em vez de "Pode ser lavado…".' : ''));
  }

  // 11. Transições
  if (ss.length >= 4) {
    const withT = ss.filter(s => TRANSITIONS.some(t => countPhrase(norm(s), t)));
    const pct = (withT.length / ss.length) * 100;
    checks.push(check('trans', 'Legibilidade', 'Palavras de transição', 1, pct >= 20 ? OK : WARN, `${Math.round(pct)}% das frases usam conectores (alvo ≥ 20%).`, pct < 20 ? 'Usa conectores como "além disso", "por isso", "por exemplo", "assim".' : ''));
  }

  // 12. Inícios repetidos
  if (ss.length >= 3) {
    let rep = 0;
    for (let i = 2; i < ss.length; i++) {
      const f = s => words(s)[0];
      if (f(ss[i]) && f(ss[i]) === f(ss[i - 1]) && f(ss[i]) === f(ss[i - 2])) rep++;
    }
    if (rep) checks.push(check('rep', 'Legibilidade', 'Frases com início repetido', 1, WARN, `${rep} sequência(s) de 3+ frases a começar pela mesma palavra.`, 'Varia o início das frases.'));
  }

  // 13. CTA
  checks.push(CTA_RE.test(text)
    ? check('cta', 'Conversão', 'Apelo à ação no texto', 1, OK, 'O texto tem um apelo à ação.')
    : check('cta', 'Conversão', 'Apelo à ação no texto', 1, WARN, 'Sem apelo à ação no corpo do texto.', 'Termina com um CTA: "Descobre a coleção…", "Compra online ou na tua loja Lidl".'));

  // 14. Links internos
  const internal = body.links.filter(l => !/^https?:\/\//i.test(l.href) || /lidl\./i.test(l.href));
  const genericAnchors = body.links.filter(l => /^(aqui|clique aqui|clica aqui|ver mais|saber mais|link)$/i.test(l.text.trim()));
  const needLinks = type === 'categoria' ? 2 : 1;
  checks.push(internal.length >= needLinks
    ? check('links', 'Estrutura', 'Links internos', 2, genericAnchors.length ? WARN : OK, `${internal.length} link(s) interno(s).${genericAnchors.length ? ' Âncoras genéricas: ' + genericAnchors.map(l => `"${l.text}"`).join(', ') + '.' : ''}`, genericAnchors.length ? 'Usa âncoras descritivas com keyword (ex.: "leggings de desporto").' : '')
    : check('links', 'Estrutura', 'Links internos', 2, internal.length ? WARN : BAD, `${internal.length} link(s) interno(s) — recomendado ${needLinks}+ para ${type}.`, type === 'categoria' ? 'Liga a subcategorias e categorias relacionadas com âncoras descritivas (ex.: "vestidos de verão", "pijamas de senhora").' : 'Liga à categoria-mãe e a produtos complementares.'));

  // 15. Listas
  if (wc > 150) {
    checks.push(body.listItems >= 3
      ? check('lists', 'Estrutura', 'Listas / bullet points', 1, OK, `${body.listItems} itens em lista — conteúdo escaneável.`)
      : check('lists', 'Estrutura', 'Listas / bullet points', 1, WARN, 'Sem listas — o texto é menos escaneável.', type === 'produto' ? 'Lista as características principais (material, tamanhos, cuidados).' : 'Usa uma lista para subcategorias, vantagens ou dicas.'));
  }

  // 16. Marca
  if (brand) {
    const occ = text.match(new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || [];
    const forms = new Set(occ);
    checks.push(!occ.length
      ? check('brand', 'Marca', `Menção à marca ${brand}`, 2, BAD, `A marca "${brand}" não é mencionada no texto.`, `Menciona "${brand}" no 1.º parágrafo e associa-a à proposta de valor (qualidade a preço Lidl).`)
      : forms.size > 1
        ? check('brand', 'Marca', `Menção à marca ${brand}`, 2, WARN, `A marca aparece escrita de formas diferentes: ${[...forms].map(f => `"${f}"`).join(', ')}.`, 'Usa sempre a mesma grafia da marca, conforme o guia de marca.')
        : check('brand', 'Marca', `Menção à marca ${brand}`, 2, OK, `"${brand}" mencionada ${occ.length}× de forma consistente.`));
  }

  // 17. Atributos / cobertura de informação
  const attrs = type === 'produto'
    ? [['material/composição', /algodão|poliéster|elastano|viscose|linho|lã|nylon|poliamida|material|composição|\d+\s?%/i],
      ['tamanhos/medidas', /tamanho|tamanhos|\b(xs|s|m|l|xl|xxl)\b|\b\d{2}[–-]\d{2}\b|medidas|cm\b/i],
      ['cuidados/lavagem', /lav(ar|agem|ável)|máquina|°c|ºc|passar a ferro|secar/i],
      ['benefício/utilização', /ideal para|perfeit[oa] para|confort|prátic|versátil|dia a dia|ocasião|utiliza/i],
      ['cor/variantes', /cor(es)?\b|preto|branco|azul|bege|cinzento|rosa|verde|vermelho|padrão|estampad/i]]
    : [['subcategorias/variedade', /(vestidos|calças|blusas|t-shirts|leggings|pijamas|casacos|saias|camisolas|lingerie|calçado|acessórios|jeans)/i],
      ['ocasiões/estação', /verão|inverno|primavera|outono|dia a dia|trabalho|festa|desporto|casual|ocasião/i],
      ['proposta de valor (preço/qualidade)', /preço|qualidade|acessível|económic|baixo custo|vale a pena/i],
      ['público-alvo', /mulher|senhora|homem|criança|bebé|família|para (ela|ele|todos)/i],
      ['disponibilidade (loja/online)', /loja|online|lidl\.pt|semana|folheto|disponível|stock|enquanto durar/i]];
  const missingAttrs = attrs.filter(([, re]) => !re.test(text)).map(([l]) => l);
  checks.push(check('attrs', 'Conteúdo', type === 'produto' ? 'Informação de produto' : 'Cobertura da categoria', 3,
    missingAttrs.length === 0 ? OK : missingAttrs.length <= 2 ? WARN : BAD,
    missingAttrs.length ? `Em falta: ${missingAttrs.join(', ')}.` : 'Cobre os pontos essenciais.',
    missingAttrs.length ? `Acrescenta informação sobre ${missingAttrs.join(', ')} — responde ao que o cliente procura antes de comprar.` : ''));

  // 18. Cobertura semântica
  const lex = LEXICONS[item.domain || 'moda'] || LEXICONS.geral;
  const lexFound = lex.filter(t => countPhrase(tn, t) > 0);
  const lexMissing = lex.filter(t => !lexFound.includes(t));
  const cov = lexFound.length / lex.length;
  checks.push(check('semantic', 'Conteúdo', 'Cobertura semântica (termos relacionados)', 2, cov >= 0.25 ? OK : cov >= 0.12 ? WARN : BAD,
    `${lexFound.length}/${lex.length} termos do domínio "${DOMAIN_LABELS[item.domain || 'moda']}" presentes.`,
    cov < 0.25 ? 'Considera incluir (quando fizer sentido): ' + lexMissing.slice(0, 12).join(', ') + '.' : ''));

  // 19. FAQ
  if (type === 'categoria') {
    const hasFaq = /perguntas frequentes|faq/i.test(text) || (text.match(/\?/g) || []).length >= 2;
    checks.push(hasFaq
      ? check('faq', 'Conteúdo', 'Perguntas frequentes', 1, OK, 'Tem perguntas/respostas — bom para featured snippets e "As pessoas também perguntam".')
      : check('faq', 'Conteúdo', 'Perguntas frequentes', 1, WARN, 'Sem secção de perguntas frequentes.', 'Acrescenta 3–5 FAQs reais (ex.: "Que tamanhos estão disponíveis?", "Como lavar…?").'));
  }

  // 20. pt-BR
  const brFound = PT_BR.filter(([t]) => new RegExp(`(^|[^\\p{L}])${t}s?(?![\\p{L}])`, 'iu').test(tn));
  checks.push(brFound.length
    ? check('ptbr', 'Linguagem', 'Português de Portugal', 2, BAD, `Termos de português do Brasil: ${brFound.map(([t, r]) => `"${t}" → ${r}`).join('; ')}.`, 'O site é pt-PT: usa o vocabulário de Portugal (afeta confiança e correspondência com as pesquisas locais).')
    : check('ptbr', 'Linguagem', 'Português de Portugal', 2, OK, 'Sem termos de pt-BR detetados.'));

  // 21. Afirmações arriscadas / tom
  const risky = RISKY.map(r => (text.match(r) || [])[0]).filter(Boolean);
  const excl = (text.match(/!/g) || []).length;
  const caps = (text.match(/\b[A-ZÀ-Ö]{5,}\b/g) || []).filter(w => !/^(LIDL|ESMARA|OEKO|TEX|LIVERGY|PARKSIDE|SILVERCREST|CRIVIT|LUPILU|PEPPERTS|MELINERA|ERNESTO|LIVARNO)$/i.test(w));
  const toneIssues = [];
  if (risky.length) toneIssues.push(`afirmações a validar juridicamente: ${[...new Set(risky)].map(r => `"${r}"`).join(', ')}`);
  if (excl > 2) toneIssues.push(`${excl} pontos de exclamação`);
  if (caps.length) toneIssues.push(`palavras em maiúsculas: ${[...new Set(caps)].slice(0, 5).join(', ')}`);
  checks.push(check('tone', 'Linguagem', 'Tom e afirmações', 1, toneIssues.length ? WARN : OK, toneIssues.length ? toneIssues.join('; ') + '.' : 'Tom adequado, sem afirmações absolutas.', toneIssues.length ? 'Evita superlativos sem prova e alegações ambientais genéricas (greenwashing); usa certificações concretas (ex.: OEKO-TEX®).' : ''));

  // 22. Slug
  if (item.slug) {
    const s = item.slug.trim().replace(/^https?:\/\/[^/]+/i, '').replace(/^\/|\/$/g, '').split('/').pop();
    const issues = [];
    if (/[A-Z]/.test(s)) issues.push('tem maiúsculas');
    if (/[^\x00-\x7F]/.test(s)) issues.push('tem acentos/caracteres especiais');
    if (/_|\s/.test(s)) issues.push('usa "_" ou espaços em vez de "-"');
    if (s.length > 60) issues.push('muito longo');
    if (kw && !looseContains(s.replace(/-/g, ' '), kw)) issues.push('não contém a keyword');
    checks.push(check('slug', 'Metadados', 'URL / slug', 1, issues.length ? WARN : OK, issues.length ? `"${s}" — ${issues.join('; ')}.` : `"${s}" — limpo e descritivo.`, issues.length ? `Sugestão: /${slugify(kw || item.name)}` : ''));
  }

  // ---------- pontuação ----------
  const total = checks.reduce((n, c) => n + c.weight, 0);
  const got = checks.reduce((n, c) => n + c.weight * (c.status === OK ? 1 : c.status === WARN ? 0.5 : 0), 0);
  const score = total ? Math.round((got / total) * 100) : 0;
  const groups = {};
  checks.forEach(c => {
    groups[c.group] ||= { total: 0, got: 0 };
    groups[c.group].total += c.weight;
    groups[c.group].got += c.weight * (c.status === OK ? 1 : c.status === WARN ? 0.5 : 0);
  });
  Object.values(groups).forEach(g => g.score = Math.round((g.got / g.total) * 100));

  return {
    score, checks, groups,
    stats: {
      words: wc, sentences: ss.length, paragraphs: body.paragraphs.length, headings: body.headings.length,
      links: body.links.length, listItems: body.listItems, flesch, readingTime: Math.max(1, Math.round(wc / 220)),
      avgSentence: ss.length ? +(wc / ss.length).toFixed(1) : 0
    },
    body, h1, topTerms: topTerms(text, 15)
  };
}

// ---------- termos, comparação com concorrência, duplicados ----------
export function topTerms(text, n = 20) {
  const ws = words(text).filter(w => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
  const freq = new Map();
  ws.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
  for (let i = 0; i < ws.length - 1; i++) {
    const bg = ws[i] + ' ' + ws[i + 1];
    freq.set(bg, (freq.get(bg) || 0) + 1);
  }
  return [...freq.entries()]
    .filter(([t, c]) => (t.includes(' ') ? c >= 2 : true))
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, n)
    .map(([term, count]) => ({ term, count }));
}

export function compareCompetitors(item, competitors) {
  const own = parseBody(item.body).text;
  const ownStems = new Set(words(own).map(stem));
  const ownNorm = strip(norm(own));
  const rows = competitors.filter(c => (c.text || '').trim()).map(c => {
    const parsed = parseBody(c.text);
    const t = parsed.text;
    return {
      name: c.name || 'Concorrente', words: words(t).length, flesch: fleschPT(t),
      headings: parsed.headings.length, links: parsed.links.length, listItems: parsed.listItems,
      faq: /perguntas frequentes|faq/i.test(t) || (t.match(/\?/g) || []).length >= 2,
      headingTexts: parsed.headings.map(h => h.text), text: t
    };
  });
  if (!rows.length) return null;
  // termos que aparecem nos concorrentes e não no texto próprio
  const agg = new Map();
  rows.forEach(r => {
    const seen = new Set();
    topTerms(r.text, 60).forEach(({ term, count }) => {
      const missing = term.includes(' ') ? !ownNorm.includes(strip(term)) : !ownStems.has(stem(term));
      if (!missing) return;
      const e = agg.get(term) || { term, count: 0, sources: 0 };
      e.count += count;
      if (!seen.has(term)) { e.sources++; seen.add(term); }
      agg.set(term, e);
    });
  });
  const gaps = [...agg.values()].sort((a, b) => b.sources - a.sources || b.count - a.count).slice(0, 25);
  const ownParsed = parseBody(item.body);
  const ownRow = { name: 'O teu texto', words: words(own).length, flesch: fleschPT(own), headings: ownParsed.headings.length, links: ownParsed.links.length, listItems: ownParsed.listItems, faq: /perguntas frequentes|faq/i.test(own) || (own.match(/\?/g) || []).length >= 2 };
  const avgWords = Math.round(rows.reduce((n, r) => n + r.words, 0) / rows.length);
  const insights = [];
  if (ownRow.words < avgWords * 0.7) insights.push(`Os concorrentes têm em média ${avgWords} palavras; o teu texto tem ${ownRow.words}. Há espaço para aprofundar o conteúdo.`);
  if (rows.some(r => r.faq) && !ownRow.faq) insights.push('Pelo menos um concorrente tem perguntas frequentes — o teu texto não.');
  if (rows.some(r => r.headings > ownRow.headings + 1)) insights.push('Os concorrentes estruturam melhor o texto com subtítulos.');
  if (rows.some(r => r.listItems >= 3) && ownRow.listItems < 3) insights.push('Os concorrentes usam listas para tornar o conteúdo escaneável.');
  if (rows.some(r => r.links > ownRow.links)) insights.push('Os concorrentes usam mais links internos para subcategorias.');
  if (gaps.length) insights.push(`Termos que os concorrentes usam e tu não: ${gaps.slice(0, 8).map(g => g.term).join(', ')}.`);
  return { rows: [ownRow, ...rows], gaps, insights };
}

function shingles(text, k = 5) {
  const ws = words(text);
  const set = new Set();
  for (let i = 0; i <= ws.length - k; i++) set.add(ws.slice(i, i + k).join(' '));
  return set;
}

export function similarity(a, b) {
  const A = shingles(a), B = shingles(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach(s => { if (B.has(s)) inter++; });
  return inter / Math.min(A.size, B.size);
}

// Visão geral de todos os textos
export function overview(items) {
  const analyses = items.map(it => ({ item: it, a: analyze(it) }));
  const issueCount = new Map();
  analyses.forEach(({ a }) => a.checks.filter(c => c.status !== OK).forEach(c => {
    const e = issueCount.get(c.id) || { id: c.id, label: c.label, group: c.group, bad: 0, warn: 0, weight: c.weight, items: [] };
    e[c.status === BAD ? 'bad' : 'warn']++;
    e.items.push(a);
    issueCount.set(c.id, e);
  }));
  const issues = [...issueCount.values()].map(e => ({ ...e, impact: e.weight * (e.bad + e.warn * 0.5) })).sort((a, b) => b.impact - a.impact);

  const duplicates = [];
  for (let i = 0; i < analyses.length; i++) for (let j = i + 1; j < analyses.length; j++) {
    const s = similarity(analyses[i].a.body.text, analyses[j].a.body.text);
    if (s >= 0.15) duplicates.push({ a: analyses[i].item, b: analyses[j].item, sim: s });
  }
  const byKw = new Map();
  items.forEach(it => { const k = strip(norm(it.keyword || '')).trim(); if (k) byKw.set(k, [...(byKw.get(k) || []), it]); });
  const cannibal = [...byKw.entries()].filter(([, list]) => list.length > 1).map(([kw, list]) => ({ kw, list }));
  const titles = new Map();
  items.forEach(it => { const t = norm(it.metaTitle || '').trim(); if (t) titles.set(t, [...(titles.get(t) || []), it]); });
  const dupTitles = [...titles.entries()].filter(([, l]) => l.length > 1).map(([t, list]) => ({ t, list }));

  const avg = analyses.length ? Math.round(analyses.reduce((n, x) => n + x.a.score, 0) / analyses.length) : 0;
  const avgWords = analyses.length ? Math.round(analyses.reduce((n, x) => n + x.a.stats.words, 0) / analyses.length) : 0;
  const fl = analyses.map(x => x.a.stats.flesch).filter(v => v != null);
  const avgFlesch = fl.length ? Math.round(fl.reduce((a, b) => a + b, 0) / fl.length) : null;
  return { analyses, issues, duplicates, cannibal, dupTitles, avg, avgWords, avgFlesch };
}

// Rascunho automático (sem IA): aplica correções mecânicas e acrescenta estrutura em falta
export function autoDraft(item, analysis) {
  const kw = (item.keyword || item.name || '').trim();
  const brand = (item.brand || '').trim();
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  let body = analysis.body.text;
  // "você/vocês" exige reformular a frase — fica assinalado na análise, não é substituído automaticamente
  PT_BR.filter(([t]) => !t.startsWith('você')).forEach(([t, r]) => {
    const rep = r.split(/ \/ | \(/)[0];
    body = body.replace(new RegExp(`(^|[^\\p{L}])(${t})(s?)(?![\\p{L}])`, 'giu'), (_, pre, m, pl) => pre + (m[0] === m[0].toUpperCase() ? cap(rep) : rep) + pl);
  });
  body = body.replace(/(^|[^\p{L}])para você/giu, '$1para ti').replace(/(^|[^\p{L}])Visite\b/gu, '$1Visita');
  const paras = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const failed = id => analysis.checks.find(c => c.id === id && c.status !== OK);
  const out = [];
  if (failed('kw-intro') && kw) out.push(`Descobre a nossa seleção de ${kw}${brand ? ` ${brand}` : ''} no Lidl: qualidade a preço Lidl, para o teu dia a dia.`);
  paras.forEach((p, i) => {
    if (words(p).length > 120) {
      const ss = sentences(p);
      const mid = Math.ceil(ss.length / 2);
      out.push(ss.slice(0, mid).join(' '), ss.slice(mid).join(' '));
    } else out.push(p);
    if (i === 0 && failed('subs') && paras.length > 2) out.push(`## ${cap(kw)}: como escolher`);
  });
  if (failed('faq')) {
    out.push('## Perguntas frequentes',
      `**Que tamanhos estão disponíveis em ${kw}?**\n[Responder com a gama de tamanhos.]`,
      `**Como devo lavar e cuidar destas peças?**\n[Indicar temperatura e cuidados.]`,
      `**Posso comprar ${kw} online?**\n[Indicar disponibilidade em loja e em lidl.pt.]`);
  }
  if (failed('cta')) out.push(`Descobre ${brand ? `a coleção ${brand}` : `a nossa seleção de ${kw}`} na tua loja Lidl ou em lidl.pt.`);
  const title = `${cap(kw)}${brand && !norm(kw).includes(norm(brand)) ? ' ' + brand : ''} | Lidl`;
  const descBase = `Descobre ${kw}${brand && !norm(kw).includes(norm(brand)) ? ' ' + brand : ''} no Lidl: peças confortáveis e com estilo para o dia a dia, a preço Lidl. Compra já na tua loja ou online.`;
  return {
    meta_title: title.length > 60 ? `${cap(kw)} | Lidl` : title.length < 35 ? title.replace(/ \| Lidl$/, ': conforto e estilo | Lidl') : title,
    meta_description: descBase.length > 155 ? descBase.slice(0, 152).replace(/\s+\S*$/, '') + '…' : descBase,
    h1: cap(kw),
    slug: '/' + slugify(kw),
    corpo: out.join('\n\n'),
    faq: []
  };
}
