/* Percebe frases em português como
 *   "lembra-me de hora a hora de ir à InPost até às 16h"
 *   "às 3 e meia da tarde ligar à mãe"
 *   "daqui a 20 minutos tirar a roupa da máquina"
 * e devolve { task, interval, firstAt, end, once, hasDeadline }.
 * Funciona no browser (window.LembreteParser) e em Node (module.exports). */
(function (root) {
  'use strict';

  const UNITS = {
    zero: 0, um: 1, uma: 1, dois: 2, duas: 2, 'três': 3, tres: 3, quatro: 4, cinco: 5,
    seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13,
    catorze: 14, quatorze: 14, quinze: 15, dezasseis: 16, dezesseis: 16,
    dezassete: 17, dezessete: 17, dezoito: 18, dezanove: 19, dezenove: 19,
  };
  const TENS = { vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50 };
  const ALLNUM = Object.keys(UNITS).concat(Object.keys(TENS))
    .sort((a, b) => b.length - a.length).join('|');
  const NUMPHRASE = '(?:' + ALLNUM + ')(?:\\s+e\\s+(?:' + ALLNUM + '))?';

  function phraseToDigits(p) {
    const parts = p.split(/\s+e\s+/);
    if (parts.length === 2 && TENS[parts[0]] != null && UNITS[parts[1]] != null && UNITS[parts[1]] < 10) {
      return String(TENS[parts[0]] + UNITS[parts[1]]);
    }
    return parts.map(w => String(UNITS[w] != null ? UNITS[w] : TENS[w])).join(' e ');
  }

  const PERIOD = { 'manhã': [9, 12], tarde: [14, 19], noite: [19, 23] };

  function normalize(input) {
    let s = ' ' + String(input || '').toLowerCase().replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim() + ' ';
    s = s.replace(/manha\b/g, 'manhã').replace(/amanha\b/g, 'amanhã');
    s = s.replace(/meio[- ]dia/g, '12h').replace(/meia[- ]noite/g, '23h59');
    s = s.replace(/de meia em meia hora/g, 'a cada 30 minutos')
      .replace(/de quarto em quarto de hora/g, 'a cada 15 minutos')
      .replace(/de hora (?:a|em) hora|todas as horas|hora a hora/g, 'a cada 60 minutos')
      .replace(/(?:um )?quarto de hora/g, '15 minutos')
      .replace(/meia hora/g, '30 minutos')
      .replace(/e um quarto/g, 'e 15')
      .replace(/menos um quarto/g, 'menos 15');
    // números por extenso só quando estão num contexto de horas/minutos
    s = s.replace(new RegExp('((?:[àa]s|pelas?|cada|daqui a|dentro de|em|de|at[ée](?: [àa]s?| ao)?|das?|antes das?)\\s+)(' + NUMPHRASE + ')(?=[\\s,.!?])', 'g'),
      (m, pre, num) => pre + phraseToDigits(num));
    s = s.replace(new RegExp('(\\s)(' + NUMPHRASE + ')(?=\\s+(?:horas?|minutos?|min|h)\\b)', 'g'),
      (m, pre, num) => pre + phraseToDigits(num));
    s = s.replace(new RegExp('(\\d\\s*(?:h|horas?)?\\s+e\\s+)(' + NUMPHRASE + ')(?=[\\s,.!?])', 'g'),
      (m, pre, num) => pre + phraseToDigits(num));
    s = s.replace(/(\d{1,2})\s*horas?\s+e\s+(\d{1,2})\s*minutos?/g, '$1:$2');
    return s;
  }

  // HH  HHh  HH:MM  HHhMM  HH horas  HH e meia  HH e 20  HH menos 15  ... da tarde
  const TIME = '(\\d{1,2})(?:\\s*(?:h|:|horas?)\\s*(\\d{2})?)?(?:\\s+e\\s+(meia|\\d{1,2})(?:\\s*minutos?)?)?(?:\\s+menos\\s+(\\d{1,2}))?(?:\\s*(?:da|de|à|a)\\s+(manhã|tarde|noite|madrugada))?(?=[\\s,.!?])';

  function timeFrom(m, globalPeriod) {
    let h = parseInt(m[1], 10);
    let min = m[2] ? parseInt(m[2], 10) : 0;
    if (m[3]) min = m[3] === 'meia' ? 30 : parseInt(m[3], 10);
    if (m[4]) { min = 60 - parseInt(m[4], 10); h -= 1; }
    const period = m[5] || globalPeriod;
    if ((period === 'tarde' || period === 'noite') && h < 12) h += 12;
    else if (!m[5] && !globalPeriod && h >= 1 && h <= 7) h += 12; // "até às 4" = 16h
    if (h > 23 || min > 59) return null;
    return { h, m: min };
  }

  function parse(input, opts) {
    opts = opts || {};
    const now = opts.now != null ? opts.now : Date.now();
    const defaultInterval = opts.defaultInterval || 60;
    const dayEndHour = opts.dayEndHour || 22;
    let s = normalize(input);
    const cut = (re) => { const m = s.match(re); if (m) s = s.replace(m[0], ' '); return m; };

    let dayOffset = 0;
    if (cut(/\sdepois de amanhã(?=[\s,.!?])/)) dayOffset = 2;
    else if (cut(/\samanhã(?=[\s,.!?])/)) dayOffset = 1;
    cut(/\s(?:hoje|esta tarde|esta manhã|esta noite)(?=[\s,.!?])/);
    const tmp = String(input).toLowerCase();
    const gp = /esta tarde/.test(tmp) ? 'tarde' : /esta manhã|esta manha/.test(tmp) ? 'manhã' : /esta noite/.test(tmp) ? 'noite' : null;

    // intervalo
    let interval = null;
    let m = cut(/\s(?:de|a cada|cada)\s+(\d+)\s+em\s+\1\s*(minutos?|min|horas?|h)(?=[\s,.!?])/);
    if (!m) m = cut(/\s(?:a\s+)?cada\s+(\d+)?\s*(minutos?|min|horas?|h)(?=[\s,.!?])/);
    if (m) {
      const n = m[1] ? parseInt(m[1], 10) : 1;
      interval = /^h/.test(m[2]) ? n * 60 : n;
    } else if (cut(/\s(?:várias vezes|varias vezes|de vez em quando|insistentemente|repetidamente)(?=[\s,.!?])/)) {
      interval = defaultInterval;
    }
    if (interval != null) interval = Math.max(5, Math.min(interval, 12 * 60));

    let period = gp;
    const pm = s.match(/\s(?:de|à|a|durante a|logo à|pela)\s+(manhã|tarde|noite)(?=[\s,.!?])/);
    if (pm) period = period || pm[1];

    const deadline = cut(new RegExp('\\s(?:no máximo\\s+)?(?:at[ée]|antes)(?:\\s+(?:d?[àa]s?|ao|aos|de))?\\s+' + TIME));
    const startM = cut(new RegExp('\\s(?:a partir d[ae]s?|desde\\s+[àa]s|come[çc]a(?:ndo|r)?\\s+[àa]s)\\s+' + TIME));
    const rel = cut(/\s(?:daqui a|dentro de|em)\s+(\d+)\s*(minutos?|min|horas?|h)(?=[\s,.!?])/);
    const at = cut(new RegExp('\\s(?:[àa]s|pelas?|para as|para [àa]s|à)\\s+' + TIME));
    if (pm) cut(new RegExp(pm[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + dayOffset);
    const mk = (hm) => {
      if (!hm) return null;
      const d = new Date(base); d.setHours(hm.h, hm.m, 0, 0);
      let t = d.getTime();
      if (dayOffset === 0 && t <= now) {
        if (hm.h < 12 && t + 12 * 3600e3 > now) t += 12 * 3600e3; else t += 24 * 3600e3;
      }
      return t;
    };
    const atHour = (h) => { const d = new Date(base); d.setHours(h, 0, 0, 0); return d.getTime(); };

    let end = deadline ? mk(timeFrom(deadline, period)) : null;
    const hasDeadline = end != null;
    let start = startM ? mk(timeFrom(startM, period)) : null;
    let atT = at ? mk(timeFrom(at, period)) : null;
    if (rel) atT = now + parseInt(rel[1], 10) * (/^h/.test(rel[2]) ? 3600e3 : 60e3);
    if (!start && atT && interval) { start = atT; atT = null; }

    let once = false, firstAt;
    if (!interval && !hasDeadline && atT) {
      once = true; firstAt = atT;
    } else {
      if (!interval) interval = defaultInterval;
      if (!start && period && atHour(PERIOD[period][0]) > now) start = atHour(PERIOD[period][0]);
      if (!start && dayOffset > 0) start = atHour(9);
      if (!end && period) end = atHour(PERIOD[period][1]);
      if (!end) {
        end = atHour(dayEndHour);
        if (end - now < 2 * 3600e3 && dayOffset === 0) end = now + 3 * 3600e3;
      }
      firstAt = start || (now + interval * 60e3);
      if (hasDeadline && firstAt >= end) firstAt = Math.max(now + 60e3, end - 15 * 60e3);
    }

    return { task: restoreCase(cleanTask(s), String(input)), interval: once ? null : interval, firstAt, end: once ? null : end, once, hasDeadline };
  }

  function cleanTask(s) {
    let t = ' ' + s.replace(/\s+/g, ' ').trim() + ' ';
    t = t.replace(/\s(?:por favor|se faz favor|sff)(?=[\s,.!?])/g, ' ');
    const lead = [
      /^\s*(?:ok|olá|ola|ei|hey|então|olha|ouve)[,!]?\s+/,
      /^\s*(?:re)?(?:lembra|lembrar|avisa|avisar|recorda|recordar)[- ]?(?:-?me|me)?\s*(?:de que|que|de|para|disto|disso)?\s+/,
      /^\s*(?:eu\s+)?(?:tenho|tens|preciso|precisas)\s+(?:de|que)\s+/,
      /^\s*(?:não\s+)?(?:me\s+)?(?:posso|quero)\s+(?:me\s+)?esquecer(?:-me)?\s*(?:de que|de|que)?\s+/,
      /^\s*(?:que|de|e|para|a)\s+/,
    ];
    for (let i = 0; i < 4; i++) lead.forEach(re => { t = t.replace(re, ' '); });
    t = t.replace(/[,\s]+(?:e\s+)?(?:re)?(?:lembra|avisa)[- ]?(?:-?me|me)(?:\s+(?:disso|disto))?\s*$/, ' ');
    t = t.replace(/\s+,/g, ',').replace(/,+/g, ',').replace(/\s+/g, ' ').trim();
    t = t.replace(/^[,.\s]+|[,.\s]+$/g, '').replace(/\s+(?:e|de|que|a|às|as|até)$/i, '').trim();
    t = t.replace(/^(?:e|que)\s+/i, '');
    if (!t) return 'Lembrete';
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  // devolve as maiúsculas que vinham no texto original ("InPost", "Rui")
  function restoreCase(task, original) {
    const words = {};
    original.split(/[\s,.!?]+/).forEach(w => { if (w && w !== w.toLowerCase()) words[w.toLowerCase()] = w; });
    const out = task.split(' ').map((w, i) => words[w.toLowerCase()] || (i === 0 ? w : w)).join(' ');
    return out.charAt(0).toUpperCase() + out.slice(1);
  }

  const api = { parse, normalize, cleanTask };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LembreteParser = api;
})(typeof window !== 'undefined' ? window : this);
