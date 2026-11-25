// Sizzle Station — shared constants, recipes, kitchen layout and palette.
// One job: every tunable number and every station rectangle lives here so the
// rest of the game never hard-codes a position, a price or a cook time.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const COMBO_WINDOW = 20;

export const CHEF_SPEED = 265;
export const CHEF_RADIUS = 22;
export const INTERACT_RANGE = 78;

// Every ingredient the kitchen stocks. `prep` names the station that turns the
// raw form into the served form; null means it is served as picked up.
export const ITEMS = {
  bun:     { name: 'Bun',     color: '#e9b169', prep: null,    label: 'BUN' },
  patty:   { name: 'Patty',   color: '#8a5132', prep: 'grill', cookTime: 4.0, burnTime: 9.0, label: 'PATTY' },
  lettuce: { name: 'Lettuce', color: '#63a94e', prep: 'chop',  chopTime: 1.6, label: 'LETTUCE' },
  tomato:  { name: 'Tomato',  color: '#d84a41', prep: 'chop',  chopTime: 1.6, label: 'TOMATO' },
  cheese:  { name: 'Cheese',  color: '#f2c230', prep: null,    label: 'CHEESE' },
  fries:   { name: 'Fries',   color: '#f5d76e', prep: 'fry',   cookTime: 5.0, burnTime: 10.0, label: 'FRIES' },
};

// A recipe's `needs` list item ids together with the state they must be in
// when the plate reaches the serving window.
export const RECIPES = [
  { id: 'burger', name: 'Classic Burger', price: 14,
    needs: [ { item: 'bun', state: 'ready' }, { item: 'patty', state: 'cooked' }, { item: 'lettuce', state: 'chopped' } ] },
  { id: 'cheese', name: 'Cheese Melt', price: 18,
    needs: [ { item: 'bun', state: 'ready' }, { item: 'patty', state: 'cooked' }, { item: 'cheese', state: 'ready' }, { item: 'tomato', state: 'chopped' } ] },
  { id: 'salad', name: 'Garden Salad', price: 10,
    needs: [ { item: 'lettuce', state: 'chopped' }, { item: 'tomato', state: 'chopped' } ] },
  { id: 'frybox', name: 'Cheese Fries', price: 12,
    needs: [ { item: 'fries', state: 'cooked' }, { item: 'cheese', state: 'ready' } ] },
];

// Station rectangles. Crates sit along the left wall, the hot line runs across
// the middle, and the pass (assembly + serving window) sits on the right.
export const STATIONS = [
  { id: 'crate-bun',     kind: 'crate', item: 'bun',     x: 16,  y: 118, w: 104, h: 62 },
  { id: 'crate-patty',   kind: 'crate', item: 'patty',   x: 16,  y: 196, w: 104, h: 62 },
  { id: 'crate-lettuce', kind: 'crate', item: 'lettuce', x: 16,  y: 274, w: 104, h: 62 },
  { id: 'crate-tomato',  kind: 'crate', item: 'tomato',  x: 16,  y: 352, w: 104, h: 62 },
  { id: 'crate-cheese',  kind: 'crate', item: 'cheese',  x: 16,  y: 430, w: 104, h: 62 },
  { id: 'crate-fries',   kind: 'crate', item: 'fries',   x: 16,  y: 508, w: 104, h: 62 },
  { id: 'chop',    kind: 'chop',    x: 300, y: 150, w: 170, h: 78 },
  { id: 'grill',   kind: 'grill',   x: 560, y: 150, w: 210, h: 78 },
  { id: 'fry',     kind: 'fry',     x: 860, y: 150, w: 170, h: 78 },
  { id: 'plates',  kind: 'plates',  x: 300, y: 470, w: 92,  h: 78 },
  { id: 'assembly',kind: 'assembly',x: 460, y: 470, w: 420, h: 78 },
  { id: 'serve',   kind: 'serve',   x: 1080, y: 118, w: 184, h: 110 },
  { id: 'trash',   kind: 'trash',   x: 1080, y: 470, w: 96,  h: 78 },
];

export const ORDER_BOARD = { x: 0, y: 0, w: CANVAS_W, h: 92 };
export const HUD = { x: 0, y: 652, w: CANVAS_W, h: 68 };
export const FLOOR = { x: 0, y: 92, w: CANVAS_W, h: 560 };

// Order pacing: the kitchen gets busier as the shift goes on.
export function spawnInterval(elapsed) {
  return Math.max(8, 14 - elapsed * 0.02);
}
export function orderPatience(elapsed) {
  return Math.max(38, 55 - elapsed * 0.03);
}

export const PALETTE = {
  floorA: '#c98f5f',
  floorB: '#bd8252',
  wall: '#8a5a34',
  counter: '#a06a3c',
  counterTop: '#c98d54',
  board: '#2e2a26',
  ticket: '#fff7e8',
  ink: '#2e2a26',
  cream: '#fff3d6',
  red: '#d84a41',
  green: '#63a94e',
  gold: '#f2c230',
  blue: '#4a90d9',
};

export function freshItem(itemId) {
  const def = ITEMS[itemId];
  const state = def.prep === null ? 'ready' : 'raw';
  return { item: itemId, state };
}

export function itemLabel(it) {
  const def = ITEMS[it.item];
  if (it.state === 'burnt') return 'Burnt ' + def.name;
  if (it.state === 'chopped') return 'Chopped ' + def.name;
  if (it.state === 'cooked') return 'Cooked ' + def.name;
  return def.name;
}

// The state an item reaches when its prep station finishes with it.
export function finishedState(itemId) {
  const def = ITEMS[itemId];
  if (def.prep === 'chop') return 'chopped';
  if (def.prep === 'grill' || def.prep === 'fry') return 'cooked';
  return 'ready';
}
