'use strict';
/* ---------- 파일 읽기 ---------- */
function parsePLY(buf){
  const u8 = new Uint8Array(buf); const dec = new TextDecoder('ascii'); const head = dec.decode(u8.subarray(0, Math.min(u8.length, 65536)));
  const endTag = 'end_header\n', e = head.indexOf(endTag); if (!head.startsWith('ply') || e < 0) throw new Error('PLY 헤더를 찾지 못했습니다.');
  if (!/format binary_little_endian/.test(head)) throw new Error('binary_little_endian PLY만 읽을 수 있습니다.');
  const SZ = { char:1, uchar:1, int8:1, uint8:1, short:2, ushort:2, int16:2, uint16:2, int:4, uint:4, int32:4, uint32:4, float:4, float32:4, double:8, float64:8 };
  let n = 0, off = 0, inV = false; const prop = {};
  for (const ln of head.slice(0, e).split('\n')){ const p = ln.trim().split(/\s+/);
    if (p[0] === 'element'){ inV = p[1] === 'vertex'; if (inV) n = +p[2]; }
    else if (p[0] === 'property' && inV){ if (!(p[1] in SZ)) throw new Error('지원하지 않는 속성 형식: ' + p[1]); prop[p[2]] = { off, type:p[1] }; off += SZ[p[1]]; } }
  if (!n || !prop.x || !prop.y || !prop.z) throw new Error('vertex 요소나 x/y/z 속성이 없습니다.');
  const start = e + endTag.length; if (start + n * off > buf.byteLength) throw new Error('파일이 헤더가 말한 크기보다 짧습니다.');
  const dv = new DataView(buf, start); const pos = new Float32Array(n * 3), rgb = new Float32Array(n * 3), alpha = new Float32Array(n);
  const rd = (p, base) => p.type === 'double' || p.type === 'float64' ? dv.getFloat64(base + p.off, true) : p.type === 'uchar' || p.type === 'uint8' ? dv.getUint8(base + p.off) : dv.getFloat32(base + p.off, true);
  const dc = prop.f_dc_0 && prop.f_dc_1 && prop.f_dc_2, cl = prop.red && prop.green && prop.blue;
  if (!dc && !cl) throw new Error('색 속성(f_dc_* 또는 red/green/blue)이 없습니다.');
  for (let i = 0; i < n; i++){ const b = i * off;
    pos[i * 3] = rd(prop.x, b); pos[i * 3 + 1] = rd(prop.y, b); pos[i * 3 + 2] = rd(prop.z, b);
    if (dc){ rgb[i * 3] = clamp01(.5 + SH_C0 * rd(prop.f_dc_0, b)); rgb[i * 3 + 1] = clamp01(.5 + SH_C0 * rd(prop.f_dc_1, b)); rgb[i * 3 + 2] = clamp01(.5 + SH_C0 * rd(prop.f_dc_2, b)); }
    else { rgb[i * 3] = rd(prop.red, b) / 255; rgb[i * 3 + 1] = rd(prop.green, b) / 255; rgb[i * 3 + 2] = rd(prop.blue, b) / 255; }
    alpha[i] = prop.opacity ? 1 / (1 + Math.exp(-rd(prop.opacity, b))) : 1; }
  return { n, pos, rgb, alpha };
}
function parseSplat(buf){
  const n = Math.floor(buf.byteLength / 32); if (!n) throw new Error('.splat 파일이 비어 있습니다.');
  const f = new DataView(buf), pos = new Float32Array(n * 3), rgb = new Float32Array(n * 3), alpha = new Float32Array(n);
  for (let i = 0; i < n; i++){ const b = i * 32; pos[i * 3] = f.getFloat32(b, true); pos[i * 3 + 1] = f.getFloat32(b + 4, true); pos[i * 3 + 2] = f.getFloat32(b + 8, true);
    rgb[i * 3] = f.getUint8(b + 24) / 255; rgb[i * 3 + 1] = f.getUint8(b + 25) / 255; rgb[i * 3 + 2] = f.getUint8(b + 26) / 255; alpha[i] = f.getUint8(b + 27) / 255; }
  return { n, pos, rgb, alpha };
}
/* 점 구름 → 복셀 격자 평균색 → k-means 팔레트 */
function pixelize(pts, Rz, K, cut, flip){
  const n = pts.n, step = Math.max(1, Math.floor(n / 100000)), lo = [0, 0, 0], hi = [0, 0, 0];
  for (let a = 0; a < 3; a++){ const s = []; for (let i = 0; i < n; i += step){ const v = pts.pos[i * 3 + a]; if (Number.isFinite(v)) s.push(v); } s.sort((p, q) => p - q);
    if (!s.length) throw new Error('유효한 좌표가 없습니다.'); lo[a] = s[Math.floor(s.length * .02)]; hi[a] = s[Math.min(s.length - 1, Math.floor(s.length * .98))]; }
  const ext = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) || 1, cell = ext / Rz;
  const D = [0, 1, 2].map(a => Math.max(1, Math.min(Rz, Math.ceil((hi[a] - lo[a]) / cell))));
  const tot = D[0] * D[1] * D[2], W = new Float32Array(tot), A = new Float32Array(tot * 3);
  for (let i = 0; i < n; i++){ const x = Math.floor((pts.pos[i * 3] - lo[0]) / cell), y = Math.floor((pts.pos[i * 3 + 1] - lo[1]) / cell), z = Math.floor((pts.pos[i * 3 + 2] - lo[2]) / cell);
    if (!(x >= 0 && y >= 0 && z >= 0 && x < D[0] && y < D[1] && z < D[2])) continue; const c = x + D[0] * (y + D[1] * z), w = pts.alpha[i];
    W[c] += w; A[c * 3] += w * pts.rgb[i * 3]; A[c * 3 + 1] += w * pts.rgb[i * 3 + 1]; A[c * 3 + 2] += w * pts.rgb[i * 3 + 2]; }
  const P = [], C = [], sc = 2 / Rz, sy = flip ? -1 : 1;
  for (let z = 0; z < D[2]; z++) for (let y = 0; y < D[1]; y++) for (let x = 0; x < D[0]; x++){ const c = x + D[0] * (y + D[1] * z), w = W[c]; if (w < cut) continue;
    P.push((x + .5 - D[0] / 2) * sc, sy * (y + .5 - D[1] / 2) * sc, sy * (z + .5 - D[2] / 2) * sc); C.push(A[c * 3] / w, A[c * 3 + 1] / w, A[c * 3 + 2] / w); }
  const m = P.length / 3; if (!m) throw new Error('밀도 컷을 넘는 칸이 없습니다. 밀도 컷을 낮춰 보세요.');
  const R = mulberry32(12345), k = Math.min(K, m), cen = new Float32Array(k * 3);
  for (let j = 0; j < k; j++){ const i = Math.floor(R() * m); cen[j * 3] = C[i * 3]; cen[j * 3 + 1] = C[i * 3 + 1]; cen[j * 3 + 2] = C[i * 3 + 2]; }
  const st = Math.max(1, Math.floor(m / 8000));
  const near = (r, g, b) => { let bj = 0, bd = 1e9; for (let j = 0; j < k; j++){ const d = sq(r - cen[j * 3]) + sq(g - cen[j * 3 + 1]) + sq(b - cen[j * 3 + 2]); if (d < bd){ bd = d; bj = j; } } return bj; };
  for (let itr = 0; itr < 10; itr++){ const S = new Float32Array(k * 4);
    for (let i = 0; i < m; i += st){ const j = near(C[i * 3], C[i * 3 + 1], C[i * 3 + 2]); S[j * 4] += C[i * 3]; S[j * 4 + 1] += C[i * 3 + 1]; S[j * 4 + 2] += C[i * 3 + 2]; S[j * 4 + 3]++; }
    for (let j = 0; j < k; j++) if (S[j * 4 + 3]){ cen[j * 3] = S[j * 4] / S[j * 4 + 3]; cen[j * 3 + 1] = S[j * 4 + 1] / S[j * 4 + 3]; cen[j * 3 + 2] = S[j * 4 + 2] / S[j * 4 + 3]; } }
  const col = new Uint8Array(m * 3);
  for (let i = 0; i < m; i++){ const j = near(C[i * 3], C[i * 3 + 1], C[i * 3 + 2]); col[i * 3] = Math.round(cen[j * 3] * 255); col[i * 3 + 1] = Math.round(cen[j * 3 + 1] * 255); col[i * 3 + 2] = Math.round(cen[j * 3 + 2] * 255); }
  return { n:m, pos:new Float32Array(P), col, cell:sc };
}

