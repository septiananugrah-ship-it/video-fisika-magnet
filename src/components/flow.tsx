// Komponen aliran fluida (Fluida Dinamis). Semua dalam koordinat SVG 1920×1080, dipakai di dalam <Stage>.
// Gerak dihitung dari waktu global (tanpa state), jadi deterministik per frame.
//
//  - Pipe       : pipa mendatar berpenampang berubah; partikel mengalir sesuai KONTINUITAS
//                 (kecepatan ∝ 1/luas, luas pipa bulat ∝ r²) + garis arus samar.
//  - Streamline : partikel/garis yang mengalir sepanjang lintasan bebas (polyline), kecepatan
//                 boleh berubah per titik (mis. di atas sayap lebih cepat).
//  - Jet        : semburan air berbentuk parabola dari lubang (gerak peluru), tetes yang mengalir.
//  - Smoke      : asap laminar → turbulen (dupa).
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {cyc, rand} from '../anim';
import {C} from '../theme';
import {hue} from './primitives';

const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};

type Knot = [number, number]; // [x, jari-jari dalam px]

/** Jari-jari pipa di x (interpolasi halus cosinus antar-simpul). */
export const radiusAt = (knots: Knot[], x: number) => {
  if (x <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    const [xa, ra] = knots[i - 1];
    const [xb, rb] = knots[i];
    if (x <= xb) {
      const u = (x - xa) / (xb - xa);
      const s = 0.5 - 0.5 * Math.cos(Math.PI * u);
      return ra + (rb - ra) * s;
    }
  }
  return knots[knots.length - 1][1];
};

/** Tabel "waktu tempuh" τ(x) = ∫ dx / v(x) dengan v(x) = v0·(r0/r(x))² — dipakai untuk menaruh partikel. */
const travelTable = (knots: Knot[], x0: number, x1: number, v0: number, n = 240) => {
  const r0 = radiusAt(knots, x0);
  const xs: number[] = [];
  const ts: number[] = [];
  let acc = 0;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    if (i > 0) {
      const xm = x - (x1 - x0) / n / 2;
      const v = v0 * (r0 / radiusAt(knots, xm)) ** 2;
      acc += (x1 - x0) / n / v;
    }
    xs.push(x);
    ts.push(acc);
  }
  const xAt = (tau: number) => {
    let lo = 0;
    let hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ts[mid] < tau) lo = mid;
      else hi = mid;
    }
    const u = (tau - ts[lo]) / Math.max(1e-9, ts[hi] - ts[lo]);
    return xs[lo] + (xs[hi] - xs[lo]) * u;
  };
  return {total: acc, xAt, vAt: (x: number) => v0 * (r0 / radiusAt(knots, x)) ** 2};
};

/** Kecepatan lokal (px/s) di dalam pipa menurut kontinuitas. Berguna untuk label/indikator. */
export const pipeSpeed = (knots: Knot[], x0: number, v0: number, x: number) => v0 * (radiusAt(knots, x0) / radiusAt(knots, x)) ** 2;

/**
 * Pipa mendatar berpenampang berubah. (x0..x1) panjang, yc sumbu, knots = [[x, r], ...] jari-jari dalam.
 * v0 = kecepatan partikel (px/s) di ujung kiri. Partikel menempuh pipa sesuai kontinuitas.
 */
