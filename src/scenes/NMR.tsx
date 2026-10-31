import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, rand} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Stream, Sub, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C} from '../theme';

// NMR (AUDIT): γ_p/2π = 42,577 MHz/T → 9,4 T: 400,2 MHz ("≈ 400 MHz"). Searah B = energi lebih rendah.
// Kelebihan populasi tingkat bawah sangat kecil (orde 10⁻⁵) → digambar 7 : 5 dengan catatan "dibesar-besarkan".
// Presesi proton (γ > 0) searah jarum jam dilihat dari atas sumbu B. Perisai: B_lokal = B(1 − σ).
// Spektrum ¹H etanol skematis (tanpa pemecahan spin–spin): CH₃ ≈ 1,2 ppm, CH₂ ≈ 3,7 ppm, OH ≈ 2–5 ppm (berubah-ubah,
// digambar di 2,6). Lebar puncak sama → tinggi ∝ luas ∝ jumlah H (3 : 2 : 1). δ besar (kiri) = frekuensi sedikit lebih tinggi.

const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));
const TAU = Math.PI * 2;
const GOLD = C.gold;
const GREEN = C.work;

// ---------- proton (panel kiri) ----------
const NC = 4;
const NR = 3;
const PX0 = 255;
const PY0 = 340;
const PSX = 170;
const PSY = 150;
const DOWN = new Set([1, 4, 6, 9, 11]); // 5 berlawanan, 7 searah
const FLIP = [0, 7]; // dua proton searah yang menyerap gelombang radio

/** Vektor spin 3D (x kanan, y ke belakang, z ke atas) berpresesi pada kerucut β di sekitar sumbu (θ, φ). */
const spinVec = (th: number, ph: number, beta: number, psi: number) => {
  const a = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
  const e1 = [Math.cos(th) * Math.cos(ph), Math.cos(th) * Math.sin(ph), -Math.sin(th)];
  const e2 = [-Math.sin(ph), Math.cos(ph), 0];
  const cb = Math.cos(beta);
  const sb = Math.sin(beta);
  return [0, 1, 2].map((i) => cb * a[i] + sb * (Math.cos(psi) * e1[i] + Math.sin(psi) * e2[i]));
};

const SpinArrow: React.FC<{x: number; y: number; d: number[]; L: number; w?: number; o?: number}> = ({x, y, d, L, w = 4.5, o = 1}) => {
  const sx = d[0] * L;
  const sy = -d[2] * L + d[1] * L * 0.25;
  const shade = 0.75 + 0.25 * -d[1];
  return (
    <g opacity={o * shade}>
      <line x1={x - sx * 0.4} y1={y - sy * 0.4} x2={x + sx} y2={y + sy} stroke={GOLD} strokeOpacity={0.22} strokeWidth={w * 3} strokeLinecap="round" />
      <line x1={x - sx * 0.4} y1={y - sy * 0.4} x2={x + sx} y2={y + sy} stroke={GOLD} strokeWidth={w} strokeLinecap="round" markerEnd="url(#arrow-gold)" />
    </g>
  );
};

const Proton: React.FC<{x: number; y: number; r?: number; o?: number}> = ({x, y, r = 17, o = 1}) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={r * 2.4} fill="url(#soft-heat)" opacity={0.6} />
    <circle cx={x} cy={y} r={r} fill="url(#nmr-p)" />
    <ellipse cx={x - r * 0.35} cy={y - r * 0.4} rx={r * 0.3} ry={r * 0.2} fill="#fff" opacity={0.45} />
  </g>
);

// ---------- diagram energi (panel kanan) ----------
const EX0 = 1090; // sumbu E
const FAN0 = 1120; // B = 0
const FAN1 = 1560; // B kuat
const EMID = 560;
const ESPL = 150;
const YUP = EMID - ESPL; // berlawanan (atas)
const YLO = EMID + ESPL; // searah (bawah)
const SLOT = (i: number) => 1590 + i * 29;

