(function () {
  const manifest = self.OFFLINE_SPEECH;
  const normalize = text => String(text).normalize('NFC').toLowerCase().replace(/[①-⑳]/g, ch => String(ch.charCodeAt(0) - 0x2460 + 1))
    .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const byFirst = new Map();
  for (const phrase of Object.keys(manifest?.clips || {})) {
    if (!byFirst.has(phrase[0])) byFirst.set(phrase[0], []);
    byFirst.get(phrase[0]).push(phrase);
  }
  byFirst.forEach(list => list.sort((a, b) => b.length - a.length));
  let context = null;
  let generation = 0;
  let finishPlayback = null;
  const sources = new Set();
  const buffers = new Map();

  function plan(text) {
    let rest = normalize(text);
    const result = [];
    while (rest) {
      const phrase = byFirst.get(rest[0])?.find(value => rest.startsWith(value));
      if (!phrase) return null;
      result.push(manifest.clips[phrase]);
      rest = rest.slice(phrase.length).trimStart();
    }
    return result.length ? result : null;
  }

  function unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!context || context.state === 'closed') context = new AudioContext({ sampleRate: 16000 });
    // Called before any fetch/await, while the original touch gesture is active.
    if (context.state === 'suspended') context.resume().catch(() => {});
    const silent = context.createBufferSource();
    silent.buffer = context.createBuffer(1, 1, context.sampleRate);
    silent.connect(context.destination);
    silent.start();
    return context;
  }

  function cancel() {
    generation += 1;
    for (const source of sources) {
      source.onended = null;
      try { source.stop(); } catch (_) {}
      source.disconnect();
    }
    sources.clear();
    // Cancellation completes the caller; it must not trigger native TTS fallback.
    if (finishPlayback) finishPlayback(true);
  }

  function loadBuffer(index) {
    const url = manifest.assets[index];
    if (buffers.has(url)) {
      const value = buffers.get(url);
      buffers.delete(url);
      buffers.set(url, value);
      return value;
    }
    const promise = fetch(url).then(response => {
      if (!response.ok) throw new Error('Speech recording unavailable');
      return response.arrayBuffer();
    }).then(bytes => context.decodeAudioData(bytes)).catch(error => {
      buffers.delete(url);
      throw error;
    });
    buffers.set(url, promise);
    // Avoid retaining the entire voice library in iPad memory.
    while (buffers.size > 3) buffers.delete(buffers.keys().next().value);
    return promise;
  }

  function play(text) {
    const clips = plan(text);
    if (!clips || !(window.AudioContext || window.webkitAudioContext)) return null;
    cancel();
    const request = generation;
    try { unlock(); } catch (_) { return null; }
    return new Promise(resolve => {
      let watchdog;
      const finish = success => {
        if (finishPlayback !== finish) return;
        clearTimeout(watchdog);
        finishPlayback = null;
        resolve(success);
      };
      finishPlayback = finish;
      watchdog = setTimeout(() => { finish(false); cancel(); }, 30000);
      const packs = [...new Set(clips.map(clip => clip[0]))];
      Promise.all(packs.map(async index => [index, await loadBuffer(index)])).then(entries => {
        if (request !== generation) return;
        if (context.state !== 'running') throw new Error('Audio needs a touch gesture');
        const decoded = new Map(entries);
        let start = context.currentTime + 0.02;
        clips.forEach(([index, offset, duration], position) => {
          const source = context.createBufferSource();
          source.buffer = decoded.get(index);
          source.connect(context.destination);
          sources.add(source);
          source.onended = () => {
            sources.delete(source);
            source.disconnect();
            if (position === clips.length - 1 && request === generation) finish(true);
          };
          source.start(start, offset, duration);
          start += duration;
        });
        clearTimeout(watchdog);
        watchdog = setTimeout(() => { finish(false); cancel(); }, (start - context.currentTime) * 1000 + 5000);
      }).catch(() => {
        if (request === generation) { finish(false); cancel(); }
      });
    });
  }

  window.offlineSpeech = { plan, play, cancel, unlock };
  window.addEventListener('pointerdown', () => { try { unlock(); } catch (_) {} }, { passive: true });
})();