export const Pipe: React.FC<{
  x0: number;
  x1: number;
  yc: number;
  knots: Knot[];
  v0?: number;
  lanes?: number;
  perLane?: number;
  color?: string;
  wall?: string;
  opacity?: number;
  particles?: number; // 0..1 opasitas partikel
  lines?: number; // 0..1 opasitas garis arus
  seed?: number;
}> = ({x0, x1, yc, knots, v0 = 120, lanes = 7, perLane = 6, color = C.water, wall = '#bfe3ff', opacity = 1, particles = 1, lines = 0.35, seed = 0}) => {
  const t = useT();
  if (opacity <= 0.001) return null;
  const tab = travelTable(knots, x0, x1, v0);
  const N = 80;
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = x0 + ((x1 - x0) * i) / N;
    const r = radiusAt(knots, x);
    top.push([x, yc - r]);
    bot.push([x, yc + r]);
  }
  const path = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const body = `${path(top)} ${path([...bot].reverse()).replace(/^M/, 'L')} Z`;
  const id = `pipe-${Math.round(x0)}-${Math.round(yc)}`;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.deep} stopOpacity={0.9} />
          <stop offset="50%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor={C.deep} stopOpacity={0.9} />
        </linearGradient>
      </defs>
      <path d={body} fill={`url(#${id})`} />
      {/* garis arus: mengikuti pecahan jari-jari yang sama → merapat di bagian sempit */}
      {lines > 0.001
        ? Array.from({length: lanes}, (_, j) => {
            const f = lanes === 1 ? 0 : -0.8 + (1.6 * j) / (lanes - 1);
            const pts: [number, number][] = top.map(([x]) => [x, yc + f * radiusAt(knots, x)]);
            return <path key={j} d={path(pts)} fill="none" stroke="#dff3ff" strokeOpacity={lines * 0.6} strokeWidth={1.2} />;
          })
        : null}
      {/* partikel: coretan pendek yang panjangnya ∝ kecepatan lokal */}
      {particles > 0.001
        ? Array.from({length: lanes}, (_, j) => {
            const f = lanes === 1 ? 0 : -0.8 + (1.6 * j) / (lanes - 1);
            return Array.from({length: perLane}, (_, k) => {
              const ph = (((t / tab.total + k / perLane + rand(j * 7.3 + seed) * 0.9) % 1) + 1) % 1;
              const x = tab.xAt(ph * tab.total);
              const v = tab.vAt(x);
              const len = Math.min(70, 4 + v * 0.09);
              const xa = Math.max(x0, x - len);
              const y = yc + f * radiusAt(knots, x);
              const ya = yc + f * radiusAt(knots, xa);
              const fade = Math.min(1, ph * 12) * Math.min(1, (1 - ph) * 12);
              return (
                <g key={`${j}-${k}`} opacity={particles * fade}>
                  <line x1={xa} y1={ya} x2={x} y2={y} stroke="#eaf8ff" strokeOpacity={0.55} strokeWidth={2.2} strokeLinecap="round" />
                  <circle cx={x} cy={y} r={2.6} fill="#ffffff" />
                </g>
              );
            });
          })
        : null}
      <path d={path(top)} fill="none" stroke={wall} strokeOpacity={0.85} strokeWidth={5} strokeLinejoin="round" />
      <path d={path(bot)} fill="none" stroke={wall} strokeOpacity={0.85} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

/**
 * Garis arus bebas: polyline pts, partikel bergerak dengan kecepatan dasar `speed` (px/s) dikali
 * faktor per-segmen `gain` (opsional, panjang = pts.length) → misalnya lebih cepat di atas sayap.
 */
export const Streamline: React.FC<{
  pts: [number, number][];
  gain?: number[];
  speed?: number;
  n?: number;
  color?: string;
  opacity?: number;
  line?: number;
  width?: number;
  seed?: number;
}> = ({pts, gain, speed = 160, n = 6, color = '#dff3ff', opacity = 1, line = 0.3, width = 1.4, seed = 0}) => {
  const t = useT();
  if (opacity <= 0.001 || pts.length < 2) return null;
  // waktu tempuh kumulatif per titik
  const ts = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const g = gain ? (gain[i - 1] + gain[i]) / 2 : 1;
    ts.push(ts[i - 1] + d / (speed * Math.max(0.05, g)));
  }
  const total = ts[ts.length - 1];
  const at = (tau: number): [number, number, number] => {
    let i = 1;
    while (i < ts.length - 1 && ts[i] < tau) i++;
    const u = (tau - ts[i - 1]) / Math.max(1e-9, ts[i] - ts[i - 1]);
    const g = gain ? gain[i - 1] + (gain[i] - gain[i - 1]) * u : 1;
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u, g];
  };
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <g opacity={opacity}>
      {line > 0.001 ? <path d={d} fill="none" stroke={hue(color)} strokeOpacity={line} strokeWidth={width} /> : null}
      {Array.from({length: n}, (_, k) => {
        const ph = (((t / total + k / n + rand(seed + k * 1.7) * 0.15) % 1) + 1) % 1;
        const [x, y, g] = at(ph * total);
        const back = Math.min(ph * total, 0.06 + 0.05 * g);
        const [xa, ya] = at(ph * total - back);
        const fade = cyc(ph) * 1.2;
        return (
          <g key={k} opacity={Math.min(1, fade)}>
            <line x1={xa} y1={ya} x2={x} y2={y} stroke={hue(color)} strokeOpacity={0.7} strokeWidth={2.4} strokeLinecap="round" />
            <circle cx={x} cy={y} r={2.8} fill="#fff" />
          </g>
        );
      })}
    </g>
  );
};

