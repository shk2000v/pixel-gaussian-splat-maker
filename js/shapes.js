'use strict';
/* ---------- 형태 ---------- */
const sq = v => v * v;
const inS = (x, y, z, cx, cy, cz, r) => sq(x - cx) + sq(y - cy) + sq(z - cz) < r * r;
const inE = (x, y, z, cx, cy, cz, rx, ry, rz) => sq((x - cx) / rx) + sq((y - cy) / ry) + sq((z - cz) / rz) < 1;
const SUBJ = [
 { id:'tree', ko:'나무', keys:['나무','소나무','tree','pine'], colors:['#3fa34d','#7a4a2b','#e23d4b','#5d7a3a'],
   make(R){ const pine = R() < 0.4, blobs = []; const nb = 3 + Math.floor(R() * 3);
     for (let i = 0; i < nb; i++) blobs.push([(R() - .5) * .7, .2 + R() * .45, (R() - .5) * .7, .32 + R() * .16]);
     const tiers = [[-.35, .25, .72], [0, .6, .56], [.35, .95, .4]];
     return (x, y, z, i, j, k) => { const rr = x * x + z * z;
       if (y < -.84) return rr < .42 ? 4 : 0;
       if (pine){ for (const [yb, yt, rb] of tiers){ if (y >= yb && y < yt){ const r = rb * (1 - (y - yb) / (yt - yb)); if (rr < r * r) return (y - yb < .1 && h3(i, j, k, 7) < .3) ? 3 : 1; } }
         return (rr < .014 && y < -.3) ? 2 : 0; }
       for (const b of blobs) if (inS(x, y, z, b[0], b[1], b[2], b[3])) return h3(i, j, k, 7) < .05 ? 3 : 1;
       return (rr < .018 + .01 * (-y) && y < .3) ? 2 : 0; }; } },
 { id:'house', ko:'집', keys:['집','오두막','house','home','cabin'], colors:['#c8453b','#e9d8a6','#7fd6f2','#6b4226'],
   make(R){ const w = .58 + R() * .16, d = .5, rh = .5 + R() * .25, cx = R() < .5 ? .32 : -.32;
     return (x, y, z) => { const ax = Math.abs(x), az = Math.abs(z);
       if (y > .05 && y < .05 + rh && az < d + .09 && ax < (w + .13) * (1 - (y - .05) / rh)) return 1;
       if (Math.abs(x - cx) < .09 && Math.abs(z + .1) < .09 && y > .05 && y < .05 + rh * .95) return 4;
       if (ax < w && az < d && y > -.85 && y <= .05){
         if (z > d - .09){ if (ax < .13 && y < -.32) return 4; if (Math.abs(ax - .38) < .11 && Math.abs(y + .28) < .12) return 3; }
         return 2; }
       return 0; }; } },
 { id:'mushroom', ko:'버섯', keys:['버섯','mushroom'], colors:['#d7263d','#f2e8cf','#ffffff','#c9a27c'],
   make(R){ const spots = []; for (let i = 0; i < 7; i++){ const a = R() * 6.283, e = .25 + R() * 1.1; spots.push([Math.sin(e) * Math.cos(a) * .75, .05 + Math.cos(e) * .6, Math.sin(e) * Math.sin(a) * .75, .1 + R() * .07]); }
     const cw = .68 + R() * .14;
     return (x, y, z) => { const rr = x * x + z * z;
       if (y >= .02 && sq(x / cw) + sq((y - .02) / .62) + sq(z / cw) < 1){ if (y < .1) return 4; for (const s of spots) if (inS(x, y, z, s[0] * cw / .75, s[1], s[2] * cw / .75, s[3])) return 3; return 1; }
       if (y > -.9 && y < .05 && rr < sq(.17 + .07 * (-y))) return 2;
       return 0; }; } },
 { id:'sword', ko:'검', keys:['검','칼','sword','blade'], colors:['#e23d6d','#cfd8e6','#e8b923','#5b3a29'],
   make(R){ const bw = .09 + R() * .05, gw = .34 + R() * .14;
     return (x, y, z) => { const ax = Math.abs(x), az = Math.abs(z);
       if (inS(x, y, z, 0, -.84, 0, .12)) return 1;
       if (y > -.76 && y < -.36 && ax < .065 && az < .065) return 4;
       if (Math.abs(y + .3) < .075 && ax < gw && az < .1) return 3;
       if (y >= -.23 && y < .95 && az < .05 && ax < bw * Math.min(1, (.95 - y) / .18)) return 2;
       return 0; }; } },
 { id:'slime', ko:'슬라임', keys:['슬라임','젤리','slime'], colors:['#4fc36b','#c8f7c5','#ffffff','#1b2a41'],
   make(R){ const w = .72 + R() * .14, hh = .5 + R() * .18;
     return (x, y, z) => { if (y < -.9) return 0;
       if (sq(x / w) + sq((y + .38) / hh) + sq(z / w) >= 1) return 0;
       if (inS(x, y, z, .27, -.2, w * .8, .12) || inS(x, y, z, -.27, -.2, w * .8, .12)) return 4;
       if (inS(x, y, z, -.34, -.38 + hh * .7, .3, .14)) return 2;
       return 1; }; } },
 { id:'heart', ko:'하트', keys:['하트','사랑','heart','love'], colors:['#e63946','#ff9aa2','#ffffff','#7a1020'],
   make(){ return (x, y, z) => { const X = x * 1.3, Y = y * 1.3 + .12, Z = z * 1.3; const a = X * X + 2.25 * Z * Z + Y * Y - 1;
       if (a * a * a - X * X * Y * Y * Y - .1125 * Z * Z * Y * Y * Y >= 0) return 0;
       return inS(x, y, z, -.4, .38, .25, .16) ? 2 : 1; }; } },
 { id:'star', ko:'별', keys:['별','star'], colors:['#ffd23f','#fff3b0','#ffffff','#b8860b'],
   make(R){ const Ro = .92, Ri = .36 + R() * .12, ph = Math.PI / 5, Bx = Ro * Math.cos(ph), By = Ro * Math.sin(ph);
     return (x, y, z) => { const r = Math.hypot(x, y); let a = Math.atan2(x, y); if (a < 0) a += 6.2832;
       const t = Math.abs((a % (2 * ph)) - ph), tt = ph - t; const rb = By * Ri / (By * Math.cos(tt) - (Bx - Ri) * Math.sin(tt));
       if (r >= rb) return 0; if (Math.abs(z) >= .06 + .24 * (1 - r / rb)) return 0;
       return r < .22 ? 2 : 1; }; } },
 { id:'castle', ko:'성', keys:['성','성채','탑','castle','tower'], colors:['#3a6ea5','#b8bcc8','#e63946','#4a3b2a'],
   make(R){ const th = .25 + R() * .2;
     return (x, y, z, i, j, k) => { const ax = Math.abs(x), az = Math.abs(z);
       if (y < -.9) return 0;
       const tr = sq(ax - .6) + sq(az - .6);
       if (tr < .045 && y < th) return 2;
       if (y >= th && y < th + .45){ const r = .27 * (1 - (y - th) / .45); if (tr < r * r) return 1; }
       if (ax < .46 && az < .46 && y < 0){ if (z > .37 && ax < .14 && y < -.4) return 4; return 2; }
       if (ax < .46 && az < .46 && y >= 0 && y < .13 && Math.max(ax, az) > .36 && ((i + k) & 1) === 0) return 2;
       if (ax < .04 && az < .04 && y >= 0 && y < .8) return 4;
       if (x > .04 && x < .32 && az < .04 && y > .58 && y < .8) return 3;
       return 0; }; } },
 { id:'island', ko:'섬', keys:['섬','공중섬','island'], colors:['#6cc24a','#8a5a3c','#2f8f4e','#9aa0a8'],
   make(R){ const s1 = R() * 6.28, s2 = R() * 6.28, tx = (R() - .5) * .5, tz = (R() - .5) * .5;
     return (x, y, z, i, j, k) => { const r = Math.hypot(x, z), a = Math.atan2(z, x); const e = .78 + .08 * Math.sin(a * 3 + s1) + .05 * Math.sin(a * 7 + s2);
       if (y >= -.08 && y < .1) return r < e ? 1 : 0;
       if (y < -.08 && y > -.95){ const rr = e * Math.pow(1 - (-.08 - y) / .87, .8) * (1 + .12 * Math.sin(y * 14 + a * 4 + s1)); return r < rr ? (h3(i, j, k, 3) < .13 ? 4 : 2) : 0; }
       if (inS(x, y, z, tx, .66, tz, .3)) return 3;
       if (sq(x - tx) + sq(z - tz) < .006 && y >= .1 && y < .5) return 2;
       return 0; }; } },
 { id:'crystal', ko:'수정', keys:['수정','크리스탈','보석','crystal','gem'], colors:['#9b5de5','#c9a7ff','#ffffff','#4a4e69'],
   make(R){ const cs = [[0, 0, 0, 0, 1.55 + R() * .2, .2, 1]]; const n = 3 + Math.floor(R() * 3);
     for (let i = 0; i < n; i++){ const a = R() * 6.28, d = .22 + R() * .22; cs.push([Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * (.2 + R() * .3), Math.sin(a) * (.2 + R() * .3), .7 + R() * .6, .11 + R() * .07, 1 + (i & 1)]); }
     return (x, y, z, i, j, k) => { if (y < -.92) return 0;
       for (const c of cs){ const t = (y + .82) / c[4]; if (t < 0 || t > 1) continue; const dx = Math.abs(x - c[0] - c[2] * t * c[4]), dz = Math.abs(z - c[1] - c[3] * t * c[4]);
         const d = Math.max(dx, .5 * dx + .866 * dz), r = c[5] * (t < .75 ? 1 : (1 - t) / .25); if (d < r) return h3(i, j, k, 9) < .04 ? 3 : c[6]; }
       return (sq(x / .72) + sq((y + .86) / .17) + sq(z / .72) < 1) ? 4 : 0; }; } },
 { id:'potion', ko:'물약', keys:['물약','포션','약병','potion'], colors:['#e23d8f','#d6eef5','#ffffff','#a9744f'],
   make(R){ const lv = -.35 + R() * .3;
     return (x, y, z, i, j, k) => { const rr = x * x + z * z;
       if (y > -.86 && inS(x, y, z, 0, -.3, 0, .58)){ if (inS(x, y, z, -.3, -.08, .42, .12)) return 3; return y < lv ? (h3(i, j, k, 5) < .05 ? 3 : 1) : 2; }
       if (y >= .2 && y < .52 && rr < .03) return 2;
       if (y >= .52 && y < .62 && rr < .05) return 2;
       if (y >= .62 && y < .8 && rr < .024) return 4;
       return 0; }; } },
 { id:'ghost', ko:'유령', keys:['유령','귀신','ghost'], colors:['#b8c0ff','#f4f4ff','#ff9ecb','#22223b'],
   make(R){ const p = R() * 6.28;
     return (x, y, z) => { const rr = x * x + z * z; const body = inS(x, y, z, 0, .25, 0, .56) || (rr < .3136 && y <= .25 && y > -.72 + .11 * Math.sin(x * 11 + p) * Math.cos(z * 11 + p) + .08);
       if (!body) return 0;
       if (inS(x, y, z, .2, .32, .5, .1) || inS(x, y, z, -.2, .32, .5, .1) || inS(x, y, z, 0, .08, .54, .07)) return 4;
       if (inS(x, y, z, .37, .14, .42, .08) || inS(x, y, z, -.37, .14, .42, .08)) return 3;
       return y < -.4 ? 1 : 2; }; } },
 { id:'cactus', ko:'선인장', keys:['선인장','cactus'], colors:['#3d9970','#d8f3c4','#ff5d8f','#c1693c'],
   make(R){ const a1 = -.1 + R() * .3, a2 = -.35 + R() * .3;
     return (x, y, z, i, j, k) => { const rr = x * x + z * z;
       if (y < -.6 && y > -.95) return rr < sq(.3 + .12 * (y + .95) / .35) ? 4 : 0;
       if (inS(x, y, z, 0, .92, 0, .12)) return 3;
       const g = (rr < .04 && y >= -.6 && y < .7) || inS(x, y, z, 0, .7, 0, .2)
         || (x > 0 && x < .5 && sq(y - a1) + z * z < .013) || (sq(x - .5) + z * z < .013 && y >= a1 && y < a1 + .42) || inS(x, y, z, .5, a1 + .42, 0, .115)
         || (x < 0 && x > -.5 && sq(y - a2) + z * z < .013) || (sq(x + .5) + z * z < .013 && y >= a2 && y < a2 + .5) || inS(x, y, z, -.5, a2 + .5, 0, .115);
       return g ? (h3(i, j, k, 11) < .07 ? 2 : 1) : 0; }; } },
 { id:'rocket', ko:'로켓', keys:['로켓','우주선','rocket'], colors:['#e63946','#edf2f4','#48cae4','#5c677d'],
   make(R){ const fw = .26 + R() * .12;
     return (x, y, z) => { const rr = x * x + z * z, ax = Math.abs(x), az = Math.abs(z);
       if (inS(x, y, z, 0, .1, .25, .12)) return 3;
       if (y >= -.45 && y < .4 && rr < .0676) return 2;
       if (y >= .4 && y < .92){ const r = .26 * (1 - Math.pow((y - .4) / .52, 1.5)); if (rr < r * r) return 1; }
       if (y >= -.78 && y < -.25){ const e = .24 + fw * (1 - (y + .78) / .53); if ((az < .05 && ax > .2 && ax < e) || (ax < .05 && az > .2 && az < e)) return 1; }
       if (y >= -.6 && y < -.45 && rr < .028) return 4;
       if (y >= -.96 && y < -.6){ const r = .15 * (y + .96) / .36; if (rr < r * r) return 3; }
       return 0; }; } },
 { id:'planet', ko:'행성', keys:['행성','지구','planet'], colors:['#2a6fdb','#4caf50','#ffffff','#d9b87c'],
   make(R){ const p = [R() * 6, R() * 6, R() * 6, R() * 6], tilt = .2 + R() * .3;
     return (x, y, z) => { if (inS(x, y, z, 0, 0, 0, .6)){ if (Math.abs(y) > .5) return 3;
         const n = Math.sin(x * 5 + p[0]) * Math.cos(y * 4 + p[1]) + Math.sin(z * 5 + p[2]) * Math.cos(x * 3 + p[3]) + .5 * Math.sin((x + y + z) * 9); return n > .25 ? 2 : 1; }
       const r = Math.hypot(x, z); return (r > .74 && r < .98 && Math.abs(y + tilt * x) < .04) ? 4 : 0; }; } },
 /* ---- 생물 ---- */
 { id:'cat', ko:'고양이', keys:['고양이','냥','cat'], colors:['#f4a259','#fff1d6','#ff8fab','#2b2d42'],
   make(R){ const tw = R() * 6.28, fat = .32 + R() * .1;
     return (x, y, z) => { const ax = Math.abs(x);
       if (inS(ax, y, z, .14, .14, .6, .07)) return 4;
       if (inS(x, y, z, 0, .02, .64, .06)) return 3;
       if (inS(x, y, z, 0, .1, .3, .36)) return 1;
       if (y > .34 && y < .66 && Math.abs(ax - .22) + Math.abs(z - .3) * .8 < (.66 - y) * .62) return (z > .3 && y < .56) ? 3 : 1;
       if (inE(x, y, z, 0, -.42, -.12, fat, .32, .5)) return (z > .1 && y < -.4) ? 2 : 1;
       if ((sq(ax - .19) + sq(z - .18) < .011 || sq(ax - .19) + sq(z + .42) < .011) && y > -.92 && y < -.5) return y < -.82 ? 2 : 1;
       for (let t = 0; t <= 1; t += .125) if (inS(x, y, z, .12 * Math.sin(t * 4 + tw), -.45 + t * .75, -.62 - .1 * Math.sin(t * 3), .085)) return 1;
       return 0; }; } },
 { id:'dog', ko:'강아지', keys:['강아지','개','멍멍','dog','puppy'], colors:['#c68642','#f3e0c2','#7a4a2b','#1d1d2b'],
   make(R){ const up = R() < .5;
     return (x, y, z) => { const ax = Math.abs(x);
       if (inS(x, y, z, 0, .07, .8, .065)) return 4;
       if (inS(ax, y, z, .14, .2, .58, .06)) return 4;
       if (inS(x, y, z, 0, 0, .6, .18)) return 2;
       if (up ? (y > .3 && y < .62 && Math.abs(ax - .24) + Math.abs(z - .3) * .8 < (.62 - y) * .6) : (Math.abs(ax - .36) < .08 && y > -.12 && y < .36 && Math.abs(z - .28) < .15)) return 3;
       if (inS(x, y, z, 0, .12, .3, .34)) return 1;
       if (inE(x, y, z, 0, -.42, -.12, .34, .32, .52)) return (z > .1 && y < -.4) ? 2 : 1;
       if ((sq(ax - .2) + sq(z - .2) < .012 || sq(ax - .2) + sq(z + .44) < .012) && y > -.92 && y < -.5) return y < -.82 ? 2 : 1;
       for (let t = 0; t <= 1; t += .2) if (inS(x, y, z, 0, -.3 + t * .4, -.62 - t * .12, .08)) return t > .7 ? 2 : 1;
       return 0; }; } },
 { id:'rabbit', ko:'토끼', keys:['토끼','rabbit','bunny'], colors:['#e4e6f0','#ffffff','#ffb3c6','#2b2d42'],
   make(R){ const el = .26 + R() * .12;
     return (x, y, z) => { const ax = Math.abs(x);
       if (inS(ax, y, z, .13, .14, .42, .055)) return 4;
       if (inS(x, y, z, 0, .04, .46, .05)) return 3;
       if (inE(ax, y, z, .15, .36 + el, .1, .085, el, .07)) return z > .13 ? 3 : 1;
       if (inS(x, y, z, 0, .1, .15, .3)) return 1;
       if (inS(x, y, z, 0, -.52, -.46, .13)) return 2;
       if (inE(x, y, z, 0, -.45, -.05, .4, .42, .42)) return (z > .2 && y < -.3) ? 2 : 1;
       if (inE(ax, y, z, .22, -.86, .25, .13, .08, .22)) return 2;
       return 0; }; } },
 { id:'bird', ko:'새', keys:['새','참새','병아리','bird'], colors:['#4cc9f0','#3a86c8','#ffb703','#1d1d2b'],
   make(R){ const cr = R() < .5;
     return (x, y, z) => { const ax = Math.abs(x);
       if (inS(ax, y, z, .14, .36, .44, .055)) return 4;
       if (z > .45 && z < .78 && sq(x) + sq(y - .26) < sq(.11 * (.78 - z) / .33)) return 3;
       if (inS(x, y, z, 0, .3, .22, .28)) return 1;
       if (cr && ax < .05 && y > .5 && y < .74 && Math.abs(z - .15) < .14 - (y - .5) * .3) return 3;
       if (inE(ax, y, z, .42, -.2, -.05, .1, .27, .36)) return 2;
       if (inE(x, y, z, 0, -.22, 0, .4, .38, .5)) return 1;
       if (ax < .16 && y > -.3 && y < -.14 && z < -.42 && z > -.8) return 2;
       if (sq(ax - .13) + sq(z) < .003 && y > -.92 && y < -.55) return 3;
       if (ax > .04 && ax < .22 && y < -.86 && y > -.94 && z > -.05 && z < .2) return 3;
       return 0; }; } },
 { id:'fish', ko:'물고기', keys:['물고기','생선','금붕어','fish'], colors:['#ff7f11','#ffb347','#ffffff','#1d1d2b'],
   make(R){ const st = 8 + R() * 8, fin = .2 + R() * .15;
     return (x, y, z) => { const ax = Math.abs(x);
       if (inS(ax, y, z, .17, .1, .36, .07)) return 4;
       if (inE(x, y, z, 0, 0, .05, .24, .4, .6)) return Math.sin(z * st) > .55 ? 3 : 1;
       if (ax < .06 && z < -.45 && z > -.97 && Math.abs(y) < .06 + (-.45 - z) * .95) return 2;
       if (ax < .06 && Math.abs(z) < .35 && y > .3 && y < .36 + fin * (1 - Math.abs(z) / .35)) return 2;
       if (ax < .06 && z > -.1 && z < .25 && y < -.3 && y > -.36 - .14 * (1 - Math.abs(z - .07) / .18)) return 2;
       return 0; }; } },
 { id:'frog', ko:'개구리', keys:['개구리','frog'], colors:['#57b85a','#d8f3a6','#2f7d32','#1d1d2b'],
   make(){ return (x, y, z, i, j, k) => { const ax = Math.abs(x);
       if (inS(ax, y, z, .26, -.04, .36, .08)) return 4;
       if (inS(ax, y, z, .26, -.08, .24, .17)) return 1;
       if (inE(x, y, z, 0, -.5, 0, .55, .38, .5)){ if (z > .36 && ax < .3 && Math.abs(y + .44) < .04) return 4; return (z > .05 && y < -.52 && ax < .35) ? 2 : (h3(i, j, k, 4) < .07 ? 3 : 1); }
       if (inE(ax, y, z, .5, -.72, -.2, .2, .17, .3)) return 1;
       if (inE(ax, y, z, .34, -.85, .42, .12, .07, .15)) return 3;
       return 0; }; } },
 { id:'octopus', ko:'문어', keys:['문어','오징어','octopus'], colors:['#e56b9f','#ffb3d1','#ffffff','#2b2d42'],
   make(R){ const ph = []; for (let i = 0; i < 8; i++) ph.push(R() * 6.28);
     return (x, y, z, i, j, k) => { const ax = Math.abs(x);
       if (inS(ax, y, z, .2, .22, .42, .085)) return 4;
       if (inE(x, y, z, 0, .25, 0, .48, .55, .48)) return h3(i >> 1, j >> 1, k >> 1, 6) < .1 ? 2 : 1;
       const r = Math.hypot(x, z), t = (r - .2) / .62; if (t < 0 || t > 1) return 0;
       let a = Math.atan2(z, x); if (a < 0) a += 6.2832; const n = Math.floor(a / (Math.PI / 4)) % 8, da = a - (n + .5) * Math.PI / 4;
       const lat = r * Math.sin(da), yc = -.15 - .72 * t + .13 * Math.sin(t * 6 + ph[n]), rad = .11 * (1 - .45 * t);
       return sq(lat) + sq(y - yc) < rad * rad ? (y < yc - .03 ? 2 : 1) : 0; }; } },
 { id:'penguin', ko:'펭귄', keys:['펭귄','penguin'], colors:['#22304a','#f5f7fa','#ffa62b','#11131f'],
   make(R){ const w = .38 + R() * .08;
     return (x, y, z) => { const ax = Math.abs(x);
       if (inS(x, y, z, 0, .36, .3, .085)) return 3;
       if (inS(ax, y, z, .12, .47, .25, .05)) return 2;
       if (inE(ax, y, z, .18, -.88, .2, .14, .07, .2)) return 3;
       if (inE(x, y, z, 0, -.25, .16, w * .72, .5, .3)) return 2;
       if (inS(x, y, z, 0, .42, 0, .3) || inE(x, y, z, 0, -.2, 0, w, .66, .4)) return 1;
       if (inE(ax, y, z, w + .04, -.15, 0, .07, .32, .16)) return 1;
       return 0; }; } },
 { id:'turtle', ko:'거북이', keys:['거북','turtle'], colors:['#3f9b6a','#b7d77a','#2c6e49','#1d1d2b'],
   make(R){ const p = 6 + R() * 3;
     return (x, y, z) => { const ax = Math.abs(x), az = Math.abs(z);
       if (inS(ax, y, z, .09, -.26, .93, .045)) return 4;
       if (y > -.42 && inE(x, y, z, 0, -.42, 0, .6, .5, .68)) return (Math.abs(Math.sin(x * p)) < .22 || Math.abs(Math.sin(z * p)) < .22) ? 3 : 1;
       if (y <= -.42 && y > -.52 && sq(x / .62) + sq(z / .7) < 1) return 2;
       if (inS(x, y, z, 0, -.34, .82, .17) || inS(ax, y, az, .5, -.58, .45, .17) || inS(x, y, z, 0, -.5, -.75, .08)) return 2;
       return 0; }; } },
 { id:'bee', ko:'벌', keys:['벌','꿀벌','bee'], colors:['#ffc300','#eaf6ff','#ffffff','#1d1d2b'],
   make(R){ const st = 9 + R() * 4;
     return (x, y, z) => { const ax = Math.abs(x);
       if (inS(ax, y, z, .17, .1, .42, .085)) return 4;
       if (inE(x, y, z, 0, 0, 0, .36, .34, .55)) return (z < .25 && Math.sin(z * st) > .1) ? 4 : 1;
       if (inE(ax, y, z, .32, .42, -.05, .28, .06, .2)) return 2;
       if (z < -.5 && z > -.78 && sq(x) + sq(y) < sq(.1 * (z + .78) / .28)) return 4;
       if (sq(ax - .1) + sq(z - .4) < .003 && y > .3 && y < .52) return 4;
       return 0; }; } },
 /* ---- 일상·탈것·음식 ---- */
 { id:'car', ko:'자동차', keys:['자동차','차','car'], colors:['#e63946','#ffd166','#a8dadc','#22223b'],
   make(R){ const cl = .3 + R() * .25, van = R() < .3, zb = van ? -.8 : -.55, top = van ? .25 : .15;
     return (x, y, z) => { const ax = Math.abs(x), az = Math.abs(z);
       if (ax > .3 && ax < .5 && sq(y + .62) + sq(az - .5) < .04) return 4;
       if (ax < .42 && az < .85 && y > -.62 && y < -.2) return (z > .76 && ax > .18 && y > -.46 && y < -.32) ? 2 : 1;
       if (ax < .38 && y >= -.2 && y < top && z > zb + (y + .2) * .15 && z < cl - (y + .2) * .6) return (y > top - .09 || Math.abs(z - (zb + cl) / 2) < .05) ? 1 : 3;
       return 0; }; } },
 { id:'mug', ko:'컵', keys:['컵','머그','커피','mug','cup','coffee'], colors:['#3a86ff','#ffffff','#ffbe0b','#4a2c17'],
   make(R){ const hh = .3 + R() * .2;
     return (x, y, z) => { const r = Math.hypot(x + .12, z);
       if (y > -.75 && y < hh && r < .46){ if (r < .37 && y > -.6) return (y > hh - .22 && y < hh - .1) ? 4 : 0; return (y > -.35 && y < -.18) ? 3 : 1; }
       if (x > .3 && sq(Math.hypot(x - .34, y - (hh - .75) / 2) - .27) + z * z < .006) return 1;
       if (y > hh + .08 && y < .95 && inS(x, y, z, -.12 + .09 * Math.sin(y * 9), y, 0, .075)) return 2;
       return 0; }; } },
 { id:'burger', ko:'햄버거', keys:['햄버거','버거','burger'], colors:['#e0a458','#6bbf59','#ffd23f','#6f3b1f'],
   make(R){ const dbl = R() < .4;
     return (x, y, z, i, j, k) => { const r = Math.hypot(x, z), a = Math.atan2(z, x), ax = Math.abs(x), az = Math.abs(z); let y0 = -.85;
       const lay = h => { const lo = y0; y0 += h; return y >= lo && y < y0; };
       if (lay(.2)) return r < .7 ? 1 : 0;
       for (let n = 0; n < (dbl ? 2 : 1); n++){ if (lay(.17)) return r < .73 ? 4 : 0; if (lay(.085)) return (ax < .7 && az < .7) ? 3 : 0; }
       if (lay(.1)) return r < .75 + .05 * Math.sin(a * 9) ? 2 : 0;
       return (sq(x / .72) + sq((y - y0) / .5) + sq(z / .72) < 1) ? ((h3(i, j, k, 2) < .06 && y > y0 + .2) ? 3 : 1) : 0; }; } },
 { id:'donut', ko:'도넛', keys:['도넛','도너츠','donut'], colors:['#d9a05b','#ff8fab','#ffffff','#7a4a2b'],
   make(R){ const p = R() * 6;
     return (x, y, z, i, j, k) => { const r = Math.hypot(x, z), a = Math.atan2(z, x);
       if (sq(r - .52) + sq((y + .3) / .9) >= .075) return 0;
       return y > -.3 + .07 * Math.sin(a * 6 + p) ? (h3(i, j, k, 8) < .12 ? 3 : 2) : 1; }; } },
 { id:'cake', ko:'케이크', keys:['케이크','케익','cake'], colors:['#f6d6ad','#fff5f8','#e63946','#7b2cbf'],
   make(R){ const nc = 1 + Math.floor(R() * 3);
     return (x, y, z) => { const r = Math.hypot(x, z), a = Math.atan2(z, x);
       if (y >= -.85 && y < -.25 && r < .7) return (Math.abs(y + .55) < .04 || (y > -.45 && r > .6 && Math.sin(a * 8) > .2)) ? 2 : 1;
       if (y >= -.25 && y < -.15 && r < .72) return 2;
       if (y >= -.15 && y < .25 && r < .42) return 1;
       if (y >= .25 && y < .33 && r < .44) return 2;
       for (let n = 0; n < nc; n++){ const ca = n * 2.094 + .5, cx = nc > 1 ? .2 * Math.cos(ca) : 0, cz = nc > 1 ? .2 * Math.sin(ca) : 0;
         if (sq(x - cx) + sq(z - cz) < .0035 && y >= .33 && y < .6) return 4; if (inS(x, y, z, cx, .66, cz, .06)) return 3; }
       return 0; }; } },
 { id:'robot', ko:'로봇', keys:['로봇','robot'], colors:['#4d96ff','#cfd8e6','#5ff5e0','#2b2d42'],
   make(R){ const hw = .28 + R() * .1, ant = R() < .6;
     return (x, y, z) => { const ax = Math.abs(x), az = Math.abs(z);
       if (ax < hw && y > .2 && y < .68 && az < .28){ if (z > .2 && Math.abs(ax - .15) < .08 && Math.abs(y - .48) < .07) return 3; if (z > .2 && ax < .14 && Math.abs(y - .3) < .035) return 4; return 2; }
       if (ant && ax < .04 && az < .04 && y >= .68 && y < .86) return 4;
       if (ant && inS(x, y, z, 0, .9, 0, .075)) return 3;
       if (ax < .12 && az < .12 && y > .12 && y <= .2) return 4;
       if (ax < .42 && y > -.45 && y <= .12 && az < .27) return (z > .2 && ax < .2 && Math.abs(y + .12) < .14) ? ((Math.abs(y + .12) < .05 && ax < .08) ? 3 : 4) : 1;
       if (Math.abs(ax - .55) < .09 && y > -.5 && y < .1 && az < .11) return y < -.38 ? 4 : 2;
       if (Math.abs(ax - .2) < .12 && y > -.92 && y <= -.45 && az < .14) return y < -.8 ? 4 : 2;
       if (Math.abs(ax - .2) < .14 && y > -.92 && y < -.8 && z > 0 && z < .26) return 4;
       return 0; }; } },
 { id:'building', ko:'빌딩', keys:['빌딩','건물','아파트','도시','building','city'], colors:['#6c7a96','#aab4c8','#ffe066','#2b3350'],
   make(R){ const h = .3 + R() * .5, w = .3 + R() * .14, h2 = -.4 + R() * .5, sd = Math.floor(R() * 999);
     return (x, y, z) => { if (y < -.95) return 0; const az = Math.abs(z);
       const win = (u, fl) => (Math.floor((y + 1) * 6) % 2 === 1 && Math.floor((u + 2) * 7) % 2 === 0) ? (h3(Math.floor((u + 2) * 7), Math.floor((y + 1) * 6), fl, sd) < .65 ? 3 : 4) : 1;
       const X = x + .25, aX = Math.abs(X);
       if (aX < w && az < w && y < h) return Math.max(aX, az) > w - .09 ? win(aX > az ? z : X, aX > az ? 1 : 2) : 1;
       if (aX < w * .5 && az < w * .5 && y >= h && y < h + .1) return 2;
       if (aX < .035 && az < .035 && y >= h + .1 && y < Math.min(.98, h + .4)) return 4;
       const X2 = x - .45, a2 = Math.abs(X2) / .26, b2 = az / .3;
       if (a2 < 1 && b2 < 1 && y < h2) return Math.max(a2, b2) > .72 ? (win(a2 > b2 ? z : X2, 3) === 1 ? 2 : win(a2 > b2 ? z : X2, 3)) : 2;
       return 0; }; } },
 { id:'bulb', ko:'전구', keys:['전구','램프','아이디어','bulb','lamp'], colors:['#ffe066','#b8bcc8','#ffffff','#6c757d'],
   make(){ return (x, y, z) => { const rr = x * x + z * z;
       if (inS(x, y, z, -.22, .4, .3, .11)) return 3;
       if (inS(x, y, z, 0, .25, 0, .52)) return 1;
       if (y > -.42 && y < -.1 && rr < sq(.24 + .25 * (y + .42) / .32)) return 1;
       if (y > -.8 && y <= -.42 && rr < .05) return (Math.floor((y + 1) * 12) & 1) ? 4 : 2;
       if (y > -.92 && y <= -.8 && rr < .012) return 4;
       return 0; }; } },
 { id:'chair', ko:'의자', keys:['의자','chair'], colors:['#b5651d','#8a4b14','#e63946','#3b2410'],
   make(R){ const bh = .5 + R() * .4, arm = R() < .4;
     return (x, y, z) => { const ax = Math.abs(x), az = Math.abs(z);
       if (ax < .45 && az < .45 && y > -.22 && y < -.1) return 1;
       if (ax < .4 && az < .4 && y >= -.1 && y < -.02) return 3;
       if (Math.abs(ax - .38) < .07 && Math.abs(az - .38) < .07 && y > -.94 && y <= -.22) return 2;
       if (ax < .45 && z < -.33 && z > -.45 && y >= -.1 && y < bh) return (ax > .34 || y > bh - .14 || ax < .07 || Math.abs(y - (bh - .1) / 2) < .05) ? 2 : 0;
       if (arm && Math.abs(ax - .4) < .06 && ((y > .14 && y < .22 && z > -.4 && z < .4) || (z > .3 && z < .42 && y >= -.1 && y < .2))) return 2;
       return 0; }; } },
 { id:'umbrella', ko:'우산', keys:['우산','umbrella'], colors:['#e63946','#ffffff','#ffb703','#3d405b'],
   make(R){ const seg = R() < .5 ? 4 : 3;
     return (x, y, z) => { const rr = x * x + z * z;
       if (y > .12){ const d = rr + sq((y - .12) / .62); if (d < .7225 && d > .5){ let a = Math.atan2(z, x); if (a < 0) a += 6.2832; return (Math.floor(a / (Math.PI / seg)) & 1) ? 2 : 1; } }
       if (rr < .0045 && y > -.72 && y < .72) return 4;
       if (inS(x, y, z, 0, .75, 0, .06)) return 3;
       if (y <= -.72 && x > -.05 && sq(Math.hypot(x - .12, y + .72) - .12) + z * z < .004) return 3;
       return 0; }; } },
 { id:'plane', ko:'비행기', keys:['비행기','airplane','plane','jet'], colors:['#e63946','#f1f3f5','#48cae4','#495057'],
   make(R){ const sw = .1 + R() * .35;
     return (x, y, z) => { const ax = Math.abs(x);
       if (inS(x, y, z, 0, .1, .58, .14)) return 3;
       if (inE(x, y, z, 0, 0, 0, .2, .2, .88)) return 2;
       if (ax < .92 && Math.abs(y + .04) < .045 && Math.abs(z + ax * sw - .05) < .27 - ax * .16) return 1;
       if (ax < .38 && Math.abs(y - .02) < .045 && z < -.6 - ax * .2 && z > -.9 - ax * .1) return 1;
       if (ax < .045 && y > 0 && y < .42 && z < -.55 - y * .4 && z > -.9) return 1;
       if (inE(ax, y, z, .42, -.14, .05 - .42 * sw, .09, .09, .17)) return 4;
       return 0; }; } },
 { id:'boat', ko:'배', keys:['배','보트','돛단배','boat','ship'], colors:['#b5651d','#fff8e7','#e63946','#5c3d1e'],
   make(R){ const two = R() < .4;
     return (x, y, z) => { const ax = Math.abs(x);
       if (y > -.65 && y < -.18 && z > -.82 && z < .95){ const w = .4 * (.55 + .45 * (y + .65) / .47) * (z > .25 ? Math.max(0, 1 - (z - .25) / .72) : 1); if (ax < w) return y > -.27 ? 4 : 1; }
       if (sq(x) + sq(z - .05) < .003 && y >= -.18 && y < .92) return 4;
       if (ax < .045 && y > -.08 && y < .85 && z > .1 && z < .1 + (.85 - y) * .72) return 2;
       if (two && ax < .045 && y > -.08 && y < .6 && z < 0 && z > -(.6 - y) * .9 - .02) return 2;
       if (ax < .045 && y > .8 && y < .92 && z < 0 && z > -.22) return 3;
       return 0; }; } },
 { id:'monitor', ko:'컴퓨터', keys:['컴퓨터','모니터','티비','텔레비전','monitor','computer','tv','pc'], colors:['#495057','#9bf6ff','#4361ee','#212529'],
   make(R){ const sd = Math.floor(R() * 999);
     return (x, y, z) => { const ax = Math.abs(x), az = Math.abs(z);
       if (ax < .78 && y > -.3 && y < .66 && az < .09){ if (z > 0 && ax < .68 && y > -.2 && y < .56) return h3(Math.floor((x + 1) * 6), Math.floor((y + 1) * 6), 0, sd) < .3 ? 2 : 3; return 1; }
       if (ax < .09 && az < .07 && y > -.62 && y <= -.3) return 4;
       if (ax < .36 && az < .24 && y > -.72 && y <= -.62) return 4;
       if (ax < .6 && y > -.94 && y < -.86 && z > .35 && z < .75) return 1;
       return 0; }; } },
 { id:'apple', ko:'사과', keys:['사과','과일','apple'], colors:['#e63946','#52b788','#ffb3b3','#5c3d1e'],
   make(R){ const bite = R() < .35;
     return (x, y, z) => {
       if (x * x + z * z < .0045 && y > .28 && y < .66) return 4;
       if (inE(x, y, z, .17, .56, 0, .17, .06, .09)) return 2;
       if (!inE(x, y, z, 0, -.12, 0, .62, .56, .62) || inS(x, y, z, 0, .5, 0, .2)) return 0;
       if (bite && inS(x, y, z, .62, 0, .2, .3)) return 0;
       if (bite && inS(x, y, z, .62, 0, .2, .4)) return 3;
       return inS(x, y, z, -.3, .12, .42, .12) ? 3 : 1; }; } },
 { id:'icecream', ko:'아이스크림', keys:['아이스크림','icecream'], colors:['#e0a458','#ffc8dd','#bde0fe','#b5651d'],
   make(R){ const sc = 1 + Math.floor(R() * 3);
     return (x, y, z, i, j, k) => { const rr = x * x + z * z;
       if (y > -.96 && y < -.2) return rr < sq(.32 * (y + .96) / .76) ? (((i + j) % 3 === 0 || (k + j) % 3 === 0) ? 4 : 1) : 0;
       for (let n = 0; n < sc; n++) if (inS(x, y, z, (n & 1) ? .04 : -.03, -.08 + n * .36, 0, .36 - n * .05)) return (n & 1) ? 3 : (h3(i, j, k, 3) < .06 ? 4 : 2);
       return 0; }; } },
 { id:'snowman', ko:'눈사람', keys:['눈사람','snowman'], colors:['#f1f3f8','#e63946','#ff9f1c','#3d2c1e'],
   make(R){ const hat = R() < .6;
     return (x, y, z) => { const ax = Math.abs(x), rr = x * x + z * z;
       if (z > .2 && z < .56 && sq(x) + sq(y - .5) < sq(.075 * (.56 - z) / .3)) return 3;
       if (inS(ax, y, z, .1, .58, .2, .045)) return 4;
       if (y > .24 && y < .34 && rr < .09) return 2;
       if (x > .1 && x < .24 && z > .18 && y > 0 && y <= .24 && rr < .1) return 2;
       if (inS(x, y, z, 0, .5, 0, .26) || inS(x, y, z, 0, .06, 0, .34) || inS(x, y, z, 0, -.5, 0, .45)) return (ax < .05 && z > 0 && (Math.abs(y - .08) < .04 || Math.abs(y + .12) < .04 || Math.abs(y + .4) < .04)) ? 4 : 1;
       if (Math.abs(z) < .045 && ax > .3 && ax < .78 && Math.abs(y - .08 - (ax - .3) * .5) < .045) return 4;
       if (hat && ((y > .7 && y < .77 && rr < .07) || (y >= .77 && y < .96 && rr < .03))) return 4;
       return 0; }; } },
 { id:'ufo', ko:'UFO', keys:['ufo','유에프오','비행접시','외계인','alien'], colors:['#ffd60a','#adb5bd','#80ffdb','#495057'],
   make(R){ const beam = R() < .5;
     return (x, y, z, i, j, k) => { const r = Math.hypot(x, z), a = Math.atan2(z, x);
       if (y > .2 && inS(x, y, z, 0, .2, 0, .4)) return 3;
       if (inE(x, y, z, 0, .15, 0, .92, .17, .92)) return (r > .68 && Math.abs(y - .15) < .07 && Math.sin(a * 8) > .3) ? 1 : 2;
       if (y > -.08 && y < .05 && r < .34) return 4;
       if (beam && y <= -.08 && y > -.95 && r < .1 + (-.08 - y) * .32) return h3(i, j, k, 5) < .2 ? 1 : 0;
       return 0; }; } },
 { id:'gift', ko:'선물', keys:['선물','상자','gift','present','box'], colors:['#4361ee','#ffd60a','#ff8fab','#22223b'],
   make(R){ const w = .45 + R() * .15;
     return (x, y, z) => { const ax = Math.abs(x), az = Math.abs(z);
       if (inS(x, y, z, 0, .42, 0, .09)) return 3;
       if (inE(ax, y, z, .2, .45, 0, .19, .12, .12)) return 2;
       if (ax < w && az < w && y > -.85 && y < .15) return (ax < .1 || az < .1) ? 2 : 1;
       if (ax < w + .06 && az < w + .06 && y >= .15 && y < .32) return (ax < .1 || az < .1) ? 2 : 1;
       return 0; }; } },
 { id:'ball', ko:'공', keys:['공','축구공','ball','soccer'], colors:['#f1f3f8','#dee2e6','#ffffff','#212529'],
   make(){ const g = 1.618, V = []; for (const a of [-1, 1]) for (const b of [-1, 1]) V.push([0, a, b * g], [a, b * g, 0], [a * g, 0, b]); const L = Math.hypot(1, g);
     return (x, y, z) => { const r = Math.hypot(x, y, z); if (r >= .7) return 0; for (const v of V) if ((x * v[0] + y * v[1] + z * v[2]) / (r * L || 1) > .9) return 4; return 1; }; } },
];
