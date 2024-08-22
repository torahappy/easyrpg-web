
let urlParams = new URLSearchParams(location.search);
let gameName = urlParams.has("game") ? urlParams.get("game") : "default";
let dbPrefix = urlParams.has("game") ? urlParams.get("game") + "/" : "";

/*

let listenerFuncs = {}
let listenerElems = {}
let origAddEventListener = window.addEventListener;

function createFakeListener (name, elem) {
  listenerFuncs[name] = {}
  listenerElems[name] = elem
  let newfunc = function (...args) {
    let my_listener_funcs = listenerFuncs[name];
    if (my_listener_funcs[args[0]] === undefined) {
      my_listener_funcs[args[0]] = []
    }
    my_listener_funcs[args[0]].push(args)
    origAddEventListener.call(elem, ...args)
  }

  elem.addEventListener = newfunc
}

createFakeListener('canvas', document.getElementById('canvas'))
createFakeListener('window', window)

*/



//
// BEGIN ORIGINAL JavaScript
//






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

  canvas.dispatchEvent(event);
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

let keySet = new Set()

/**
  * Update the set of pressed keys.
  * @param {string} action specify whether to add or remove subset from pressed key list.
  * @param {string} subset a subset of simulated key names, separated with comma
  */

function updateSimulatedKeySet(action, subset) {
  if (action === 'add') {
    keySet = keySet.union(new Set(subset.split(',')));
  } else if (action === 'remove') {
    keySet = keySet.difference(new Set(subset.split(',')));
  }
}

let priv_keySet = keySet;

setInterval(() => {
  let keyups = priv_keySet.difference(keySet)
  let keydowns = keySet.difference(priv_keySet)
  keyups.forEach(x => {
    simulateKeyboardEvent('keyup', x)
  })
  keydowns.forEach(x => {
    simulateKeyboardEvent('keydown', x)
  })
  priv_keySet = keySet;
  // document.getElementById('debuglog').innerHTML = JSON.stringify(new Array(...keySet))
}, 1000/60)

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
  window.addEventListener('keydown', event => {
    if (preventNativeKeys.includes(event.key)) {
      event.preventDefault();
    }
  });

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    // simulateKeyboardInput('Escape', 27);
  });

  // canvas.addEventListener('click', () => {
  //   simulateKeyboardInput('Enter', 13);
  // });
}

updateTouchControlsVisibility();







//
// END ORIGINAL JavaScript
//








let debugstat = false;
/*
function disableListeners (name, t) {
    if (listenerFuncs[name][t] === undefined) {return}
    for (let i = 0; i < listenerFuncs[name][t].length; i++) {
      listenerElems[name].removeEventListener(...listenerFuncs[name][t][i])
    }
}

function enableListeners (name, t) {
    if (listenerFuncs[name][t] === undefined) {return}
    for (let i = 0; i < listenerFuncs[name][t].length; i++) {
      origAddEventListener.call(listenerElems[name], ...listenerFuncs[name][t][i])
    }
}
*/


document.getElementById('debugfile').addEventListener('change', function () {
  const f = this.files[0];
  const reader = new FileReader();
  const num = document.getElementById("debugnumber").value;
  if (!num.match(/^\d\d$/)) {
    alert("invalid save slot id")
    return
  }
  reader.onload = () => {
    setSaveFile(num, reader.result)
  };
  reader.readAsArrayBuffer(f);
})

document.getElementById('debugexec').addEventListener("click", () => {
  try {
    let command = document.getElementById('debugta').value;
    let r = JSON.stringify(eval(command))
    alert(r)
    fetch("/api/put_log", {
      headers: {
	"Content-Type": "application/json"	
      },
      method: "POST",
      body: JSON.stringify({text: command + "\n\n==========\n\n" + r + "\n\n==========\n==========\n\n", reset: false})
    })
  } catch (e) {
    alert(e)
    fetch("/api/put_log", {
      headers: {
	"Content-Type": "application/json"	
      },
      method: "POST",
      body: JSON.stringify({text: command + "\n\n==========\n\n" + e.message + "\n\n==========\n==========\n\n", reset: false})
    })
  }
  document.getElementById('debugta').value = ""
})

function setSaveFile (num, data) {
  return new Promise((res, rej) => {
    let req = indexedDB.open("/easyrpg/" + dbPrefix + "Save");
    req.onsuccess = (e) => {
      let db = e.target.result;
      let trans1 = db.transaction("FILE_DATA", "readwrite");
      let objectStore1 = trans1.objectStore("FILE_DATA");
      let req2 = objectStore1.put({contents: new Uint8Array(data), mode: 33206, timestamp: new Date()}, "/easyrpg/" + dbPrefix + "Save/Save" + num + ".lsd");
      req2.onsuccess = () => {
	      alert("import success")
	      res()
      }
      req2.onerror = rej
    };
    req.onerror = rej
  })
}

function getSaveFile (filename) {
  return new Promise((res, rej) => {
    let req1 = indexedDB.open("/easyrpg/" + dbPrefix + "Save");
    req1.onsuccess = (e2) => {
      let db = e2.target.result;
      let trans1 = db.transaction("FILE_DATA", "readonly");
      let objectStore1 = trans1.objectStore("FILE_DATA");
      let req2 = objectStore1.get("/easyrpg/" + dbPrefix + "Save/" + filename);              
      req2.onsuccess = () => {
        res(req2.result)
      };
      req2.onerror = rej
    };
    req1.onerror = rej
  })
}

document.getElementById('debugexport').addEventListener("click", async () => {
  let zip = new JSZip();
  let rootDir = "backup-" + gameName + "-" + Date.now(); 
  let bak = zip.folder(rootDir);
  for (let i = 0; i < 100; i++) {
    let filename;
    if (i < 10) {
      filename = "Save0" + i + ".lsd"
    } else {
      filename = "Save" + i + ".lsd"
    }

    try {

      let sav = await getSaveFile(filename)
      bak.file(filename, sav.contents)

    } catch (e) {
    }
  }
  let content = await bak.generateAsync({type:"blob"})
  
  saveAs(content, rootDir + ".zip");
})

document.getElementById('reloadaudio').addEventListener('click', () => {
  easyrpgPlayer.SDL2.audioContext.resume()
})

/*
setTimeout(() => {
  if (hasTouchscreen) {
     let types = ["click", "mouseenter", "mousemove", "mousedown", "mouseleave", "wheel", "touchstart", "touchend", "touchmove", "touchcancel"]

     for (let i = 0; i < types.length; i++) {
       disableListeners("canvas", types[i])
    }
  }
}, 3000)
*/

document.getElementById('debugbtninner').addEventListener("click", () =>{
  if (debugstat) {
    // enableListeners("window", "keydown")
    debugbox.style.display = "none"
    canvas.focus();
  } else {
    // disableListeners("window", "keydown")
    debugbox.style.display = "block"
  }

  debugstat = !debugstat
})

