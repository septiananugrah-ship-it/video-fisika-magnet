import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Arrow, DrawPath, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sup, TSub, TSup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, type Hue} from '../theme';

// Spektrometer massa (AUDIT): r = mv/(qB) → r ∝ m/q pada kelajuan sama; ³⁵Cl 75,8 % : ³⁷Cl 24,2 % ≈ 3 : 1.
// B ⊗ (masuk bidang), ion positif bergerak ke kanan: F = qv×B ke ATAS layar → setengah lingkaran berlawanan jarum jam,
// mendarat di detektor (garis x = XE) pada y = YB − 2r. Jari-jari Cl: r37/r35 = 37/35 (skala jujur, ±30 px terpisah).

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

// ---------- geometri alat ----------
const YB = 800; // garis berkas
const XS = 210; // titik ionisasi
const XA1 = 360; // pelat +
const XA2 = 440; // pelat −
const XE = 700; // celah masuk sektor & garis detektor
const FX1 = 1040; // tepi kanan sektor
const FY0 = 186; // tepi atas sektor
const V1 = 160; // px/s di sumber
const VF = 520; // px/s setelah dipercepat
const ACC = (VF * VF - V1 * V1) / (2 * (XA2 - XA1));
const T1 = (XA1 - XS) / V1;
const T2 = (VF - V1) / ACC;
const T3 = (XE - XA2) / VF;
const TPRE = 0.7; // molekul netral melayang masuk sebelum diionkan

type Kind = {r: number; color: Hue; size: number; cl: 0 | 35 | 37};
const GEN: Kind = {r: 215, color: 'heat', size: 7.5, cl: 0};
const LIGHT: Kind = {r: 150, color: 'pot', size: 6, cl: 0};
const HEAVY: Kind = {r: 290, color: 'heat', size: 9.5, cl: 0};
const R35 = 260;
const CL35: Kind = {r: R35, color: 'pot', size: 7, cl: 35};
const CL37: Kind = {r: (R35 * 37) / 35, color: 'heat', size: 7.4, cl: 37};

const flight = (r: number) => T1 + T2 + T3 + (Math.PI * r) / VF;

/** Posisi ion pada umur a (detik sejak diionkan). */
const ionAt = (a: number, r: number): [number, number] => {
  if (a <= T1) return [XS + V1 * Math.max(0, a), YB];
  if (a <= T1 + T2) {
    const u = a - T1;
    return [XA1 + V1 * u + 0.5 * ACC * u * u, YB];
  }
  if (a <= T1 + T2 + T3) return [XA2 + VF * (a - T1 - T2), YB];
  const th = Math.min(Math.PI, ((a - T1 - T2 - T3) * VF) / r);
  return [XE + r * Math.sin(th), YB - r + r * Math.cos(th)];
};

// ---------- grafik spektrum ----------
const GX0 = 1180;
const GX1 = 1760;
const GB = 800; // garis dasar
const GT = 390; // 100 %
const gy = (f: number) => GB - f * (GB - GT);
const gx1 = (mz: number) => GX0 + ((mz - 30) / 10) * (GX1 - GX0);
const gx2 = (mz: number) => GX0 + (mz / 60) * (GX1 - GX0);
// CH₃Cl skematis (bentuk pola, bukan data ukur)
const MOL: {mz: number; h: number; c: Hue}[] = [
  {mz: 15, h: 0.8, c: 'muted'},
  {mz: 35, h: 0.12, c: 'pot'},
  {mz: 37, h: 0.04, c: 'heat'},
  {mz: 47, h: 0.14, c: 'muted'},
  {mz: 49, h: 0.05, c: 'muted'},
  {mz: 50, h: 1.0, c: 'gold'},
  {mz: 52, h: 0.32, c: 'gold'},
];

// ---------- kaca pembesar ----------
const LX = 420;
const LY = 330;
const LR = 125;
const LZ = 3; // perbesaran
const LC = YB - R35 - CL37.r; // pusat (antara dua bintik)

