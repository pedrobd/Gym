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
    const total = Math.max(1, Math.round(ms / MIN));
    const h = Math.floor(total / 60), m = total % 60;
    const hs = h ? h + (h === 1 ? ' hora' : ' horas') : '';
    const ms_ = m ? m + (m === 1 ? ' minuto' : ' minutos') : '';
    return [hs, ms_].filter(Boolean).join(' e ');
  };
  const sayInterval = (min) => {
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
  function rawMessage(r, kind) {
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
    let s = 'Combinado. Vou lembrar-te ' + sayInterval(r.interval) + ': ' + task;
    if (r.hasDeadline) s += ', até às ' + sayTime(r.end);
    s += '. O primeiro aviso é ' + day + 'às ' + sayTime(r.firstAt) + '.';
    return s;
  }

  // ---------- disparo ----------
  const queue = [];
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
    });
    if (changed) { save(); render(); }
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
    $('alert').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function hideAlert() { $('alert').hidden = true; current = null; stopListening(); }

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
      said: text,
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
    if (!CAN_LISTEN) { $('typeInput').focus(); toast('Este browser não percebe voz. Usa o Chrome, o Edge ou o Safari, ou escreve.'); return; }
    cancelSpeech();
    micBusy = true;
    $('mic').classList.add('listening');
    $('micLabel').textContent = 'A ouvir… fala à vontade';
    $('transcript').textContent = '';
    try {
      const text = await listen({ onInterim: (t) => { $('transcript').textContent = '“' + t + '”'; } });
      $('mic').classList.remove('listening');
      $('micLabel').textContent = 'Toca e diz o que tens de fazer';
      micBusy = false;
      if (!text) { $('transcript').textContent = 'Não ouvi nada. Tenta outra vez.'; return; }
      $('transcript').textContent = '“' + text + '”';
      await handleInput(text);
    } catch (e) {
      micBusy = false;
      $('mic').classList.remove('listening');
      $('micLabel').textContent = 'Toca e diz o que tens de fazer';
      const msg = e.message === 'not-allowed' || e.message === 'service-not-allowed'
        ? 'Tens de dar autorização ao microfone (no cadeado ao lado do endereço).'
        : e.message === 'network' ? 'O reconhecimento de voz precisa de internet.' : 'Não consegui ouvir. Tenta outra vez ou escreve.';
      $('transcript').textContent = msg;
    }
  }

  // ---------- desenhar ----------
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
    $('doneCount').textContent = '(' + done.length + ')';
    $('doneList').innerHTML = done.map(r => `<li class="item finished" data-id="${r.id}">
        <p class="item-task">${esc(r.text)}</p>
        <p class="item-sched">Feito às ${hm(r.doneAt)}</p>
        <div class="item-actions"><button class="round" data-act="undo" aria-label="Voltar a pôr na lista" title="Desfazer">↺</button>
        <button class="round" data-act="delete" aria-label="Apagar" title="Apagar">✕</button></div></li>`).join('');
    updateCountdowns();
  }
  function itemHTML(r) {
    const st = status(r);
    return `<li class="item ${st}" data-id="${r.id}">
      <p class="item-task">${esc(r.text)}</p>
      <p class="item-sched">${esc(describe(r))}</p>
      <p class="item-next" data-next="${r.id}"></p>
      <div class="item-actions">
        <button class="round" data-act="say" aria-label="Ouvir" title="Ouvir"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3Zm13.5 2A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4Z"/></svg></button>
        <button class="round" data-act="edit" aria-label="Editar" title="Editar"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 17.2V21h3.8l11-11-3.8-3.8-11 11ZM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.8 3.8L20.7 7Z"/></svg></button>
        <button class="round ok" data-act="done" aria-label="Marcar como feito" title="Feito"><svg viewBox="0 0 24 24" width="22" height="22"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z"/></svg></button>
      </div>
    </li>`;
  }
  function updateCountdowns() {
    const now = Date.now();
    document.querySelectorAll('[data-next]').forEach(el => {
      const r = reminders.find(x => x.id === el.dataset.next);
      if (!r) return;
      const ev = nextEvent(r);
      let txt;
      if (ev) {
        const label = { final: 'Último aviso', deadline: 'Hora limite', snooze: 'Volto a lembrar' }[ev.kind] || 'Próximo aviso';
        txt = label + ' ' + dayWord(ev.at) + 'às ' + hm(ev.at) + ' · daqui a ' + shortDur(ev.at - now);
      } else txt = r.hasDeadline || r.once ? 'Já passou a hora. Fizeste?' : 'Sem mais avisos';
      if (el.textContent !== txt) el.textContent = txt;
    });
  }
  const shortDur = (ms) => {
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
    const interval = parseInt($('eInterval').value, 10);
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
  $('unlock').addEventListener('click', () => { unlock(); speak('Som ligado. Estou aqui para te lembrar.'); });
  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('keydown', unlock, { capture: true });

  $('list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const r = reminders.find(x => x.id === b.closest('[data-id]').dataset.id); if (!r) return;
    if (b.dataset.act === 'done') markDone(r, true);
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
    };
    document.documentElement.classList.add('native');
    $('keepAwake').hidden = true;
    $('enableNotif').hidden = true;
    $('voiceWrap').hidden = true;
    $('sAlarmWrap').hidden = false;
    $('sTestStandby').hidden = false;
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
    $('micLabel').textContent = 'Este browser não percebe voz — escreve em baixo';
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
