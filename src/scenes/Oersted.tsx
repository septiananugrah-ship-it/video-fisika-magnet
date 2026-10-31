import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN, EASE_IN_OUT, cyc, mix, ramp, smoothPath} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Sup, Twinkles, V, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Ørsted 1820 (AUDIT): arus → medan melingkar (kaidah tangan kanan); B = μ0 I/(2πr): 10 A, 10 cm → 20 μT ≈ medan Bumi;
// kumparan ≈ magnet batang (elektromagnet). Arah: arus ⊙ keluar layar → medan berlawanan jarum jam di layar.

type P = [number, number];
const fr = (v: number) => ((v % 1) + 1) % 1;
const deg = (r: number) => (r * 180) / Math.PI;
const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));
/** Respons teredam mulus (mulai dari nol tanpa loncatan kecepatan). */
const damp = (x: number, w = 5, k = 1.6) => (x <= 0 ? 0 : 1 - Math.exp(-k * x) * (Math.cos(w * x) + (k / w) * Math.sin(w * x)));
/** Lingkaran berlawanan jarum jam di layar (sweep 0). */
const circ = (cx: number, cy: number, r: number) => `M${cx + r},${cy} A${r},${r} 0 1 0 ${cx - r},${cy} A${r},${r} 0 1 0 ${cx + r},${cy}`;

const Chev: React.FC<{x: number; y: number; ang: number; s?: number; color: string; op?: number}> = ({x, y, ang, s = 9, color, op = 1}) =>
  op <= 0.001 ? null : (
    <path d={`M${-s},${-0.8 * s} L${s},0 L${-s},${0.8 * s} L${-0.4 * s},0 Z`} transform={`translate(${x},${y}) rotate(${ang})`} fill={color} opacity={op} />
  );

const DotSym: React.FC<{x: number; y: number; r: number; op?: number}> = ({x, y, r, op = 1}) => (
  <g opacity={op}>
    <circle cx={x} cy={y} r={r} fill="none" stroke={C.cyan} strokeWidth={3} />
    <circle cx={x} cy={y} r={r * 0.32} fill={C.cyan} />
  </g>
);

/* ---------- kompas (tampak atas) ---------- */
const Compass: React.FC<{x: number; y: number; r: number; ang: number; letters?: boolean}> = ({x, y, r, ang, letters}) => (
  <g>
    <circle cx={x} cy={y + r * 0.06} r={r * 1.04} fill="#000" opacity={0.35} />
    <circle cx={x} cy={y} r={r} fill="#0f1a3a" stroke={C.gold} strokeOpacity={0.75} strokeWidth={r * 0.06} />
    <circle cx={x} cy={y} r={r * 0.9} fill="none" stroke={C.gold} strokeOpacity={0.25} strokeWidth={1.5} />
    {letters
      ? Array.from({length: 36}, (_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const l = i % 9 === 0 ? 0.16 : 0.07;
          return (
            <line
              key={i}
              x1={x + Math.cos(a) * r * 0.9}
              y1={y + Math.sin(a) * r * 0.9}
              x2={x + Math.cos(a) * r * (0.9 - l)}
              y2={y + Math.sin(a) * r * (0.9 - l)}
              stroke={C.muted}
              strokeWidth={i % 9 === 0 ? 3 : 1.5}
              opacity={0.7}
            />
          );
        })
      : null}
    <g transform={`translate(${x},${y}) rotate(${ang})`}>
      <path d={`M0,${-r * 0.78} L${r * 0.09},0 L${-r * 0.09},0 Z`} fill={C.heat} />
      <path d={`M0,${r * 0.78} L${r * 0.09},0 L${-r * 0.09},0 Z`} fill={C.pot} />
      <path d={`M0,${-r * 0.78} L${r * 0.09},0 L0,0 Z`} fill="#fff" opacity={0.18} />
    </g>
    <circle cx={x} cy={y} r={r * 0.07} fill={C.gold} />
  </g>
);

