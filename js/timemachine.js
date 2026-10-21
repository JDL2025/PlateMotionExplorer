// =====================================================================
// Plate Motion Explorer — Time Machine
// Drag the timeline (or tap Play) to watch the continents move from
// 300 million years ago to today. Words are in js/data/timemachine.js.
// =====================================================================

export function init(api, ui) {
  const TM = window.TIME_MACHINE;
  if (!TM) return null;
  const THREE = api.THREE, esc = ui.esc, icon = ui.icon;
  const S = TM.stops.slice().sort((a, b) => b.age - a.age);
  const MAX = Math.max(TM.start || 300, ...S.map(s => s.age));
  const fossilSites = [];
  (window.FOSSILS ? window.FOSSILS.sets : []).forEach(s => s.sites.forEach(site => fossilSites.push({ s, site: { lat: site.lat, lon: site.lon, g: api.groupAt(site.lat, site.lon) } })));

  let on = false, bar = null, playing = false, idx = -1, gridWas = false, cancels = [], timers = [], dragging = false;
  let equator = null, fpins = [], built = false;
  const later = (ms, f) => { const id = setTimeout(f, ms); timers.push(id); return id; };
  const xOf = t => (MAX - t) / MAX;

  function start() {
    ui.closeCard();
    ui.startActivity({ id: 'time', title: 'Time Machine', bodyClass: 'time-on', noBar: true, onStop: cleanup });
    on = true; idx = -1; playing = false;
    gridWas = ui.state.grid;
    api.setGrid(true);
    api.setDim(null);
    if (api.anchor !== null) api.setTime(api.time, null);
    buildBar(); buildMarkers();
    ui.setHud('Watch the continents move over 300 million years.');
    ui.banner(`<b>Traveling back ${MAX} million years…</b>`);
    lookAtPangaea(MAX, 1800);
    travelTo(MAX, 2600, () => { ui.banner(null); intro(); });
  }
  function lookAtPangaea(t, ms) {
    const q = api.groupQuatAt(api.groupAt(5, 20), t, null);
    const v = api.latLonToLocal(5, 0).applyQuaternion(q);
    const ll = api.localToLatLon(v);
    // tilted toward the South Pole, so the fossil pictures (mostly in the south) are easy to see
    api.flyToLatLon(-45, ll.lon, api.fitDist(true) * 1.05, ms);
  }

  // ---------- moving through time ----------
  function setT(t) {
    t = Math.max(0, Math.min(MAX, t));
    api.setTime(t, null);
    updateBar(t); readout(t);
    const again = t < 0.5; if (again !== lastAgain) { lastAgain = again; updatePlayBtn(); }
  }
  let lastAgain = null;
  function travelTo(t, ms, done) {
    cancels.forEach(f => f()); cancels = [];
    const from = api.time;
    if (ms === undefined) ms = Math.max(900, Math.min(3200, Math.abs(t - from) * 22));
    cancels.push(api.tween(ms, k => setT(from + (t - from) * api.ease(k)), () => { setT(t); done && done(); }));
  }
  let playTimer = null, lastFrame = 0, holdUntil = 0;
  function play() {
    if (playing) { pause(); return; }
    ui.closeCard();
    if (api.time < 0.5) setT(MAX);
    playing = true; updatePlayBtn();
    lastFrame = performance.now(); holdUntil = 0;
    const step = (now) => {
      if (!playing) return;
      const dt = Math.min(0.25, (now - lastFrame) / 1000); lastFrame = now;
      if (now > holdUntil) {
        const t0 = api.time;
        let t = t0 - dt * 8.5;                       // about 8.5 million years every second
        const stop = S.find(s => s.age < t0 - 0.01 && s.age >= t);
        if (stop) {
          t = stop.age; holdUntil = now + 1700;
          idx = S.indexOf(stop);
          ui.banner(`<b>${stop.age === 0 ? 'Today' : stop.age + ' million years ago'}:</b> ${esc(stop.title)}`, 2600);
        }
        setT(t);
        if (t <= 0) { playing = false; updatePlayBtn(); later(700, () => openStop(S.length - 1, true)); return; }
      }
      playTimer = requestAnimationFrame(step);
    };
    playTimer = requestAnimationFrame(step);
  }
  function pause() { playing = false; if (playTimer) cancelAnimationFrame(playTimer); updatePlayBtn(); }

  // ---------- timeline bar ----------
  function buildBar() {
    if (bar) bar.remove();
    bar = document.createElement('div'); bar.className = 'tm-bar';
    bar.innerHTML = `<button class="tm-btn" data-t="exit">${icon('x')}<span>Exit</span></button>
      <button class="tm-btn play" data-t="play">${icon('play')}<span>Play</span></button>
      <div class="tm-tl"><div class="tm-scale"><span>Long ago</span><span>Today</span></div>
        <div class="tm-track"><div class="tm-line"></div><div class="tm-fill"></div>
        ${S.map((s, i) => `<button class="tm-stop" data-s="${i}" style="left:${xOf(s.age) * 100}%"><i></i><b>${esc(s.label)}</b></button>`).join('')}
        <div class="tm-thumb">${icon('hourglass')}</div></div></div>
      <button class="tm-btn info" data-t="info">${icon('info')}<span>Info</span></button>`;
    document.body.appendChild(bar);
    bar.querySelector('[data-t="exit"]').onclick = () => ui.exitActivity();
    bar.querySelector('[data-t="play"]').onclick = () => play();
    bar.querySelector('[data-t="info"]').onclick = () => (idx < 0 ? intro() : openStop(idx));
    bar.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); pause(); openStop(+b.dataset.s); }));
    // drag along the timeline
    const track = bar.querySelector('.tm-track');
    const tAt = (x) => { const r = track.getBoundingClientRect(); return MAX * (1 - Math.max(0, Math.min(1, (x - r.left) / r.width))); };
    track.addEventListener('pointerdown', e => {
      if (e.target.closest('.tm-stop')) return;
      pause(); cancels.forEach(f => f()); cancels = [];
      dragging = true; track.setPointerCapture(e.pointerId); setT(tAt(e.clientX));
    });
    track.addEventListener('pointermove', e => { if (dragging) setT(tAt(e.clientX)); });
    const end = () => {
      if (!dragging) return; dragging = false;
      const near = S.findIndex(s => Math.abs(s.age - api.time) < 3);
      if (near >= 0) { setT(S[near].age); idx = near; updateBar(api.time); }
    };
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    updateBar(api.time); updatePlayBtn();
  }
  function updatePlayBtn() {
    if (!bar) return;
    const b = bar.querySelector('[data-t="play"]');
    b.innerHTML = playing ? `${icon('pause')}<span>Pause</span>` : `${icon('play')}<span>${api.time < 0.5 ? 'Play again' : 'Play'}</span>`;
  }
  function updateBar(t) {
    if (!bar) return;
    const x = xOf(t) * 100;
    bar.querySelector('.tm-thumb').style.left = x + '%';
    bar.querySelector('.tm-fill').style.width = x + '%';
    bar.querySelectorAll('[data-s]').forEach((b, i) => b.classList.toggle('on', Math.abs(S[i].age - t) < 0.6));
  }
  function readout(t) {
    ui.hudExtra.innerHTML = `<div class="readout"><div class="r-sub">Time Machine</div><div class="r-big">${t < 0.5 ? 'Today' : `${Math.round(t)} million years ago`}</div></div>`;
  }

  // ---------- markers: fossils, equator ----------
  function buildMarkers() {
    clearMarkers();
    built = true;
    fpins = fossilSites.map(f => {
      const el = document.createElement('div'); el.className = 'fpin tiny';
      el.innerHTML = `<span class="fp-img" style="background-color:${f.s.color};background-image:url('${esc(f.s.thumb)}')"></span>`;
      document.getElementById('pins').appendChild(el);
      return { el, f };
    });
    equator = api.makeLine3(api.pathPoints([[0, -180], [0, -90], [0, 0], [0, 90], [0, 180]], 1.0045, 2), { color: '#ffd36b', width: 3, opacity: 0.85 });
    api.earth.add(equator);
    api.afterRenderHooks.add(place);
    api.requestRender();
  }
  function clearMarkers() {
    built = false;
    fpins.forEach(p => p.el.remove()); fpins = [];
    if (equator) { equator.dispose(); equator = null; }
    api.afterRenderHooks.delete(place);
  }
  function place() {
    if (!built) return;
    for (const fp of fpins) {
      const w2 = api.siteWorld(fp.f.site, 1), f2 = api.facing(w2);
      if (f2 < 0.1 || !api.siteVisible(fp.f.site)) { fp.el.style.display = 'none'; continue; }
      const p = api.project(w2);
      fp.el.style.display = '';
      fp.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
    }
  }

  // ---------- cards ----------
  function intro() {
    idx = -1; updateBar(api.time);
    const h = `<h2>${esc(TM.intro.title)}</h2><p class="lead">${esc(TM.intro.lead)}</p>
      ${ui.part.steps(TM.intro.steps)}
      <p class="note say">The yellow line is the equator. The little round pictures are the fossils from Fossil Match.</p>
      <div class="actions"><button class="act primary" data-tm="play">${icon('play')}<span>Play</span></button>
      <button class="act" data-tm="first">${icon('next')}<span>Go stop by stop</span></button></div>`;
    const c = ui.showCard(h, { badge: 'Time Machine', badgeColor: '#8cc4f0', badgeIcon: 'hourglass', id: 'tm-intro' });
    c.querySelector('[data-tm="play"]').onclick = () => play();
    c.querySelector('[data-tm="first"]').onclick = () => openStop(0);
  }
  function openStop(i, noTravel) {
    pause();
    idx = i;
    const s = S[i], next = S[i + 1], prev = S[i - 1];
    const h = `<span class="when-chip">${s.age === 0 ? 'Today' : `${s.age} million years ago`}</span>
      <h2>${esc(s.title)}</h2>
      ${s.photos && s.photos.length ? ui.part.gallery(s.photos) : (s.photo ? ui.part.gallery([s.photo]) : '')}
      ${ui.part.bullets(s.bullets)}
      <div class="ye-nav">
        ${prev ? `<button class="tour-btn" data-tn="${i - 1}">← ${esc(prev.label)}</button>` : '<span></span>'}
        ${next ? `<button class="tour-btn primary" data-tn="${i + 1}">Next: ${esc(next.label)} →</button>` : `<button class="tour-btn primary" data-tx>All done ✓</button>`}
      </div>`;
    const c = ui.showCard(h, { badge: `Time Machine · Stop ${i + 1} of ${S.length}`, badgeColor: '#8cc4f0', badgeIcon: 'hourglass', id: 'tm-' + i });
    c.querySelectorAll('[data-tn]').forEach(b => b.onclick = () => openStop(+b.dataset.tn));
    c.querySelector('[data-tx]')?.addEventListener('click', () => ui.exitActivity());
    if (!noTravel && Math.abs(api.time - s.age) > 0.3) travelTo(s.age);
    updateBar(api.time);
  }

  function cleanup() {
    on = false; pause(); dragging = false;
    timers.forEach(clearTimeout); timers = [];
    cancels.forEach(f => f()); cancels = [];
    if (bar) { bar.remove(); bar = null; }
    clearMarkers();
    api.setGrid(gridWas);
  }
  return { start, isOn: () => on };
}
