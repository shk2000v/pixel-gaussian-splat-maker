'use strict';
/* ---------- 기본 격자 → 가우시안 매개변수 ---------- */
function derive(base, size, chaos, opacity, seed){
  const n = base.n, R = mulberry32(seed ^ 0x9e3779b9), pos = new Float32Array(n * 3), scl = new Float32Array(n * 3), rot = new Float32Array(n * 4), rgb = new Float32Array(n * 3), alpha = new Float32Array(n);
  const sig = base.cell * size;
  for (let i = 0; i < n; i++){
    for (let a = 0; a < 3; a++){ pos[i * 3 + a] = base.pos[i * 3 + a] + (chaos ? (R() - .5) * base.cell * chaos * .9 : 0); scl[i * 3 + a] = sig * (chaos ? Math.exp((R() - .5) * 1.8 * chaos) : 1); rgb[i * 3 + a] = base.col[i * 3 + a] / 255; }
    let w = 1, x = 0, y = 0, z = 0; if (chaos){ x = (R() - .5) * 2 * chaos; y = (R() - .5) * 2 * chaos; z = (R() - .5) * 2 * chaos; const l = Math.hypot(w, x, y, z); w /= l; x /= l; y /= l; z /= l; }
    rot[i * 4] = w; rot[i * 4 + 1] = x; rot[i * 4 + 2] = y; rot[i * 4 + 3] = z; alpha[i] = opacity;
  }
  /* GPU용: 중심 3 + 공분산 6 + 색 4 */
  const pk = new Float32Array(n * 13);
  for (let i = 0; i < n; i++){ const w = rot[i * 4], x = rot[i * 4 + 1], y = rot[i * 4 + 2], z = rot[i * 4 + 3], sx = scl[i * 3], sy = scl[i * 3 + 1], sz = scl[i * 3 + 2];
    const m0 = (1 - 2 * (y * y + z * z)) * sx, m1 = 2 * (x * y - w * z) * sy, m2 = 2 * (x * z + w * y) * sz,
          m3 = 2 * (x * y + w * z) * sx, m4 = (1 - 2 * (x * x + z * z)) * sy, m5 = 2 * (y * z - w * x) * sz,
          m6 = 2 * (x * z - w * y) * sx, m7 = 2 * (y * z + w * x) * sy, m8 = (1 - 2 * (x * x + y * y)) * sz;
    const o = i * 13; pk[o] = pos[i * 3]; pk[o + 1] = pos[i * 3 + 1]; pk[o + 2] = pos[i * 3 + 2];
    pk[o + 3] = m0 * m0 + m1 * m1 + m2 * m2; pk[o + 4] = m0 * m3 + m1 * m4 + m2 * m5; pk[o + 5] = m0 * m6 + m1 * m7 + m2 * m8;
    pk[o + 6] = m3 * m3 + m4 * m4 + m5 * m5; pk[o + 7] = m3 * m6 + m4 * m7 + m5 * m8; pk[o + 8] = m6 * m6 + m7 * m7 + m8 * m8;
    pk[o + 9] = rgb[i * 3]; pk[o + 10] = rgb[i * 3 + 1]; pk[o + 11] = rgb[i * 3 + 2]; pk[o + 12] = opacity; }
  /* 움직임용: 스플랫마다 난수 4개, 세로 범위 */
  const R2 = mulberry32(seed ^ 0x51ed270b), rnd = new Float32Array(n * 4); let ymin = Infinity, ymax = -Infinity;
  for (let i = 0; i < n * 4; i++) rnd[i] = R2();
  for (let i = 0; i < n; i++){ const y = base.pos[i * 3 + 1]; if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
  return { n, pos, scl, rot, rgb, alpha, pk, rnd, ymin, ymax };
}
/* 움직임: 매 프레임 중심만 옮긴다(내보내는 파일에는 들어가지 않음) */
function animate(m, t){
  const mode = $('anim').value; if (mode === 'none') return false;
  const n = m.n, pk = m.pk, rn = m.rnd, A = num('amp'), y0 = m.ymin, H = (m.ymax - m.ymin) || 1, R = cam.radius;
  if (!m.ap){ m.ap = new Float32Array(n * 3); m.ab = new Float32Array(n); } const ap = m.ap, ab = m.ab;
  let h = 0, st = 1, xz = 1;
  if (mode === 'hop'){ const ph = (t * .85) % 1;
    if (ph < .62){ const u = ph / .62; h = 4 * u * (1 - u) * .32 * H * A; st = 1 - .14 * A * Math.cos(u * 6.2832); } else { const u = (ph - .62) / .38; st = 1 - .14 * A * (.5 + .5 * Math.cos(u * 6.2832)); }
    st = Math.max(.3, st); xz = 1 / Math.sqrt(st); }
  const bob = Math.sin(t * 2) * .09 * A * H, bx = Math.sin(t * 1.3) * .02 * A * H, br = .05 * A * Math.sin(t * 2.4), cyc = (t * .2) % 1, jy = .03 * A * H * Math.sin(t * 5);
  for (let i = 0; i < n; i++){ const o = i * 13; let x = pk[o], y = pk[o + 1], z = pk[o + 2], b = 0; const hy = (y - y0) / H;
    switch (mode){
      case 'bob': y += bob; x += bx; break;
      case 'breathe': x *= 1 + br; z *= 1 + br; y = y0 + (y - y0) * (1 + br * .6); break;
      case 'hop': x *= xz; z *= xz; y = y0 + (y - y0) * st + h; break;
      case 'sway': { const k = hy * hy * .2 * A * H; x += Math.sin(t * 1.7 + hy * 1.3) * k; z += Math.cos(t * 1.1) * k * .4; break; }
      case 'wave': y += .07 * A * H * Math.sin(x * 3 + z * 2 + t * 3); break;
      case 'jelly': { const a = .1 * A * Math.sin(t * 5 - hy * 5); x *= 1 + a; z *= 1 + a; y += jy * hy; break; }
      case 'build': { const d = hy * .3 + rn[i * 4 + 3] * .12; let k = cyc < .45 ? (cyc / .45 - d) / .55 : cyc < .82 ? 1 : 1 - (cyc - .82) / .18; k = k < 0 ? 0 : k > 1 ? 1 : k;
        const s = 2.4 * R * A * (1 - k * k * (3 - 2 * k)); x += (rn[i * 4] - .5) * s; y += (rn[i * 4 + 1] - .2) * s; z += (rn[i * 4 + 2] - .5) * s; break; }
      case 'twinkle': b = Math.pow(Math.max(0, Math.sin(t * 2.2 + rn[i * 4 + 3] * 6.2832)), 12) * .75 * A; break;
    }
    ap[i * 3] = x; ap[i * 3 + 1] = y; ap[i * 3 + 2] = z; ab[i] = b; }
  return true;
}

