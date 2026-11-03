// Análise com IA — opcional. Fornecedores: Anthropic (Claude) ou Google (Gemini, com plano gratuito).
// As chaves ficam só no browser (localStorage) e são enviadas diretamente à API de cada fornecedor.
import { geminiGenerate } from './gemini.js';
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.137.0/+esm';
let sdkPromise;
const loadSdk = () => (sdkPromise ||= import(SDK_URL).then(m => m.default || m.Anthropic));

export const DEFAULT_MODEL = 'claude-opus-5-5';

// ---- utilitários para fornecedores sem "structured outputs" estritos (Gemini) ----
// Esqueleto de exemplo a partir do schema, para pôr no prompt
function skeleton(sc) {
  if (sc.enum) return sc.enum.join(' | ');
  if (sc.type === 'object') return Object.fromEntries(Object.entries(sc.properties).map(([k, v]) => [k, skeleton(v)]));
  if (sc.type === 'array') return [skeleton(sc.items)];
  return sc.type === 'integer' ? 0 : sc.type === 'boolean' ? false : '…';
}
// Garante que a resposta tem a forma esperada (campos em falta ficam vazios)
function conform(sc, v) {
  if (sc.type === 'object') return Object.fromEntries(Object.entries(sc.properties).map(([k, p]) => [k, conform(p, v && typeof v === 'object' ? v[k] : undefined)]));
  if (sc.type === 'array') return Array.isArray(v) ? v.map(x => conform(sc.items, x)) : [];
  if (sc.type === 'integer') return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  if (sc.type === 'boolean') return v === true || v === 'true';
  if (sc.enum) return sc.enum.includes(v) ? v : sc.enum[0];
  return v == null ? '' : typeof v === 'string' ? v : JSON.stringify(v);
}
function parseJson(text) {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(t); } catch { /* tenta extrair o objeto */ }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* falha abaixo */ } }
  throw new Error('Não foi possível ler a resposta da IA (JSON inválido). Tenta de novo.');
}

const SYSTEM = `És um especialista sénior em SEO e copywriting para e-commerce de retalho em Portugal, a trabalhar para a Lidl Portugal (lidl.pt).
Contexto: a Lidl vende marcas próprias como a Esmara (moda de senhora), Livergy (homem), Lupilu/Pepperts (criança), Parkside, Silvercrest, Livarno, Crivit, entre outras. A proposta de valor é qualidade a preço Lidl; há venda em loja e online, com campanhas semanais (folheto).
Regras:
- Escreve sempre em português de Portugal (pt-PT, Acordo Ortográfico de 1990), tratando o cliente por "tu", como faz a Lidl Portugal.
- Segue as boas práticas atuais do Google: conteúdo útil e centrado nas pessoas (helpful content, E-E-A-T), intenção de pesquisa, estrutura com H2/H3, legibilidade, links internos com âncoras descritivas, metadados que geram cliques.
- Não inventes factos sobre o produto (composição, preços, certificações, tamanhos). Quando faltar informação, usa marcadores entre parênteses retos, ex.: [indicar composição], e diz o que é preciso confirmar.
- Evita superlativos sem prova ("o melhor") e keyword stuffing. A densidade de keyword não é fator de ranking.
- Otimizas também para assistentes de IA (Google AI Overviews/AI Mode, ChatGPT, Gemini, Perplexity, Copilot) — "LLM SEO"/GEO/AEO: resposta direta no início, factos verificáveis (composição, medidas, tamanhos, °C, certificações), entidades explícitas (marca, Lidl, tipo de produto), parágrafos autónomos que façam sentido citados isoladamente, perguntas e respostas reais, indicações "ideal para" e comparações. Não há truques especiais: o Google trata isto como SEO de base, e llms.txt não tem efeito comprovado.
- Nunca inventes estatísticas, citações, certificações, avaliações ou preços para "otimizar"; usa [marcadores].
- Alegações ambientais só específicas e certificadas (ex.: "60% poliéster reciclado, certificado GRS"). Termos genéricos como "sustentável", "ecológico" ou "amigo do ambiente" sem prova estão proibidos pela Diretiva UE 2024/825, aplicável em Portugal desde 27/09/2026.
- Sê concreto: cita frases do texto original quando apontares problemas.`;

