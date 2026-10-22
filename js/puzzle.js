// =====================================================================
// Plate Motion Explorer — Pangaea Puzzle (a flat map)
// Drag the continents to build Pangaea. Africa is already in place.
// Pinch with two fingers to zoom in, and drag the ocean to move around.
// A timer counts how fast you build it. Finishing it unlocks Hard Mode
// (pieces turned around, only the outside edge of Pangaea is shown).
// The pieces and their starting spots are in js/data/puzzle.js;
// the pictures are in data/puzzle/.
// =====================================================================

export function init(api, ui) {
  const P = window.PUZZLE;
  if (!P) return null;
  const esc = ui.esc, icon = ui.icon;
  const root = document.getElementById('puzzle');
  const anchorId = P.anchor || 'AF';
  let pieces = [], board = null, view = { k: 1, ox: 0, oy: 0 }, shelfOn = false, solved = false;
  let gesture = null, cardEl = null, timers = [], viewAnim = null, mode = 'easy';
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const hardUnlocked = () => store.get('pme-hard-unlocked') === '1';
  const later = (ms, f) => { const id = setTimeout(f, ms); timers.push(id); return id; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm = a => ((a % 360) + 540) % 360 - 180;
  const TOP = 128, BOTTOM = 100;    // room for the title, timer, and the menu bar

  // ---------------------------------------------------------------
  function start() {
    ui.closeCard();
    ui.startActivity({ id: 'puzzle', title: 'Pangaea Puzzle', bodyClass: 'puzzle-on', noBar: true, onStop: cleanup });
    root.hidden = false;
    build();
    mode = 'easy'; reset();
    welcome();
  }
  function welcome() {
    const title = P.title || 'How fast can you build Pangaea?';
    const text = P.popup || 'Drag the continents to their correct spots to rebuild ancient Earth.';
    if (hardUnlocked()) ui.modal({ title, text: text + ' Pick a mode.', icon: 'puzzle',
      buttons: [{ label: 'Easy', onClick: () => begin('easy') }, { label: 'Hard Mode', cls: 'hard', onClick: () => begin('hard') }] });
    else ui.modal({ title, text, icon: 'puzzle', button: P.button || 'Play the puzzle', onOk: () => begin('easy') });
  }
  // start a new game in Easy or Hard Mode (the timer starts when the button is tapped)
  function begin(m) {
    closeCard();
    mode = m; reset();
    if (mode === 'hard') ui.modal({ title: 'Hard Mode!', tone: 'hard', icon: 'rotr', text: P.hardPopup || 'The continents are turned around, and there are no outlines inside Pangaea. To turn a continent, put two fingers on it and twist.', button: 'Play Hard Mode', onOk: startTimer });
    else startTimer();
  }

  // ---------- timer ----------
  let t0 = 0, tick = null, elapsed = 0;
  const fmtTime = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  const best = () => { const v = parseFloat(store.get('pme-best-' + mode)); return isFinite(v) ? v : null; };
  function showTimer() {
    const el = root.querySelector('#pzTimer'); if (!el) return;
    const b = best();
    el.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/></svg><b>${fmtTime(elapsed)}</b><span class="mode ${mode}">${mode === 'hard' ? 'Hard' : 'Easy'}</span>${b !== null ? `<span>Best: ${fmtTime(b)}</span>` : ''}`;
  }
  function startTimer() {
    stopTimer(); elapsed = 0; t0 = performance.now(); showTimer();
    tick = setInterval(() => { elapsed = (performance.now() - t0) / 1000; showTimer(); }, 250);
  }
  function stopTimer() { if (tick) { clearInterval(tick); tick = null; elapsed = (performance.now() - t0) / 1000; } }

  function build() {
    root.innerHTML = `
      <div class="pz-board" id="pzBoard"><div class="pz-grid"></div></div>
      <div class="pz-top"><h2>Pangaea Puzzle</h2><p id="pzHint"></p><div class="pz-timer" id="pzTimer"></div></div>
      <div class="pz-count" id="pzCount"></div>
      <div class="pz-bar">
        <button class="dock-btn" data-p="exit">${icon('x')}<span>Exit</span></button>
        <button class="dock-btn" data-p="all">${icon('eye')}<span>See all</span></button>
        <button class="dock-btn" data-p="shelf" aria-pressed="false">${icon('shelf')}<span>Shelves</span></button>
        <button class="dock-btn" data-p="again">${icon('restart')}<span>Start over</span></button>
        <button class="dock-btn" data-p="help">${icon('question')}<span>Help</span></button>
      </div>`;
    board = root.querySelector('#pzBoard');
    root.querySelector('[data-p="exit"]').onclick = () => ui.exitActivity();
    root.querySelector('[data-p="all"]').onclick = () => fit(true);
    root.querySelector('[data-p="shelf"]').onclick = () => setShelf(!shelfOn, true);
    root.querySelector('[data-p="again"]').onclick = () => { closeCard(); reset(); startTimer(); };
    root.querySelector('[data-p="help"]').onclick = () => ui.modal({ title: 'How to play', icon: 'question', button: 'OK',
      text: mode === 'hard' ? 'Drag a continent with one finger. To turn it, put two fingers on it and twist. Fit it inside the outline of Pangaea. Pinch the ocean to zoom in, and drag the ocean to move around.'
                            : 'Drag a continent with one finger. Use the faint outlines to find where it goes. Pinch with two fingers to zoom in, and drag the ocean to move around.' });
    // overlays (ghost outlines, fossil stripes)
    const o = P.overlay;
    const ghost = document.createElement('img'); ghost.className = 'pz-ghost'; ghost.src = 'data/puzzle/ghost.webp'; ghost.draggable = false;
    const stripes = document.createElement('img'); stripes.className = 'pz-stripes'; stripes.src = 'data/puzzle/stripes.webp'; stripes.draggable = false;
    ghost.dataset.x = stripes.dataset.x = o.x; ghost.dataset.y = stripes.dataset.y = o.y;
    ghost.style.width = stripes.style.width = o.w + 'px'; ghost.style.height = stripes.style.height = o.h + 'px';
    board.appendChild(ghost);
    pieces = P.pieces.map((d, i) => {
      const el = document.createElement('div'); el.className = 'pz-piece';
      el.style.width = d.w + 'px'; el.style.height = d.h + 'px';
      el.innerHTML = `<img class="shelf" src="data/puzzle/${d.id}_shelf.webp" width="${d.w}" height="${d.h}" draggable="false" alt=""><img class="land" src="data/puzzle/${d.id}_land.webp" width="${d.w}" height="${d.h}" draggable="false" alt="${esc(d.name)}">`;
      board.appendChild(el);
      const name = document.createElement('div'); name.className = 'pz-name'; name.textContent = d.name;
      const pc = { d, el, name, x: d.cx, y: d.cy, r: 0, placed: false, z: i, mask: null };
      loadMask(pc);
      return pc;
    });
    pieces.forEach(pc => board.appendChild(pc.name));
    board.appendChild(stripes);
    root.ghost = ghost; root.stripes = stripes;
    window.addEventListener('resize', onResize);
    board.addEventListener('pointerdown', down);
    board.addEventListener('pointermove', move);
    board.addEventListener('pointerup', up);
    board.addEventListener('pointercancel', up);
    board.addEventListener('wheel', wheel, { passive: false });
  }
  // a small copy of each piece's shape, to know when a finger is on it
  function loadMask(pc) {
    const img = new Image();
    img.onload = () => {
      const sc = 0.25, w = Math.max(1, Math.round(pc.d.w * sc)), h = Math.max(1, Math.round(pc.d.h * sc));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0, w, h);
      const a = ctx.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) m[i] = a[i * 4 + 3] > 20 ? 1 : 0;
      pc.mask = { m, w, h, sc };
    };
    img.src = `data/puzzle/${pc.d.id}_shelf.webp`;
  }

  // ---------------------------------------------------------------
  // The view: zoom (k) and scroll (ox, oy)
  // ---------------------------------------------------------------
  const portrait = () => innerHeight > innerWidth;
  // the area to show: Pangaea's outline, plus every piece that is not placed yet
  function contentBox(onlyPangaea) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const grow = (x, y, rad) => { x0 = Math.min(x0, x - rad); y0 = Math.min(y0, y - rad); x1 = Math.max(x1, x + rad); y1 = Math.max(y1, y + rad); };
    const o = P.overlay; grow(o.x, o.y, 0); grow(o.x + o.w, o.y + o.h, 0);
    if (!onlyPangaea) for (const pc of pieces) if (!pc.placed) { grow(pc.x, pc.y, Math.max(pc.d.w, pc.d.h) * 0.5); }
    return { x0, y0, x1, y1 };
  }
  function viewArea() {
    let W = innerWidth, H = innerHeight, bottom = BOTTOM;
    if (cardEl && cardEl.classList.contains('corner')) {
      const r = cardEl.getBoundingClientRect();
      if (r.left > W * 0.4) W = r.left - 8; else bottom = Math.max(bottom, H - r.top + 8);
    }
    return { L: 12, T: TOP, R: W - 12, B: H - bottom };
  }
  function fitView(onlyPangaea) {
    const b = contentBox(onlyPangaea), a = viewArea();
    const k = Math.min((a.R - a.L) / (b.x1 - b.x0), (a.B - a.T) / (b.y1 - b.y0));
    return { k, ox: (a.L + a.R) / 2 - (b.x0 + b.x1) / 2 * k, oy: (a.T + a.B) / 2 - (b.y0 + b.y1) / 2 * k };
  }
  let kMin = 0.1, kFit = 0.1;
  function fit(animate, onlyPangaea) {
    const v = fitView(onlyPangaea);
    kFit = fitView(false).k;
    kMin = Math.min(v.k, kFit) * 0.85;
    setView(v, animate ? 500 : 0);
  }
  const kMax = () => Math.max(1.4, kMin * 3);
  function clampView(v) {
    v.k = clamp(v.k, kMin, kMax());
    const b = contentBox(false), a = viewArea(), m = 120;
    // keep at least part of the puzzle on the screen
    v.ox = clamp(v.ox, a.L + m - b.x1 * v.k, a.R - m - b.x0 * v.k);
    v.oy = clamp(v.oy, a.T + m - b.y1 * v.k, a.B - m - b.y0 * v.k);
    return v;
  }
  function setView(v, ms = 0) {
    if (viewAnim) { cancelAnimationFrame(viewAnim); viewAnim = null; }
    if (!ms) { view = v; applyView(); return; }
    const from = { ...view }, t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - t, 3);
      // move smoothly in "zoom space", so it doesn't swing around
      const k = from.k * Math.pow(v.k / from.k, e);
      const cxF = (innerWidth / 2 - from.ox) / from.k, cyF = (innerHeight / 2 - from.oy) / from.k;
      const cxT = (innerWidth / 2 - v.ox) / v.k, cyT = (innerHeight / 2 - v.oy) / v.k;
      const cx = cxF + (cxT - cxF) * e, cy = cyF + (cyT - cyF) * e;
      view = { k, ox: innerWidth / 2 - cx * k, oy: innerHeight / 2 - cy * k };
      applyView();
      viewAnim = t < 1 ? requestAnimationFrame(step) : null;
    };
    viewAnim = requestAnimationFrame(step);
  }
  function zoomAt(f, sx, sy, ms = 0) {
    const k = clamp(view.k * f, kMin, kMax());
    const bx = (sx - view.ox) / view.k, by = (sy - view.oy) / view.k;
    setView(clampView({ k, ox: sx - bx * k, oy: sy - by * k }), ms);
  }
  function zoomBy(f) { const a = viewArea(); zoomAt(f, (a.L + a.R) / 2, (a.T + a.B) / 2, 350); }
  function onResize() { fit(false, solved); }
  function applyView() {
    if (!board) return;
    [root.ghost, root.stripes].forEach(im => { im.style.transform = `translate(${view.ox + im.dataset.x * view.k}px, ${view.oy + im.dataset.y * view.k}px) scale(${view.k})`; });
    const g = board.querySelector('.pz-grid'), gs = 60 * Math.max(0.5, view.k / Math.max(kMin, 0.01));
    g.style.backgroundSize = `${gs}px ${gs}px`; g.style.backgroundPosition = `${view.ox % gs}px ${view.oy % gs}px`;
    pieces.forEach(place);
  }
  function place(pc) {
    const d = pc.d, k = view.k;
    const px = d.cx - d.x, py = d.cy - d.y;       // the middle of the piece, inside its picture
    const sx = view.ox + pc.x * k, sy = view.oy + pc.y * k;
    pc.el.style.transform = `translate(${sx}px, ${sy}px) rotate(${pc.r}deg) scale(${k}) translate(${-px}px, ${-py}px)`;
    pc.el.style.zIndex = pc.placed ? 1 : 2 + pc.z;
    pc.name.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
    pc.name.style.zIndex = 300;
  }
  const toBoard = (sx, sy) => ({ x: (sx - view.ox) / view.k, y: (sy - view.oy) / view.k });
  // is this spot on the piece? (with extra room, so small pieces are easy to grab)
  function hit(pc, bx, by) {
    if (!pc.mask) return false;
    const d = pc.d, a = -pc.r * Math.PI / 180, dx = bx - pc.x, dy = by - pc.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a) + (d.cx - d.x), ly = dx * Math.sin(a) + dy * Math.cos(a) + (d.cy - d.y);
    const { m, w, h, sc } = pc.mask;
    const ix = Math.floor(lx * sc), iy = Math.floor(ly * sc);
    const pad = Math.max(2, Math.ceil(14 / view.k * sc));
    for (let oy = -pad; oy <= pad; oy += Math.max(1, pad >> 2)) for (let ox = -pad; ox <= pad; ox += Math.max(1, pad >> 2)) {
      const x = ix + ox, y = iy + oy;
      if (x >= 0 && y >= 0 && x < w && y < h && m[y * w + x]) return true;
    }
    return false;
  }
  function pieceAt(sx, sy) {
    const b = toBoard(sx, sy);
    const order = pieces.filter(p => !p.placed).sort((a, c) => c.z - a.z);
    let pc = order.find(p => hit(p, b.x, b.y));
    if (!pc) {   // tiny pieces: a tap close to the middle counts
      let best = null, bd = 40;
      for (const p of order) { const d = Math.hypot(view.ox + p.x * view.k - sx, view.oy + p.y * view.k - sy); if (d < bd) { bd = d; best = p; } }
      pc = best;
    }
    return pc;
  }

  // ---------------------------------------------------------------
  function reset() {
    solved = false;
    root.stripes.classList.remove('on');
    root.classList.toggle('hard-on', mode === 'hard');
    root.ghost.src = mode === 'hard' ? 'data/puzzle/outline.webp' : 'data/puzzle/ghost.webp';
    const tall = portrait(), hard = mode === 'hard';
    pieces.forEach((pc, i) => {
      const d = pc.d;
      pc.placed = d.id === anchorId;
      pc.el.classList.remove('placed', 'lift');
      pc.r = 0;
      if (pc.placed) { pc.x = d.cx; pc.y = d.cy; pc.el.classList.add('placed'); }
      else if (hard) {
        if (tall && d.hpx !== undefined) { pc.x = d.hpx; pc.y = d.hpy; } else { pc.x = d.hx ?? d.sx; pc.y = d.hy ?? d.sy; }
        pc.r = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.round(Math.random() * 11) * 10);   // turned 60° to 170°
      }
      else if (tall && d.px !== undefined) { pc.x = d.px; pc.y = d.py; }
      else { pc.x = d.sx; pc.y = d.sy; }
      pc.z = i;
    });
    setShelf(false);
    fit(false); count();
    elapsed = 0; showTimer();
    say(hard ? 'Turn each continent with two fingers, then fit it inside Pangaea.' : 'Drag each continent to where it fits. Pinch to zoom in.');
  }
  function say(t) { root.querySelector('#pzHint').textContent = t; }
  function count() {
    const n = pieces.filter(p => p.d.id !== anchorId).length, k = pieces.filter(p => p.placed && p.d.id !== anchorId).length;
    root.querySelector('#pzCount').innerHTML = `<b>${k}</b> of ${n} pieces in place`;
  }
  function setShelf(on, fromButton) {
    shelfOn = on; root.classList.toggle('shelf-on', on);
    root.querySelector('[data-p="shelf"]').setAttribute('aria-pressed', String(on));
    if (on && fromButton) ui.modal({ title: 'What are shelves?', icon: 'shelf', button: 'OK',
      text: 'The light blue edges are part of each continent too. They are covered by shallow ocean water, so they don’t look like land on a map.' });
  }

  // ---------------------------------------------------------------
  // Fingers: drag a piece, drag the ocean to move around, pinch to zoom
  // ---------------------------------------------------------------
  const ptrs = new Map();
  let edgeRAF = null, lastPtr = null;
  function down(e) {
    if (cardEl && !cardEl.classList.contains('corner')) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { board.setPointerCapture(e.pointerId); } catch (err) {}
    if (viewAnim) { cancelAnimationFrame(viewAnim); viewAnim = null; }
    if (ptrs.size === 1) {
      const pc = solved ? null : pieceAt(e.clientX, e.clientY);
      if (pc) {
        const b = toBoard(e.clientX, e.clientY);
        pc.z = Math.max(...pieces.map(p => p.z)) + 1;
        pc.el.classList.add('lift');
        gesture = { type: 'piece', pc, id: e.pointerId, gx: b.x - pc.x, gy: b.y - pc.y };
        lastPtr = { x: e.clientX, y: e.clientY };
        place(pc);
        edgeLoop();
      } else gesture = { type: 'pan', id: e.pointerId, x: e.clientX, y: e.clientY, ox: view.ox, oy: view.oy };
    } else if (ptrs.size === 2) {
      const [a, c] = [...ptrs.values()];
      if (gesture && gesture.type === 'piece' && mode === 'hard') {   // two fingers on a piece: twist to turn it
        const pc = gesture.pc;
        gesture = { type: 'twist', pc, a0: Math.atan2(c.y - a.y, c.x - a.x), r0: pc.r, mx: (a.x + c.x) / 2, my: (a.y + c.y) / 2, x0: pc.x, y0: pc.y };
        return;
      }
      if (gesture && gesture.type === 'piece') { const pc = gesture.pc; pc.el.classList.remove('lift'); checkSnap(pc); }
      gesture = { type: 'pinch', d0: Math.hypot(a.x - c.x, a.y - c.y) || 1, k0: view.k, mx: (a.x + c.x) / 2, my: (a.y + c.y) / 2, ox: view.ox, oy: view.oy };
    }
  }
  function move(e) {
    const p = ptrs.get(e.pointerId); if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (!gesture) return;
    if (gesture.type === 'piece' && e.pointerId === gesture.id) {
      lastPtr = { x: e.clientX, y: e.clientY };
      const b = toBoard(e.clientX, e.clientY);
      gesture.pc.x = b.x - gesture.gx; gesture.pc.y = b.y - gesture.gy;
      place(gesture.pc);
    } else if (gesture.type === 'pan' && e.pointerId === gesture.id) {
      view = clampView({ k: view.k, ox: gesture.ox + e.clientX - gesture.x, oy: gesture.oy + e.clientY - gesture.y });
      applyView();
    } else if (gesture.type === 'twist' && ptrs.size >= 2) {
      const [a, c] = [...ptrs.values()], g = gesture, pc = g.pc;
      pc.r = norm(g.r0 + (Math.atan2(c.y - a.y, c.x - a.x) - g.a0) * 180 / Math.PI);
      pc.x = g.x0 + ((a.x + c.x) / 2 - g.mx) / view.k; pc.y = g.y0 + ((a.y + c.y) / 2 - g.my) / view.k;
      place(pc);
    } else if (gesture.type === 'pinch' && ptrs.size >= 2) {
      const [a, c] = [...ptrs.values()], g = gesture;
      const k = clamp(g.k0 * Math.hypot(a.x - c.x, a.y - c.y) / g.d0, kMin, kMax());
      const bx = (g.mx - g.ox) / g.k0, by = (g.my - g.oy) / g.k0;     // the spot that was between the fingers
      const mx = (a.x + c.x) / 2, my = (a.y + c.y) / 2;
      view = clampView({ k, ox: mx - bx * k, oy: my - by * k });
      applyView();
    }
  }
  function up(e) {
    ptrs.delete(e.pointerId);
    if (!gesture) return;
    if (gesture.type === 'twist') {
      const pc = gesture.pc;
      if (ptrs.size === 1) {   // one finger left: keep dragging with it
        const [id, q] = [...ptrs.entries()][0], b = toBoard(q.x, q.y);
        gesture = { type: 'piece', pc, id, gx: b.x - pc.x, gy: b.y - pc.y }; lastPtr = { x: q.x, y: q.y };
      } else if (ptrs.size === 0) { pc.el.classList.remove('lift'); gesture = null; checkSnap(pc); }
      return;
    }
    if (gesture.type === 'pinch') {
      if (ptrs.size === 1) { const [id, q] = [...ptrs.entries()][0]; gesture = { type: 'pan', id, x: q.x, y: q.y, ox: view.ox, oy: view.oy }; }
      else if (ptrs.size === 0) gesture = null;
      return;
    }
    if (ptrs.size === 0) {
      if (gesture.type === 'piece') { const pc = gesture.pc; pc.el.classList.remove('lift'); checkSnap(pc); }
      gesture = null;
    }
  }
  // while dragging a piece near the edge of the screen, the map scrolls
  function edgeLoop() {
    if (edgeRAF) return;
    let last = performance.now();
    const step = (now) => {
      edgeRAF = null;
      if (!gesture || gesture.type !== 'piece' || !lastPtr) return;
      if (view.k < kFit * 1.15) { edgeRAF = requestAnimationFrame(step); return; }   // only when zoomed in
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const a = viewArea(), E = 56, sp = 520;
      let dx = 0, dy = 0;
      if (lastPtr.x < a.L + E) dx = 1; else if (lastPtr.x > a.R - E) dx = -1;
      if (lastPtr.y < a.T + E) dy = 1; else if (lastPtr.y > a.B - E) dy = -1;
      if (dx || dy) {
        view = clampView({ k: view.k, ox: view.ox + dx * sp * dt, oy: view.oy + dy * sp * dt });
        const b = toBoard(lastPtr.x, lastPtr.y);
        gesture.pc.x = b.x - gesture.gx; gesture.pc.y = b.y - gesture.gy;
        applyView();
      }
      edgeRAF = requestAnimationFrame(step);
    };
    edgeRAF = requestAnimationFrame(step);
  }
  function wheel(e) {
    e.preventDefault();
    zoomAt(Math.exp(-clamp(e.deltaY, -120, 120) * (e.ctrlKey ? 0.012 : 0.003)), e.clientX, e.clientY);
  }
  function checkSnap(pc) {
    const hard = mode === 'hard';
    const tol = hard ? Math.min(0.08 * P.S, Math.max(0.05 * P.S, 16 / view.k))      // Hard Mode: be more exact
                     : Math.min(0.2 * P.S, Math.max(0.11 * P.S, 34 / view.k));
    const tolR = hard ? 12 : 360;
    const dist = Math.hypot(pc.x - pc.d.cx, pc.y - pc.d.cy), dr = Math.abs(norm(pc.r));
    if (dist < tol && dr < tolR) {
      const fx = pc.x, fy = pc.y, fr = norm(pc.r);
      pc.placed = true;
      const t0s = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0s) / 260), e2 = 1 - Math.pow(1 - t, 3);
        pc.x = fx + (pc.d.cx - fx) * e2; pc.y = fy + (pc.d.cy - fy) * e2; pc.r = fr * (1 - e2);
        place(pc);
        if (t < 1) requestAnimationFrame(step);
        else { pc.x = pc.d.cx; pc.y = pc.d.cy; pc.r = 0; place(pc); pc.el.classList.add('placed'); glow(pc); count(); afterPlace(pc); }
      };
      requestAnimationFrame(step);
    } else if (hard && dist < tol * 2.5 && dr >= tolR) say(`${pc.d.name} is in the right spot! Now turn it with two fingers.`);
    else if (hard && dr < tolR && dist < tol * 2.5) say(`${pc.d.name} is turned the right way. Move it a little closer!`);
  }
  // each continent glows its own color when it snaps into place
  const GLOW = { NA: '#ff8f7a', GR: '#e8f6ff', SA: '#7fe0a0', EU: '#c39bff', MG: '#ff7ac8', IN: '#ffd84d', AU: '#ffa94d', AN: '#7fd3ff', AF: '#e9b47c' };
  function glow(pc) {
    const c = GLOW[pc.d.id] || '#7fe0a0';
    const frames = [
      { filter: `drop-shadow(0 0 0px ${c})` },
      { filter: `drop-shadow(0 0 14px ${c}) drop-shadow(0 0 6px ${c}) brightness(1.25)`, offset: 0.18 },
      { filter: `drop-shadow(0 0 4px ${c})`, offset: 0.42 },
      { filter: `drop-shadow(0 0 16px ${c}) drop-shadow(0 0 6px ${c}) brightness(1.2)`, offset: 0.62 },
      { filter: `drop-shadow(0 0 3px ${c})` }
    ];
    pc.el.querySelectorAll('img').forEach(im => { try { im.animate(frames, { duration: 1600, easing: 'ease-out' }); } catch (e) {} });
    // rings of light in the same color
    const b = document.createElement('div'); b.className = 'pop-burst';
    b.style.transform = `translate(${view.ox + pc.x * view.k}px, ${view.oy + pc.y * view.k}px)`; b.style.zIndex = 320;
    b.innerHTML = `<div class="ring" style="border-color:${c};box-shadow:0 0 24px ${c}, inset 0 0 18px ${c}"></div><div class="ring r2" style="border-color:${c};box-shadow:0 0 18px ${c}"></div>` +
      Array.from({ length: 10 }, (_, i) => `<div class="spark" style="--a:${i * 36}deg;--d:${60 + (i % 3) * 20}px;background:${c};box-shadow:0 0 10px 3px ${c}"></div>`).join('');
    board.appendChild(b); later(1500, () => b.remove());
    try { pc.name.animate([{ transform: pc.name.style.transform + ' scale(1)', color: '#fff' }, { transform: pc.name.style.transform + ' scale(1.35)', color: c }, { transform: pc.name.style.transform + ' scale(1)', color: '#fff' }], { duration: 1000, easing: 'ease-out' }); } catch (e) {}
  }
  function afterPlace(pc) {
    const left = pieces.filter(p => !p.placed).length;
    if (left === 0) { win(); return; }
    say(`${pc.d.name} fits! ${left} more ${left === 1 ? 'piece' : 'pieces'} to go.`);
  }

  // ---------------------------------------------------------------
  // Finished!
  // ---------------------------------------------------------------
  function win() {
    solved = true;
    stopTimer();
    const time = elapsed, old = best(), newBest = old === null || time < old;
    if (newBest) store.set('pme-best-' + mode, time.toFixed(1));
    showTimer();
    const unlockNow = mode === 'easy' && !hardUnlocked();
    if (unlockNow) store.set('pme-hard-unlocked', '1');
    say(mode === 'hard' ? 'You beat Hard Mode!' : 'You built Pangaea!');
    fit(true, true);
    pieces.forEach(pc => glow(pc));
    later(500, () => ui.celebrate(mode === 'hard' ? 'You beat Hard Mode!' : 'You built Pangaea!', `Your time: ${fmtTime(time)}`));
    later(700, () => root.stripes.classList.add('on'));
    if (unlockNow) later(4100, unlockFlash);
    later(unlockNow ? 7000 : 3800, () => {
      const L = (P.legend || []).map(([id, name, col, pat]) => `<div><i style="width:34px;height:12px;border-radius:3px;background:${col};flex:none"></i><span><b>${esc(name)}</b> (${esc(pat)})</span></div>`).join('');
      const playHard = mode === 'easy' && hardUnlocked();
      cardEl = card(`<h2>${mode === 'hard' ? 'You beat Hard Mode!' : 'You built Pangaea!'}</h2>
        ${newBest ? `<span class="newbest">🏆 New best time!</span>` : ''}
        <div class="pz-result"><div><span>Your time</span><b>${fmtTime(time)}</b></div><div class="best"><span>Best time (${mode === 'hard' ? 'Hard' : 'Easy'})</span><b>${fmtTime(newBest ? time : old)}</b></div></div>
        <p class="lead">This is about how the continents fit together ${P.T} million years ago.</p>
        <ul class="bul"><li>Pangaea means “all lands.”</li><li>The colored stripes show where four kinds of fossils are found.</li><li>Look! The stripes line up across the edges of the continents.</li>
        ${shelfOn ? '<li>With the shelves on, the continents fit together even better.</li>' : '<li>Tap <b>Shelves</b> at the bottom. The continents fit even better at the edge of their shelves!</li>'}</ul>
        <div class="legend">${L}</div>
        <div class="box evidence"><h3>${icon('check')}The evidence</h3><p>The continents fit together like puzzle pieces, and the fossils line up across them. This is evidence that the continents were once joined, and that they have moved over time.</p></div>
        <div class="actions">
          ${playHard ? `<button class="act hard" data-w="hard">${icon('rotr')}<span>Play Hard Mode<small>Turn the pieces yourself, no outlines inside</small></span></button>` : ''}
          <button class="act ${playHard ? '' : 'primary'}" data-w="again">${icon('restart')}<span>Play again and beat your time</span></button>
          <button class="act" data-w="globe">${icon('hourglass')}<span>Watch Pangaea break apart<small>Opens the Time Machine</small></span></button></div>`, true);
      fit(true, true);
      cardEl.querySelector('[data-w="hard"]')?.addEventListener('click', () => begin('hard'));
      cardEl.querySelector('[data-w="globe"]').onclick = () => { ui.exitActivity(); setTimeout(() => ui.go('time'), 300); };
      cardEl.querySelector('[data-w="again"]').onclick = () => begin(mode);
    });
  }
  // a red glowing flash: Hard Mode is unlocked
  function unlockFlash() {
    const u = document.createElement('div'); u.className = 'unlock';
    u.innerHTML = `<div class="unlock-box"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.6-1.8"/></svg><b>You’ve unlocked Hard Mode!</b><span>Can you build Pangaea with no outlines?</span></div>`;
    document.body.appendChild(u); later(2900, () => u.remove());
  }

  // a card inside the puzzle screen (with Read to me)
  function card(html, corner) {
    closeCard();
    const c = document.createElement('div'); c.className = 'pz-card' + (corner ? ' corner' : '');
    c.innerHTML = `<div class="card-top"><span></span><span class="card-top-r">${ui.speech.ok ? '<button class="say-btn small"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg><span>Read to me</span></button>' : ''}<button class="close" aria-label="Close">✕</button></span></div><div class="pz-card-body">${html}</div>`;
    root.appendChild(c);
    const sb = c.querySelector('.say-btn');
    if (sb) sb.onclick = () => ui.speech.read(c.querySelector('.pz-card-body'), sb);
    c.querySelector('.close').onclick = () => { closeCard(); if (solved) fit(true, true); };
    return c;
  }
  function closeCard() { ui.speech.stop(); if (cardEl) { cardEl.remove(); cardEl = null; } }

  function cleanup() {
    timers.forEach(clearTimeout); timers = []; stopTimer();
    document.querySelectorAll('.unlock').forEach(u => u.remove());
    if (viewAnim) cancelAnimationFrame(viewAnim); viewAnim = null;
    if (edgeRAF) cancelAnimationFrame(edgeRAF); edgeRAF = null;
    closeCard(); ui.closeModal();
    window.removeEventListener('resize', onResize);
    root.hidden = true; root.innerHTML = ''; board = null; pieces = [];
    ptrs.clear(); gesture = null;
  }
  // for testing: screen spot of a piece's middle, now and when solved
  const where = (id) => { const pc = pieces.find(q => q.d.id === id); return pc && { now: [view.ox + pc.x * view.k, view.oy + pc.y * view.k], goal: [view.ox + pc.d.cx * view.k, view.oy + pc.d.cy * view.k], placed: pc.placed, k: view.k, r: pc.r }; };
  return { start, where, zoomBy, begin, mode: () => mode, time: () => elapsed };
}
