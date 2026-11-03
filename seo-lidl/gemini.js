// Google Gemini API (REST) — alternativa com plano gratuito (modelos Flash / Flash-Lite).
// A chave fica só no browser e é enviada diretamente para generativelanguage.googleapis.com.
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
export const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash';

function friendly(status, body) {
  const msg = body?.error?.message || '';
  if (status === 400 && /API key/i.test(msg)) return 'Chave do Gemini inválida. Verifica-a nas Definições.';
  if (status === 403) return 'A chave do Gemini não tem permissão (verifica se a Gemini API está ativa no projeto da chave).';
  if (status === 404) return 'Modelo do Gemini não encontrado. Carrega a lista de modelos nas Definições e escolhe outro.';
  if (status === 429) return 'Limite do plano gratuito do Gemini atingido (pedidos por minuto ou por dia). Espera um pouco ou escolhe um modelo Flash-Lite.';
  if (status >= 500) return 'O Gemini está indisponível de momento. Tenta de novo daqui a pouco.';
  return `Erro do Gemini (${status}): ${msg || 'pedido falhou'}`;
}

// Lista os modelos de texto disponíveis para esta chave (os nomes mudam com frequência, por isso não os fixamos no código).
export async function listGeminiModels(apiKey) {
  let res;
  try {
    res = await fetch(`${BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': apiKey } });
  } catch { throw new Error('Sem ligação à API do Gemini. Verifica a internet.'); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(friendly(res.status, body));
  return (body.models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => ({ id: m.name.replace(/^models\//, ''), label: m.displayName || m.name }))
    .filter(m => /gemini/i.test(m.id) && !/embed|tts|image|audio|live|vision|aqa|robotics|computer/i.test(m.id))
    .sort((a, b) => score(b.id) - score(a.id) || b.id.localeCompare(a.id));
}
// Flash primeiro (plano gratuito), depois Flash-Lite, depois o resto
const score = id => (/flash/i.test(id) && !/lite/i.test(id) ? 3 : /lite/i.test(id) ? 2 : 1) + (/preview|exp/i.test(id) ? -0.5 : 0);

// Gera texto com streaming (para mostrar progresso). json=true pede resposta em JSON; search=true ativa a pesquisa Google.
export async function geminiGenerate({ apiKey, model, system, prompt, json = false, search = false, maxTokens = 32768, onProgress }) {
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens, ...(json ? { responseMimeType: 'application/json' } : {}) },
    ...(search ? { tools: [{ google_search: {} }] } : {})
  };
  let res;
  try {
    res = await fetch(`${BASE}/models/${encodeURIComponent(model || GEMINI_FALLBACK_MODEL)}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body)
    });
  } catch { throw new Error('Sem ligação à API do Gemini. Verifica a internet.'); }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(friendly(res.status, Array.isArray(err) ? err[0] : err));
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '', text = '', finish = '', blocked = '';
  const sources = new Map();
  const handle = chunk => {
    if (chunk.promptFeedback?.blockReason) blocked = chunk.promptFeedback.blockReason;
    const c = chunk.candidates?.[0];
    if (!c) return;
    (c.content?.parts || []).forEach(p => { if (p.text && !p.thought) text += p.text; });
    if (c.finishReason) finish = c.finishReason;
    (c.groundingMetadata?.groundingChunks || []).forEach(g => g.web?.uri && sources.set(g.web.uri, g.web.title || g.web.uri));
    onProgress?.(text.length);
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line.startsWith('data:')) { try { handle(JSON.parse(line.slice(5))); } catch { /* linha incompleta */ } }
    }
  }
  if (buf.trim().startsWith('data:')) { try { handle(JSON.parse(buf.trim().slice(5))); } catch { /* ignora */ } }

  if (blocked) throw new Error(`O Gemini bloqueou o pedido (${blocked}).`);
  if (finish === 'SAFETY' || finish === 'PROHIBITED_CONTENT') throw new Error('O Gemini bloqueou a resposta por motivos de segurança.');
  if (finish === 'MAX_TOKENS') throw new Error('A resposta do Gemini foi cortada (limite de tokens). Tenta com um texto mais curto.');
  if (!text.trim()) throw new Error('O Gemini não devolveu resposta.');
  return { text, sources: [...sources.entries()].map(([url, title]) => ({ url, title })) };
}
