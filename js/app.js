// =====================================================================
// Plate Motion Explorer — menus, cards, photo slideshows, read-aloud,
// continent names. The globe lives in globe.js. Each activity has its own
// file (match.js, timemachine.js, puzzle.js).
// =====================================================================
import { icon } from './icons.js';
import { createSpeech } from './speech.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createUI(api) {
  const ui = { api, esc, icon, features: {} };
  const card = $('#card'), cardContent = $('#cardContent'), cardScroll = $('#cardScroll');
  const speech = createSpeech();
  ui.speech = speech;
  ui.state = { names: true, shelf: true, grid: false };
  let activity = null;

  // ---------------------------------------------------------------
  // HUD line, banner
  // ---------------------------------------------------------------
  const HUD_DEFAULT = 'Pick an activity in the menu bar below.';
  ui.setHud = (t) => { $('#hudLine').textContent = t ?? HUD_DEFAULT; };
  ui.hudExtra = $('#hudExtra');
  let bannerEl = null, bannerTimer = 0;
  ui.banner = (html, ms = 0) => {
    clearTimeout(bannerTimer);
    if (!html) { if (bannerEl) bannerEl.remove(); bannerEl = null; return; }
    if (!bannerEl) { bannerEl = document.createElement('div'); bannerEl.className = 'banner'; document.body.appendChild(bannerEl); }
    bannerEl.innerHTML = html;
    placeBanner();
    if (ms) bannerTimer = setTimeout(() => ui.banner(null), ms);
    return bannerEl;
  };
  function placeBanner() {
    if (!bannerEl) return;
    const r = card.hidden ? null : card.getBoundingClientRect();
    let L = 0, R = innerWidth;
    if (r && r.left > 40) R = r.left;
    const rd = ui.hudExtra.firstElementChild;
    if (rd) L = rd.getBoundingClientRect().right + 12;
    const hud = $('#hud').getBoundingClientRect();
    if (R - L < 320) { L = 0; bannerEl.style.top = `${Math.round((rd ? rd.getBoundingClientRect().bottom : hud.bottom) + 10)}px`; }
    else bannerEl.style.top = '';
    bannerEl.style.left = ((L + R) / 2) + 'px';
    bannerEl.style.maxWidth = Math.max(240, Math.min(560, R - L - 20)) + 'px';
  }

  // ---------------------------------------------------------------
  // Panels (Show, Help, About)
  // ---------------------------------------------------------------
  function closePanels(except) {
    $$('.panel').forEach(p => { if (p.id !== 'panel-' + except) p.hidden = true; });
    $$('.dock-btn[data-panel]').forEach(b => b.setAttribute('aria-expanded', b.dataset.panel === except && !$('#panel-' + except).hidden ? 'true' : 'false'));
    if (except !== 'help') speech.stop();
  }
  ui.closePanels = () => closePanels(null);
  function openPanel(name) {
    const p = $('#panel-' + name);
    const willOpen = p.hidden;
    closePanels(name);
    p.hidden = !willOpen;
    $$('.dock-btn[data-panel]').forEach(b => b.setAttribute('aria-expanded', String(b.dataset.panel === name && willOpen)));
    if (willOpen && innerWidth < 900) closeCard();
  }
  ui.openPanel = openPanel;
  document.addEventListener('click', e => {
    const say = e.target.closest('[data-say-target]');
    if (say) { speech.read($(say.dataset.sayTarget), say); return; }
    const b = e.target.closest('[data-panel]');
    if (b) { openPanel(b.dataset.panel); return; }
    const go = e.target.closest('[data-go]');
    if (go) { closePanels(null); try { localStorage.setItem('pme-help-seen', '1'); } catch (e2) {} ui.go(go.dataset.go); return; }
    const c = e.target.closest('[data-close]');
    if (c) { const p = c.closest('.panel'); if (p) { p.hidden = true; closePanels(null); if (p.id === 'panel-help') try { localStorage.setItem('pme-help-seen', '1'); } catch (e2) {} } }
  });
  if (!speech.ok) $$('.say-btn').forEach(b => b.hidden = true);

  // the four activities
  ui.go = (name) => {
    const F = ui.features;
    const f = name === 'fossils' ? F.fossils : name === 'rocks' ? F.rocks : name === 'time' ? F.time : name === 'puzzle' ? F.puzzle : null;
    if (!f) { ui.banner('That part is still loading. Try again in a moment.', 3000); return; }
    f.start();
  };

  // ---------------------------------------------------------------
  // Whole Earth + Show toggles
  // ---------------------------------------------------------------
  ui.backToToday = (ms = 1600) => {
    if (api.time === 0 && api.anchor === null) return;
    const from = api.time, anchor = api.anchor;
    api.tween(ms, t => api.setTime(from * (1 - api.ease(t)), anchor), () => api.setTime(0, null));
  };
  $('#homeBtn').onclick = () => {
    stopActivity(); closeCard(); closePanels(null);
    api.setDim(null); ui.backToToday(); api.home();
  };
  $$('[data-show]').forEach(inp => inp.onchange = () => ui.setShow(inp.dataset.show, inp.checked));
  ui.setShow = (what, on) => {
    ui.state[what] = on;
    const inp = $(`[data-show="${what}"]`); if (inp) inp.checked = on;
    if (what === 'shelf') api.setShelf(on);
    if (what === 'grid') api.setGrid(on);
    api.requestRender();
  };

  // ---------------------------------------------------------------
  // Continent names on the globe
  // ---------------------------------------------------------------
  const NAMES = [
    ['North America', 45, -100], ['South America', -12, -58], ['Europe', 53, 20], ['Asia', 52, 95],
    ['Africa', 6, 20], ['Australia', -25, 134], ['Antarctica', -80, 30], ['India', 21, 78], ['Greenland', 73, -40]
  ];
  const tagsEl = $('#tags');
  const tags = [];
  api.ready.then(() => {
    for (const [name, lat, lon] of NAMES) {
      const el = document.createElement('div'); el.className = 'ctag'; el.textContent = name; el.style.display = 'none';
      tagsEl.appendChild(el);
      tags.push({ el, site: { lat, lon, g: api.groupAt(lat, lon) } });
    }
    $('#loading').remove();
  }).catch(e => { console.error(e); $('#loading').textContent = 'The globe could not load. Check the internet connection and reload the page.'; });
  ui.tagsHidden = false;
  api.afterRenderHooks.add(() => {
    placeBanner();
    const show = ui.state.names && !ui.tagsHidden;
    const fsz = Math.max(12, Math.min(19, 13 + (api.fitDist() / api.cam.dist) * 4));
    for (const t of tags) {
      if (!show || !api.siteVisible(t.site)) { t.el.style.display = 'none'; continue; }
      const w = api.siteWorld(t.site, 1.0);
      const f = api.facing(w);
      if (f < 0.25) { t.el.style.display = 'none'; continue; }
      const p = api.project(w);
      t.el.style.display = '';
      t.el.style.opacity = Math.min(1, (f - 0.25) * 4).toFixed(2);
      t.el.style.fontSize = fsz.toFixed(1) + 'px';
      t.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  });

  // ---------------------------------------------------------------
  // Cards
  // ---------------------------------------------------------------
  function shiftForCard() {
    if (card.hidden) { api.setShift(0, 0); return; }
    const sheet = card.getBoundingClientRect();
    if (sheet.left < 40) api.setShift(0, Math.max(0, (innerHeight - sheet.top) / 2 - 30));
    else api.setShift((innerWidth - sheet.left + 6) / 2, 0);
  }
  ui.showCard = (html, { badge = '', badgeColor = '#e9b47c', badgeIcon = 'fossil', id = null, onClose = null } = {}) => {
    speech.stop();
    const prevClose = ui.onCardClose; ui.onCardClose = null;
    if (prevClose && !card.hidden) { try { prevClose(true); } catch (e) { console.error(e); } }
    cardContent.innerHTML = html;
    $('#cardBadge').innerHTML = badge ? `<i style="background:${badgeColor}">${icon(badgeIcon)}</i>${esc(badge)}` : '';
    $('#cardBadge').style.visibility = badge ? 'visible' : 'hidden';
    card.hidden = false;
    document.body.classList.add('card-open');
    cardScroll.scrollTop = 0;
    ui.cardId = id;
    ui.onCardClose = onClose;
    $('#tourBar').hidden = true;
    wireGalleries(cardContent);
    requestAnimationFrame(shiftForCard);
    api.requestRender();
    return cardContent;
  };
  function closeCard() {
    if (card.hidden) return;
    speech.stop();
    card.hidden = true;
    document.body.classList.remove('card-open');
    ui.cardId = null;
    const f = ui.onCardClose; ui.onCardClose = null;
    if (f) { try { f(false); } catch (e) { console.error(e); } }
    api.setShift(0, 0);
    api.requestRender();
  }
  ui.closeCard = closeCard;
  $('#cardClose').onclick = () => closeCard();
  $('#cardSay').onclick = () => speech.read(cardContent, $('#cardSay'));
  window.addEventListener('resize', () => shiftForCard());

  // ---------------------------------------------------------------
  // Card parts
  // ---------------------------------------------------------------
  ui.part = {
    bullets: a => a && a.length ? `<ul class="bul">${a.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '',
    steps: a => a && a.length ? `<ol class="steps-list">${a.map(t => `<li>${esc(t)}</li>`).join('')}</ol>` : '',
    facts: a => a && a.length ? `<div class="qfacts">${a.map(([k, v]) => `<div class="qf" data-say="${esc(k)}: ${esc(v)}"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>` : '',
    evidence: t => t ? `<div class="box evidence"><h3>${icon('check')}The evidence</h3><p>${esc(t)}</p></div>` : '',
    compare: t => t ? `<div class="box compare"><h3>${icon('ruler')}Compare it</h3><p>${esc(t)}</p></div>` : '',
    gallery(photos) {
      if (!photos || !photos.length) return '';
      const slides = photos.map((p, i) => `<div class="gal-slide" data-i="${i}"><img src="${esc(p[0])}" alt="${esc(p[1])}" loading="${i ? 'lazy' : 'eager'}" draggable="false"></div>`).join('');
      return `<figure class="gal" data-photos="${esc(JSON.stringify(photos))}">
        <div class="gal-track">${slides}</div>
        ${photos.length > 1 ? `<button class="gal-arrow prev" aria-label="Previous photo" disabled>‹</button><button class="gal-arrow next" aria-label="Next photo">›</button><span class="gal-count">1 / ${photos.length}</span>` : ''}
        <span class="gal-zoom">Tap to make it big</span>
        <figcaption><span class="gal-cap">${esc(photos[0][1])}</span><small class="gal-credit">${esc(photos[0][2] || '')}</small>
        ${photos.length > 1 ? `<div class="gal-dots">${photos.map((p, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}</figcaption>
      </figure>`;
    }
  };
  function wireGalleries(root) {
    root.querySelectorAll('.gal').forEach(g => {
      const photos = JSON.parse(g.dataset.photos);
      const track = g.querySelector('.gal-track');
      const prev = g.querySelector('.gal-arrow.prev'), next = g.querySelector('.gal-arrow.next');
      const dots = [...g.querySelectorAll('.gal-dots i')];
      let cur = 0;
      const update = () => {
        const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (i === cur) return; cur = Math.max(0, Math.min(photos.length - 1, i));
        g.querySelector('.gal-cap').textContent = photos[cur][1];
        g.querySelector('.gal-credit').textContent = photos[cur][2] || '';
        const c = g.querySelector('.gal-count'); if (c) c.textContent = `${cur + 1} / ${photos.length}`;
        dots.forEach((d, k) => d.classList.toggle('on', k === cur));
        if (prev) prev.disabled = cur === 0; if (next) next.disabled = cur === photos.length - 1;
      };
      track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
      const goTo = (i) => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
      if (prev) prev.onclick = () => goTo(Math.max(0, cur - 1));
      if (next) next.onclick = () => goTo(Math.min(photos.length - 1, cur + 1));
      track.querySelectorAll('.gal-slide').forEach(s => s.onclick = () => openLightbox(photos, +s.dataset.i));
      const zoomHint = g.querySelector('.gal-zoom'); if (zoomHint) setTimeout(() => zoomHint.remove(), 3500);
    });
  }
  ui.wireGalleries = wireGalleries;

  // big photo viewer
  const lb = $('#lightbox'), lbTrack = $('#lbTrack');
  let lbPhotos = [], lbCur = 0;
  function lbUpdate() {
    const i = Math.round(lbTrack.scrollLeft / Math.max(1, lbTrack.clientWidth));
    lbCur = Math.max(0, Math.min(lbPhotos.length - 1, i));
    const p = lbPhotos[lbCur]; if (!p) return;
    $('#lbCap').innerHTML = `${esc(p[1])}<small>${esc(p[2] || '')}</small>`;
    $('#lbPrev').disabled = lbCur === 0; $('#lbNext').disabled = lbCur === lbPhotos.length - 1;
  }
  function openLightbox(photos, i) {
    lbPhotos = photos;
    lbTrack.innerHTML = photos.map(p => `<div class="lb-slide"><img src="${esc(p[0])}" alt="${esc(p[1])}" draggable="false"></div>`).join('');
    lb.hidden = false;
    requestAnimationFrame(() => { lbTrack.scrollLeft = i * lbTrack.clientWidth; lbUpdate(); });
  }
  lbTrack.addEventListener('scroll', () => requestAnimationFrame(lbUpdate), { passive: true });
  $('#lbClose').onclick = () => { lb.hidden = true; lbTrack.innerHTML = ''; };
  $('#lbPrev').onclick = () => lbTrack.scrollTo({ left: (lbCur - 1) * lbTrack.clientWidth, behavior: 'smooth' });
  $('#lbNext').onclick = () => lbTrack.scrollTo({ left: (lbCur + 1) * lbTrack.clientWidth, behavior: 'smooth' });

  // ---------------------------------------------------------------
  // Activities take over the bottom bar
  // ---------------------------------------------------------------
  let actBar = null;
  ui.startActivity = ({ id, title, buttons = [], extra = '', onStop, bodyClass = 'activity-on', noBar = false }) => {
    stopActivity();
    closePanels(null);
    activity = { id, onStop, bodyClass };
    document.body.classList.add(bodyClass);
    if (!noBar) {
      actBar = document.createElement('div'); actBar.className = 'activitybar';
      actBar.innerHTML = `<button class="dock-btn" data-a="exit">${icon('x')}<span>Exit</span></button><span class="a-title">${esc(title)}</span>${extra}` +
        buttons.map((b, i) => `<button class="dock-btn" data-a="${i}">${icon(b.icon)}<span>${esc(b.label)}</span></button>`).join('');
      actBar.querySelector('[data-a="exit"]').onclick = () => ui.exitActivity();
      buttons.forEach((b, i) => { actBar.querySelector(`[data-a="${i}"]`).onclick = b.onClick; });
      document.body.appendChild(actBar);
    }
    ui.actBar = actBar;
    return activity;
  };
  function stopActivity() {
    if (!activity) return;
    const a = activity; activity = null;
    document.body.classList.remove(a.bodyClass);
    if (actBar) { actBar.remove(); actBar = null; ui.actBar = null; }
    ui.hudExtra.innerHTML = '';
    ui.banner(null);
    speech.stop();
    try { a.onStop && a.onStop(); } catch (e) { console.error(e); }
    ui.setHud();
    api.requestRender();
  }
  ui.stopActivity = stopActivity;
  ui.exitActivity = () => { stopActivity(); closeCard(); api.setDim(null); ui.backToToday(); api.home(); };
  ui.activity = () => activity;

  // ---------------------------------------------------------------
  // A burst of light at a spot on the screen
  // ---------------------------------------------------------------
  ui.burst = (x, y, green = true) => {
    const b = document.createElement('div'); b.className = 'pop-burst';
    b.style.transform = `translate(${x}px, ${y}px)`;
    let h = `<div class="ring ${green ? 'green' : ''}"></div><div class="ring r2 ${green ? 'green' : ''}"></div>`;
    for (let i = 0; i < 12; i++) h += `<div class="spark" style="--a:${i * 30}deg;--d:${70 + (i % 3) * 22}px"></div>`;
    b.innerHTML = h; document.body.appendChild(b);
    setTimeout(() => b.remove(), 1600);
  };

  // ---------------------------------------------------------------
  // Full-screen celebration: confetti and fireworks
  // ---------------------------------------------------------------
  ui.celebrate = (title, sub = 'Great detective work!') => {
    const cv = document.createElement('canvas'); cv.className = 'celebrate';
    const msg = document.createElement('div'); msg.className = 'celebrate-msg';
    msg.innerHTML = `<b>${esc(title)}</b><span>${esc(sub)}</span>`;
    document.body.append(cv, msg);
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    const COLORS = ['#e9b47c', '#7fe0a0', '#8cc4f0', '#ffd84d', '#ff8f7a', '#c39bff', '#ffffff'];
    const R = (a, b) => a + Math.random() * (b - a);
    const conf = [];
    const n = Math.round(Math.min(260, W * H / 4500));
    for (let i = 0; i < n; i++) conf.push({ x: R(0, W), y: R(-H * 0.9, -10), vx: R(-50, 50), vy: R(140, 280), r: R(0, 6.28), vr: R(-7, 7), w: R(6, 11), h: R(10, 17), c: COLORS[i % COLORS.length], ph: R(0, 6.28) });
    const sparks = [];
    const bursts = [0.15, 0.6, 1.0, 1.45, 1.9, 2.4, 2.9].map(t => ({ t, x: R(W * 0.15, W * 0.85), y: R(H * 0.12, H * 0.5), c: COLORS[Math.floor(R(0, COLORS.length))], done: false }));
    const t0 = performance.now(); let last = t0;
    const DUR = 5.4;
    const step = (now) => {
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);
      const fade = t > DUR - 0.9 ? Math.max(0, (DUR - t) / 0.9) : 1;
      // fireworks
      for (const b of bursts) if (!b.done && t >= b.t) {
        b.done = true;
        for (let i = 0; i < 70; i++) { const a = R(0, 6.28), sp = R(120, 400); sparks.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: R(1.0, 1.7), age: 0, c: Math.random() < 0.25 ? '#ffffff' : b.c }); }
      }
      ctx.globalCompositeOperation = 'lighter';
      for (const p of sparks) {
        p.age += dt; if (p.age > p.life) continue;
        p.vx *= 0.985; p.vy = p.vy * 0.985 + 160 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const a = (1 - p.age / p.life) * fade;
        ctx.globalAlpha = a; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 6.283); ctx.fill();
        ctx.globalAlpha = a * 0.25; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      // confetti
      for (const p of conf) {
        p.ph += dt * 3; p.x += (p.vx + Math.sin(p.ph) * 40) * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        if (p.y > H + 20 && t < DUR - 1.6) { p.y = R(-60, -10); p.x = R(0, W); }
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.scale(1, Math.abs(Math.cos(p.ph)) * 0.8 + 0.2);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (t < DUR) requestAnimationFrame(step); else { cv.remove(); }
    };
    requestAnimationFrame(step);
    setTimeout(() => msg.remove(), 3600);
  };

  // ---------------------------------------------------------------
  // About + first-time help
  // ---------------------------------------------------------------
  $('#aboutBody').innerHTML = `
    <p><b>Plate Motion Explorer</b> is an independent classroom project. It was not made by or endorsed by any museum, university, or agency.</p>
    <p><b>How the continents move:</b> the positions of the continents for the last 300 million years come from a real plate-motion model made by scientists: Müller and others (2022), EarthByte Group, University of Sydney (from the GPlates plate model collection, CC BY 4.0). It is a model, so scientists are still improving it.</p>
    <p><b>Picture of Earth:</b> NASA Blue Marble (NASA Earth Observatory, public domain). Coastlines: Natural Earth (public domain).</p>
    <p><b>Photos and artwork:</b> collected from museums, fossil collectors, artists, and photo websites. The website each picture came from is listed under it.</p>
    <p><b>3D engine:</b> Three.js (MIT license). <b>Fonts:</b> Atkinson Hyperlegible and Big Shoulders Display (SIL Open Font License).</p>`;
  if ('requestFullscreen' in document.documentElement && !navigator.standalone) {
    $('#fullscreenBtn').hidden = false;
    $('#fullscreenBtn').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };
  }
  let seen = false; try { seen = localStorage.getItem('pme-help-seen') === '1'; } catch (e) {}
  if (!seen && !/[?&]nohelp/.test(location.search)) setTimeout(() => openPanel('help'), 700);
  return ui;
}
