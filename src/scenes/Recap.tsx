import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Frac, Glow, Motes, Ripple, Stage, Stream, Sub, Sup, Twinkles, V, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Enam kartu rangkuman listrik, masing-masing dengan animasi mini yang terus berulang (analitik):
// muatan ± & kelipatan e · Coulomb 1/r² (panah gaya ∝ 1/r², skala sama) · medan & potensial ·
// V = IR dengan arus mengalir (konvensional + → −, elektron sebaliknya) · kisi ion & atom H (−13,6 eV) · elektrolisis & baterai;
// lalu pertanyaan kunci ("di mana muatannya, dan ke mana ia ingin bergerak?").
const SW = 444;
const SH = 64;

const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
const ph = (t: number, period: number, off = 0) => ((((t + off) / period) % 1) + 1) % 1;
const MONO = {fontFamily: FONT.mono, fontSize: 15, fill: C.muted} as const;

/** Muatan kecil (SVG). */
const Chg: React.FC<{x: number; y: number; pos: boolean; r?: number; o?: number}> = ({x, y, pos, r = 10, o = 1}) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={r * 1.9} fill={`url(#soft-${pos ? 'heat' : 'pot'})`} />
    <circle cx={x} cy={y} r={r} fill={pos ? C.heat : C.pot} />
    <line x1={x - r * 0.5} y1={y} x2={x + r * 0.5} y2={y} stroke="#fff" strokeWidth={2} />
    {pos ? <line x1={x} y1={y - r * 0.5} x2={x} y2={y + r * 0.5} stroke="#fff" strokeWidth={2} /> : null}
  </g>
);

/** 01 · Muatan: + dan − saling tarik; muatan datang dalam paket e (titik-titik bertambah 1e, 2e, 3e…). */
const MiniCharge: React.FC<{t: number}> = ({t}) => {
  const d = 34 + 10 * Math.sin(t * 1.6);
  const q = ph(t, 4);
  return (
    <g>
      <Chg x={80 - d} y={34} pos r={11} />
      <Chg x={80 + d} y={34} pos={false} r={11} />
      <line x1={80 - d + 16} y1={34} x2={80 - d + 30} y2={34} stroke={C.force} strokeWidth={2.5} markerEnd="url(#arrow-force)" />
      <line x1={80 + d - 16} y1={34} x2={80 + d - 30} y2={34} stroke={C.force} strokeWidth={2.5} markerEnd="url(#arrow-force)" />
      {Array.from({length: 5}, (_, i) => {
        const o = ramp(q, 0.1 + i * 0.14, 0.18 + i * 0.14) * Math.min(1, (1 - q) * 8);
        return <circle key={i} cx={176 + i * 24} cy={34} r={7} fill={C.pot} stroke="#e4efff" strokeWidth={1} opacity={o} />;
      })}
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.heat}>
        lawan: tarik
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.pot}>
        q = n·e
      </text>
    </g>
  );
};

/** 02 · Coulomb: jarak berubah, panah gaya ∝ 1/r² (skala sama). */
const MiniCoulomb: React.FC<{t: number}> = ({t}) => {
  const r = 70 + 40 * Math.sin(t * 1.1); // 30..110
  const F = Math.min(60, (36 * 70 * 70) / (r * r) / 1.4);
  const cx = 150;
  return (
    <g>
      <line x1={cx - r / 2} y1={56} x2={cx + r / 2} y2={56} stroke={C.muted} strokeWidth={1.2} strokeDasharray="3 4" />
      <text x={cx} y={62} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={14} fill={C.muted}>
        r
      </text>
      <Chg x={cx - r / 2} y={30} pos r={10} />
      <Chg x={cx + r / 2} y={30} pos r={10} />
      <line x1={cx - r / 2 - 13} y1={30} x2={cx - r / 2 - 13 - F} y2={30} stroke={C.force} strokeWidth={3} markerEnd="url(#arrow-force)" />
      <line x1={cx + r / 2 + 13} y1={30} x2={cx + r / 2 + 13 + F} y2={30} stroke={C.force} strokeWidth={3} markerEnd="url(#arrow-force)" />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.muted}>
        r × 2 →
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.force}>
        F ÷ 4
      </text>
    </g>
  );
};

