'use strict';
/* ---------- 모델 갱신 ---------- */
function rederive(){ if (!S.base) return; S.model = derive(S.base, num('size'), num('chaos'), num('op'), S.seed); invalidate(true); }
function setBase(base, refit){ S.base = base; if (refit){ let r = 0; for (let i = 0; i < base.n; i++){ const d = Math.hypot(base.pos[i * 3], base.pos[i * 3 + 1], base.pos[i * 3 + 2]); if (d > r) r = d; } cam.radius = Math.max(.3, r + base.cell); } rederive(); }
function showRead(it, subs, picked){
  const ul = $('read'); ul.textContent = '';
  for (const o of it.out){ const li = document.createElement('li'); li.className = o.cls; const b = document.createElement('b'); b.textContent = o.kind + (o.to ? ' → ' + o.to : ''); li.append(o.t, ' ', b); ul.append(li); }
  if (picked){ const li = document.createElement('li'); li.className = 'miss'; const b = document.createElement('b'); b.textContent = '형태 키워드 없음 → 시드로 고름'; li.append(subs[0].ko, ' ', b); ul.append(li); }
}
function regenGen(refit){
  const N = num('n'), g = generate($('kw').value, S.nonce, N); S.src = 'gen'; S.seed = g.seed; S.label = 'pixel-splat-' + g.subs.map(s => s.id).join('-');
  showRead(g.it, g.subs, g.picked); setBase(g.base, refit);
  const sd = g.seed.toString(16).padStart(8, '0');
  $('stat').textContent = `스플랫 ${g.base.n.toLocaleString('ko-KR')}개 · 격자 ${N}³ · 형태 ${g.subs.map(s => s.ko).join('+')} · 팔레트 ${g.it.mood ? g.it.mood.ko : '기본'} · 시드 ${sd}`;
  canvas.setAttribute('aria-label', `${g.subs.map(s => s.ko).join(', ')} 형태의 픽셀 스플랫 미리보기`);
}
function regenFile(refit){
  if (!S.pts) return;
  try { const base = pixelize(S.pts, num('ires'), num('ik'), num('icut'), chk('iflip')); S.src = 'file'; S.seed = 777; S.label = 'pixel-splat-' + (S.fileName.replace(/\.[^.]+$/, '').replace(/[^\w가-힣-]+/g, '_') || 'import');
    $('read').textContent = ''; setBase(base, refit);
    $('stat').textContent = `스플랫 ${base.n.toLocaleString('ko-KR')}개 · 원본 ${S.pts.n.toLocaleString('ko-KR')}개 · 복셀 ${num('ires')} · 색 ${num('ik')}개 · ${S.fileName}`;
    canvas.setAttribute('aria-label', `${S.fileName}을 픽셀화한 스플랫 미리보기`);
  } catch (e){ $('stat').textContent = '픽셀화 실패: ' + e.message; }
}

/* ---------- 입력 ---------- */
const FMT = { amp:v => (+v).toFixed(1) + '×', speed:v => (+v).toFixed(1) + '×', n:v => v + '³', size:v => (+v).toFixed(2) + 'σ', chaos:v => (+v).toFixed(2), op:v => (+v).toFixed(2), ps:v => v + 'px', hard:v => (+v).toFixed(1), square:v => (+v).toFixed(2), ires:v => v, ik:v => v, icut:v => (+v).toFixed(2) };
const syncOut = () => { for (const id in FMT) $(id + 'O').textContent = FMT[id]($(id).value); };
function syncPreset(){ const px = num('hard') > 1.4 && num('ps') > 1; $('pPixel').setAttribute('aria-pressed', String(px)); $('pGauss').setAttribute('aria-pressed', String(num('hard') <= 1 && num('ps') === 1 && num('square') === 0)); }
$('panel').addEventListener('submit', e => { e.preventDefault(); S.nonce = 0; regenGen(true); });
$('reroll').addEventListener('click', () => { S.nonce++; regenGen(true); });
$('rand').addEventListener('click', () => { const pick = a => a[Math.floor(Math.random() * a.length)], w = [pick(SUBJ).ko];
  if (Math.random() < .3) w.push(pick(SUBJ).ko); if (Math.random() < .55) w.push(pick(MOOD).ko); if (Math.random() < .35) w.push(pick(MODS).ko); if (Math.random() < .35) w.push(pick(ACC).ko);
  $('kw').value = [...new Set(w)].join(', '); S.nonce = Math.floor(Math.random() * 1e6);
  if (!reduce){ const o = $('anim').options; $('anim').value = o[1 + Math.floor(Math.random() * (o.length - 1))].value; }
  regenGen(true); });
