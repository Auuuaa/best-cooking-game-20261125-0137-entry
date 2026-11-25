// Sizzle Station — the chef: walking, carrying and using the stations.
// One job: move the chef around the kitchen and resolve one interaction at a
// time. The chef carries one thing: a single ingredient or one plate.

import { CHEF_SPEED, CHEF_RADIUS, ITEMS, freshItem } from './config.js';
import { collides, nearestStation, stationAt, stationById, distToStation } from './kitchen.js';
import { matchOrder, priceServe } from './orders.js';
import { sfx } from './audio.js';

export function createChef() {
  return {
    x: 640, y: 420, dir: 'down',
    carry: null,           // null | {item, state} | {kind:'plate', contents:[]}
    moveTarget: null,      // {x, y, stationId} from a mouse click
    idleTime: 0,           // seconds spent wedged while walking to a click
    bob: 0,
  };
}

export function emptyPlate() {
  return { kind: 'plate', contents: [] };
}

function isPlate(thing) {
  return thing && thing.kind === 'plate';
}

// Move with axis-separated collision so the chef slides along counters.
function tryMove(chef, dx, dy) {
  const nx = chef.x + dx;
  if (!collides(nx, chef.y, CHEF_RADIUS)) chef.x = nx;
  const ny = chef.y + dy;
  if (!collides(chef.x, ny, CHEF_RADIUS)) chef.y = ny;
}

export function updateChef(chef, input, dt, state) {
  let mx = input.moveX();
  let my = input.moveY();

  // A mouse click sets a destination; walking there clears on arrival.
  const click = input.consumeClick();
  if (click) {
    chef.moveTarget = { x: click.x, y: click.y, stationId: null };
    const hit = stationAt(click.x, click.y);
    if (hit) chef.moveTarget.stationId = hit.id;
  }
  if (chef.moveTarget) {
    const t = chef.moveTarget;
    // Arrived when the chef can reach the target station, or when the
    // clicked floor point is underfoot. The click point itself often sits
    // inside a station rectangle the chef can never stand on, so distance to
    // the point alone would wedge the chef against the counter forever.
    let arrived = false;
    if (t.stationId) {
      const st = stationById(t.stationId);
      if (st && distToStation(chef.x, chef.y, st) <= 78) arrived = true;
    }
    const dx = t.x - chef.x;
    const dy = t.y - chef.y;
    if (Math.hypot(dx, dy) < 12) arrived = true;
    if (arrived) {
      const sid = chef.moveTarget.stationId;
      chef.moveTarget = null;
      chef.idleTime = 0;
      if (sid) {
        const st = stationById(sid);
        if (st) return interact(state, st);
      }
      return null;
    }
    mx = dx / Math.hypot(dx, dy);
    my = dy / Math.hypot(dx, dy);
    if (Math.abs(dx) < 6) mx = 0;
    if (Math.abs(dy) < 6) my = 0;
  }
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my) || 1;
    const ox = chef.x;
    const oy = chef.y;
    tryMove(chef, (mx / len) * CHEF_SPEED * dt, (my / len) * CHEF_SPEED * dt);
    chef.dir = Math.abs(mx) > Math.abs(my) ? (mx > 0 ? 'right' : 'left') : (my > 0 ? 'down' : 'up');
    chef.bob += dt * 11;
    // A straight-line walk can wedge the chef in a corner between counters.
    // If a click target makes no progress for a while, give up on it.
    if (chef.moveTarget) {
      if (Math.hypot(chef.x - ox, chef.y - oy) < 1) chef.idleTime += dt;
      else chef.idleTime = 0;
      if (chef.idleTime > 1.2) {
        chef.moveTarget = null;
        chef.idleTime = 0;
      }
    }
  }
  return null;
}

