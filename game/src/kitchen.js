// Sizzle Station — the kitchen itself: stations, walls and prep work.
// One job: know where every station is, keep the chef out of the counters,
// and tick the chopping board, grill and fryer forward in time.

import { STATIONS, ITEMS, finishedState } from './config.js';

export function createKitchen() {
  return {
    chop: { item: null, progress: 0, done: false },
    grill: [ { item: null, progress: 0, done: false }, { item: null, progress: 0, done: false } ],
    fry: { item: null, progress: 0, done: false },
    // Two plate bays on the assembly counter; a bay holds a plate or null.
    assembly: [null, null],
  };
}

export function stationById(id) {
  return STATIONS.find((s) => s.id === id) || null;
}

export function stationAt(x, y) {
  return STATIONS.find((s) => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h) || null;
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// The chef walks the floor strip between the order board and the HUD; every
// station rectangle and the outer walls block movement.
export function collides(x, y, r) {
  if (x - r < 8 || x + r > 1272 || y - r < 100 || y + r > 644) return true;
  return STATIONS.some((s) => circleHitsRect(x, y, r, s));
}

// The nearest station whose edge the chef can reach, or null.
export function nearestStation(x, y) {
  let best = null;
  let bestD = Infinity;
  for (const s of STATIONS) {
    const d = distToStation(x, y, s);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return bestD <= 78 ? best : null;
}

// Distance from a point to a station's edge (0 when inside it).
export function distToStation(x, y, s) {
  const cx = Math.max(s.x, Math.min(x, s.x + s.w));
  const cy = Math.max(s.y, Math.min(y, s.y + s.h));
  return Math.hypot(x - cx, y - cy);
}

// Advance every prep timer. Returns a list of events the game should react to:
// {type:'burnt', where:'grill'} when a cooked item is left too long.
export function tickKitchen(kitchen, dt) {
  const events = [];
  const chop = kitchen.chop;
  if (chop.item && !chop.done) {
    chop.progress += dt;
    if (chop.progress >= ITEMS[chop.item.item].chopTime) {
      chop.done = true;
      chop.item.state = finishedState(chop.item.item);
    }
  }
  for (let i = 0; i < kitchen.grill.length; i++) {
    const slot = kitchen.grill[i];
    if (!slot.item) continue;
    const def = ITEMS[slot.item.item];
    slot.progress += dt;
    if (!slot.done && slot.progress >= def.cookTime) {
      slot.done = true;
      slot.item.state = 'cooked';
    } else if (slot.done && slot.progress >= def.burnTime && slot.item.state !== 'burnt') {
      slot.item.state = 'burnt';
      events.push({ type: 'burnt', where: 'grill' });
    }
  }
  const fry = kitchen.fry;
  if (fry.item && !fry.done) {
    fry.progress += dt;
    if (fry.progress >= ITEMS[fry.item.item].cookTime) {
      fry.done = true;
      fry.item.state = finishedState(fry.item.item);
    }
  } else if (fry.item && fry.done && fry.progress >= ITEMS[fry.item.item].burnTime && fry.item.state !== 'burnt') {
    fry.item.state = 'burnt';
    events.push({ type: 'burnt', where: 'fryer' });
  }
  return events;
}

export function slotProgress(slot, def) {
  if (!slot.item) return 0;
  const total = def.prep === 'chop' ? def.chopTime : def.cookTime;
  return Math.min(1, slot.progress / total);
}
