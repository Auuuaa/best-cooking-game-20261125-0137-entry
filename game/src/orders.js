// Sizzle Station — the order board: spawning, patience and serving.
// One job: decide which tickets appear, count their patience down, and judge
// a served plate against the tickets waiting on the board.

import { RECIPES, spawnInterval, orderPatience } from './config.js';
import { pickFrom } from './random.js';

let nextOrderId = 1;

export function createOrders() {
  return { list: [], spawnIn: 6 };
}

export function spawnOrder(state, rng) {
  const elapsed = state.elapsed;
  const recipe = pickFrom(rng, RECIPES);
  const patience = orderPatience(elapsed);
  const order = {
    id: nextOrderId++,
    recipe,
    patience,
    maxPatience: patience,
    wobble: rng() * Math.PI * 2,
  };
  state.orders.list.push(order);
  return order;
}

// Tick spawn timing and every ticket's patience. Returns expired orders.
export function tickOrders(state, dt, rng) {
  const board = state.orders;
  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.list.length < 5) {
    spawnOrder(state, rng);
    board.spawnIn = spawnInterval(state.elapsed);
  }
  const expired = [];
  for (const order of board.list) {
    order.patience -= dt;
    if (order.patience <= 0) expired.push(order);
  }
  if (expired.length) {
    board.list = board.list.filter((o) => o.patience > 0);
  }
  return expired;
}

function sameContents(plate, recipe) {
  const have = plate.contents.map((it) => it.item + ':' + it.state).sort();
  const want = recipe.needs.map((n) => n.item + ':' + n.state).sort();
  if (have.length !== want.length) return false;
  return have.every((v, i) => v === want[i]);
}

// Find the first ticket this plate completes, or null when it matches none.
export function matchOrder(board, plate) {
  return board.list.find((order) => sameContents(plate, order.recipe)) || null;
}

// Price a served dish: the recipe price plus a tip for speed, times combo.
export function priceServe(order, combo) {
  const speedBonus = Math.round((order.patience / order.maxPatience) * 8);
  const mult = 1 + Math.min(2, combo) * 0.25;
  return Math.round((order.recipe.price + speedBonus) * mult);
}
