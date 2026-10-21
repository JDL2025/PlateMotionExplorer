// Plate Motion Explorer — starts everything.
import { createGlobe } from './globe.js';
import { createUI } from './app.js';

const ok = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2')); } catch (e) { return false; } })();
if (!ok) {
  document.getElementById('fail').hidden = false;
} else {
  const api = createGlobe(document.getElementById('stage'));
  const ui = createUI(api);
  window.PME = { api, ui };
  // Each activity is its own file, so a problem in one can't stop the others.
  api.ready.then(() => {
    import('./match.js').then(m => {
      if (window.FOSSILS) ui.features.fossils = m.createMatch(api, ui, window.FOSSILS, { id: 'fossils', title: 'Fossil Match', badgeIcon: 'fossil', noun: 'fossil' });
      if (window.ROCKS) ui.features.rocks = m.createMatch(api, ui, window.ROCKS, { id: 'rocks', title: 'Rock Match', badgeIcon: 'mountain', noun: 'rock' });
    }).catch(e => console.warn('Match not loaded', e));
    import('./timemachine.js').then(m => { ui.features.time = m.init(api, ui); }).catch(e => console.warn('Time Machine not loaded', e));
    import('./puzzle.js').then(m => { ui.features.puzzle = m.init(api, ui); }).catch(e => console.warn('Puzzle not loaded', e));
  });
}

// Stop iPad Safari from pinch-zooming the whole page (same fix as Mars Explorer)
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
