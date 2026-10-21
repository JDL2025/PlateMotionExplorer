// Shader code for Plate Motion Explorer (runs on the iPad's graphics chip).

// ---------------------------------------------------------------------
// Continents. Each piece of a continent is drawn twice:
//   pass 0 = the continental shelf (the part of a continent under shallow sea)
//   pass 1 = the land itself (NASA Blue Marble picture)
// The "continents" picture holds, for every spot on Earth, which piece it
// belongs to (red) and whether it is land (green).
// ---------------------------------------------------------------------
export const CONT_VERT = /* glsl */`
uniform float uLift;
varying vec2 vUv; varying vec3 vNv;
void main(){
  vUv = uv;
  vNv = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position * uLift, 1.0);
}`;

export const CONT_FRAG = /* glsl */`
precision highp float; precision highp int;
uniform sampler2D uIds; uniform sampler2D uMap;
uniform float uGid, uDim, uAlpha, uPass, uShelfOn, uHi;
uniform vec3 uShelf;
varying vec2 vUv; varying vec3 vNv;
float landAt(ivec2 q, ivec2 sz){
  q.x = (q.x % sz.x + sz.x) % sz.x; q.y = clamp(q.y, 0, sz.y - 1);
  return texelFetch(uIds, q, 0).g;
}
void main(){
  ivec2 sz = textureSize(uIds, 0);
  vec2 px = vUv * vec2(sz);
  ivec2 q = ivec2(floor(px));
  q.x = (q.x % sz.x + sz.x) % sz.x; q.y = clamp(q.y, 0, sz.y - 1);
  int id = int(texelFetch(uIds, q, 0).r * 255.0 + 0.5);
  if (id != int(uGid + 0.5)) discard;
  vec2 p = px - 0.5; ivec2 b = ivec2(floor(p)); vec2 f = p - vec2(b);
  float land = mix(mix(landAt(b, sz), landAt(b + ivec2(1, 0), sz), f.x),
                   mix(landAt(b + ivec2(0, 1), sz), landAt(b + ivec2(1, 1), sz), f.x), f.y);
  vec3 n = normalize(vNv);
  float lam = max(dot(n, normalize(vec3(-0.45, 0.55, 0.75))), 0.0);
  float shade = 0.66 + 0.46 * lam;
  vec3 col; float a;
  if (uPass < 0.5) { col = uShelf; a = uShelfOn * 0.92; }
  else {
    a = smoothstep(0.3, 0.7, land);
    if (a < 0.01) discard;
    col = texture2D(uMap, vUv).rgb * 1.06;
  }
  col *= shade;
  vec3 g = vec3(dot(col, vec3(0.3333)));
  col = mix(col, g * 0.5, uDim * 0.82);
  col += uHi * vec3(0.10, 0.08, 0.03);
  gl_FragColor = vec4(col, a * uAlpha);
}`;