for (const id of ['amp', 'speed']) $(id).addEventListener('input', () => { syncOut(); invalidate(true); });
$('anim').addEventListener('input', () => invalidate(true));
$('n').addEventListener('input', () => { syncOut(); if (S.src === 'gen') regenGen(false); });
for (const id of ['size', 'chaos', 'op']) $(id).addEventListener('input', () => { syncOut(); rederive(); });
for (const id of ['ps', 'hard', 'square']) $(id).addEventListener('input', () => { syncOut(); syncPreset(); invalidate(false); });
for (const id of ['levels', 'dither', 'cut', 'ortho', 'snap', 'bg']) $(id).addEventListener('input', () => invalidate(false));
$('spin').addEventListener('input', () => invalidate(false));
for (const id of ['ires', 'ik', 'icut']){ $(id).addEventListener('input', syncOut); $(id).addEventListener('change', () => regenFile(false)); }
$('iflip').addEventListener('input', () => regenFile(false));
function preset(v){ for (const k in v){ const el = $(k); if (el.type === 'checkbox') el.checked = v[k]; else el.value = v[k]; } syncOut(); syncPreset(); invalidate(false); }
$('pPixel').addEventListener('click', () => preset({ ps:5, hard:5, square:1, cut:true, ortho:true }));
$('pGauss').addEventListener('click', () => preset({ ps:1, hard:1, square:0, cut:false, ortho:false, levels:'0', dither:false, snap:false }));
function chipRow(ul, list){ for (const it of list){ const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.textContent = it.ko; b.setAttribute('aria-label', it.ko + ' 키워드 추가');
    b.addEventListener('click', () => { const k = $('kw'); k.value = (k.value.trim() ? k.value.trim().replace(/[,\s]+$/, '') + ', ' : '') + it.ko; S.nonce = 0; regenGen(true); }); li.append(b); ul.append(li); } }
chipRow($('chipS'), SUBJ); chipRow($('chipM'), MOOD); chipRow($('chipX'), MODS.concat(ACC));
$('file').addEventListener('change', async e => { const f = e.target.files[0]; if (!f) return; $('stat').textContent = f.name + ' 읽는 중…';
  try { const buf = await f.arrayBuffer(); S.pts = /\.splat$/i.test(f.name) ? parseSplat(buf) : parsePLY(buf); S.fileName = f.name; regenFile(true); }
  catch (err){ $('stat').textContent = '파일을 읽지 못했습니다: ' + err.message; } });

