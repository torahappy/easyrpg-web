const hasTouchscreen = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const preventNativeKeys = ['ArrowUp', 'ArrowDown', 'ArrowRight', 'ArrowLeft', ' ', 'F12'];
const keys = new Map();
const keysDown = new Map();
const canvas = document.getElementById('canvas');
let easyrpgPlayer;
let lastTouchedId;

// Launch the Player and configure it
window.addEventListener('load', (event) => {
    createEasyRpgPlayer({
      game: undefined,
      saveFs: undefined
    }).then(function(Module) {
      // Module is ready
      easyrpgPlayer = Module;
      easyrpgPlayer.initApi();
      canvas.focus();

      // Custom code here
    });
});

// Make EasyRPG player embeddable
canvas.addEventListener('mouseenter', () => canvas.focus());
canvas.addEventListener('click', () => canvas.focus());

// Handle clicking on the fullscreen button
document.querySelector('#controls-fullscreen').addEventListener('click', () => {
  const viewport = document.getElementById('viewport');
  if (viewport.requestFullscreen) {
    viewport.requestFullscreen();
  }
});

/**
 * Simulate a keyboard event on the emscripten canvas
 *
 * @param {string} eventType Type of the keyboard event
 * @param {string} key Key to simulate
 */
function simulateKeyboardEvent(eventType, key) {
  const event = new Event(eventType, { bubbles: true });
  event.code = key;

  if (window.ListenerHacker.isActivated) {
    window.ListenerHacker.dispatchEvent('canvas', event);
  } else {
    canvas.dispatchEvent(event);
  }
}

/**
 * Simulate a keyboard input from `keydown` to `keyup`
 *
 * @param {string} key Key to simulate
 */
function simulateKeyboardInput(key) {
  simulateKeyboardEvent('keydown', key);
  window.setTimeout(() => {
    simulateKeyboardEvent('keyup', key);
  }, 100);
}

/**
 * Bind a node by a specific key to simulate on touch
 *
 * @param {*} node The node to bind a key to
 * @param {string} key Key to simulate
 */
function bindKey(node, key) {
  keys.set(node.id, key);

  node.addEventListener('touchstart', event => {
    event.preventDefault();
    updateSimulatedKeySet('add', key)
    keysDown.set(event.target.id, node.id);
    node.classList.add('active');
  });

  node.addEventListener('touchend', event => {
    event.preventDefault();

    const pressedKey = keysDown.get(event.target.id);
    if (pressedKey && keys.has(pressedKey)) {
      const key = keys.get(pressedKey);
      updateSimulatedKeySet('remove', key)
    }

    keysDown.delete(event.target.id);
    node.classList.remove('active');

    if (lastTouchedId) {
      document.getElementById(lastTouchedId).classList.remove('active');
    }
  });

  // Inspired by https://github.com/pulsejet/mkxp-web/blob/262a2254b684567311c9f0e135ee29f6e8c3613e/extra/js/dpad.js
  node.addEventListener('touchmove', event => {
    const { target, clientX, clientY } = event.changedTouches[0];
    const origTargetId = keysDown.get(target.id);
    const nextTargetId = document.elementFromPoint(clientX, clientY).id;
    if (origTargetId === nextTargetId) return;

    if (origTargetId) {
      const key = keys.get(origTargetId);
      updateSimulatedKeySet('remove', key)
      keysDown.delete(target.id);
      document.getElementById(origTargetId).classList.remove('active');
    }

    if (keys.has(nextTargetId)) {
      const key = keys.get(nextTargetId);
      updateSimulatedKeySet('add', key)
      keysDown.set(target.id, nextTargetId);
      lastTouchedId = nextTargetId;
      document.getElementById(nextTargetId).classList.add('active');
    }
  })
}

/** @type {{[key: number]: Gamepad}} */
let gamepads = {};
const haveEvents = 'ongamepadconnected' in window;

function addGamepad(gamepad) {
  if (gamepad == undefined) {
    return;
  }
  gamepads[gamepad.index] = gamepad;
  updateTouchControlsVisibility();
}

function removeGamepad(gamepad) {
  if (gamepad == undefined) {
    return;
  }
  delete gamepads[gamepad.index];
  updateTouchControlsVisibility();
}

/** @returns {Gamepad[]} */
function getGamepads() {
  var pads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  return pads;
}

function scanGamePads() {
  var pads = getGamepads();
  for (var i = 0; i < pads.length; i++) {
    if (pads[i]) {
      if (pads[i].index in gamepads) {
        gamepads[pads[i].index] = pads[i];
      } else {
        addGamepad(pads[i]);
      }
    }
  }
}

if (!haveEvents) {
  setInterval(scanGamePads, 500);
}

window.addEventListener('gamepadconnected', function(e) {
  addGamepad(e.gamepad);
});

window.addEventListener('gamepaddisconnected', function(e) {
  removeGamepad(e.gamepad);
})

function updateTouchControlsVisibility() {
  if (hasTouchscreen && Object.keys(gamepads).length === 0) {
    for (const elem of document.querySelectorAll('#dpad, #apad')) {
      elem.style.display = '';
    }
  } else {
    // If we don't have a touch screen, OR any gamepads are connected...
    for (const elem of document.querySelectorAll('#dpad, #apad')) {
      // Hide the touch controls
      elem.style.display = 'none';
    }
  }
}

// Bind all elements providing a `data-key` attribute with the
// given key on touch-based devices
if (hasTouchscreen) {
  for (const button of document.querySelectorAll('[data-key]')) {
    bindKey(button, button.dataset.key);
  }
} else {
  // Prevent scrolling when pressing specific keys
  // window.addEventListener('keydown', event => {
  //   if (preventNativeKeys.includes(event.key)) {
  //     event.preventDefault();
  //   }
  // });

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    // simulateKeyboardInput('Escape', 27);
  });

  // canvas.addEventListener('click', () => {
  //   simulateKeyboardInput('Enter', 13);
  // });
}

updateTouchControlsVisibility();