const str = { type: 'string' };
const strArr = { type: 'array', items: str };
const obj = (properties) => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });

const ANALYSIS_SCHEMA = obj({
  resumo: str,
  pontuacao: { type: 'integer' },
  intencao_pesquisa: str,
  pontos_fortes: strArr,
  problemas: {
    type: 'array',
    items: obj({ titulo: str, detalhe: str, prioridade: { type: 'string', enum: ['alta', 'média', 'baixa'] }, sugestao: str })
  },
  keywords_sugeridas: {
    type: 'array',
    items: obj({ termo: str, tipo: { type: 'string', enum: ['principal', 'secundária', 'long-tail', 'semântica', 'pergunta'] }, justificacao: str })
  },
  concorrencia: { type: 'array', items: obj({ insight: str, como_aplicar: str }) },
  texto_corrigido: obj({
    meta_title: str, meta_description: str, h1: str, slug: str, corpo: str,
    faq: { type: 'array', items: obj({ pergunta: str, resposta: str }) },
    atributos: { type: 'array', items: obj({ nome: str, valor: str }) }
  }),
  alteracoes: strArr,
  llm: obj({
    pontuacao: { type: 'integer' },
    resumo: str,
    resposta_direta: str,
    perguntas_conversacionais: {
      type: 'array',
      items: obj({ pergunta: str, intencao: { type: 'string', enum: ['informacional', 'comparação', 'transacional', 'cuidados/uso', 'local'] }, coberta: { type: 'boolean' }, resposta_sugerida: str })
    },
    factos_em_falta: { type: 'array', items: obj({ facto: str, porque: str, fonte: str }) },
    frases_vagas: { type: 'array', items: obj({ citacao: str, reescrita: str }) },
    entidades: obj({ marca: str, retalhista: str, tipo_produto: str, atributos: strArr }),
    passagens_citaveis: strArr,
    riscos: strArr,
    json_ld: str
  })
});

function client(Anthropic, apiKey) {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
}

function friendlyError(Anthropic, e) {
  if (e instanceof Anthropic.AuthenticationError) return 'Chave da API inválida. Verifica-a nas Definições.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'A chave não tem permissão para este pedido (verifica o workspace e se a pesquisa web está ativa na consola).';
  if (e instanceof Anthropic.RateLimitError) return 'Limite de pedidos atingido. Espera um pouco e tenta de novo.';
  if (e instanceof Anthropic.BadRequestError) return 'Pedido inválido: ' + (e.error?.error?.message || e.message);
  if (e instanceof Anthropic.APIConnectionError) return 'Sem ligação à API da Anthropic. Verifica a internet.';
  if (e instanceof Anthropic.APIError) return `Erro da API (${e.status ?? '?'}): ${e.message}`;
  return e?.message || String(e);
}

function itemBlock(item, ruleAnalysis, competitors) {
  const failing = ruleAnalysis.checks.filter(c => c.status !== 'ok').map(c => `- [${c.status === 'bad' ? 'MAU' : 'AVISO'}] ${c.label}: ${c.msg}`).join('\n');
  const comp = (competitors || []).filter(c => c.text?.trim()).map((c, i) => `<concorrente nome="${c.name || 'Concorrente ' + (i + 1)}">\n${c.text.trim()}\n</concorrente>`).join('\n');
  return `<texto tipo="${item.type}" nome="${item.name || ''}">
Marca: ${item.brand || '(não indicada)'}
Domínio: ${item.domain || 'moda'}
Keyword principal: ${item.keyword || '(não definida)'}
Keywords secundárias: ${item.secondary || '(nenhuma)'}
URL/slug: ${item.slug || '(não indicado)'}
Meta title: ${item.metaTitle || '(vazio)'}
Meta description: ${item.metaDescription || '(vazia)'}
H1: ${item.h1 || '(vazio)'}
Notas do utilizador: ${item.notes || '(nenhuma)'}
<corpo>
${item.body || ''}
</corpo>
</texto>

<analise_automatica pontuacao="${ruleAnalysis.score}">
${failing || 'Sem problemas detetados pelas regras automáticas.'}
</analise_automatica>
${comp ? `\n<textos_concorrencia>\n${comp}\n</textos_concorrencia>` : ''}`;
}

