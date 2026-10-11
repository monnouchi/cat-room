export const KEY = 'demo11-cat-v1';

export function restore(raw, now) {
  let state;
  try { state = JSON.parse(raw); } catch {}
  if (!state || state.version !== 1 || !Number.isFinite(state.time)
      || !Number.isFinite(state.phase) || state.phase < 0 || state.phase >= 120) {
    return { version: 1, time: now, phase: 0, away: 0 };
  }
  const away = Math.min(7 * 86400000, Math.max(0, now - state.time));
  return {
    version: 1, time: now, phase: (state.phase + away / 1000) % 120, away,
    muted: state.muted === true,
    lightsOn: state.lightsOn !== false,
    showText: state.showText !== false,
    foodVisible: state.foodVisible === true,
    mealConsumed: away / 1000 + state.phase < 120 && state.mealConsumed === true,
    foodRoute: away / 1000 + state.phase < 120 && state.foodRoute === true,
    waterRoute: away / 1000 + state.phase < 120 && state.waterRoute === true && state.foodRoute !== true,
    routeChosen: away / 1000 + state.phase < 120 && state.routeChosen === true,

  };
}

export function snapshot(phase, now, preferences = {}) {
  return { version: 1, time: now, phase: ((phase % 120) + 120) % 120,
    muted: preferences.muted, lightsOn: preferences.lightsOn, showText: preferences.showText, foodVisible: preferences.foodVisible,
    foodRoute: preferences.foodRoute, waterRoute: preferences.waterRoute, routeChosen: preferences.routeChosen, mealConsumed: preferences.mealConsumed };
}

export function weatherAt(now) {
  const block = ((Math.floor(now / 2700000) % 6) + 6) % 6;
  return block >= 4 ? 'rain' : 'clear';
}
