(function () {
  'use strict';

  const KEY = 'lembretes.v1';
  const SKEY = 'lembretes.settings.v1';
  const MIN = 60e3;
  const $ = (id) => document.getElementById(id);
  // Dentro da app Android existe window.AndroidBridge: a voz, o microfone e os alarmes passam a ser do telemóvel.
  const NATIVE = window.AndroidBridge || null;

  // ---------- estado ----------
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(reminders)); } catch (e) {} syncNative(); };
  const saveSettings = () => { try { localStorage.setItem(SKEY, JSON.stringify(settings)); } catch (e) {} syncNative(); };
  let reminders = load(KEY, []);
  const settings = Object.assign({ name: '', voiceURI: '', rate: 1, defaultInterval: 60, repeat: 1, chime: true, listenAfter: true, alarmVolume: true }, load(SKEY, {}));

  // ---------- horas em texto ----------
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (t) => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const dayWord = (t) => {
    const d = new Date(t); d.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 864e5);
    if (diff === 0) return '';
    if (diff === 1) return 'amanhã ';
    if (diff === -1) return 'ontem ';
    return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric' }) + ' ';
  };
  const sayTime = (t) => {
    const d = new Date(t), h = d.getHours(), m = d.getMinutes();
    if (h === 12 && m === 0) return 'meio-dia';
    if (h === 23 && m === 59) return 'meia-noite';
    if (m === 0) return h + (h === 1 ? ' hora' : ' horas');
    if (m === 30) return h + ' e meia';
    return h + ' e ' + m;
  };
  const sayDuration = (ms) => {
    if (ms < 59500) { const sec = Math.max(1, Math.round(ms / 1000)); return sec + (sec === 1 ? ' segundo' : ' segundos'); }
    const total = Math.max(1, Math.round(ms / MIN));
    const h = Math.floor(total / 60), m = total % 60;
    const hs = h ? h + (h === 1 ? ' hora' : ' horas') : '';
    const ms_ = m ? m + (m === 1 ? ' minuto' : ' minutos') : '';
    return [hs, ms_].filter(Boolean).join(' e ');
  };
  const sayInterval = (min) => {
    if (min < 1) { const sec = Math.round(min * 60); return 'de ' + sec + ' em ' + sec + ' segundos'; }
    if (min === 1) return 'de minuto a minuto';
    if (min === 60) return 'de hora a hora';
    if (min === 30) return 'de meia em meia hora';
    if (min === 15) return 'de quarto em quarto de hora';
    if (min % 60 === 0) return 'de ' + (min / 60) + ' em ' + (min / 60) + ' horas';
    return 'de ' + min + ' em ' + min + ' minutos';
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

  // ---------- agenda de cada lembrete ----------
  function plan(r) {
    const ev = [];
    if (r.once) ev.push({ at: r.firstAt, kind: 'once' });
    else {
      const step = r.interval * MIN;
      const stop = r.hasDeadline ? r.end - 10 * MIN : r.end + 1;
      for (let t = r.firstAt; t < stop && ev.length < 400; t += step) ev.push({ at: t, kind: 'regular' });
      if (r.hasDeadline) {
        const f = r.end - 15 * MIN;
        if (r.interval >= 25 && f > r.createdAt + 2 * MIN) {
          for (let i = ev.length - 1; i >= 0; i--) if (Math.abs(ev[i].at - f) < 10 * MIN) ev.splice(i, 1);
          ev.push({ at: f, kind: 'final' });
        }
        ev.push({ at: r.end, kind: 'deadline' });
      }
    }
    if (r.snoozeAt) ev.push({ at: r.snoozeAt, kind: 'snooze' });
    return ev
      .filter(e => !(r.quietUntil && e.kind === 'regular' && e.at < r.quietUntil))
      .sort((a, b) => a.at - b.at);
  }
  const pending = (r) => plan(r).filter(e => e.at > (r.lastAt || 0));
  const nextEvent = (r) => pending(r)[0] || null;
  function status(r) {
    if (r.done) return 'done';
    if (nextEvent(r)) return 'active';
    return r.hasDeadline || r.once ? 'waiting' : 'finished';
  }
  function describe(r) {
    const day = dayWord(r.once ? r.firstAt : (r.end || r.firstAt));
    if (r.once) return (day ? cap(day) : 'Hoje ') + 'às ' + hm(r.firstAt) + ' · uma vez';
    let s = cap(sayInterval(r.interval));
    s += r.hasDeadline ? ' · prazo ' + day + 'até às ' + hm(r.end) : ' · até às ' + hm(r.end);
    return s;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---------- som ----------
  let audioCtx = null;
  let unlocked = !!NATIVE;
  let onUnlocked = [];
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    setTimeout(() => { onUnlocked.forEach(f => f()); onUnlocked = []; }, 50);
    $('unlock').hidden = true;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  }
  function chime() {
    return new Promise((res) => {
      if (!settings.chime || !audioCtx) return res();
      try {
        const t0 = audioCtx.currentTime;
        [[784, 0], [1047, 0.18], [1319, 0.36]].forEach(([f, dt]) => {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t0 + dt);
          g.gain.exponentialRampToValueAtTime(0.35, t0 + dt + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.5);
          o.connect(g).connect(audioCtx.destination);
          o.start(t0 + dt); o.stop(t0 + dt + 0.55);
        });
      } catch (e) {}
      setTimeout(res, 900);
    });
  }

  let voices = [];
  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    voices = speechSynthesis.getVoices().filter(v => /^pt/i.test(v.lang));
    voices.sort((a, b) => score(b) - score(a));
    fillVoiceSelect();
  }
  const score = (v) => (/pt[-_]PT/i.test(v.lang) ? 10 : 0) + (/natural|online|premium|enhanced|neural/i.test(v.name) ? 3 : 0) + (v.localService ? 0 : 1);
  function pickVoice() {
    return voices.find(v => v.voiceURI === settings.voiceURI) || voices[0] || null;
  }
  let tokSeq = 0;
  const nativeWaiters = {};
  function speakOnce(text) {
    if (NATIVE) {
      return new Promise((res) => {
        const tok = 't' + (++tokSeq);
        nativeWaiters[tok] = res;
        setTimeout(() => { if (nativeWaiters[tok]) { delete nativeWaiters[tok]; res(); } }, 5000 + text.length * 150);
        NATIVE.speak(text, settings.rate, tok);
      });
    }
    return new Promise((res) => {
      if (!('speechSynthesis' in window)) return res();
      const u = new SpeechSynthesisUtterance(text);
      const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'pt-PT';
      u.rate = settings.rate;
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(guard); res(); } };
      u.onend = fin; u.onerror = fin;
      const guard = setTimeout(fin, 4000 + text.length * 120);
      speechSynthesis.speak(u);
    });
  }
  function cancelSpeech() {
    if (NATIVE) NATIVE.stopSpeaking();
    else if ('speechSynthesis' in window) speechSynthesis.cancel();
  }
  async function speak(text, times) {
    cancelSpeech();
    for (let i = 0; i < (times || 1); i++) {
      await speakOnce(text);
      if (i < times - 1) await sleep(700);
    }
  }
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ---------- reconhecimento de voz ----------
  const SR = NATIVE ? null : (window.SpeechRecognition || window.webkitSpeechRecognition);
  const CAN_LISTEN = !!(SR || NATIVE);
  let activeRec = null;
  let nativeListen = null;
  function listen({ onInterim, maxMs } = {}) {
    if (NATIVE) {
      return new Promise((resolve) => { nativeListen = resolve; NATIVE.listen(); });
    }
    return new Promise((resolve, reject) => {
      if (!SR) return reject(new Error('unsupported'));
      if (activeRec) { try { activeRec.abort(); } catch (e) {} }
      const rec = new SR();
      activeRec = rec;
      rec.lang = 'pt-PT';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      let finalText = '', lastText = '', err = null;
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const txt = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += txt; else interim += txt;
        }
        lastText = (finalText + ' ' + interim).trim();
        if (onInterim) onInterim(lastText);
      };
      rec.onerror = (e) => { err = e.error; };
      rec.onend = () => {
        clearTimeout(timer);
        if (activeRec === rec) activeRec = null;
        const text = (finalText || lastText).trim();
        if (text) resolve(text);
        else if (err && err !== 'no-speech' && err !== 'aborted') reject(new Error(err));
        else resolve('');
      };
      const timer = maxMs ? setTimeout(() => { try { rec.stop(); } catch (e) {} }, maxMs) : null;
      try { rec.start(); } catch (e) { reject(e); }
    });
  }
  function stopListening() { if (activeRec) { try { activeRec.stop(); } catch (e) {} } }

  // ---------- mensagens faladas ----------
  function message(r, kind) { return cap(rawMessage(r, kind)); }
  // "o meu nome" passa a ser o nome das definições
  const withName = (t) => t.replace(/\b(?:o\s+)?meu\s+nome\b/gi, settings.name || 'o teu nome');
  function rawMessage(r, kind) {
    if (r.say && kind !== 'final' && kind !== 'deadline') return withName(r.say) + (/[.!?]$/.test(r.say) ? '' : '.');
    const who = settings.name ? settings.name + ', ' : '';
    const task = r.text.replace(/[.!]+$/, '');
    const now = Date.now();
    switch (kind) {
      case 'final':
        return who + 'último aviso! ' + task + '. Faltam ' + sayDuration(r.end - now) + ', tens até às ' + sayTime(r.end) + '.';
      case 'deadline':
        return who + 'chegou a hora limite: ' + task + '. Já está feito?';
      case 'once':
        return who + 'está na hora: ' + task + '.';
      case 'snooze':
        return who + 'voltei a lembrar: ' + task + (r.hasDeadline && r.end > now ? '. Tens até às ' + sayTime(r.end) + '.' : '.');
      default: {
        let s = who + 'lembrete: ' + task + '.';
        if (r.hasDeadline && r.end > now) s += ' Tens até às ' + sayTime(r.end) + ', faltam ' + sayDuration(r.end - now) + '.';
        return s;
      }
    }
  }
  function confirmation(r) {
    const task = lowerFirst(r.text);
    const day = dayWord(r.once ? r.firstAt : r.firstAt);
    if (r.once) return 'Combinado. ' + cap(day + 'às ') + sayTime(r.firstAt) + ' lembro-te de: ' + task + '.';
    let s = r.say
      ? 'Combinado. Vou dizer ' + withName(r.say) + ', ' + sayInterval(r.interval)
      : 'Combinado. Vou lembrar-te ' + sayInterval(r.interval) + ': ' + task;
    if (r.hasDeadline) s += ', até às ' + sayTime(r.end);
    else if (r.forMs) s += ', durante ' + sayDuration(r.forMs);
    if (r.interval >= 1) s += '. O primeiro aviso é ' + day + 'às ' + sayTime(r.firstAt) + '.';
    else s += '. Começo daqui a ' + sayDuration(r.firstAt - Date.now()) + '.';
    return s;
  }

  // ---------- disparo ----------
  const queue = [];
  const nativeWatch = {};
  let busy = false;
  let current = null;

  function tick() {
    const now = Date.now();
    let changed = false;
    reminders.forEach(r => {
      if (r.done) return;
      const due = pending(r).filter(e => e.at <= now);
      if (!due.length) return;
      const ev = due[due.length - 1];
      r.lastAt = ev.at;
      if (ev.kind === 'snooze') r.snoozeAt = null;
      changed = true;
      if (!NATIVE && !queue.some(q => q.r.id === r.id)) queue.push({ r, kind: ev.kind });
      // Na app: quem fala é o Android. Se a app está à vista e o Android não disser nada em 15 s, falamos nós.
      if (NATIVE && !document.hidden) nativeWatch[r.id] = { kind: ev.kind, t: now };
    });
    if (changed) { save(); render(); }
    Object.keys(nativeWatch).forEach(id => {
      if (now - nativeWatch[id].t < 15000) return;
      const r = reminders.find(x => x.id === id);
      if (r && !r.done && !queue.some(q => q.r.id === id)) queue.push({ r, kind: nativeWatch[id].kind });
      delete nativeWatch[id];
    });
    if (!busy && queue.length) runQueue();
    updateCountdowns();
  }

  async function runQueue() {
    busy = true;
    while (queue.length) {
      const { r, kind } = queue.shift();
      if (r.done || !reminders.includes(r)) continue;
      current = { r, kind };
      showAlert(r, kind);
      notify(r, kind);
      // o browser só deixa falar depois de um toque na página
      if (!unlocked) await new Promise(res => onUnlocked.push(res));
      if (r.done || !current || current.r !== r) continue;
      await chime();
      await speak(message(r, kind), settings.repeat);
      if (settings.listenAfter && CAN_LISTEN && current && current.r === r) await listenForAnswer(r);
    }
    busy = false;
  }

  async function listenForAnswer(r) {
    $('alertHint').textContent = 'A ouvir… diz “feito”, “adia 15 minutos” ou “apaga”.';
    let text = '';
    try { text = await listen({ maxMs: 7000, onInterim: (t) => { $('alertHint').textContent = '“' + t + '”'; } }); } catch (e) {}
    $('alertHint').textContent = '';
    if (!text || !current || current.r !== r) return;
    const t = text.toLowerCase();
    if (/(feito|fiz|já está|já foi|já fui|tratei|conclu|pronto|despachad|check|ok feito)/.test(t)) await markDone(r, true);
    else if (/(apaga|cancela|esquece|elimina|remove)/.test(t)) { removeReminder(r); hideAlert(); await speak('Apagado.'); }
    else if (/(adia|adiar|depois|mais tarde|daqui a|espera|lembra.?me)/.test(t)) {
      const m = LembreteParser.normalize(t).match(/(\d+)\s*(minutos?|min|horas?|h)\b/);
      const mins = m ? parseInt(m[1], 10) * (/^h/.test(m[2]) ? 60 : 1) : 10;
      await snooze(r, mins, true);
    }
  }

  function showAlert(r, kind) {
    $('alert').hidden = false;
    $('alertKicker').textContent = { final: 'Último aviso', deadline: 'Hora limite', snooze: 'Outra vez', once: 'Está na hora' }[kind] || 'Lembrete';
    $('alertTask').textContent = r.text;
    const left = r.hasDeadline && r.end > Date.now() ? 'Tens até às ' + hm(r.end) + ' · faltam ' + sayDuration(r.end - Date.now()) : '';
    $('alertMeta').textContent = left;
  }
  function hideAlert() { $('alert').hidden = true; current = null; stopListening(); }

  function closeTopLayer() {
    if (!$('alert').hidden) { cancelSpeech(); hideAlert(); return true; }
    for (const id of ['editDlg', 'settingsDlg']) if ($(id).open) { $(id).close(); return true; }
    if (!$('typeForm').hidden) { setTyping(false); return true; }
    return false;
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('alert').hidden) closeTopLayer(); });

  async function markDone(r, spoken) {
    r.done = true; r.doneAt = Date.now();
    save(); render();
    if (current && current.r === r) hideAlert();
    closeNotif(r.id);
    if (spoken) await speak(pick(['Boa! Está feito.', 'Muito bem, menos uma coisa.', 'Feito. Boa!']));
  }
  async function snooze(r, mins, spoken) {
    r.snoozeAt = Date.now() + mins * MIN;
    r.quietUntil = r.snoozeAt;
    if (r.done) r.done = false;
    save(); render();
    if (current && current.r === r) hideAlert();
    closeNotif(r.id);
    if (spoken) await speak('Está bem, lembro-te daqui a ' + sayDuration(mins * MIN) + '.');
    else toast('Volto a lembrar às ' + hm(r.snoozeAt));
  }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function removeReminder(r) {
    reminders = reminders.filter(x => x !== r);
    save(); render();
    closeNotif(r.id);
  }

  // ---------- notificações (para quando a app está noutro separador) ----------
  let swReg = null;
  if (!NATIVE && 'serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(reg => { swReg = reg; }).catch(() => {});
    navigator.serviceWorker.addEventListener('message', (e) => handleExternalAction(e.data || {}));
  }
  function notifAllowed() { return 'Notification' in window && Notification.permission === 'granted'; }
  function notify(r, kind) {
    if (NATIVE) return;
    if (!notifAllowed()) return;
    const title = { final: 'Último aviso', deadline: 'Hora limite', once: 'Está na hora' }[kind] || 'Lembrete';
    const body = r.text + (r.hasDeadline && r.end > Date.now() ? ' · até às ' + hm(r.end) : '');
    const opts = { body, tag: 'lembrete-' + r.id, renotify: true, requireInteraction: true, icon: 'icon.svg', badge: 'icon.svg', data: { id: r.id } };
    if (swReg && swReg.showNotification) {
      swReg.showNotification(title, Object.assign(opts, { actions: [{ action: 'done', title: 'Feito ✓' }, { action: 'snooze', title: '+10 min' }] })).catch(() => {});
    } else if (document.hidden) {
      try { new Notification(title, opts); } catch (e) {}
    }
  }
  function closeNotif(id) {
    if (NATIVE) { NATIVE.cancelNotification(id); return; }
    if (swReg && swReg.getNotifications) swReg.getNotifications({ tag: 'lembrete-' + id }).then(ns => ns.forEach(n => n.close())).catch(() => {});
  }
  function handleExternalAction({ action, id }) {
    const r = reminders.find(x => x.id === id);
    if (!r) return;
    if (action === 'done') markDone(r, false);
    else if (action === 'snooze') snooze(r, 10, false);
  }
  function updateNotifButton() {
    $('enableNotif').hidden = !('Notification' in window) || Notification.permission !== 'default';
  }

  // ---------- manter ecrã ligado ----------
  let wakeLock = null, wantAwake = false;
  async function setAwake(on) {
    wantAwake = on;
    $('keepAwake').setAttribute('aria-pressed', String(on));
    if (!('wakeLock' in navigator)) { if (on) toast('Este browser não deixa manter o ecrã ligado.'); return; }
    try {
      if (on && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) { $('keepAwake').setAttribute('aria-pressed', 'false'); wantAwake = false; }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { if (wantAwake && !wakeLock) setAwake(true); tick(); }
  });

  // ---------- criar a partir de texto/voz ----------
  let lastCreated = null;
  async function handleInput(text) {
    text = text.trim();
    if (!text) return;
    const t = text.toLowerCase();

    if (/^(?:o\s+)?que\s+(?:é\s+que\s+)?(?:tenho|falta)|^(?:lista|lê|diz)\b.*(?:lembretes|tarefas)|^(?:quais|que)\s+(?:são\s+)?(?:os\s+)?(?:meus\s+)?lembretes/.test(t)) {
      return readList();
    }
    const doneM = t.match(/^(?:já\s+)?(?:fiz|feito|terminei|acabei|já fui)\s+(?:o|a|de|que)?\s*(.+)$/);
    if (doneM) {
      const r = findByWords(doneM[1]);
      if (r) { await markDone(r, true); return; }
    }

    const p = LembreteParser.parse(text, { defaultInterval: settings.defaultInterval });
    const r = {
      id: Math.random().toString(36).slice(2, 10),
      text: p.task, interval: p.interval, firstAt: p.firstAt, end: p.end,
      once: p.once, hasDeadline: p.hasDeadline, createdAt: Date.now(), lastAt: 0, done: false,
      said: text, say: p.say || null, forMs: p.forMs || null,
    };
    reminders.push(r);
    lastCreated = r;
    save(); render();
    toast('Adicionado: ' + r.text, [
      { label: 'Editar', fn: () => openEdit(r) },
      { label: 'Desfazer', fn: () => { removeReminder(r); speak('Desfeito.'); } },
    ]);
    await speak(confirmation(r));
  }

  function findByWords(phrase) {
    const words = phrase.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let best = null, bestScore = 0;
    reminders.filter(r => !r.done).forEach(r => {
      const txt = r.text.toLowerCase();
      const sc = words.filter(w => txt.includes(w)).length;
      if (sc > bestScore) { best = r; bestScore = sc; }
    });
    return best;
  }

  async function readList() {
    const open = reminders.filter(r => !r.done);
    if (!open.length) return speak('Não tens nada pendente. Boa!');
    const parts = open.map(r => {
      if (r.once) return r.text + ', ' + dayWord(r.firstAt) + 'às ' + sayTime(r.firstAt);
      if (r.hasDeadline) return r.text + ', até às ' + sayTime(r.end);
      return r.text;
    });
    await speak('Tens ' + open.length + (open.length === 1 ? ' coisa' : ' coisas') + ' para fazer. ' + parts.join('. ') + '.');
  }

  // ---------- microfone ----------
  let micBusy = false;
  async function onMic() {
    unlock();
    if (activeRec && micBusy) { stopListening(); return; }
    if (!CAN_LISTEN) { setTyping(true); toast('Este browser não percebe voz. Usa o Chrome, o Edge ou o Safari, ou escreve.'); return; }
    cancelSpeech();
    micBusy = true;
    $('mic').classList.add('listening');
    $('micLabel').textContent = 'A ouvir…';
    $('transcript').textContent = '';
    try {
      const text = await listen({ onInterim: (t) => { $('transcript').textContent = '“' + t + '”'; } });
      $('mic').classList.remove('listening');
      $('micLabel').textContent = 'Toca e fala';
      micBusy = false;
      if (!text) { $('transcript').textContent = 'Não ouvi nada. Tenta outra vez.'; return; }
      $('transcript').textContent = '“' + text + '”';
      await handleInput(text);
    } catch (e) {
      micBusy = false;
      $('mic').classList.remove('listening');
      $('micLabel').textContent = 'Toca e fala';
      const msg = e.message === 'not-allowed' || e.message === 'service-not-allowed'
        ? 'Tens de dar autorização ao microfone (no cadeado ao lado do endereço).'
        : e.message === 'network' ? 'O reconhecimento de voz precisa de internet.' : 'Não consegui ouvir. Tenta outra vez ou escreve.';
      $('transcript').textContent = msg;
    }
  }

  // ---------- desenhar ----------
  const ICON = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2V7Zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 10.4 3.5 2.1-.8 1.3L11 13V7h2v5.4Z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8a2.5 2.5 0 0 0 2.4 2Zm7-6V11a7 7 0 0 0-5.5-6.8V3.5a1.5 1.5 0 0 0-3 0v.7A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"/></svg>',
    say: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3Zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4Z"/></svg>',
    undo: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12.5 8c-2.6 0-5 1-6.9 2.6L2 7v9h9l-3.6-3.6A8 8 0 0 1 20.1 16l2.4-.8A10.5 10.5 0 0 0 12.5 8Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>',
  };
  const shortInterval = (min) => min < 1 ? 'De ' + Math.round(min * 60) + ' em ' + Math.round(min * 60) + ' s' : min === 1 ? 'De minuto a minuto' : min === 60 ? 'De hora a hora' : min === 30 ? 'De meia em meia hora' : min % 60 === 0 ? 'De ' + (min / 60) + ' em ' + (min / 60) + ' h' : 'De ' + min + ' em ' + min + ' min';

  function render() {
    const open = reminders.filter(r => !r.done).sort((a, b) => {
      const na = nextEvent(a), nb = nextEvent(b);
      return (na ? na.at : 9e15) - (nb ? nb.at : 9e15);
    });
    const done = reminders.filter(r => r.done).sort((a, b) => b.doneAt - a.doneAt);
    $('list').innerHTML = open.map(itemHTML).join('');
    $('empty').hidden = open.length > 0;
    $('count').textContent = open.length ? String(open.length) : '';
    $('doneWrap').hidden = done.length === 0;
    $('doneCount').textContent = String(done.length);
    $('doneList').innerHTML = done.map(r => `<li class="item finished" data-id="${r.id}">
        <span class="check" aria-hidden="true">${ICON.check}</span>
        <div class="item-body"><p class="item-task">${esc(r.text)}</p></div>
        <div class="item-when"><small>feito às ${hm(r.doneAt)}</small>
          <span style="display:flex;gap:6px"><button class="say" data-act="undo" aria-label="Voltar a pôr na lista" title="Desfazer">${ICON.undo}</button>
          <button class="say" data-act="delete" aria-label="Apagar" title="Apagar">${ICON.trash}</button></span></div></li>`).join('');
    renderHeader(open, done);
    updateCountdowns();
  }

  function renderHeader(open, done) {
    const h = new Date().getHours();
    const hello = h < 6 ? 'Boa noite' : h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
    $('greeting').textContent = hello + (settings.name ? ', ' + settings.name : '') + '.';
    $('today').textContent = cap(new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', ''));
    document.querySelector('.list-head').hidden = open.length === 0;
    const n = open.length;
    $('summary').innerHTML = n === 0
      ? (done.length ? 'Tudo feito. <b>Boa!</b>' : 'Nada pendente. Diz-me o que tens de fazer.')
      : 'Tens <b>' + n + (n === 1 ? ' coisa' : ' coisas') + '</b> para fazer' + (done.length ? ' · ' + done.length + ' já ' + (done.length === 1 ? 'feita' : 'feitas') : '') + '.';
  }

  function itemHTML(r) {
    const st = status(r);
    const tags = [];
    if (r.once) tags.push(`<span class="tag">${ICON.bell}Uma vez</span>`);
    else tags.push(`<span class="tag">${ICON.repeat}${esc(shortInterval(r.interval))}</span>`);
    if (r.hasDeadline) tags.push(`<span class="tag deadline">${ICON.clock}${dayWord(r.end)}até ${hm(r.end)}</span>`);
    else if (!r.once && r.end) tags.push(`<span class="tag">até ${hm(r.end)}</span>`);
    return `<li class="item ${st}" data-id="${r.id}">
      <button class="check" data-act="done" aria-label="Marcar como feito">${ICON.check}</button>
      <button class="item-body" data-act="edit" aria-label="Editar ${esc(r.text)}">
        <p class="item-task">${esc(r.text)}</p>
        <div class="item-meta">${tags.join('')}</div>
        ${r.hasDeadline ? `<div class="item-bar"><i data-bar="${r.id}"></i></div>` : ''}
      </button>
      <div class="item-when" data-next="${r.id}"><b></b><small></small></div>
    </li>`;
  }

  const progress = (r, now) => {
    const from = r.createdAt || r.firstAt, to = r.end;
    return to > from ? Math.min(1, Math.max(0, (now - from) / (to - from))) : 1;
  };

  function updateCountdowns() {
    const now = Date.now();
    document.querySelectorAll('[data-next]').forEach(el => {
      const r = reminders.find(x => x.id === el.dataset.next);
      if (!r) return;
      const ev = nextEvent(r);
      const b = el.querySelector('b'), sm = el.querySelector('small');
      const big = ev ? bigTime(ev.at, now) : (r.hasDeadline || r.once ? '!' : '—');
      const small = ev ? (dayWord(ev.at) ? dayWord(ev.at).trim() : 'em ' + shortDur(ev.at - now)) : (r.hasDeadline || r.once ? 'Já passou. Fizeste?' : 'sem avisos');
      if (b.textContent !== big) b.textContent = big;
      if (sm.textContent !== small) sm.textContent = small;
    });
    document.querySelectorAll('[data-bar]').forEach(el => {
      const r = reminders.find(x => x.id === el.dataset.bar);
      if (r) el.style.width = Math.round(progress(r, now) * 100) + '%';
    });
    updateNext(now);
  }

  // cartão grande: o próximo aviso de todos
  function updateNext(now) {
    let best = null, bestEv = null;
    reminders.forEach(r => {
      if (r.done) return;
      const ev = nextEvent(r);
      if (ev && (!bestEv || ev.at < bestEv.at)) { best = r; bestEv = ev; }
    });
    $('next').hidden = !best;
    if (!best) return;
    const label = { final: 'Último aviso', deadline: 'Hora limite', snooze: 'Volto a lembrar', once: 'A seguir' }[bestEv.kind] || 'Próximo aviso';
    setText('nextKind', label);
    setText('nextIn', dayWord(bestEv.at) ? cap(dayWord(bestEv.at).trim()) : 'daqui a ' + shortDur(bestEv.at - now));
    setText('nextTime', bigTime(bestEv.at, now));
    setText('nextTask', best.text);
    const meta = best.once ? 'Aviso único' : shortInterval(best.interval) + (best.hasDeadline ? ' · prazo às ' + hm(best.end) : '');
    setText('nextMeta', meta);
    // anel: quanto falta para o próximo aviso (cheio = acabou de avisar, vazio = vai tocar)
    const span = best.once ? Math.max(bestEv.at - (best.createdAt || now), MIN) : (bestEv.kind === 'regular' ? best.interval * MIN : 15 * MIN);
    const left = Math.min(1, Math.max(0, (bestEv.at - now) / span));
    $('nextRing').style.strokeDashoffset = String(326.7 * (1 - left));
    $('nextBarWrap').hidden = !best.hasDeadline;
    if (best.hasDeadline) $('nextBar').style.width = Math.round(progress(best, now) * 100) + '%';
  }
  // a menos de um minuto, mostra a contagem em segundos em vez da hora
  const bigTime = (at, now) => at - now < 60e3 ? Math.max(0, Math.ceil((at - now) / 1000)) + ' s' : hm(at);
  const setText = (id, t) => { const el = $(id); if (el.textContent !== t) el.textContent = t; };
  const shortDur = (ms) => {
    if (ms < 60e3) return Math.max(0, Math.ceil(ms / 1000)) + ' s';
    const m = Math.max(0, Math.ceil(ms / MIN));
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60), r = m % 60;
    return h + ' h' + (r ? ' ' + r + ' min' : '');
  };

  let toastTimer = null;
  function toast(text, actions) {
    const el = $('toast');
    el.innerHTML = '<span>' + esc(text) + '</span>';
    (actions || []).forEach(a => {
      const b = document.createElement('button');
      b.textContent = a.label;
      b.onclick = () => { el.hidden = true; a.fn(); };
      el.appendChild(b);
    });
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, actions ? 9000 : 4000);
  }

  // ---------- editar ----------
  let editing = null;
  const toTimeInput = (t) => hm(t);
  function fromTimeInput(val, ref) {
    const [h, m] = val.split(':').map(Number);
    const d = new Date(ref || Date.now()); d.setHours(h, m, 0, 0);
    return d.getTime();
  }
  function openEdit(r) {
    editing = r;
    $('eTask').value = r.text;
    $('eInterval').value = r.once ? '0' : String(r.interval);
    if (!$('eInterval').value) {
      const o = document.createElement('option'); o.value = r.interval; o.textContent = 'De ' + r.interval + ' em ' + r.interval + ' min';
      $('eInterval').appendChild(o); $('eInterval').value = String(r.interval);
    }
    $('eStart').value = toTimeInput(r.snoozeAt && r.snoozeAt > Date.now() ? r.snoozeAt : (nextEvent(r) || { at: r.firstAt }).at);
    $('eEnd').value = r.end ? toTimeInput(r.end) : '';
    $('eDeadline').checked = !!r.hasDeadline;
    syncEditFields();
    $('editDlg').showModal();
  }
  function syncEditFields() {
    const once = $('eInterval').value === '0';
    $('eEndWrap').style.visibility = once ? 'hidden' : 'visible';
    $('eDeadline').closest('label').hidden = once;
    $('eStartLabel').textContent = once ? 'Hora do aviso' : 'Próximo aviso';
  }
  function saveEdit() {
    const r = editing; if (!r) return;
    const interval = parseFloat($('eInterval').value);
    const ref = r.once ? r.firstAt : (r.end || r.firstAt);
    let start = fromTimeInput($('eStart').value, ref);
    if (start < Date.now() - MIN) start += 864e5;
    r.text = $('eTask').value.trim() || r.text;
    r.once = interval === 0;
    r.interval = r.once ? null : interval;
    r.firstAt = start;
    r.snoozeAt = null; r.quietUntil = null;
    r.lastAt = Math.min(Date.now(), start - 1);
    if (r.once) { r.end = null; r.hasDeadline = false; }
    else {
      let end = $('eEnd').value ? fromTimeInput($('eEnd').value, start) : start + 6 * 3600e3;
      if (end <= start) end += 864e5;
      r.end = end;
      r.hasDeadline = $('eDeadline').checked && !!$('eEnd').value;
    }
    r.done = false;
    save(); render();
    toast('Guardado');
  }

  // ---------- definições ----------
  function fillVoiceSelect() {
    const sel = $('sVoice');
    if (!voices.length) { sel.innerHTML = '<option value="">Voz do sistema</option>'; return; }
    sel.innerHTML = voices.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('');
    sel.value = (pickVoice() || {}).voiceURI || '';
  }
  function openSettings() {
    $('sName').value = settings.name;
    $('sRate').value = settings.rate; $('sRateOut').textContent = settings.rate.toFixed(2) + '×';
    $('sInterval').value = String(settings.defaultInterval);
    $('sRepeat').value = String(settings.repeat);
    $('sChime').checked = settings.chime;
    $('sListen').checked = settings.listenAfter;
    $('sAlarm').checked = settings.alarmVolume;
    $('sListen').disabled = !CAN_LISTEN;
    fillVoiceSelect();
    $('settingsDlg').showModal();
    if (NATIVE) {
      showDiag();
      clearInterval(diagTimer);
      diagTimer = setInterval(() => { if ($('settingsDlg').open) showDiag(); else clearInterval(diagTimer); }, 2000);
    }
  }
  let diagTimer = null;
  function showDiag() {
    let d = {};
    try { d = JSON.parse(NATIVE.diag()); } catch (e) {}
    const st = d.status || {};
    const yn = (v) => v ? '✅' : '❌';
    $('diagInfo').innerHTML = esc(d.device || '') + '<br>' +
      yn(st.notifications) + ' notificações · ' + yn(st.exact) + ' alarmes exatos · ' + yn(st.battery) + ' sem poupança de bateria · ' + yn(st.tts) + ' voz<br>' +
      'Avisos marcados no Android: <b>' + (d.events || 0) + '</b>' + (d.next ? ' · próximo às <b>' + esc(d.next) + '</b>' : '');
    const lines = (d.log || []).slice().reverse();
    $('diagLog').textContent = lines.length ? lines.join('\n') : 'Ainda sem registos.';
  }
  function readSettings() {
    settings.name = $('sName').value.trim();
    settings.voiceURI = $('sVoice').value;
    settings.rate = parseFloat($('sRate').value);
    settings.defaultInterval = parseInt($('sInterval').value, 10);
    settings.repeat = parseInt($('sRepeat').value, 10);
    settings.chime = $('sChime').checked;
    settings.listenAfter = $('sListen').checked;
    settings.alarmVolume = $('sAlarm').checked;
    saveSettings();
  }

  // ---------- eventos ----------
  $('mic').addEventListener('click', onMic);
  $('typeForm').addEventListener('submit', (e) => {
    e.preventDefault(); unlock();
    const v = $('typeInput').value; $('typeInput').value = '';
    $('transcript').textContent = '';
    handleInput(v);
  });
  function setTyping(on) {
    $('typeForm').hidden = !on;
    $('typeToggle').setAttribute('aria-expanded', String(on));
    if (on) setTimeout(() => $('typeInput').focus(), 30);
  }
  $('typeToggle').addEventListener('click', () => setTyping($('typeForm').hidden));
  $('readAll').addEventListener('click', () => { unlock(); readList(); });
  document.querySelectorAll('[data-example]').forEach(b => b.addEventListener('click', () => {
    setTyping(true);
    $('typeInput').value = b.dataset.example;
  }));
  $('unlock').addEventListener('click', () => { unlock(); speak('Som ligado. Estou aqui para te lembrar.'); });
  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('keydown', unlock, { capture: true });

  $('list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const r = reminders.find(x => x.id === b.closest('[data-id]').dataset.id); if (!r) return;
    if (b.dataset.act === 'done') {
      const li = b.closest('.item');
      li.classList.add('completing');
      setTimeout(() => markDone(r, true), 380);
    }
    else if (b.dataset.act === 'edit') openEdit(r);
    else if (b.dataset.act === 'say') speak(message(r, 'regular'));
  });
  $('doneList').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const r = reminders.find(x => x.id === b.closest('[data-id]').dataset.id); if (!r) return;
    if (b.dataset.act === 'undo') { r.done = false; r.lastAt = Date.now(); save(); render(); }
    else if (b.dataset.act === 'delete') removeReminder(r);
  });
  $('clearDone').addEventListener('click', () => { reminders = reminders.filter(r => !r.done); save(); render(); });

  $('alert').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-alert]'); if (!b || !current) return;
    const r = current.r;
    cancelSpeech();
    stopListening();
    const a = b.dataset.alert;
    if (a === 'done') markDone(r, true);
    else if (a === 'snooze10') snooze(r, 10, true);
    else if (a === 'snooze30') snooze(r, 30, true);
    else if (a === 'repeat') speak(message(r, current.kind));
    else if (a === 'close') hideAlert();
  });

  $('eInterval').addEventListener('change', syncEditFields);
  $('editForm').addEventListener('submit', (e) => { if (e.submitter && e.submitter.value === 'save') saveEdit(); });
  $('eCancel').addEventListener('click', () => $('editDlg').close());
  $('eDelete').addEventListener('click', () => {
    if (editing) { removeReminder(editing); if (current && current.r === editing) hideAlert(); }
    $('editDlg').close();
  });

  $('openSettings').addEventListener('click', openSettings);
  $('settingsForm').addEventListener('input', (e) => {
    if (e.target.id === 'sRate') $('sRateOut').textContent = parseFloat(e.target.value).toFixed(2) + '×';
  });
  $('settingsForm').addEventListener('change', readSettings);
  $('settingsDlg').addEventListener('close', readSettings);
  $('sTest').addEventListener('click', () => {
    readSettings(); unlock();
    speak((settings.name ? settings.name + ', ' : '') + 'lembrete: ir à InPost. Tens até às 16 horas, faltam 2 horas e 10 minutos.');
  });

  $('keepAwake').addEventListener('click', () => setAwake(!wantAwake));
  $('enableNotif').addEventListener('click', async () => {
    try { await Notification.requestPermission(); } catch (e) {}
    updateNotifButton();
  });

  // ---------- ligação à app Android ----------
  let syncTimer = null;
  function syncNative() {
    if (!NATIVE) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const now = Date.now();
      const events = [];
      reminders.filter(r => !r.done).forEach(r => {
        pending(r).filter(e => e.at > now).slice(0, 60).forEach(e => events.push({
          rid: r.id, at: e.at, kind: e.kind, task: r.text, end: r.end || 0, hasDeadline: !!r.hasDeadline,
          say: r.say ? withName(r.say) : '',
        }));
      });
      NATIVE.sync(JSON.stringify({
        events,
        settings: { name: settings.name, rate: settings.rate, repeat: settings.repeat, chime: settings.chime, alarmVolume: settings.alarmVolume },
      }));
    }, 200);
  }
  function applyNativeActions() {
    let list = [];
    try { list = JSON.parse(NATIVE.takeActions() || '[]'); } catch (e) {}
    if (!list.length) return;
    list.forEach(a => {
      const r = reminders.find(x => x.id === a.rid);
      if (!r) return;
      if (a.type === 'done') { r.done = true; r.doneAt = a.at || Date.now(); }
      else if (a.type === 'snooze') { r.snoozeAt = a.until; r.quietUntil = a.until; r.lastAt = Math.max(r.lastAt || 0, Date.now()); }
      if (current && current.r === r) hideAlert();
    });
    save(); render();
  }
  function updateNativeNotice() {
    let st = {};
    try { st = JSON.parse(NATIVE.status()); } catch (e) {}
    $('noticeText').innerHTML = st.battery && st.notifications && st.exact
      ? '<b>Tudo pronto.</b> Os avisos tocam e falam mesmo com o ecrã desligado.'
      : '<b>Falta um passo</b> para os avisos tocarem com o ecrã desligado:';
    $('fixBattery').hidden = !!st.battery;
    $('fixNotif').hidden = !!st.notifications;
    $('fixAlarm').hidden = !!st.exact;
  }
  if (NATIVE) {
    window.__native = {
      onSpeakDone(tok) { const f = nativeWaiters[tok]; if (f) { delete nativeWaiters[tok]; f(); } },
      onListen(text) { const f = nativeListen; nativeListen = null; if (f) f(text || ''); },
      onFired(id, kind) {
        delete nativeWatch[id];
        const r = reminders.find(x => x.id === id);
        if (!r) return;
        r.lastAt = Math.max(r.lastAt || 0, Date.now());
        if (kind === 'snooze') r.snoozeAt = null;
        current = { r, kind };
        showAlert(r, kind);
        save(); render();
      },
      onSpoken(id) {
        if (current && current.r.id === id && settings.listenAfter && !document.hidden) listenForAnswer(current.r);
      },
      onActions() { applyNativeActions(); },
      onResume() { applyNativeActions(); tick(); syncNative(); updateNativeNotice(); },
      // botão "voltar" do Android: fecha o que estiver aberto; devolve false se não havia nada para fechar
      onBack() { return closeTopLayer(); },
    };
    document.documentElement.classList.add('native');
    $('keepAwake').hidden = true;
    $('enableNotif').hidden = true;
    $('voiceWrap').hidden = true;
    $('sAlarmWrap').hidden = false;
    $('sTestStandby').hidden = false;
    $('diagWrap').hidden = false;
    $('sTestNow').addEventListener('click', () => {
      NATIVE.testNow();
      toast('Daqui a 10 segundos deve falar. Podes desligar o ecrã.');
      showDiag();
    });
    $('fixBattery').addEventListener('click', () => NATIVE.openBatterySettings());
    $('fixNotif').addEventListener('click', () => NATIVE.openNotificationSettings());
    $('fixAlarm').addEventListener('click', () => NATIVE.openAlarmSettings());
    $('sTestStandby').addEventListener('click', () => {
      readSettings();
      $('settingsDlg').close();
      const r = {
        id: Math.random().toString(36).slice(2, 10), text: 'Isto é um teste do Lembra-me', interval: null,
        firstAt: Date.now() + 60e3, end: null, once: true, hasDeadline: false, createdAt: Date.now(), lastAt: 0, done: false,
      };
      reminders.push(r); save(); render();
      speak('Desliga o ecrã agora. Daqui a um minuto vou falar.');
    });
  }

  // ---------- arranque ----------
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.addEventListener ? speechSynthesis.addEventListener('voiceschanged', loadVoices) : (speechSynthesis.onvoiceschanged = loadVoices);
  }
  if (!CAN_LISTEN) {
    $('micLabel').textContent = 'Sem voz neste browser';
    setTyping(true);
    $('mic').disabled = true;
  }
  if (!NATIVE) {
    if (!('speechSynthesis' in window)) toast('Este browser não consegue falar. Usa o Chrome, o Edge ou o Safari.');
    $('unlock').hidden = false;
    updateNotifButton();
  } else {
    applyNativeActions();
    updateNativeNotice();
  }

  const qs = new URLSearchParams(location.search);
  if (qs.get('action') && qs.get('id')) { handleExternalAction({ action: qs.get('action'), id: qs.get('id') }); history.replaceState(null, '', location.pathname); }

  // lembretes de dias anteriores já feitos: limpar automaticamente
  const cutoff = Date.now() - 2 * 864e5;
  reminders = reminders.filter(r => !(r.done && r.doneAt < cutoff));
  render();
  setInterval(tick, 1000);
  tick();
  syncNative();

  window.__lembretes = { handleInput, get reminders() { return reminders; }, plan, message, confirmation, tick };
})();
