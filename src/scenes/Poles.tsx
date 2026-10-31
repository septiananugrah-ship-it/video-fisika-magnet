import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, pathOf, ramp, rand, smoothPath} from '../anim';
import {Arrow, DrawPath, Formula, Glow, Label, Motes, Ripple, Stage, Twinkles, V, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kutub & medan magnet (AUDIT): dua kutub U/S, tak ada monopol; garis keluar U masuk S; medan Bumi ≈ 50 μT.
// Garis medan magnet batang dihitung dari dua "kutub" (1/r², integrasi RK2), serbuk besi = ratusan garis pendek
// yang berputar sejajar arah medan hasil hitungan; medan Bumi = dipol miring ≈ 11° (r = L·R·sin²θ).
const TAU = Math.PI * 2;
const fr = (v: number) => ((v % 1) + 1) % 1;
const lin = (x: number) => x;
type P = [number, number];
type Pole = {x: number; y: number; q: number};
const slot = (t: number, a: number, b: number, fi = 0.6, fo = 0.5) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

const bvec = (ps: Pole[], x: number, y: number): P => {
  let bx = 0;
  let by = 0;
  for (const c of ps) {
    const dx = x - c.x;
    const dy = y - c.y;
    const r2 = dx * dx + dy * dy + 1e-3;
    const r3 = r2 * Math.sqrt(r2);
    bx += (c.q * dx) / r3;
    by += (c.q * dy) / r3;
  }
  return [bx, by];
};
const bdir = (ps: Pole[], x: number, y: number): P => {
  const [bx, by] = bvec(ps, x, y);
  const m = Math.hypot(bx, by) || 1;
  return [bx / m, by / m];
};
const traceB = (ps: Pole[], x0: number, y0: number, steps: number, ds: number, stopR: number, box: number[]): P[] => {
  const pts: P[] = [[x0, y0]];
  let x = x0;
  let y = y0;
  for (let i = 0; i < steps; i++) {
    const [ax, ay] = bdir(ps, x, y);
    const [bx, by] = bdir(ps, x + ax * ds * 0.5, y + ay * ds * 0.5);
    x += bx * ds;
    y += by * ds;
    pts.push([x, y]);
    if (ps.some((c) => c.q < 0 && Math.hypot(x - c.x, y - c.y) < stopR)) break;
    if (x < box[0] || x > box[1] || y < box[2] || y > box[3]) break;
  }
  return pts;
};
/** Garis yang lolos keluar kotak dicerminkan ke sisi S (simetri dipol: cermin + arah dibalik). */
const withMirror = (lines: P[][], s: Pole, cx: number, cy: number, ang: number, near = 30): P[][] => {
  const ax = Math.cos(ang);
  const ay = Math.sin(ang);
  const extra = lines
    .filter((l) => {
      const [x, y] = l[l.length - 1];
      return Math.hypot(x - s.x, y - s.y) > near;
    })
    .map((l) =>
      l
        .map(([x, y]): P => {
          const d = (x - cx) * ax + (y - cy) * ay;
          return [x - 2 * d * ax, y - 2 * d * ay];
        })
        .reverse(),
    );
  return [...lines, ...extra];
};
/** Kutub magnet batang (U = +, S = −) di dekat ujungnya; flip = U di kiri. */
const polesOf = (xc: number, yc: number, len: number, flip = false): Pole[] => {
  const d = len / 2 - 18;
  const f = flip ? -1 : 1;
  return [
    {x: xc + f * d, y: yc, q: 1},
    {x: xc - f * d, y: yc, q: -1},
  ];
};

/** Magnet batang: S biru, U merah (flip = U di kiri). */
const Magnet: React.FC<{x: number; y: number; len: number; h: number; flip?: boolean; op?: number; gN?: number; gS?: number; rot?: number}> = ({x, y, len, h, flip, op = 1, gN = 0, gS = 0, rot = 0}) => {
  if (op <= 0.001) return null;
  const r = h * 0.18;
  const L = len / 2;
  const left = `M0,${-h / 2} H${-L + r} Q${-L},${-h / 2} ${-L},${-h / 2 + r} V${h / 2 - r} Q${-L},${h / 2} ${-L + r},${h / 2} H0 Z`;
  const right = `M0,${-h / 2} H${L - r} Q${L},${-h / 2} ${L},${-h / 2 + r} V${h / 2 - r} Q${L},${h / 2} ${L - r},${h / 2} H0 Z`;
  const f = flip ? -1 : 1;
  return (
    <g opacity={op}>
      {rot === 0 ? <ellipse cx={x} cy={y + h * 0.78} rx={L * 0.95} ry={h * 0.15} fill="#000" opacity={0.28} /> : null}
      <Glow x={x + (f * L) / 2} y={y} r={h * 2} color="heat" opacity={gN} />
      <Glow x={x - (f * L) / 2} y={y} r={h * 2} color="pot" opacity={gS} />
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <path d={left} fill={flip ? C.heat : C.pot} />
        <path d={right} fill={flip ? C.pot : C.heat} />
        <rect x={-L + r} y={-h / 2 + h * 0.1} width={len - 2 * r} height={h * 0.18} rx={h * 0.09} fill="#fff" opacity={0.25} />
        <rect x={-L} y={h * 0.22} width={len} height={h * 0.28} fill="#000" opacity={0.18} />
        <rect x={-L} y={-h / 2} width={len} height={h} rx={r} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
        <text x={-L / 2} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={h * 0.55} fill="#fff" transform={`rotate(${-rot} ${-L / 2} 0)`}>
          {flip ? 'U' : 'S'}
        </text>
        <text x={L / 2} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={h * 0.55} fill="#fff" transform={`rotate(${-rot} ${L / 2} 0)`}>
          {flip ? 'S' : 'U'}
        </text>
      </g>
    </g>
  );
};

/** Garis medan dengan butir mengalir (U → S). */
const FieldLines: React.FC<{lines: P[][]; t: number; op: number; draw?: number; w?: number; chevron?: boolean}> = ({lines, t, op, draw = 1, w = 2.4, chevron}) =>
  op <= 0.001 ? null : (
    <g opacity={op}>
      {lines.map((pts, k) => (
        <g key={k}>
          <DrawPath d={pathOf(pts)} p={draw} stroke="spr" width={w} opacity={0.6} />
          {[0, 0.5].map((o) => {
            const ph = fr(t * 0.32 + o + k * 0.137);
            const [x, y] = pointAlong(pts, ph);
            return <circle key={o} cx={x} cy={y} r={3.8} fill={C.spr} opacity={cyc(ph) * draw} />;
          })}
          {chevron && pts.length > 8
            ? (() => {
                const [x, y] = pointAlong(pts, 0.5);
                const [x2, y2] = pointAlong(pts, 0.52);
                const a = Math.atan2(y2 - y, x2 - x);
                const s = 9;
                return (
                  <path
                    d={`M${x - s * Math.cos(a) + s * 0.7 * Math.sin(a)},${y - s * Math.sin(a) - s * 0.7 * Math.cos(a)} L${x},${y} L${x - s * Math.cos(a) - s * 0.7 * Math.sin(a)},${y - s * Math.sin(a) + s * 0.7 * Math.cos(a)}`}
                    fill="none"
                    stroke={C.spr}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={ramp(draw, 0.6, 1)}
                  />
                );
              })()
            : null}
        </g>
      ))}
    </g>
  );

const fanFrom = (ps: Pole[], angs: number[], box: number[], base = 0): P[][] => {
  const n = ps.filter((p) => p.q > 0);
  return n.flatMap((p) => angs.map((a) => traceB(ps, p.x + 20 * Math.cos(a + base), p.y + 20 * Math.sin(a + base), 260, 6, 17, box)));
};

/** Kompas (sudut jarum rad, searah jarum jam dari atas). */
const Compass: React.FC<{x: number; y: number; r: number; ang: number}> = ({x, y, r, ang}) => (
  <g>
    <circle cx={x} cy={y + r * 0.12} r={r * 1.05} fill="#000" opacity={0.3} />
    <circle cx={x} cy={y} r={r * 1.06} fill="#7a869f" />
    <circle cx={x} cy={y} r={r} fill="#101b3c" stroke="#d6def2" strokeWidth={r * 0.05} />
    {Array.from({length: 24}, (_, k) => {
      const a = (k / 24) * TAU;
      const r1 = r * (k % 6 === 0 ? 0.78 : 0.86);
      return <line key={k} x1={x + r1 * Math.sin(a)} y1={y - r1 * Math.cos(a)} x2={x + r * 0.93 * Math.sin(a)} y2={y - r * 0.93 * Math.cos(a)} stroke="#93a0c4" strokeWidth={k % 6 === 0 ? 3 : 1.5} />;
    })}
    {['U', 'T', 'S', 'B'].map((s, k) => {
      const a = (k / 4) * TAU;
      return (
        <text key={s} x={x + r * 0.62 * Math.sin(a)} y={y - r * 0.62 * Math.cos(a)} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={r * 0.2} fill={k === 0 ? C.heat : k === 2 ? C.pot : C.muted}>
          {s}
        </text>
      );
    })}
    <g transform={`rotate(${(ang * 180) / Math.PI} ${x} ${y})`}>
      <path d={`M${x},${y - r * 0.8} L${x + r * 0.11},${y} L${x - r * 0.11},${y} Z`} fill={C.heat} />
      <path d={`M${x},${y + r * 0.8} L${x + r * 0.11},${y} L${x - r * 0.11},${y} Z`} fill={C.pot} />
      <path d={`M${x},${y - r * 0.8} L${x + r * 0.11},${y} L${x},${y} Z`} fill="#fff" opacity={0.22} />
    </g>
    <circle cx={x} cy={y} r={r * 0.07} fill="#e7ecf8" />
  </g>
);

// ---------- bagian 0: tolak & tarik ----------
const TOPY = 300;
const PY = 640;
const PL = 220;
const PH = 58;
const TOP_LINES = withMirror(fanFrom(polesOf(960, TOPY, 360), [-2.4, -1.8, -1.25, -0.75, -0.3, 0.3, 0.75, 1.25, 1.8, 2.4], [470, 1450, 175, 440]), polesOf(960, TOPY, 360)[1], 960, TOPY, 0);

// ---------- bagian 1: memotong magnet ----------
const CY1 = 470;
const X0 = 700;
const E8 = 65; // lebar seperdelapan
const RED0 = [0, 0, 0, 0, 1, 1, 1, 1];
const RED1 = [0, 0, 1, 1, 0, 0, 1, 1];
const RED2 = [0, 1, 0, 1, 0, 1, 0, 1];
const loopPts = (cx: number, cy: number, L: number, rmin: number, s: number): P[] => {
  const th0 = Math.asin(Math.min(1, Math.sqrt(rmin / L)));
  return Array.from({length: 33}, (_, j) => {
    const th = th0 + (j / 32) * (Math.PI - 2 * th0);
    const r = L * Math.sin(th) ** 2;
    return [cx + r * Math.cos(th), cy + s * r * Math.sin(th)];
  });
};

// ---------- bagian 2: serbuk besi ----------
const MY2 = 520;
const POLES2 = polesOf(960, MY2, 300);
const FIL = (() => {
  const out: {x: number; y: number; ang: number; a0: number; str: number; d: number}[] = [];
  let k = 0;
  for (let gy = 0; gy < 17; gy++) {
    for (let gx = 0; gx < 35; gx++) {
      k++;
      const x = 170 + gx * 46 + (rand(k * 1.3) - 0.5) * 26;
      const y = 196 + gy * 40 + (rand(k * 2.7) - 0.5) * 22;
      if (Math.abs(x - 960) < 178 && Math.abs(y - MY2) < 52) continue;
      if (y > 872) continue;
      const [bx, by] = bvec(POLES2, x, y);
      const m = Math.hypot(bx, by);
      out.push({x, y, ang: Math.atan2(by, bx), a0: rand(k * 4.1) * Math.PI, str: Math.min(1, Math.pow(m / 2.2e-5, 0.35)), d: rand(k * 5.9)});
    }
  }
  return out;
})();
const LINES2 = withMirror(fanFrom(POLES2, [-2.6, -2.15, -1.7, -1.25, -0.82, 0, 0.82, 1.25, 1.7, 2.15, 2.6], [120, 1800, 178, 872]), POLES2[1], 960, MY2, 0);

// ---------- bagian 3: Bumi ----------
const GX = 700;
const GY = 540;
const GR = 150;
const PSI = 0.19; // kemiringan sumbu geomagnet ≈ 11°
const EPS = 0.3;
const proj = (lat: number, lon: number) => {
  const X = Math.cos(lat) * Math.sin(lon);
  const Y = Math.sin(lat);
  const Z = Math.cos(lat) * Math.cos(lon);
  return {x: GX + GR * X, y: GY - GR * (Y * Math.cos(EPS) - Z * Math.sin(EPS)), z: Y * Math.sin(EPS) + Z * Math.cos(EPS)};
};
const BLOBS = [
  {lat: 0.55, lon: 0.2, r: 0.45},
  {lat: -0.35, lon: 0.95, r: 0.38},
  {lat: 0.2, lon: 2.3, r: 0.5},
  {lat: -0.5, lon: 3.5, r: 0.42},
  {lat: 0.85, lon: 4.3, r: 0.38},
  {lat: 0.15, lon: 5.2, r: 0.44},
];
const geoPt = (L: number, th: number, s: number): P => {
  const r = L * GR * Math.sin(th) ** 2;
  const u = s * r * Math.sin(th);
  const v = -r * Math.cos(th);
  return [GX + u * Math.cos(PSI) - v * Math.sin(PSI), GY + u * Math.sin(PSI) + v * Math.cos(PSI)];
};
// dari kutub U magnet (dekat kutub selatan geografis, bawah) ke kutub S magnet (atas)
const GEO_LINES: P[][] = [1.35, 1.75, 2.3, 3.0].flatMap((L) => {
  const th0 = Math.asin(1 / Math.sqrt(L));
  return [-1, 1].map((s) => Array.from({length: 49}, (_, j) => geoPt(L, Math.PI - th0 - (j / 48) * (Math.PI - 2 * th0), s)));
});
const MINI = [
  {lat: 0.35, lon: 0.1},
  {lat: -0.25, lon: 0.75},
  {lat: 0.6, lon: -0.75},
  {lat: -0.4, lon: -0.3},
  {lat: 0.05, lon: 2.0},
  {lat: -0.1, lon: 3.6},
  {lat: 0.45, lon: 4.9},
];

const Globe: React.FC<{rot: number; t: number}> = ({rot, t}) => {
  const seg = (pts: {x: number; y: number; z: number}[]) => {
    let d = '';
    let pen = false;
    for (const p of pts) {
      if (p.z > 0) {
        d += `${pen ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)} `;
        pen = true;
      } else pen = false;
    }
    return d;
  };
  const mer = Array.from({length: 12}, (_, k) => seg(Array.from({length: 25}, (_, j) => proj(-Math.PI / 2 + (j / 24) * Math.PI, rot + (k / 12) * TAU))));
  const par = [-1.05, -0.52, 0, 0.52, 1.05].map((lat) => seg(Array.from({length: 49}, (_, j) => proj(lat, (j / 48) * TAU))));
  return (
    <g>
      <circle cx={GX} cy={GY} r={GR * 1.3} fill="url(#soft-pot)" opacity={0.6} />
      <circle cx={GX} cy={GY} r={GR} fill="url(#po-ocean)" />
      {BLOBS.map((b, bi) => {
        const c0 = proj(b.lat, b.lon + rot);
        if (c0.z < -0.35) return null;
        const pts: P[] = Array.from({length: 14}, (_, k) => {
          const a = (k / 14) * TAU;
          const rho = b.r * (0.75 + 0.4 * rand(k + bi * 20));
          const lat2 = Math.asin(Math.sin(b.lat) * Math.cos(rho) + Math.cos(b.lat) * Math.sin(rho) * Math.cos(a));
          const lon2 = b.lon + rot + Math.atan2(Math.sin(a) * Math.sin(rho) * Math.cos(b.lat), Math.cos(rho) - Math.sin(b.lat) * Math.sin(lat2));
          const p = proj(lat2, lon2);
          if (p.z >= 0) return [p.x, p.y];
          const m = Math.hypot(p.x - GX, p.y - GY) || 1;
          return [GX + ((p.x - GX) / m) * GR, GY + ((p.y - GY) / m) * GR];
        });
        return <path key={bi} d={smoothPath([...pts, pts[0]]) + ' Z'} fill="#3f9a72" opacity={0.7 * Math.max(0, Math.min(1, c0.z * 3 + 0.9))} />;
      })}
      {mer.map((d, k) => (
        <path key={`m${k}`} d={d} fill="none" stroke="#bfe0ff" strokeOpacity={0.2} strokeWidth={1.4} />
      ))}
      {par.map((d, k) => (
        <path key={`p${k}`} d={d} fill="none" stroke="#bfe0ff" strokeOpacity={k === 2 ? 0.32 : 0.18} strokeWidth={1.4} />
      ))}
      {MINI.map((m, k) => {
        const lon = m.lon + rot;
        const p = proj(m.lat, lon);
        if (p.z < 0.05) return null;
        const dX = -Math.sin(m.lat) * Math.sin(lon);
        const dY = Math.cos(m.lat);
        const dZ = -Math.sin(m.lat) * Math.cos(lon);
        let sx = dX;
        let sy = -(dY * Math.cos(EPS) - dZ * Math.sin(EPS));
        const n = Math.hypot(sx, sy) || 1;
        sx /= n;
        sy /= n;
        const L = 13 * (0.5 + 0.5 * p.z);
        return (
          <g key={k} opacity={Math.min(1, (p.z - 0.05) * 4)}>
            <circle cx={p.x} cy={p.y} r={L * 1.15} fill="#0b1430" opacity={0.7} stroke="#d6def2" strokeWidth={1.1} />
            <line x1={p.x} y1={p.y} x2={p.x + sx * L} y2={p.y + sy * L} stroke={C.heat} strokeWidth={3} strokeLinecap="round" />
            <line x1={p.x} y1={p.y} x2={p.x - sx * L} y2={p.y - sy * L} stroke={C.pot} strokeWidth={3} strokeLinecap="round" />
          </g>
        );
      })}
      <circle cx={GX - GR * 0.3} cy={GY - GR * 0.35} r={GR * 0.55} fill="#fff" opacity={0.05 + 0.01 * Math.sin(t)} />
      <circle cx={GX} cy={GY} r={GR} fill="none" stroke="#9fd0ff" strokeOpacity={0.5} strokeWidth={2.5} />
    </g>
  );
};

export const Poles: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const c = [0, 1, 2, 3].map(cue);
  const s0 = slot(t, 0.0, c[1] - 0.05, 0.8, 0.55);
  const s1 = slot(t, c[1] - 0.05, c[2] - 0.05, 0.6, 0.55);
  const s2 = slot(t, c[2] - 0.05, c[3] - 0.05, 0.6, 0.55);
  const s3 = ramp(t, c[3] - 0.05, c[3] + 0.6) * (1 - ramp(t, dur - 0.7, dur + 0.3, EASE_IN_OUT));

  // ----- bagian 0 -----
  const gN0 = ramp(t, wordOf(0, 'utara') - 0.2, wordOf(0, 'utara') + 0.4);
  const gS0 = ramp(t, wordOf(0, 'selatan') - 0.2, wordOf(0, 'selatan') + 0.4);
  const rep = ramp(t, wordOf(0, 'sejenis') - 0.5, wordOf(0, 'sejenis') + 0.3);
  const push = ramp(t, wordOf(0, 'tolak') - 0.2, wordOf(0, 'tolak') + 1.4);
  const att = ramp(t, wordOf(0, 'berlawanan') - 0.5, wordOf(0, 'berlawanan') + 0.3);
  const pull = ramp(t, wordOf(0, 'tarik') - 0.2, wordOf(0, 'tarik') + 0.9, (x) => x * x);
  const sepR = mix(300, 450, push) + 8 * Math.sin(t * 2.2) * push;
  const sepA = mix(470, 232, pull) + 3 * Math.sin(t * 9) * (1 - pull) * att;
  const RX = 560;
  const AX = 1360;
  const repPoles = [...polesOf(RX - sepR / 2, PY, PL), ...polesOf(RX + sepR / 2, PY, PL, true)];
  const attPoles = [...polesOf(AX - sepA / 2, PY, PL), ...polesOf(AX + sepA / 2, PY, PL)];
  const ANG = [-2.5, -1.95, -1.4, -0.9, -0.45, 0, 0.45, 0.9, 1.4, 1.95, 2.5];
  const repLines = s0 > 0.01 && rep > 0.01 ? fanFrom(repPoles, ANG, [130, 990, 480, 790]) : [];
  const attLines = s0 > 0.01 && att > 0.01 ? fanFrom(attPoles, ANG, [930, 1790, 480, 790]) : [];
  const fR = 70 * (300 / sepR) ** 2;
  const fA = Math.min(64, 36 * (470 / sepA) ** 2);
  const snap = ramp(t, wordOf(0, 'tarik') + 0.85, wordOf(0, 'tarik') + 2.0, lin);

  // ----- bagian 1 -----
  const cut1a = wordOf(1, 'potong') - 0.1;
  const cut1b = wordOf(1, 'dua') + 0.1;
  const blade1 = ramp(t, cut1a, cut1b, EASE_IN_OUT);
  const g1 = 90 * ramp(t, cut1b, cut1b + 0.9, BACK);
  const mono = slot(t, wordOf(1, 'tidak') - 0.3, wordOf(1, 'setiap') + 0.3, 0.5, 0.5);
  const cross = ramp(t, wordOf(1, 'saja') - 0.1, wordOf(1, 'saja') + 0.4);
  const np1 = ramp(t, wordOf(1, 'langsung') - 0.2, wordOf(1, 'langsung') + 0.5);
  const cut2a = wordOf(1, 'selatan') - 0.6;
  const cut2b = cut2a + 0.45;
  const blade2 = ramp(t, cut2a, cut2b, EASE_IN_OUT);
  const g2 = 46 * ramp(t, cut2b, cut2b + 0.8, BACK);
  const np2 = ramp(t, cut2b + 0.1, cut2b + 0.6);
  const e8x = (e: number) => X0 + e * E8 + (e >= 4 ? 1 : -1) * (g1 / 2) + (e % 4 >= 2 ? 1 : -1) * (g2 / 2);
  const redOf = (e: number) => mix(mix(RED0[e], RED1[e], np1), RED2[e], np2);
  const bob1 = 4 * Math.sin(t * 1.1);

  // ----- bagian 2 -----
  const fil0 = c[2] - 0.2;
  const draw2 = ramp(t, wordOf(2, 'garis') - 0.3, wordOf(2, 'garis') + 1.8, EASE_IN_OUT);
  const out2 = ramp(t, wordOf(2, 'keluar') - 0.2, wordOf(2, 'keluar') + 0.4);
  const in2 = ramp(t, wordOf(2, 'masuk') - 0.2, wordOf(2, 'masuk') + 0.4);
  const zoom2 = 1 + 0.04 * ramp(t, c[2], c[3], EASE_IN_OUT);

  // ----- bagian 3 -----
  const geoDraw = ramp(t, c[3] + 0.1, c[3] + 2.0, EASE_IN_OUT);
  const bar = ramp(t, wordOf(3, 'raksasa') - 0.4, wordOf(3, 'raksasa') + 0.5);
  const note = ramp(t, wordOf(3, 'raksasa') + 0.5, wordOf(3, 'raksasa') + 1.3);
  const crel = wordOf(3, 'kompas') + 0.2;
  const cs = Math.max(0, t - crel);
  const cang = t < crel ? -1.9 + 0.05 * Math.sin(t * 1.4) : -1.9 * Math.exp(-1.2 * cs) * Math.cos(4.2 * cs) + 0.02 * Math.sin(t * 3);
  const comp = ramp(t, wordOf(3, 'kompas') - 0.6, wordOf(3, 'kompas') + 0.2);
  const card = ramp(t, wordOf(3, 'lima') - 0.3, wordOf(3, 'lima') + 0.4);
  const magS: P = [GX + GR * Math.sin(PSI), GY - GR * Math.cos(PSI)];
  const geoN = proj(Math.PI / 2, 0);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <radialGradient id="po-ocean" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#4f9cff" />
            <stop offset="60%" stopColor="#1d4f8f" />
            <stop offset="100%" stopColor="#0b2347" />
          </radialGradient>
        </defs>
        <Motes x={960} y={540} rx={880} ry={330} n={30} color="spr" opacity={0.35} seed={7} />

        {/* ===== 0: dua kutub, tolak & tarik ===== */}
        <g opacity={s0}>
          <FieldLines lines={TOP_LINES} t={t} op={0.25 + 0.75 * Math.max(gN0, gS0)} />
          <Magnet x={960} y={TOPY + 3 * Math.sin(t * 1.2)} len={360} h={80} gN={0.8 * gN0} gS={0.8 * gS0} />
          <Label x={960 + 90} y={TOPY + 82} size={28} color={C.heat} weight={600} opacity={gN0}>
            utara
          </Label>
          <Label x={960 - 90} y={TOPY + 82} size={28} color={C.pot} weight={600} opacity={gS0}>
            selatan
          </Label>

          <g opacity={rep}>
            <FieldLines lines={repLines} t={t} op={1} w={2} />
            <Magnet x={RX - sepR / 2} y={PY} len={PL} h={PH} />
            <Magnet x={RX + sepR / 2} y={PY} len={PL} h={PH} flip />
            <Arrow x1={RX - sepR / 2 - 30} y1={PY - 64} x2={RX - sepR / 2 - 30 - fR} y2={PY - 64} color="force" width={6} opacity={push} />
            <Arrow x1={RX + sepR / 2 + 30} y1={PY - 64} x2={RX + sepR / 2 + 30 + fR} y2={PY - 64} color="force" width={6} opacity={push} />
            <Label x={RX} y={PY + 160} size={34} color={C.force} weight={700} opacity={push}>
              sejenis: tolak-menolak
            </Label>
            <Ripple x={RX} y={PY} p={ramp(t, wordOf(0, 'tolak') - 0.1, wordOf(0, 'tolak') + 1.2, lin)} r={120} color="heat" />
          </g>
          <g opacity={att}>
            <FieldLines lines={attLines} t={t} op={1} w={2} />
            <Magnet x={AX - sepA / 2} y={PY} len={PL} h={PH} />
            <Magnet x={AX + sepA / 2} y={PY} len={PL} h={PH} />
            <Arrow x1={AX - sepA / 2 - 20} y1={PY - 64} x2={AX - sepA / 2 - 20 + fA} y2={PY - 64} color="force" width={6} opacity={att * (1 - 0.6 * snap)} pulse={false} />
            <Arrow x1={AX + sepA / 2 + 20} y1={PY - 64} x2={AX + sepA / 2 + 20 - fA} y2={PY - 64} color="force" width={6} opacity={att * (1 - 0.6 * snap)} pulse={false} />
            <Label x={AX} y={PY + 160} size={34} color={C.force} weight={700} opacity={ramp(t, wordOf(0, 'tarik') - 0.2, wordOf(0, 'tarik') + 0.4)}>
              berlawanan: tarik-menarik
            </Label>
            <Ripple x={AX} y={PY} p={snap} r={140} color="force" />
          </g>
        </g>

        {/* ===== 1: dipotong → tiap potongan punya U dan S ===== */}
        <g opacity={s1}>
          {/* medan potongan */}
          {[0, 1].map((h) => {
            const cx = (e8x(h * 4) + e8x(h * 4 + 3) + E8) / 2;
            return [170, 220].flatMap((L) =>
              [-1, 1].map((s) => {
                const pts = loopPts(cx, CY1 + bob1, L, 140, s);
                return <FieldLines key={`${h}${L}${s}`} lines={[pts]} t={t} op={0.8 * np1 * (1 - np2)} w={2} />;
              }),
            );
          })}
          {[0, 1, 2, 3].map((q) => {
            const cx = (e8x(q * 2) + e8x(q * 2 + 1) + E8) / 2;
            return [92, 126].flatMap((L) =>
              [-1, 1].map((s) => {
                const pts = loopPts(cx, CY1 + bob1, L, 74, s);
                return <FieldLines key={`${q}${L}${s}`} lines={[pts]} t={t} op={0.8 * np2} w={1.8} />;
              }),
            );
          })}
          <ellipse cx={960} cy={CY1 + 78} rx={330} ry={14} fill="#000" opacity={0.28} />
          {Array.from({length: 8}, (_, e) => {
            const col = interpolateColors(redOf(e), [0, 1], [C.pot, C.heat]);
            return (
              <g key={e}>
                <rect x={e8x(e)} y={CY1 - 45 + bob1} width={E8 + 0.6} height={90} fill={col} />
                <rect x={e8x(e)} y={CY1 - 36 + bob1} width={E8 + 0.6} height={15} fill="#fff" opacity={0.22} />
                <rect x={e8x(e)} y={CY1 + 20 + bob1} width={E8 + 0.6} height={25} fill="#000" opacity={0.18} />
              </g>
            );
          })}
          {/* huruf kutub per tahap (silang-pudar) */}
          {[
            {op: 1 - np1, groups: [[0, 3], [4, 7]]},
            {op: np1 * (1 - np2), groups: [[0, 1], [2, 3], [4, 5], [6, 7]]},
            {op: np2, groups: [0, 1, 2, 3, 4, 5, 6, 7].map((e) => [e, e])},
          ].map((stg, si) =>
            stg.op <= 0.001
              ? null
              : stg.groups.map(([a, b], gi) => {
                  const x = (e8x(a) + e8x(b) + E8) / 2;
                  const red = RED0[a] * (si === 0 ? 1 : 0) + RED1[a] * (si === 1 ? 1 : 0) + RED2[a] * (si === 2 ? 1 : 0);
                  return (
                    <text key={`${si}-${gi}`} x={x} y={CY1 + 2 + bob1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={si === 2 ? 34 : 46} fill="#fff" opacity={stg.op}>
                      {red ? 'U' : 'S'}
                    </text>
                  );
                }),
          )}
          {/* pisau potong */}
          {[{x: 960, p: blade1, k: 0}, {x: X0 + 2 * E8 - g1 / 2, p: blade2, k: 1}, {x: X0 + 6 * E8 + g1 / 2, p: blade2, k: 2}].map((b) => {
            const show = Math.sin(Math.PI * b.p);
            if (show <= 0.001) return null;
            const y = mix(CY1 - 120, CY1 + 80, b.p);
            return (
              <g key={b.k} opacity={show}>
                <line x1={b.x} y1={CY1 - 130} x2={b.x} y2={y} stroke="#fff" strokeWidth={3} />
                <path d={`M${b.x - 16},${y - 70} L${b.x},${y} L${b.x + 3},${y - 70} Z`} fill="#dfe6f6" />
              </g>
            );
          })}
          <Ripple x={960 - g1 / 2} y={CY1} p={ramp(t, wordOf(1, 'langsung') - 0.2, wordOf(1, 'langsung') + 1.1, lin)} r={90} color="heat" rings={2} />
          <Ripple x={960 + g1 / 2} y={CY1} p={ramp(t, wordOf(1, 'langsung') - 0.2, wordOf(1, 'langsung') + 1.1, lin)} r={90} color="pot" rings={2} />
          <Twinkles x={960} y={CY1} rx={360} ry={70} n={6} color="gold" opacity={0.7 * np2} seed={5} />
          {/* monopol? */}
          <g opacity={mono}>
            <rect x={808} y={752} width={72} height={72} rx={12} fill={C.heat} />
            <text x={844} y={790} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={40} fill="#fff">
              U
            </text>
            <Label x={910} y={788} size={34} color={C.muted} anchor="start" weight={600}>
              saja? (monopol)
            </Label>
            <g opacity={cross}>
              <line x1={790} y1={745} x2={1180} y2={832} stroke={C.force} strokeWidth={6} strokeLinecap="round" />
              <line x1={790} y1={832} x2={1180} y2={745} stroke={C.force} strokeWidth={6} strokeLinecap="round" />
            </g>
          </g>
          <Label x={960} y={790} size={34} color={C.gold} weight={700} opacity={ramp(t, wordOf(1, 'setiap') + 0.3, wordOf(1, 'setiap') + 0.9)}>
            setiap potongan: U dan S
          </Label>
        </g>

        {/* ===== 2: serbuk besi & garis medan ===== */}
        <g opacity={s2} transform={`translate(960 ${MY2}) scale(${zoom2}) translate(-960 ${-MY2})`}>
          {FIL.map((f, i) => {
            const ap = ramp(t, fil0 + f.d * 1.4, fil0 + f.d * 1.4 + 0.35);
            if (ap <= 0.001) return null;
            const al = ramp(t, fil0 + f.d * 1.4 + 0.2, fil0 + f.d * 1.4 + 1.4, EASE_IN_OUT);
            const diff = fr((f.ang - f.a0 + Math.PI / 2) / Math.PI) * Math.PI - Math.PI / 2;
            const a = f.a0 + diff * al + 0.05 * Math.sin(t * 6 + i) * (1 - 0.6 * al);
            const L = 8;
            const fall = (1 - ap) * 14;
            return <line key={i} x1={f.x - L * Math.cos(a)} y1={f.y - fall - L * Math.sin(a)} x2={f.x + L * Math.cos(a)} y2={f.y - fall + L * Math.sin(a)} stroke="#b9c3da" strokeWidth={2.6} strokeLinecap="round" opacity={ap * (0.28 + 0.6 * f.str)} />;
          })}
          <FieldLines lines={LINES2} t={t} op={1} draw={draw2} w={2.6} chevron />
          <Magnet x={960} y={MY2} len={300} h={70} gN={0.9 * out2} gS={0.9 * in2} />
          <Label x={1150} y={MY2 + 92} size={30} color={C.heat} weight={700} opacity={out2}>
            keluar dari U
          </Label>
          <Label x={770} y={MY2 + 92} size={30} color={C.pot} weight={700} opacity={in2}>
            masuk ke S
          </Label>
          <Ripple x={POLES2[0].x} y={MY2} p={ramp(t, wordOf(2, 'keluar') - 0.1, wordOf(2, 'keluar') + 1.2, lin)} r={110} color="heat" rings={2} />
          <Ripple x={POLES2[1].x} y={MY2} p={ramp(t, wordOf(2, 'masuk') - 0.1, wordOf(2, 'masuk') + 1.2, lin)} r={110} color="pot" rings={2} />
        </g>

        {/* ===== 3: Bumi sebagai magnet ===== */}
        <g opacity={s3}>
          {GEO_LINES.map((pts, k) => {
            const outside = pts.filter(([x, y]) => Math.hypot(x - GX, y - GY) >= GR - 1);
            return <FieldLines key={k} lines={[outside]} t={t + k * 0.3} op={1} draw={geoDraw} w={2.3} chevron={k >= 4} />;
          })}
          <Globe rot={t * 0.22} t={t} />
          <line x1={geoN.x} y1={geoN.y - 50} x2={GX} y2={GY + GR * Math.cos(EPS) + 50} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" opacity={0.6} />
          <g opacity={0.7 * bar}>
            <Magnet x={GX} y={GY} len={190} h={44} rot={(PSI * 180) / Math.PI + 90} />
          </g>
          <circle cx={geoN.x} cy={geoN.y} r={6} fill="#fff" />
          <circle cx={magS[0]} cy={magS[1]} r={7 + Math.sin(t * 3)} fill={C.pot} stroke="#fff" strokeWidth={1.5} />
          <Label x={GX - 150} y={GY - GR - 80} size={30} color={C.ink} weight={600} opacity={bar}>
            Bumi = magnet raksasa
          </Label>
          <g opacity={note}>
            <path d={`M${geoN.x + 8},${geoN.y - 6} C${geoN.x + 60},${geoN.y - 40} ${GX + 170},${246} ${GX + 220},${246}`} fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="4 6" />
            <text x={GX + 230} y={246} dominantBaseline="central" fontFamily={FONT.mono} fontSize={24} style={{paintOrder: 'stroke', stroke: 'rgba(7,11,24,0.92)', strokeWidth: 5}}>
              <tspan fill={C.ink}>kutub utara geografis</tspan>
              <tspan fill={C.muted}> ≈ </tspan>
              <tspan fill={C.pot}>kutub S magnet</tspan>
            </text>
          </g>
          <g opacity={comp}>
            <Glow x={1470} y={470} r={200} color="spr" opacity={0.3} />
            <Compass x={1470} y={470} r={112} ang={cang} />
            <Label x={1470} y={612} size={26} color={C.muted} font="mono">
              jarum sejajar medan
            </Label>
          </g>
          <Twinkles x={1470} y={760} rx={220} ry={60} n={5} color="spr" opacity={0.7 * card} seed={9} />
        </g>
      </Stage>
      <Formula x={1470} y={760} p={card * s3} accent={C.spr} size={66} caption="medan magnet Bumi di permukaan">
        <V color={C.spr}>B</V> ≈ 50 μT
      </Formula>
    </AbsoluteFill>
  );
};
