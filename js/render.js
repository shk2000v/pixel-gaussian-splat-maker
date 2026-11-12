'use strict';
/* ---------- 상태 ---------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const S = { t:0, rec:false, nonce:0, src:'gen', pts:null, fileName:'', base:null, model:null, seed:1, label:'pixel-splat' };
const cam = { yaw:.7, pitch:.42, zoom:1, radius:1.8 };
const num = id => +$(id).value, chk = id => $(id).checked;
const toast = msg => { $('toast').textContent = msg; };

/* ---------- WebGL2 ---------- */
const canvas = $('view');
const gl = canvas.getContext('webgl2', { antialias:false, alpha:false });
let prog, post, vao, vaoPost, instBuf, fbo, tex, lowW = 0, lowH = 0, count = 0, sortDirty = true, dirty = true, raf = 0, last = 0;
const U = {}, UP = {};
const VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aQuad; layout(location=1) in vec3 aCenter; layout(location=2) in vec3 aCovA; layout(location=3) in vec3 aCovB; layout(location=4) in vec4 aColor;
uniform mat4 uView, uProj; uniform vec2 uViewport; uniform float uOrtho, uExtent, uSnap;
out vec2 vP; out vec4 vColor;
void main(){
  vec4 cam = uView * vec4(aCenter, 1.0); vec4 clip = uProj * cam;
  if (uOrtho < 0.5 && cam.z > -0.05){ gl_Position = vec4(0.0, 0.0, 2.0, 1.0); return; }
  mat3 Sig = mat3(aCovA.x, aCovA.y, aCovA.z, aCovA.y, aCovB.x, aCovB.y, aCovA.z, aCovB.y, aCovB.z);
  float fx = uProj[0][0] * uViewport.x * 0.5, fy = uProj[1][1] * uViewport.y * 0.5; mat3 J;
  if (uOrtho > 0.5) J = mat3(fx, 0.0, 0.0, 0.0, fy, 0.0, 0.0, 0.0, 0.0);
  else { float iz = 1.0 / cam.z; J = mat3(-fx * iz, 0.0, 0.0, 0.0, -fy * iz, 0.0, fx * cam.x * iz * iz, fy * cam.y * iz * iz, 0.0); }
  mat3 M = J * mat3(uView); mat3 C = M * Sig * transpose(M);
  float a = C[0][0] + 0.05, b = C[0][1], d = C[1][1] + 0.05;
  float mid = 0.5 * (a + d), rad = length(vec2(0.5 * (a - d), b));
  float l1 = mid + rad, l2 = max(mid - rad, 0.01);
  vec2 e = vec2(b, l1 - a); float el = length(e); e = el < 1e-6 ? vec2(1.0, 0.0) : e / el;
  vec2 off = (aQuad.x * sqrt(l1) * e + aQuad.y * sqrt(l2) * vec2(e.y, -e.x)) * uExtent;
  vec2 px = (clip.xy / clip.w * 0.5 + 0.5) * uViewport; if (uSnap > 0.5) px = floor(px) + 0.5;
  gl_Position = vec4((px + off) / uViewport * 2.0 - 1.0, 0.0, 1.0);
  vP = aQuad * uExtent; vColor = aColor;
}`;
const FS = `#version 300 es
precision highp float;
in vec2 vP; in vec4 vColor; out vec4 o; uniform float uHard, uSquare;
void main(){
  float r = mix(length(vP), max(abs(vP.x), abs(vP.y)), uSquare);
  float a = vColor.a * exp(-0.5 * pow(r, 2.0 * uHard));
  if (a < 0.004) discard;
  o = vec4(vColor.rgb * a, a);
}`;
const PVS = `#version 300 es
out vec2 vUV; void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUV = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const PFS = `#version 300 es
precision highp float;
in vec2 vUV; out vec4 o; uniform sampler2D uTex; uniform vec3 uBg; uniform float uLevels, uDither, uCut; uniform vec2 uRes;
const int M[16] = int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);
void main(){
  vec4 c = texture(uTex, vUV); vec3 rgb; bool hit = true;
  if (uCut > 0.5){ if (c.a < 0.5){ rgb = uBg; hit = false; } else rgb = c.rgb / c.a; } else { rgb = c.rgb + uBg * (1.0 - c.a); hit = c.a > 0.02; }
  if (uLevels > 1.5 && hit){ ivec2 p = ivec2(vUV * uRes); float t = ((float(M[(p.y & 3) * 4 + (p.x & 3)]) + 0.5) / 16.0 - 0.5) * uDither;
    rgb = floor(rgb * (uLevels - 1.0) + 0.5 + t) / (uLevels - 1.0); }
  o = vec4(clamp(rgb, 0.0, 1.0), 1.0);
}`;
function mkProg(vs, fs){ const p = gl.createProgram(); for (const [t, s] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]){ const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); gl.attachShader(p, sh); }
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
function initGL(){
  prog = mkProg(VS, FS); post = mkProg(PVS, PFS);
  for (const n of ['uView','uProj','uViewport','uOrtho','uExtent','uSnap','uHard','uSquare']) U[n] = gl.getUniformLocation(prog, n);
  for (const n of ['uTex','uBg','uLevels','uDither','uCut','uRes']) UP[n] = gl.getUniformLocation(post, n);
  vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const q = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, q); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  instBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
  [[1, 3, 0], [2, 3, 12], [3, 3, 24], [4, 4, 36]].forEach(([l, s, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s, gl.FLOAT, false, 52, o); gl.vertexAttribDivisor(l, 1); });
  vaoPost = gl.createVertexArray(); fbo = gl.createFramebuffer(); tex = gl.createTexture();
}
function fit(){
  const r = canvas.getBoundingClientRect(), ps = num('ps'); if (r.width < 2 || r.height < 2) return false;
  const lw = Math.max(8, Math.floor(r.width / ps)), lh = Math.max(8, Math.floor(r.height / ps)), k = Math.max(1, Math.round(ps * Math.min(window.devicePixelRatio || 1, 2)));
  if (canvas.width !== lw * k || canvas.height !== lh * k){ canvas.width = lw * k; canvas.height = lh * k; }
  if (lw !== lowW || lh !== lowH){ lowW = lw; lowH = lh; gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, lw, lh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); }
  return true;
}
const FOV = 35 * Math.PI / 180;
function matrices(){
  const d = cam.radius / Math.sin(FOV / 2) * 1.08 / cam.zoom, cp = Math.cos(cam.pitch), eye = [d * cp * Math.sin(cam.yaw), d * Math.sin(cam.pitch), d * cp * Math.cos(cam.yaw)];
  let f = eye.map(v => -v); const fl = Math.hypot(...f); f = f.map(v => v / fl); let s = [-f[2], 0, f[0]]; const sl = Math.hypot(...s) || 1; s = s.map(v => v / sl);
  const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const view = new Float32Array([s[0], u[0], -f[0], 0, s[1], u[1], -f[1], 0, s[2], u[2], -f[2], 0, -dot(s, eye), -dot(u, eye), dot(f, eye), 1]);
  const asp = lowW / lowH, n = .05, fa = d + cam.radius * 4 + 10; let proj;
  if (chk('ortho')){ const hh = d * Math.tan(FOV / 2); proj = new Float32Array([1 / (hh * asp), 0, 0, 0, 0, 1 / hh, 0, 0, 0, 0, -2 / (fa - n), 0, 0, 0, -(fa + n) / (fa - n), 1]); }
  else { const t = 1 / Math.tan(FOV / 2); proj = new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]); }
  return { view, proj };
}
let sorted = null, keys = null, order = null, dp = null; const bins = new Uint32Array(65537);
function sortUpload(view, t){
  const m = S.model; count = m ? m.n : 0; if (!count) return; const n = count, pk = m.pk, an = animate(m, t), ap = m.ap, ab = m.ab;
  if (!sorted || sorted.length !== n * 13){ sorted = new Float32Array(n * 13); keys = new Uint16Array(n); order = new Uint32Array(n); dp = new Float32Array(n); }
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i < n; i++){ const o = i * 13, z = an ? view[2] * ap[i * 3] + view[6] * ap[i * 3 + 1] + view[10] * ap[i * 3 + 2] : view[2] * pk[o] + view[6] * pk[o + 1] + view[10] * pk[o + 2]; dp[i] = z; if (z < mn) mn = z; if (z > mx) mx = z; }
  const sc = 65535 / ((mx - mn) || 1); bins.fill(0);
  for (let i = 0; i < n; i++){ const k = ((dp[i] - mn) * sc) | 0; keys[i] = k; bins[k + 1]++; }
  for (let i = 0; i < 65536; i++) bins[i + 1] += bins[i];
  for (let i = 0; i < n; i++) order[bins[keys[i]]++] = i;       /* 카메라에서 먼 것부터 */
  for (let j = 0; j < n; j++){ const i = order[j], o = i * 13, q = j * 13; sorted.set(pk.subarray(o, o + 13), q);
    if (an){ sorted[q] = ap[i * 3]; sorted[q + 1] = ap[i * 3 + 1]; sorted[q + 2] = ap[i * 3 + 2]; const b = ab[i]; if (b){ sorted[q + 9] += b; sorted[q + 10] += b; sorted[q + 11] += b; } } }
  gl.bindBuffer(gl.ARRAY_BUFFER, instBuf); gl.bufferData(gl.ARRAY_BUFFER, sorted, gl.DYNAMIC_DRAW);
}
function draw(){
  if (!gl || !fit()) return; const { view, proj } = matrices();
  if (sortDirty){ sortUpload(view, S.t); sortDirty = false; }
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, lowW, lowH); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  if (count){ gl.useProgram(prog); gl.bindVertexArray(vao); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const hard = num('hard'); gl.uniformMatrix4fv(U.uView, false, view); gl.uniformMatrix4fv(U.uProj, false, proj); gl.uniform2f(U.uViewport, lowW, lowH);
    gl.uniform1f(U.uOrtho, chk('ortho') ? 1 : 0); gl.uniform1f(U.uExtent, hard > 1.4 ? 1.6 : 3.0); gl.uniform1f(U.uSnap, chk('snap') ? 1 : 0);
    gl.uniform1f(U.uHard, hard); gl.uniform1f(U.uSquare, num('square')); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count); gl.disable(gl.BLEND); }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); gl.useProgram(post); gl.bindVertexArray(vaoPost);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(UP.uTex, 0); const bg = hex2rgb($('bg').value);
  gl.uniform3f(UP.uBg, bg[0] / 255, bg[1] / 255, bg[2] / 255); gl.uniform1f(UP.uLevels, num('levels')); gl.uniform1f(UP.uDither, chk('dither') ? 1 : 0);
  gl.uniform1f(UP.uCut, chk('cut') ? 1 : 0); gl.uniform2f(UP.uRes, lowW, lowH); gl.drawArrays(gl.TRIANGLES, 0, 3);
}
const live = () => chk('spin') || $('anim').value !== 'none' || S.rec;
function frame(t){ raf = 0; const dt = Math.min(.05, (t - last) / 1000 || 0); last = t; S.t += dt * num('speed');
  if (chk('spin') && !drag.size) cam.yaw += dt * .45;
  if (live()){ sortDirty = true; dirty = true; }
  if (dirty){ dirty = false; draw(); }
  if (live()) raf = requestAnimationFrame(frame); }
function invalidate(resort){ if (resort) sortDirty = true; dirty = true; if (!raf) raf = requestAnimationFrame(frame); }

