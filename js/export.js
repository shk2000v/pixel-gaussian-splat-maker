'use strict';
/* ---------- 내보내기 ---------- */
function exportPLY(m, flip){
  const names = ['x','y','z','nx','ny','nz','f_dc_0','f_dc_1','f_dc_2','opacity','scale_0','scale_1','scale_2','rot_0','rot_1','rot_2','rot_3'];
  const head = new TextEncoder().encode('ply\nformat binary_little_endian 1.0\nelement vertex ' + m.n + '\n' + names.map(s => 'property float ' + s + '\n').join('') + 'end_header\n');
  const out = new Uint8Array(head.length + m.n * 68); out.set(head); const dv = new DataView(out.buffer, head.length);
  for (let i = 0; i < m.n; i++){ const b = i * 68, s = flip ? -1 : 1; let w = m.rot[i * 4], x = m.rot[i * 4 + 1], y = m.rot[i * 4 + 2], z = m.rot[i * 4 + 3];
    if (flip){ const t = [-x, w, -z, y]; w = t[0]; x = t[1]; y = t[2]; z = t[3]; }
    const a = Math.min(.999, Math.max(.001, m.alpha[i]));
    const v = [m.pos[i * 3], s * m.pos[i * 3 + 1], s * m.pos[i * 3 + 2], 0, 0, 0, (m.rgb[i * 3] - .5) / SH_C0, (m.rgb[i * 3 + 1] - .5) / SH_C0, (m.rgb[i * 3 + 2] - .5) / SH_C0,
      Math.log(a / (1 - a)), Math.log(m.scl[i * 3]), Math.log(m.scl[i * 3 + 1]), Math.log(m.scl[i * 3 + 2]), w, x, y, z];
    for (let j = 0; j < 17; j++) dv.setFloat32(b + j * 4, v[j], true); }
  return out;
}
function exportSplat(m, flip){
  const out = new Uint8Array(m.n * 32), dv = new DataView(out.buffer), q8 = v => Math.max(0, Math.min(255, Math.round(v * 128 + 128)));
  for (let i = 0; i < m.n; i++){ const b = i * 32, s = flip ? -1 : 1; let w = m.rot[i * 4], x = m.rot[i * 4 + 1], y = m.rot[i * 4 + 2], z = m.rot[i * 4 + 3];
    if (flip){ const t = [-x, w, -z, y]; w = t[0]; x = t[1]; y = t[2]; z = t[3]; }
    dv.setFloat32(b, m.pos[i * 3], true); dv.setFloat32(b + 4, s * m.pos[i * 3 + 1], true); dv.setFloat32(b + 8, s * m.pos[i * 3 + 2], true);
    dv.setFloat32(b + 12, m.scl[i * 3], true); dv.setFloat32(b + 16, m.scl[i * 3 + 1], true); dv.setFloat32(b + 20, m.scl[i * 3 + 2], true);
    out[b + 24] = Math.round(m.rgb[i * 3] * 255); out[b + 25] = Math.round(m.rgb[i * 3 + 1] * 255); out[b + 26] = Math.round(m.rgb[i * 3 + 2] * 255); out[b + 27] = Math.round(m.alpha[i] * 255);
    out[b + 28] = q8(w); out[b + 29] = q8(x); out[b + 30] = q8(y); out[b + 31] = q8(z); }
  return out;
}
const CRC = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++){ let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; } return t; })();
function crc32(u){ let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files){ /* 압축 없는(stored) ZIP */
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0; const date = ((2026 - 1980) << 9) | (11 << 5) | 12;
  for (const f of files){ const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, date, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, date, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    parts.push(lh.buffer, nm, f.data); cen.push(ch.buffer, nm); off += 30 + nm.length + sz; }
  let cs = 0; for (const c of cen) cs += c.byteLength;
  const eo = new DataView(new ArrayBuffer(22)); eo.setUint32(0, 0x06054b50, true); eo.setUint16(8, files.length, true); eo.setUint16(10, files.length, true); eo.setUint32(12, cs, true); eo.setUint32(16, off, true);
  return new Blob([...parts, ...cen, eo.buffer], { type:'application/zip' });
}

