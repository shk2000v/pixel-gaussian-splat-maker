'use strict';
const MOOD = [
 { id:'fire', ko:'불', keys:['불','불꽃','용암','화염','fire','lava'], colors:['#e25822','#ffb627','#fff1a8','#3b1010'] },
 { id:'ice', ko:'얼음', keys:['얼음','눈','겨울','ice','snow','frost'], colors:['#7fd6f2','#e8f7ff','#4f8fd9','#1d2b53'] },
 { id:'forest', ko:'숲', keys:['숲','정글','자연','forest'], colors:['#3f8f3a','#7a5230','#e2c044','#1f3320'] },
 { id:'night', ko:'밤', keys:['밤','우주','어둠','night','dark'], colors:['#3b3f8f','#8b6fd6','#f2e16b','#11122b'] },
 { id:'candy', ko:'사탕', keys:['사탕','캔디','달콤','candy'], colors:['#ff7ab8','#ffe3f1','#7ae0d0','#7a3b69'] },
 { id:'gold', ko:'황금', keys:['황금','금','gold'], colors:['#e8b923','#fff2a0','#c8742a','#4a2c0a'] },
 { id:'poison', ko:'독', keys:['독','저주','마녀','poison'], colors:['#7bd43a','#a04fd6','#e9ff70','#1f1433'] },
 { id:'ocean', ko:'바다', keys:['바다','물','ocean','sea'], colors:['#1f8fc4','#8ee3e0','#f2d58a','#0e2a47'] },
 { id:'desert', ko:'사막', keys:['사막','모래','desert'], colors:['#d9a556','#f0d9a0','#c1502e','#5a3420'] },
 { id:'sunset', ko:'노을', keys:['노을','석양','sunset'], colors:['#f26b4f','#f7b267','#8a4fa3','#2d1b45'] },
 { id:'retro', ko:'레트로', keys:['레트로','게임보이','retro','gameboy'], colors:['#8bac0f','#9bbc0f','#306230','#0f380f'] },
 { id:'mono', ko:'흑백', keys:['흑백','회색','mono'], colors:['#bdbdbd','#f2f2f2','#7a7a7a','#1e1e1e'] },
 { id:'pastel', ko:'파스텔', keys:['파스텔','pastel'], colors:['#ffc8dd','#bde0fe','#fdffb6','#9b89b3'] },
 { id:'neon', ko:'네온', keys:['네온','사이버','neon','cyber'], colors:['#ff2a6d','#05d9e8','#f9f871','#1a1033'] },
 { id:'autumn', ko:'가을', keys:['가을','단풍','autumn'], colors:['#d1603d','#e9b44c','#8a5a2b','#3d2314'] },
 { id:'steel', ko:'강철', keys:['강철','금속','철','steel','metal'], colors:['#8d99ae','#edf2f4','#ef233c','#2b2d42'] },
];
/* 변형: 어떤 형태에나 겹쳐 쓰는 키워드 */
const MODS = [
 { id:'wide', ko:'뚱뚱한', keys:['뚱뚱','통통','wide','fat'] }, { id:'tall', ko:'길쭉한', keys:['길쭉','키큰','tall'] },
 { id:'twin', ko:'쌍둥이', keys:['쌍둥이','둘','두','twin'] }, { id:'trio', ko:'셋', keys:['셋','세','무리','trio'] },
 { id:'broken', ko:'부서진', keys:['부서진','낡은','폐허','broken'] }, { id:'striped', ko:'줄무늬', keys:['줄무늬','striped'] }, { id:'dotted', ko:'점박이', keys:['점박이','물방울','dotted'] },
];
const ACC = [
 { id:'hat', ko:'모자', keys:['모자','hat'] }, { id:'crown', ko:'왕관', keys:['왕관','crown'] },
 { id:'halo', ko:'후광', keys:['후광','천사','halo'] }, { id:'pedestal', ko:'받침대', keys:['받침대','단상','pedestal'] },
];
/* 영문 키는 정확히 일치(복수형 s 허용), 한글 1글자 키도 정확히 일치, 한글 2글자 이상은 포함 */
const hit = (t, keys) => keys.some(k => /^[a-z]+$/.test(k) ? (t === k || t === k + 's') : k.length < 2 ? t === k : t.includes(k));
function interpret(text){
  const toks = text.toLowerCase().split(/[\s,;、·\/|]+/).filter(Boolean).slice(0, 12);
  const subs = [], out = [], mods = new Set(), acc = new Set(); let mood = null;
  for (const t of toks){
    const s = SUBJ.find(s => hit(t, s.keys));
    if (s){ if (subs.length < 3 && !subs.includes(s)) subs.push(s); out.push({ t, kind:'형태', to:s.ko, cls:'hit' }); continue; }
    const m = MOOD.find(m => hit(t, m.keys));
    if (m){ if (!mood) mood = m; out.push({ t, kind:'팔레트', to:m.ko, cls:'hit' }); continue; }
    const d = MODS.find(m => hit(t, m.keys));
    if (d){ mods.add(d.id); out.push({ t, kind:'변형', to:d.ko, cls:'hit' }); continue; }
    const a = ACC.find(m => hit(t, m.keys));
    if (a){ acc.add(a.id); out.push({ t, kind:'장식', to:a.ko, cls:'hit' }); continue; }
    out.push({ t, kind:'시드만', to:'', cls:'miss' });
  }
  return { toks, subs, mood, mods, acc, out };
}
/* 변형과 받침대를 형태 함수에 씌운다 */
function wrap(f, md, acc, R){
  const tall = md.has('tall'), wide = md.has('wide'), str = md.has('striped'), dot = md.has('dotted'), bites = [];
  if (md.has('broken')) for (let i = 0; i < 7; i++) bites.push([(R() - .5) * 1.6, R() * 1.5 - .6, (R() - .5) * 1.6, .15 + R() * .15]);
  const ped = acc.has('pedestal'), sc = acc.size ? .8 : 1, pb = ped ? .18 : 0;
  return (x, y, z, i, j, k) => {
    if (ped && y < -1 + pb) return x * x + z * z < .4 ? 6 : 0;
    let X = x / sc, Y = (y + 1 - pb) / sc - 1, Z = z / sc;
    if (tall){ X /= .7; Z /= .7; } if (wide) Y = (Y + 1) / .7 - 1;
    if (Math.abs(X) > 1 || Y > 1 || Y < -1 || Math.abs(Z) > 1) return 0;
    let s = f(X, Y, Z, i, j, k); if (!s) return 0;
    for (const b of bites) if (inS(X, Y, Z, b[0], b[1], b[2], b[3])) return 0;
    if (str && s === 1 && (Math.floor((Y + 1) * 4.5) & 1)) s = 2;
    if (dot && s === 1 && h3(i >> 1, j >> 1, k >> 1, 21) < .2) s = 3;
    return s; };
}
/* 꼭대기에 올리는 장식: 가장 높은 칸들의 중심을 찾아 그 위에 쌓는다 */
function decorate(g, N, acc){
  if (!(acc.has('hat') || acc.has('crown') || acc.has('halo'))) return;
  const cell = 2 / N; let top = -1;
  for (let j = N - 1; j >= 0 && top < 0; j--) for (let k = 0; k < N && top < 0; k++) for (let i = 0; i < N; i++) if (g[i + N * (j + N * k)] && g[i + N * (j + N * k)] !== 6){ top = j; break; }
  if (top < 0) return; let cx = 0, cz = 0, cn = 0;
  for (let j = Math.max(0, top - 1); j <= top; j++) for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) if (g[i + N * (j + N * k)]){ cx += (i + .5) / N * 2 - 1; cz += (k + .5) / N * 2 - 1; cn++; }
  cx /= cn; cz /= cn; const ty = (top + 1) / N * 2 - 1, hat = acc.has('hat'), crown = acc.has('crown'), halo = acc.has('halo');
  for (let j = top + 1; j < N; j++){ const yr = (j + .5) / N * 2 - 1 - ty; if (yr > .34) break;
    for (let k = 0; k < N; k++) for (let i = 0; i < N; i++){ const x = (i + .5) / N * 2 - 1 - cx, z = (k + .5) / N * 2 - 1 - cz, r = Math.hypot(x, z); let s = 0;
      if (hat) s = (yr < cell && r < .27) ? 7 : (yr >= cell && yr < cell * 2 && r < .17) ? 5 : (yr >= cell * 2 && yr < .27 && r < .17) ? 7 : 0;
      else if (crown) s = (r > .08 && r < .2 && (yr < .09 || (yr < .19 && Math.sin(Math.atan2(z, x) * 5) > .1))) ? 5 : 0;
      if (!s && halo && yr > .12 && yr < .12 + cell * 1.01 && r > .15 && r < .26) s = 5;
      if (s && !g[i + N * (j + N * k)]) g[i + N * (j + N * k)] = s; } }
}

