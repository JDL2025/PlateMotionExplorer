// =====================================================================
// Plate Motion Explorer — the 3D globe (Three.js)
// Draws the ocean and the continents. Every continent piece can be turned
// to where it was at any time in the last 300 million years, using a real
// plate-motion model made by scientists (Müller et al. 2022, EarthByte).
// Also handles spinning and zooming with your fingers.
// =====================================================================
import * as THREE from '../lib/three.module.min.js';
import { CONT_VERT, CONT_FRAG, OCEAN_VERT, OCEAN_FRAG, ATMO_VERT, ATMO_FRAG,
         DOTS_VERT, DOTS_FRAG, LINE3_VERT, LINE3_FRAG } from './glsl.js';

export { THREE };
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;

export function createGlobe(container) {
  const api = { THREE, ease, clamp, lerp };
  let dirty = true;
  api.requestRender = () => { dirty = true; };

  // ---------- renderer ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x04060a, 1);
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 200);
  const FOV_T = Math.tan(THREE.MathUtils.degToRad(35 / 2));
  api.renderer = renderer; api.scene = scene; api.camera = camera;

  const pivot = new THREE.Group();   // turned by your finger
  const earth = new THREE.Group();   // the planet (north pole = +Y)
  scene.add(pivot); pivot.add(earth);
  api.pivot = pivot; api.earth = earth;

  // ---------- coordinates ----------
  api.latLonToLocal = (lat, lon, r = 1) => {
    const la = lat * D2R, lo = lon * D2R;
    return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
  };
  api.localToLatLon = v => {
    const n = v.clone().normalize();
    return { lat: Math.asin(clamp(n.y, -1, 1)) / D2R, lon: Math.atan2(-n.z, n.x) / D2R };
  };

  // ---------- ocean, glow, stars ----------
  const oceanU = { uGrid: { value: 0 } };
  const ocean = new THREE.Mesh(new THREE.SphereGeometry(0.999, 128, 96),
    new THREE.ShaderMaterial({ vertexShader: OCEAN_VERT, fragmentShader: OCEAN_FRAG, uniforms: oceanU }));
  ocean.renderOrder = 0;
  earth.add(ocean);
  api.ocean = ocean;
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.035, 64, 48), new THREE.ShaderMaterial({
    vertexShader: ATMO_VERT, fragmentShader: ATMO_FRAG, side: THREE.BackSide, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, uniforms: { uStrength: { value: 1.1 }, uColor: { value: new THREE.Color(0.35, 0.62, 1.0) } }
  }));
  scene.add(atmo);
  function makeDots(pos, col, size, alpha, { soft = 1, additive = false, depthTest = true } = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    g.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: DOTS_VERT, fragmentShader: DOTS_FRAG, transparent: true, depthWrite: false, depthTest,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uScale: { value: renderer.getPixelRatio() }, uOpacity: { value: 1 }, uSoft: { value: soft } }
    });
    const p = new THREE.Points(g, m); p.frustumCulled = false;
    return p;
  }
  api.makeDots = makeDots;
  {
    const n = 1400, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n), al = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      pos.set([60 * s * Math.cos(th), 60 * u, 60 * s * Math.sin(th)], i * 3);
      const w = 0.7 + Math.random() * 0.3; col.set([w, w, Math.min(1, w + 0.08)], i * 3);
      size[i] = Math.random() < 0.08 ? 2.6 : 1.3 + Math.random() * 0.8; al[i] = 0.35 + Math.random() * 0.55;
    }
    pivot.add(makeDots(pos, col, size, al, { soft: 0 }));
  }

  // ---------- continents ----------
  const plates = { G: 0, T: 0, cont: [], maxAge: [], q: null, holders: [], mats: [], dim: null, dimT: null, alpha: null };
  api.plates = plates;
  const contU = {
    uIds: { value: null }, uMap: { value: null },
    uShelf: { value: new THREE.Color(0.21, 0.43, 0.61) }, uShelfOn: { value: 1 }
  };
  api.contUniforms = contU;
  const loader = new THREE.TextureLoader();
  let idsImage = null;
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qc = new THREE.Quaternion();

  function geometryFor(cells) {
    const n = cells.length;
    const pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const c = cells[i], r = Math.floor(c / 360), k = c % 360;
      const lat0 = 90 - r, lat1 = 89 - r, lon0 = -180 + k, lon1 = lon0 + 1;
      const corners = [[lat0, lon0], [lat0, lon1], [lat1, lon0], [lat1, lon1]];
      corners.forEach(([la, lo], j) => {
        v.copy(api.latLonToLocal(la, lo));
        pos.set([v.x, v.y, v.z], (i * 4 + j) * 3);
        uv.set([(lo + 180) / 360, (90 - la) / 180], (i * 4 + j) * 2);
      });
      const b = i * 4; idx.set([b, b + 2, b + 1, b + 1, b + 2, b + 3], i * 6);
    }
    const g = new THREE.BufferGeometry();
    const pa = new THREE.BufferAttribute(pos, 3);
    g.setAttribute('position', pa); g.setAttribute('normal', pa);
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    return g;
  }

  api.ready = (async () => {
    const [meta, rotBuf, cellBuf] = await Promise.all([
      fetch('data/plates.json').then(r => r.json()),
      fetch('data/rot.bin').then(r => r.arrayBuffer()),
      fetch('data/cells.bin').then(r => r.arrayBuffer())
    ]);
    const G = meta.G, T = meta.T;
    plates.G = G; plates.T = T; plates.cont = meta.cont; plates.maxAge = meta.maxAge; plates.pids = meta.pids;
    // rotations: Int16 (w,x,y,z) in the scientists' axes -> Three.js axes (x, y=z, z=-y)
    const raw = new Int16Array(rotBuf), q = new Float32Array(G * T * 4);
    for (let i = 0; i < G * T; i++) {
      const w = raw[i * 4] / 32767, x = raw[i * 4 + 1] / 32767, y = raw[i * 4 + 2] / 32767, z = raw[i * 4 + 3] / 32767;
      const l = Math.hypot(w, x, y, z) || 1;
      q[i * 4] = x / l; q[i * 4 + 1] = z / l; q[i * 4 + 2] = -y / l; q[i * 4 + 3] = w / l;
    }
    plates.q = q;
    plates.dim = new Float32Array(G); plates.dimT = new Float32Array(G); plates.alpha = new Float32Array(G).fill(1);
    const cells = new Uint16Array(cellBuf);
    // textures
    const ids = await new Promise((res, rej) => loader.load('data/continents.png', res, undefined, rej));
    ids.flipY = false; ids.generateMipmaps = false;
    ids.minFilter = THREE.NearestFilter; ids.magFilter = THREE.NearestFilter;
    ids.colorSpace = THREE.NoColorSpace; ids.format = THREE.RGFormat; ids.internalFormat = 'RG8';
    ids.needsUpdate = true;
    contU.uIds.value = ids; idsImage = ids.image;
    const small = await new Promise((res, rej) => loader.load('assets/textures/earth-day-small.jpg', res, undefined, rej));
    small.anisotropy = 4; small.flipY = false; small.colorSpace = THREE.NoColorSpace; contU.uMap.value = small;
    loader.load('assets/textures/earth-day.jpg', big => { big.anisotropy = 8; big.flipY = false; big.colorSpace = THREE.NoColorSpace; contU.uMap.value = big; api.requestRender(); });
    // one holder (turnable piece) per continent piece
    for (let gi = 0; gi < G; gi++) {
      const holder = new THREE.Group();
      const geo = geometryFor(cells.subarray(meta.cellOff[gi], meta.cellOff[gi + 1]));
      const mk = (pass) => {
        const m = new THREE.ShaderMaterial({
          vertexShader: CONT_VERT, fragmentShader: CONT_FRAG, transparent: true, depthWrite: false,
          uniforms: { ...contU, uGid: { value: gi + 1 }, uDim: { value: 0 }, uAlpha: { value: 1 }, uPass: { value: pass },
                      uHi: { value: 0 }, uLift: { value: pass ? 1.0012 : 1.0004 } }
        });
        const mesh = new THREE.Mesh(geo, m); mesh.renderOrder = pass ? 2 : 1;
        return mesh;
      };
      const isIsland = meta.cont[gi] === 'ISL';
      const shelf = mk(0), land = mk(1);
      if (!isIsland) holder.add(shelf);
      holder.add(land);
      holder.userData = { gi, shelf, land };
      earth.add(holder);
      plates.holders.push(holder);
      plates.mats.push([shelf.material, land.material]);
    }
    api.setTime(0, null);
    api.requestRender();
    return api;
  })();

  // ---------- time ----------
  // Turn every continent piece to where it was `t` million years ago.
  // anchor = a piece index to hold still (for example Africa), or null for the real positions.
  api.time = 0; api.anchor = null;
  api.groupQuatAt = (gi, t, anchor, out = new THREE.Quaternion()) => {
    const T = plates.T, q = plates.q;
    t = clamp(t, 0, T - 1);
    const i0 = Math.floor(t), i1 = Math.min(T - 1, i0 + 1), f = t - i0;
    const o0 = (gi * T + i0) * 4, o1 = (gi * T + i1) * 4;
    qa.set(q[o0], q[o0 + 1], q[o0 + 2], q[o0 + 3]); qb.set(q[o1], q[o1 + 1], q[o1 + 2], q[o1 + 3]);
    out.copy(qa).slerp(qb, f);
    if (anchor !== null && anchor !== undefined && anchor >= 0) {
      const a0 = (anchor * T + i0) * 4, a1 = (anchor * T + i1) * 4;
      qa.set(q[a0], q[a0 + 1], q[a0 + 2], q[a0 + 3]); qb.set(q[a1], q[a1 + 1], q[a1 + 2], q[a1 + 3]);
      qc.copy(qa).slerp(qb, f).invert();
      out.premultiply(qc);
    }
    return out;
  };
  api.setTime = (t, anchor = api.anchor) => {
    api.time = t; api.anchor = anchor;
    const G = plates.G; if (!G) return;
    for (let gi = 0; gi < G; gi++) {
      api.groupQuatAt(gi, t, anchor, plates.holders[gi].quaternion);
      const ma = plates.maxAge[gi];
      let a = 1;
      if (ma !== null && ma !== undefined) a = 1 - THREE.MathUtils.smoothstep(t, Math.max(0, ma - 6), ma);
      plates.alpha[gi] = a;
      plates.holders[gi].visible = a > 0.01;
      const [s, l] = plates.mats[gi]; s.uniforms.uAlpha.value = a; l.uniforms.uAlpha.value = a;
    }
    api.requestRender();
    for (const f of api.timeHooks) f(t, anchor);
  };
  api.timeHooks = new Set();

  // where a spot on a continent piece is right now (in the planet's own frame)
  api.siteLocal = (site, r = 1, out = new THREE.Vector3()) => {
    out.copy(api.latLonToLocal(site.lat, site.lon, r));
    if (site.g >= 0 && plates.holders[site.g]) out.applyQuaternion(plates.holders[site.g].quaternion);
    return out;
  };
  api.siteWorld = (site, r = 1) => earth.localToWorld(api.siteLocal(site, r));
  api.siteVisible = (site) => site.g < 0 || plates.alpha[site.g] > 0.3;

  // Which continent piece is under this latitude/longitude? (reads the continents picture)
  let probe = null;
  api.groupAt = (lat, lon) => {
    if (!idsImage) return -1;
    if (!probe) { probe = document.createElement('canvas'); probe.width = probe.height = 61; }
    const ctx = probe.getContext('2d', { willReadFrequently: true });
    const W = idsImage.width, H = idsImage.height;
    const x = Math.floor((lon + 180) / 360 * W), y = Math.floor((90 - lat) / 180 * H);
    ctx.clearRect(0, 0, 61, 61);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(idsImage, x - 30, y - 30, 61, 61, 0, 0, 61, 61);
    const d = ctx.getImageData(0, 0, 61, 61).data;
    let best = -1, bd = 1e9;
    for (let j = 0; j < 61; j++) for (let i = 0; i < 61; i++) {
      const v = d[(j * 61 + i) * 4];
      if (v > 0) { const dd = (i - 30) ** 2 + (j - 30) ** 2; if (dd < bd) { bd = dd; best = v - 1; } }
    }
    return best;
  };

  // dim (gray out) some continent pieces; on = function(gi) -> 0..1
  api.setDim = (fn, ms = 700) => {
    const G = plates.G; const from = Float32Array.from(plates.dim);
    for (let gi = 0; gi < G; gi++) plates.dimT[gi] = fn ? fn(gi) : 0;
    return api.tween(ms, t => {
      for (let gi = 0; gi < G; gi++) {
        plates.dim[gi] = lerp(from[gi], plates.dimT[gi], t);
        plates.mats[gi][0].uniforms.uDim.value = plates.dim[gi]; plates.mats[gi][1].uniforms.uDim.value = plates.dim[gi];
      }
    });
  };
  api.setHi = (fn) => { for (let gi = 0; gi < plates.G; gi++) { const v = fn ? fn(gi) : 0; plates.mats[gi][0].uniforms.uHi.value = v; plates.mats[gi][1].uniforms.uHi.value = v; } api.requestRender(); };
  api.setShelf = (on) => { contU.uShelfOn.value = on ? 1 : 0; api.requestRender(); };
  api.setGrid = (on) => { const from = oceanU.uGrid.value; api.tween(500, t => { oceanU.uGrid.value = lerp(from, on ? 1 : 0, t); }); };

  // ---------- thick 3D lines ----------
  // pts: array of THREE.Vector3 (in the frame of whatever you add it to)
  const lineMats = new Set();
  api.makeLine3 = (pts, { color = 0xffffff, width = 4, opacity = 1, dash = 0, head = 1e9 } = {}) => {
    const n = pts.length; if (n < 2) return null;
    const P = new Float32Array(n * 6), PR = new Float32Array(n * 6), NX = new Float32Array(n * 6), S = new Float32Array(n * 2), A = new Float32Array(n * 2);
    let len = 0; const cum = [0];
    for (let i = 1; i < n; i++) { len += pts[i].distanceTo(pts[i - 1]); cum.push(len); }
    for (let i = 0; i < n; i++) {
      const p = pts[i], pr = pts[Math.max(0, i - 1)], nx = pts[Math.min(n - 1, i + 1)];
      for (let s = 0; s < 2; s++) {
        const j = i * 2 + s;
        P.set([p.x, p.y, p.z], j * 3); PR.set([pr.x, pr.y, pr.z], j * 3); NX.set([nx.x, nx.y, nx.z], j * 3);
        S[j] = s ? 1 : -1; A[j] = cum[i];
      }
    }
    const idx = [];
    for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('prev', new THREE.BufferAttribute(PR, 3));
    g.setAttribute('next', new THREE.BufferAttribute(NX, 3)); g.setAttribute('side', new THREE.BufferAttribute(S, 1));
    g.setAttribute('along', new THREE.BufferAttribute(A, 1)); g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      vertexShader: LINE3_VERT, fragmentShader: LINE3_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uWidth: { value: width * renderer.getPixelRatio() }, uColor: { value: new THREE.Color(color) },
                  uOpacity: { value: opacity }, uDash: { value: dash }, uTime: { value: 0 }, uHead: { value: head } }
    });
    m.userData.cssWidth = width;
    lineMats.add(m);
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 4;
    mesh.userData.length = len;
    mesh.dispose = () => { lineMats.delete(m); g.dispose(); m.dispose(); if (mesh.parent) mesh.parent.remove(mesh); };
    return mesh;
  };
  // points along the shortest path between two spots on the globe, lifted into an arch
  api.arcPoints = (a, b, lift = 0.06, n = 48) => {
    const out = [], va = a.clone().normalize(), vb = b.clone().normalize();
    const ang = va.angleTo(vb);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      let v;
      if (ang < 1e-4) v = va.clone();
      else { const s = Math.sin(ang); v = va.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(vb.clone().multiplyScalar(Math.sin(t * ang) / s)); }
      out.push(v.multiplyScalar(1.004 + lift * Math.sin(Math.PI * t) * Math.min(1, ang * 1.2)));
    }
    return out;
  };
  // a line along a list of [lat, lon] points, hugging the ground
  api.pathPoints = (latlons, r = 1.004, step = 1.0) => {
    const out = [];
    for (let i = 0; i < latlons.length; i++) {
      const a = api.latLonToLocal(latlons[i][0], latlons[i][1]);
      if (i === 0) { out.push(a.clone().multiplyScalar(r)); continue; }
      const p = api.latLonToLocal(latlons[i - 1][0], latlons[i - 1][1]);
      const ang = p.angleTo(a), n = Math.max(1, Math.ceil(ang / D2R / step));
      for (let k = 1; k <= n; k++) {
        const t = k / n, s = Math.sin(ang) || 1;
        out.push(p.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(a.clone().multiplyScalar(Math.sin(t * ang) / s)).normalize().multiplyScalar(r));
      }
    }
    return out;
  };

  // ---------- view state & rotation ----------
  const rot = { base: new THREE.Quaternion(), yaw: 0, pitch: 0, vy: 0, vp: 0, pitchLim: 1.35 };
  const cam = { dist: 4 };
  api.cam = cam;
  const ZOOM_POWER = 2.4;
  const zoomFling = { v: 0, t: 0, on: false };
  const shift = { x: 0, y: 0, tx: 0, ty: 0 };
  let W = 1, H = 1;
  const qTmp = new THREE.Quaternion(), qy = new THREE.Quaternion(), qp = new THREE.Quaternion();
  const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0);
  function composeRotation(out) {
    qy.setFromAxisAngle(AY, rot.yaw); qp.setFromAxisAngle(AX, rot.pitch);
    return out.copy(qp).multiply(qy).multiply(rot.base);
  }
  function fitDist(useTarget) {
    const sx = useTarget ? shift.tx : shift.x, sy = useTarget ? shift.ty : shift.y;
    const availW = Math.max(200, W - 2 * Math.abs(sx)), availH = Math.max(200, H - 2 * Math.abs(sy) - 150);
    const pxPerUnitAt1 = (H / 2) / FOV_T;
    return 1.12 * pxPerUnitAt1 / (Math.min(availW, availH) / 2);
  }
  api.fitDist = fitDist;
  const limits = () => ({ min: 1.25, max: fitDist() * 1.8 });

  // ---------- tweens ----------
  const tweens = new Set();
  api.tween = (ms, fn, done) => {
    const tw = { fn, done, t0: performance.now(), ms };
    tweens.add(tw); api.requestRender();
    return () => tweens.delete(tw);
  };
  let camTween = null;
  api.camTo = (target, ms = 900) => {
    zoomFling.on = false;
    if (camTween) camTween();
    const from = cam.dist, to = target.dist ?? cam.dist;
    camTween = api.tween(ms, t => { cam.dist = lerp(from, to, ease(t)); }, () => { camTween = null; });
  };
  let rotTween = null;
  api.rotTo = (targetBase, ms = 900, after = {}) => {
    if (rotTween) rotTween();
    const from = composeRotation(new THREE.Quaternion());
    rot.base.copy(from); rot.yaw = 0; rot.pitch = 0; rot.vy = rot.vp = 0;
    const to = targetBase.clone();
    rotTween = api.tween(ms, t => { rot.base.copy(from).slerp(to, ease(t)); }, () => {
      rotTween = null;
      if (after.yaw !== undefined) { rot.base.identity(); rot.yaw = after.yaw; rot.pitch = after.pitch || 0; }
    });
  };
  function globeQuat(yaw, pitch) {
    qy.setFromAxisAngle(AY, yaw); qp.setFromAxisAngle(AX, pitch);
    return new THREE.Quaternion().copy(qp).multiply(qy);
  }
  const yawFor = lonDeg => -Math.PI / 2 - lonDeg * D2R;
  api.yawFor = yawFor;
  const HOME = { lat: 12, lon: -30 };
  api.home = (ms = 1100) => api.flyToLatLon(HOME.lat, HOME.lon, fitDist(true), ms);
  api.flyToLatLon = (lat, lon, dist, ms = 1300) => {
    const yaw = yawFor(lon), pitch = clamp(lat * D2R * 0.9, -1.2, 1.2);
    api.rotTo(globeQuat(yaw, pitch), ms, { yaw, pitch });
    api.camTo({ dist: dist ?? fitDist(true) }, ms);
  };
  // turn the globe so a direction in the planet's frame faces you
  api.flyToLocal = (v, dist, ms) => { const ll = api.localToLatLon(v); api.flyToLatLon(ll.lat, ll.lon, dist, ms); };

  // ---------- touch & mouse ----------
  const el = renderer.domElement;
  const pointers = new Map();
  let gesture = null;
  api.inputEnabled = true;
  api.onTap = null;
  el.addEventListener('pointerdown', e => {
    if (!api.inputEnabled) return;
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    rot.vy = rot.vp = 0;
    zoomFling.on = false; zoomFling.v = 0; zoomFling.t = 0;
    if (pointers.size === 1) gesture = { t0: performance.now(), x0: e.clientX, y0: e.clientY, moved: false, multi: false, lastT: performance.now() };
    else if (gesture) { gesture.multi = true; gesture.pinch = pinchState(); }
  });
  function pinchState() {
    const [a, b] = [...pointers.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), dist: cam.dist };
  }
  function zoomTo(newDist) {
    const lim = limits();
    newDist = clamp(newDist, lim.min, lim.max);
    const hit = newDist <= lim.min + 1e-6 || newDist >= lim.max - 1e-6;
    cam.dist = newDist; api.requestRender();
    return hit;
  }
  el.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId); if (!p || !gesture) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(e.clientX - gesture.x0, e.clientY - gesture.y0) > 9) gesture.moved = true;
    if (pointers.size === 1 && !gesture.multi) {
      rotateBy(dx, dy, performance.now() - gesture.lastT);
      gesture.lastT = performance.now();
    } else if (pointers.size === 2 && gesture.pinch) {
      const now = pinchState(), s = gesture.pinch, lim = limits(), base = 1;
      const ratio = s.d / Math.max(now.d, 1);
      const newDist = clamp(base + (s.dist - base) * Math.pow(ratio, ZOOM_POWER), lim.min, lim.max);
      const t = performance.now(), hNew = Math.max(newDist - base, 1e-4), hOld = Math.max(cam.dist - base, 1e-4);
      const dt = Math.max(8, t - (zoomFling.t || t - 16)) / 1000;
      const v = Math.log(hNew / hOld) / dt;
      zoomFling.v = zoomFling.v * 0.5 + v * 0.5; zoomFling.t = t;
      cam.dist = newDist; api.requestRender();
    }
  });
  function endPointer(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (gesture && pointers.size === 0) {
      const dt = performance.now() - gesture.t0;
      if (!gesture.moved && !gesture.multi && dt < 500 && api.onTap) api.onTap(e.clientX, e.clientY);
      if (performance.now() - gesture.lastT > 60) { rot.vy = rot.vp = 0; }
      gesture = null;
    } else if (gesture && pointers.size === 1) gesture.pinch = null;
    if (pointers.size < 2 && zoomFling.t && performance.now() - zoomFling.t < 120 && Math.abs(zoomFling.v) > 0.3) {
      zoomFling.on = true; zoomFling.v = clamp(zoomFling.v, -6, 6);
    }
    if (pointers.size < 2) zoomFling.t = 0;
  }
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);
  el.addEventListener('wheel', e => {
    e.preventDefault(); zoomFling.on = false;
    const f = Math.exp(clamp(e.deltaY, -120, 120) * (e.ctrlKey ? 0.012 : 0.004));
    zoomTo(1 + (cam.dist - 1) * f);
  }, { passive: false });
  function rotateBy(dx, dy, dt) {
    const speed = 0.0055 * Math.min(1, Math.max(0.12, (cam.dist - 0.9) / 3));
    rot.yaw += dx * speed; rot.pitch += dy * speed;
    rot.pitch = clamp(rot.pitch, -rot.pitchLim, rot.pitchLim);
    const s = Math.max(dt, 8) / 16;
    rot.vy = dx * speed / s; rot.vp = dy * speed / s;
    api.requestRender();
  }

  // ---------- size & layout ----------
  api.setShift = (x, y) => {
    const wasFit = Math.abs(cam.dist - fitDist(true)) / fitDist(true) < 0.12;
    shift.tx = x; shift.ty = y;
    if (wasFit && !camTween) api.camTo({ dist: fitDist(true) }, 500);
    api.requestRender();
  };
  function resize() {
    W = container.clientWidth || window.innerWidth; H = container.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
    api.W = W; api.H = H;
    api.requestRender();
  }
  window.addEventListener('resize', () => { const old = fitDist(); resize(); if (Math.abs(cam.dist - old) < 0.05) cam.dist = fitDist(); });
  resize();
  cam.dist = fitDist();
  rot.yaw = yawFor(HOME.lon); rot.pitch = HOME.lat * D2R * 0.9;

  const vTmp = new THREE.Vector3(), camDir = new THREE.Vector3(), nTmp = new THREE.Vector3();
  api.project = (world) => {
    vTmp.copy(world).project(camera);
    return { x: (vTmp.x * 0.5 + 0.5) * W, y: (-vTmp.y * 0.5 + 0.5) * H, ok: vTmp.z < 1 && vTmp.z > -1 };
  };
  // how much a point on the globe faces you (1 = straight at you, below 0 = hidden behind)
  api.facing = (world) => {
    nTmp.copy(world).normalize();
    camDir.copy(camera.position).sub(world).normalize();
    return nTmp.dot(camDir);
  };
  api.worldPerPx = () => (2 * cam.dist * FOV_T) / H;

  // ---------- render loop ----------
  let running = true;
  const keepers = new Set();
  api.keepAnimating = (key, on) => { if (on) keepers.add(key); else keepers.delete(key); dirty = true; };
  api.frameHooks = new Set();
  api.afterRenderHooks = new Set();
  const clock = new THREE.Clock();
  const perf = { n: 0, sum: 0 };
  let tAccum = 0;
  const res = new THREE.Vector2();
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const rawDt = Math.min(clock.getDelta(), 0.25);
    const now = performance.now();
    for (const tw of [...tweens]) {
      const t = clamp((now - tw.t0) / tw.ms, 0, 1);
      tw.fn(t);
      if (t >= 1) { tweens.delete(tw); tw.done && tw.done(); }
    }
    if (zoomFling.on && pointers.size < 2) {
      const hit = zoomTo(1 + (cam.dist - 1) * Math.exp(zoomFling.v * rawDt));
      zoomFling.v *= Math.exp(-rawDt * 8);
      if (hit || Math.abs(zoomFling.v) < 0.05) zoomFling.on = false;
      dirty = true;
    }
    if (!gesture && (Math.abs(rot.vy) > 1e-5 || Math.abs(rot.vp) > 1e-5)) {
      rot.yaw += rot.vy; rot.pitch = clamp(rot.pitch + rot.vp, -rot.pitchLim, rot.pitchLim);
      rot.vy *= 0.92; rot.vp *= 0.92; dirty = true;
    }
    if (Math.abs(shift.x - shift.tx) > 0.5 || Math.abs(shift.y - shift.ty) > 0.5) {
      const k = 1 - Math.exp(-rawDt * 9);
      shift.x += (shift.tx - shift.x) * k; shift.y += (shift.ty - shift.y) * k; dirty = true;
    } else if (shift.x !== shift.tx || shift.y !== shift.ty) { shift.x = shift.tx; shift.y = shift.ty; dirty = true; }
    const animating = keepers.size > 0 || tweens.size > 0;
    if (animating && rawDt > 0) {
      perf.n++; perf.sum += rawDt;
      if (perf.n >= 90) {
        const avg = perf.sum / perf.n; perf.n = 0; perf.sum = 0;
        const pr = renderer.getPixelRatio();
        if (avg > 0.03 && pr > 1) { renderer.setPixelRatio(Math.max(1, pr - 0.5)); resize(); for (const m of lineMats) m.uniforms.uWidth.value = m.userData.cssWidth * renderer.getPixelRatio(); }
      }
    }
    if (animating) tAccum += Math.min(rawDt, 0.05);
    for (const h of api.frameHooks) h(rawDt, now);
    if (!dirty && !animating) return;
    dirty = false;
    composeRotation(qTmp); pivot.quaternion.copy(qTmp);
    camera.position.set(0, 0, cam.dist); camera.lookAt(0, 0, 0);
    camera.aspect = W / H;
    camera.setViewOffset(W, H, Math.round(shift.x), Math.round(shift.y), W, H);
    camera.updateProjectionMatrix();
    renderer.getDrawingBufferSize(res);
    for (const m of lineMats) { m.uniforms.uRes.value.copy(res); m.uniforms.uTime.value = tAccum; }
    renderer.render(scene, camera);
    for (const f of api.afterRenderHooks) f();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!running) { running = true; clock.getDelta(); dirty = true; requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
  return api;
}