/** 03 · Medan (garis kuning keluar dari +) & potensial (lingkaran ungu sepotensial); muatan uji meluncur keluar. */
const MiniField: React.FC<{t: number}> = ({t}) => {
  const cx = 70;
  const cy = 34;
  const q = ph(t, 2.4);
  return (
    <g>
      {[22, 40, 58].map((r, i) => (
        <circle key={r} cx={cx} cy={cy} r={r * (1 + 0.04 * Math.sin(t * 2 - i))} fill="none" stroke={C.spr} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6 - i * 0.12} />
      ))}
      {Array.from({length: 8}, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <line key={i} x1={cx + Math.cos(a) * 14} y1={cy + Math.sin(a) * 14} x2={cx + Math.cos(a) * 60} y2={cy + Math.sin(a) * 60} stroke={C.force} strokeWidth={1.6} opacity={0.65} />;
      })}
      <Chg x={cx} y={cy} pos r={10} />
      <circle cx={cx + 16 + q * 150} cy={cy} r={5} fill={C.heat} opacity={cyc(q)} />
      <line x1={cx + 24 + q * 150} y1={cy} x2={cx + 38 + q * 150} y2={cy} stroke={C.force} strokeWidth={2.5} markerEnd="url(#arrow-force)" opacity={cyc(q)} />
      <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.force}>
        E = gaya/q
      </text>
      <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.spr}>
        V = energi/q
      </text>
    </g>
  );
};

/** 04 · Rangkaian: baterai + resistor; arus konvensional (toska) + → −, elektron (biru) sebaliknya; resistor berpendar. */
const LOOP: [number, number][] = [
  [30, 10],
  [250, 10],
  [250, 58],
  [30, 58],
  [30, 10],
];
const MiniCircuit: React.FC<{t: number}> = ({t}) => (
  <g>
    <polyline points={LOOP.map((p) => p.join(',')).join(' ')} fill="none" stroke="#7d8fcc" strokeWidth={2.5} />
    {/* baterai di sisi kiri: pelat panjang (+) atas */}
    <rect x={18} y={26} width={24} height={18} fill="#0d1430" />
    <line x1={16} y1={29} x2={44} y2={29} stroke={C.heat} strokeWidth={3} />
    <line x1={22} y1={39} x2={38} y2={39} stroke={C.pot} strokeWidth={4} />
    {/* resistor di atas */}
    <rect x={110} y={2} width={60} height={16} rx={3} fill="#0d1430" />
    <path d="M110,10 L116,3 L126,17 L136,3 L146,17 L156,3 L166,17 L170,10" fill="none" stroke={C.press} strokeWidth={2.5} strokeLinejoin="round" />
    <circle cx={140} cy={10} r={22} fill="url(#soft-press)" opacity={0.6 + 0.3 * Math.sin(t * 3)} />
    {Array.from({length: 6}, (_, i) => {
      // konvensional: keluar dari + (atas baterai) → searah jarum jam di layar: (30,10) → (250,10) → ...
      const p = ph(t, 3.2, (i / 6) * 3.2);
      const [x, y] = pointAlong(LOOP, p);
      return <circle key={`c${i}`} cx={x} cy={y} r={3.5} fill={C.cyan} opacity={0.9} />;
    })}
    {Array.from({length: 6}, (_, i) => {
      const p = ph(t, 4.4, (i / 6) * 4.4 + 0.3);
      const [x, y] = pointAlong(LOOP, 1 - p);
      return <circle key={`e${i}`} cx={x} cy={y + 0} r={3} fill={C.pot} stroke="#e4efff" strokeWidth={0.8} opacity={0.85} />;
    })}
    <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.cyan}>
      I: + → −
    </text>
    <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.pot}>
      e⁻: − → +
    </text>
  </g>
);

/** 05 · Kisi ion (Na⁺ merah, Cl⁻ biru, bergetar) + atom H (elektron mengorbit proton). */
const MiniBond: React.FC<{t: number}> = ({t}) => (
  <g>
    {Array.from({length: 10}, (_, i) => {
      const c = i % 5;
      const r = Math.floor(i / 5);
      const pos = (c + r) % 2 === 0;
      const x = 22 + c * 30 + 1.5 * Math.sin(t * 6 + i * 1.7);
      const y = 20 + r * 28 + 1.5 * Math.cos(t * 5.3 + i);
      return <circle key={i} cx={x} cy={y} r={pos ? 8 : 11} fill={pos ? C.heat : C.pot} opacity={0.9} stroke="#e4efff" strokeWidth={0.8} />;
    })}
    {(() => {
      const cx = 240;
      const cy = 34;
      const a = t * 2.2;
      return (
        <g>
          <ellipse cx={cx} cy={cy} rx={28} ry={24} fill="none" stroke={C.pot} strokeOpacity={0.35} strokeWidth={1.2} />
          <circle cx={cx} cy={cy} r={6} fill={C.heat} />
          <circle cx={cx + 28 * Math.cos(a)} cy={cy + 24 * Math.sin(a)} r={9} fill="url(#soft-pot)" />
          <circle cx={cx + 28 * Math.cos(a)} cy={cy + 24 * Math.sin(a)} r={4} fill={C.pot} />
        </g>
      );
    })()}
    <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.work}>
      kisi NaCl
    </text>
    <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.kin}>
      H: −13,6 eV
    </text>
  </g>
);