async function run(apiKey, model, params, onProgress) {
  const Anthropic = await loadSdk();
  const c = client(Anthropic, apiKey);
  try {
    let messages = params.messages;
    let content = [];
    // pause_turn: a pesquisa web pode pausar o turno; continuamos até 4 vezes
    for (let i = 0; i < 4; i++) {
      const stream = c.beta.messages.stream({
        model,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        thinking: { type: 'adaptive' },
        ...params,
        messages
      });
      let chars = 0;
      stream.on('text', t => { chars += t.length; onProgress?.(chars); });
      const msg = await stream.finalMessage();
      if (msg.stop_reason === 'refusal') throw new Error('O modelo recusou este pedido' + (msg.stop_details?.explanation ? `: ${msg.stop_details.explanation}` : '.'));
      content = content.concat(msg.content);
      if (msg.stop_reason === 'max_tokens') throw new Error('A resposta foi cortada (limite de tokens). Tenta com um texto mais curto.');
      if (msg.stop_reason !== 'pause_turn') return { content, usage: msg.usage };
      messages = [...messages, { role: 'assistant', content: msg.content }];
    }
    return { content };
  } catch (e) {
    throw new Error(friendlyError(Anthropic, e));
  }
}

export async function aiAnalyze({ provider, apiKey, model, effort, item, ruleAnalysis, competitors, onProgress }) {
  const prompt = `${itemBlock(item, ruleAnalysis, competitors)}

Faz uma auditoria SEO completa deste texto de ${item.type} da Lidl Portugal:
1. Resume a qualidade SEO e dá uma pontuação de 0 a 100.
2. Identifica a intenção de pesquisa provável da keyword e se o texto lhe responde.
3. Lista o que está bem e os problemas (com prioridade e sugestão concreta). Valida ou contraria a análise automática quando fizer sentido.
4. Sugere keywords (principal, secundárias, long-tail, semânticas e perguntas que as pessoas pesquisam em Portugal).
5. Concorrência: com base nos textos de concorrentes fornecidos (se existirem) e no que retalhistas de moda/retalho em Portugal costumam fazer bem nestas páginas (ex.: Primark, Pepco, Kiabi, C&A, H&M, Zara, Continente, Auchan), indica boas práticas a adotar. Não inventes dados concretos sobre páginas específicas que não viste.
6. Escreve a versão corrigida completa, pronta a publicar: meta title (≤ 60 car., termina com "| Lidl"), meta description (120–155 car., com CTA), H1, slug, corpo em Markdown (com H2/H3, listas e links internos sugeridos no formato [âncora](/caminho-sugerido)) e 3–5 FAQs. Mantém a informação factual do original e usa [marcadores] para dados a confirmar.
7. Lista as principais alterações feitas e porquê. Em "atributos" põe a ficha técnica (nome/valor) com os dados que existem ou [marcadores].
8. Visibilidade em assistentes de IA (LLM SEO / GEO): dá uma pontuação de 0 a 100 e um resumo; escreve um parágrafo de resposta direta (40–60 palavras) que um assistente possa citar; lista 6–10 perguntas conversacionais que alguém em Portugal faria ao ChatGPT/Gemini/Google AI Mode onde esta página deveria ser citada, se o texto atual as responde e uma resposta sugerida; os factos em falta e onde obtê-los (ex.: ficha técnica/PIM, Merchant Center); as frases vagas com reescrita factual; as entidades da página; 2–4 passagens citáveis do texto corrigido; os riscos (alegações ambientais, afirmações sem prova). Em "json_ld" devolve uma string JSON-LD válida (schema.org, com "@graph"): para categoria CollectionPage + BreadcrumbList + ItemList (+ FAQPage se houver Q&A visível); para produto Product com Brand e Offer (preço, disponibilidade, devoluções, envio) + BreadcrumbList (+ FAQPage). Usa só dados presentes no texto ou [marcadores]; nunca aggregateRating sem avaliações reais.`;
  if (provider === 'gemini') {
    const { text } = await geminiGenerate({
      apiKey, model, system: SYSTEM, json: true, onProgress,
      prompt: `${prompt}\n\nResponde APENAS com um objeto JSON válido com exatamente esta estrutura (os valores são exemplos de tipo; "pontuacao" é um inteiro de 0 a 100; "json_ld" é uma string com JSON escapado):\n${JSON.stringify(skeleton(ANALYSIS_SCHEMA))}`
    });
    return conform(ANALYSIS_SCHEMA, parseJson(text));
  }
  const { content } = await run(apiKey, model, {
    max_tokens: 32000,
    system: SYSTEM,
    output_config: { effort: effort || 'high', format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
    messages: [{ role: 'user', content: prompt }]
  }, onProgress);
  const text = content.filter(b => b.type === 'text').map(b => b.text).join('');
  try { return JSON.parse(text); } catch { throw new Error('Não foi possível ler a resposta da IA.'); }
}

export async function aiCompetitors({ provider, apiKey, model, effort, item, onProgress }) {
  const prompt = `Pesquisa na web como os concorrentes da Lidl em Portugal trabalham o SEO para a pesquisa "${item.keyword || item.name}" (${item.type}${item.brand ? `, marca própria ${item.brand}` : ''}).
Analisa as páginas que aparecem bem posicionadas no Google Portugal (google.pt) para esta pesquisa e pesquisas próximas — retalhistas de moda/retalho como Primark, Pepco, Kiabi, C&A, H&M, Zara, Shein, Continente, Auchan, El Corte Inglés, ou outros que surjam.
Responde em pt-PT, em Markdown, com:
## Quem aparece nos resultados
## O que fazem bem (título, H1, texto da categoria, estrutura, FAQs, links internos, filtros, conteúdos de apoio)
## Palavras-chave e temas que usam
## O que os assistentes de IA citam
(Faz 3 pesquisas em linguagem conversacional, como alguém perguntaria ao ChatGPT ou ao Google AI Mode — ex.: «onde comprar ${item.keyword || item.name} baratas em Portugal», «qual é a melhor marca de ${item.keyword || item.name} para o dia a dia», «${item.keyword || item.name}: que tamanho escolher» — e lista que domínios e que tipos de página são citados, e porquê: factos, FAQs, comparações, avaliações, guias.)
## Lacunas e oportunidades para a Lidl (Google e assistentes de IA)
## 5 ações prioritárias
Sê específico e indica as fontes. Não inventes nada que não tenhas visto.`;
  if (provider === 'gemini') {
    const { text, sources } = await geminiGenerate({ apiKey, model, system: SYSTEM, prompt, search: true, onProgress });
    return { markdown: text, sources };
  }
  const { content } = await run(apiKey, model, {
    max_tokens: 24000,
    system: SYSTEM,
    output_config: { effort: effort || 'high' },
    tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 6, user_location: { type: 'approximate', country: 'PT' } }],
    messages: [{ role: 'user', content: prompt }]
  }, onProgress);
  const text = content.filter(b => b.type === 'text').map(b => b.text).join('');
  const sources = new Map();
  content.forEach(b => {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) b.content.forEach(r => r.url && sources.set(r.url, r.title || r.url));
    if (b.type === 'text' && b.citations) b.citations.forEach(c => c.url && sources.set(c.url, c.title || c.url));
  });
  return { markdown: text, sources: [...sources.entries()].map(([url, title]) => ({ url, title })) };
}

export async function aiOverview({ provider, apiKey, model, effort, summary, onProgress }) {
  const prompt = `Abaixo está o resumo da auditoria SEO automática de ${summary.count} textos (categorias e produtos) da Lidl Portugal.
<resumo>
${summary.text}
</resumo>
Escreve em pt-PT, em Markdown, um relatório executivo para a equipa de conteúdos:
## Diagnóstico geral
## Padrões que se repetem (bons e maus)
## Prontidão para pesquisa com IA (AI Overviews, ChatGPT, Gemini, Perplexity)
## Riscos (conteúdo duplicado, canibalização, metadados, alegações ambientais)
## Plano de melhoria priorizado (quick wins vs. trabalho estrutural)
## Guia de redação recomendado (template para textos de categoria e de produto)
Sê concreto e refere os textos pelo nome.`;
  if (provider === 'gemini') return (await geminiGenerate({ apiKey, model, system: SYSTEM, prompt, onProgress })).text;
  const { content } = await run(apiKey, model, {
    max_tokens: 16000,
    system: SYSTEM,
    output_config: { effort: effort || 'high' },
    messages: [{ role: 'user', content: prompt }]
  }, onProgress);
  return content.filter(b => b.type === 'text').map(b => b.text).join('');
}
