import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, pathOf, ramp, rand, smoothPath} from '../anim';
import {Arrow, Glow, Label, Motes, Ripple, Spark, Stage, Twinkles, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pembuka: tiga peristiwa magnetik (semua gerak dihitung analitik per frame).
// (A) bola Bumi berputar dengan kompas-kompas kecil yang menunjuk utara; jarum kompas besar berayun teredam ke U;
// (B) angin Matahari: partikel bermuatan tertangkap garis medan dipol Bumi (r = L·R·sin²θ), berpilin turun ke kutub → tirai aurora;
// (C) MRI: pasien masuk lorong magnet (B sepanjang lorong), gambar irisan otak tersingkap baris demi baris;
// lalu "satu hal: medan magnet" (garis medan magnet batang dihitung dari dua kutub, RK2),
// dan "listrik yang bergerak": loop arus (garis medan = lingkaran Apollonius dua arus berlawanan),
// elektron & inti yang berputar (spin emas) sebagai magnet kecil.
const TAU = Math.PI * 2;
const fr = (v: number) => ((v % 1) + 1) % 1;
const lin = (x: number) => x;
type P = [number, number];
type Pole = {x: number; y: number; q: number};

const bdir = (ps: Pole[], x: number, y: number): P => {
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
  const m = Math.hypot(bx, by) || 1;
  return [bx / m, by / m];
};
/** Garis medan dari kutub U (+) ke S (−), integrasi RK2. */
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
/** Magnet batang: kiri S (biru), kanan U (merah). */
const Magnet: React.FC<{x: number; y: number; len: number; h: number; rot?: number; op?: number}> = ({x, y, len, h, rot = 0, op = 1}) => {
  if (op <= 0.001) return null;
  const r = h * 0.18;
  const L = len / 2;
  const left = `M0,${-h / 2} H${-L + r} Q${-L},${-h / 2} ${-L},${-h / 2 + r} V${h / 2 - r} Q${-L},${h / 2} ${-L + r},${h / 2} H0 Z`;
  const right = `M0,${-h / 2} H${L - r} Q${L},${-h / 2} ${L},${-h / 2 + r} V${h / 2 - r} Q${L},${h / 2} ${L - r},${h / 2} H0 Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={op}>
      <ellipse cx={0} cy={h * 0.75} rx={L * 0.95} ry={h * 0.16} fill="#000" opacity={0.25} />
      <path d={left} fill={C.pot} />
      <path d={right} fill={C.heat} />
      <rect x={-L + r} y={-h / 2 + h * 0.1} width={len - 2 * r} height={h * 0.18} rx={h * 0.09} fill="#fff" opacity={0.25} />
      <rect x={-L} y={h * 0.22} width={len} height={h * 0.28} fill="#000" opacity={0.18} />
      <rect x={-L} y={-h / 2} width={len} height={h} rx={r} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
      <text x={-L / 2} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={h * 0.55} fill="#fff" transform={`rotate(${-rot} ${-L / 2} 0)`}>
        S
      </text>
      <text x={L / 2} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={h * 0.55} fill="#fff" transform={`rotate(${-rot} ${L / 2} 0)`}>
        U
      </text>
    </g>
  );
};

/** Kompas: jarum (sudut rad, searah jarum jam dari atas), ujung U merah, ujung S biru. */
const Compass: React.FC<{x: number; y: number; r: number; ang: number; hot?: number}> = ({x, y, r, ang, hot = 0}) => (
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
        <text key={s} x={x + r * 0.62 * Math.sin(a)} y={y - r * 0.62 * Math.cos(a)} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={r * 0.2 * (k === 0 ? 1 + 0.25 * hot : 1)} fill={k === 0 ? C.heat : k === 2 ? C.pot : C.muted}>
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
    <ellipse cx={x - r * 0.35} cy={y - r * 0.45} rx={r * 0.35} ry={r * 0.16} fill="#fff" opacity={0.07} transform={`rotate(-30 ${x - r * 0.35} ${y - r * 0.45})`} />
  </g>
);

const Frame: React.FC<{color: string; op: number}> = ({color, op}) => (
  <rect x={-345} y={-235} width={690} height={470} rx={26} fill="rgba(14,22,50,0.6)" stroke={color} strokeOpacity={0.25 + 0.45 * op} strokeWidth={3} />
);

// ---------- (A) Bumi & kompas ----------
const EPS = 0.38;
const proj = (lat: number, lon: number, R: number, cx: number, cy: number) => {
  const X = Math.cos(lat) * Math.sin(lon);
  const Y = Math.sin(lat);
  const Z = Math.cos(lat) * Math.cos(lon);
  return {x: cx + R * X, y: cy - R * (Y * Math.cos(EPS) - Z * Math.sin(EPS)), z: Y * Math.sin(EPS) + Z * Math.cos(EPS)};
};
const BLOBS = [
  {lat: 0.55, lon: 0.2, r: 0.45},
  {lat: -0.35, lon: 0.95, r: 0.38},
  {lat: 0.2, lon: 2.3, r: 0.5},
  {lat: -0.5, lon: 3.5, r: 0.42},
  {lat: 0.85, lon: 4.3, r: 0.38},
  {lat: 0.15, lon: 5.2, r: 0.44},
];
const MINI = [
  {lat: 0.35, lon: 0.1},
  {lat: -0.25, lon: 0.75},
  {lat: 0.6, lon: -0.75},
  {lat: -0.4, lon: -0.3},
  {lat: 0.05, lon: 2.0},
  {lat: -0.1, lon: 3.6},
  {lat: 0.45, lon: 4.9},
];

const Globe: React.FC<{cx: number; cy: number; R: number; rot: number; t: number; mini: number}> = ({cx, cy, R, rot, t, mini}) => {
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
  const mer = Array.from({length: 12}, (_, k) => seg(Array.from({length: 25}, (_, j) => proj(-Math.PI / 2 + (j / 24) * Math.PI, rot + (k / 12) * TAU, R, cx, cy))));
  const par = [-1.05, -0.52, 0, 0.52, 1.05].map((lat) => seg(Array.from({length: 49}, (_, j) => proj(lat, (j / 48) * TAU, R, cx, cy))));
  const np = proj(Math.PI / 2, 0, R, cx, cy);
  return (
    <g>
      <circle cx={cx} cy={cy} r={R * 1.25} fill="url(#soft-pot)" opacity={0.6} />
      <circle cx={cx} cy={cy} r={R} fill="url(#hk-ocean)" />
      {BLOBS.map((b, bi) => {
        const c0 = proj(b.lat, b.lon + rot, R, cx, cy);
        if (c0.z < -0.35) return null;
        const pts: P[] = Array.from({length: 14}, (_, k) => {
          const a = (k / 14) * TAU;
          const rho = b.r * (0.75 + 0.4 * rand(k + bi * 20));
          const lat2 = Math.asin(Math.sin(b.lat) * Math.cos(rho) + Math.cos(b.lat) * Math.sin(rho) * Math.cos(a));
          const lon2 = b.lon + rot + Math.atan2(Math.sin(a) * Math.sin(rho) * Math.cos(b.lat), Math.cos(rho) - Math.sin(b.lat) * Math.sin(lat2));
          const p = proj(lat2, lon2, R, cx, cy);
          if (p.z >= 0) return [p.x, p.y];
          const m = Math.hypot(p.x - cx, p.y - cy) || 1;
          return [cx + ((p.x - cx) / m) * R, cy + ((p.y - cy) / m) * R];
        });
        return <path key={bi} d={smoothPath([...pts, pts[0]]) + ' Z'} fill="#3f9a72" opacity={0.75 * Math.max(0, Math.min(1, c0.z * 3 + 0.9))} />;
      })}
      {mer.map((d, k) => (
        <path key={`m${k}`} d={d} fill="none" stroke="#bfe0ff" strokeOpacity={0.22} strokeWidth={1.4} />
      ))}
      {par.map((d, k) => (
        <path key={`p${k}`} d={d} fill="none" stroke="#bfe0ff" strokeOpacity={k === 2 ? 0.35 : 0.2} strokeWidth={1.4} />
      ))}
      <circle cx={cx - R * 0.3} cy={cy - R * 0.35} r={R * 0.55} fill="#fff" opacity={0.06} />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#9fd0ff" strokeOpacity={0.5} strokeWidth={2.5} />
      {MINI.map((m, k) => {
        const lon = m.lon + rot;
        const p = proj(m.lat, lon, R, cx, cy);
        if (p.z < 0.05) return null;
        const dX = -Math.sin(m.lat) * Math.sin(lon);
        const dY = Math.cos(m.lat);
        const dZ = -Math.sin(m.lat) * Math.cos(lon);
        let sx = dX;
        let sy = -(dY * Math.cos(EPS) - dZ * Math.sin(EPS));
        const n = Math.hypot(sx, sy) || 1;
        sx /= n;
        sy /= n;
        const L = 15 * (0.5 + 0.5 * p.z);
        const op = Math.min(1, (p.z - 0.05) * 4) * mini;
        return (
          <g key={k} opacity={op}>
            <circle cx={p.x} cy={p.y} r={L * 1.15} fill="#0b1430" opacity={0.7} stroke="#d6def2" strokeWidth={1.2} />
            <line x1={p.x} y1={p.y} x2={p.x + sx * L} y2={p.y + sy * L} stroke={C.heat} strokeWidth={3.5} strokeLinecap="round" />
            <line x1={p.x} y1={p.y} x2={p.x - sx * L} y2={p.y - sy * L} stroke={C.pot} strokeWidth={3.5} strokeLinecap="round" />
          </g>
        );
      })}
      <circle cx={np.x} cy={np.y} r={6 + Math.sin(t * 3)} fill={C.heat} />
      <Label x={np.x} y={np.y - 26} size={24} color={C.heat} weight={700}>
        U
      </Label>
    </g>
  );
};

const PanelA: React.FC<{t: number; rel: number; north: number}> = ({t, rel, north}) => {
  const s = Math.max(0, t - rel);
  const ang = t < rel ? 2.2 + 0.06 * Math.sin(t * 1.3) : 2.2 * Math.exp(-1.25 * s) * Math.cos(4.4 * s) + 0.02 * Math.sin(t * 3.1);
  return (
    <g>
      <Globe cx={-165} cy={15} R={160} rot={t * 0.28} t={t} mini={ramp(t, rel - 0.6, rel + 0.6)} />
      <Ripple x={180} y={15 - 135 * 0.62} p={ramp(t, north - 0.1, north + 1.2, lin)} r={70} color="heat" rings={2} />
      <Compass x={180} y={15} r={135} ang={ang} hot={north > 0 ? ramp(t, north - 0.2, north + 0.4) : 0} />
    </g>
  );
};

// ---------- (B) aurora ----------
const EB = {x: -165, y: 20, R: 74};
const LS = [1.55, 2.1];
const fpt = (L: number, th: number, s: number): P => {
  const r = L * EB.R * Math.sin(th) ** 2;
  return [EB.x + s * r * Math.sin(th), EB.y - r * Math.cos(th)];
};
const FLINES = LS.flatMap((L) => {
  const th0 = Math.asin(1 / Math.sqrt(L));
  return [-1, 1].map((s) => Array.from({length: 41}, (_, j) => fpt(L, Math.PI - th0 - (j / 40) * (Math.PI - 2 * th0), s)));
});
const RAYS = 44;

const PanelB: React.FC<{t: number; on: number; curtain: number}> = ({t, on, curtain}) => {
  const L = LS[1];
  const th0 = Math.asin(1 / Math.sqrt(L));
  const ppos = (k: number, ph: number): P => {
    const top = k % 2 === 0;
    const y0 = -175 + (rand(k * 3.7) - 0.5) * 50;
    const ax = EB.x - L * EB.R;
    if (ph < 0.4) {
      const u = ph / 0.4;
      return [mix(-290 + 20 * rand(k), ax, u), mix(y0, EB.y, u) + 10 * Math.sin(u * Math.PI) * (rand(k * 9.1) - 0.5) * 4];
    }
    const v = (ph - 0.4) / 0.6;
    const thE = top ? th0 + 0.06 : Math.PI - th0 - 0.06;
    const th = mix(Math.PI / 2, thE, v);
    const [x, y] = fpt(L, th, -1);
    const [x2, y2] = fpt(L, th + 0.01, -1);
    const tx = x2 - x;
    const ty = y2 - y;
    const n = Math.hypot(tx, ty) || 1;
    const amp = 9 * (1 - 0.55 * v);
    const g = amp * Math.sin(v * 30 + k);
    return [x - (ty / n) * g, y + (tx / n) * g];
  };
  return (
    <g>
      {/* Matahari di tepi kiri */}
      <circle cx={-290} cy={-178} r={100} fill="url(#soft-force)" opacity={0.9} />
      <circle cx={-290} cy={-178} r={30 + 2 * Math.sin(t * 2)} fill={C.force} opacity={0.85} />
      {/* garis medan Bumi */}
      {FLINES.map((pts, k) => (
        <g key={k}>
          <path d={pathOf(pts)} fill="none" stroke={C.spr} strokeWidth={2.2} opacity={0.55} />
          {[0, 0.5].map((o) => {
            const ph = fr(t * 0.3 + o + k * 0.21);
            const [x, y] = pointAlong(pts, ph);
            return <circle key={o} cx={x} cy={y} r={3.5} fill={C.spr} opacity={cyc(ph)} />;
          })}
        </g>
      ))}
      <circle cx={EB.x} cy={EB.y} r={EB.R} fill="url(#hk-ocean)" />
      <path d={`M${EB.x - 40},${EB.y - 38} q26,-16 44,5 q-8,28 -36,23 Z M${EB.x + 8},${EB.y + 10} q28,-8 36,18 q-18,26 -38,8 Z`} fill="#3f9a72" opacity={0.75} />
      <circle cx={EB.x} cy={EB.y} r={EB.R} fill="none" stroke="#9fd0ff" strokeOpacity={0.5} strokeWidth={2} />
      {[-1, 1].map((sg) => (
        <g key={sg}>
          <ellipse cx={EB.x} cy={EB.y + sg * EB.R * 0.9} rx={28} ry={9} fill="none" stroke={C.work} strokeWidth={4} opacity={(0.4 + 0.35 * Math.sin(t * 5 + sg)) * on} />
          <ellipse cx={EB.x} cy={EB.y + sg * EB.R * 0.9} rx={40} ry={14} fill="url(#soft-work)" opacity={on} />
        </g>
      ))}
      {/* partikel angin Matahari berpilin sepanjang garis medan */}
      {Array.from({length: 8}, (_, k) => {
        const ph = fr(t * 0.2 + k / 8);
        const [x, y] = ppos(k, ph);
        const trail = [1, 2, 3, 4].map((j) => ppos(k, Math.max(0, ph - j * 0.01)));
        return <Spark key={k} x={x} y={y} r={4.5} color="force" trail={trail} opacity={cyc(ph) * on} />;
      })}
      {/* langit malam + tirai aurora */}
      <rect x={20} y={-215} width={310} height={430} rx={18} fill="#060a1c" opacity={0.85} />
      {Array.from({length: 18}, (_, k) => (
        <circle key={k} cx={35 + rand(k) * 280} cy={-200 + rand(k + 50) * 220} r={1 + rand(k + 9) * 1.4} fill="#fff" opacity={0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2 + k))} />
      ))}
      {Array.from({length: RAYS}, (_, i) => {
        const x = 34 + i * 6.6 + 10 * Math.sin(i * 0.16 + t * 0.7);
        const yb = 70 + 24 * Math.sin(i * 0.22 + t * 0.9);
        const hgt = 165 + 55 * Math.sin(i * 0.37 - t * 1.3) + 20 * Math.sin(i * 0.9 + t * 2.1);
        const op = (0.25 + 0.55 * (0.5 + 0.5 * Math.sin(i * 1.7 + t * 2.3))) * curtain;
        return <rect key={i} x={x} y={yb - hgt} width={7.5} height={hgt} fill="url(#hk-aur)" opacity={op} />;
      })}
      <path d="M20,160 L70,108 L110,140 L160,92 L215,146 L262,112 L330,150 L330,215 L20,215 Z" fill="#0a1024" />
      <path d="M20,160 L70,108 L110,140 L160,92 L215,146 L262,112 L330,150" fill="none" stroke="#2c3c6a" strokeWidth={2} />
      <rect x={20} y={-215} width={310} height={430} rx={18} fill="none" stroke="#3a4770" strokeWidth={2} />
    </g>
  );
};

// ---------- (C) MRI ----------
const brainR = (a: number) => 1 + 0.045 * Math.sin(9 * a) + 0.025 * Math.sin(17 * a + 1);
const BRAIN: P[] = Array.from({length: 73}, (_, k) => {
  const a = (k / 72) * TAU;
  return [210 + 78 * brainR(a) * Math.cos(a), -30 + 94 * brainR(a) * Math.sin(a)];
});
const WHITE: P[] = Array.from({length: 49}, (_, k) => {
  const a = (k / 48) * TAU;
  const q = 1 + 0.09 * Math.sin(7 * a + 0.5);
  return [210 + 52 * q * Math.cos(a), -30 + 66 * q * Math.sin(a)];
});

const PanelC: React.FC<{t: number; slide: number; scan: number; ok: number}> = ({t, slide, scan, ok}) => {
  const hx = mix(-290, -50, slide) + 1.5 * Math.sin(t * 0.8);
  const sy = -150 + 250 * scan;
  return (
    <g>
      <defs>
        <clipPath id="hk-slice">
          <rect x={92} y={-160} width={236} height={10 + 250 * scan} />
        </clipPath>
      </defs>
      {/* meja & pasien */}
      <rect x={-335} y={68} width={330} height={14} rx={7} fill="#5d6a8c" />
      <rect x={-320} y={82} width={24} height={110} fill="#3a4770" />
      <g>
        <rect x={hx - 225} y={24} width={200} height={42} rx={20} fill="#9fb3d9" />
        <circle cx={hx} cy={40} r={25} fill="#e8c4a0" />
        <path d={`M${hx - 18},${18} q18,-12 34,4`} fill="none" stroke="#5a4030" strokeWidth={8} strokeLinecap="round" />
      </g>
      {/* badan pemindai (cutaway) */}
      <rect x={-150} y={-200} width={200} height={400} rx={40} fill="#c3cde3" opacity={0.92} />
      <rect x={-150} y={-62} width={200} height={124} fill="#0d1838" opacity={0.78} />
      {[-36, -12, 12, 36].map((dy, k) => {
        const pts: P[] = [
          [-150, dy],
          [50, dy],
        ];
        const ph = fr(t * 0.45 + k * 0.27);
        const [x, y] = pointAlong(pts, ph);
        return (
          <g key={k}>
            <line x1={-150} y1={dy} x2={50} y2={dy} stroke={C.spr} strokeWidth={2} opacity={0.5} />
            <circle cx={x} cy={y} r={3.5} fill={C.spr} opacity={cyc(ph)} />
          </g>
        );
      })}
      <circle cx={hx} cy={40} r={25} fill="#e8c4a0" opacity={0.55} />
      {/* kumparan RF menyapu */}
      <rect x={-150 + 190 * (0.5 + 0.5 * Math.sin(t * 2.2))} y={-200} width={10} height={400} fill={C.cyan} opacity={0.25 * ramp(slide, 0.6, 1)} />
      <rect x={-156} y={-200} width={12} height={400} rx={6} fill="#e8eefc" />
      <rect x={44} y={-200} width={12} height={400} rx={6} fill="#9eabc8" />
      <text x={-50} y={-120} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={34} fill={C.spr} fontWeight={600}>
        B
      </text>
      {/* garis ke layar */}
      <path d={`M${hx + 20},${30} C60,-40 70,-60 92,-60`} fill="none" stroke={C.cyan} strokeWidth={2} strokeDasharray="5 7" strokeDashoffset={-t * 30} opacity={0.6 * ramp(scan, 0, 0.1)} />
      {/* layar irisan */}
      <rect x={86} y={-166} width={248} height={292} rx={14} fill="#05091a" stroke="#5d6a8c" strokeWidth={3} />
      <g clipPath="url(#hk-slice)">
        <ellipse cx={210} cy={-30} rx={92} ry={110} fill="#1a2036" stroke="#e8ecf5" strokeWidth={9} opacity={0.9} />
        <path d={pathOf(BRAIN)} fill="#8a93aa" />
        <path d={pathOf(WHITE)} fill="#c9cfdd" />
        <ellipse cx={197} cy={-38} rx={9} ry={26} fill="#222a40" transform="rotate(18 197 -38)" />
        <ellipse cx={223} cy={-38} rx={9} ry={26} fill="#222a40" transform="rotate(-18 223 -38)" />
        <line x1={210} y1={-118} x2={210} y2={-80} stroke="#5d6680" strokeWidth={3} />
      </g>
      <line x1={92} y1={sy} x2={328} y2={sy} stroke={C.cyan} strokeWidth={3} opacity={Math.sin(Math.PI * Math.min(1, scan)) * 0.9 + 0.001} />
      <Label x={210} y={102} size={18} color={C.muted} font="mono" opacity={ramp(scan, 0.5, 1)}>
        irisan otak
      </Label>
      <g opacity={ok}>
        <circle cx={306} cy={-138} r={17} fill={C.work} opacity={0.25} />
        <path d="M297,-138 l7,7 l12,-14" fill="none" stroke={C.work} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
};

// ---------- tata letak ----------
const SLOTS = [360, 960, 1560];
const SLOT_Y = 300;
const SLOT_S = 0.5;
const CVY = 560; // titik temu "satu hal"
const MY = 760; // magnet "medan magnet"
const MPOLES: Pole[] = [
  {x: 960 + 92, y: MY, q: 1},
  {x: 960 - 92, y: MY, q: -1},
];
const MBOX = [560, 1360, 610, 900];
const MLINES = withMirror([-2.5, -1.9, -1.35, -0.85, -0.4, 0.4, 0.85, 1.35, 1.9, 2.5].map((a) => traceB(MPOLES, MPOLES[0].x + 22 * Math.cos(a), MY + 22 * Math.sin(a), 220, 6, 18, MBOX)), MPOLES[1], 960, MY, 0);

// loop arus & magnet kecil
const LX = 620;
const LYc = 470;
const LA = 160;
const LB = 46;
const ETAS = [0.75, 1.05, 1.45, 2.1];
const EX = 1290;
const NX = 1580;
const EY = 440;

const Spinner: React.FC<{x: number; y: number; t: number; kind: 'e' | 'n'; op: number}> = ({x, y, t, kind, op}) => {
  if (op <= 0.001) return null;
  const w = t * 2.6;
  const loops = [70, 105].flatMap((L) => {
    const th0 = Math.asin(Math.sqrt(36 / L));
    return [-1, 1].map((s) =>
      Array.from({length: 31}, (_, j) => {
        const th = th0 + (j / 30) * (Math.PI - 2 * th0);
        const r = L * Math.sin(th) ** 2;
        return [x + s * r * Math.sin(th), y - r * Math.cos(th)] as P;
      }),
    );
  });
  const pre = 0.18 * Math.sin(t * 1.4);
  return (
    <g opacity={op}>
      <Glow x={x} y={y} r={110} color={kind === 'e' ? 'pot' : 'heat'} opacity={0.5} />
      {loops.map((pts, k) => (
        <g key={k}>
          <path d={pathOf(pts)} fill="none" stroke={C.spr} strokeWidth={1.8} opacity={0.45} />
          {(() => {
            const ph = fr(t * 0.4 + k * 0.25);
            const [px, py] = pointAlong(kind === 'e' ? [...pts].reverse() : pts, ph);
            return <circle cx={px} cy={py} r={3} fill={C.spr} opacity={cyc(ph)} />;
          })()}
        </g>
      ))}
      {kind === 'e' ? (
        <g>
          <circle cx={x} cy={y} r={32} fill={C.pot} />
          {[0, 1, 2].map((k) => {
            const c = Math.cos(w + (k * Math.PI) / 3);
            return <ellipse key={k} cx={x} cy={y} rx={Math.abs(c) * 32 + 0.5} ry={32} fill="none" stroke="#dff0ff" strokeOpacity={0.25 + 0.3 * Math.max(0, Math.sin(w + (k * Math.PI) / 3))} strokeWidth={1.6} />;
          })}
          <circle cx={x - 10} cy={y - 12} r={10} fill="#fff" opacity={0.35} />
          <text x={x} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={30} fill="#fff">
            −
          </text>
        </g>
      ) : (
        <g>
          {Array.from({length: 7}, (_, k) => {
            const a = w + (k / 7) * TAU;
            const rr = k === 6 ? 0 : 18;
            const z = Math.cos(a);
            return {k, x: x + rr * Math.sin(a), y: y + (k % 2 ? -9 : 9) * (k === 6 ? 0 : 1) + 4 * z * (k === 6 ? 0 : 1), z: k === 6 ? 0.2 : z};
          })
            .sort((a, b) => a.z - b.z)
            .map((n) => (
              <g key={n.k}>
                <circle cx={n.x} cy={n.y} r={15} fill={n.k % 2 === 0 ? C.heat : '#aab3cc'} stroke="#fff" strokeOpacity={0.35} strokeWidth={1.2} />
                <circle cx={n.x - 5} cy={n.y - 5} r={4.5} fill="#fff" opacity={0.3} />
              </g>
            ))}
        </g>
      )}
      <g transform={`rotate(${pre * 57.3} ${x} ${y})`}>
        <Arrow x1={x} y1={y + 62} x2={x} y2={y - 92} color="gold" width={5} />
      </g>
    </g>
  );
};

export const Hook: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const c = [0, 1, 2, 3, 4, 5].map(cue);

  const pos = (appear: number, move: number, ax: number, ay: number, as: number, k: number) => {
    const m = ramp(t, move, move + 1.0, EASE_IN_OUT);
    return {x: mix(ax, SLOTS[k], m), y: mix(ay, SLOT_Y, m), s: mix(as, SLOT_S, m), op: ramp(t, appear - 0.4, appear + 0.5), m};
  };
  const pA = pos(c[0] - 0.9, c[1] - 0.6, 960, 530, 1.05, 0);
  const pB = pos(c[1] - 0.3, c[2] - 0.6, 960, 650, 0.84, 1);
  const pC = pos(c[2] - 0.3, c[3] - 0.4, 960, 650, 0.84, 2);

  const rel = c[0] + 0.3;
  const north = wordOf(0, 'utara');
  const bOn = ramp(t, c[1] - 0.4, c[1] + 0.6);
  const curtain = 0.35 + 0.65 * ramp(t, wordOf(1, 'tirai') - 0.3, wordOf(1, 'tirai') + 0.8);
  const slide = ramp(t, c[2] - 0.2, c[2] + 1.6, EASE_IN_OUT);
  const scan = ramp(t, wordOf(2, 'memotret') - 0.2, wordOf(2, 'tanpa') - 0.1, lin);
  const ok = ramp(t, wordOf(2, 'sayatan') - 0.3, wordOf(2, 'sayatan') + 0.4);

  const tags = ramp(t, c[3] - 0.1, c[3] + 0.7);
  const conv = ramp(t, wordOf(3, 'satu') - 0.3, wordOf(3, 'hal') + 0.4, EASE_IN_OUT);
  const gl = ramp(t, c[4] - 0.5, c[4] + 0.3);
  const draw = ramp(t, c[4] - 0.8, c[4] + 0.7, EASE_IN_OUT);
  const zp = ramp(t, c[5] - 0.2, c[5] + 1.3, EASE_IN_OUT);
  const zs = 1 + 3 * zp;
  const world = 1 - ramp(t, c[5] + 0.2, c[5] + 1.1, EASE_IN_OUT);
  const loopP = ramp(t, c[5] + 0.5, c[5] + 1.4);
  const ls = ramp(t, wordOf(5, 'listrik') - 0.3, wordOf(5, 'listrik') + 0.5);
  const eP = ramp(t, wordOf(5, 'elektron') - 0.5, wordOf(5, 'elektron') + 0.3);
  const nP = ramp(t, wordOf(5, 'inti') - 0.5, wordOf(5, 'inti') + 0.3);
  const kc = ramp(t, wordOf(5, 'magnet', 1) - 0.3, wordOf(5, 'kecil') + 0.4);
  const end = 1 - ramp(t, dur - 0.6, dur + 0.4, EASE_IN_OUT);

  // loop arus: garis medan = lingkaran di sekitar penampang kawat (⊗ kanan, ⊙ kiri)
  const circ = ETAS.flatMap((eta) => {
    const cc = LA / Math.tanh(eta);
    const r = LA / Math.sinh(eta);
    return [1, -1].map((s) => ({cx: LX + s * cc, r, s}));
  });
  const ringPt = (th: number): P => [LX + LA * Math.cos(th), LYc - LB * Math.sin(th)];
  const back: P[] = Array.from({length: 33}, (_, j) => ringPt((j / 32) * Math.PI));
  const front: P[] = Array.from({length: 33}, (_, j) => ringPt(Math.PI + (j / 32) * Math.PI));

  return (
    <AbsoluteFill style={{opacity: end}}>
      <Stage>
        <defs>
          <radialGradient id="hk-ocean" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#4f9cff" />
            <stop offset="60%" stopColor="#1d4f8f" />
            <stop offset="100%" stopColor="#0b2347" />
          </radialGradient>
          <linearGradient id="hk-aur" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#5fffb0" stopOpacity={0} />
            <stop offset="8%" stopColor="#5fffb0" stopOpacity={0.95} />
            <stop offset="55%" stopColor="#3fe0a0" stopOpacity={0.45} />
            <stop offset="80%" stopColor="#ff5f86" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#ff5f86" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Motes x={960} y={520} rx={900} ry={340} n={34} color="spr" opacity={0.3} seed={2} />
        <g transform={`translate(960 ${MY}) scale(${zs}) translate(-960 ${-MY})`} opacity={world}>
          <g opacity={pA.op} transform={`translate(${pA.x} ${pA.y}) scale(${pA.s})`}>
            <Frame color={C.heat} op={pA.m} />
            <PanelA t={t} rel={rel} north={north} />
          </g>
          <g opacity={pB.op} transform={`translate(${pB.x} ${pB.y}) scale(${pB.s})`}>
            <Frame color={C.work} op={pB.m} />
            <PanelB t={t} on={bOn} curtain={curtain} />
          </g>
          <g opacity={pC.op} transform={`translate(${pC.x} ${pC.y}) scale(${pC.s})`}>
            <Frame color={C.cyan} op={pC.m} />
            <PanelC t={t} slide={slide} scan={scan} ok={ok} />
          </g>
          {['kompas', 'aurora', 'MRI'].map((s, k) => (
            <Label key={s} x={SLOTS[k]} y={SLOT_Y + 150} size={30} color={[C.heat, C.work, C.cyan][k]} weight={600} opacity={tags}>
              {s}
            </Label>
          ))}
          {SLOTS.map((x, k) => (
            <path key={k} d={`M${x},${SLOT_Y + 178} C${x},${SLOT_Y + 240} 960,${SLOT_Y + 200} 960,${CVY - 40}`} fill="none" stroke={C.spr} strokeWidth={3} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - conv)} pathLength={1000} opacity={0.7 * (1 - gl * 0.6)} />
          ))}
          <circle cx={960} cy={CVY - 40} r={9 + 2 * Math.sin(t * 4)} fill={C.spr} opacity={conv * (1 - gl)} />
          <Ripple x={960} y={CVY - 40} p={ramp(t, wordOf(3, 'hal') - 0.1, wordOf(3, 'hal') + 1.3, lin)} r={140} color="spr" />

          {/* medan magnet */}
          <g opacity={gl}>
            <Glow x={960} y={MY} r={330} color="spr" opacity={0.35} />
            {MLINES.map((pts, k) => {
              const d = pathOf(pts);
              return (
                <g key={k}>
                  <path d={d} fill="none" stroke={C.spr} strokeWidth={2.6} opacity={0.6} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - draw)} pathLength={1000} />
                  {[0, 0.5].map((o) => {
                    const ph = fr(t * 0.35 + o + k * 0.13);
                    const [x, y] = pointAlong(pts, ph);
                    return <circle key={o} cx={x} cy={y} r={4} fill={C.spr} opacity={cyc(ph) * draw} />;
                  })}
                </g>
              );
            })}
            <Magnet x={960} y={MY} len={240} h={58} rot={2 * Math.sin(t * 1.2)} />
            <Label x={960} y={CVY + 10} size={66} color={C.spr} weight={700}>
              medan magnet
            </Label>
            <Ripple x={960} y={MY} p={ramp(t, c[4] - 0.1, c[4] + 1.6, lin)} r={360} color="spr" />
          </g>
        </g>

        {/* listrik yang bergerak: loop arus */}
        <g opacity={loopP}>
          <Glow x={LX} y={LYc} r={330} color="cyan" opacity={0.3} />
          <path d={pathOf(back)} fill="none" stroke="#b9733a" strokeWidth={10} strokeLinecap="round" />
          {circ.map((cc, k) => (
            <g key={k}>
              <circle cx={cc.cx} cy={LYc} r={cc.r} fill="none" stroke={C.spr} strokeWidth={2} opacity={0.5 * ls + 0.12} />
              {[0, 0.5].map((o) => {
                const ph = fr(t * 0.12 + o + k * 0.17);
                const th = Math.PI - cc.s * ph * TAU;
                return <circle key={o} cx={cc.cx + cc.r * Math.cos(th)} cy={LYc - cc.r * Math.sin(th)} r={3.8} fill={C.spr} opacity={(0.35 + 0.65 * cyc(ph)) * (0.2 + 0.8 * ls)} />;
              })}
            </g>
          ))}
          <Arrow x1={LX} y1={LYc + 130} x2={LX} y2={LYc - 210} color="spr" width={6} opacity={0.3 + 0.7 * ls} />
          <Label x={LX + 34} y={LYc - 200} size={36} color={C.spr} font="serif" italic weight={600}>
            B
          </Label>
          <path d={pathOf(front)} fill="none" stroke="#e09a5a" strokeWidth={10} strokeLinecap="round" />
          {Array.from({length: 12}, (_, k) => {
            const th = fr(t * 0.16 + k / 12) * TAU;
            const [x, y] = ringPt(th);
            const fb = Math.sin(th) > 0 ? 0.55 : 1;
            return <circle key={k} cx={x} cy={y} r={5.5} fill={C.cyan} opacity={fb} />;
          })}
          <Label x={LX + LA + 40} y={LYc + 34} size={34} color={C.cyan} font="serif" italic weight={600}>
            I
          </Label>
          <Label x={LX} y={LYc + 240} size={28} color={C.muted} font="mono">
            arus melingkar → medan magnet
          </Label>
        </g>

        {/* elektron & inti: magnet kecil */}
        <g transform={`translate(${EX} ${EY}) scale(1.3) translate(${-EX} ${-EY})`}>
          <Spinner x={EX} y={EY} t={t} kind="e" op={eP} />
        </g>
        <g transform={`translate(${NX} ${EY}) scale(1.3) translate(${-NX} ${-EY})`}>
          <Spinner x={NX} y={EY} t={t + 0.7} kind="n" op={nP} />
        </g>
        <Label x={EX} y={EY + 165} size={30} color={C.pot} weight={600} opacity={eP}>
          elektron
        </Label>
        <Label x={NX} y={EY + 165} size={30} color={C.heat} weight={600} opacity={nP}>
          inti atom
        </Label>
        <Label x={(EX + NX) / 2} y={EY + 222} size={32} color={C.gold} weight={700} opacity={kc}>
          spin → magnet kecil
        </Label>
        <Twinkles x={(EX + NX) / 2} y={EY} rx={220} ry={90} n={6} color="gold" opacity={0.7 * kc} seed={4} />

        <text x={960} y={800} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={56} opacity={ls} style={{paintOrder: 'stroke', stroke: 'rgba(7,11,24,0.92)', strokeWidth: 10}}>
          <tspan fill={C.spr}>magnet</tspan>
          <tspan fill={C.muted}> = </tspan>
          <tspan fill={C.cyan}>listrik yang bergerak</tspan>
        </text>
        <Twinkles x={960} y={800} rx={380} ry={36} n={6} color="cyan" opacity={0.6 * ls} seed={3} />
      </Stage>
    </AbsoluteFill>
  );
};