/**
 * Semburan air dari lubang di (x, y) dengan kecepatan awal vx (px/s, mendatar) dan percepatan g (px/s²).
 * Berhenti di lantai yFloor. Digambar sebagai pita air + tetes yang bergerak.
 */
export const Jet: React.FC<{x: number; y: number; vx: number; g: number; yFloor: number; dir?: 1 | -1; width?: number; opacity?: number; drops?: number; color?: string}> = ({
  x,
  y,
  vx,
  g,
  yFloor,
  dir = 1,
  width = 7,
  opacity = 1,
  drops = 10,
  color = C.water,
}) => {
  const t = useT();
  if (opacity <= 0.001 || vx <= 1) return null;
  const T = Math.sqrt((2 * Math.max(1, yFloor - y)) / g);
  const pts = Array.from({length: 41}, (_, i) => {
    const s = (T * i) / 40;
    return [x + dir * vx * s, y + 0.5 * g * s * s] as [number, number];
  });
  const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={width} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#e6f6ff" strokeOpacity={0.7} strokeWidth={width * 0.3} strokeLinecap="round" />
      {Array.from({length: drops}, (_, k) => {
        const ph = (((t / T) * 0.9 + k / drops) % 1 + 1) % 1;
        const s = ph * T;
        return <circle key={k} cx={x + dir * vx * s} cy={y + 0.5 * g * s * s} r={2.6} fill="#fff" opacity={0.85 * cyc(ph)} />;
      })}
      {/* percikan di lantai */}
      {Array.from({length: 5}, (_, k) => {
        const ph = (((t * 1.6 + k / 5) % 1) + 1) % 1;
        const xe = pts[40][0];
        return <circle key={`s${k}`} cx={xe + dir * (ph * 26) * (k % 2 ? 1 : -0.6)} cy={yFloor - Math.sin(ph * Math.PI) * 18} r={2.2} fill="#cfeaff" opacity={0.7 * cyc(ph)} />;
      })}
    </g>
  );
};

/**
 * Asap naik dari (x, y): laminar sampai ketinggian `hLam` (px), lalu makin bergolak.
 * `turb` 0..1 mengatur seberapa kacau bagian atas.
 */
export const Smoke: React.FC<{x: number; y: number; hLam?: number; height?: number; turb?: number; opacity?: number; strands?: number}> = ({
  x,
  y,
  hLam = 260,
  height = 620,
  turb = 1,
  opacity = 1,
  strands = 3,
}) => {
  const t = useT();
  if (opacity <= 0.001) return null;
  return (
    <g opacity={opacity}>
      {Array.from({length: strands}, (_, s) => {
        const pts: string[] = [];
        for (let i = 0; i <= 60; i++) {
          const h = (height * i) / 60;
          const above = Math.max(0, h - hLam) / (height - hLam);
          const wob = 3 * Math.sin(h * 0.03 - t * 1.5 + s) + turb * above * (60 * Math.sin(h * 0.022 - t * 2.1 + s * 2.1) + 35 * Math.sin(h * 0.051 + t * 3.3 + s));
          pts.push(`${i ? 'L' : 'M'}${(x + wob + (s - (strands - 1) / 2) * 3).toFixed(1)},${(y - h).toFixed(1)}`);
        }
        return <path key={s} d={pts.join(' ')} fill="none" stroke="#dfe7f5" strokeOpacity={0.35 - s * 0.06} strokeWidth={3 - s * 0.5} strokeLinecap="round" />;
      })}
      {/* gumpalan pusaran di bagian turbulen */}
      {Array.from({length: 9}, (_, k) => {
        const ph = (((t * 0.18 + k / 9) % 1) + 1) % 1;
        const h = hLam + ph * (height - hLam);
        const cx = x + turb * 70 * Math.sin(k * 2.3 + t * 0.9);
        const r = 10 + 40 * ph;
        return <circle key={k} cx={cx} cy={y - h} r={r} fill="none" stroke="#dfe7f5" strokeOpacity={0.16 * turb * cyc(ph)} strokeWidth={2} />;
      })}
    </g>
  );
};