/* ---------- 복셀 → 겉면 스플랫 ---------- */
const LIGHT = (() => { const v = [-.45, .8, .55], l = Math.hypot(...v); return v.map(c => c / l); })();
const EXTRA = ['#f2c230', '#8d93a6', '#2b2d42'];   /* 슬롯 5 금색, 6 돌, 7 검정: 장식 전용 */
function buildVoxels(f, N, colors, seed, ox, P, C, acc){
  const g = new Uint8Array(N * N * N), at = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= N || j >= N || k >= N) ? 0 : g[i + N * (j + N * k)];
  for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){
    g[i + N * (j + N * k)] = f((i + .5) / N * 2 - 1, (j + .5) / N * 2 - 1, (k + .5) / N * 2 - 1, i, j, k) | 0; }
  decorate(g, N, acc);
  const ramps = colors.concat(EXTRA).map(ramp);
  for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++){
    const s = g[i + N * (j + N * k)]; if (!s) continue;
    if (at(i + 1, j, k) && at(i - 1, j, k) && at(i, j + 1, k) && at(i, j - 1, k) && at(i, j, k + 1) && at(i, j, k - 1)) continue;
    let nx = 0, ny = 0, nz = 0;
    for (let c = -1; c <= 1; c++) for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (!at(i + a, j + b, k + c)){ nx += a; ny += b; nz += c; }
    const nl = Math.hypot(nx, ny, nz) || 1;
    const lam = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / nl + (h3(i, j, k, seed) - .5) * .14;
    const col = ramps[s - 1][lam > .38 ? 2 : lam < -.12 ? 0 : 1];
    P.push((i + .5) / N * 2 - 1 + ox, (j + .5) / N * 2 - 1, (k + .5) / N * 2 - 1); C.push(col[0], col[1], col[2]);
  }
}
function generate(text, nonce, N){
  const it = interpret(text); const seed = (hashStr(it.toks.join('|')) ^ Math.imul(nonce + 1, 2654435761)) >>> 0; const R = mulberry32(seed);
  let subs = it.subs, picked = false;
  if (!subs.length){ subs = [SUBJ[Math.floor(R() * SUBJ.length)]]; picked = true; }
  const copies = it.mods.has('trio') ? 3 : it.mods.has('twin') ? 2 : 1, list = [];
  for (const s of subs) for (let c = 0; c < copies && list.length < 4; c++) list.push(s);
  const P = [], C = [];
  list.forEach((s, idx) => buildVoxels(wrap(s.make(R), it.mods, it.acc, R), N, it.mood ? it.mood.colors : s.colors, seed, (idx - (list.length - 1) / 2) * 1.95, P, C, it.acc));
  return { base:{ n:P.length / 3, pos:new Float32Array(P), col:new Uint8Array(C), cell:2 / N }, it, seed, subs, picked };
}