// Resolve one interaction with the given station. Returns a game event the
// main loop turns into points, hearts or a message, or null.
export function interact(state, station) {
  const chef = state.chef;
  const kitchen = state.kitchen;
  const carry = chef.carry;

  if (!carry) {
    if (station.kind === 'crate') {
      chef.carry = freshItem(station.item);
      sfx.pickup();
      return null;
    }
    if (station.kind === 'plates') {
      chef.carry = emptyPlate();
      sfx.pickup();
      return null;
    }
    if (station.kind === 'chop' && kitchen.chop.item && kitchen.chop.done) {
      chef.carry = kitchen.chop.item;
      kitchen.chop.item = null;
      kitchen.chop.progress = 0;
      kitchen.chop.done = false;
      sfx.pickup();
      return null;
    }
    if (station.kind === 'grill') {
      const slot = kitchen.grill.find((s) => s.item && s.done);
      if (slot) {
        chef.carry = slot.item;
        slot.item = null;
        slot.progress = 0;
        slot.done = false;
        sfx.pickup();
        return null;
      }
      return { type: 'hint', text: 'Patty still on the grill!' };
    }
    if (station.kind === 'fry' && kitchen.fry.item && kitchen.fry.done) {
      chef.carry = kitchen.fry.item;
      kitchen.fry.item = null;
      kitchen.fry.progress = 0;
      kitchen.fry.done = false;
      sfx.pickup();
      return null;
    }
    if (station.kind === 'assembly') {
      const bay = kitchen.assembly.find((p) => p !== null);
      if (bay) {
        kitchen.assembly[kitchen.assembly.indexOf(bay)] = null;
        chef.carry = bay;
        sfx.pickup();
        return null;
      }
      return { type: 'hint', text: 'Grab a plate first!' };
    }
    return null;
  }

  // Carrying an ingredient.
  if (!isPlate(carry)) {
    const def = ITEMS[carry.item];
    if (station.kind === 'chop' && def.prep === 'chop' && !kitchen.chop.item && carry.state === 'raw') {
      kitchen.chop.item = carry;
      kitchen.chop.progress = 0;
      kitchen.chop.done = false;
      chef.carry = null;
      sfx.chop();
      return null;
    }
    if (station.kind === 'grill' && def.prep === 'grill' && carry.state === 'raw') {
      const slot = kitchen.grill.find((s) => !s.item);
      if (slot) {
        slot.item = carry;
        slot.progress = 0;
        slot.done = false;
        chef.carry = null;
        sfx.sizzle();
        return null;
      }
      return { type: 'hint', text: 'Grill is full!' };
    }
    if (station.kind === 'fry' && def.prep === 'fry' && !kitchen.fry.item && carry.state === 'raw') {
      kitchen.fry.item = carry;
      kitchen.fry.progress = 0;
      kitchen.fry.done = false;
      chef.carry = null;
      sfx.sizzle();
      return null;
    }
    if (station.kind === 'assembly') {
      const bay = kitchen.assembly.find((p) => p !== null);
      if (bay && bay.contents.length < 4) {
        bay.contents.push(carry);
        chef.carry = null;
        sfx.place();
        return null;
      }
      return { type: 'hint', text: 'No plate on the counter!' };
    }
    if (station.kind === 'trash') {
      chef.carry = null;
      sfx.place();
      return null;
    }
    return { type: 'hint', text: 'That needs a prep station!' };
  }

  // Carrying a plate.
  if (station.kind === 'assembly') {
    const bayIndex = kitchen.assembly.findIndex((p) => p === null);
    if (bayIndex !== -1) {
      kitchen.assembly[bayIndex] = carry;
      chef.carry = null;
      sfx.place();
      return null;
    }
    return { type: 'hint', text: 'Counter is full!' };
  }
  if (station.kind === 'serve') {
    if (carry.contents.length === 0) return { type: 'hint', text: 'Empty plate!' };
    const order = matchOrder(state.orders, carry);
    chef.carry = null;
    if (!order) {
      sfx.error();
      state.combo = 0;
      return { type: 'wrong', text: 'No ticket wants that dish!' };
    }
    state.orders.list = state.orders.list.filter((o) => o.id !== order.id);
    const coins = priceServe(order, state.combo);
    state.score += coins;
    state.coins += coins;
    state.served += 1;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.comboTimer = 20;
    sfx.coin();
    return { type: 'served', text: '+' + coins + '  ' + order.recipe.name, coins };
  }
  if (station.kind === 'trash') {
    chef.carry = null;
    sfx.place();
    return null;
  }
  return { type: 'hint', text: 'Serve it at the window!' };
}
