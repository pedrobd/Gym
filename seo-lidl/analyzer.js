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
  ['celular', 'telemóvel'], ['ônibus', 'autocarro'], ['trem', 'comboio'], ['geladeira', 'frigorífico'],
  ['banheiro', 'casa de banho'], ['café da manhã', 'pequeno-almoço'], ['sorvete', 'gelado'],
  ['bacana', 'fixe'], ['xícara', 'chávena'], ['suco', 'sumo'], ['contato', 'contacto'],
  ['mouse', 'rato'], ['usuário', 'utilizador'], ['salvar', 'guardar'], ['shorts', 'calções'], ['sunga', 'calções de banho']
];

// Afirmações arriscadas (publicidade enganosa) — as alegações ambientais têm verificação própria (llm-green)
const RISKY = [
  /(?<![\p{L}])(o|a|os|as) melhor(es)?(?![\p{L}])/iu, /\bn[ºo.]?\s?1\b/i, /número 1/i, /mais barat[oa]s? do mercado/i
];

// ---------- GEO / LLM: factos verificáveis, certificações, linguagem vaga ----------
const NA = '(?![\\p{L}\\d])';
const FACT_RE = new RegExp(`\\d+(?:[.,]\\d+)?\\s?(?:%|°\\s?C|º\\s?C|cm|mm|kg|g|ml|l|W|V|mAh|anos?|meses|dias|peças|unid\\.?|€|euros?)${NA}`, 'giu');
const SIZE_RE = /\b(?:XXS|XS|S|M|L|XL|XXL|3XL)\b\s?(?:\(\d{2}\/\d{2}\)\s?)?(?:a|até|–|-)\s?\b(?:XS|S|M|L|XL|XXL|3XL)\b|\b(?:3[2-9]|4\d|5[0-6])\/(?:3[2-9]|4\d|5[0-6])\b/g;
const CERT_RE = /OEKO-?TEX|STANDARD 100|MADE IN GREEN|GOTS|Better Cotton|\bBCI\b|Fairtrade|\bFSC\b|EU Ecolabel|Rótulo Ecológico|bluesign|\bGRS\b|Global Recycled Standard|\bRCS\b|Grüner Knopf|ISO \d{3,5}/i;
export const factCount = t => (t.match(FACT_RE) || []).length + (t.match(SIZE_RE) || []).length + (t.match(new RegExp(CERT_RE.source, 'gi')) || []).length;
const GREEN_RE = /(sustent[áa]ve(l|is)|ecol[óo]gic[oa]s?|amig[oa]s? do ambiente|eco-?friendly|biodegrad[áa]ve(l|is)|neutr[oa]s? em carbono|carbono neutro|respons[áa]ve(l|is)|consciente|mais verde)/i;
const GREEN_OK_RE = /\d+\s?%\s?(de\s)?(algodão|poliéster|poliamida|material|fibras?)?\s?(reciclad|orgânic|biológic)/i;
const FLUFF_RE = /(máximo conforto|qualidade (excecional|superior|premium)|alta qualidade|incrível|fantástic\w*|inigualável|imperdível|sem igual|sinónimo de|e muito mais|todas as ocasiões|para todos os gostos|a pensar em ti|experiência única|design moderno|estilo único|(?<![\p{L}])(o|a|os|as) melhor(es)?(?![\p{L}]))/giu;
const PLACEHOLDER_RE = /\[(indicar|responder|confirmar|inserir|preencher)[^\]]*\]|\bXX+\b|lorem ipsum|\bTODO\b/i;
const Q_RE = /^\s*(?:#{2,4}\s*|\*\*|<h[2-4][^>]*>\s*|<strong>\s*)?(como|qual|quais|que|quanto|quantos|quantas|onde|quando|posso|pode|devo|há|existe|existem|é|são|tem|têm|porquê|por que)\b[^?\n]{5,140}\?/gimu;

// Léxico semântico por domínio (para a "cobertura de tópicos")
export const LEXICONS = {
  moda: ['tecido', 'algodão', 'material', 'tamanho', 'tamanhos', 'coleção', 'estilo', 'conforto', 'confortável', 'look',
    'combinar', 'peça', 'peças', 'básico', 'básicos', 'tendência', 'tendências', 'estação', 'verão', 'inverno', 'primavera',
    'outono', 'cor', 'cores', 'padrão', 'corte', 'ajuste', 'elástico', 'lavagem', 'lavar', 'máquina', 'qualidade', 'preço',
    'composição', 'certificado', 'oeko-tex', 'dia a dia', 'ocasião', 'guarda-roupa', 'mulher', 'senhora',
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

// ---------- IA / LLM (GEO / AEO) ----------
// Baseado em: GEO (Aggarwal et al., KDD 2024 — factos/estatísticas/fontes aumentam a citação em respostas generativas),
// guia do Google para funcionalidades de IA (AI Overviews/AI Mode = SEO de base + conteúdo claro), estudos de citação de
// LLMs (resposta no início da página, frescura), feeds de compras em IA (atributos completos) e Diretiva UE 2024/825.
export const LLM = 'IA / LLM';

export function qaPairs(raw) {
  const lines = String(raw || '').replace(/<\/(p|h[1-6]|li|div)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').split(/\n/);
  const pairs = [];
  lines.forEach((l, i) => {
    Q_RE.lastIndex = 0;
    const m = Q_RE.exec(l);
    if (!m) return;
    const q = m[0].replace(/^[\s#*]+/, '').trim();
    // resposta: resto da linha + linhas seguintes até à próxima pergunta/subtítulo
    let ans = l.slice(m.index + m[0].length).replace(/^\**\s*/, '');
    for (let j = i + 1; j < lines.length && words(ans).length < 60; j++) {
      Q_RE.lastIndex = 0;
      if (Q_RE.test(lines[j]) || /^\s*#/.test(lines[j])) break;
      ans += ' ' + lines[j];
    }
    ans = ans.trim();
    pairs.push({ q, a: ans, answered: words(ans).length >= 8 && !/^\[/.test(ans) });
  });
  return pairs;
}

function llmChecks({ item, type, kw, brand, h1, text, ws, wc, ss, body }) {
  const out = [];
  const add = (id, label, weight, status, msg, fix = '') => out.push(check(id, LLM, label, weight, status, msg, fix));
  const first50 = ws.slice(0, 50).join(' ');
  const first50raw = text.split(/\s+/).slice(0, 60).join(' ');
  const subject = kw || h1 || item.name || '';

  // 1. Resposta direta no início
  const A = subject && looseContains(first50, subject);
  const B = /(?<![\p{L}])(são|é|inclui|incluem|reúne|encontras|tens|disponíve(l|is)|feit[oa]s? (de|em)|com)(?![\p{L}])/iu.test(first50);
  const C = factCount(first50raw) >= 1 || /algodão|poliéster|elastano|linho|viscose|tamanho|ideal para|cintura|inverno|verão/i.test(first50);
  add('llm-answer-first', 'Resposta direta no início', 3, A && B && C ? OK : A ? WARN : BAD,
    A && B && C ? 'As primeiras frases dizem logo o que é, para quem e com factos — fácil de citar por um assistente de IA.'
      : A ? 'O tema aparece no início, mas sem resposta concreta (o que é + factos).' : 'As primeiras frases não respondem diretamente a "o que é / o que encontro aqui".',
    A && B && C ? '' : `Abre com 1–2 frases autónomas: o quê + para quem + 1–2 factos. Ex.: «As leggings de senhora Esmara têm cintura alta e 95% algodão, em tamanhos S a XL.»`);

  // 2. Entidades explícitas
  const firstTwo = ss.slice(0, 2).join(' ');
  const head = words(kw || h1)[0];
  const ent = [brand && norm(firstTwo).includes(norm(brand)), /lidl/i.test(firstTwo), head && words(firstTwo).some(w => stem(w) === stem(head))].filter(Boolean).length;
  add('llm-entities', 'Entidades explícitas (marca, Lidl, tipo de produto)', 2, ent >= 3 ? OK : ent === 2 ? WARN : BAD,
    `${ent}/3 entidades nas 2 primeiras frases (marca${brand ? ` "${brand}"` : ''}, Lidl, tipo de produto).`,
    ent >= 3 ? '' : `Nomeia a marca, o Lidl e o tipo de produto juntos: «${brand || 'A marca'}, a marca própria de ${type === 'produto' ? 'moda' : 'moda de senhora'} do Lidl…». Os LLMs associam entidades que aparecem juntas.`);

  // 3. Densidade factual
  const facts = factCount(text);
  const fd = wc ? (facts / wc) * 100 : 0;
  const [okF, warnF] = type === 'produto' ? [3, 1.5] : [1.5, 0.7];
  add('llm-facts', 'Densidade factual (números, medidas, %)', 3, fd >= okF ? OK : fd >= warnF ? WARN : BAD,
    `${facts} facto(s) verificável(eis) — ${fd.toFixed(1)} por 100 palavras (alvo ≥ ${okF}).`,
    fd >= okF ? '' : 'Acrescenta dados da ficha técnica (composição em %, gama de tamanhos, °C de lavagem, n.º de peças, medidas). Estatísticas e factos aumentam a probabilidade de citação em respostas de IA. Nunca inventes números.');

  // 4. Certificações
  if (['moda', 'casa', 'alimentar'].includes(item.domain || 'moda')) {
    add('llm-cert', 'Certificações / provas verificáveis', 2, CERT_RE.test(text) ? OK : WARN,
      CERT_RE.test(text) ? `Menciona certificação (${text.match(CERT_RE)[0]}).` : 'Sem certificações ou provas verificáveis.',
      CERT_RE.test(text) ? '' : 'Se o produto tem certificação (ex.: OEKO-TEX® STANDARD 100 com o n.º do certificado), menciona-a. Não inventes — confirma na ficha técnica.');
  }

  // 5. Alegações ambientais (Diretiva UE 2024/825, aplicável desde 27/09/2026)
  const greenBad = ss.filter(s => GREEN_RE.test(s) && !CERT_RE.test(s) && !GREEN_OK_RE.test(s));
  if (ss.some(s => GREEN_RE.test(s))) {
    add('llm-green', 'Alegações ambientais concretas (Diretiva UE 2024/825)', 3, greenBad.length ? BAD : OK,
      greenBad.length ? `Alegação ambiental genérica, proibida desde 27/09/2026: «${greenBad[0].slice(0, 110)}».` : 'As alegações ambientais são específicas e/ou certificadas.',
      greenBad.length ? 'Substitui por um facto específico e certificado: «60% poliéster reciclado (certificado GRS)». Os assistentes de IA também desvalorizam alegações vagas.' : '');
  }

  // 6. Bloco de perguntas e respostas
  const pairs = qaPairs(item.body);
  const answered = pairs.filter(p => p.answered).length;
  const qaStatus = type === 'categoria' ? (answered >= 3 ? OK : answered >= 1 ? WARN : BAD) : (answered >= 2 ? OK : WARN);
  add('llm-qa', 'Perguntas e respostas', 2, qaStatus,
    `${answered} pergunta(s) com resposta${pairs.length > answered ? ` (${pairs.length - answered} sem resposta ou com marcador)` : ''}. Q&A ajuda pessoas e assistentes de IA (ChatGPT, AI Overviews) a extrair respostas; o Google já não mostra rich results de FAQ para retalho.`,
    qaStatus === OK ? '' : 'Acrescenta 3–5 perguntas reais com respostas de 1–3 frases: «Que tamanho escolher?», «Como lavar…?», «Posso comprar online?».');

  // 7. Subtítulos com intenção
  const subs = body.headings.filter(h => h.level >= 2);
  if (subs.length >= 2) {
    const qh = subs.filter(h => /\?$|^(como|qual|quais|que|guia|diferença|tamanhos|cuidados|materiais)\b/i.test(h.text.trim()));
    add('llm-qheadings', 'Subtítulos com intenção / pergunta', 1, qh.length ? OK : WARN,
      `${qh.length}/${subs.length} subtítulos refletem perguntas ou intenções de pesquisa.`,
      qh.length ? '' : 'Ex.: «Que tamanho de leggings escolher?», «Como lavar pijamas de algodão?» — correspondem às perguntas feitas a assistentes de IA.');
  }

  // 8. Parágrafos autónomos
  if (body.paragraphs.length >= 2) {
    const dep = body.paragraphs.filter(p => /^(ela|elas|ele|eles|isto|isso|aquilo|estas|estes|essas|esses)\s+(são|é|têm|tem|podem|ficam|combinam|oferecem|foram)\b/i.test(p.trim()));
    const pct = dep.length / body.paragraphs.length;
    add('llm-selfcontained', 'Parágrafos autónomos (citáveis isoladamente)', 1, pct <= 0.1 ? OK : WARN,
      `${dep.length} parágrafo(s) começam com pronome e dependem do anterior.`,
      pct <= 0.1 ? '' : 'Repete o sujeito («As leggings Esmara…») em vez de pronomes; cada parágrafo deve fazer sentido sozinho.');
  }

  // 9. Linguagem vaga
  const fluff = text.match(FLUFF_RE) || [];
  const f = wc ? (fluff.length / wc) * 100 : 0;
  const fluffSt = f >= 2 && facts === 0 ? BAD : (f > 1 || fluff.length > facts) ? WARN : OK;
  add('llm-fluff', 'Linguagem vaga sem factos', 2, fluffSt,
    fluff.length ? `${fluff.length} expressão(ões) vaga(s): ${[...new Set(fluff.map(x => x.toLowerCase()))].slice(0, 5).map(x => `«${x}»`).join(', ')} — para ${facts} facto(s).` : 'Sem linguagem de marketing vaga.',
    fluffSt === OK ? '' : 'Troca cada expressão vaga por um facto: «máximo conforto» → «cintura elástica de 5 cm». Os LLMs ignoram adjetivos e citam factos.');

  // 10. Casos de uso / comparações
  const uc = (text.match(/(?<![\p{L}])(ideal|ideais|indicad[oa]s?|recomendad[oa]s?|perfeit[oa]s?)\s+para\s+(?!tod[oa]s(?![\p{L}])|qualquer(?![\p{L}]))\p{L}+/giu) || []).length;
  const cmp = /(em vez de|comparad[oa]s? com|diferença entre|mais (leve|quente|fresc|resistente|elástic|macio)\w*\s+(do\s)?que|\bvs\.?\b)/i.test(text);
  const ucSt = type === 'produto' ? (uc ? OK : WARN) : (uc && cmp ? OK : WARN);
  add('llm-usecase', 'Indicações «ideal para» e comparações', 1, ucSt,
    `${uc} indicação(ões) de uso${type === 'categoria' ? `, ${cmp ? 'com' : 'sem'} comparação` : ''}.`,
    ucSt === OK ? '' : 'Responde a «qual é melhor para…»: «O algodão escovado é mais quente do que o algodão simples — ideal para o inverno.» São o tipo de pergunta feita a assistentes de IA.');

  // 11. Atualidade
  const years = (text.match(/\b20[2-3]\d\b/g) || []).map(Number);
  const nowY = new Date().getFullYear();
  const fresh = years.length || /cole(ç|c)(ão|ões)\s+(primavera|verão|outono|inverno)|(primavera|verão|outono|inverno)[\s-](\d{2}|20\d{2})|nova coleção/i.test(text);
  const old = years.filter(y => y < nowY - 1);
  add('llm-fresh', 'Atualidade (estação / coleção / ano)', 1, old.length ? WARN : fresh ? OK : WARN,
    old.length ? `Referência desatualizada: ${old.join(', ')}.` : fresh ? 'Indica coleção/estação atual.' : 'Sem referência à coleção, estação ou ano.',
    old.length || !fresh ? 'Indica a coleção/estação (ex.: «coleção outono-inverno») e mantém dateModified no JSON-LD. Os assistentes de IA preferem conteúdo recente.' : '');

  // 12. Factos comerciais
  const com = [/\d+[.,]\d{2}\s?€|€\s?\d+/, /(lojas?(?![\p{L}])|online|lidl\.pt|disponíve|esgotad|enquanto durar)/iu, /devolu|devolver|troca/i, /entrega|portes|envio/i, /garantia/i].filter(r => r.test(text)).length;
  const comSt = type === 'produto' ? (com >= 3 ? OK : com === 2 ? WARN : BAD) : (com >= 2 ? OK : com === 1 ? WARN : BAD);
  add('llm-commerce', 'Factos comerciais (preço, disponibilidade, devoluções, entrega)', 2, comSt,
    `${com}/5 factos comerciais no texto.`,
    comSt === OK ? '' : 'Os assistentes de compras (ChatGPT Shopping, AI Mode) precisam de preço, disponibilidade, devoluções e entrega. Se vêm do template, garante que estão em HTML visível e no Offer do JSON-LD.');

  // 13. Ficha técnica «Atributo: valor»
  if (type === 'produto') {
    const specs = (String(item.body).match(/^\s*(?:[-*•]\s*|<li>\s*)?[A-ZÀ-Ú][\p{L} /]{2,25}:\s*\S+/gmu) || []).length + (String(item.body).match(/<tr/gi) || []).length;
    add('llm-specs', 'Ficha técnica em formato «Atributo: valor»', 2, specs >= 4 ? OK : specs >= 2 ? WARN : BAD,
      `${specs} atributo(s) estruturado(s).`,
      specs >= 4 ? '' : 'Lista Composição, Tamanhos, Cores, Cuidados, Referência — os mesmos atributos do feed Merchant Center / ChatGPT Shopping.');
  }
  return out;
}

// ---------- JSON-LD (dados estruturados) ----------
export function buildJsonLd(item, extra = {}) {
  const base = 'https://www.lidl.pt';
  const path = (item.slug || '/' + slugify(item.keyword || item.name)).replace(/^https?:\/\/[^/]+/i, '');
  const url = base + (path.startsWith('/') ? path : '/' + path);
  const h1 = item.h1 || item.name;
  const brand = item.brand || '[marca]';
  const today = new Date().toISOString().slice(0, 10);
  const pairs = (extra.faq && extra.faq.length ? extra.faq.map(f => ({ q: f.pergunta, a: f.resposta, answered: true })) : qaPairs(item.body)).filter(p => p.answered);
  const org = { '@type': 'Organization', '@id': `${base}/#org`, name: 'Lidl Portugal', url: base, logo: '[URL do logótipo]' };
  const bc = { '@type': 'BreadcrumbList', '@id': `${url}#bc`, itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: base + '/' },
    { '@type': 'ListItem', position: 2, name: '[Categoria-mãe]', item: '[URL da categoria-mãe]' },
    { '@type': 'ListItem', position: 3, name: h1, item: url }] };
  const faq = pairs.length ? { '@type': 'FAQPage', mainEntity: pairs.map(p => ({ '@type': 'Question', name: p.q, acceptedAnswer: { '@type': 'Answer', text: p.a } })) } : null;
  const body = parseBody(item.body).text;
  const graph = [org];
  if (item.type === 'produto') {
    const mat = body.match(/\d+\s?%\s?[\p{L}]+(?:,?\s*\d+\s?%\s?[\p{L}]+)*/u);
    const care = body.match(/\d+\s?°\s?C/);
    graph.push({
      '@type': 'Product', '@id': `${url}#product`, name: h1, description: extra.description || item.metaDescription || '[descrição curta]',
      sku: '[referência]', gtin13: '[EAN]', image: ['[URL da imagem]'], brand: { '@type': 'Brand', name: brand },
      ...(mat ? { material: mat[0] } : { material: '[composição]' }), color: '[cor]', size: '[tamanhos]',
      ...(care ? { additionalProperty: [{ '@type': 'PropertyValue', name: 'Lavagem', value: care[0] }] } : {}),
      offers: { '@type': 'Offer', url, price: '[0.00]', priceCurrency: 'EUR', availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition', seller: { '@id': `${base}/#org` },
        hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', applicableCountry: 'PT', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: '[30]' },
        shippingDetails: { '@type': 'OfferShippingDetails', shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'PT' }, shippingRate: { '@type': 'MonetaryAmount', value: '[portes]', currency: 'EUR' } } }
    }, bc);
  } else {
    graph.push({
      '@type': 'CollectionPage', '@id': `${url}#page`, url, name: h1, description: extra.description || item.metaDescription || '[descrição]',
      inLanguage: 'pt-PT', dateModified: today, publisher: { '@id': `${base}/#org` }, about: { '@type': 'Brand', name: brand },
      breadcrumb: { '@id': `${url}#bc` }, mainEntity: { '@id': `${url}#list` }
    }, bc, { '@type': 'ItemList', '@id': `${url}#list`, itemListElement: [{ '@type': 'ListItem', position: 1, url: '[URL do produto 1]', name: '[nome do produto 1]' }, { '@type': 'ListItem', position: 2, url: '[URL do produto 2]', name: '[nome do produto 2]' }] });
  }
  if (faq) graph.push(faq);
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
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
  // (o Google não usa contagem de palavras; isto é só um indicador de profundidade)
  const [minW, idealW, maxW] = type === 'produto' ? [80, 150, 600] : [150, 250, 1000];
  checks.push(wc < minW
    ? check('length', 'Conteúdo', 'Profundidade do texto', 2, BAD, `${wc} palavras — curto para uma página de ${type} (indicativo: ${idealW}+). O que conta é responder às dúvidas, não o número de palavras.`, `Acrescenta conteúdo útil: ${type === 'produto' ? 'materiais, medidas, cuidados, utilizações e benefícios' : 'subcategorias, ocasiões de uso, dicas de escolha e perguntas frequentes'}.`)
    : wc < idealW
      ? check('length', 'Conteúdo', 'Profundidade do texto', 2, WARN, `${wc} palavras — aceitável, mas provavelmente deixa dúvidas por responder.`, 'Expande com informação que responda a dúvidas reais dos clientes.')
      : wc > maxW
        ? check('length', 'Conteúdo', 'Profundidade do texto', 2, WARN, `${wc} palavras — longo para ${type}; garante que tudo é útil e escaneável.`, 'Divide em secções com subtítulos e listas, ou move parte para um guia/blog.')
        : check('length', 'Conteúdo', 'Profundidade do texto', 2, OK, `${wc} palavras — boa profundidade para ${type}.`));

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
    // densidade não é fator de ranking — só penalizamos excesso (keyword stuffing)
    const per100 = wc ? (kwCount * 100) / wc : 0;
    const inSent = ss.length ? ss.filter(s => countPhrase(norm(s), kw)).length / ss.length : 0;
    checks.push(kwCount === 0
      ? check('kw-stuffing', 'Palavra-chave', 'Uso natural da keyword', 1, looseContains(text, kw) ? OK : WARN, looseContains(text, kw) ? `"${kw}" aparece em variações naturais.` : `"${kw}" não aparece no texto, nem em variações.`, looseContains(text, kw) ? '' : 'Menciona o tema da pesquisa de forma natural no texto.')
      : per100 > 3 || (inSent > 0.5 && ss.length >= 4)
        ? check('kw-stuffing', 'Palavra-chave', 'Uso natural da keyword', 1, BAD, `"${kw}" aparece ${kwCount}× (${density.toFixed(1)}% do texto, em ${Math.round(inSent * 100)}% das frases) — keyword stuffing.`, 'Substitui ocorrências por sinónimos, pronomes ou pelo nome da marca. O Google e os LLMs penalizam repetição forçada.')
        : per100 > 2
          ? check('kw-stuffing', 'Palavra-chave', 'Uso natural da keyword', 1, WARN, `"${kw}" aparece ${kwCount}× — no limite do excessivo.`, 'Varia com sinónimos.')
          : check('kw-stuffing', 'Palavra-chave', 'Uso natural da keyword', 1, OK, `"${kw}" aparece ${kwCount}× — uso natural.`));
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
    if (title.length > 65) { issues.push(`${title.length} caracteres — provavelmente cortado ou reescrito pelo Google (alvo 50–65)`); st = WARN; }
    if (brand && (title.match(new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length > 1) { issues.push(`a marca "${brand}" aparece repetida`); st = WARN; }
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
      ['tamanhos/medidas', /[Tt]amanhos?|TAMANHOS?|\b(XS|S|M|L|XL|XXL)\b|\b\d{2}[–\-/]\d{2}\b|[Mm]edidas|\dcm\b|\d cm\b/],
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
  checks.push(check('tone', 'Linguagem', 'Tom e afirmações', 1, toneIssues.length ? WARN : OK, toneIssues.length ? toneIssues.join('; ') + '.' : 'Tom adequado, sem afirmações absolutas.', toneIssues.length ? 'Evita superlativos sem prova ("o melhor", "n.º 1") — são publicidade enganosa se não houver fundamento.' : ''));

  // 23. Marcadores por preencher
  const ph = text.match(PLACEHOLDER_RE) || [title, desc, h1].join(' ').match(PLACEHOLDER_RE);
  checks.push(ph
    ? check('placeholders', 'Conteúdo', 'Marcadores por preencher', 3, BAD, `Texto com marcadores por preencher (ex.: "${ph[0]}") — não publicar assim.`, 'Substitui os [marcadores] pelos dados reais da ficha técnica.')
    : check('placeholders', 'Conteúdo', 'Marcadores por preencher', 3, OK, 'Sem marcadores por preencher.'));

  // ---------- IA / LLM (GEO/AEO) ----------
  llmChecks({ item, type, kw, brand, h1, text, ws, wc, ss, body }).forEach(c => checks.push(c));

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
  const llmScore = groups[LLM]?.score ?? 0;
  const seoChecks = checks.filter(c => c.group !== LLM);
  const seoTotal = seoChecks.reduce((n, c) => n + c.weight, 0);
  const seoScore = seoTotal ? Math.round(seoChecks.reduce((n, c) => n + c.weight * (c.status === OK ? 1 : c.status === WARN ? 0.5 : 0), 0) / seoTotal * 100) : 0;

  return {
    score, seoScore, llmScore, checks, groups,
    stats: {
      words: wc, sentences: ss.length, paragraphs: body.paragraphs.length, headings: body.headings.length,
      links: body.links.length, listItems: body.listItems, flesch, readingTime: Math.max(1, Math.round(wc / 220)),
      avgSentence: ss.length ? +(wc / ss.length).toFixed(1) : 0,
      facts: factCount(text)
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
  const mean = k => analyses.length ? Math.round(analyses.reduce((n, x) => n + x.a[k], 0) / analyses.length) : 0;
  return { analyses, issues, duplicates, cannibal, dupTitles, avg, avgWords, avgFlesch, avgSeo: mean('seoScore'), avgLlm: mean('llmScore') };
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
  // resposta direta no início (GEO): o quê + marca + Lidl + factos
  if ((failed('kw-intro') || failed('llm-answer-first') || failed('llm-entities')) && kw) {
    out.push(`${cap(kw)}${brand ? ` ${brand}, a marca própria do Lidl,` : ' no Lidl'} ${item.type === 'produto' ? 'com' : 'reúne'} [indicar 1–2 factos concretos: composição em %, gama de tamanhos, preço ou n.º de modelos].`);
  }
  paras.forEach((p, i) => {
    if (words(p).length > 120) {
      const ss = sentences(p);
      const mid = Math.ceil(ss.length / 2);
      out.push(ss.slice(0, mid).join(' '), ss.slice(mid).join(' '));
    } else out.push(p);
    if (i === 0 && failed('subs') && paras.length > 2) out.push(`## ${cap(kw)}: como escolher`);
  });
  if (failed('llm-specs')) {
    out.push('## Características', '- Composição: [indicar %]', '- Tamanhos: [indicar gama]', '- Cores: [indicar]', '- Cuidados: [indicar temperatura de lavagem]', '- Referência: [indicar]');
  }
  if (failed('llm-qa')) {
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
