export function sunAt(date, rainy = false, windowAzimuth = 180) {
  // Fictional 35 N, equinox. Local wall-clock time approximates solar time.
  const radians = Math.PI / 180, latitude = 35 * radians;
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const angle = (hour - 12) * 15 * radians;
  const east = -Math.sin(angle), north = -Math.sin(latitude) * Math.cos(angle);
  const up = Math.cos(latitude) * Math.cos(angle);
  const normal = windowAzimuth * radians;
  const incidence = east * Math.sin(normal) + north * Math.cos(normal);
  return { east, north, up, incidence,
    altitude: Math.asin(Math.max(-1, Math.min(1, up))) / radians,
    azimuth: ((Math.atan2(east, north) / radians) + 360) % 360,
    visible: !rainy && up > .000001 && incidence > .000001 };
}
export function daylightAt(date) {
  return Math.max(0, sunAt(date).up / Math.cos(35 * Math.PI / 180));
}
export function windowLightPoints(sun) {
  if (!sun.visible) return [];
  // Looking south: screen-right is west; screen-down on the floor is north.
  // Window is 141..356 horizontally and 88..287 high; floor meets wall at 365.
  const project = (x, y) => [x + (365 - y) * sun.east / sun.up,
    365 - (365 - y) * sun.north / sun.up];
  return [project(141,287),project(356,287),project(356,88),project(141,88)];
}
export function mixColor(night, day, amount) {
  const read = color => [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16));
  const a = read(night), b = read(day);
  return '#' + a.map((value, i) => Math.round(value + (b[i] - value) * amount).toString(16).padStart(2, '0')).join('');
}
export function shadeAt(daylight, level) {
  return (1 - daylight) * (.16 + .34 * (1 - level)) + daylight * .12 * (1 - level);
}
export function setupLight({ button, initial = true, onChange, now = () => performance.now(), schedule = setTimeout }) {
  let target = initial ? 1 : 0, from = target, started = now(), locked = false;
  function level(time = now(), reduced = false) {
    if (reduced) return target;
    const progress = Math.max(0, Math.min(1, (time - started) / 700));
    return from + (target - from) * (progress * progress * (3 - 2 * progress));
  }
  function update() {
    button.setAttribute('aria-pressed', String(target === 1));
    button.setAttribute('aria-label', target ? 'でんき、ついている' : 'でんき、きえている');
  }
  update();
  button.onclick = () => {
    if (locked) return;
    locked = true; button.disabled = true;
    const time = now(); from = level(time); target = target ? 0 : 1; started = time;
    update(); onChange(target === 1);
    schedule(() => { locked = false; button.disabled = false; }, 750);
  };
  return { level };
}