/* ---------- kumparan / solenoid (fase akhir) ---------- */
const SC: P = [700, 500];
const SL = 255; // setengah panjang
const SR = 118; // jari-jari
const NT = 9;
// medan penampang kumparan: kawat atas ⊙, bawah ⊗ (arus 2D), B_svg = s·(dy, −dx)/r² → di dalam ke kanan (menuju U)
const WIRES: [number, number, number][] = [];
for (let i = 0; i < 40; i++) {
  const x = SC[0] - SL + ((i + 0.5) * 2 * SL) / 40;
  WIRES.push([x, SC[1] - SR, 1], [x, SC[1] + SR, -1]);
}
const sfield = (x: number, y: number): P => {
  let bx = 0;
  let by = 0;
  for (const [wx, wy, s] of WIRES) {
    const dx = x - wx;
    const dy = y - wy;
    const r2 = dx * dx + dy * dy + 25;
    bx += (s * dy) / r2;
    by += (-s * dx) / r2;
  }
  return [bx, by];
};
const traceSol = (o: number): P[] => {
  const x0 = SC[0];
  const y0 = SC[1] + o;
  let x = x0;
  let y = y0;
  const pts: P[] = [[x, y]];
  const h = 4;
  for (let i = 0; i < 4000; i++) {
    const [ax, ay] = sfield(x, y);
    const m1 = Math.hypot(ax, ay);
    const [bx, by] = sfield(x + (0.5 * h * ax) / m1, y + (0.5 * h * ay) / m1);
    const m2 = Math.hypot(bx, by);
    x += (h * bx) / m2;
    y += (h * by) / m2;
    if (i > 60 && Math.hypot(x - x0, y - y0) < 6) {
      pts.push([x0, y0]);
      break;
    }
    if (i % 3 === 2) pts.push([x, y]);
  }
  return pts;
};
const SOL_O = [-66, -40, -15, 15, 40, 66];
const SOL_LOOPS: P[][] = SOL_O.map(traceSol);
const SOL_PATHS = SOL_LOOPS.map((l) => smoothPath(l));

