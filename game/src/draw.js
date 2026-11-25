// Sizzle Station — every pixel the player sees.
// One job: draw the kitchen, the chef, the food, the order board, the HUD and
// the title / pause / end screens on one canvas. No images are loaded; all
// art is drawn from shapes, so the game ships zero asset files.

import { CANVAS_W, CANVAS_H, STATIONS, ITEMS, PALETTE } from './config.js';
import { slotProgress } from './kitchen.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, color, bg = '#3a2c20') {
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  if (frac > 0) {
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// --- Food icons -----------------------------------------------------------

export function drawItemIcon(ctx, it, x, y, s) {
  const def = ITEMS[it.item];
  ctx.save();
  ctx.translate(x, y);
  if (it.state === 'burnt') {
    ctx.fillStyle = '#241a12';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a4632';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.25, -s * 0.2);
    ctx.lineTo(s * 0.25, s * 0.2);
    ctx.moveTo(s * 0.25, -s * 0.2);
    ctx.lineTo(-s * 0.25, s * 0.2);
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (it.item === 'bun') {
    ctx.fillStyle = '#d99a4e';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.08, s * 0.52, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0c078';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.1, s * 0.52, s * 0.34, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const [dx, dy] of [[-0.22, -0.22], [0.05, -0.3], [0.26, -0.18]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.045, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (it.item === 'patty') {
    ctx.fillStyle = '#6e3f24';
    rr(ctx, -s * 0.52, -s * 0.26, s * 1.04, s * 0.52, s * 0.2);
    ctx.fill();
    ctx.fillStyle = '#8a5132';
    rr(ctx, -s * 0.46, -s * 0.32, s * 0.92, s * 0.3, s * 0.14);
    ctx.fill();
    ctx.fillStyle = '#5a3018';
    for (const [dx, dy] of [[-0.25, 0.05], [0.1, -0.05], [0.3, 0.08]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (it.item === 'lettuce') {
    ctx.fillStyle = it.state === 'chopped' ? '#7cc46a' : '#4e8f3e';
    for (const [dx, dy, r] of [[-0.22, 0.08, 0.3], [0.2, 0.1, 0.3], [0, -0.2, 0.32]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, r * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#2f6b26';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, 0);
    ctx.quadraticCurveTo(0, -s * 0.18, s * 0.3, 0);
    ctx.stroke();
  } else if (it.item === 'tomato') {
    ctx.fillStyle = '#d84a41';
    ctx.beginPath();
    ctx.arc(0, s * 0.05, s * 0.44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8705f';
    ctx.beginPath();
    ctx.arc(-s * 0.14, -s * 0.1, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3f7d33';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.32);
    ctx.lineTo(s * 0.2, -s * 0.5);
    ctx.lineTo(0, -s * 0.42);
    ctx.lineTo(-s * 0.2, -s * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (it.item === 'cheese') {
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.32);
    ctx.lineTo(s * 0.5, s * 0.32);
    ctx.lineTo(s * 0.5, -s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d9a41f';
    for (const [dx, dy] of [[0.2, 0.1], [-0.15, 0.18], [0.32, -0.08]]) {
      ctx.beginPath();
      ctx.arc(dx * s, dy * s, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (it.item === 'fries') {
    ctx.fillStyle = '#c93a32';
    rr(ctx, -s * 0.42, -s * 0.05, s * 0.84, s * 0.5, s * 0.08);
    ctx.fill();
    ctx.fillStyle = '#f5d76e';
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect((i * 0.16 - 0.05) * s, -s * 0.52, s * 0.1, s * 0.55);
    }
    ctx.fillStyle = '#e8b93f';
    ctx.fillRect(-s * 0.42, -s * 0.05, s * 0.84, s * 0.1);
  }
  ctx.restore();
}

export function drawPlate(ctx, plate, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#d8d2c4';
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.62, s * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.04, s * 0.52, s * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  const items = plate.contents;
  items.forEach((it, i) => {
    // Earlier items sit lower on the plate; later items stack above them.
    const oy = -s * 0.02 - i * s * 0.09;
    drawItemIcon(ctx, it, 0, oy, s * 0.62);
  });
  ctx.restore();
}

// --- Kitchen ---------------------------------------------------------------

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 92, CANVAS_W, 560);
  ctx.fillStyle = PALETTE.floorB;
  const t = 64;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 20; col++) {
      if ((row + col) % 2 === 0) ctx.fillRect(col * t, 92 + row * t, t, t);
    }
  }
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 92, CANVAS_W, 10);
}

function stationLabel(ctx, s, highlight) {
  ctx.fillStyle = highlight ? '#ffe9a8' : '#fff3d6';
  ctx.font = 'bold 13px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(labelFor(s), s.x + s.w / 2, s.y + s.h - 6);
}

function labelFor(s) {
  if (s.kind === 'crate') return ITEMS[s.item].label;
  if (s.kind === 'chop') return 'CHOP';
  if (s.kind === 'grill') return 'GRILL';
  if (s.kind === 'fry') return 'FRYER';
  if (s.kind === 'plates') return 'PLATES';
  if (s.kind === 'assembly') return 'ASSEMBLY';
  if (s.kind === 'serve') return 'SERVE';
  if (s.kind === 'trash') return 'TRASH';
  return '';
}

function drawStation(ctx, s, state, highlight) {
  ctx.save();
  if (s.kind === 'serve') {
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fillStyle = '#3a2c20';
    ctx.fill();
    rr(ctx, s.x + 5, s.y + 5, s.w - 10, s.h - 10, 8);
    ctx.fillStyle = '#5a4632';
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 26px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SERVE', s.x + s.w / 2, s.y + 34);
    ctx.fillStyle = '#fff3d6';
    ctx.font = '13px "Trebuchet MS", Verdana, sans-serif';
    ctx.fillText('drop the finished plate here', s.x + s.w / 2, s.y + 66);
    ctx.fillText('to send it out', s.x + s.w / 2, s.y + 86);
  } else {
    rr(ctx, s.x, s.y, s.w, s.h, 8);
    ctx.fillStyle = highlight ? '#8a5a34' : PALETTE.counter;
    ctx.fill();
    rr(ctx, s.x + 4, s.y + 4, s.w - 8, 14, 5);
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fill();
  }
  if (s.kind === 'crate') {
    drawItemIcon(ctx, { item: s.item, state: 'raw' }, s.x + s.w / 2, s.y + s.h / 2 - 4, 44);
    stationLabel(ctx, s, highlight);
  }
  if (s.kind === 'chop') {
    ctx.fillStyle = '#e8d9b0';
    rr(ctx, s.x + 14, s.y + 12, s.w - 28, 34, 6);
    ctx.fill();
    const chop = state.kitchen.chop;
    if (chop.item) {
      drawItemIcon(ctx, chop.item, s.x + s.w / 2, s.y + 30, 34);
      if (!chop.done) bar(ctx, s.x + 20, s.y + 52, s.w - 40, 8, slotProgress(chop, ITEMS[chop.item.item]), '#f2c230');
      else text(ctx, 'READY', s.x + s.w / 2, s.y + 56, 11, '#7cc46a');
    } else {
      text(ctx, 'chop lettuce & tomato', s.x + s.w / 2, s.y + 30, 12, '#fff3d6');
    }
    stationLabel(ctx, s, highlight);
  }
  if (s.kind === 'grill') {
    ctx.fillStyle = '#2e2a26';
    rr(ctx, s.x + 12, s.y + 10, s.w - 24, 38, 6);
    ctx.fill();
    ctx.strokeStyle = '#5a4632';
    ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(s.x + 12 + (i * (s.w - 24)) / 6, s.y + 12);
      ctx.lineTo(s.x + 12 + (i * (s.w - 24)) / 6, s.y + 46);
      ctx.stroke();
    }
    state.kitchen.grill.forEach((slot, i) => {
      const cx = s.x + 52 + i * 106;
      if (slot.item) {
        drawItemIcon(ctx, slot.item, cx, s.y + 30, 36);
        if (slot.done && slot.item.state !== 'burnt') text(ctx, 'READY', cx, s.y + 60, 11, '#7cc46a');
        else if (slot.item.state === 'burnt') text(ctx, 'BURNT!', cx, s.y + 60, 11, '#ff7a6a');
        else bar(ctx, cx - 30, s.y + 56, 60, 8, slotProgress(slot, ITEMS[slot.item.item]), '#ff9a3d');
      }
    });
    stationLabel(ctx, s, highlight);
  }
  if (s.kind === 'fry') {
    ctx.fillStyle = '#3a3f4a';
    rr(ctx, s.x + 14, s.y + 10, s.w - 28, 36, 6);
    ctx.fill();
    ctx.fillStyle = '#c98d2e';
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + 28, (s.w - 36) / 2, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    const fry = state.kitchen.fry;
    if (fry.item) {
      drawItemIcon(ctx, fry.item, s.x + s.w / 2, s.y + 28, 34);
      if (fry.done && fry.item.state !== 'burnt') text(ctx, 'READY', s.x + s.w / 2, s.y + 60, 11, '#7cc46a');
      else if (fry.item.state === 'burnt') text(ctx, 'BURNT!', s.x + s.w / 2, s.y + 60, 11, '#ff7a6a');
      else bar(ctx, s.x + 24, s.y + 56, s.w - 48, 8, slotProgress(fry, ITEMS[fry.item.item]), '#ff9a3d');
    } else {
      text(ctx, 'fry the potatoes', s.x + s.w / 2, s.y + 28, 12, '#fff3d6');
    }
    stationLabel(ctx, s, highlight);
  }
  if (s.kind === 'plates') {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 0 ? '#ffffff' : '#d8d2c4';
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + 22 + i * 10, 30, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    stationLabel(ctx, s, highlight);
  }
  if (s.kind === 'assembly') {
    state.kitchen.assembly.forEach((plate, i) => {
      const cx = s.x + 70 + i * 210;
      ctx.strokeStyle = '#6e4a26';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, s.y + 34, 62, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (plate) drawPlate(ctx, plate, cx, s.y + 30, 58);
    });
    stationLabel(ctx, s, highlight);
  }
  if (s.kind === 'trash') {
    ctx.fillStyle = '#4a4a52';
    rr(ctx, s.x + 22, s.y + 12, s.w - 44, 40, 6);
    ctx.fill();
    ctx.fillStyle = '#6a6a74';
    ctx.fillRect(s.x + 18, s.y + 8, s.w - 36, 8);
    stationLabel(ctx, s, highlight);
  }
  ctx.restore();
}

// --- Chef -------------------------------------------------------------------

function drawChef(ctx, chef) {
  const bob = Math.abs(Math.sin(chef.bob)) * 2;
  ctx.save();
  ctx.translate(chef.x, chef.y - bob);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body (apron) and head.
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.arc(0, 6, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d84a41';
  ctx.fillRect(-20, 2, 40, 6);
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(0, -16, 13, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  rr(ctx, -11, -36, 22, 12, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-8, -34, 7, 0, Math.PI * 2);
  ctx.arc(0, -38, 8, 0, Math.PI * 2);
  ctx.arc(8, -34, 7, 0, Math.PI * 2);
  ctx.fill();
  // Eyes look where the chef walks.
  const ex = chef.dir === 'left' ? -3 : chef.dir === 'right' ? 3 : 0;
  const ey = chef.dir === 'up' ? -2 : chef.dir === 'down' ? 2 : 0;
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath();
  ctx.arc(-5 + ex, -16 + ey, 1.8, 0, Math.PI * 2);
  ctx.arc(5 + ex, -16 + ey, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Carried item floats above the hat.
  if (chef.carry) {
    if (chef.carry.kind === 'plate') drawPlate(ctx, chef.carry, 0, -52, 44);
    else drawItemIcon(ctx, chef.carry, 0, -50, 40);
  }
  ctx.restore();
}

// --- Orders and HUD ---------------------------------------------------------

function drawOrders(ctx, state) {
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 0, CANVAS_W, 92);
  text(ctx, 'ORDERS', 66, 46, 20, '#ffd76a', 'center');
  const tickets = state.orders.list;
  tickets.forEach((order, i) => {
    const x = 140 + i * 202;
    const y = 8;
    const w = 190;
    const h = 76;
    const urgent = order.patience < 12;
    const pulse = urgent ? 0.75 + 0.25 * Math.sin(state.elapsed * 8) : 1;
    ctx.save();
    ctx.globalAlpha = pulse;
    rr(ctx, x, y, w, h, 8);
    ctx.fillStyle = PALETTE.ticket;
    ctx.fill();
    rr(ctx, x, y, w, 22, 8);
    ctx.fillStyle = urgent ? '#d84a41' : '#4a90d9';
    ctx.fill();
    ctx.fillRect(x, y + 14, w, 8);
    text(ctx, order.recipe.name.toUpperCase(), x + w / 2, y + 12, 13, '#ffffff');
    order.recipe.needs.forEach((need, j) => {
      drawItemIcon(ctx, { item: need.item, state: need.state }, x + 24 + j * 36, y + 42, 30);
    });
    text(ctx, '$' + order.recipe.price, x + w - 26, y + 42, 15, '#2e7d32', 'center');
    const frac = Math.max(0, order.patience / order.maxPatience);
    const col = frac > 0.5 ? '#63a94e' : frac > 0.25 ? '#f2a230' : '#d84a41';
    bar(ctx, x + 10, y + 62, w - 20, 8, frac, col, '#e0d5bd');
    ctx.restore();
  });
  if (tickets.length === 0) {
    text(ctx, 'No tickets yet — orders will appear here', 560, 46, 16, '#cbb89a');
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.board;
  ctx.fillRect(0, 652, CANVAS_W, 68);
  const mm = Math.floor(Math.max(0, state.shiftLeft) / 60);
  const ss = Math.floor(Math.max(0, state.shiftLeft) % 60);
  const low = state.shiftLeft < 30;
  text(ctx, 'TIME', 60, 672, 12, '#cbb89a');
  text(ctx, `${mm}:${String(ss).padStart(2, '0')}`, 60, 696, 22, low ? '#ff7a6a' : '#ffffff');
  bar(ctx, 110, 682, 180, 10, Math.max(0, state.shiftLeft / 150), low ? '#d84a41' : '#63a94e', '#3a2c20');
  text(ctx, 'SCORE  ' + state.score, 380, 686, 20, '#ffffff');
  text(ctx, 'COINS  $' + state.coins, 560, 686, 20, '#ffd76a');
  for (let i = 0; i < 3; i++) {
    const x = 700 + i * 30;
    const y = 686;
    ctx.fillStyle = i < state.hearts ? '#d84a41' : '#5a4632';
    ctx.beginPath();
    ctx.moveTo(x, y + 7);
    ctx.bezierCurveTo(x - 11, y - 3, x - 6, y - 12, x, y - 5);
    ctx.bezierCurveTo(x + 6, y - 12, x + 11, y - 3, x, y + 7);
    ctx.fill();
  }
  if (state.combo >= 2) {
    text(ctx, 'COMBO x' + state.combo, 830, 686, 18, '#ff9a3d');
  }
  text(ctx, 'WASD move · E interact · P pause · M mute', 1120, 686, 13, '#cbb89a');
  if (state.message && state.elapsed < state.message.until) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (state.message.until - state.elapsed) * 2);
    const w = ctx.measureText(state.message.text).width + 36;
    rr(ctx, (CANVAS_W - w) / 2, 606, w, 34, 17);
    ctx.fillStyle = state.message.good ? '#2e7d32' : '#5a4632';
    ctx.fill();
    text(ctx, state.message.text, CANVAS_W / 2, 624, 16, '#ffffff');
    ctx.restore();
  }
}

// --- Screens ---------------------------------------------------------------

function dimKitchen(ctx, state) {
  drawFloor(ctx);
  for (const s of STATIONS) drawStation(ctx, s, state, false);
  drawOrders(ctx, state);
  drawHud(ctx, state);
  ctx.fillStyle = 'rgba(20,12,6,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function panel(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 16);
  ctx.fillStyle = '#fff7e8';
  ctx.fill();
  ctx.strokeStyle = '#d9a41f';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawTitle(ctx, state) {
  dimKitchen(ctx, state);
  panel(ctx, 340, 130, 600, 430);
  text(ctx, 'SIZZLE', 640, 205, 64, '#d84a41');
  text(ctx, 'STATION', 640, 265, 64, '#2e7d32');
  text(ctx, 'A lightning-fast kitchen rush', 640, 315, 18, '#5a4632');
  text(ctx, 'Take tickets, chop, grill and fry —', 640, 360, 17, '#2e2a26');
  text(ctx, 'then plate it up and serve before the timer runs out!', 640, 384, 17, '#2e2a26');
  text(ctx, 'WASD / arrows — move    ·    E / Space — use a station', 640, 425, 15, '#5a4632');
  text(ctx, 'Click a station to walk over and use it    ·    P — pause', 640, 449, 15, '#5a4632');
  text(ctx, '▶  PRESS ENTER OR CLICK TO START  ◀', 640, 505, 20, '#d84a41');
  text(ctx, '3 hearts · 150-second shift · tips for fast service', 640, 538, 14, '#8a7a5e');
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(20,12,6,0.6)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  text(ctx, 'PAUSED', 640, 340, 48, '#ffffff');
  text(ctx, 'Press P to keep cooking', 640, 390, 18, '#fff3d6');
}

function starsFor(score) {
  if (score >= 180) return 3;
  if (score >= 120) return 2;
  if (score >= 60) return 1;
  return 0;
}

function drawEnd(ctx, state) {
  dimKitchen(ctx, state);
  panel(ctx, 380, 140, 520, 420);
  text(ctx, 'SHIFT OVER!', 640, 200, 44, '#d84a41');
  const stars = starsFor(state.score);
  let starLine = '';
  for (let i = 0; i < 3; i++) starLine += i < stars ? '★ ' : '☆ ';
  text(ctx, starLine.trim(), 640, 252, 36, '#d9a41f');
  text(ctx, 'Score:  ' + state.score, 640, 310, 24, '#2e2a26');
  text(ctx, 'Dishes served:  ' + state.served, 640, 348, 20, '#2e2a26');
  text(ctx, 'Best combo:  x' + Math.max(1, state.bestCombo), 640, 378, 20, '#2e2a26');
  text(ctx, 'Coins earned:  $' + state.coins, 640, 408, 20, '#2e2a26');
  text(ctx, '▶  PRESS R TO COOK AGAIN  ◀', 640, 480, 20, '#2e7d32');
  text(ctx, 'Thanks for playing Sizzle Station!', 640, 522, 14, '#8a7a5e');
}

// --- Entry point ------------------------------------------------------------

export function drawGame(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  if (state.screen === 'title') {
    drawTitle(ctx, state);
    return;
  }
  if (state.screen === 'end') {
    drawEnd(ctx, state);
    return;
  }
  drawFloor(ctx);
  const near = state.nearStation;
  for (const s of STATIONS) drawStation(ctx, s, state, near === s.id);
  drawChef(ctx, state.chef);
  if (state.chef.moveTarget) {
    ctx.strokeStyle = 'rgba(255,215,106,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.chef.moveTarget.x, state.chef.moveTarget.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawOrders(ctx, state);
  drawHud(ctx, state);
  if (state.screen === 'pause') drawPause(ctx);
}