const Otimes: React.FC<{x: number; y: number; s?: number; o: number}> = ({x, y, s = 10, o}) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={s} fill="none" stroke={C.spr} strokeWidth={2} />
    <path d={`M${x - s * 0.62},${y - s * 0.62} L${x + s * 0.62},${y + s * 0.62} M${x + s * 0.62},${y - s * 0.62} L${x - s * 0.62},${y + s * 0.62}`} stroke={C.spr} strokeWidth={2} />
  </g>
);

export const MassSpec: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---------- fase ----------
  const draw = ramp(t, -0.3, 2.6, EASE_IN_OUT);
  const devOn = ramp(t, -0.6, 0.6);
  const cardF = slot(t, wordOf(0, 'lorentz') - 0.3, cue(2) - 0.1);
  const cardR = slot(t, cue(2) + 0.2, cue(3) - 0.15);
  const balOn = Math.min(ramp(t, 0.4, 1.6), 1 - ramp(t, cue(3) - 0.7, cue(3) - 0.1, EASE_IN_OUT));
  const lblLH = Math.min(ramp(t, wordOf(2, 'ringan') - 0.3, wordOf(2, 'ringan') + 0.4), 1 - ramp(t, cue(3) - 0.5, cue(3) + 0.1, EASE_IN_OUT));
  const lblH = Math.min(ramp(t, wordOf(2, 'berat') - 0.3, wordOf(2, 'berat') + 0.4), 1 - ramp(t, cue(3) - 0.5, cue(3) + 0.1, EASE_IN_OUT));
  const ch1 = Math.min(ramp(t, cue(3) - 0.2, cue(3) + 0.7), 1 - ramp(t, cue(4) - 0.1, cue(4) + 0.5, EASE_IN_OUT));
  const ch2 = ramp(t, cue(4) + 0.2, cue(4) + 1.0);
  const cardQ = slot(t, wordOf(3, 'banding') - 0.4, cue(4) - 0.05);
  const pct = ramp(t, wordOf(3, 'banding') - 0.2, wordOf(3, 'banding') + 0.6);
  const loupe = Math.min(ramp(t, cue(3) + 1.2, cue(3) + 2.0), 1 - ramp(t, cue(4) - 0.2, cue(4) + 0.4, EASE_IN_OUT));
  const noteIon = Math.min(ramp(t, wordOf(1, 'diionkan') - 0.2, wordOf(1, 'diionkan') + 0.5), 1 - ramp(t, cue(2) - 0.3, cue(2) + 0.2, EASE_IN_OUT));
  const lblAcc = ramp(t, wordOf(1, 'dipercepat') - 0.3, wordOf(1, 'dipercepat') + 0.4);
  const lblMag = ramp(t, wordOf(1, 'magnet') - 0.3, wordOf(1, 'magnet') + 0.4);
  const lblSrc = ramp(t, wordOf(1, 'diionkan') - 0.5, wordOf(1, 'diionkan') + 0.2);
  const forceOn = Math.min(ramp(t, wordOf(1, 'magnet') + 0.2, wordOf(1, 'magnet') + 0.9), 1 - ramp(t, cue(3) - 0.4, cue(3) + 0.2, EASE_IN_OUT));
  const noteFp = ramp(t, wordOf(4, 'mengenali') - 0.4, wordOf(4, 'mengenali') + 0.4);
  const mPlus = ramp(t, wordOf(4, 'massa') - 0.3, wordOf(4, 'massa') + 0.5);
  const det = ramp(t, wordOf(1, 'magnet') + 1.0, wordOf(1, 'magnet') + 1.8);

  // ---------- jadwal ion ----------
  const S0 = wordOf(1, 'diionkan') - 0.1;
  const DT = 0.16;
  const sL = cue(2) + 0.3; // mulai ringan/berat
  const sC = cue(3) - 0.2; // mulai klorin
  const kC = Math.ceil((sC - S0) / DT);
  const kindOf = (k: number): Kind => {
    const s = S0 + k * DT;
    if (s < sL) return GEN;
    if (s < sC) return k % 2 === 0 ? LIGHT : HEAVY;
    const j = k - kC;
    return Math.floor((j + 1) * 0.242 + 0.5) > Math.floor(j * 0.242 + 0.5) ? CL37 : CL35;
  };
  const kmax = Math.floor((t + TPRE - S0) / DT);
  const life = flight(HEAVY.r) + 0.8;
  const kmin = Math.max(0, kmax - Math.ceil((life + TPRE) / DT));

  // jumlah ion Cl yang sudah tiba (untuk tinggi puncak)
  const countBy = (tt: number) => {
    let a = 0;
    let b = 0;
    const km = Math.floor((tt - S0) / DT);
    for (let k = kC; k <= km; k++) {
      const kd = kindOf(k);
      if (S0 + k * DT + flight(kd.r) <= tt) {
        if (kd.cl === 35) a++;
        else b++;
      }
    }
    return [a, b];
  };
  const [n35, n37] = t > sC ? countBy(t) : [0, 0];
  const [e35, e37] = countBy(wordOf(3, 'banding') + 0.4);
  const norm = Math.max(e35 + e37, n35 + n37, 1);
  const f35 = n35 / norm;
  const f37 = n37 / norm;

  const ions: React.ReactNode[] = [];
  const flashes: React.ReactNode[] = [];
  for (let k = kmin; k <= kmax; k++) {
    const kd = kindOf(k);
    const a = t - (S0 + k * DT);
    const T = flight(kd.r);
    if (a < -TPRE || a > T + 0.8) continue;
    const jit = (rand(k * 3.3) - 0.5) * 6;
    // molekul netral melayang masuk lalu diionkan
    if (a < 0.15) {
      const u = (a + TPRE) / TPRE;
      const nx = mix(120, XS, Math.min(1, u));
      const ny = YB + jit * 2 + 10 * Math.sin(u * 5 + k);
      ions.push(<circle key={`n${k}`} cx={nx} cy={ny} r={kd.size * 0.9} fill="#8f9bbf" opacity={cyc(Math.min(0.99, u * 0.5)) * 1.6 * (1 - ramp(a, -0.1, 0.15))} />);
    }
    if (a > -0.1 && a < 0.5) flashes.push(<Ripple key={`f${k}`} x={XS} y={YB} p={(a + 0.1) / 0.6} r={30} color="cyan" rings={1} width={2} />);
    if (a < 0) continue;
    const landed = a - T;
    const op = ramp(a, 0, 0.12) * (1 - ramp(landed, 0, 0.5, EASE_IN_OUT));
    const [x, y] = ionAt(Math.min(a, T), kd.r);
    const trail = Array.from({length: 5}, (_, i) => ionAt(Math.max(0, Math.min(a, T) - 0.022 * (i + 1)), kd.r));
    ions.push(<Spark key={`i${k}`} x={x} y={y + (a < T1 ? jit : 0)} r={kd.size} color={kd.color} opacity={op} trail={trail} />);
    if (landed > 0 && landed < 0.7) flashes.push(<Ripple key={`l${k}`} x={XE} y={YB - 2 * kd.r} p={landed / 0.7} r={34} color={kd.color} rings={2} width={2} />);
    // gaya Lorentz menunjuk ke pusat lingkaran
    const th = ((a - T1 - T2 - T3) * VF) / kd.r;
    if (forceOn > 0 && th > 0.2 && th < Math.PI - 0.2 && landed < 0) {
      const fx = -Math.sin(th);
      const fy = -Math.cos(th);
      ions.push(<Arrow key={`F${k}`} x1={x} y1={y} x2={x + 42 * fx} y2={y + 42 * fy} color="force" width={3.5} pulse={false} opacity={forceOn * 0.85 * Math.sin(th)} />);
    }
  }

  // ---------- lintasan pandu ----------
  const arc = (r: number) => `M${XE},${YB} A${r},${r} 0 0 0 ${XE},${YB - 2 * r}`;
  const pathGen = Math.min(ramp(t, S0 + 1.5, S0 + 2.5), 1 - ramp(t, sL + 1.5, sL + 2.3, EASE_IN_OUT));
  const pathLH = Math.min(ramp(t, sL + 1.4, sL + 2.4), 1 - ramp(t, sC + 1.6, sC + 2.4, EASE_IN_OUT));
  const pathCl = ramp(t, sC + 1.6, sC + 2.6);

  // ---------- timbangan ----------
  const tilt = (7 + 1.2 * Math.sin(t * 1.3)) * (Math.PI / 180);
  const BX = 1470;
  const BY = 600;
  const BL = 170;
  const pL: [number, number] = [BX - BL * Math.cos(tilt), BY - BL * Math.sin(tilt)];
  const pR: [number, number] = [BX + BL * Math.cos(tilt), BY + BL * Math.sin(tilt)];

  // kamera halus
  const camX = 4 * Math.sin(t * 0.21);
  const camY = 3 * Math.sin(t * 0.17 + 1);

  // ⊗ medan
  const fieldSyms: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 9; j++) {
      const x = 750 + i * 66;
      const y = 222 + j * 68;
      const w = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.6 - i * 0.7 - j * 0.45));
      fieldSyms.push(<Otimes key={`${i}-${j}`} x={x} y={y} o={w * ramp(draw, 0.3 + 0.03 * (i + j), 0.55 + 0.03 * (i + j))} />);
    }

  const spot35 = Math.min(1, n35 / 10) + 0.0;
  const spot37 = Math.min(1, n37 / 4);

  return (
    <AbsoluteFill>
      <Stage>
        <g transform={`translate(${camX},${camY})`} opacity={devOn}>
          {/* ===== sektor magnet ===== */}
          <rect x={XE + 6} y={FY0} width={FX1 - XE - 6} height={YB + 12 - FY0} rx={18} fill={C.spr} opacity={0.07 * draw} />
          <DrawPath d={`M${XE + 6},${FY0} L${FX1},${FY0} L${FX1},${YB + 12} L${XE + 40},${YB + 12}`} p={draw} stroke="spr" width={2.5} opacity={0.6} dash="10 8" />
          {fieldSyms}
          <Glow x={870} y={500} r={260} color="spr" opacity={0.35 * draw} />
          <Label x={FX1 - 14} y={FY0 + 24} anchor="end" size={30} color={C.spr} weight={600} opacity={lblMag}>
            B ⊗
          </Label>
          <Label x={FX1} y={FY0 - 26} anchor="end" size={23} color={C.spr} opacity={lblMag * 0.9}>
            medan magnet (masuk bidang)
          </Label>

          {/* lintasan pandu */}
          <path d={arc(GEN.r)} fill="none" stroke={C.heat} strokeWidth={2} strokeDasharray="6 9" opacity={0.45 * pathGen} />
          <path d={arc(LIGHT.r)} fill="none" stroke={C.pot} strokeWidth={2} strokeDasharray="6 9" opacity={0.5 * pathLH} />
          <path d={arc(HEAVY.r)} fill="none" stroke={C.heat} strokeWidth={2} strokeDasharray="6 9" opacity={0.5 * pathLH} />
          <path d={arc(CL35.r)} fill="none" stroke={C.pot} strokeWidth={2} strokeDasharray="6 9" opacity={0.45 * pathCl} />
          <path d={arc(CL37.r)} fill="none" stroke={C.heat} strokeWidth={2} strokeDasharray="6 9" opacity={0.45 * pathCl} />

          {/* ===== detektor ===== */}
          <rect x={XE - 14} y={FY0} width={12} height={YB - 30 - FY0} rx={4} fill="#2a3766" stroke={C.ink} strokeOpacity={0.35} opacity={draw} />
          <Glow x={XE - 6} y={YB - 2 * CL35.r} r={46} color="pot" opacity={spot35 * pathCl} />
          <Glow x={XE - 6} y={YB - 2 * CL37.r} r={40} color="heat" opacity={spot37 * pathCl} />
          <rect x={XE - 14} y={YB - 2 * CL35.r - 4} width={12} height={8} rx={3} fill={C.pot} opacity={spot35 * pathCl} />
          <rect x={XE - 14} y={YB - 2 * CL37.r - 4} width={12} height={8} rx={3} fill={C.heat} opacity={spot37 * pathCl} />
          <Label x={XE - 26} y={FY0 + 14} anchor="end" size={24} color={C.muted} opacity={det}>
            detektor
          </Label>

          {/* ===== tabung & sumber ===== */}
          <DrawPath d={`M300,${YB - 26} L${XE - 14},${YB - 26}`} p={draw} stroke="muted" width={2} opacity={0.5} />
          <DrawPath d={`M300,${YB + 26} L${XE + 40},${YB + 26}`} p={draw} stroke="muted" width={2} opacity={0.5} />
          <rect x={110} y={YB - 62} width={190} height={124} rx={18} fill="#121c3f" stroke={C.muted} strokeOpacity={0.55} strokeWidth={2} opacity={draw} />
          <path d={`M170,${YB - 50} l8,-8 l8,8 l8,-8 l8,8 l8,-8 l8,8 l8,-8 l8,8`} fill="none" stroke={C.kin} strokeWidth={3} opacity={draw * (0.75 + 0.25 * Math.sin(t * 9))} />
          <Glow x={210} y={YB - 52} r={40} color="kin" opacity={0.6 * draw} />
          <Stream pts={[[XS, YB - 44], [XS, YB + 54]]} color="cyan" n={6} speed={1.1} r={3} opacity={0.8 * draw} jitter={2} />
          <Label x={205} y={YB - 92} size={24} color={C.muted} opacity={lblSrc}>
            sumber ion
          </Label>
          {/* pelat pemercepat */}
          {[XA1, XA2].map((x, i) => (
            <g key={x} opacity={draw}>
              <rect x={x - 5} y={YB - 70} width={10} height={58} rx={3} fill={i === 0 ? C.heat : C.pot} opacity={0.85} />
              <rect x={x - 5} y={YB + 12} width={10} height={58} rx={3} fill={i === 0 ? C.heat : C.pot} opacity={0.85} />
              <Label x={x} y={YB - 90} size={30} weight={700} color={i === 0 ? C.heat : C.pot}>
                {i === 0 ? '+' : '−'}
              </Label>
            </g>
          ))}
          <Label x={(XA1 + XA2) / 2} y={YB + 98} size={24} color={C.muted} opacity={lblAcc}>
            pemercepat
          </Label>
          <Stream pts={[[XA1 + 8, YB - 40], [XA2 - 8, YB - 40]]} color="force" n={3} speed={0.9} r={3} opacity={0.6 * lblAcc} jitter={0} />

          {/* ion */}
          {flashes}
          {ions}

          {/* label ringan / berat */}
          <Label x={XE + LIGHT.r + 22} y={YB - LIGHT.r} anchor="start" size={26} color={C.pot} weight={600} opacity={lblLH}>
            ringan → belok tajam
          </Label>
          <Label x={XE + HEAVY.r + 22} y={YB - HEAVY.r} anchor="start" size={26} color={C.heat} weight={600} opacity={lblH}>
            berat → belok lebar
          </Label>
        </g>

        {/* ===== kaca pembesar detektor ===== */}
        {loupe > 0.001 ? (
          <g opacity={loupe}>
            <path d={`M${LX + LR * 0.95},${LY - 40} L${XE - 30},${LC - 22} M${LX + LR * 0.95},${LY + 40} L${XE - 30},${LC + 22}`} stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 6" opacity={0.6} />
            <circle cx={XE - 8} cy={LC} r={26} fill="none" stroke={C.muted} strokeWidth={1.5} opacity={0.7} />
            <defs>
              <clipPath id="ms-loupe">
                <circle cx={LX} cy={LY} r={LR} />
              </clipPath>
            </defs>
            <circle cx={LX} cy={LY} r={LR} fill="#0c1430" opacity={0.95} />
            <g clipPath="url(#ms-loupe)">
              <rect x={LX + 40} y={LY - LR} width={30} height={2 * LR} fill="#2a3766" />
              {[CL37, CL35].map((kd) => {
                const yy = LY + (YB - 2 * kd.r - LC) * LZ;
                const s = kd.cl === 35 ? spot35 : spot37;
                return (
                  <g key={kd.cl}>
                    <Glow x={LX + 55} y={yy} r={60} color={kd.color} opacity={s} />
                    <ellipse cx={LX + 55} cy={yy} rx={15} ry={8 + 4 * s} fill={hueOf(kd.color)} opacity={0.4 + 0.6 * s} />
                    <ellipse cx={LX + 55} cy={yy} rx={6} ry={3} fill="#fff" opacity={0.8 * s} />
                  </g>
                );
              })}
            </g>
            <circle cx={LX} cy={LY} r={LR} fill="none" stroke={C.ink} strokeOpacity={0.55} strokeWidth={3} />
            <Label x={LX + 20} y={LY + (YB - 2 * CL37.r - LC) * LZ} anchor="end" size={30} color={C.heat} weight={600}>
              <tspan>
                <TSup>37</TSup>Cl<TSup>+</TSup>
              </tspan>
            </Label>
            <Label x={LX + 20} y={LY + (YB - 2 * CL35.r - LC) * LZ} anchor="end" size={30} color={C.pot} weight={600}>
              <tspan>
                <TSup>35</TSup>Cl<TSup>+</TSup>
              </tspan>
            </Label>
            <Label x={LX} y={LY + LR + 30} size={22} color={C.muted}>
              detektor (diperbesar)
            </Label>
          </g>
        ) : null}

        {/* ===== timbangan (ringan vs berat) ===== */}
        {balOn > 0.001 ? (
          <g opacity={balOn}>
            <Glow x={BX} y={BY + 40} r={220} color="gold" opacity={0.18} />
            <path d={`M${BX},${BY} L${BX - 46},${BY + 170} L${BX + 46},${BY + 170} Z`} fill="#1b2650" stroke={C.muted} strokeOpacity={0.5} strokeWidth={2} />
            <ellipse cx={BX} cy={BY + 176} rx={110} ry={10} fill="#000" opacity={0.35} />
            <line x1={pL[0]} y1={pL[1]} x2={pR[0]} y2={pR[1]} stroke={C.gold} strokeWidth={6} strokeLinecap="round" />
            <circle cx={BX} cy={BY} r={9} fill={C.gold} />
            {[pL, pR].map(([x, y], i) => (
              <g key={i}>
                <path d={`M${x},${y} L${x - 48},${y + 80} M${x},${y} L${x + 48},${y + 80}`} stroke={C.muted} strokeWidth={1.5} opacity={0.7} />
                <path d={`M${x - 62},${y + 80} Q${x},${y + 112} ${x + 62},${y + 80} Z`} fill="#26346a" stroke={C.muted} strokeOpacity={0.6} strokeWidth={2} />
                <Spark x={x} y={y + 64 - (i ? 6 : 0)} r={i ? 16 : 9} color={i ? 'heat' : 'pot'} />
              </g>
            ))}
            <Label x={pL[0]} y={pL[1] + 140} size={26} color={C.pot} weight={600} opacity={lblLH}>
              ringan
            </Label>
            <Label x={pR[0]} y={pR[1] + 140} size={26} color={C.heat} weight={600} opacity={lblH}>
              berat
            </Label>
            <Motes x={BX} y={BY + 60} rx={240} ry={120} n={18} color="gold" opacity={0.4} seed={3} />
          </g>
        ) : null}

        {/* ===== spektrum klorin ===== */}
        {ch1 > 0.001 ? (
          <g opacity={ch1}>
            <Axes x={gx1} ticks={[30, 40]} minor={[31, 32, 33, 34, 35, 36, 37, 38, 39]} />
            {[
              {mz: 35, f: f35, c: 'pot' as Hue, n: n35},
              {mz: 37, f: f37, c: 'heat' as Hue, n: n37},
            ].map(({mz, f, c, n}) => {
              const x = gx1(mz);
              const y = gy(f);
              const ph = n > 0 ? (t - S0) % DT : 0;
              return (
                <g key={mz}>
                  <Glow x={x} y={y} r={50} color={c} opacity={0.6 * Math.min(1, f * 25)} />
                  <rect x={x - 13} y={y} width={26} height={GB - y} rx={6} fill={hueOf(c)} opacity={0.85} />
                  <rect x={x - 5} y={y + 4} width={6} height={Math.max(0, GB - y - 8)} rx={3} fill="#fff" opacity={0.25} />
                  <circle cx={x} cy={y} r={5 + 3 * (1 - ph / DT)} fill="#fff" opacity={0.5 * Math.min(1, f * 25)} />
                  <Label x={x} y={GB + 34} size={26} color={hueOf(c)} weight={600}>
                    {mz}
                  </Label>
                  <Label x={x} y={y - 34} size={28} color={hueOf(c)} weight={600} opacity={Math.min(1, Math.max(0, (f - 0.01) * 30))}>
                    <tspan>
                      <TSup>{mz}</TSup>Cl<TSup>+</TSup>
                    </tspan>
                  </Label>
                </g>
              );
            })}
            <Label x={gx1(35) + 66} y={gy(0.758) + 4} anchor="start" size={26} color={C.ink} font="mono" opacity={pct}>
              75,8 %
            </Label>
            <Label x={gx1(37) + 30} y={gy(0.242) - 2} anchor="start" size={26} color={C.ink} font="mono" opacity={pct}>
              24,2 %
            </Label>
            <Twinkles x={gx1(36)} y={gy(0.5)} rx={130} ry={120} n={5} opacity={pct} />
          </g>
        ) : null}

        {/* ===== spektrum molekul (skematis) ===== */}
        {ch2 > 0.001 ? (
          <g opacity={ch2}>
            <Axes x={gx2} ticks={[0, 10, 20, 30, 40, 50, 60]} minor={[]} />
            {MOL.map((pk, i) => {
              const g = ramp(t, cue(4) + 0.5 + i * 0.22, cue(4) + 1.3 + i * 0.22, EASE_IN_OUT);
              const x = gx2(pk.mz);
              const y = gy(pk.h * g);
              return (
                <g key={pk.mz}>
                  <rect x={x - 6} y={y} width={12} height={GB - y} rx={4} fill={hueOf(pk.c)} opacity={0.9} />
                  <circle cx={x} cy={y} r={4} fill="#fff" opacity={0.5 * g} />
                </g>
              );
            })}
            <Label x={gx2(15)} y={gy(0.8) - 30} size={24} color={C.muted} opacity={ramp(t, cue(4) + 1.2, cue(4) + 1.8)}>
              <tspan>
                CH<TSub>3</TSub>
                <TSup>+</TSup>
              </tspan>
            </Label>
            <Ripple x={gx2(50)} y={gy(1)} p={ramp(t, wordOf(4, 'massa') - 0.1, wordOf(4, 'massa') + 1.4)} r={70} color="gold" />
            <Label x={gx2(50) - 20} y={gy(1) - 34} anchor="end" size={28} color={C.gold} weight={600} opacity={mPlus}>
              <tspan>
                M<TSup>+</TSup> = 50 → massa molekul
              </tspan>
            </Label>
            <Label x={gx2(52) + 4} y={gy(0.32) - 30} size={22} color={C.gold} opacity={mPlus}>
              M+2
            </Label>
            <Label x={(GX0 + GX1) / 2} y={GT - 120} size={28} color={C.ink} weight={600} opacity={ch2}>
              <tspan>
                Spektrum CH<TSub>3</TSub>Cl
                <tspan fill={C.muted} fontWeight={400}>
                  {' '}
                  (skematis)
                </tspan>
              </tspan>
            </Label>
            <Twinkles x={gx2(50)} y={gy(0.9)} rx={60} ry={60} n={4} opacity={mPlus} />
          </g>
        ) : null}
      </Stage>

      {/* ===== kartu rumus ===== */}
      <Formula x={1470} y={300} p={cardF} accent={C.force} caption="gaya Lorentz membelokkan ion (v ⊥ B)">
        <V color={C.force}>F</V> = <V>q</V> <V color={C.work}>v</V> <V color={C.spr}>B</V>
      </Formula>
      <Formula x={1470} y={300} p={cardR} accent={C.spr} caption="kelajuan sama → r ∝ m/q">
        <V>r</V> = <Frac n={<V>mv</V>} d={<><V>q</V><V color={C.spr}>B</V></>} />
      </Formula>
      <Formula x={1470} y={235} p={cardQ} accent={C.gold} size={56}>
        <Sup>35</Sup>Cl : <Sup>37</Sup>Cl ≈ 3 : 1
      </Formula>
      <Note x={390} y={630} p={noteIon} color={C.cyan}>
        <span style={{fontFamily: 'inherit'}}>
          M + e<Sup>−</Sup> → M<Sup>+</Sup> + 2e<Sup>−</Sup>
        </span>
      </Note>
      <Note x={390} y={430} p={noteFp} color={C.gold}>
        pola puncak = sidik jari senyawa
      </Note>
    </AbsoluteFill>
  );
};