/* ---------- penjepit kertas ---------- */
const Clip: React.FC<{x: number; y: number; rot: number; op?: number}> = ({x, y, rot, op = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot})`} opacity={op}>
    <path d="M-5,10 L-5,-12 A5,5 0 0 1 5,-12 L5,14 A7,7 0 0 1 -9,14 L-9,-14 A9,9 0 0 1 9,-14 L9,8" fill="none" stroke="#d6def2" strokeWidth={2.6} strokeLinecap="round" />
  </g>
);
const CLIP_REST: [number, number, number][] = [
  [1395, 818, -78],
  [1448, 822, 72],
  [1548, 819, -64],
  [1600, 821, 84],
];

export const Oersted: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  /* ===== waktu ===== */
  const tOn = wordOf(0, 'dialiri');
  const on = ramp(t, tOn - 0.1, tOn + 0.4);
  const aOp = Math.min(ramp(t, -0.5, 0.5), 1 - ramp(t, cue(1) - 0.5, cue(1) + 0.4, EASE_IN_OUT));
  const bOp = slot(t, cue(1) - 0.2, cue(4) + 0.3, 0.8, 0.7);
  const dOp = ramp(t, cue(4) + 0.1, cue(4) + 1.0);

  /* ===== fase A: kompas di bawah kawat (tampak atas) ===== */
  const WX = 780;
  const CY = 530;
  const loop: P[] = [
    [WX, 830],
    [WX, 230],
    [1260, 230],
    [1260, 830],
    [WX, 830],
  ];
  const needle = -64 * damp(t - tOn) + 2.2 * Math.sin(1.7 * t) * (1 - 0.6 * on);
  const sw = ramp(t, tOn - 0.6, tOn - 0.05, EASE_IN_OUT); // tuas sakelar
  const lev = ((1 - sw) * 32 * Math.PI) / 180;
  const camA = 1 + 0.05 * ramp(t, tOn - 0.3, tOn + 2.5, EASE_IN_OUT);

  /* ===== fase B: tampak ujung kawat ===== */
  const pR = ramp(t, cue(2) - 0.5, cue(2) + 0.8, EASE_IN_OUT);
  const wx = mix(960, 600, pR);
  const wy = 530;
  const RAD = [80, 145, 215, 290];
  const tMed = wordOf(1, 'medan');
  const pc = ramp(t, tMed - 0.2, tMed + 1.4, EASE_IN_OUT);
  const hOp = slot(t, cue(2) - 0.1, cue(3) + 0.2, 0.7, 0.6);
  const HX = 1400;
  const pOp = slot(t, cue(3) - 0.2, cue(4) + 0.2, 0.6, 0.6);
  const rp = 205 + 55 * Math.sin(0.8 * (t - cue(3)));
  const php = (35 * Math.PI) / 180;
  const probe: P = [wx + rp * Math.cos(php), wy - rp * Math.sin(php)];
  const bLen = (95 * 205) / rp;
  const tArus = wordOf(3, 'arus');
  const tBumi = wordOf(3, 'bumi');
  const bars = ramp(t, tBumi - 1.3, tBumi - 0.1);

  /* ===== fase D: kumparan & elektromagnet ===== */
  const tG = wordOf(4, 'gulung');
  const turnOp = Array.from({length: NT}, (_, k) => ramp(t, tG + 0.1 + 0.13 * k, tG + 0.5 + 0.13 * k));
  const nOn = turnOp.reduce((a, b) => a + b, 0) / NT;
  const tBat = wordOf(4, 'batang');
  const poleOp = ramp(t, tBat - 0.6, tBat + 0.2);
  const ghost = slot(t, wordOf(4, 'persis') - 0.3, wordOf(4, 'elektromagnet') + 0.4, 0.6, 0.8);
  const nailOp = ramp(t, wordOf(4, 'persis') + 0.2, wordOf(4, 'persis') + 1.0);
  const tMag = wordOf(4, 'inilah') - 0.1;
  const mag = ramp(t, tMag - 0.2, tMag + 0.3);
  const NX = 1490;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="oe-cu" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0b07a" />
            <stop offset="100%" stopColor="#8a4e2a" />
          </linearGradient>
          <radialGradient id="oe-cu-r" cx="38%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffd2a6" />
            <stop offset="55%" stopColor="#c47a44" />
            <stop offset="100%" stopColor="#5e3018" />
          </radialGradient>
          <linearGradient id="oe-nail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5a6588" />
            <stop offset="45%" stopColor="#c9d2ea" />
            <stop offset="100%" stopColor="#4a5576" />
          </linearGradient>
          <linearGradient id="oe-skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4c9a4" />
            <stop offset="100%" stopColor="#c98d66" />
          </linearGradient>
          <clipPath id="oe-solclip">
            <rect x={110} y={170} width={1190} height={712} />
          </clipPath>
        </defs>

        {/* ======================= FASE A ======================= */}
        {aOp > 0.001 ? (
          <g opacity={aOp} transform={`translate(${WX},${CY}) scale(${camA}) translate(${-WX},${-CY})`}>
            <Glow x={WX} y={CY} r={330} color="gold" opacity={0.35} />
            <Compass x={WX} y={CY} r={170} ang={needle} letters />
            {['U', 'T', 'S', 'B'].map((l, i) => {
              const a = -Math.PI / 2 + (i * Math.PI) / 2;
              return (
                <Label key={l} x={WX + Math.cos(a) * 205 + (i % 2 === 0 ? 30 : 0)} y={CY + Math.sin(a) * 205} size={30} color={l === 'U' ? C.heat : C.muted} weight={700}>
                  {l}
                </Label>
              );
            })}
            {/* busur simpangan */}
            <path
              d={`M${WX},${CY - 62} A62,62 0 0 ${needle < 0 ? 0 : 1} ${WX + 62 * Math.sin((needle * Math.PI) / 180)},${CY - 62 * Math.cos((needle * Math.PI) / 180)}`}
              fill="none"
              stroke={C.gold}
              strokeWidth={3}
              strokeDasharray="6 6"
              opacity={on * 0.8}
            />
            {/* rangkaian */}
            <path d="M780,830 L780,230 L1260,230 L1260,500 M1260,560 L1260,830 L1050,830 M990,830 L780,830" fill="none" stroke="url(#oe-cu)" strokeWidth={9} strokeLinecap="round" />
            <path d="M780,830 L780,230 L1260,230 L1260,500 M1260,560 L1260,830 L1050,830 M990,830 L780,830" fill="none" stroke={C.cyan} strokeWidth={24} opacity={0.14 * on} strokeLinecap="round" />
            <Stream pts={loop} color="cyan" n={34} speed={0.07} r={4} opacity={on} jitter={0} />
            {/* baterai: pelat panjang (+) di bawah, arus mengalir turun di sisi kanan */}
            <line x1={1240} y1={512} x2={1280} y2={512} stroke={C.ink} strokeWidth={6} />
            <line x1={1222} y1={550} x2={1298} y2={550} stroke={C.ink} strokeWidth={4} />
            <Label x={1320} y={510} size={24} color={C.muted}>
              −
            </Label>
            <Label x={1322} y={552} size={24} color={C.muted}>
              +
            </Label>
            {/* sakelar */}
            <circle cx={990} cy={830} r={7} fill={C.ink} />
            <circle cx={1050} cy={830} r={7} fill={C.ink} />
            <line x1={990} y1={830} x2={990 + 62 * Math.cos(lev)} y2={830 - 62 * Math.sin(lev)} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
            <Label x={1020} y={790} size={24} color={C.muted} opacity={1 - on}>
              arus mati
            </Label>
            <Label x={1020} y={790} size={24} color={C.cyan} opacity={on}>
              arus mengalir
            </Label>
            <Arrow x1={735} y1={330} x2={735} y2={255} color="cyan" width={5} opacity={on} />
            <Label x={705} y={292} size={32} color={C.cyan} font="serif" italic opacity={on}>
              I
            </Label>
            <Ripple x={WX} y={CY} p={ramp(t, tOn + 0.05, tOn + 1.6, (x) => x)} r={240} color="spr" />
          </g>
        ) : null}
        {aOp > 0.001 ? (
          <g opacity={aOp}>
            <Label x={1580} y={470} size={130} color={C.gold} opacity={0.14} font="mono" weight={600}>
              1820
            </Label>
            <Label x={1580} y={600} size={28} color={C.ink} opacity={on}>
              jarum kompas menyimpang
            </Label>
            <Label x={1580} y={640} size={28} color={C.muted} opacity={on}>
              saat kawat dialiri arus
            </Label>
            <Motes x={WX} y={CY} rx={300} ry={260} n={22} color="gold" opacity={0.35} seed={3} />
          </g>
        ) : null}

        {/* ======================= FASE B ======================= */}
        {bOp > 0.001 ? (
          <g opacity={bOp}>
            <Glow x={wx} y={wy} r={360} color="spr" opacity={0.35 * pc} />
            {RAD.map((r, k) => {
              const p = ramp(t, tMed - 0.2 + 0.28 * k, tMed + 1.1 + 0.28 * k, EASE_IN_OUT);
              const op = 0.9 * Math.pow(80 / r, 0.45);
              const w = 0.9 * Math.pow(80 / r, 1.2);
              const n = k === 0 ? 2 : 3;
              return (
                <g key={k}>
                  <path d={circ(wx, wy, r)} fill="none" stroke={C.spr} strokeWidth={8} opacity={0.12 * p} />
                  <path d={circ(wx, wy, r)} fill="none" stroke={C.spr} strokeWidth={2.6} opacity={op * p} pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - p)} />
                  {Array.from({length: n}, (_, j) => {
                    const ph = (j / n) * Math.PI * 2 + k * 0.7 + w * t;
                    return <Chev key={j} x={wx + r * Math.cos(ph)} y={wy - r * Math.sin(ph)} ang={deg(Math.atan2(-Math.cos(ph), -Math.sin(ph)))} s={10} color={C.spr} op={p * op} />;
                  })}
                </g>
              );
            })}
            {/* kompas kecil mengikuti medan */}
            {Array.from({length: 6}, (_, j) => {
              const ph = ((j * 60 + 30) * Math.PI) / 180;
              const tg = deg(Math.atan2(-Math.cos(ph), -Math.sin(ph))) + 90; // jarum digambar menunjuk ke atas
              let d = tg;
              while (d > 180) d -= 360;
              while (d < -180) d += 360;
              const q = ramp(t, tMed + 0.3 + 0.12 * j, tMed + 1.8 + 0.12 * j, EASE_IN_OUT);
              const wob = 4 * Math.sin(2.3 * t + j) * (1 - q * 0.7);
              return <Compass key={j} x={wx + 180 * Math.cos(ph)} y={wy - 180 * Math.sin(ph)} r={20} ang={d * q + wob} />;
            })}
            {/* kawat dilihat dari ujungnya */}
            <Glow x={wx} y={wy} r={90} color="cyan" />
            <circle cx={wx} cy={wy} r={34} fill="url(#oe-cu-r)" stroke="#ffd2a6" strokeWidth={2} />
            <DotSym x={wx} y={wy} r={15} />
            <Label x={wx + 290 * Math.cos(0.75) + 26} y={wy - 290 * Math.sin(0.75) - 18} size={40} color={C.spr} font="serif" italic opacity={pc}>
              B
            </Label>
            <Label x={wx} y={858} size={24} color={C.cyan} opacity={pc}>
              ⊙ arus keluar layar · medan berlawanan jarum jam
            </Label>

            {/* probe jarak r (baris 3) */}
            <g opacity={pOp}>
              <line x1={wx + 36 * Math.cos(php)} y1={wy - 36 * Math.sin(php)} x2={probe[0]} y2={probe[1]} stroke={C.ink} strokeWidth={2.5} strokeDasharray="7 6" opacity={0.85} />
              <Label x={(wx + probe[0]) / 2 - 16} y={(wy + probe[1]) / 2 - 22} size={32} font="serif" italic>
                r
              </Label>
              <Arrow
                x1={probe[0]}
                y1={probe[1]}
                x2={probe[0] - bLen * Math.sin(php)}
                y2={probe[1] - bLen * Math.cos(php)}
                color="spr"
                width={6}
              />
              <Spark x={probe[0]} y={probe[1]} r={7} color="spr" />
            </g>
          </g>
        ) : null}

        {/* tangan kanan (baris 2) */}
        {hOp > 0.001 && bOp > 0.001 ? (
          <g opacity={hOp * bOp} transform={`translate(${HX},540) scale(${0.9 + 0.1 * ramp(t, cue(2) - 0.1, cue(2) + 0.7, BACK)}) translate(${-HX},-540)`}>
            {[340, 750].map((ey, e) => (
              <g key={e}>
                <ellipse cx={HX} cy={ey} rx={118} ry={28} fill="none" stroke={C.spr} strokeWidth={3} opacity={0.75} />
                {Array.from({length: 4}, (_, j) => {
                  const ps = (j / 4) * Math.PI * 2 - 1.1 * t + e;
                  const x = HX + 118 * Math.cos(ps);
                  const y = ey + 28 * Math.sin(ps);
                  // ψ berkurang → bagian depan (bawah elips) bergerak ke kanan
                  const ang = deg(Math.atan2(-28 * Math.cos(ps), 118 * Math.sin(ps)));
                  return <Chev key={j} x={x} y={y} ang={ang} s={10} color={C.spr} op={0.55 + 0.45 * Math.max(0, Math.sin(ps))} />;
                })}
              </g>
            ))}
            {/* kawat tegak, arus ke atas */}
            <line x1={HX} y1={215} x2={HX} y2={860} stroke="#c98552" strokeWidth={14} strokeLinecap="round" />
            <line x1={HX} y1={215} x2={HX} y2={860} stroke={C.cyan} strokeWidth={30} opacity={0.12} />
            {Array.from({length: 8}, (_, j) => {
              const ph = fr(t * 0.35 + j / 8);
              return <circle key={j} cx={HX} cy={860 - ph * 645} r={4} fill="#dff8ff" opacity={cyc(ph) * 0.9} />;
            })}
            {[750, 340].map((ey) => (
              <path key={ey} d={`M${HX - 118},${ey} A118,28 0 0 0 ${HX + 118},${ey}`} fill="none" stroke={C.spr} strokeWidth={3.4} opacity={0.95} />
            ))}
            {/* kepalan */}
            <path
              d={`M${HX - 70},${470} Q${HX - 82},${545} ${HX - 66},${625} Q${HX - 10},${650} ${HX + 62},${628} Q${HX + 86},${560} ${HX + 70},${480} Q${HX + 10},${452} ${HX - 70},${470} Z`}
              fill="url(#oe-skin)"
              stroke="#8a5434"
              strokeWidth={3}
            />
            {[505, 545, 585].map((y, i) => (
              <g key={i}>
                <path d={`M${HX - 72},${y} Q${HX},${y + 14} ${HX + 72},${y}`} fill="none" stroke="#8a5434" strokeWidth={3} opacity={0.8} />
                <rect x={HX + 50} y={y - 32} width={16} height={22} rx={7} fill="#f8dcc4" stroke="#8a5434" strokeWidth={1.5} opacity={0.9} />
              </g>
            ))}
            {/* ibu jari ke atas */}
            <path d={`M${HX - 40},${478} L${HX - 40},${405} Q${HX - 26},${388} ${HX - 12},${405} L${HX - 10},${474}`} fill="url(#oe-skin)" stroke="#8a5434" strokeWidth={3} />
            <rect x={HX - 35} y={404} width={18} height={20} rx={7} fill="#f8dcc4" stroke="#8a5434" strokeWidth={1.5} />
            <Arrow x1={HX + 46} y1={330} x2={HX + 46} y2={235} color="cyan" width={6} />
            <Label x={1530} y={280} size={30} color={C.cyan} anchor="start">
              ibu jari → arus I
            </Label>
            <Label x={1530} y={800} size={30} color={C.spr} anchor="start">
              jari → arah B
            </Label>
          </g>
        ) : null}

        {/* batang perbandingan (baris 3) */}
        {bars > 0.001 && bOp > 0.001 ? (
          <g opacity={bars * bOp}>
            <Label x={1060} y={612} size={25} color={C.muted} anchor="start">
              kawat: 10 A, r = 10 cm
            </Label>
            <rect x={1060} y={630} width={600} height={30} rx={8} fill={C.line} opacity={0.5} />
            <rect x={1060} y={630} width={180 * bars} height={30} rx={8} fill={C.spr} />
            <Label x={1060 + 180 * bars + 16} y={646} size={28} color={C.ink} anchor="start" weight={600}>
              20 μT
            </Label>
            <Label x={1060} y={712} size={25} color={C.muted} anchor="start">
              medan Bumi
            </Label>
            <rect x={1060} y={730} width={600} height={30} rx={8} fill={C.line} opacity={0.5} />
            <rect x={1060 + 225 * bars} y={730} width={360 * bars} height={30} rx={8} fill={C.pot} opacity={0.75} />
            <Label x={1060 + 585 * bars + 16} y={746} size={26} color={C.ink} anchor="start">
              ≈ 25–65 μT
            </Label>
            <Twinkles x={1200} y={646} rx={70} ry={30} n={4} color="spr" opacity={bars} />
          </g>
        ) : null}

        {/* ======================= FASE D ======================= */}
        {dOp > 0.001 ? (
          <g opacity={dOp}>
            <Glow x={SC[0]} y={SC[1]} r={420} color="spr" opacity={0.3 * nOn} />
            {/* setengah belakang lilitan */}
            {Array.from({length: NT}, (_, k) => {
              const xk = SC[0] - SL + ((k + 0.5) * 2 * SL) / NT;
              return <path key={k} d={`M${xk},${SC[1] - SR} A20,${SR} 0 0 0 ${xk},${SC[1] + SR}`} fill="none" stroke="#8a4e2a" strokeWidth={6} opacity={0.55 * turnOp[k]} />;
            })}
            {/* magnet batang bayangan */}
            <g opacity={ghost * 0.55}>
              <rect x={SC[0] - SL + 10} y={SC[1] - 36} width={SL - 10} height={72} rx={6} fill={C.pot} />
              <rect x={SC[0]} y={SC[1] - 36} width={SL - 10} height={72} rx={6} fill={C.heat} />
              <Label x={SC[0] - SL / 2} y={SC[1]} size={40} weight={700}>
                S
              </Label>
              <Label x={SC[0] + SL / 2} y={SC[1]} size={40} weight={700}>
                U
              </Label>
            </g>
            {/* garis medan */}
            <g clipPath="url(#oe-solclip)" opacity={ramp(t, tG + 0.3, tG + 1.4) * (0.2 + 0.8 * nOn)}>
              {SOL_PATHS.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={C.spr} strokeWidth={2.6} opacity={0.75} />
              ))}
              {SOL_LOOPS.map((l, i) =>
                [0, 1, 2, 3].map((j) => {
                  const u = fr(t * 0.05 + j / 4 + i * 0.07);
                  const a = pointAlong(l, u);
                  const b = pointAlong(l, Math.min(1, u + 0.004));
                  return <Chev key={`${i}-${j}`} x={a[0]} y={a[1]} ang={deg(Math.atan2(b[1] - a[1], b[0] - a[0]))} s={9} color={C.spr} op={0.95} />;
                }),
              )}
            </g>
            {/* setengah depan lilitan + arus turun di bagian depan */}
            {Array.from({length: NT}, (_, k) => {
              const xk = SC[0] - SL + ((k + 0.5) * 2 * SL) / NT;
              return (
                <g key={k} opacity={turnOp[k]}>
                  <path d={`M${xk},${SC[1] - SR} A20,${SR} 0 0 1 ${xk},${SC[1] + SR}`} fill="none" stroke="url(#oe-cu)" strokeWidth={8} strokeLinecap="round" />
                  {[0, 1].map((j) => {
                    const ph = fr(t * 0.45 + j / 2 + k * 0.13);
                    const ps = -Math.PI / 2 + Math.PI * ph;
                    return <circle key={j} cx={xk + 20 * Math.cos(ps)} cy={SC[1] + SR * Math.sin(ps)} r={4} fill="#dff8ff" opacity={cyc(ph) * 0.9} />;
                  })}
                </g>
              );
            })}
            {/* sumber arus */}
            <path
              d={`M${SC[0] - SL + 29},${SC[1] + SR} L${SC[0] - SL + 29},790 L${SC[0] - 14},790 M${SC[0] + 14},790 L${SC[0] + SL - 29},790 L${SC[0] + SL - 29},${SC[1] + SR}`}
              fill="none"
              stroke="url(#oe-cu)"
              strokeWidth={6}
              opacity={turnOp[0]}
            />
            <line x1={SC[0] - 14} y1={760} x2={SC[0] - 14} y2={820} stroke={C.ink} strokeWidth={4} opacity={turnOp[0]} />
            <line x1={SC[0] + 14} y1={772} x2={SC[0] + 14} y2={808} stroke={C.ink} strokeWidth={7} opacity={turnOp[0]} />
            <Stream
              pts={[
                [SC[0] - 16, 790],
                [SC[0] - SL + 29, 790],
                [SC[0] - SL + 29, SC[1] + SR],
              ]}
              color="cyan"
              n={6}
              speed={0.3}
              r={4}
              jitter={0}
              opacity={nOn}
            />
            <Stream
              pts={[
                [SC[0] + SL - 29, SC[1] + SR],
                [SC[0] + SL - 29, 790],
                [SC[0] + 16, 790],
              ]}
              color="cyan"
              n={6}
              speed={0.3}
              r={4}
              jitter={0}
              opacity={nOn}
              seed={2}
            />
            <Label x={SC[0]} y={845} size={28} color={C.cyan} font="serif" italic opacity={turnOp[0]}>
              I
            </Label>
            {/* kutub */}
            <g opacity={poleOp}>
              <circle cx={SC[0] + SL + 46} cy={SC[1] - SR - 38} r={30} fill={C.heat} opacity={0.9} />
              <Label x={SC[0] + SL + 46} y={SC[1] - SR - 38} size={34} weight={700}>
                U
              </Label>
              <circle cx={SC[0] - SL - 46} cy={SC[1] - SR - 38} r={30} fill={C.pot} opacity={0.9} />
              <Label x={SC[0] - SL - 46} y={SC[1] - SR - 38} size={34} weight={700}>
                S
              </Label>
            </g>
            <Motes x={SC[0]} y={SC[1]} rx={420} ry={260} n={20} color="spr" opacity={0.35} seed={7} />

            {/* paku elektromagnet */}
            <g opacity={nailOp}>
              <Glow x={NX} y={620} r={150} color="spr" opacity={0.6 * mag} />
              {[70, 115].map((rx, i) => (
                <ellipse key={i} cx={NX} cy={440} rx={rx} ry={200 + i * 40} fill="none" stroke={C.spr} strokeWidth={2} strokeDasharray="8 8" strokeDashoffset={-t * 30} opacity={0.4 * mag} />
              ))}
              <line x1={1330} y1={836} x2={1670} y2={836} stroke={C.muted} strokeWidth={3} opacity={0.5} />
              <rect x={1330} y={836} width={340} height={22} fill="url(#ground)" opacity={0.6} />
              <ellipse cx={NX} cy={250} rx={42} ry={11} fill="url(#oe-nail)" stroke="#2c3556" strokeWidth={2} />
              <rect x={NX - 11} y={254} width={22} height={336} fill="url(#oe-nail)" />
              <path d={`M${NX - 11},590 L${NX + 11},590 L${NX},640 Z`} fill="url(#oe-nail)" />
              {Array.from({length: 12}, (_, i) => (
                <line key={i} x1={NX - 16} y1={330 + i * 16} x2={NX + 16} y2={322 + i * 16} stroke="url(#oe-cu)" strokeWidth={5} strokeLinecap="round" />
              ))}
              <path d={`M${NX + 16},322 L1690,322 L1690,395 M1690,445 L1690,506 L${NX + 16},506`} fill="none" stroke="url(#oe-cu)" strokeWidth={5} />
              <line x1={1668} y1={398} x2={1712} y2={398} stroke={C.ink} strokeWidth={6} />
              <line x1={1676} y1={442} x2={1704} y2={442} stroke={C.ink} strokeWidth={4} />
              <Stream
                pts={[
                  [1690, 395],
                  [1690, 322],
                  [NX + 16, 322],
                ]}
                color="cyan"
                n={5}
                speed={0.35}
                r={4}
                jitter={0}
                opacity={mag}
              />
              <Stream
                pts={[
                  [NX + 16, 506],
                  [1690, 506],
                  [1690, 445],
                ]}
                color="cyan"
                n={5}
                speed={0.35}
                r={4}
                jitter={0}
                opacity={mag}
                seed={1}
              />
              {CLIP_REST.map(([rx, ry, rr], i) => {
                const q = ramp(t, tMag + 0.13 * i, tMag + 0.13 * i + 0.55, EASE_IN);
                const hang: [number, number, number] = i < 3 ? [NX + (i === 1 ? -3 : i === 2 ? 3 : 0), 662 + i * 38, 0] : [NX + 26, 652, -32];
                const sway = (3 + i) * Math.sin(1.6 * t + i * 1.3) * q;
                const x = mix(rx, hang[0], q) + (i < 3 ? sway * (i + 1) * 0.6 : 0);
                const y = mix(ry, hang[1], q) - 26 * Math.sin(Math.PI * q);
                return <Clip key={i} x={x} y={y} rot={mix(rr, hang[2], q) + sway} />;
              })}
              <Ripple x={NX} y={650} p={ramp(t, tMag + 0.45, tMag + 1.6, (x) => x)} r={110} color="spr" />
              <Label x={NX} y={205} size={32} color={C.ink} weight={600} opacity={mag}>
                elektromagnet
              </Label>
            </g>
          </g>
        ) : null}
      </Stage>

      <Note x={1580} y={300} p={slot(t, 0.4, cue(1) - 0.1, 0.7, 0.5)} color={C.gold}>
        Hans Christian Ørsted · 1820
      </Note>
      <Formula
        x={1390}
        y={330}
        p={slot(t, wordOf(3, 'besarnya') - 0.3, tArus - 0.1)}
        accent={C.spr}
        size={66}
        caption="medan di sekitar kawat lurus berarus"
      >
        <V color={C.spr}>B</V> ={' '}
        <Frac
          n={
            <>
              μ<Sub>0</Sub> <V color={C.cyan}>I</V>
            </>
          }
          d={
            <>
              2π <V>r</V>
            </>
          }
        />
      </Formula>
      <Formula x={1370} y={330} p={slot(t, tArus - 0.1, cue(4) + 0.1)} accent={C.spr} size={56} caption="I = 10 A, r = 10 cm → 2×10⁻⁵ T">
        <V color={C.spr}>B</V> ={' '}
        <Frac
          n={
            <>
              4π×10<Sup>−7</Sup> · 10
            </>
          }
          d={<>2π · 0,10</>}
        />{' '}
        = 20 μT
      </Formula>
    </AbsoluteFill>
  );
};
