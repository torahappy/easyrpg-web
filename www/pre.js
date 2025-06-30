var ListenerHacker = {
  listenerFuncs: {},
  listenerElems: {},
  origAddEventListener: window.addEventListener,
  createFakeListener: function (name, elem) {
    let th = window.ListenerHacker;
    th.listenerFuncs[name] = {};
    th.listenerElems[name] = elem;
    let newfunc = function (...args) {
      let my_listener_funcs = th.listenerFuncs[name];
      if (my_listener_funcs[args[0]] === undefined) {
        my_listener_funcs[args[0]] = [];
      }
      my_listener_funcs[args[0]].push(args);
      th.origAddEventListener.call(elem, ...args);
    };
    elem.addEventListener = newfunc;
  },
  disableListeners: function (name, t) {
    let th = window.ListenerHacker;
    if (th.listenerFuncs[name][t] === undefined) {
      return;
    }
    for (let i = 0; i < th.listenerFuncs[name][t].length; i++) {
      th.listenerElems[name].removeEventListener(
        ...th.listenerFuncs[name][t][i],
      );
    }
  },
  enableListeners: function (name, t) {
    let th = window.ListenerHacker;
    if (th.listenerFuncs[name][t] === undefined) {
      return;
    }
    for (let i = 0; i < th.listenerFuncs[name][t].length; i++) {
      th.origAddEventListener.call(
        th.listenerElems[name],
        ...th.listenerFuncs[name][t][i],
      );
    }
  },
  isActivated: false,
  activate: function () {
    let th = window.ListenerHacker;
    th.createFakeListener("canvas", document.getElementById("canvas"));
    th.isActivated = true;
  },
  dispatchEvent: function (name, e) {
    let th = window.ListenerHacker;
    th.listenerFuncs[name][e.type].forEach((x) => {
      x[1].call(th.listenerElems[name], e);
    });
  },
  pressKey: function (name, code) {
    let e = new Event("keydown");
    e.code = code;
    this.dispatchEvent(name, e);
    setTimeout(() => {
      let e = new Event("keyup");
      e.code = code;
      this.dispatchEvent(name, e);
    }, 100);
  },
};

// ListenerHacker.activate()

let keySet = new Set();

/**
 * Update the set of pressed keys.
 * @param {string} action specify whether to add or remove subset from pressed key list.
 * @param {string} subset a subset of simulated key names, separated with comma
 */

function updateSimulatedKeySet(action, subset) {
  if (action === "add") {
    keySet = keySet.union(new Set(subset.split(",")));
  } else if (action === "remove") {
    keySet = keySet.difference(new Set(subset.split(",")));
  }
  executeKeySet();
}

let priv_keySet = keySet;

function executeKeySet() {
  if (!window.simulateKeyboardEvent) {
    return;
  }
  let keyups = priv_keySet.difference(keySet);
  let keydowns = keySet.difference(priv_keySet);
  keyups.forEach((x) => {
    window.simulateKeyboardEvent("keyup", x);
  });
  keydowns.forEach((x) => {
    window.simulateKeyboardEvent("keydown", x);
  });
  priv_keySet = keySet;
}

let orig_console_log = console.log;

function server_put_log(...args) {
  orig_console_log(args);
  let s;
  try {
    s = JSON.stringify(args);
  } catch (e) {
    s = String(args);
  }
  fetch("/api/put_log", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ text: "=DEBUG=\n" + s + "\n", reset: false }),
  });
}

console.log = server_put_log;
console.error = server_put_log;
