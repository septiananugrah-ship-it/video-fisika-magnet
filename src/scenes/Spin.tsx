import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Arrow, Badge, DrawPath, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Sup, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Spin (AUDIT): μ_B = 9,274×10⁻²⁴ J/T ("9,27"); momen spin elektron ≈ 1,001 μ_B ("≈ 1 μ_B").
// Arus loop: arus konvensional berlawanan jarum jam dilihat dari atas → μ ke atas; elektron (−) bergerak searah jarum jam.
// Elipsis loop: titik (cx + rx cos φ, cy − ry sin φ), φ naik = belakang (atas) → kiri → depan (bawah).
// Stern–Gerlach 1922: kutub S runcing di atas, U beralur di bawah → B ke atas, makin kuat di dekat ujung runcing;
// μ searah B tertarik ke medan kuat (naik), μ berlawanan turun. Berkas Ag terbelah dua (bukan pita lebar).
// Pauli: maks 2 elektron per orbital, spin berlawanan. Fe 3d⁶ (aturan Hund): ↑↓ ↑ ↑ ↑ ↑ → 4 spin tak berpasangan.

const TAU = Math.PI * 2;
const GOLD = C.gold;

/** Garis medan dipol (r = R0 sin²θ), θ dari atas sumbu ke bawah; arah aliran = keluar dari atas (U) masuk bawah (S). */
const dipole = (cx: number, cy: number, R0: number, side: 1 | -1, th0 = 0.3, n = 40): [number, number][] =>
  Array.from({length: n + 1}, (_, i) => {
    const th = th0 + ((Math.PI - 2 * th0) * i) / n;
    const s = Math.sin(th);
    return [cx + side * R0 * s * s * s, cy - R0 * s * s * Math.cos(th)];
  });
