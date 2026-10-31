// Komponen fluida bersama: air bergelombang, tangki kaca, panah tekanan, gelembung, molekul air.
// Semua dalam koordinat SVG 1920×1080 (dipakai di dalam <Stage>). Gerak dihitung dari waktu global.
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {rand} from '../anim';
import {C} from '../theme';
import {hue} from './primitives';

const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};

/** Permukaan air bergelombang (path atas) dari x0 ke x1 pada ketinggian y. */
export const wavePath = (x0: number, x1: number, y: number, t: number, amp = 4, k = 0.035, seed = 0) => {
  const n = Math.max(8, Math.round((x1 - x0) / 24));
  return Array.from({length: n + 1}, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / n;
    const yy = y + amp * Math.sin(x * k + t * 2.2 + seed) * 0.6 + amp * 0.4 * Math.sin(x * k * 2.3 - t * 3.1 + seed * 2);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${yy.toFixed(1)}`;
  }).join(' ');
};

/**
 * Badan air: gradien biru (makin gelap ke bawah = makin besar tekanan), permukaan bergelombang,
 * pita cahaya (kaustik) yang bergeser, dan opsi gelembung naik. (x, y) = kiri-atas permukaan.
 */
export const Water: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  amp?: number;
  bubbles?: number;
  opacity?: number;
  seed?: number;
  caustics?: boolean;
}> = ({x, y, w, h, color = C.water, amp = 4, bubbles = 0, opacity = 1, seed = 0, caustics = true}) => {
  const t = useT();
  if (opacity <= 0.001 || h <= 0) return null;
  const id = `wg-${Math.round(x)}-${Math.round(y)}-${Math.round(w)}`;
  const top = wavePath(x, x + w, y, t, amp, 0.035, seed);
  const body = `${top} L${x + w},${y + h} L${x},${y + h} Z`;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={`url(#${id})`} />
      {caustics ? (
        <g clipPath={`url(#${id}-c)`} opacity={0.18}>
          {Array.from({length: 5}, (_, i) => {
            const cx = x + ((((i * 0.23 + t * 0.03 + seed * 0.1) % 1) + 1) % 1) * w;
            return <path key={i} d={`M${cx - 30},${y} L${cx + 40},${y} L${cx + 120},${y + h} L${cx + 40},${y + h} Z`} fill="#fff" opacity={0.25 + 0.2 * Math.sin(t * 1.3 + i)} />;
          })}
        </g>
      ) : null}
      <path d={top} fill="none" stroke="#cfeaff" strokeOpacity={0.7} strokeWidth={2.5} />
      {bubbles > 0 ? <Bubbles x={x + 10} y={y + 10} w={w - 20} h={h - 20} n={bubbles} seed={seed} /> : null}
    </g>
  );
};

/** Gelembung naik di dalam area (x, y, w, h): bergoyang, muncul halus di bawah dan pecah di atas. */
export const Bubbles: React.FC<{x: number; y: number; w: number; h: number; n?: number; seed?: number; color?: string; speed?: number}> = ({
  x,
  y,
  w,
  h,
  n = 8,
  seed = 0,
  color = '#d8f0ff',
  speed = 1,
}) => {
  const t = useT();
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const ph = (((t * (0.12 + rand(i * 3.3 + seed) * 0.15) * speed + rand(i * 7.1 + seed)) % 1) + 1) % 1;
        const by = y + h - ph * h;
        const bx = x + rand(i * 5.9 + seed) * w + 6 * Math.sin(t * 2 + i);
        const r = 2 + rand(i * 1.7 + seed) * 5;
        const op = Math.min(1, ph * 6) * (1 - ph);
        return (
          <g key={i} opacity={op * 0.8}>
            <circle cx={bx} cy={by} r={r} fill="none" stroke={color} strokeWidth={1.4} />
            <circle cx={bx - r * 0.35} cy={by - r * 0.35} r={r * 0.28} fill="#fff" opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
};

/** Tangki kaca terbuka berisi air sampai ketinggian `level` (piksel dari dasar). (x, y) = kiri-bawah luar. */
export const Tank: React.FC<{x: number; y: number; w: number; h: number; level: number; color?: string; bubbles?: number; opacity?: number; seed?: number}> = ({
  x,
  y,
  w,
  h,
  level,
  color = C.water,
  bubbles = 4,
  opacity = 1,
  seed = 0,
}) => {
  if (opacity <= 0.001) return null;
  const wall = 6;
  return (
    <g opacity={opacity}>
      <ellipse cx={x + w / 2} cy={y + 10} rx={w * 0.55} ry={14} fill="#000" opacity={0.35} />
      <Water x={x + wall} y={y - wall - level} w={w - 2 * wall} h={level} color={color} bubbles={bubbles} seed={seed} />
      <path d={`M${x},${y - h} L${x},${y} L${x + w},${y} L${x + w},${y - h}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={wall} strokeLinejoin="round" />
      <line x1={x + 14} y1={y - h + 14} x2={x + 14} y2={y - 20} stroke="#fff" strokeOpacity={0.18} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

/**
 * Panah tekanan: tegak lurus permukaan, menunjuk ke permukaan yang ditekan.
 * (x, y) = titik sentuh pada permukaan; (nx, ny) = normal yang mengarah KE LUAR dari permukaan (ke fluida);
 * panjang = L piksel. Panah menunjuk dari fluida ke permukaan, dengan denyut halus.
 */
export const PressureArrow: React.FC<{x: number; y: number; nx: number; ny: number; L: number; color?: string; width?: number; opacity?: number}> = ({
  x,
  y,
  nx,
  ny,
  L,
  color = C.press,
  width = 4,
  opacity = 1,
}) => {
  const t = useT();
  if (opacity <= 0.001 || L < 4) return null;
  const pul = 1 + 0.06 * Math.sin(t * 4 + x * 0.05 + y * 0.03);
  const len = L * pul;
  const x1 = x + nx * len;
  const y1 = y + ny * len;
  const hx = x + nx * 2;
  const hy = y + ny * 2;
  const s = Math.max(7, width * 2.4);
  // ujung panah segitiga di (hx, hy)
  const px = -ny;
  const py = nx;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={hx + nx * s} y2={hy + ny * s} stroke={hue(color)} strokeWidth={width} strokeLinecap="round" />
      <path d={`M${hx},${hy} L${hx + nx * s + px * s * 0.6},${hy + ny * s + py * s * 0.6} L${hx + nx * s - px * s * 0.6},${hy + ny * s - py * s * 0.6} Z`} fill={hue(color)} />
    </g>
  );
};

/** Molekul air (O merah + dua H putih), sudut 104,5°, berputar/bergetar halus. */
export const WaterMolecule: React.FC<{x: number; y: number; s?: number; rot?: number; opacity?: number; glow?: boolean}> = ({x, y, s = 1, rot = 0, opacity = 1, glow}) => {
  if (opacity <= 0.001) return null;
  const a = (104.5 / 2) * (Math.PI / 180);
  const d = 26 * s;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
      {glow ? <circle r={50 * s} fill="url(#soft-water)" /> : null}
      {[-1, 1].map((k) => (
        <g key={k}>
          <line x1={0} y1={0} x2={Math.sin(a) * d * k} y2={Math.cos(a) * d} stroke="#cfd8f0" strokeWidth={5 * s} />
          <circle cx={Math.sin(a) * d * k} cy={Math.cos(a) * d} r={9 * s} fill="#f2f5ff" stroke="#9aa6c8" strokeWidth={1.2} />
        </g>
      ))}
      <circle r={15 * s} fill="#ff5a6e" stroke="#ffb0bb" strokeWidth={1.2} />
      <circle cx={-4 * s} cy={-5 * s} r={4 * s} fill="#fff" opacity={0.6} />
    </g>
  );
};

/** Pengukur kedalaman di sisi wadah: garis bertanda dengan label (h). */
export const DepthRuler: React.FC<{x: number; yTop: number; yBot: number; ticks?: number; color?: string; opacity?: number}> = ({x, yTop, yBot, ticks = 6, color = C.muted, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity} stroke={hue(color)} strokeWidth={2}>
      <line x1={x} y1={yTop} x2={x} y2={yBot} />
      {Array.from({length: ticks + 1}, (_, i) => {
        const y = yTop + ((yBot - yTop) * i) / ticks;
        return <line key={i} x1={x - (i % 2 ? 6 : 12)} y1={y} x2={x} y2={y} />;
      })}
    </g>
  );
};