/** 06 · Elektrolisis (gelembung di elektroda, listrik → kimia) & baterai (lampu menyala, kimia → listrik). */
const MiniCell: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={12} y={22} width={100} height={40} rx={6} fill={C.water} fillOpacity={0.2} stroke="#8fa0d8" strokeWidth={1.5} />
    <rect x={32} y={10} width={8} height={44} fill={C.pot} />
    <rect x={84} y={10} width={8} height={44} fill={C.heat} />
    {Array.from({length: 6}, (_, i) => {
      const q = ph(t, 1.6, i * 0.53);
      const x = i % 2 ? 46 : 78;
      return <circle key={i} cx={x + 3 * Math.sin(t * 4 + i)} cy={56 - q * 30} r={2 + q * 2.5} fill="none" stroke="#dfeaff" strokeWidth={1.2} opacity={cyc(q)} />;
    })}
    <rect x={150} y={22} width={44} height={40} rx={6} fill="#22305a" stroke="#8fa0d8" strokeWidth={1.5} />
    <rect x={164} y={16} width={16} height={6} rx={2} fill="#8fa0d8" />
    <rect x={154} y={58 - 30 * (0.6 + 0.1 * Math.sin(t))} width={36} height={30 * (0.6 + 0.1 * Math.sin(t))} rx={3} fill={C.work} opacity={0.6} />
    <path d="M194,40 L232,40" fill="none" stroke="#7d8fcc" strokeWidth={2} />
    <circle cx={248} cy={36} r={20} fill="url(#soft-kin)" opacity={0.6 + 0.4 * Math.sin(t * 3)} />
    <circle cx={248} cy={36} r={11} fill={C.kin} opacity={0.75 + 0.25 * Math.sin(t * 3)} />
    <text x={326} y={18} {...MONO} dominantBaseline="central" fill={C.work}>
      listrik→kimia
    </text>
    <text x={326} y={42} {...MONO} dominantBaseline="central" fill={C.kin}>
      kimia→listrik
    </text>
  </g>
);

const ITEMS: {title: string; color: string; hue: Hue; body: React.ReactNode; size?: number; Mini: React.FC<{t: number}>}[] = [
  {
    title: 'Muatan: + dan −',
    color: C.heat,
    hue: 'heat',
    size: 38,
    body: (
      <span>
        <V>e</V> ≈ 1,6×10<Sup>−19</Sup> C
      </span>
    ),
    Mini: MiniCharge,
  },
  {
    title: 'Hukum Coulomb',
    color: C.force,
    hue: 'force',
    body: (
      <span>
        <V color={C.force}>F</V> = <Frac n={<span><V>k</V><V>q</V><Sub>1</Sub><V>q</V><Sub>2</Sub></span>} d={<span><V>r</V><Sup>2</Sup></span>} size={0.62} />
      </span>
    ),
    Mini: MiniCoulomb,
  },
  {
    title: 'Medan & potensial',
    color: C.spr,
    hue: 'spr',
    size: 36,
    body: (
      <span>
        <V color={C.force}>E</V> = <Frac n={<V>F</V>} d={<V>q</V>} size={0.62} />
        <span style={{color: C.muted}}> · </span>
        <V color={C.spr}>V</V> = <Frac n={<V>U</V>} d={<V>q</V>} size={0.62} />
      </span>
    ),
    Mini: MiniField,
  },
  {
    title: 'Arus & rangkaian',
    color: C.cyan,
    hue: 'cyan',
    body: (
      <span>
        <V color={C.spr}>V</V> = <V color={C.cyan}>I</V>
        <V color={C.press}>R</V>
      </span>
    ),
    Mini: MiniCircuit,
  },
  {
    title: 'Ikatan ion & atom H',
    color: C.work,
    hue: 'work',
    size: 38,
    body: (
      <span>
        <V>E</V>
        <Sub>1</Sub> = −13,6 eV
      </span>
    ),
    Mini: MiniBond,
  },
  {
    title: 'Elektrolisis & baterai',
    color: C.kin,
    hue: 'kin',
    size: 30,
    body: <span style={{fontFamily: FONT.head, fontWeight: 500}}>listrik ⇄ reaksi kimia</span>,
    Mini: MiniCell,
  },
];

const COLS = [400, 960, 1520];
const ROWS = [326, 596];
const CH = 244;

