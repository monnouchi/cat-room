const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => .5 - .5 * Math.cos(Math.PI * clamp(value));

export function pawStep(distance, leg, strength = 1) {
  if (strength <= 0) return { x: 0, lift: 0 };
  // Four distinct contacts; each foot stays down for most of its cycle.
  const offsets = [.25, .5, .75, 0]; // Far fore, far hind, near fore, near hind.
  const cycle = ((distance / 36 + offsets[leg]) % 1 + 1) % 1;
  if (cycle < .65) return { x: (-7 + cycle / .65 * 14) * strength, lift: 0 };
  const swing = (cycle - .65) / .35;
  return { x: (7 - swing * 14) * strength, lift: Math.sin(swing * Math.PI) * 8 * strength };
}

function idle(mode, x, y, facing, extra = {}) {
  return { mode, x, y, facing, distance: 0, strength: 0, ...extra };
}
function turn(t, duration, x, y, from, to, mode = 'sit', occlude = false) {
  const progress = clamp(t / duration);
  return idle(mode, x, y, progress < .5 ? from : to, { turnProgress: progress, occlude, boxBlend: mode === 'box' ? 1 : 0 });
}
function walk(t, duration, from, to, occlude = false) {
  const u = clamp(t / duration), ease = smooth(u);
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const speed = length * Math.PI / (2 * duration) * Math.sin(Math.PI * u);
  return { mode: 'walk', x: from[0] + (to[0] - from[0]) * ease,
    y: from[1] + (to[1] - from[1]) * ease,
    facing: to[0] >= from[0] ? 1 : -1, distance: length * ease,
    strength: Math.min(1, speed / 12), occlude,
    boxBlend: occlude ? (to[1] < from[1] ? ease : 1 - ease) : 0 };
}

export function catPose(phase, foodRoute = false, waterRoute = false) {
  const p = ((phase % 120) + 120) % 120;
  const rug = [390, 462], bowl = waterRoute && !foodRoute ? [264, 507] : [184, 470], rim = [746, 477], box = [773, 421];
  if (p < 40) return idle('sleep', ...rug, -1);
  if (p < 48) return idle('roll', ...rug, -1);
  if (p < 50) return idle('wake', ...rug, -1, { rise: (p - 48) / 2 });
  if (p < 56) return idle('stretch', ...rug, -1, { stretchAmount: Math.sin((p - 50) / 6 * Math.PI) });
  if (foodRoute || waterRoute) {
    if (p < 59) return idle('sit', ...rug, -1);
    if (p < 68) return walk(p - 59, 9, rug, bowl);
    if (p < 72) return idle(waterRoute && !foodRoute ? 'drink' : 'eat', ...bowl, -1, { eatProgress: p - 68 });
    if (p < 74) return turn(p - 72, 2, ...bowl, -1, 1);
    if (p < 76) return idle('sit', ...bowl, 1);
    if (p < 84) return walk(p - 76, 8, bowl, rug);
    if (p < 86) return idle('sit', ...rug, 1);
    if (p < 96) return walk(p - 86, 10, rug, rim);
    if (p < 98) return idle('inspect', ...rim, 1, { inspect: (p - 96) / 2 });
    if (p < 101) return walk(p - 98, 3, rim, box, true);
    if (p < 102) return turn(p - 101, 1, ...box, 1, -1, 'box', true);
    if (p < 106) return idle('box', ...box, -1, { occlude: true, boxBlend: 1 });
    if (p < 109) return walk(p - 106, 3, box, rim, true);
    if (p < 111) return idle('sit', ...rim, -1);
    if (p < 118) return walk(p - 111, 7, rim, rug);
    return idle('settle', ...rug, -1, { settle: (p - 118) / 2 });
  }
  if (p < 58) return turn(p - 56, 2, ...rug, -1, 1);
  if (p < 61) return idle('sit', ...rug, 1);
  if (p < 74) return walk(p - 61, 13, rug, rim);
  if (p < 76) return idle('inspect', ...rim, 1, { inspect: (p - 74) / 2 });
  if (p < 79) return walk(p - 76, 3, rim, box, true);
  if (p < 80) return turn(p - 79, 1, ...box, 1, -1, 'box', true);
  if (p < 98) return idle('box', ...box, -1, { occlude: true, boxBlend: 1 });
  if (p < 101) return walk(p - 98, 3, box, rim, true);
  if (p < 104) return idle('sit', ...rim, -1);
  if (p < 114) return walk(p - 104, 10, rim, rug);
  if (p < 116) return idle('sit', ...rug, -1);
  if (p < 118) return idle('settle', ...rug, -1, { settle: (p - 116) / 2 });
  return idle('sleep', ...rug, -1);
}