const pathOf = (pts: [number, number][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

const FieldLines: React.FC<{cx: number; cy: number; R: number[]; th0?: number; o: number; seed?: number}> = ({cx, cy, R, th0 = 0.3, o, seed = 0}) => (
  <g opacity={o}>
    {R.flatMap((R0, i) =>
      ([1, -1] as const).map((sd) => {
        const pts = dipole(cx, cy, R0, sd, th0);
        return (
          <g key={`${i}${sd}`}>
            <path d={pathOf(pts)} fill="none" stroke={C.spr} strokeWidth={2.2} opacity={0.45} />
            <Stream pts={pts} color="spr" n={4} speed={0.16} r={4} opacity={0.8} seed={i * 2 + (sd > 0 ? 0 : 1) + seed} jitter={0} />
          </g>
        );
      }),
    )}
  </g>
);

/** Panah emas sederhana (momen magnet). */
const MuArrow: React.FC<{x: number; y: number; ang: number; len: number; w?: number; o?: number; color?: string}> = ({x, y, ang, len, w = 5, o = 1, color = GOLD}) => {
  // ang = 0 → ke atas; positif = searah jarum jam di layar
  const dx = Math.sin(ang) * len;
  const dy = -Math.cos(ang) * len;
  return (
    <g opacity={o}>
      <line x1={x - dx * 0.55} y1={y - dy * 0.55} x2={x + dx} y2={y + dy} stroke={color} strokeOpacity={0.25} strokeWidth={w * 3} strokeLinecap="round" />
      <line x1={x - dx * 0.55} y1={y - dy * 0.55} x2={x + dx} y2={y + dy} stroke={color} strokeWidth={w} strokeLinecap="round" markerEnd="url(#arrow-gold)" />
    </g>
  );
};

/** Elektron bergaya: bola biru dengan meridian berputar (searah jarum jam dilihat dari atas, μ ke atas). */
const ESphere: React.FC<{x: number; y: number; r: number; t: number; o?: number; spin?: number}> = ({x, y, r, t, o = 1, spin = 1}) => (
  <g opacity={o}>
    <circle cx={x} cy={y + r * 1.15} rx={r} r={0} />
    <ellipse cx={x} cy={y + r + 18} rx={r * 0.8} ry={r * 0.12} fill="#000" opacity={0.3} />
    <circle cx={x} cy={y} r={r * 1.6} fill="url(#soft-pot)" />
    <circle cx={x} cy={y} r={r} fill="url(#sp-e)" />
    {[0, 1, 2, 3].map((i) => {
      const lam = i * (Math.PI / 4) - spin * t * 1.6;
      const s = Math.sin(lam);
      const c = Math.cos(lam);
      const rx = Math.abs(s) * r;
      return (
        <path
          key={i}
          d={`M${x},${y - r} A${rx.toFixed(2)},${r} 0 0 ${s > 0 ? 1 : 0} ${x},${y + r}`}
          fill="none"
          stroke="#cfe6ff"
          strokeWidth={1.6}
          opacity={0.42 * Math.max(0, c)}
        />
      );
    })}
    <ellipse cx={x} cy={y} rx={r} ry={r * 0.22} fill="none" stroke="#cfe6ff" strokeWidth={1.4} opacity={0.3} />
    <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.28} ry={r * 0.18} fill="#fff" opacity={0.35} />
  </g>
);

// ---------- Stern–Gerlach ----------
const SY = 540;
const OVX = 230;
const SL1 = 370;
const SL2 = 450;
const MX0 = 640;
const MX1 = 1080;
const SCX = 1540;
const SPLIT = 120;
const DD = SPLIT / (1 + (2 * (SCX - MX1)) / (MX1 - MX0));
const VA = 520;
const sgY = (x: number, s: number, k: number) => {
  if (x < SL2) return SY + (rand(k * 2.7) - 0.5) * 36 * (1 - (x - OVX) / (SL2 - OVX));
  if (x < MX0) return SY;
  if (x < MX1) {
    const u = (x - MX0) / (MX1 - MX0);
    return SY - s * DD * u * u;
  }
  return SY - s * (DD + (2 * DD * (x - MX1)) / (MX1 - MX0));
};

// ---------- kisi besi ----------
const LCOL = 6;
const LROW = 4;
const LX0 = 1110;
const LY0 = 320;
const LS = 120;

export const Spin: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---------- fase ----------
  const aIn = ramp(t, -0.6, 0.6);
  const aOut = ramp(t, cue(1) - 0.5, cue(1) + 0.3, EASE_IN_OUT);
  const pA = aIn * (1 - aOut);
  const bIn = ramp(t, cue(1) - 0.2, cue(1) + 0.7);
  const bOut = ramp(t, cue(2) - 0.3, cue(2) + 0.3, EASE_IN_OUT);
  const pB = bIn * (1 - bOut);
  const pC = ramp(t, cue(2) + 0.0, cue(2) + 0.7) * (1 - ramp(t, cue(3) - 0.35, cue(3) + 0.25, EASE_IN_OUT));
  const pD = ramp(t, cue(3) - 0.05, cue(3) + 0.7) * (1 - ramp(t, cue(4) - 0.35, cue(4) + 0.25, EASE_IN_OUT));
  const pE = ramp(t, cue(4) - 0.05, cue(4) + 0.7);

  // ================= A: loop arus → elektron mengorbit =================
  const ACX = 600;
  const ACY = 520;
  const RX = 230;
  const RY = 72;
  const toAtom = ramp(t, wordOf(0, 'elektron') - 0.4, wordOf(0, 'elektron') + 0.8, EASE_IN_OUT);
  const fieldA = ramp(t, wordOf(0, 'medan') - 0.4, wordOf(0, 'medan') + 0.6);
  const muA = ramp(t, wordOf(0, 'medan') - 0.1, wordOf(0, 'medan') + 0.7);
  const barOn = ramp(t, wordOf(0, 'medan') + 0.3, wordOf(0, 'medan') + 1.1);
  const lblOrb = ramp(t, wordOf(0, 'kecil') - 0.5, wordOf(0, 'kecil') + 0.3);
  const ring = (a: number, b: number, n = 30) =>
    pathOf(Array.from({length: n + 1}, (_, i) => {
      const ph = a + ((b - a) * i) / n;
      return [ACX + RX * Math.cos(ph), ACY - RY * Math.sin(ph)] as [number, number];
    }));
  const curDots = Array.from({length: 10}, (_, i) => {
    const ph = t * 1.4 + (i * TAU) / 10;
    return {x: ACX + RX * Math.cos(ph), y: ACY - RY * Math.sin(ph), front: Math.sin(ph) < 0};
  });
  const eph = -t * 2.2;
  const ex = ACX + RX * Math.cos(eph);
  const ey = ACY - RY * Math.sin(eph);
  const eTrail = Array.from({length: 8}, (_, k) => {
    const a = eph + 0.09 * (k + 1);
    return [ACX + RX * Math.cos(a), ACY - RY * Math.sin(a)] as [number, number];
  });
  const eFront = Math.sin(eph) < 0;
  const chev = (ph: number) => {
    // panah arus konvensional (berlawanan jarum jam di layar)
    const x = ACX + RX * Math.cos(ph);
    const y = ACY - RY * Math.sin(ph);
    const tx = -RX * Math.sin(ph);
    const ty = -RY * Math.cos(ph);
    const L = Math.hypot(tx, ty);
    return {x, y, ux: tx / L, uy: ty / L};
  };

  // ================= B: elektron = magnet kecil =================
  const BCX = 700;
  const BCY = 540;
  const BR = 140;
  const bScale = mix(0.7, 1, bIn);
  const muB = ramp(t, wordOf(1, 'magnet') - 0.3, wordOf(1, 'magnet') + 0.5);
  const lblMuB = ramp(t, wordOf(1, 'satu') - 0.3, wordOf(1, 'satu') + 0.4);
  const cardMu = Math.min(ramp(t, wordOf(1, 'magneton') - 0.2, wordOf(1, 'magneton') + 0.5), 1 - ramp(t, cue(2) - 0.5, cue(2) - 0.05, EASE_IN_OUT));

  // ================= C: hanya atas atau bawah =================
  const fieldC = ramp(t, wordOf(2, 'medan') - 0.4, wordOf(2, 'medan') + 0.5);
  const settle = ramp(t, wordOf(2, 'diukur') + 0.1, wordOf(2, 'medan') + 0.9, EASE_IN_OUT);
  const lblUp = ramp(t, wordOf(2, 'atas') - 0.3, wordOf(2, 'atas') + 0.3);
  const lblDn = ramp(t, wordOf(2, 'bawah') - 0.3, wordOf(2, 'bawah') + 0.3);
  const qOn = ramp(t, wordOf(2, 'dua') - 0.3, wordOf(2, 'dua') + 0.4);
  const qX = ramp(t, wordOf(2, 'dua') + 0.6, wordOf(2, 'dua') + 1.2);
  const cardMs = Math.min(ramp(t, wordOf(2, 'spin', 0) - 0.2, wordOf(2, 'spin', 0) + 0.5), 1 - ramp(t, cue(3) - 0.6, cue(3) - 0.1, EASE_IN_OUT));
  const angUp = mix(1.1 + 0.5 * Math.sin(t * 0.9), 0, settle) + 0.04 * Math.sin(t * 2.1) * settle;
  const angDn = mix(2.2 + 0.6 * Math.sin(t * 0.7 + 1), Math.PI, settle) + 0.04 * Math.sin(t * 2.3 + 1) * settle;

  // ================= D: Stern–Gerlach =================
  const sgStart = wordOf(3, 'menembakkan') - 0.4;
  const magOn = ramp(t, wordOf(3, 'seragam') - 1.2, wordOf(3, 'seragam') + 0.2);
  const ghost = Math.min(ramp(t, wordOf(3, 'seragam') + 0.1, wordOf(3, 'seragam') + 0.9), 1 - 0.6 * ramp(t, wordOf(3, 'menyebar') - 0.2, wordOf(3, 'menyebar') + 0.5));
  const ghostX = ramp(t, wordOf(3, 'menyebar') - 0.2, wordOf(3, 'menyebar') + 0.4);
  const two = ramp(t, wordOf(3, 'terbelah') - 0.3, wordOf(3, 'terbelah') + 0.5);
  const spot = ramp(t, sgStart + 2.6, sgStart + 6.0);
  const yearOn = ramp(t, wordOf(3, 'sembilan') - 0.3, wordOf(3, 'sembilan') + 0.5);
  const lblAg = ramp(t, wordOf(3, 'perak') - 0.3, wordOf(3, 'perak') + 0.4);
  const DTA = 0.085;
  const kNow = Math.floor((t - sgStart) / DTA);
  const atoms: React.ReactNode[] = [];
  if (pD > 0.001 && kNow >= 0) {
    const life = (SCX - OVX) / VA + 0.5;
    for (let k = Math.max(0, kNow - Math.ceil(life / DTA)); k <= kNow; k++) {
      const a = t - (sgStart + k * DTA);
      if (a < 0) continue;
      const s = rand(k * 7.13 + 0.5) < 0.5 ? 1 : -1;
      const x = Math.min(SCX, OVX + VA * a);
      const y = sgY(x, s, k);
      const landed = a - (SCX - OVX) / VA;
      const op = ramp(a, 0, 0.15) * (1 - ramp(landed, 0, 0.45, EASE_IN_OUT));
      atoms.push(
        <g key={k} opacity={op}>
          <circle cx={x} cy={y} r={14} fill="url(#soft-white)" />
          <circle cx={x} cy={y} r={6.5} fill="url(#sp-ag)" />
          <line x1={x} y1={y + s * 7} x2={x} y2={y - s * 15} stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" markerEnd="url(#arrow-gold)" />
        </g>,
      );
      if (landed > 0 && landed < 0.6) atoms.push(<Ripple key={`r${k}`} x={SCX} y={SY - s * SPLIT} p={landed / 0.6} r={36} color="gold" rings={1} width={2} />);
    }
  }

  // ================= E: Pauli & besi =================
  const tOrb = wordOf(4, 'orbital');
  const a1 = ramp(t, tOrb - 0.4, tOrb + 0.3, EASE_IN_OUT);
  const a2 = ramp(t, wordOf(4, 'dua') - 0.3, wordOf(4, 'dua') + 0.4, EASE_IN_OUT);
  const third = ramp(t, wordOf(4, 'berpasangan') - 0.2, wordOf(4, 'berpasangan') + 1.4);
  const bounce = Math.sin(Math.PI * Math.min(1, third * 1.1)); // turun lalu terpental
  const thirdX = ramp(t, wordOf(4, 'berpasangan') + 0.3, wordOf(4, 'berpasangan') + 0.8);
  const feOn = ramp(t, wordOf(4, 'asal') - 0.4, wordOf(4, 'asal') + 0.4);
  const feFill = (i: number) => ramp(t, wordOf(4, 'asal') + 0.1 + i * 0.22, wordOf(4, 'asal') + 0.5 + i * 0.22, EASE_IN_OUT);
  const latOn = ramp(t, wordOf(4, 'magnet') - 0.8, wordOf(4, 'magnet') + 0.2);
  const align = ramp(t, wordOf(4, 'magnet') + 0.0, wordOf(4, 'besi') + 0.4, EASE_IN_OUT);
  const ferro = ramp(t, wordOf(4, 'besi') - 0.2, wordOf(4, 'besi') + 0.8);

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <radialGradient id="sp-e" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#bfe0ff" />
            <stop offset="40%" stopColor="#3f8cff" />
            <stop offset="100%" stopColor="#0d2a6b" />
          </radialGradient>
          <radialGradient id="sp-ag" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#b9c3dc" />
            <stop offset="100%" stopColor="#59627e" />
          </radialGradient>
          <radialGradient id="sp-fe" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#c9cfe0" />
            <stop offset="55%" stopColor="#6b7493" />
            <stop offset="100%" stopColor="#2a3150" />
          </radialGradient>
          <linearGradient id="sp-ghost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.muted} stopOpacity="0" />
            <stop offset="50%" stopColor={C.muted} stopOpacity="0.55" />
            <stop offset="100%" stopColor={C.muted} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ================= A ================= */}
        {pA > 0.001 ? (
          <g opacity={pA} transform={`translate(${ACX},${ACY}) scale(${1 + 0.35 * aOut}) translate(${-ACX},${-ACY})`}>
            <FieldLines cx={ACX} cy={ACY} R={[330, 470, 600]} th0={0.42} o={fieldA * 0.9} />
            <Glow x={ACX} y={ACY} r={300} color="cyan" opacity={0.35} />
            {/* separuh belakang loop */}
            <path d={ring(0, Math.PI)} fill="none" stroke={C.cyan} strokeWidth={mix(9, 2.5, toAtom)} strokeOpacity={mix(0.75, 0.35, toAtom)} />
            {curDots.filter((d) => !d.front).map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={5} fill="#fff" opacity={0.7 * (1 - toAtom)} />
            ))}
            {!eFront ? <Spark x={ex} y={ey} r={9} color="pot" opacity={toAtom} trail={eTrail} /> : null}
            {/* inti */}
            <Glow x={ACX} y={ACY} r={70} color="heat" opacity={toAtom} />
            <circle cx={ACX} cy={ACY} r={24} fill={C.heat} opacity={toAtom} />
            <Label x={ACX} y={ACY + 1} size={28} weight={700} color="#fff" opacity={toAtom}>
              +
            </Label>
            {/* momen magnet */}
            <Arrow x1={ACX} y1={ACY + 20} x2={ACX} y2={ACY - 230} color="gold" width={8} opacity={muA} />
            <Label x={ACX + 26} y={ACY - 236} anchor="start" size={40} color={GOLD} font="serif" italic opacity={muA}>
              μ
            </Label>
            {/* separuh depan loop */}
            <path d={ring(Math.PI, TAU)} fill="none" stroke={C.cyan} strokeWidth={mix(9, 2.5, toAtom)} strokeOpacity={mix(1, 0.45, toAtom)} />
            {curDots.filter((d) => d.front).map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={5} fill="#fff" opacity={0.85 * (1 - toAtom)} />
            ))}
            {eFront ? <Spark x={ex} y={ey} r={9} color="pot" opacity={toAtom} trail={eTrail} /> : null}
            {/* panah arus */}
            {[1.5 * Math.PI, 0.5 * Math.PI].map((ph, i) => {
              const c = chev(ph);
              return <Arrow key={i} x1={c.x - c.ux * 34} y1={c.y - c.uy * 34} x2={c.x + c.ux * 34} y2={c.y + c.uy * 34} color="cyan" width={5} pulse={false} opacity={0.95} />;
            })}
            <Label x={ACX + 40} y={ACY + RY + 40} anchor="start" size={34} color={C.cyan} font="serif" italic>
              I
            </Label>
            <Label x={ACX - RX - 30} y={ACY + 24} anchor="end" size={26} color={C.pot} opacity={toAtom}>
              <tspan>
                e<tspan baselineShift="super" fontSize="0.65em">−</tspan>
              </tspan>
            </Label>
            <Label x={ACX} y={ACY + RY + 110} size={28} color={C.ink} opacity={lblOrb}>
              elektron mengorbit = arus melingkar kecil
            </Label>
            <Label x={ACX + 470} y={ACY - 200} size={30} color={C.spr} font="serif" italic opacity={fieldA}>
              B
            </Label>
          </g>
        ) : null}
        {/* magnet batang padanan */}
        {pA > 0.001 ? (
          <g opacity={pA * barOn * (1 - aOut)}>
            <FieldLines cx={1480} cy={520} R={[180, 260]} th0={0.62} o={0.8} seed={5} />
            <rect x={1452} y={400} width={56} height={120} rx={8} fill={C.heat} />
            <rect x={1452} y={520} width={56} height={120} rx={8} fill={C.pot} />
            <Label x={1480} y={444} size={30} weight={700} color="#fff">
              U
            </Label>
            <Label x={1480} y={596} size={30} weight={700} color="#fff">
              S
            </Label>
            <Label x={1480} y={760} size={26} color={C.muted}>
              setara magnet batang
            </Label>
          </g>
        ) : null}

        {/* ================= B ================= */}
        {pB > 0.001 ? (
          <g opacity={pB} transform={`translate(${BCX},${BCY}) scale(${bScale}) translate(${-BCX},${-BCY})`}>
            <FieldLines cx={BCX} cy={BCY} R={[300, 420]} th0={0.55} o={muB * 0.85} seed={2} />
            <Motes x={BCX} y={BCY} rx={260} ry={220} n={22} color="pot" opacity={0.5} seed={4} />
            <Arrow x1={BCX} y1={BCY + 200} x2={BCX} y2={BCY + BR - 6} color="gold" width={9} pulse={false} opacity={muB} />
            <ESphere x={BCX} y={BCY + 2 * Math.sin(t * 1.4)} r={BR} t={t} o={0.93} />
            <Arrow x1={BCX} y1={BCY + BR - 6} x2={BCX} y2={BCY - 230} color="gold" width={9} opacity={muB} />
            <Label x={BCX} y={BCY + 4} size={46} weight={600} color="#fff" opacity={0.85}>
              <tspan>
                e<tspan baselineShift="super" fontSize="0.6em">−</tspan>
              </tspan>
            </Label>
            <Label x={BCX + 40} y={BCY - 236} anchor="start" size={40} color={GOLD} weight={600} opacity={lblMuB}>
              <tspan>
                μ ≈ 1 μ<TSub>B</TSub>
              </tspan>
            </Label>
            <Twinkles x={BCX + 140} y={BCY - 236} rx={110} ry={40} n={4} opacity={lblMuB} />
            <Label x={BCX + 210} y={BCY + 30} anchor="start" size={26} color={C.muted} opacity={muB}>
              magnet kecil
            </Label>
          </g>
        ) : null}

        {/* ================= C ================= */}
        {pC > 0.001 ? (
          <g opacity={pC}>
            {/* kutub & medan ke atas */}
            <g opacity={fieldC}>
              <rect x={200} y={790} width={760} height={34} rx={8} fill={C.heat} opacity={0.85} />
              <rect x={200} y={200} width={760} height={34} rx={8} fill={C.pot} opacity={0.85} />
              <Label x={580} y={808} size={24} weight={700} color="#fff">
                U
              </Label>
              <Label x={580} y={218} size={24} weight={700} color="#fff">
                S
              </Label>
              {Array.from({length: 8}, (_, i) => {
                const x = 250 + i * 94;
                const pts: [number, number][] = [
                  [x, 780],
                  [x, 244],
                ];
                return (
                  <g key={i}>
                    <line x1={x} y1={780} x2={x} y2={250} stroke={C.spr} strokeWidth={2} opacity={0.3} markerEnd="url(#arrow-spr)" />
                    <Stream pts={pts} color="spr" n={3} speed={0.35} r={3.5} opacity={0.7} seed={i} jitter={0} />
                  </g>
                );
              })}
              <Label x={985} y={520} anchor="start" size={34} color={C.spr} font="serif" italic>
                B
              </Label>
            </g>
            {[
              {x: 420, ang: angUp, lbl: lblUp, txt: 'atas', c: C.work},
              {x: 740, ang: angDn, lbl: lblDn, txt: 'bawah', c: C.kin},
            ].map((e, i) => {
              const yy = 500 + 8 * Math.sin(t * 1.3 + i * 1.7);
              return (
                <g key={i}>
                  <Glow x={e.x} y={yy} r={150} color="gold" opacity={0.35 + 0.35 * settle} />
                  <ESphere x={e.x} y={yy} r={62} t={t + i} o={0.92} spin={Math.cos(e.ang) >= 0 ? 1 : -1} />
                  <MuArrow x={e.x} y={yy} ang={e.ang} len={150} w={7} />
                  <Label x={e.x} y={yy + 130} size={32} weight={600} color={GOLD} opacity={e.lbl}>
                    {e.txt}
                  </Label>
                </g>
              );
            })}
            <Ripple x={420} y={500} p={ramp(t, wordOf(2, 'atas') - 0.1, wordOf(2, 'atas') + 1.0)} r={120} color="gold" />
            <Ripple x={740} y={500} p={ramp(t, wordOf(2, 'bawah') - 0.1, wordOf(2, 'bawah') + 1.0)} r={120} color="gold" />
            {/* tidak ada arah di antaranya */}
            <g opacity={qOn}>
              <ESphere x={1450} y={560} r={56} t={t * 0.7} o={0.45} />
              <MuArrow x={1450} y={560} ang={0.8 + 0.12 * Math.sin(t * 1.5)} len={130} w={6} o={0.55} />
              <Label x={1560} y={470} size={70} weight={700} color={C.muted} opacity={0.9}>
                ?
              </Label>
              <g opacity={qX}>
                <line x1={1340} y1={440} x2={1570} y2={690} stroke={C.heat} strokeWidth={10} strokeLinecap="round" />
                <line x1={1570} y1={440} x2={1340} y2={690} stroke={C.heat} strokeWidth={10} strokeLinecap="round" />
              </g>
              <Label x={1455} y={760} size={28} color={C.muted} opacity={qX}>
                arah di antaranya: tidak pernah terukur
              </Label>
            </g>
          </g>
        ) : null}

        {/* ================= D: Stern–Gerlach ================= */}
        {pD > 0.001 ? (
          <g opacity={pD}>
            {/* oven */}
            <rect x={130} y={SY - 80} width={150} height={160} rx={20} fill="#1d2448" stroke={C.kin} strokeOpacity={0.7} strokeWidth={2.5} />
            <Glow x={205} y={SY} r={110} color="kin" opacity={0.75} />
            {[0, 1, 2].map((i) => (
              <path key={i} d={`M${160 + i * 30},${SY + 60} q8,-14 0,-28 q-8,-14 0,-28`} fill="none" stroke={C.kin} strokeWidth={3} opacity={0.5 + 0.4 * Math.sin(t * 5 + i)} />
            ))}
            <Label x={205} y={SY + 115} size={26} color={C.muted}>
              oven
            </Label>
            {/* celah */}
            {[SL1, SL2].map((x) => (
              <g key={x}>
                <rect x={x - 5} y={SY - 90} width={10} height={80} rx={3} fill="#5a6488" />
                <rect x={x - 5} y={SY + 10} width={10} height={80} rx={3} fill="#5a6488" />
              </g>
            ))}
            <Label x={410} y={SY - 120} size={26} color={C.ink} opacity={lblAg}>
              berkas atom perak (Ag)
            </Label>
            {/* magnet tak seragam */}
            <g opacity={magOn}>
              <Glow x={860} y={SY} r={240} color="spr" opacity={0.4} />
              <path d={`M${MX0},300 L${MX1},300 L${MX1},${SY - 66} L${MX0},${SY - 66} Z`} fill={C.pot} opacity={0.9} />
              <path d={`M${MX0},${SY - 66} L${MX1},${SY - 66}`} stroke="#bfe0ff" strokeWidth={3} opacity={0.8} />
              <path d={`M${MX0},${SY + 70} L${MX1},${SY + 70} L${MX1},780 L${MX0},780 Z`} fill={C.heat} opacity={0.9} />
              <Label x={(MX0 + MX1) / 2} y={360} size={30} weight={700} color="#fff">
                S
              </Label>
              <Label x={(MX0 + MX1) / 2} y={730} size={30} weight={700} color="#fff">
                U
              </Label>
              {/* penampang: ujung runcing di atas, alur di bawah */}
              <g transform={`translate(${(MX0 + MX1) / 2},${SY + 2})`}>
                <path d="M-70,-66 L-14,-66 L0,-40 L14,-66 L70,-66" fill="none" stroke="#fff" strokeWidth={2} opacity={0} />
              </g>
              <Label x={(MX0 + MX1) / 2} y={830} size={26} color={C.spr}>
                medan magnet tak seragam
              </Label>
            </g>
            {/* sisipan penampang */}
            <g opacity={magOn} transform="translate(1250,250)">
              <circle r={92} fill="#0c1430" stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} />
              <path d="M-70,-80 L70,-80 L70,-34 L14,-34 L0,-6 L-14,-34 L-70,-34 Z" fill={C.pot} opacity={0.9} />
              <path d="M-70,80 L70,80 L70,34 L22,34 Q0,52 -22,34 L-70,34 Z" fill={C.heat} opacity={0.9} />
              {[-46, -24, 0, 24, 46].map((x, i) => (
                <path key={i} d={`M${x},34 Q${x * 0.6},14 ${x * 0.15},-8`} fill="none" stroke={C.spr} strokeWidth={2} opacity={0.85} markerEnd="url(#arrow-spr)" />
              ))}
              <Label x={0} y={118} size={20} color={C.muted}>
                penampang kutub
              </Label>
            </g>
            {/* harapan klasik */}
            <g opacity={ghost}>
              {[-1, -0.5, 0, 0.5, 1].map((f, i) => (
                <line key={i} x1={MX1} y1={SY - DD * f * 0.5} x2={SCX} y2={SY - SPLIT * f} stroke={C.muted} strokeWidth={1.5} strokeDasharray="6 8" opacity={0.5} />
              ))}
              <rect x={SCX - 18} y={SY - SPLIT - 20} width={36} height={2 * SPLIT + 40} rx={14} fill="url(#sp-ghost)" />
              <rect x={SCX - 18} y={SY - SPLIT - 20} width={36} height={2 * SPLIT + 40} rx={14} fill="none" stroke={C.muted} strokeDasharray="5 6" strokeWidth={1.5} />
              <Label x={SCX + 60} y={SY - 4} anchor="start" size={24} color={C.muted}>
                harapan klasik:
              </Label>
              <Label x={SCX + 60} y={SY + 26} anchor="start" size={24} color={C.muted}>
                menyebar
              </Label>
              <line x1={SCX + 56} y1={SY + 28} x2={SCX + 170} y2={SY + 28} stroke={C.heat} strokeWidth={4} opacity={ghostX} />
            </g>
            {/* layar */}
            <path d={`M${SCX - 34},${SY - 230} L${SCX + 34},${SY - 262} L${SCX + 34},${SY + 210} L${SCX - 34},${SY + 242} Z`} fill="#1a2550" stroke={C.ink} strokeOpacity={0.4} strokeWidth={2} opacity={0.9} />
            <Label x={SCX} y={SY - 290} size={26} color={C.muted}>
              layar
            </Label>
            {atoms}
            {[1, -1].map((s) => (
              <g key={s}>
                <Glow x={SCX} y={SY - s * SPLIT} r={70} color="gold" opacity={spot} />
                <ellipse cx={SCX} cy={SY - s * SPLIT} rx={24} ry={10 + 4 * spot} fill={GOLD} opacity={0.85 * spot} />
                <ellipse cx={SCX} cy={SY - s * SPLIT} rx={10} ry={4} fill="#fff" opacity={0.8 * spot} />
              </g>
            ))}
            <Label x={SCX + 60} y={SY - SPLIT} anchor="start" size={28} color={GOLD} weight={600} opacity={two}>
              hasil: tepat dua
            </Label>
            <Label x={SCX + 60} y={SY + SPLIT} anchor="start" size={26} color={GOLD} opacity={two}>
              (↑ dan ↓)
            </Label>
            <Twinkles x={SCX} y={SY} rx={60} ry={SPLIT + 20} n={5} opacity={two} />
          </g>
        ) : null}

        {/* ================= E: Pauli & besi ================= */}
        {pE > 0.001 ? (
          <g opacity={pE}>
            {/* satu orbital */}
            <Label x={500} y={215} size={28} color={C.ink}>
              satu orbital: maks 2 elektron
            </Label>
            <rect x={440} y={280} width={120} height={110} rx={10} fill="#121c3f" stroke={C.work} strokeWidth={3} />
            <line x1={420} y1={410} x2={580} y2={410} stroke={C.work} strokeWidth={3} opacity={0.6} />
            <MuArrow x={478} y={335 - 140 * (1 - a1)} ang={0} len={34} w={5} o={a1} />
            <MuArrow x={522} y={335 - 140 * (1 - a2)} ang={Math.PI} len={34} w={5} o={a2} />
            <Glow x={500} y={335} r={110} color="gold" opacity={0.5 * a2} />
            <g opacity={third > 0 && third < 1 ? 1 - ramp(third, 0.75, 1) : 0}>
              <MuArrow x={640} y={300 - 30 * (1 - bounce) + 0} ang={0} len={30} w={4} o={0.7} />
            </g>
            <g opacity={thirdX * (1 - ramp(t, wordOf(4, 'asal') + 0.6, wordOf(4, 'asal') + 1.2))}>
              <line x1={612} y1={270} x2={668} y2={330} stroke={C.heat} strokeWidth={6} strokeLinecap="round" />
              <line x1={668} y1={270} x2={612} y2={330} stroke={C.heat} strokeWidth={6} strokeLinecap="round" />
              <Label x={710} y={300} anchor="start" size={24} color={C.heat}>
                elektron ke-3 ditolak
              </Label>
            </g>
            <Label x={500} y={450} size={26} color={GOLD} opacity={a2}>
              ↑↓ berpasangan (spin berlawanan)
            </Label>
            {/* Fe 3d6 */}
            <g opacity={feOn}>
              <Label x={140} y={620} anchor="start" size={34} weight={600} color={C.ink}>
                <tspan>
                  Fe: 3d<tspan baselineShift="super" fontSize="0.65em">6</tspan>
                </tspan>
              </Label>
              {Array.from({length: 5}, (_, i) => {
                const x = 330 + i * 102;
                const up = feFill(i);
                const dn = i === 0 ? feFill(5) : 0;
                return (
                  <g key={i}>
                    <Glow x={x + 46} y={620} r={70} color="gold" opacity={i > 0 ? 0.55 * up * (0.75 + 0.25 * Math.sin(t * 2 + i)) : 0} />
                    <rect x={x} y={570} width={92} height={100} rx={8} fill="#121c3f" stroke={C.work} strokeWidth={2.5} />
                    <MuArrow x={x + (i === 0 ? 30 : 46)} y={620 - 100 * (1 - up)} ang={0} len={30} w={4.5} o={up} />
                    <MuArrow x={x + 62} y={620 - 100 * (1 - dn)} ang={Math.PI} len={30} w={4.5} o={dn} />
                  </g>
                );
              })}
              <Label x={636} y={720} size={26} color={GOLD} opacity={feFill(5)}>
                4 spin tak berpasangan
              </Label>
            </g>
            {/* kisi besi */}
            <g opacity={latOn}>
              <Glow x={1410} y={505} r={420} color="gold" opacity={0.35 * ferro} />
              <FieldLines cx={1410} cy={505} R={[460, 560]} th0={0.62} o={ferro * 0.7} seed={7} />
              <rect x={LX0 - 70} y={LY0 - 70} width={LS * (LCOL - 1) + 140} height={LS * (LROW - 1) + 140} rx={22} fill="#141b38" stroke={C.muted} strokeOpacity={0.4} strokeWidth={2} opacity={0.85} />
              {Array.from({length: LCOL * LROW}, (_, i) => {
                const c = i % LCOL;
                const r = Math.floor(i / LCOL);
                const x = LX0 + c * LS;
                const y = LY0 + r * LS;
                const rnd = rand(i * 3.9 + 1) * TAU + 0.6 * Math.sin(t * (0.6 + rand(i) * 0.8) + i);
                const wrap = Math.atan2(Math.sin(rnd), Math.cos(rnd));
                const ang = mix(wrap, 0.05 * Math.sin(t * 2 + i), align);
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r={24} fill="url(#sp-fe)" />
                    <MuArrow x={x} y={y} ang={ang} len={42} w={4.5} o={0.95} />
                  </g>
                );
              })}
              <Label x={1410} y={LY0 + LS * (LROW - 1) + 110} size={28} color={GOLD} weight={600} opacity={ferro}>
                besi: spin sejajar → feromagnet
              </Label>
              <Label x={1410} y={LY0 - 110} size={26} color={C.muted} opacity={1 - align}>
                spin tak berpasangan, arah acak
              </Label>
              <Label x={1410} y={LY0 - 110} size={26} color={GOLD} opacity={align}>
                spin tak berpasangan, sejajar
              </Label>
            </g>
          </g>
        ) : null}
      </Stage>

      {/* ===== kartu ===== */}
      <Formula x={1390} y={330} p={cardMu * pB} accent={C.gold} size={58} caption="magneton Bohr">
        μ<Sub>B</Sub> = 9,27 × 10<Sup>−24</Sup> J/T
      </Formula>
      <Formula x={1450} y={265} p={cardMs * pC} accent={C.gold} size={58} caption="hanya dua hasil ukur">
        <V>m</V>
        <Sub>s</Sub> = +<Frac n="1" d="2" /> atau −<Frac n="1" d="2" />
      </Formula>
      <Badge x={410} y={300} text="Stern & Gerlach · 1922" color={C.gold} opacity={yearOn * pD} />
      <Note x={1390} y={560} p={cardMu * pB * 0} color={C.gold}>
        {''}
      </Note>
      <span style={{display: 'none'}}>{cyc(0) + (DrawPath ? 0 : 1)}</span>
    </AbsoluteFill>
  );
};