// ---------------------------------------------------------------------
// Ocean: a deep blue ball under the continents
// ---------------------------------------------------------------------
export const OCEAN_VERT = /* glsl */`
varying vec3 vNv; varying vec3 vP;
void main(){ vNv = normalize(normalMatrix * normal); vP = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const OCEAN_FRAG = /* glsl */`
uniform float uGrid;
varying vec3 vNv; varying vec3 vP;
void main(){
  vec3 n = normalize(vNv);
  float lam = max(dot(n, normalize(vec3(-0.45, 0.55, 0.75))), 0.0);
  vec3 p = normalize(vP);
  float lat = asin(clamp(p.y, -1.0, 1.0));
  vec3 deep = vec3(0.035, 0.12, 0.25), mid = vec3(0.06, 0.20, 0.38);
  vec3 col = mix(deep, mid, 0.35 + 0.35 * cos(lat * 1.4));
  col *= 0.6 + 0.62 * lam;
  float spec = pow(max(dot(reflect(-normalize(vec3(-0.45, 0.55, 0.75)), n), vec3(0.0, 0.0, 1.0)), 0.0), 24.0);
  col += spec * vec3(0.10, 0.16, 0.24);
  // faint lines of latitude and longitude (every 30 degrees)
  if (uGrid > 0.001) {
    float lon = atan(-p.z, p.x);
    float la = abs(fract(degrees(lat) / 30.0 + 0.5) - 0.5) * 30.0;
    float lo = abs(fract(degrees(lon) / 30.0 + 0.5) - 0.5) * 30.0 * cos(lat);
    float w = fwidth(degrees(lat)) * 1.2;
    float g = max(1.0 - smoothstep(0.0, w, la), 1.0 - smoothstep(0.0, w, lo));
    col = mix(col, vec3(0.45, 0.65, 0.85), g * 0.22 * uGrid);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

// soft blue glow around the planet
export const ATMO_VERT = /* glsl */`
varying vec3 vNv;
void main(){ vNv = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export const ATMO_FRAG = /* glsl */`
uniform float uStrength; uniform vec3 uColor;
varying vec3 vNv;
void main(){
  float i = pow(clamp(0.78 - dot(normalize(vNv), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.0);
  gl_FragColor = vec4(uColor * i * uStrength, 1.0);
}`;

// glowing dots (stars, bursts)
export const DOTS_VERT = /* glsl */`
attribute vec3 color; attribute float size; attribute float alpha;
uniform float uScale; varying vec3 vC; varying float vA;
void main(){
  vC = color; vA = alpha;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * uScale;
  gl_Position = projectionMatrix * mv;
}`;
export const DOTS_FRAG = /* glsl */`
uniform float uOpacity; uniform float uSoft;
varying vec3 vC; varying float vA;
void main(){
  vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0;
  if (r > 1.0) discard;
  float a = mix(1.0 - smoothstep(0.75, 1.0, r), pow(1.0 - r, 1.6), uSoft);
  gl_FragColor = vec4(vC, a * vA * uOpacity);
}`;

// ---------------------------------------------------------------------
// Thick lines in 3D that stay the same width on the screen
// (mountain chains, arcs between matching fossils, the equator)
// ---------------------------------------------------------------------
export const LINE3_VERT = /* glsl */`
attribute vec3 prev; attribute vec3 next; attribute float side; attribute float along;
uniform vec2 uRes; uniform float uWidth;
varying float vAlong; varying float vSide;
void main(){
  mat4 mvp = projectionMatrix * modelViewMatrix;
  vec4 c = mvp * vec4(position, 1.0);
  vec4 p = mvp * vec4(prev, 1.0);
  vec4 n = mvp * vec4(next, 1.0);
  vec2 h = uRes * 0.5;
  vec2 cs = c.xy / c.w * h, ps = p.xy / p.w * h, ns = n.xy / n.w * h;
  vec2 d1 = cs - ps, d2 = ns - cs;
  vec2 dir = vec2(0.0);
  if (dot(d1, d1) > 1e-6) dir += normalize(d1);
  if (dot(d2, d2) > 1e-6) dir += normalize(d2);
  if (dot(dir, dir) < 1e-8) dir = vec2(1.0, 0.0);
  dir = normalize(dir);
  vec2 nrm = vec2(-dir.y, dir.x);
  c.xy += nrm * side * uWidth * 0.5 / h * c.w;
  vAlong = along; vSide = side;
  gl_Position = c;
}`;
export const LINE3_FRAG = /* glsl */`
uniform vec3 uColor; uniform float uOpacity; uniform float uDash; uniform float uTime; uniform float uHead;
varying float vAlong; varying float vSide;
void main(){
  if (vAlong > uHead) discard;
  if (uDash > 0.0 && fract(vAlong * uDash - uTime) > 0.55) discard;
  float edge = 1.0 - smoothstep(0.55, 1.0, abs(vSide));
  gl_FragColor = vec4(uColor, uOpacity * (0.3 + 0.7 * edge));
}`;
