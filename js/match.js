// =====================================================================
// Plate Motion Explorer — Fossil Match and Rock Match
// Tap matching fossils (or rocks) on different continents. When every
// place is found, the continents slide back to where they were when the
// fossil lived, and a card with photos opens.
// The words, places and photos are in js/data/fossils.js and js/data/rocks.js.
// =====================================================================

export function createMatch(api, ui, DATA, opt) {
  const THREE = api.THREE, esc = ui.esc, icon = ui.icon;
  const sets = DATA.sets || [];
  const noun = opt.noun;                     // 'fossil' or 'rock'
  const anchor = api.groupAt(-28, 24);       // Africa stays still while the others move
  const plates = api.plates;

  // find which continent piece each place sits on
  sets.forEach(s => {
    s.sites.forEach(site => { site.g = api.groupAt(site.lat, site.lon); });
    const codes = new Set(s.sites.map(site => plates.cont[site.g]).filter(Boolean));
    if (codes.has('AF')) { codes.add('AR'); codes.add('MG'); }
    s.codes = codes;
  });
  const involved = (si, gi) => sets[si].codes.has(plates.cont[gi]);

  let on = false, sel = -1, busy = false, finaleShown = false;
  const found = sets.map(() => []);          // places found so far (in tap order)
  const done = new Set();
  let pins = [], gStems = null, arcs = [], lines = [], timers = [], cancels = [];
  const later = (ms, f) => { const id = setTimeout(f, ms); timers.push(id); return id; };

  // ---------------------------------------------------------------
  function start() {
    if (on) { ui.closeCard(); intro(); return; }
    ui.closeCard();
    ui.startActivity({
      id: opt.id, title: opt.title,
      extra: `<span class="match-progress" id="mp-${opt.id}"><b>0</b>&nbsp;of ${sets.length} matched</span>`,
      buttons: [{ label: 'Help', icon: 'question', onClick: () => intro() }],
      onStop: cleanup
    });
    on = true; busy = false;
    api.setTime(0, null); api.setDim(null);
    api.home(1000);
    buildPins(); buildLines();
    updateProgress();
    ui.setHud(`Tap a ${noun} picture, then find its match on another continent.`);
    intro();
  }

  function intro() {
    const I = DATA.intro || {};
    const list = sets.map(s => `<div><img src="${esc(s.thumb)}" alt="" onerror="this.style.visibility='hidden'"><span><b>${esc(s.name)}</b>: found in ${s.sites.length} places${done.has(sets.indexOf(s)) ? ' ✓' : ''}</span></div>`).join('');
    const h = `<h2>${esc(I.title || opt.title)}</h2><p class="lead">${esc(I.lead || '')}</p>
      ${ui.part.steps(I.steps)}
      <h3 class="sec">What to find</h3><div class="legend">${list}</div>
      <div class="actions"><button class="act primary" data-m="go">${icon('match')}<span>Start matching</span></button></div>`;
    const c = ui.showCard(h, { badge: opt.title, badgeColor: '#e9b47c', badgeIcon: opt.badgeIcon, id: opt.id + '-intro' });
    c.querySelector('[data-m="go"]').onclick = () => ui.closeCard();
  }

  // ---------------------------------------------------------------
  // Pins (round pictures on the globe)
  // ---------------------------------------------------------------
  function buildPins() {
    clearPins();
    const holder = document.getElementById('pins');
    gStems = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    document.getElementById('stems').appendChild(gStems);
    sets.forEach((s, si) => s.sites.forEach((site, k) => {
      const el = document.createElement('button');
      el.className = 'fpin'; el.setAttribute('aria-label', `${s.name}, ${site.place}`);
      el.innerHTML = `<span class="fp-img" style="background-color:${s.color};background-image:url('${esc(s.thumb)}')"></span><span class="fp-lab">${esc(site.place)}</span>`;
      el.onclick = (e) => { e.stopPropagation(); tapPin(si, k); };
      el.style.display = 'none';
      holder.appendChild(el);
      pins.push({ el, si, k, site, x: 0, y: 0 });
    }));
    api.afterRenderHooks.add(placePins);
    api.requestRender();
  }
  function clearPins() {
    pins.forEach(p => p.el.remove()); pins = [];
    if (gStems) { gStems.remove(); gStems = null; }
    api.afterRenderHooks.delete(placePins);
  }
  function placePins() {
    if (!gStems) return;
    let svg = '';
    const placed = [];
    const zoomK = Math.max(0.55, Math.min(1, api.fitDist() / api.cam.dist + 0.1));
    const globePx = (api.H / 2) / (Math.tan(17.5 * Math.PI / 180) * Math.sqrt(Math.max(1e-3, api.cam.dist * api.cam.dist - 1)));
    const small = globePx < 240;
    const sk = small ? 0.62 : 1, gapX = small ? 44 : 66, gapY = small ? 46 : 80;
    for (const p of pins) {
      const w = api.siteWorld(p.site, 1.0);
      const f = api.facing(w);
      if (f < 0.06 || !api.siteVisible(p.site) || p.el.dataset.hide === '1') { p.el.style.display = 'none'; continue; }
      const sp = api.project(w);
      p.el.classList.toggle('small', small);
      let x = sp.x + p.site.dx * zoomK * sk, y = sp.y + p.site.dy * zoomK * sk;
      // keep pins from covering each other
      for (let n = 0; n < 6; n++) {
        const hit = placed.find(q => Math.abs(q.x - x) < gapX && Math.abs(q.y - y) < gapY);
        if (!hit) break;
        y += (y >= hit.y ? 1 : -1) * gapY * 0.45; x += (x >= hit.x ? 1 : -1) * gapX * 0.5;
      }
      placed.push({ x, y });
      p.el.style.display = '';
      p.el.style.opacity = f < 0.2 ? ((f - 0.06) / 0.14).toFixed(2) : '';
      p.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, ${small ? -20 : -29}px)`;
      const cls = p.el.classList.contains('sel') ? ' class="sel"' : '';
      if (!p.el.classList.contains('faded')) svg += `<line${cls} x1="${sp.x.toFixed(1)}" y1="${sp.y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/><circle${cls} cx="${sp.x.toFixed(1)}" cy="${sp.y.toFixed(1)}" r="4"/>`;
    }
    gStems.innerHTML = svg;
  }
  function pinClasses() {
    for (const p of pins) {
      const isDone = done.has(p.si), isFound = found[p.si].includes(p.k);
      p.el.classList.toggle('done', isDone);
      p.el.classList.toggle('found', !isDone && isFound && p.si === sel);
      p.el.classList.toggle('sel', !isDone && p.si === sel && found[p.si][found[p.si].length - 1] === p.k);
    }
    api.requestRender();
  }

  // ---------------------------------------------------------------
  // Mountain lines and rock circles (Rock Match)
  // ---------------------------------------------------------------
  function buildLines() {
    clearLines();
    sets.forEach(s => {
      (s.lines || []).forEach(pl => {
        const mid = pl[Math.floor(pl.length / 2)];
        const g = api.groupAt(mid[0], mid[1]);
        const m = api.makeLine3(api.pathPoints(pl, 1.0035, 0.8), { color: s.lineColor || '#e0a35c', width: 6, opacity: 0.95 });
        if (m && plates.holders[g]) { plates.holders[g].add(m); lines.push(m); }
      });
      (s.loops || []).forEach(L => {
        const g = api.groupAt(L.lat, L.lon), pts = [];
        const c = api.latLonToLocal(L.lat, L.lon), up = new THREE.Vector3(0, 1, 0);
        const e1 = new THREE.Vector3().crossVectors(up, c).normalize(), e2 = new THREE.Vector3().crossVectors(c, e1).normalize();
        const r = L.r * Math.PI / 180;
        for (let i = 0; i <= 64; i++) {
          const a = i / 64 * Math.PI * 2;
          pts.push(c.clone().multiplyScalar(Math.cos(r)).add(e1.clone().multiplyScalar(Math.sin(r) * Math.cos(a))).add(e2.clone().multiplyScalar(Math.sin(r) * Math.sin(a))).multiplyScalar(1.0035));
        }
        const m = api.makeLine3(pts, { color: s.lineColor || '#c39bff', width: 5, opacity: 0.95 });
        if (m && plates.holders[g]) { plates.holders[g].add(m); lines.push(m); }
      });
    });
    api.requestRender();
  }
  function clearLines() { lines.forEach(m => m.dispose()); lines = []; }

  // glowing arcs between the places you found
  function updateArcs() {
    arcs.forEach(m => m.dispose()); arcs = [];
    if (sel < 0) return;
    const f = found[sel];
    for (let i = 1; i < f.length; i++) {
      const a = api.siteLocal(sets[sel].sites[f[i - 1]]), b = api.siteLocal(sets[sel].sites[f[i]]);
      if (a.angleTo(b) < 0.004) continue;
      const m = api.makeLine3(api.arcPoints(a, b, 0.07), { color: '#ffd59e', width: 4, opacity: 0.95, dash: 22 });
      if (m) { api.earth.add(m); arcs.push(m); }
    }
    api.keepAnimating('arcs-' + opt.id, arcs.length > 0);
    api.requestRender();
  }
  const timeHook = () => { if (on && sel >= 0 && arcs.length) updateArcs(); };
  api.timeHooks.add(timeHook);

  function updateProgress() {
    const el = document.getElementById('mp-' + opt.id);
    if (el) el.innerHTML = `<b>${done.size}</b>&nbsp;of ${sets.length} matched`;
  }

  // ---------------------------------------------------------------
  // Tapping
  // ---------------------------------------------------------------
  function tapPin(si, k) {
    if (busy) return;
    const s = sets[si];
    if (sel < 0) {
      if (done.has(si)) { openCard(si); return; }
      ui.closeCard();
      sel = si; found[si] = [k];
      const left = s.sites.length - 1;
      ui.banner(`You found <b>${esc(s.name)}</b> in ${esc(s.sites[k].place)}!<small>Now find ${left === 1 ? 'the other' : `the other ${left}`} ${esc(s.name)} ${left === 1 ? 'place' : 'places'}. Spin the globe to look.</small>`);
      pinClasses(); updateArcs();
      return;
    }
    const cur = sets[sel];
    if (si === sel) {
      if (found[si].includes(k)) {
        if (found[si].length === 1) { sel = -1; found[si] = []; ui.banner(null); pinClasses(); updateArcs(); }
        else ui.banner(`You already found this one. Find ${cur.sites.length - found[si].length} more ${esc(cur.name)}!`, 3500);
        return;
      }
      found[si].push(k);
      pinClasses(); updateArcs();
      if (found[si].length === cur.sites.length) { complete(si); return; }
      const left = cur.sites.length - found[si].length;
      ui.banner(`Yes! That is ${esc(cur.name)} too. <b>${found[si].length} of ${cur.sites.length}</b> found.<small>Find ${left} more!</small>`);
      return;
    }
    // a different fossil or rock
    const p = pins.find(q => q.si === si && q.k === k);
    if (p) { p.el.classList.remove('wrong'); void p.el.offsetWidth; p.el.classList.add('wrong'); later(600, () => p.el.classList.remove('wrong')); }
    if (done.has(si)) ui.banner(`You already matched ${esc(s.name)}. Keep looking for another <b>${esc(cur.name)}</b>!`, 4000);
    else ui.banner(`Oops! That is <b>${esc(s.name)}</b>, not ${esc(cur.name)}.<small>Keep looking for another ${esc(cur.name)}. To pick a different ${noun}, tap the glowing one again.</small>`, 6000);
  }

  // ---------------------------------------------------------------
  // All places found: move the continents back in time
  // ---------------------------------------------------------------
  function readout(t, label) {
    ui.hudExtra.innerHTML = `<div class="readout"><div class="r-sub">${esc(label)}</div><div class="r-big">${t < 0.5 ? 'Today' : `${Math.round(t)} million years ago`}</div></div>`;
  }
  function lookAtSets(siList, T) {
    const fin = new THREE.Vector3(), st = new THREE.Vector3(), q = new THREE.Quaternion();
    for (const si of siList) for (const site of sets[si].sites) {
      fin.add(api.latLonToLocal(site.lat, site.lon).applyQuaternion(api.groupQuatAt(site.g, T, anchor, q)));
      st.add(api.siteLocal(site));
    }
    fin.normalize(); st.normalize();
    return fin.multiplyScalar(2).add(st).normalize();
  }
  function animateTo(siList, T, ms, label, done2) {
    const from = api.anchor === anchor ? api.time : 0;
    if (api.anchor !== anchor) api.setTime(0, anchor);
    readout(from, label);
    cancels.push(api.tween(ms, t => {
      const v = from + (T - from) * api.ease(t);
      api.setTime(v, anchor); readout(v, label);
    }, done2));
  }
  function complete(si) {
    busy = true; sel = si;
    const s = sets[si];
    ui.banner(`<b>It’s a match!</b> You found every ${esc(s.name)}.<small>Now watch the continents move back in time…</small>`);
    api.flyToLocal(lookAtSets([si], s.age), api.fitDist(true) * 1.02, 1300);
    cancels.push(api.setDim(gi => involved(si, gi) ? 0 : 0.85, 1000));
    pins.forEach(p => p.el.classList.toggle('faded', p.si !== si));
    later(1400, () => {
      animateTo([si], s.age, 5200, 'Going back in time', () => {
        // they fit together!
        arcs.forEach(m => m.dispose()); arcs = []; api.keepAnimating('arcs-' + opt.id, false);
        done.add(si); sel = -1; found[si] = [];
        pinClasses(); updateProgress();
        const pts = s.sites.map(site => api.project(api.siteWorld(site, 1)));
        const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
        ui.burst(cx, cy, true);
        ui.banner(`<b>They fit together!</b><small>This is where the continents were about ${s.age} million years ago.</small>`);
        later(1500, () => { busy = false; openCard(si, true); });
      });
    });
  }

  // put the continents back where they are today
  function backToToday(after) {
    busy = true;
    ui.banner(null);
    const from = api.anchor === anchor ? api.time : 0;
    cancels.push(api.setDim(null, 900));
    pins.forEach(p => p.el.classList.remove('faded'));
    if (from < 0.5) { api.setTime(0, null); ui.hudExtra.innerHTML = ''; busy = false; after && after(); return; }
    cancels.push(api.tween(2400, t => {
      const v = from * (1 - api.ease(t));
      api.setTime(v, anchor); readout(v, 'Coming back to today');
    }, () => {
      api.setTime(0, null); ui.hudExtra.innerHTML = ''; busy = false;
      after && after();
    }));
  }

  // ---------------------------------------------------------------
  // Cards
  // ---------------------------------------------------------------
  function openCard(si, afterMatch) {
    const s = sets[si];
    const facts = s.facts || [['Lived', s.lived], ['Size', s.size], ['Found in', s.found]];
    const h = `<h2>${esc(s.name)}</h2><p class="short">${esc(s.short)}</p>
      ${s.photos && s.photos.length ? ui.part.gallery(s.photos) : ''}
      ${ui.part.facts(facts.filter(f => f[1]))}
      ${ui.part.bullets(s.bullets)}
      ${ui.part.compare(s.compare)}
      ${ui.part.evidence(s.evidence)}
      <div class="actions">
        <button class="act" data-m="replay">${icon('restart')}<span>Watch the continents move again</span></button>
        <button class="act primary" data-m="back">${icon('globe')}<span>${afterMatch ? 'Back to today, find the next match' : 'Close'}</span></button>
      </div>`;
    const c = ui.showCard(h, { badge: `${opt.title} ✓`, badgeColor: s.color, badgeIcon: opt.badgeIcon, id: s.id,
      onClose: (replaced) => { if (!on) return; if (!replaced) backToToday(checkFinale); else if (api.time > 0.5) backToToday(); } });
    c.querySelector('[data-m="back"]').onclick = () => ui.closeCard();
    c.querySelector('[data-m="replay"]').onclick = () => replay(si);
  }
  function replay(si) {
    const s = sets[si];
    ui.onCardClose = null; ui.closeCard();
    const go = () => {
      busy = true;
      pins.forEach(p => p.el.classList.toggle('faded', p.si !== si));
      api.flyToLocal(lookAtSets([si], s.age), api.fitDist(true) * 1.02, 1000);
      cancels.push(api.setDim(gi => involved(si, gi) ? 0 : 0.85, 800));
      later(1000, () => animateTo([si], s.age, 5200, 'Going back in time', () => {
        ui.banner(`<b>They fit together!</b><small>About ${s.age} million years ago.</small>`, 3000);
        later(1200, () => { busy = false; openCard(si, true); });
      }));
    };
    if (api.time > 0.5) backToToday(go); else go();
  }

  function checkFinale() {
    if (done.size === sets.length && !finaleShown) { finaleShown = true; later(400, finalePrompt); }
    else if (done.size < sets.length) ui.banner(`<b>${done.size} of ${sets.length}</b> matched. Tap another ${noun} to find the next match!`, 5000);
  }
  function finalePrompt() {
    const F = DATA.finale || {};
    const h = `<h2>You matched them all!</h2><p class="lead">Great detective work. You found every ${noun} match.</p>
      <div class="actions"><button class="act primary" data-m="all">${icon('globe')}<span>${noun === 'fossil' ? 'See all the fossils together' : 'See all the rocks together'}<small>The continents move back to how they were joined</small></span></button></div>`;
    const c = ui.showCard(h, { badge: opt.title, badgeColor: '#7fe0a0', badgeIcon: 'check', id: opt.id + '-done' });
    c.querySelector('[data-m="all"]').onclick = () => showAll();
    void F;
  }
  function showAll() {
    const F = DATA.finale || { title: 'All the Rock Evidence', age: 250, lead: 'Here are all the matching rocks, with the continents joined together.', bullets: [], evidence: '' };
    const all = sets.map((s, i) => i);
    ui.onCardClose = null; ui.closeCard();
    busy = true;
    pins.forEach(p => p.el.classList.remove('faded'));
    api.flyToLocal(lookAtSets(all, F.age), api.fitDist(true) * 1.0, 1200);
    cancels.push(api.setDim(gi => all.some(si => involved(si, gi)) ? 0 : 0.85, 900));
    later(1200, () => animateTo(all, F.age, 5200, 'Going back in time', () => {
      busy = false;
      const legend = sets.map(s => `<div><img src="${esc(s.thumb)}" alt="" onerror="this.style.visibility='hidden'"><span><b>${esc(s.name)}</b>: ${esc(s.found || (s.facts && s.facts[1] && s.facts[1][1]) || '')}</span></div>`).join('');
      const h = `<h2>${esc(F.title)}</h2><p class="lead">${esc(F.lead)}</p><div class="legend">${legend}</div>
        ${ui.part.bullets(F.bullets)}${ui.part.evidence(F.evidence)}
        <div class="actions"><button class="act primary" data-m="back">${icon('globe')}<span>Back to today</span></button></div>`;
      const c = ui.showCard(h, { badge: opt.title, badgeColor: '#7fe0a0', badgeIcon: 'check', id: opt.id + '-all', onClose: (replaced) => { if (on && !replaced) backToToday(); } });
      c.querySelector('[data-m="back"]').onclick = () => ui.closeCard();
    }));
  }

  // ---------------------------------------------------------------
  function cleanup() {
    on = false; busy = false; sel = -1;
    timers.forEach(clearTimeout); timers = [];
    cancels.forEach(f => { try { f(); } catch (e) {} }); cancels = [];
    arcs.forEach(m => m.dispose()); arcs = [];
    api.keepAnimating('arcs-' + opt.id, false);
    clearPins(); clearLines();
    found.forEach((f, i) => { found[i] = []; });
    ui.hudExtra.innerHTML = '';
  }

  return { start, stop: () => ui.exitActivity(), sets, done, openCard, isOn: () => on };
}
