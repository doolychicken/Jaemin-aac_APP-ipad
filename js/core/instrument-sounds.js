(function () {
  // Short synthesized instrument timbres: no network, samples, or device TTS.
  window.createInstrumentPlayer = function () {
    let context;
    let generation = 0;
    const voices = new Set();
    function stop() {
      generation++;
      for (const source of voices) { try { source.stop(); } catch (_) {} }
      voices.clear();
    }
    async function play(instrument, volume = 0.3) {
      stop();
      const request = generation;
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return false;
        context ||= new Audio();
        await context.resume();
        if (request !== generation || context.state !== 'running') return false;
        const level = Math.max(0, Math.min(0.6, volume));
        const now = context.currentTime;
        function tone(frequency, offset, duration, amplitude, type = 'sine', endFrequency) {
          const source = context.createOscillator();
          const gain = context.createGain();
          source.type = type;
          source.frequency.setValueAtTime(frequency, now + offset);
          if (endFrequency) source.frequency.exponentialRampToValueAtTime(endFrequency, now + offset + duration);
          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(amplitude * level, now + offset + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
          source.connect(gain).connect(context.destination);
          voices.add(source);
          source.onended = () => { voices.delete(source); source.disconnect(); gain.disconnect(); };
          source.start(now + offset);
          source.stop(now + offset + duration + 0.02);
        }
        if (instrument === 'piano') {
          [261.63, 329.63, 392].forEach((frequency, i) => {
            [1, 2, 3, 4].forEach((harmonic, j) => tone(frequency * harmonic, i * 0.24, 1.1 / (1 + j * 0.25), 0.35 / (harmonic * harmonic)));
          });
        } else if (instrument === 'drum') {
          [0, 0.4].forEach(offset => {
            tone(160, offset, 0.3, 0.7, 'sine', 48);
            tone(280, offset, 0.07, 0.12, 'triangle', 70);
          });
        } else if (instrument === 'guitar') {
          // Damped harmonics and staggered strings form a soft plucked chord.
          [130.81, 164.81, 196, 261.63].forEach((frequency, i) => {
            [1, 2, 3, 4, 5, 6].forEach(harmonic => tone(frequency * harmonic, i * 0.055, 1.3 / Math.sqrt(harmonic), 0.24 / harmonic));
          });
        } else if (instrument === 'bell') {
          [1, 2.76, 5.4].forEach((ratio, i) => tone(660 * ratio, 0, 1.6 / (1 + i), 0.4 / (i + 1)));
        } else return false;
        return true;
      } catch (_) { stop(); return false; }
    }
    return { play, stop };
  };
})();