/* 시점 조작: 포인터, 휠, 키보드, 버튼 */
const drag = new Map(); let pinch = 0;
const zoomBy = k => { cam.zoom = Math.max(.3, Math.min(6, cam.zoom * k)); invalidate(true); };
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); drag.set(e.pointerId, [e.clientX, e.clientY]); pinch = 0; });
canvas.addEventListener('pointermove', e => { const p = drag.get(e.pointerId); if (!p) return;
  if (drag.size === 1){ cam.yaw -= (e.clientX - p[0]) * .01; cam.pitch = Math.max(-1.5, Math.min(1.5, cam.pitch + (e.clientY - p[1]) * .01)); invalidate(true); }
  drag.set(e.pointerId, [e.clientX, e.clientY]);
  if (drag.size === 2){ const [a, b] = [...drag.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoomBy(d / pinch); pinch = d; } });
for (const ev of ['pointerup', 'pointercancel']) canvas.addEventListener(ev, e => { drag.delete(e.pointerId); pinch = 0; });
canvas.addEventListener('wheel', e => { e.preventDefault(); zoomBy(Math.exp(-e.deltaY * .0015)); }, { passive:false });
canvas.addEventListener('keydown', e => { const k = e.key; let used = true;
  if (k === 'ArrowLeft') cam.yaw -= .15; else if (k === 'ArrowRight') cam.yaw += .15; else if (k === 'ArrowUp') cam.pitch = Math.min(1.5, cam.pitch + .1); else if (k === 'ArrowDown') cam.pitch = Math.max(-1.5, cam.pitch - .1);
  else if (k === '+' || k === '=') zoomBy(1.15); else if (k === '-' || k === '_') zoomBy(1 / 1.15); else used = false;
  if (used){ e.preventDefault(); invalidate(true); } });
$('zin').addEventListener('click', () => zoomBy(1.2)); $('zout').addEventListener('click', () => zoomBy(1 / 1.2));
$('vreset').addEventListener('click', () => { cam.yaw = .7; cam.pitch = .42; cam.zoom = 1; invalidate(true); });

/* 저장 */
const dlReady = (async () => { try { return window.claude && window.claude.use ? await window.claude.use('downloads') : null; } catch { return null; } })();
async function save(filename, blob){
  const dl = await dlReady;
  if (dl){ try { await dl.save({ filename, data:blob }); toast('저장했습니다: ' + filename); }
    catch (e){ const c = e && e.code; toast(c === 'declined' ? '저장을 취소했습니다.' : c === 'rate_limited' ? '저장 창이 이미 열려 있습니다. 잠시 뒤 다시 눌러 주세요.' : c === 'too_large' ? '파일이 너무 큽니다. 격자 해상도를 낮춰 다시 시도하세요.' : '이 화면에서는 저장할 수 없습니다 (' + (c || '알 수 없는 오류') + ').'); }
    return; }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('브라우저에 다운로드를 요청했습니다: ' + filename + ' (보기 환경에 따라 막힐 수 있습니다)'); }
  catch { toast('이 화면에서는 저장할 수 없습니다.'); }
}
function buildZip(){ const m = S.model, flip = chk('exFlip');
  const readme = `픽셀 스플랫 공방 내보내기\n\n스플랫 수: ${m.n}\n좌표계: ${flip ? 'X축 180도 회전 적용 (Y 아래)' : 'Y 위, 오른손 좌표계'}\n\n${S.label}.ply\n  INRIA 3D Gaussian Splatting 형식, binary_little_endian, float32 17개\n  x y z nx ny nz f_dc_0..2 opacity scale_0..2 rot_0..3\n  색 = 0.5 + 0.28209479 * f_dc, 불투명도 = sigmoid(opacity), 스케일 = exp(scale), 회전 = (w, x, y, z)\n  구면조화는 0차만 있습니다 (f_rest 없음).\n\n${S.label}.splat\n  antimatter15/splat 형식, 스플랫당 32바이트\n  위치 float32 x3, 스케일 float32 x3, RGBA uint8 x4, 회전 uint8 x4 (q * 128 + 128)\n\n픽셀 화면 효과(단단한 경계, 사각 모양, 저해상도)는 파일에 들어 있지 않습니다.\n`;
  return zipStore([{ name:S.label + '.ply', data:exportPLY(m, flip) }, { name:S.label + '.splat', data:exportSplat(m, flip) }, { name:'README.txt', data:new TextEncoder().encode(readme) }]); }
$('exZip').addEventListener('click', () => { if (!S.model || !S.model.n){ toast('내보낼 스플랫이 없습니다.'); return; } save(S.label + '.zip', buildZip()); });
$('exPng').addEventListener('click', () => { if (!gl) return; draw(); const c = document.createElement('canvas'); c.width = lowW * 4; c.height = lowH * 4; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(canvas, 0, 0, c.width, c.height);
  c.toBlob(b => b ? save(S.label + '.png', b) : toast('PNG를 만들지 못했습니다.'), 'image/png'); });

$('exVid').addEventListener('click', () => {
  if (!gl || !canvas.captureStream || !window.MediaRecorder){ toast('이 브라우저는 화면 녹화를 지원하지 않습니다.'); return; }
  const mime = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find(m => MediaRecorder.isTypeSupported(m));
  if (!mime){ toast('이 브라우저에서 쓸 수 있는 영상 형식이 없습니다.'); return; }
  let rec; try { rec = new MediaRecorder(canvas.captureStream(30), { mimeType:mime, videoBitsPerSecond:8e6 }); } catch { toast('녹화를 시작하지 못했습니다.'); return; }
  const parts = [], btn = $('exVid'); rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
  rec.onstop = () => { S.rec = false; btn.disabled = false; if (!parts.length){ toast('녹화된 내용이 없습니다.'); return; } save(S.label + (mime.includes('mp4') ? '.mp4' : '.webm'), new Blob(parts, { type:mime.split(';')[0] })); };
  S.rec = true; btn.disabled = true; rec.start(); toast('녹화 중입니다. 4초 뒤 저장 창이 뜹니다.'); invalidate(true); setTimeout(() => rec.stop(), 4000); });

/* 시작 */
syncOut();
if (reduce){ $('spin').checked = false; $('anim').value = 'none'; }
if (!gl){ $('glfail').hidden = false; $('hint').hidden = true; }
else { try { initGL(); new ResizeObserver(() => invalidate(false)).observe(canvas); } catch (e){ $('glfail').hidden = false; $('glfail').textContent = '셰이더를 준비하지 못했습니다: ' + e.message; } }
regenGen(true); syncPreset();
window.__forge = { S, cam, buildZip, parsePLY, parseSplat, exportPLY, exportSplat, pixelize, generate, SUBJ, draw, show(k){ $('kw').value = k; S.nonce = 0; regenGen(true); sortDirty = true; draw(); } };
