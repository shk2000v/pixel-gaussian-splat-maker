'use strict';
const $ = id => document.getElementById(id);
const SH_C0 = 0.28209479177387814;

/* ---------- 난수 ---------- */
function hashStr(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function h3(i, j, k, s){ let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 2147483647) ^ s; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }

/* ---------- 색 ---------- */
function hex2rgb(h){ const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgb2hsl(r, g, b){ r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; const d = mx - mn;
  if (d > 1e-6){ s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, s, l]; }
function hsl2rgb(h, s, l){ const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; let r = 0, g = 0, b = 0;
  if (h < 60){ r = c; g = x; } else if (h < 120){ r = x; g = c; } else if (h < 180){ g = c; b = x; } else if (h < 240){ g = x; b = c; } else if (h < 300){ r = x; b = c; } else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]; }
function toward(h, target, amt){ let d = ((target - h + 540) % 360) - 180; d = Math.max(-amt, Math.min(amt, d)); return (h + d + 360) % 360; }
const clamp01 = v => Math.max(0, Math.min(1, v));
/* 픽셀아트식 3단 명암: 어두운 쪽은 파랑 쪽으로, 밝은 쪽은 노랑 쪽으로 색상을 민다 */
function ramp(hex){ const [r, g, b] = hex2rgb(hex); const [h, s, l] = rgb2hsl(r, g, b);
  return [hsl2rgb(toward(h, 250, 14), clamp01(s + 0.06), clamp01(l - 0.17)), [r, g, b], hsl2rgb(toward(h, 55, 10), clamp01(s - 0.02), clamp01(l + 0.13))]; }

