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
  if (!window.simulateKeyboardEvent) { return; }
  let keyups = priv_keySet.difference(keySet)
  let keydowns = keySet.difference(priv_keySet)
  keyups.forEach(x => {
    window.simulateKeyboardEvent('keyup', x)
  })
  keydowns.forEach(x => {
    window.simulateKeyboardEvent('keydown', x)
  })
  priv_keySet = keySet;
}, 1000/60)
