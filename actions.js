export function reactionFor(phase, random = Math.random, mode) {
  const value = random();
  if (mode === 'box' || (!mode && phase >= 79 && phase < 98)) return value < .8 ? 'ignore' : 'ear';
  if (['sleep','roll','wake'].includes(mode) || (!mode && (phase < 48 || phase >= 116))) return value < .2 ? 'ignore' : value < .85 ? 'ear' : 'look';
  return value < .45 ? 'ignore' : value < .75 ? 'ear' : 'look';
}

export function setupActions({ sound, feed, mute, onAction, onMute, initialMuted = false,
  AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext,
  schedule = globalThis.setTimeout }) {
  let audio, master, muted = initialMuted, enabled = false, lastTick, lastHour, lastLocalHour;
  function muteUI() {
    const label = mute.querySelector?.('[data-label]') ?? mute;
    label.textContent = muted ? 'おとをいれる' : 'おとをけす';
    mute.setAttribute('aria-pressed', String(muted));
  }
  async function chime(kind, enable = false) {
    if (enable) enabled = true;
    if (!AudioContext || muted || !enabled) return;
    try {
      audio ??= new AudioContext();
      if (!master) { master = audio.createGain(); master.connect(audio.destination); }
      master.gain.setValueAtTime(muted ? 0 : 1, audio.currentTime);
      await audio.resume();
      if (muted) return;
      const tones = kind === 'hour' ? [[0, 523], [.3, 659]] : [[0, 659], [.3, 523]];
      for (const [offset, frequency] of tones) {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        const start = audio.currentTime + offset;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.035, start + .025);
        gain.gain.exponentialRampToValueAtTime(.001, start + .3);
        oscillator.connect(gain); gain.connect(master);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(start); oscillator.stop(start + .32);
      }
    } catch {}
  }
  function install(button, kind, cooldown) {
    let locked = false;
    button.onclick = () => {
      if (locked) return;
      locked = true; button.disabled = true;
      onAction(kind);
      if (kind === 'door') chime('door', true);
      schedule(() => { locked = false; button.disabled = false; }, cooldown);
    };
  }
  muteUI();
  mute.onclick = () => {
    muted = !muted; muteUI(); onMute(muted);
    if (master) master.gain.setValueAtTime(muted ? 0 : 1, audio.currentTime);
  };
  install(sound, 'door', 4000);
  install(feed, 'food', 8000);
  return {
    clockTick(now, visible) {
      if (!visible) { lastTick = undefined; return; }
      const time = now.getTime();
      const hour = [now.getFullYear(),now.getMonth(),now.getDate(),now.getHours(),now.getTimezoneOffset()].join('-');
      const crossing = lastTick !== undefined && time > lastTick && time - lastTick <= 2500
        && lastLocalHour !== hour;
      lastTick = time; lastLocalHour = hour;
      if (crossing && now.getMinutes() === 0 && now.getSeconds() < 3 && hour !== lastHour) {
        lastHour = hour;
        onAction('hour');
        if (enabled && !muted) chime('hour');
      }
    }
  };
}
