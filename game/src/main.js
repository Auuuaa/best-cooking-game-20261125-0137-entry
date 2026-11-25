// Sizzle Station — the game loop and the state machine.
// One job: own the top-level state (title / play / pause / end), step the
// kitchen forward every frame, and translate input into actions. It also
// builds the fixed demo states the screenshots are taken from (?shot=...).

import { CANVAS_W, CANVAS_H, SHIFT_SECONDS, MAX_HEARTS, RECIPES, freshItem } from './config.js';
import { makeRng } from './random.js';
import { createInput } from './input.js';
import { createKitchen, tickKitchen, nearestStation, stationById } from './kitchen.js';
import { createOrders, tickOrders, spawnOrder } from './orders.js';
import { createChef, updateChef, interact, emptyPlate } from './chef.js';
import { drawGame } from './draw.js';
import { sfx, unlockAudio, toggleMute } from './audio.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7);

function freshState() {
  return {
    screen: 'title',
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    served: 0,
    wrong: 0,
    combo: 0,
    bestCombo: 0,
    comboTimer: 0,
    hearts: MAX_HEARTS,
    orders: createOrders(),
    kitchen: createKitchen(),
    chef: createChef(),
    rng: makeRng(seed),
    message: null,
    nearStation: null,
    frozen: false,
    seed,
  };
}

function showMessage(state, text, good, seconds = 2.2) {
  state.message = { text, good: !!good, until: state.elapsed + seconds };
}

function handleEvent(state, event) {
  if (!event) return;
  if (event.type === 'served') showMessage(state, event.text + '  ·  combo x' + state.combo, true);
  if (event.type === 'wrong') {
    state.wrong += 1;
    showMessage(state, event.text, false);
  }
  if (event.type === 'hint') showMessage(state, event.text, false, 1.6);
}

function endShift(state) {
  state.screen = 'end';
  sfx.end();
}

function startShift(state) {
  const next = freshState();
  next.screen = 'play';
  Object.assign(state, next);
  unlockAudio();
  sfx.start();
}

// --- Screenshot demo states -------------------------------------------------

function demoOrder(state, recipeId, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const order = {
    id: 100 + state.orders.list.length,
    recipe,
    patience,
    maxPatience: patience,
    wobble: 0,
  };
  state.orders.list.push(order);
}

function buildShot(state, kind) {
  state.frozen = true;
  if (kind === 'start') {
    state.screen = 'title';
    return;
  }
  if (kind === 'end') {
    state.screen = 'end';
    state.score = 214;
    state.coins = 214;
    state.served = 17;
    state.bestCombo = 4;
    state.hearts = 2;
    state.shiftLeft = 0;
    return;
  }
  state.screen = 'play';
  if (kind === 'rush') {
    state.elapsed = 126;
    state.shiftLeft = 24;
    state.score = 168;
    state.coins = 168;
    state.served = 13;
    state.combo = 3;
    state.bestCombo = 3;
    state.hearts = 1;
    demoOrder(state, 'burger', 9);
    demoOrder(state, 'cheese', 16);
    demoOrder(state, 'salad', 7);
    demoOrder(state, 'frybox', 22);
    demoOrder(state, 'burger', 31);
    state.kitchen.grill[0].item = { item: 'patty', state: 'raw' };
    state.kitchen.grill[0].progress = 2.4;
    state.kitchen.grill[1].item = { item: 'patty', state: 'cooked' };
    state.kitchen.grill[1].progress = 4.2;
    state.kitchen.grill[1].done = true;
    state.kitchen.fry.item = { item: 'fries', state: 'raw' };
    state.kitchen.fry.progress = 3.1;
    state.kitchen.chop.item = { item: 'tomato', state: 'raw' };
    state.kitchen.chop.progress = 0.8;
    state.chef.x = 640;
    state.chef.y = 400;
    state.chef.carry = { item: 'lettuce', state: 'chopped' };
    return;
  }
  // 'play': one dish mid-assembly, one plate ready to serve, timer running.
  state.elapsed = 38;
  state.shiftLeft = 112;
  state.score = 86;
  state.coins = 86;
  state.served = 6;
  state.combo = 2;
  state.bestCombo = 2;
  state.hearts = 3;
  demoOrder(state, 'burger', 32);
  demoOrder(state, 'salad', 18);
  demoOrder(state, 'cheese', 44);
  const midPlate = emptyPlate();
  midPlate.contents.push(freshItem('bun'));
  midPlate.contents.push({ item: 'patty', state: 'cooked' });
  state.kitchen.assembly[0] = midPlate;
  const readyPlate = emptyPlate();
  readyPlate.contents.push({ item: 'lettuce', state: 'chopped' });
  readyPlate.contents.push({ item: 'tomato', state: 'chopped' });
  state.kitchen.assembly[1] = readyPlate;
  state.kitchen.grill[0].item = { item: 'patty', state: 'raw' };
  state.kitchen.grill[0].progress = 2.4;
  state.kitchen.fry.item = { item: 'fries', state: 'raw' };
  state.kitchen.fry.progress = 4.0;
  state.kitchen.chop.item = { item: 'tomato', state: 'raw' };
  state.kitchen.chop.progress = 0.8;
  state.chef.x = 560;
  state.chef.y = 420;
  state.chef.carry = { item: 'lettuce', state: 'chopped' };
  state.nearStation = 'assembly';
  showMessage(state, 'Salad ready — serve it at the window!', true, 999);
}

// --- Boot -------------------------------------------------------------------

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const state = freshState();
// Debug handle for play-testing: the loop and the smoke test read the state.
window.__sizzleState = state;

if (shot) buildShot(state, shot);

let last = performance.now();
let firstFrame = true;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.screen === 'title') {
    if (input.wasPressed('enter') || input.consumeClick()) startShift(state);
  } else if (state.screen === 'end') {
    if (input.wasPressed('r') || input.consumeClick()) startShift(state);
  } else if (state.screen === 'play' && !state.frozen) {
    state.elapsed += dt;
    state.shiftLeft -= dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    const burnt = tickKitchen(state.kitchen, dt);
    for (const event of burnt) showMessage(state, 'Something burnt on the ' + event.where + '!', false);
    const expired = tickOrders(state, dt, state.rng);
    for (const order of expired) {
      state.hearts -= 1;
      state.combo = 0;
      sfx.error();
      showMessage(state, 'Ticket expired: ' + order.recipe.name, false);
    }
    const clickEvent = updateChef(state.chef, input, dt, state);
    handleEvent(state, clickEvent);
    state.nearStation = nearestStation(state.chef.x, state.chef.y)?.id ?? null;
    if (input.interactPressed() && state.nearStation) {
      handleEvent(state, interact(state, stationById(state.nearStation)));
    }
    if (input.wasPressed('p')) state.screen = 'pause';
    if (state.shiftLeft <= 0 || state.hearts <= 0) endShift(state);
  } else if (state.screen === 'pause') {
    if (input.wasPressed('p')) state.screen = 'play';
  }
  if (input.wasPressed('m')) toggleMute();

  drawGame(ctx, state);
  if (firstFrame) {
    firstFrame = false;
    window.__sizzleReady = true;
  }
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