const hueOf = (h: Hue) => (C as Record<string, string>)[h] ?? h;

/** Sumbu grafik spektrum massa. */
const Axes: React.FC<{x: (mz: number) => number; ticks: number[]; minor: number[]}> = ({x, ticks, minor}) => (
  <g>
    <rect x={GX0 - 30} y={GT - 40} width={GX1 - GX0 + 60} height={GB - GT + 40} rx={12} fill="#0c1430" opacity={0.5} />
    {[0.25, 0.5, 0.75, 1].map((f) => (
      <g key={f}>
        <line x1={GX0} y1={gy(f)} x2={GX1} y2={gy(f)} stroke={C.grid} strokeWidth={1.5} />
        <text x={GX0 - 12} y={gy(f) + 7} textAnchor="end" fontFamily="JetBrains Mono" fontSize={18} fill={C.muted}>
          {Math.round(f * 100)}
        </text>
      </g>
    ))}
    <line x1={GX0} y1={GB} x2={GX1 + 10} y2={GB} stroke={C.ink} strokeOpacity={0.7} strokeWidth={2.5} />
    <line x1={GX0} y1={GB} x2={GX0} y2={GT - 20} stroke={C.ink} strokeOpacity={0.7} strokeWidth={2.5} />
    {minor.map((m) => (
      <line key={m} x1={x(m)} y1={GB} x2={x(m)} y2={GB + 8} stroke={C.muted} strokeWidth={1.5} />
    ))}
    {ticks.map((m) => (
      <g key={m}>
        <line x1={x(m)} y1={GB} x2={x(m)} y2={GB + 12} stroke={C.ink} strokeOpacity={0.7} strokeWidth={2} />
        <text x={x(m)} y={GB + 64} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={20} fill={C.muted}>
          {m}
        </text>
      </g>
    ))}
    <text x={GX1 + 22} y={GB + 8} textAnchor="start" fontFamily="Space Grotesk" fontSize={22} fill={C.muted} fontStyle="italic">
      m/z
    </text>
    <text x={GX0 - 52} y={(GB + GT) / 2} textAnchor="middle" fontFamily="Space Grotesk" fontSize={22} fill={C.muted} transform={`rotate(-90 ${GX0 - 52} ${(GB + GT) / 2})`}>
      kelimpahan relatif (%)
    </text>
  </g>
);