// ---------- etanol ----------
type At = {el: 'C' | 'O' | 'H'; x: number; y: number; g?: 0 | 1 | 2};
const MOL: At[] = [
  {el: 'C', x: 760, y: 560},
  {el: 'C', x: 960, y: 480},
  {el: 'O', x: 1150, y: 560},
  {el: 'H', x: 640, y: 560, g: 0},
  {el: 'H', x: 720, y: 680, g: 0},
  {el: 'H', x: 715, y: 440, g: 0},
  {el: 'H', x: 915, y: 360, g: 1},
  {el: 'H', x: 1010, y: 360, g: 1},
  {el: 'H', x: 1270, y: 620, g: 2},
];
const BONDS: [number, number][] = [
  [0, 1],
  [1, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [1, 6],
  [1, 7],
  [2, 8],
];
const GCOL = [C.pot, C.buoy, C.press];
const GHUE = ['pot', 'buoy', 'press'] as const;
const SHIELD = [{r: 66, o: 0.9}, {r: 52, o: 0.55}, {r: 40, o: 0.38}];
const OMEGA = [2.6, 3.5, 4.3]; // laju presesi relatif (dibesar-besarkan): CH₃ terendah
const MC = [955, 520]; // pusat molekul

// ---------- spektrum ----------
const SX0 = 360;
const SX1 = 1560;
const SB = 790;
const sx = (d: number) => SX0 + ((5 - d) / 5) * (SX1 - SX0);
const PEAKS = [
  {d: 1.2, h: 300, g: 0, n: '3H', name: 'CH₃', ppm: '≈ 1,2'},
  {d: 3.7, h: 200, g: 1, n: '2H', name: 'CH₂', ppm: '≈ 3,7'},
  {d: 2.6, h: 100, g: 2, n: '1H', name: 'OH', ppm: '≈ 2–5'},
];
const PW = 10;

export const NMR: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  // ---------- fase ----------
  const pP = ramp(t, -0.6, 0.6) * (1 - ramp(t, cue(3) - 0.5, cue(3) + 0.3, EASE_IN_OUT));
  const big = ramp(t, 0.2, 1.2) * (1 - ramp(t, cue(1) - 0.3, cue(1) + 0.4, EASE_IN_OUT));
  const fieldP = ramp(t, wordOf(1, 'medan') - 0.3, wordOf(1, 'medan') + 2.2, EASE_IN_OUT);
  const poles = ramp(t, wordOf(1, 'medan') - 0.6, wordOf(1, 'medan') + 0.3);
  const diag = ramp(t, cue(1) - 0.1, cue(1) + 0.7);
  const bNow = ramp(t, wordOf(1, 'medan') - 0.2, wordOf(1, 'medan') + 2.4, EASE_IN_OUT);
  const lblLo = ramp(t, wordOf(1, 'searah') - 0.3, wordOf(1, 'searah') + 0.4);
  const lblHi = ramp(t, wordOf(1, 'berlawanan') - 0.3, wordOf(1, 'berlawanan') + 0.4);
  const popNote = ramp(t, wordOf(1, 'tinggi') + 0.2, wordOf(1, 'tinggi') + 0.9);
  const tRF = wordOf(2, 'radio') - 0.2;
  const rfOn = ramp(t, tRF - 0.4, tRF + 0.6) * (1 - ramp(t, cue(3) - 0.6, cue(3), EASE_IN_OUT));
  const flipF = (1 - Math.cos(Math.max(0, t - tRF - 0.3) * (TAU / 3.4))) / 2;
  const card1 = slot(t, wordOf(2, 'frekuensi', 0) - 0.2, wordOf(2, 'sembilan') - 0.25);
  const card2 = slot(t, wordOf(2, 'sembilan') - 0.15, cue(3) - 0.1);
  const teslaOn = ramp(t, wordOf(2, 'tesla') - 0.3, wordOf(2, 'tesla') + 0.4);
  const lblP = ramp(t, wordOf(0, 'proton') - 0.3, wordOf(0, 'proton') + 0.4);
  const lblMag = ramp(t, wordOf(0, 'magnet') - 0.4, wordOf(0, 'magnet') + 0.3);

  const pM = ramp(t, cue(3) - 0.2, cue(3) + 0.7);
  const toSpec = ramp(t, cue(4) - 0.3, cue(4) + 1.0, EASE_IN_OUT);
  const cloud = ramp(t, wordOf(3, 'elektron') - 0.3, wordOf(3, 'elektron') + 0.6);
  const cardS = slot(t, wordOf(3, 'melindunginya') - 0.3, cue(4) - 0.1);
  const lblGrp = Math.min(ramp(t, wordOf(3, 'lingkungan') - 0.3, wordOf(3, 'lingkungan') + 0.5), 1 - ramp(t, cue(4) - 0.3, cue(4) + 0.2, EASE_IN_OUT));
  const freqDiff = ramp(t, wordOf(3, 'frekuensi') - 0.3, wordOf(3, 'frekuensi') + 0.5);
  const spec = ramp(t, cue(4) + 0.2, cue(4) + 1.0);
  const peakG = (i: number) => ramp(t, wordOf(4, 'spektrum') - 0.6 + i * 0.45, wordOf(4, 'spektrum') + 0.6 + i * 0.45, EASE_IN_OUT);
  const leaders = ramp(t, wordOf(4, 'mengetahui') - 0.3, wordOf(4, 'mengetahui') + 0.6);
  const areaNote = ramp(t, wordOf(4, 'hidrogen') - 0.3, wordOf(4, 'hidrogen') + 0.5);

  // transformasi molekul: tengah → atas (kecil)
  const ms = mix(1, 0.58, toSpec);
  const mcx = mix(MC[0], 960, toSpec);
  const mcy = mix(MC[1], 300, toSpec) + 4 * Math.sin(t * 0.8);
  const T = (x: number, y: number): [number, number] => [mcx + (x - MC[0]) * ms, mcy + (y - MC[1]) * ms];

  // ---------- proton ----------
  const protons = Array.from({length: NC * NR}, (_, i) => {
    const c = i % NC;
    const r = Math.floor(i / NC);
    const x = PX0 + c * PSX;
    const y = PY0 + r * PSY + 4 * Math.sin(t * 1.1 + i);
    const thR = Math.acos(2 * rand(i * 3.1 + 1) - 1) + 0.5 * Math.sin(t * 0.35 + i * 1.7);
    const phR = TAU * rand(i * 5.3 + 2) + 0.45 * t * (rand(i) > 0.5 ? 1 : -1);
    let target = DOWN.has(i) ? Math.PI : 0;
    if (FLIP.includes(i)) target = Math.PI * flipF * rfOn;
    const th = mix(thR, target, fieldP);
    const beta = mix(0.0, 0.42, fieldP);
    const psi = rand(i * 9.1) * TAU - 2.6 * t;
    return {x, y, d: spinVec(th, phR, beta, psi), th};
  });

  // ---------- spektrum: kurva Lorentz ----------
  const specPath = (g: number[]) => {
    const pts: string[] = [];
    for (let x = SX0; x <= SX1; x += 4) {
      let y = 0;
      PEAKS.forEach((p, k) => {
        const u = (x - sx(p.d)) / PW;
        y += (p.h * g[k]) / (1 + u * u);
      });
      pts.push(`${pts.length ? 'L' : 'M'}${x},${(SB - y).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const gs = PEAKS.map((_, k) => peakG(k));

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <radialGradient id="nmr-p" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ffd0d6" />
            <stop offset="45%" stopColor="#ff5a6e" />
            <stop offset="100%" stopColor="#6b1424" />
          </radialGradient>
          {(['C', 'O', 'H'] as const).map((el) => (
            <radialGradient key={el} id={`nmr-${el}`} cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
              <stop offset="35%" stopColor={ATOM[el].fill} />
              <stop offset="100%" stopColor="#0b1126" />
            </radialGradient>
          ))}
        </defs>

        {/* ================= panel proton ================= */}
        {pP > 0.001 ? (
          <g opacity={pP}>
            {/* kutub & medan B ke atas */}
            <g opacity={poles}>
              <rect x={150} y={796} width={720} height={32} rx={8} fill={C.heat} opacity={0.85} />
              <rect x={150} y={204} width={720} height={32} rx={8} fill={C.pot} opacity={0.85} />
              <Label x={510} y={813} size={22} weight={700} color="#fff">
                U
              </Label>
              <Label x={510} y={221} size={22} weight={700} color="#fff">
                S
              </Label>
              {Array.from({length: 9}, (_, i) => {
                const x = 170 + i * 85;
                return (
                  <g key={i}>
                    <line x1={x} y1={786} x2={x} y2={252} stroke={C.spr} strokeWidth={1.8} opacity={0.22} markerEnd="url(#arrow-spr)" />
                    <Stream pts={[[x, 786], [x, 246]]} color="spr" n={3} speed={0.3} r={3} opacity={0.55} seed={i} jitter={0} />
                  </g>
                );
              })}
              <Label x={895} y={300} anchor="start" size={34} color={C.spr} font="serif" italic>
                B
              </Label>
            </g>
            {/* gelombang radio */}
            <g opacity={rfOn}>
              {[415, 565].map((yy, j) => (
                <path
                  key={yy}
                  d={Array.from({length: 90}, (_, k) => {
                    const x = 160 + k * 8;
                    const y = yy + 12 * Math.sin((x / 46) * TAU * 0.5 + t * 7 + j);
                    return `${k ? 'L' : 'M'}${x},${y.toFixed(1)}`;
                  }).join(' ')}
                  fill="none"
                  stroke={C.kin}
                  strokeWidth={2.5}
                  opacity={0.45}
                />
              ))}
              {/* kumparan RF */}
              <g transform="translate(935,490)">
                {[0, 1, 2, 3].map((k) => (
                  <ellipse key={k} cx={0} cy={-45 + k * 30} rx={22} ry={11} fill="none" stroke={C.kin} strokeWidth={4} />
                ))}
                <Glow x={0} y={0} r={90} color="kin" opacity={0.7} />
                {[0, 1, 2].map((k) => {
                  const ph = (t * 0.8 + k / 3) % 1;
                  return <path key={k} d={`M${-40 - ph * 60},${-60} Q${-60 - ph * 80},0 ${-40 - ph * 60},60`} fill="none" stroke={C.kin} strokeWidth={3} opacity={0.8 * Math.min(1, ph * 6) * (1 - ph)} />;
                })}
              </g>
              <Label x={935} y={590} size={22} color={C.kin}>
                RF
              </Label>
            </g>
            {protons.map((p, i) => {
              const behind = p.d[1] > 0;
              const cone = fieldP;
              const ax = Math.cos(p.th) * 0.91;
              return (
                <g key={i}>
                  <ellipse cx={p.x} cy={p.y - ax * 70} rx={0.41 * 70} ry={0.41 * 70 * 0.25} fill="none" stroke={GOLD} strokeWidth={1.2} strokeDasharray="3 4" opacity={0.45 * cone} />
                  {behind ? <SpinArrow x={p.x} y={p.y} d={p.d} L={70} /> : null}
                  <Proton x={p.x} y={p.y} />
                  {!behind ? <SpinArrow x={p.x} y={p.y} d={p.d} L={70} /> : null}
                </g>
              );
            })}
            <g opacity={rfOn}>
              {FLIP.map((i) => (
                <Ripple key={i} x={protons[i].x} y={protons[i].y} p={((t - tRF - 0.3) / 1.7) % 1} r={70} color="kin" rings={2} width={2} />
              ))}
            </g>
            <Label x={510} y={230} size={26} color={C.ink} opacity={lblP * (1 - poles)}>
              <tspan>
                proton = inti atom H (p<tspan baselineShift="super" fontSize="0.65em">+</tspan>)
              </tspan>
            </Label>
            <Label x={510} y={770} size={26} color={C.muted} opacity={(1 - poles) * lblMag}>
              tanpa medan: arah acak
            </Label>
            <Label x={510} y={768} size={24} color={GOLD} opacity={popNote}>
              searah 7 : berlawanan 5 (selisih dibesar-besarkan)
            </Label>
          </g>
        ) : null}

        {/* proton besar (magnet kecil) */}
        {big > 0.001 ? (
          <g opacity={big}>
            {[1, -1].map((sd) =>
              [240, 330].map((R0, k) => {
                const pts = Array.from({length: 41}, (_, j) => {
                  const th = 0.55 + ((Math.PI - 1.1) * j) / 40;
                  const s = Math.sin(th);
                  return [1400 + sd * R0 * s * s * s, 520 - R0 * s * s * Math.cos(th)] as [number, number];
                });
                return (
                  <g key={`${sd}${k}`} opacity={lblMag}>
                    <path d={pts.map((p, j) => `${j ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={C.spr} strokeWidth={2} opacity={0.45} />
                    <Stream pts={pts} color="spr" n={3} speed={0.18} r={3.5} seed={k + sd} jitter={0} />
                  </g>
                );
              }),
            )}
            <Proton x={1400} y={520} r={80} />
            <SpinArrow x={1400} y={520} d={spinVec(0.0, 0, 0.3, -2.2 * t)} L={210} w={9} />
            <Label x={1400} y={524} size={44} weight={700} color="#fff" opacity={0.9}>
              <tspan>
                p<tspan baselineShift="super" fontSize="0.6em">+</tspan>
              </tspan>
            </Label>
            <Label x={1400} y={800} size={28} color={GOLD} opacity={lblMag}>
              spin → magnet kecil
            </Label>
            <Motes x={1400} y={520} rx={260} ry={220} n={18} color="gold" opacity={0.45} seed={2} />
          </g>
        ) : null}

        {/* ================= diagram energi ================= */}
        {pP > 0.001 ? (
          <g opacity={pP * diag}>
            <line x1={EX0} y1={810} x2={EX0} y2={340} stroke={C.ink} strokeOpacity={0.6} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
            <line x1={EX0} y1={810} x2={1790} y2={810} stroke={C.ink} strokeOpacity={0.6} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
            <Label x={EX0 - 24} y={350} size={30} color={C.ink} font="serif" italic>
              E
            </Label>
            <Label x={1790} y={846} size={28} color={C.spr} font="serif" italic>
              B
            </Label>
            <line x1={EX0} y1={EMID} x2={FAN0} y2={EMID} stroke={GREEN} strokeWidth={4} strokeLinecap="round" />
            <line x1={FAN0} y1={EMID} x2={mix(FAN0, FAN1, bNow)} y2={EMID - ESPL * bNow} stroke={GREEN} strokeWidth={4} strokeLinecap="round" />
            <line x1={FAN0} y1={EMID} x2={mix(FAN0, FAN1, bNow)} y2={EMID + ESPL * bNow} stroke={GREEN} strokeWidth={4} strokeLinecap="round" />
            <g opacity={ramp(bNow, 0.85, 1)}>
              <line x1={FAN1} y1={YUP} x2={1790} y2={YUP} stroke={GREEN} strokeWidth={5} strokeLinecap="round" />
              <line x1={FAN1} y1={YLO} x2={1790} y2={YLO} stroke={GREEN} strokeWidth={5} strokeLinecap="round" />
              <Glow x={1680} y={YLO} r={120} color="work" opacity={0.4} />
              <Arrow x1={1530} y1={YLO - 12} x2={1530} y2={YUP + 12} color="work" width={3} both pulse={false} opacity={0.85} />
              <Label x={1515} y={EMID + 40} anchor="end" size={30} color={GREEN} weight={600}>
                Δ<tspan fontStyle="italic">E</tspan>
              </Label>
              {/* populasi */}
              {Array.from({length: 7}, (_, i) => {
                const fi = FLIP.indexOf(i === 0 ? 0 : i === 3 ? 7 : -1);
                const f = fi >= 0 ? flipF * rfOn : 0;
                const x = mix(SLOT(i), SLOT(5 + (fi > 0 ? 1 : 0)), f);
                const y = mix(YLO - 26, YUP - 26, f) + 3 * Math.sin(t * 2 + i);
                return <SpinArrow key={`l${i}`} x={x} y={y + 6} d={spinVec(Math.PI * f, 0, 0.3, -2.6 * t + i)} L={20} w={3.5} />;
              })}
              {Array.from({length: 5}, (_, i) => (
                <SpinArrow key={`u${i}`} x={SLOT(i)} y={YUP - 26 + 3 * Math.sin(t * 2 + i + 9) + 6} d={spinVec(Math.PI, 0, 0.3, -2.6 * t + i)} L={20} w={3.5} />
              ))}
            </g>
            <Label x={1790} y={YLO + 44} anchor="end" size={24} color={GREEN} opacity={lblLo}>
              searah B · energi lebih rendah
            </Label>
            <Label x={1790} y={YUP - 58} anchor="end" size={24} color={GREEN} opacity={lblHi}>
              berlawanan B · energi lebih tinggi
            </Label>
            {/* foton RF */}
            <g opacity={rfOn}>
              <path
                d={Array.from({length: 40}, (_, k) => {
                  const y = YLO - 14 - k * ((YLO - YUP - 28) / 39);
                  const x = 1440 + 10 * Math.sin(k * 0.9 - t * 9);
                  return `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ')}
                fill="none"
                stroke={C.kin}
                strokeWidth={3.5}
                markerEnd="url(#arrow-kin)"
              />
              <Label x={1420} y={EMID - 20} anchor="end" size={28} color={C.kin} weight={600}>
                <tspan>
                  <tspan fontStyle="italic">hf</tspan> = Δ<tspan fontStyle="italic">E</tspan>
                </tspan>
              </Label>
            </g>
            <Label x={FAN1} y={846} size={24} color={C.spr} font="mono" opacity={teslaOn}>
              9,4 T
            </Label>
            <Label x={FAN0} y={846} size={24} color={C.muted} font="mono" opacity={diag}>
              0
            </Label>
          </g>
        ) : null}

        {/* ================= etanol ================= */}
        {pM > 0.001 ? (
          <g opacity={pM}>
            <Label x={480} y={300} size={30} color={C.ink} weight={600} opacity={1 - toSpec}>
              <tspan>
                etanol, CH<TSub>3</TSub>–CH<TSub>2</TSub>–OH
              </tspan>
            </Label>
            {/* B luar */}
            <g opacity={1 - toSpec}>
              {[200].map((x) => (
                <g key={x}>
                  <Arrow x1={x} y1={760} x2={x} y2={300} color="spr" width={6} />
                </g>
              ))}
              <Label x={200} y={800} size={26} color={C.spr}>
                <tspan>
                  <tspan fontStyle="italic">B</tspan> luar
                </tspan>
              </Label>
            </g>
            {BONDS.map(([a, b], k) => {
              const [x1, y1] = T(MOL[a].x, MOL[a].y);
              const [x2, y2] = T(MOL[b].x, MOL[b].y);
              return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8d97bd" strokeWidth={10 * ms} strokeLinecap="round" />;
            })}
            {MOL.map((at, k) => {
              const [x, y] = T(at.x, at.y);
              const R = (at.el === 'H' ? 26 : 40) * ms;
              const g = at.g;
              const sh = g !== undefined ? SHIELD[g] : null;
              return (
                <g key={k}>
                  {sh ? (
                    <>
                      <circle cx={x} cy={y} r={sh.r * ms * (1 + 0.05 * Math.sin(t * 2 + k))} fill="url(#soft-pot)" opacity={cloud * sh.o * 1.4} />
                      <circle cx={x} cy={y} r={sh.r * ms * 0.82} fill="none" stroke={C.pot} strokeWidth={1.5} strokeDasharray="3 5" opacity={cloud * sh.o * 0.8} transform={`rotate(${t * 40 + k * 30} ${x} ${y})`} />
                    </>
                  ) : null}
                  <circle cx={x} cy={y} r={R} fill={`url(#nmr-${at.el})`} />
                  <circle cx={x} cy={y} r={R} fill="none" stroke={g !== undefined ? GCOL[g] : '#000'} strokeOpacity={g !== undefined ? 0.6 * freqDiff + 0.3 * spec : 0.25} strokeWidth={3} />
                  {at.el !== 'H' ? (
                    <Label x={x} y={y + 1} size={30 * ms} weight={700} color="#fff">
                      {at.el}
                    </Label>
                  ) : null}
                  {g !== undefined ? (
                    <SpinArrow x={x} y={y} d={spinVec(0, 0, 0.45, -OMEGA[g] * t + k)} L={42 * ms} w={3.5 * ms + 0.5} o={freqDiff * (1 - toSpec) * 0.95} />
                  ) : null}
                </g>
              );
            })}
            <g opacity={lblGrp}>
              <Label x={700} y={770} size={24} color={C.pot} weight={600}>
                <tspan>
                  CH<TSub>3</TSub>: perisai tebal → f sedikit lebih rendah
                </tspan>
              </Label>
              <Label x={1270} y={720} size={24} color={C.press} weight={600}>
                OH: perisai tipis → f sedikit lebih tinggi
              </Label>
            </g>
            <Motes x={960} y={520} rx={420} ry={240} n={20} color="pot" opacity={0.35 * (1 - toSpec)} seed={6} />
          </g>
        ) : null}

        {/* ================= spektrum ¹H ================= */}
        {spec > 0.001 ? (
          <g opacity={spec}>
            <rect x={SX0 - 40} y={440} width={SX1 - SX0 + 80} height={SB - 440 + 20} rx={14} fill="#0c1430" opacity={0.5} />
            <path d={`${specPath(gs)} L${SX1},${SB} L${SX0},${SB} Z`} fill={C.gold} opacity={0.08} />
            {PEAKS.map((p, k) => {
              const x = sx(p.d);
              const pts: string[] = [];
              for (let xx = x - 60; xx <= x + 60; xx += 3) {
                const u = (xx - x) / PW;
                pts.push(`${pts.length ? 'L' : 'M'}${xx},${(SB - (p.h * gs[k]) / (1 + u * u)).toFixed(1)}`);
              }
              return <path key={k} d={`${pts.join(' ')} L${x + 60},${SB} L${x - 60},${SB} Z`} fill={GCOL[p.g]} opacity={0.35} />;
            })}
            <path d={specPath(gs)} fill="none" stroke={C.ink} strokeWidth={3} />
            <line x1={SX0} y1={SB} x2={SX1} y2={SB} stroke={C.ink} strokeOpacity={0.7} strokeWidth={2.5} />
            {[5, 4, 3, 2, 1, 0].map((d) => (
              <g key={d}>
                <line x1={sx(d)} y1={SB} x2={sx(d)} y2={SB + 10} stroke={C.ink} strokeOpacity={0.7} strokeWidth={2} />
                <text x={sx(d)} y={SB + 36} textAnchor="middle" fontFamily="JetBrains Mono" fontSize={20} fill={C.muted}>
                  {d}
                </text>
              </g>
            ))}
            <text x={SX1 + 30} y={SB + 36} textAnchor="start" fontFamily="Space Grotesk" fontSize={22} fill={C.muted}>
              δ (ppm)
            </text>
            <text x={SX0} y={SB + 72} textAnchor="start" fontFamily="Space Grotesk" fontSize={22} fill={C.muted}>
              ← perisai tipis, f sedikit lebih tinggi
            </text>
            <text x={SX1} y={SB + 72} textAnchor="end" fontFamily="Space Grotesk" fontSize={22} fill={C.muted}>
              perisai tebal, f sedikit lebih rendah →
            </text>
            {PEAKS.map((p, k) => {
              const x = sx(p.d);
              const top = SB - p.h * gs[k];
              return (
                <g key={k} opacity={ramp(gs[k], 0.6, 1)}>
                  <Glow x={x} y={top} r={50} color={GHUE[p.g]} opacity={0.7} />
                  <Label x={x + 26} y={top + 8} anchor="start" size={28} color={GCOL[p.g]} weight={700}>
                    {p.name}
                  </Label>
                  <Label x={x + 26} y={top + 40} anchor="start" size={22} color={C.muted} font="mono">
                    {p.ppm}
                  </Label>
                  <Label x={x - 22} y={top + 8} anchor="end" size={30} color={C.ink} weight={600} opacity={areaNote}>
                    {p.n}
                  </Label>
                </g>
              );
            })}
            {/* garis penunjuk molekul → puncak */}
            <g opacity={leaders}>
              {PEAKS.map((p, k) => {
                const hs = MOL.filter((m) => m.g === p.g);
                const hx = hs.reduce((s, m) => s + m.x, 0) / hs.length;
                const hy = hs.reduce((s, m) => s + m.y, 0) / hs.length;
                const [x1, y1] = T(hx, hy);
                const x2 = sx(p.d);
                const y2 = SB - p.h - 60;
                return <path key={k} d={`M${x1},${y1 + 24} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`} fill="none" stroke={GCOL[p.g]} strokeWidth={2.5} strokeDasharray="6 7" opacity={0.75} />;
              })}
            </g>
            <Twinkles x={sx(1.2)} y={SB - 300} rx={60} ry={40} n={4} opacity={areaNote} />
          </g>
        ) : null}
      </Stage>

      {/* ===== kartu ===== */}
      <Formula x={1420} y={205} p={card1 * pP} accent={C.kin} caption="frekuensi resonansi sebanding dengan B">
        <V>f</V> = <Frac n={<V>γ</V>} d="2π" /> <V color={C.spr}>B</V>
      </Formula>
      <Formula x={1420} y={205} p={card2 * pP} accent={C.kin} size={56} caption="γ/2π = 42,58 MHz/T · B = 9,4 T">
        <V>f</V> = 42,58 × 9,4 ≈ <span style={{color: C.kin}}>400 MHz</span>
      </Formula>
      <Formula x={1560} y={330} p={cardS * (1 - toSpec)} accent={C.pot} size={56} caption="σ: perisai elektron (sangat kecil)">
        <V>B</V>
        <Sub>lokal</Sub> = <V>B</V> (1 − <V>σ</V>)
      </Formula>
      <Note x={1690} y={560} p={areaNote} color={C.gold} size={28}>
        luas ∝ jumlah H
        <br />
        <span style={{color: C.gold}}>3 : 2 : 1</span>
      </Note>
    </AbsoluteFill>
  );
};
