// Sizzle Station — keyboard and mouse input.
// One job: turn raw DOM events into one small state object the game reads
// every frame. Edge-triggered actions (interact, pause, restart) are consumed
// once by the loop so a held key never double-fires.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let click = null; // {x, y} in canvas pixels, consumed by the loop
  let clickHandled = false;

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy };
  }

  window.addEventListener('keydown', (event) => {
    const k = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) event.preventDefault();
    if (!event.repeat) pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });
  canvas.addEventListener('pointerdown', (event) => {
    click = toCanvas(event);
    clickHandled = false;
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });

  return {
    // Held movement: -1, 0 or 1 on each axis.
    moveX() {
      const left = keys.has('a') || keys.has('arrowleft');
      const right = keys.has('d') || keys.has('arrowright');
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    moveY() {
      const up = keys.has('w') || keys.has('arrowup');
      const down = keys.has('s') || keys.has('arrowdown');
      return (down ? 1 : 0) - (up ? 1 : 0);
    },
    // True once for the frame the key went down, then cleared by the loop.
    wasPressed(key) {
      return pressed.has(key);
    },
    interactPressed() {
      return pressed.has('e') || pressed.has(' ');
    },
    consumeClick() {
      if (click && !clickHandled) {
        clickHandled = true;
        return click;
      }
      return null;
    },
    endFrame() {
      pressed.clear();
    },
  };
}
