// =====================================================================
// Plate Motion Explorer — Pangaea Puzzle (a flat map)
// Drag the continents (and twist them with two fingers) to build Pangaea.
// Africa is already in place. The pieces and their spots are in
// js/data/puzzle.js; the pictures are in data/puzzle/.
// =====================================================================

export function init(api, ui) {
  const P = window.PUZZLE;
  if (!P) return null;
  const esc = ui.esc, icon = ui.icon;
  const root = document.getElementById('puzzle');
  const anchorId = P.anchor || 'AF';
  let level = 'easy', pieces = [], board = null, view = { k: 1, ox: 0, oy: 0 }, selected = null, shelfOn = false, solved = false;
  let gesture = null, cardEl = null, timers = [];
  const later = (ms, f) => { const id = setTimeout(f, ms); timers.push(id); return id; };
  const norm = a => { a = ((a % 360) + 540) % 360 - 180; return a; };

  // ---------------------------------------------------------------
  function start() {
    ui.closeCard();
    ui.startActivity({ id: 'puzzle', title: 'Pangaea Puzzle', bodyClass: 'puzzle-on', noBar: true, onStop: cleanup });
    root.hidden = false;
    build();
    chooseLevel();
  }
  function build() {
    root.innerHTML = `
      <div class="pz-board" id="pzBoard"><div class="pz-grid"></div></div>
      <div class="pz-top"><h2>Pangaea Puzzle</h2><p id="pzHint">Put the continents back together. Africa is already in place.</p></div>
      <div class="pz-count" id="pzCount"></div>
      <div class="pz-bar">
        <button class="dock-btn" data-p="exit">${icon('x')}<span>Exit</span></button>
        <button class="dock-btn" data-p="rotl">${icon('rotl')}<span>Turn left</span></button>
        <button class="dock-btn" data-p="rotr">${icon('rotr')}<span>Turn right</span></button>
        <button class="dock-btn" data-p="shelf" aria-pressed="false">${icon('shelf')}<span>Shelves</span></button>
        <button class="dock-btn" data-p="hint">${icon('eye')}<span>Hint</span></button>
        <button class="dock-btn" data-p="again">${icon('restart')}<span>Start over</span></button>
        <button class="dock-btn" data-p="help">${icon('question')}<span>Help</span></button>
      </div>`;
    board = root.querySelector('#pzBoard');
    root.querySelector('[data-p="exit"]').onclick = () => ui.exitActivity();
    root.querySelector('[data-p="rotl"]').onclick = () => rotateSel(-15);
    root.querySelector('[data-p="rotr"]').onclick = () => rotateSel(15);
    root.querySelector('[data-p="shelf"]').onclick = () => setShelf(!shelfOn);
    root.querySelector('[data-p="hint"]').onclick = () => hint();
    root.querySelector('[data-p="again"]').onclick = () => chooseLevel();
    root.querySelector('[data-p="help"]').onclick = () => helpCard();
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
    window.addEventListener('resize', layout);
    board.addEventListener('pointerdown', down);
    board.addEventListener('pointermove', move);
    board.addEventListener('pointerup', up);
    board.addEventListener('pointercancel', up);
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
  // Layout: fit everything on the screen
  // ---------------------------------------------------------------
  let zoomed = false;     // after the puzzle is solved, zoom in on Pangaea
  function layout() {
    if (!board) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const grow = (x, y, rad) => { x0 = Math.min(x0, x - rad); y0 = Math.min(y0, y - rad); x1 = Math.max(x1, x + rad); y1 = Math.max(y1, y + rad); };
    const o = P.overlay; grow(o.x, o.y, 0); grow(o.x + o.w, o.y + o.h, 0);
    if (!zoomed) for (const pc of pieces) { const rad = Math.hypot(pc.d.w, pc.d.h) * 0.36; grow(pc.d.sx, pc.d.sy, rad); }
    let W = innerWidth, H = innerHeight, top = 84, bottom = 96, left = 12;
    if (zoomed && cardEl && cardEl.classList.contains('corner')) {
      const r = cardEl.getBoundingClientRect();
      if (r.left > W * 0.4) W = r.left - 8; else bottom = Math.max(bottom, H - r.top + 8);
    }
    const k = Math.min((W - 2 * left) / (x1 - x0), (H - top - bottom) / (y1 - y0));
    view = { k, ox: (W - (x1 - x0) * k) / 2 - x0 * k, oy: top + (H - top - bottom - (y1 - y0) * k) / 2 - y0 * k };
    [root.ghost, root.stripes].forEach(im => { im.style.transform = `translate(${view.ox + im.dataset.x * view.k}px, ${view.oy + im.dataset.y * view.k}px) scale(${view.k})`; });
    pieces.forEach(place);
  }
  function place(pc) {
    const d = pc.d, k = view.k;
    const px = d.cx - d.x, py = d.cy - d.y;       // the middle of the piece, inside its picture
    pc.el.style.transform = `translate(${view.ox + pc.x * k}px, ${view.oy + pc.y * k}px) rotate(${pc.r}deg) scale(${k}) translate(${-px}px, ${-py}px)`;
    pc.el.style.zIndex = pc.placed ? 1 : 2 + pc.z;
    pc.name.style.transform = `translate(${view.ox + pc.x * k}px, ${view.oy + pc.y * k}px) translate(-50%, -50%)`;
    pc.name.style.zIndex = 300;
  }
  const toBoard = (sx, sy) => ({ x: (sx - view.ox) / view.k, y: (sy - view.oy) / view.k });
  function hit(pc, bx, by) {
    if (!pc.mask) return false;
    const d = pc.d, a = -pc.r * Math.PI / 180;
    const dx = bx - pc.x, dy = by - pc.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a) + (d.cx - d.x), ly = dx * Math.sin(a) + dy * Math.cos(a) + (d.cy - d.y);
    const { m, w, h, sc } = pc.mask;
    const ix = Math.floor(lx * sc), iy = Math.floor(ly * sc);
    for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) {   // a little extra room for fingers
      const x = ix + ox, y = iy + oy;
      if (x >= 0 && y >= 0 && x < w && y < h && m[y * w + x]) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------
  // Levels
  // ---------------------------------------------------------------
  function chooseLevel() {
    closeCard();
    cardEl = card(`<h2>Pangaea Puzzle</h2>
      <p class="lead">Long ago, all the continents were joined into one supercontinent called <b>Pangaea</b>. Can you put it back together?</p>
      <ol class="steps-list"><li>Drag a continent with one finger.</li><li>Move it next to Africa where it fits.</li><li>When it is in the right spot, it snaps into place and glows green.</li></ol>
      <h3 class="sec">Pick a level</h3>
      <div class="pz-levels">
        <button class="pz-level" data-lv="easy"><span class="lv">🙂</span><span><b>Easy</b><span>The pieces are already turned the right way, and there are outlines to help.</span></span></button>
        <button class="pz-level" data-lv="challenge"><span class="lv">🧠</span><span><b>Challenge</b><span>The pieces start like a map of today. You turn them with two fingers or the Turn buttons. No outlines!</span></span></button>
      </div>`, false);
    cardEl.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { level = b.dataset.lv; reset(); closeCard(); });
    reset(true);
  }
  function reset(preview) {
    solved = false; selected = null; zoomed = false;
    root.stripes.classList.remove('on');
    pieces.forEach((pc, i) => {
      pc.placed = pc.d.id === anchorId;
      pc.el.classList.remove('placed', 'lift', 'flash');
      if (pc.placed) { pc.x = pc.d.cx; pc.y = pc.d.cy; pc.r = 0; pc.el.classList.add('placed'); }
      else { pc.x = pc.d.sx; pc.y = pc.d.sy; pc.r = level === 'challenge' ? norm(pc.d.todayDeg) : 0; }
      pc.z = i;
    });
    root.ghost.style.opacity = level === 'easy' ? '' : '0';
    root.querySelector('[data-p="rotl"]').hidden = root.querySelector('[data-p="rotr"]').hidden = level !== 'challenge';
    root.querySelector('[data-p="hint"]').hidden = level !== 'challenge';
    setShelf(false);
    layout(); count();
    if (!preview) say(level === 'easy' ? 'Drag a continent to where it fits next to Africa.' : 'Drag and turn the continents to build Pangaea. Use two fingers to turn a piece.');
  }
  function say(t) { root.querySelector('#pzHint').textContent = t; }
  function count() {
    const n = pieces.filter(p => p.d.id !== anchorId).length, k = pieces.filter(p => p.placed && p.d.id !== anchorId).length;
    root.querySelector('#pzCount').innerHTML = `<b>${k}</b> of ${n} pieces in place`;
  }
  function setShelf(on) {
    shelfOn = on; root.classList.toggle('shelf-on', on);
    root.querySelector('[data-p="shelf"]').setAttribute('aria-pressed', String(on));
  }
  function hint() {
    root.ghost.style.transition = 'opacity .3s'; root.ghost.style.opacity = '1';
    later(2200, () => { if (level !== 'easy') root.ghost.style.opacity = '0'; });
  }
  function rotateSel(deg) {
    const pc = selected; if (!pc || pc.placed) { say('First tap a continent, then turn it.'); return; }
    pc.r = norm(pc.r + deg); place(pc); checkSnap(pc);
  }

  // ---------------------------------------------------------------
  // Dragging and twisting
  // ---------------------------------------------------------------
  const ptrs = new Map();
  function down(e) {
    if (cardEl && !cardEl.classList.contains('corner')) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    board.setPointerCapture(e.pointerId);
    if (ptrs.size === 1) {
      const b = toBoard(e.clientX, e.clientY);
      const order = pieces.filter(p => !p.placed).sort((a, c) => c.z - a.z);
      const pc = order.find(p => hit(p, b.x, b.y));
      if (!pc) { gesture = null; return; }
      selected = pc;
      pc.z = Math.max(...pieces.map(p => p.z)) + 1;
      pc.el.classList.add('lift');
      gesture = { pc, id: e.pointerId, gx: b.x - pc.x, gy: b.y - pc.y, twist: null };
      place(pc);
    } else if (ptrs.size === 2 && gesture) {
      const [a, c] = [...ptrs.values()];
      gesture.twist = { a0: Math.atan2(c.y - a.y, c.x - a.x), r0: gesture.pc.r, mx: (a.x + c.x) / 2, my: (a.y + c.y) / 2, x0: gesture.pc.x, y0: gesture.pc.y };
    }
  }
  function move(e) {
    const p = ptrs.get(e.pointerId); if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (!gesture) return;
    const pc = gesture.pc;
    if (ptrs.size >= 2 && gesture.twist && level === 'challenge') {
      const [a, c] = [...ptrs.values()], tw = gesture.twist;
      const ang = Math.atan2(c.y - a.y, c.x - a.x);
      pc.r = norm(tw.r0 + (ang - tw.a0) * 180 / Math.PI);
      pc.x = tw.x0 + ((a.x + c.x) / 2 - tw.mx) / view.k; pc.y = tw.y0 + ((a.y + c.y) / 2 - tw.my) / view.k;
    } else if (ptrs.size === 1 && e.pointerId === gesture.id) {
      const b = toBoard(e.clientX, e.clientY);
      pc.x = b.x - gesture.gx; pc.y = b.y - gesture.gy;
    }
    place(pc);
  }
  function up(e) {
    ptrs.delete(e.pointerId);
    if (!gesture) return;
    if (ptrs.size === 1 && gesture.twist) {   // one finger left: keep dragging with it
      const [id, q] = [...ptrs.entries()][0]; const b = toBoard(q.x, q.y);
      gesture = { pc: gesture.pc, id, gx: b.x - gesture.pc.x, gy: b.y - gesture.pc.y, twist: null };
      return;
    }
    if (ptrs.size === 0) {
      const pc = gesture.pc; gesture = null;
      pc.el.classList.remove('lift');
      checkSnap(pc);
    }
  }
  function checkSnap(pc) {
    const tol = (level === 'easy' ? 0.11 : 0.075) * P.S, tolR = level === 'easy' ? 360 : 22;
    const dist = Math.hypot(pc.x - pc.d.cx, pc.y - pc.d.cy), dr = Math.abs(norm(pc.r));
    if (dist < tol && dr < tolR) {
      const fx = pc.x, fy = pc.y, fr = pc.r;
      pc.placed = true; selected = null;
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / 260), e2 = 1 - Math.pow(1 - t, 3);
        pc.x = fx + (pc.d.cx - fx) * e2; pc.y = fy + (pc.d.cy - fy) * e2; pc.r = fr * (1 - e2);
        place(pc);
        if (t < 1) requestAnimationFrame(step);
        else { pc.x = pc.d.cx; pc.y = pc.d.cy; pc.r = 0; place(pc); pc.el.classList.add('placed', 'flash'); later(900, () => pc.el.classList.remove('flash')); count(); afterPlace(pc); }
      };
      requestAnimationFrame(step);
    } else if (dist < tol * 1.8 && level === 'challenge' && dr >= tolR) {
      say(`${pc.d.name} is close! Try turning it.`);
    }
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
    say('You built Pangaea!');
    pieces.forEach(pc => { pc.el.classList.add('flash'); });
    later(700, () => root.stripes.classList.add('on'));
    later(1500, () => {
      const L = (P.legend || []).map(([id, name, col, pat]) => `<div><i style="width:34px;height:12px;border-radius:3px;background:${col};flex:none"></i><span><b>${esc(name)}</b> (${esc(pat)})</span></div>`).join('');
      cardEl = card(`<h2>You built Pangaea!</h2>
        <p class="lead">This is about how the continents fit together ${P.T} million years ago.</p>
        <ul class="bul"><li>Pangaea means “all lands.”</li><li>The colored stripes show where four kinds of fossils are found.</li><li>Look! The stripes line up across the edges of the continents.</li>
        ${shelfOn ? '<li>With the shelves on, the continents fit together even better.</li>' : '<li>Tap <b>Shelves</b> at the bottom. The continents fit even better at the edge of their shelves!</li>'}</ul>
        <div class="legend">${L}</div>
        <div class="box evidence"><h3>${icon('check')}The evidence</h3><p>The continents fit together like puzzle pieces, and the fossils line up across them. This is evidence that the continents were once joined, and that they have moved over time.</p></div>
        <div class="actions"><button class="act primary" data-w="globe">${icon('hourglass')}<span>Watch Pangaea break apart<small>Opens the Time Machine</small></span></button>
        <button class="act" data-w="again">${icon('restart')}<span>Play again</span></button></div>`, true);
      zoomed = true; pieces.forEach(pc => pc.el.style.transition = 'transform .8s ease'); layout();
      later(900, () => pieces.forEach(pc => pc.el.style.transition = ''));
      cardEl.querySelector('[data-w="globe"]').onclick = () => { ui.exitActivity(); setTimeout(() => ui.go('time'), 300); };
      cardEl.querySelector('[data-w="again"]').onclick = () => chooseLevel();
    });
  }
  function helpCard() {
    cardEl = card(`<h2>How to play</h2><ol class="steps-list">
      <li>Drag a continent with one finger.</li>
      ${level === 'challenge' ? '<li>To turn a continent, put two fingers on it and twist. Or tap it, then tap <b>Turn left</b> or <b>Turn right</b>.</li><li>Stuck? Tap <b>Hint</b> to see the outlines for a moment.</li>' : '<li>Use the faint outlines to find where each continent goes.</li>'}
      <li>Tap <b>Shelves</b> to see the edges of the continents that are under shallow sea.</li></ol>
      <div class="actions"><button class="act primary" data-w="ok">${icon('check')}<span>Got it</span></button></div>`, true);
    cardEl.querySelector('[data-w="ok"]').onclick = () => closeCard();
  }

  // small cards inside the puzzle screen (with Read to me)
  function card(html, corner) {
    closeCard();
    const c = document.createElement('div'); c.className = 'pz-card' + (corner ? ' corner' : '');
    c.innerHTML = `<div class="card-top"><span></span><span class="card-top-r">${ui.speech.ok ? `<button class="say-btn small">${icon('volume') /* fallback icon */}<span>Read to me</span></button>` : ''}<button class="close" aria-label="Close">✕</button></span></div><div class="pz-card-body">${html}</div>`;
    root.appendChild(c);
    const sb = c.querySelector('.say-btn');
    if (sb) { sb.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg><span>Read to me</span>'; sb.onclick = () => ui.speech.read(c.querySelector('.pz-card-body'), sb); }
    c.querySelector('.close').onclick = () => closeCard();
    return c;
  }
  function closeCard() { ui.speech.stop(); if (cardEl) { cardEl.remove(); cardEl = null; } }

  function cleanup() {
    timers.forEach(clearTimeout); timers = [];
    closeCard();
    window.removeEventListener('resize', layout);
    root.hidden = true; root.innerHTML = ''; board = null; pieces = [];
    ptrs.clear(); gesture = null;
  }
  // for testing: screen spot of a piece's middle, now and when solved
  const where = (id) => { const pc = pieces.find(q => q.d.id === id); return pc && { now: [view.ox + pc.x * view.k, view.oy + pc.y * view.k], goal: [view.ox + pc.d.cx * view.k, view.oy + pc.d.cy * view.k], r: pc.r, placed: pc.placed }; };
  return { start, where };
}
