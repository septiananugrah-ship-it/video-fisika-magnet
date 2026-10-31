import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Frac, Glow, Motes, Ripple, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Enam kartu rangkuman magnet, masing-masing dengan animasi mini yang terus berulang (analitik):
// kutub & garis medan (U → S) · arus → medan + muatan melingkar (gaya Lorentz ⊥ v) · induksi (magnet keluar-masuk
// kumparan, jarum galvanometer ∝ kecepatan) · spektrometer massa (r ∝ m/q, ³⁵Cl : ³⁷Cl ≈ 3:1) · spin ↑↓ & Stern–Gerlach ·
// NMR/MRI (spin berpresesi, gelombang RF, puncak); lalu pertanyaan kunci.
const SW = 444;
const SH = 64;

const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
const ph = (t: number, period: number, off = 0) => ((((t + off) / period) % 1) + 1) % 1;
const MONO = {fontFamily: FONT.mono, fontSize: 15, fill: C.muted} as const;
const bez = (p: [number, number][], u: number): [number, number] => {
  const a = (1 - u) ** 3;
  const b = 3 * (1 - u) ** 2 * u;
  const c = 3 * (1 - u) * u * u;
  const d = u ** 3;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
};

/** 01 · Magnet batang: garis medan keluar U (merah) masuk S (biru), butir ungu mengalir; jarum kompas mengikuti. */
const MiniPoles: React.FC<{t: number}> = ({t}) => {
  const arcs: [number, number][][] = [-30, -16, 16, 30].map((h) => [
    [30, 34],
    [30 - Math.abs(h) * 0.6, 34 + h * 1.4],
    [150 + Math.abs(h) * 0.6, 34 + h * 1.4],
    [150, 34],
  ]);
  return (
    <g>
      {arcs.map((p, k) => (
        <g key={k}>
          <path d={`M${p[0].join(',')} C${p[1].join(',')} ${p[2].join(',')} ${p[3].join(',')}`} fill="none" stroke={C.spr} strokeWidth={1.4} strokeOpacity={0.55} />
          {[0, 1].map((j) => {
            const u = ph(t, 2.6, j * 1.3 + k * 0.4);
            const [x, y] = bez(p, u);
            return <circle key={j} cx={x} cy={y} r={3} fill={C.spr} opacity={cyc(u)} />;
          })}
        </g>
      ))}
      <rect x={30} y={26} width={60} height={16} rx={3} fill={C.heat} />
      <rect x={90} y={26} width={60} height={16} rx={3} fill={C.pot} />
      <text x={60} y={35} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={13} fill="#fff">
        U
      </text>
      <text x={120} y={35} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={13} fill="#fff">
        S
      </text>
      {(() => {
        const a = 0.14 * Math.sin(t * 1.7) + 0.05 * Math.sin(t * 3.1);
        const cx = 240;
        const cy = 34;
        return (
          <g transform={`rotate(${(a * 180) / Math.PI + 180} ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={22} fill="#0d1430" stroke="#8b9ad0" strokeWidth={1.5} />
            <polygon points={`${cx + 18},${cy} ${cx},${cy - 5} ${cx},${cy + 5}`} fill={C.heat} />
            <polygon points={`${cx - 18},${cy} ${cx},${cy - 5} ${cx},${cy + 5}`} fill={C.pot} />
          </g>
        );
      })()}
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.heat}>
        U → S
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.muted}>
        tanpa monopol
      </text>
    </g>
  );
};

/** 02 · Kawat ⊙ (arus keluar) dikelilingi medan berlawanan jarum jam; muatan + melingkar dalam medan ⊗, F ⊥ v. */
const MiniLorentz: React.FC<{t: number}> = ({t}) => {
  const wx = 40;
  const wy = 32;
  const cx = 200;
  const cy = 32;
  const r = 24;
  const a = t * 2.4;
  const x = cx + r * Math.cos(a);
  const y = cy - r * Math.sin(a);
  const vx = -Math.sin(a);
  const vy = -Math.cos(a);
  return (
    <g>
      {[14, 24, 34].map((rr, i) => (
        <g key={rr}>
          <circle cx={wx} cy={wy} r={rr} fill="none" stroke={C.spr} strokeWidth={1.3} strokeOpacity={0.55 - i * 0.12} />
          {(() => {
            const g = t * (1.6 - i * 0.3) + i;
            return <circle cx={wx + rr * Math.cos(g)} cy={wy - rr * Math.sin(g)} r={2.6} fill={C.spr} />;
          })()}
        </g>
      ))}
      <circle cx={wx} cy={wy} r={8} fill="#0d1430" stroke={C.cyan} strokeWidth={2} />
      <circle cx={wx} cy={wy} r={2.5} fill={C.cyan} />
      {Array.from({length: 6}, (_, i) => {
        const gx = 152 + (i % 3) * 48;
        const gy = 8 + Math.floor(i / 3) * 48;
        return (
          <g key={i} stroke={C.spr} strokeOpacity={0.45} strokeWidth={1.3}>
            <line x1={gx - 3} y1={gy - 3} x2={gx + 3} y2={gy + 3} />
            <line x1={gx - 3} y1={gy + 3} x2={gx + 3} y2={gy - 3} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.work} strokeOpacity={0.25} strokeDasharray="3 4" />
      <line x1={x} y1={y} x2={x + vx * 20} y2={y + vy * 20} stroke={C.work} strokeWidth={2.5} markerEnd="url(#arrow-work)" />
      <line x1={x} y1={y} x2={x + (cx - x) * 0.55} y2={y + (cy - y) * 0.55} stroke={C.force} strokeWidth={2.5} markerEnd="url(#arrow-force)" />
      <circle cx={x} cy={y} r={6} fill={C.heat} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.cyan}>
        I → B
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.force}>
        F ⊥ v
      </text>
    </g>
  );
};

/** 03 · Induksi: magnet keluar-masuk kumparan; jarum galvanometer ∝ kecepatan (berbalik saat magnet berbalik arah). */
const MiniInduction: React.FC<{t: number}> = ({t}) => {
  const w = 1.8;
  const mx = 62 + 34 * Math.sin(t * w);
  const v = Math.cos(t * w);
  return (
    <g>
      <rect x={mx - 50} y={26} width={30} height={16} rx={3} fill={C.pot} />
      <rect x={mx - 20} y={26} width={30} height={16} rx={3} fill={C.heat} />
      {Array.from({length: 5}, (_, i) => (
        <ellipse key={i} cx={128 + i * 12} cy={34} rx={6} ry={20} fill="none" stroke={C.kin} strokeWidth={2.5} opacity={0.6 + 0.4 * Math.abs(v)} />
      ))}
      <path d="M176,54 L176,60 L246,60 L246,50" fill="none" stroke="#7d8fcc" strokeWidth={1.5} />
      <path d="M128,54 L128,62" fill="none" stroke="#7d8fcc" strokeWidth={1.5} />
      <circle cx={246} cy={34} r={18} fill="#0d1430" stroke="#8b9ad0" strokeWidth={1.5} />
      <line x1={246} y1={44} x2={246 + 16 * Math.sin(0.8 * v)} y2={44 - 16 * Math.cos(0.8 * v)} stroke={C.kin} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={152 - 18 * v} y1={8} x2={152 + 18 * v} y2={8} stroke={C.kin} strokeWidth={2.5} markerEnd="url(#arrow-kin)" opacity={Math.min(1, Math.abs(v) * 3)} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.kin}>
        ΔΦ → ε
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.muted}>
        Lenz: melawan
      </text>
    </g>
  );
};

/** 04 · Spektrometer massa: ion masuk medan ⊙, berbelok setengah lingkaran; ³⁵Cl (r kecil, 3 bagian) & ³⁷Cl (r besar, 1 bagian). */
const MiniMassSpec: React.FC<{t: number}> = ({t}) => {
  const x0 = 24;
  const y0 = 62;
  const r1 = 60;
  const r2 = 60 * (37 / 35);
  const path = (r: number, u: number): [number, number] => {
    const a = Math.PI - Math.PI * u;
    return [x0 + r + r * Math.cos(a), y0 - r * Math.sin(a)];
  };
  return (
    <g>
      {Array.from({length: 6}, (_, i) => {
        const gx = 50 + (i % 3) * 36;
        const gy = 18 + Math.floor(i / 3) * 26;
        return (
          <g key={i}>
            <circle cx={gx} cy={gy} r={3.5} fill="none" stroke={C.spr} strokeOpacity={0.45} strokeWidth={1.2} />
            <circle cx={gx} cy={gy} r={1} fill={C.spr} opacity={0.6} />
          </g>
        );
      })}
      <path d={`M${x0},${y0} A ${r1} ${r1} 0 0 1 ${x0 + 2 * r1},${y0}`} fill="none" stroke={C.work} strokeOpacity={0.4} strokeWidth={1.5} />
      <path d={`M${x0},${y0} A ${r2} ${r2} 0 0 1 ${x0 + 2 * r2},${y0}`} fill="none" stroke={C.cyan} strokeOpacity={0.35} strokeWidth={1.5} />
      {Array.from({length: 6}, (_, i) => {
        const u = ph(t, 2.4, (i / 6) * 2.4);
        const [x, y] = path(r1, u);
        return <circle key={`a${i}`} cx={x} cy={y} r={3.2} fill={C.work} opacity={cyc(u)} />;
      })}
      {Array.from({length: 2}, (_, i) => {
        const u = ph(t, 2.4, (i / 2) * 2.4 + 0.2);
        const [x, y] = path(r2, u);
        return <circle key={`b${i}`} cx={x} cy={y} r={3.2} fill={C.cyan} opacity={cyc(u)} />;
      })}
      <rect x={x0 + 2 * r1 - 8} y={y0 - 2} width={32} height={6} rx={2} fill="#3a4266" />
      <circle cx={x0 + 2 * r1} cy={y0 + 1} r={5 + 1.5 * Math.sin(t * 4)} fill={C.work} opacity={0.8} />
      <circle cx={x0 + 2 * r2} cy={y0 + 1} r={3 + Math.sin(t * 4 + 1)} fill={C.cyan} opacity={0.6} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.work}>
        r ∝ m/q
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.cyan}>
        ³⁵Cl:³⁷Cl ≈ 3:1
      </text>
    </g>
  );
};

/** 05 · Spin: dua elektron ↑↓ dalam satu orbital; berkas Stern–Gerlach terbelah dua. */
const MiniSpin: React.FC<{t: number}> = ({t}) => {
  const b = 3 * Math.sin(t * 2.4);
  return (
    <g>
      <rect x={20} y={10} width={70} height={48} rx={6} fill="#0d1430" stroke={C.gold} strokeOpacity={0.6} strokeWidth={1.5} />
      <line x1={42} y1={50 + b} x2={42} y2={18 + b} stroke={C.gold} strokeWidth={3} markerEnd="url(#arrow-gold)" />
      <line x1={68} y1={18 - b} x2={68} y2={50 - b} stroke={C.gold} strokeWidth={3} markerEnd="url(#arrow-gold)" />
      <path d="M150,20 L176,20 L170,34 L176,48 L150,48 L156,34 Z" fill="#3a4266" stroke="#8b9ad0" strokeWidth={1.2} />
      {Array.from({length: 8}, (_, i) => {
        const u = ph(t, 1.8, (i / 8) * 1.8);
        const up = i % 2 === 0;
        const x = 110 + u * 170;
        const y = x < 163 ? 34 : 34 + (up ? -1 : 1) * Math.min(24, ((x - 163) ** 2) * 0.004 + (x - 163) * 0.12);
        return <circle key={i} cx={x} cy={y} r={3} fill={C.gold} opacity={cyc(u)} />;
      })}
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.gold}>
        ↑↓ 1 orbital
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.muted}>
        μ ≈ 1 μB
      </text>
    </g>
  );
};

/** 06 · NMR/MRI: spin proton berpresesi di sekitar B, gelombang RF, puncak spektrum bernapas. */
const MiniNMR: React.FC<{t: number}> = ({t}) => {
  const w = t * 4;
  const tipX = 40 + 14 * Math.cos(w);
  const tipY = 16 + 4 * Math.sin(w);
  const rf = Array.from({length: 41}, (_, i) => {
    const x = 74 + i * 2;
    return `${x},${34 - 9 * Math.sin(i * 0.5 - t * 6)}`;
  }).join(' ');
  const peak = (x: number, c: number, h: number) => 58 - h / (1 + ((x - c) / 4) ** 2);
  const amp = 0.8 + 0.2 * Math.sin(t * 2);
  const spec = Array.from({length: 61}, (_, i) => {
    const x = 175 + i * 2;
    return `${x},${(peak(x, 215, 40 * amp) + peak(x, 255, 26 * amp) - 58).toFixed(1)}`;
  }).join(' ');
  return (
    <g>
      <line x1={18} y1={60} x2={18} y2={8} stroke={C.spr} strokeWidth={2.5} markerEnd="url(#arrow-spr)" />
      <ellipse cx={40} cy={16} rx={14} ry={4} fill="none" stroke={C.gold} strokeOpacity={0.35} strokeDasharray="2 3" />
      <circle cx={40} cy={46} r={6} fill="#f2f5ff" />
      <line x1={40} y1={46} x2={tipX} y2={tipY} stroke={C.gold} strokeWidth={3} markerEnd="url(#arrow-gold)" />
      <polyline points={rf} fill="none" stroke={C.kin} strokeWidth={2} />
      <line x1={175} y1={58} x2={295} y2={58} stroke={C.faint} strokeWidth={1.2} />
      <polyline points={spec} fill="none" stroke={C.gold} strokeWidth={2} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.gold}>
        f ∝ B
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.spr}>
        NMR · MRI
      </text>
    </g>
  );
};

const ITEMS: {title: string; color: string; hue: Hue; body: React.ReactNode; size?: number; Mini: React.FC<{t: number}>}[] = [
  {
    title: 'Kutub & garis medan',
    color: C.heat,
    hue: 'heat',
    size: 32,
    body: (
      <span style={{fontFamily: FONT.head, fontWeight: 500}}>
        keluar <span style={{color: C.heat}}>U</span> → masuk <span style={{color: C.pot}}>S</span>
      </span>
    ),
    Mini: MiniPoles,
  },
  {
    title: 'Arus & gaya Lorentz',
    color: C.force,
    hue: 'force',
    body: (
      <span>
        <V color={C.force}>F</V> = <V>q</V>
        <V color={C.work}>v</V> × <V color={C.spr}>B</V>
      </span>
    ),
    Mini: MiniLorentz,
  },
  {
    title: 'Induksi: Faraday & Lenz',
    color: C.kin,
    hue: 'kin',
    body: (
      <span>
        <V>ε</V> = −<V>N</V>{' '}
        <Frac
          n={
            <span>
              d<V color={C.kin}>Φ</V>
            </span>
          }
          d={
            <span>
              d<V>t</V>
            </span>
          }
          size={0.62}
        />
      </span>
    ),
    Mini: MiniInduction,
  },
  {
    title: 'Menimbang molekul',
    color: C.work,
    hue: 'work',
    body: (
      <span>
        <V>r</V> = <Frac n={<span><V>m</V><V color={C.work}>v</V></span>} d={<span><V>q</V><V color={C.spr}>B</V></span>} size={0.62} />
      </span>
    ),
    Mini: MiniMassSpec,
  },
  {
    title: 'Spin elektron',
    color: C.gold,
    hue: 'gold',
    size: 38,
    body: (
      <span>
        <V>m</V>
        <Sub>s</Sub> = ±<Frac n="1" d="2" size={0.62} />
      </span>
    ),
    Mini: MiniSpin,
  },
  {
    title: 'NMR & MRI',
    color: C.spr,
    hue: 'spr',
    body: (
      <span>
        <V color={C.gold}>f</V> = <Frac n={<V>γ</V>} d={<span>2π</span>} size={0.62} />
        <V color={C.spr}>B</V>
      </span>
    ),
    Mini: MiniNMR,
  },
];

const COLS = [400, 960, 1520];
const ROWS = [326, 596];
const CH = 244;

export const Recap: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const s3 = Math.max(cue(4) + 0.2, wordOf(4, 'lorentz') - 0.3);
  const s4 = Math.max(s3 + 1.4, wordOf(4, 'elektron') - 0.3);
  const s5 = Math.max(s4 + 1.4, wordOf(4, 'proton') - 0.3);
  const starts = [cue(1), cue(2), cue(3), s3, s4, s5];
  const nextOf = (i: number) => (i < 5 ? starts[i + 1] : cue(5));
  const head = ramp(t, 0, 0.8);
  const q = ramp(t, cue(5) + 0.2, cue(5) + 1.2);
  const dim = 1 - 0.6 * ramp(t, cue(5), cue(5) + 1.0, EASE_IN_OUT);
  const tA = wordOf(5, 'muatan');
  const tB = wordOf(5, 'fluksnya');
  const hlA = ramp(t, tA - 0.5, tA + 0.3);
  const hlB = ramp(t, tB - 0.6, tB + 0.3);
  // kartu yang diacu pertanyaan menyala lagi: muatan bergerak → kartu 2 (Lorentz), fluks berubah → kartu 3 (induksi)
  const reA = hlA * (1 - 0.6 * hlB);
  const reB = hlB;
  const reOf = (i: number) => (i === 1 ? reA : i === 2 ? reB : 0);
  return (
    <AbsoluteFill>
      <Stage>
        <Motes x={960} y={470} rx={900} ry={330} n={36} color="spr" opacity={0.3} seed={5} />
        {/* latar: jarum kompas kecil melayang & berputar pelan */}
        {Array.from({length: 22}, (_, k) => {
          const p = ph(t, 11 + 5 * rand(k), rand(k * 3.3) * 14);
          const x = 100 + rand(k * 5.1) * 1720 + 14 * Math.sin(t * 0.8 + k);
          const y = 880 - p * 700;
          const a = rand(k * 2.7) * 360 + 25 * Math.sin(t * 0.6 + k);
          return (
            <g key={k} opacity={cyc(p) * 0.35} transform={`rotate(${a} ${x} ${y})`}>
              <polygon points={`${x + 10},${y} ${x},${y - 3} ${x},${y + 3}`} fill={C.heat} />
              <polygon points={`${x - 10},${y} ${x},${y - 3} ${x},${y + 3}`} fill={C.pot} />
            </g>
          );
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const o = ramp(t, 0.2 + i * 0.12, 0.9 + i * 0.12) * (1 - ramp(t, starts[i] - 0.2, starts[i] + 0.4));
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 - i * 0.9);
          return o > 0.01 ? (
            <rect key={it.title} x={x - 250} y={y - CH / 2} width={500} height={CH} rx={20} fill={it.color} fillOpacity={0.03 + 0.03 * pulse} stroke={it.color} strokeOpacity={0.25 + 0.25 * pulse} strokeWidth={2} strokeDasharray="10 9" strokeDashoffset={-t * 16} opacity={o} />
          ) : null;
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const act = win(t, starts[i], nextOf(i), 0.5, 0.6) * dim;
          return (
            <g key={it.title}>
              <Glow x={x} y={y} r={300} color={it.hue} opacity={0.35 * act} />
              <Ripple x={x} y={y} p={(t - starts[i] - 0.1) / 1.3} r={300} color={it.hue} rings={2} width={2} />
            </g>
          );
        })}
        <Glow x={COLS[1]} y={ROWS[0]} r={300} color="cyan" opacity={0.4 * reA} />
        <Glow x={COLS[2]} y={ROWS[0]} r={300} color="kin" opacity={0.4 * reB} />
        <g opacity={q}>
          <Stream
            pts={[
              [90, 800],
              [140, 800],
              [190, 800],
            ]}
            color="cyan"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Stream
            pts={[
              [1730, 800],
              [1780, 800],
              [1830, 800],
            ]}
            color="kin"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Twinkles x={960} y={800} rx={620} ry={40} n={7} color="gold" seed={7} />
        </g>
        <Ripple x={620} y={800} p={(t - tA + 0.3) / 1.4} r={260} color="cyan" rings={2} />
        <Ripple x={1330} y={800} p={(t - tB + 0.3) / 1.4} r={260} color="kin" rings={2} />
      </Stage>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.head, fontSize: 30, letterSpacing: 8 + 2 * (1 - head), color: C.gold, fontWeight: 600, opacity: head}}>
        RANGKUMAN
      </div>
      {ITEMS.map((it, i) => {
        const p = ramp(t, starts[i] - 0.1, starts[i] + 0.7, BACK);
        const x = COLS[i % 3];
        const y = ROWS[Math.floor(i / 3)];
        const re = reOf(i);
        const act = Math.max(win(t, starts[i], nextOf(i), 0.5, 0.6), re);
        const dimI = dim + (1 - dim) * re;
        const mini = ramp(t, starts[i] + 0.4, starts[i] + 1.2);
        const bob = 3 * Math.sin(t * 1.1 + i * 1.3);
        const Mini = it.Mini;
        return (
          <div
            key={it.title}
            style={{
              position: 'absolute',
              left: x - 250,
              top: y - CH / 2,
              width: 500,
              height: CH,
              boxSizing: 'border-box',
              borderRadius: 20,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.95), rgba(10,16,36,0.95))',
              border: `1.5px solid ${it.color}${hex2(0x55 + 0x44 * act)}`,
              borderLeft: `8px solid ${it.color}`,
              boxShadow: `0 16px 44px rgba(0,0,0,0.45), 0 0 ${30 + 30 * act}px ${it.color}${hex2(0x22 + 0x22 * act)}`,
              padding: '18px 28px 0',
              opacity: Math.min(1, p) * dimI,
              scale: String(0.9 + 0.1 * p + 0.02 * act),
              translate: `0px ${bob - 6 * act}px`,
              color: C.ink,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(105deg, transparent ${-40 + p * 150 - 16}%, rgba(255,245,220,0.12) ${-40 + p * 150}%, transparent ${-40 + p * 150 + 16}%)`,
                pointerEvents: 'none',
              }}
            />
            <div style={{fontFamily: FONT.head, fontSize: 26, color: it.color, fontWeight: 600, letterSpacing: 1}}>
              {String(i + 1).padStart(2, '0')} · {it.title}
            </div>
            <div style={{fontFamily: FONT.serif, fontSize: it.size ?? 40, marginTop: 10, whiteSpace: 'nowrap', textAlign: 'center', height: 82, lineHeight: '82px'}}>{it.body}</div>
            <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{display: 'block', marginTop: 2, opacity: mini, overflow: 'visible'}}>
              <Mini t={t + rand(i) * 3} />
            </svg>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 770,
          textAlign: 'center',
          fontFamily: FONT.head,
          fontSize: 46,
          fontWeight: 700,
          color: C.ink,
          opacity: q,
          translate: `0px ${(1 - q) * 20}px`,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{color: C.cyan, textShadow: `0 0 ${26 * hlA}px ${C.cyan}aa`}}>Muatan apa yang sedang bergerak</span>, dan{' '}
        <span style={{color: C.kin, textShadow: `0 0 ${26 * hlB}px ${C.kin}aa`}}>bagaimana fluksnya berubah</span>?
      </div>
    </AbsoluteFill>
  );
};