export const Recap: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const starts = [
    cue(1),
    Math.max(cue(1) + 1.6, wordOf(1, 'coulomb') - 0.3),
    cue(2),
    Math.max(cue(2) + 1.6, wordOf(2, 'mendorong') - 0.3),
    cue(4),
    Math.max(cue(4) + 1.6, wordOf(4, 'elektrolisis') - 0.3),
  ];
  const nextOf = (i: number) => (i === 3 ? cue(4) : i < 5 ? starts[i + 1] : cue(5));
  const head = ramp(t, 0, 0.8);
  const q = ramp(t, cue(5) + 0.2, cue(5) + 1.2);
  const dim = 1 - 0.6 * ramp(t, cue(5), cue(5) + 1.0, EASE_IN_OUT);
  const tA = wordOf(5, 'muatannya');
  const tB = wordOf(5, 'bergerak');
  const hlA = ramp(t, tA - 0.5, tA + 0.3);
  const hlB = ramp(t, tB - 0.6, tB + 0.3);
  // kartu yang diacu pertanyaan menyala lagi: "di mana muatannya" → kartu 1 (muatan), "ke mana ia ingin bergerak" → kartu 3 (medan & potensial)
  const reA = hlA * (1 - 0.6 * hlB);
  const reB = hlB;
  const reOf = (i: number) => (i === 0 ? reA : i === 2 ? reB : 0);
  // baris kapasitor & rangkaian (baris 3): kartu arus berdenyut lagi
  const capPing = win(t, cue(3), cue(4) - 0.2, 0.5, 0.6);
  return (
    <AbsoluteFill>
      <Stage>
        <Motes x={960} y={470} rx={900} ry={330} n={36} color="cyan" opacity={0.3} seed={5} />
        {/* latar: muatan + dan − melayang pelan */}
        {Array.from({length: 24}, (_, k) => {
          const pos = k % 2 === 0;
          const p = ph(t, 10 + 5 * rand(k), rand(k * 3.3) * 14);
          const x = 100 + rand(k * 5.1) * 1720 + 14 * Math.sin(t * 0.8 + k);
          const y = pos ? 880 - p * 700 : 180 + p * 700;
          return (
            <g key={k} opacity={cyc(p) * 0.35}>
              <circle cx={x} cy={y} r={6} fill="none" stroke={pos ? C.heat : C.pot} strokeWidth={1.5} />
              <line x1={x - 3} y1={y} x2={x + 3} y2={y} stroke={pos ? C.heat : C.pot} strokeWidth={1.5} />
              {pos ? <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke={C.heat} strokeWidth={1.5} /> : null}
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
          const act = Math.max(win(t, starts[i], nextOf(i), 0.5, 0.6), i === 3 ? capPing * 0.7 : 0) * dim;
          return (
            <g key={it.title}>
              <Glow x={x} y={y} r={300} color={it.hue} opacity={0.35 * act} />
              <Ripple x={x} y={y} p={(t - starts[i] - 0.1) / 1.3} r={300} color={it.hue} rings={2} width={2} />
            </g>
          );
        })}
        <Ripple x={COLS[0]} y={ROWS[1]} p={(t - cue(3) - 0.1) / 1.3} r={300} color="cyan" rings={2} width={2} />
        <Glow x={COLS[0]} y={ROWS[0]} r={300} color="heat" opacity={0.4 * reA} />
        <Glow x={COLS[2]} y={ROWS[0]} r={300} color="spr" opacity={0.4 * reB} />
        <g opacity={q}>
          <Stream
            pts={[
              [90, 800],
              [140, 800],
              [190, 800],
            ]}
            color="heat"
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
            color="cyan"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Twinkles x={960} y={800} rx={620} ry={40} n={7} color="gold" seed={7} />
        </g>
        <Ripple x={700} y={800} p={(t - tA + 0.3) / 1.4} r={260} color="heat" rings={2} />
        <Ripple x={1300} y={800} p={(t - tB + 0.3) / 1.4} r={260} color="cyan" rings={2} />
      </Stage>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.head, fontSize: 30, letterSpacing: 8 + 2 * (1 - head), color: C.gold, fontWeight: 600, opacity: head}}>
        RANGKUMAN
      </div>
      {ITEMS.map((it, i) => {
        const p = ramp(t, starts[i] - 0.1, starts[i] + 0.7, BACK);
        const x = COLS[i % 3];
        const y = ROWS[Math.floor(i / 3)];
        const re = reOf(i);
        const act = Math.max(win(t, starts[i], nextOf(i), 0.5, 0.6), re, i === 3 ? capPing * 0.7 : 0);
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
        <span style={{color: C.heat, textShadow: `0 0 ${26 * hlA}px ${C.heat}aa`}}>Di mana muatannya</span>, dan{' '}
        <span style={{color: C.cyan, textShadow: `0 0 ${26 * hlB}px ${C.cyan}aa`}}>ke mana ia ingin bergerak</span>?
      </div>
    </AbsoluteFill>
  );
};
