import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, win} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Stream, Twinkles, V, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Generator AC (semua analitik per frame).
// Kutub U (merah) di atas, S (biru) di bawah → B ke bawah. Kumparan berputar pada poros mendatar (sumbu x) yang
// diputar turbin. Sudut θ = 0 saat bidang kumparan mendatar (tegak lurus B): Φ = BA cos θ (maksimum),
// ε = −dΦ/dt = BAω sin θ — digambar langsung sebagai grafik bergulir yang menempel ke sudut kumparan.
// Garis medan yang menembus kumparan disorot jingga (fluks). Cincin geser (slip ring) → arus bolak-balik:
// butir arus di kabel maju-mundur (posisi ∝ −cos θ, kecepatan ∝ sin θ), lampu berkedip ∝ sin²θ.
// PLN 50 Hz: 50 siklus bolak-balik per detik (kecepatan putar tidak disebut; animasi diperlambat).

const TAU = Math.PI * 2;
const fr = (v: number) => ((v % 1) + 1) % 1;
const GY = 470;
const KZX = -0.3;
const KZY = 0.2;
const X0 = 430;
const X1 = 770;
const R = 130;
const P = (x: number, y: number, z: number): [number, number] => [x + KZX * z, GY - y + KZY * z];
const OM = TAU / 4;
const TS = 1.0;
const thetaAt = (t: number, t0: number) => {
  const u = Math.max(0, t - t0);
  return OM * (u - TS * (1 - Math.exp(-u / TS)));
};
/** dθ/dt relatif terhadap ω (0..1, naik saat turbin mulai berputar). */
const rateAt = (t: number, t0: number) => 1 - Math.exp(-Math.max(0, t - t0) / TS);
/** Proyeksi turbin: muka roda dibuka lebih lebar agar terbaca (sumbu tetap sama). */
const TP = (y: number, z: number): [number, number] => [TX - 0.55 * z, GY - y + 0.12 * z];
const pts = (a: [number, number][]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const COPPER = '#e39a5a';
const COPPER2 = '#b8743f';
const RX = [870, 940]; // cincin geser
const RR = 36;
const TX = 250; // turbin
const TR = 108;

/** Balok kutub mendatar (muka depan, atas, kanan). */
const Slab: React.FC<{y0: number; y1: number; color: string; label: string; o: number}> = ({y0, y1, color, label, o}) => {
  const x0 = 400;
  const x1 = 800;
  const z0 = -150;
  const z1 = 150;
  const front = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)];
  const top = [P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)];
  const right = [P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)];
  const c = P(x0 + 50, (y0 + y1) / 2, z1);
  return (
    <g opacity={o}>
      <polygon points={pts(right)} fill={color} fillOpacity={0.5} stroke={color} strokeWidth={2} />
      <polygon points={pts(top)} fill={color} fillOpacity={0.62} stroke={color} strokeWidth={2} />
      <polygon points={pts(front)} fill={color} fillOpacity={0.82} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
      <text x={c[0]} y={c[1] + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={50} fill="#fff">
        {label}
      </text>
    </g>
  );
};

/* ------------ ikon sumber energi (bagian kanan, baris 4) ------------ */
const MiniTurb: React.FC<{x: number; y: number; a: number; r?: number}> = ({x, y, a, r = 26}) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="#0d1430" stroke="#c9d6ff" strokeWidth={2} />
    {Array.from({length: 6}, (_, i) => {
      const g = a + (i * TAU) / 6;
      return <line key={i} x1={x} y1={y} x2={x + r * 0.9 * Math.cos(g)} y2={y + r * 0.9 * Math.sin(g)} stroke="#c9d6ff" strokeWidth={3} strokeLinecap="round" />;
    })}
    <circle cx={x} cy={y} r={5} fill={C.gold} />
  </g>
);

const Steam: React.FC<{x: number; y: number; t: number; o: number; hi: number}> = ({x, y, t, o, hi}) =>
  o <= 0.01 ? null : (
    <g opacity={o}>
      <Glow x={x} y={y} r={120} color="muted" opacity={0.25 + 0.4 * hi} />
      <rect x={x - 70} y={y - 20} width={70} height={80} rx={16} fill="#3a4672" stroke="#c9d6ff" strokeWidth={2} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${x - 58 + i * 20},${y + 78} q 6,-${14 + 6 * Math.sin(t * 9 + i)} 12,0`} fill={C.kin} opacity={0.8} />
      ))}
      <path d={`M${x},${y} L${x + 30},${y}`} stroke="#c9d6ff" strokeWidth={6} />
      <MiniTurb x={x + 56} y={y} a={t * 5} />
      {Array.from({length: 5}, (_, i) => {
        const p = fr(t * 0.45 + i / 5);
        return <circle key={i} cx={x - 40 + 8 * Math.sin(t * 2 + i)} cy={y - 26 - p * 70} r={6 + p * 12} fill="#e8eeff" opacity={0.35 * cyc(p)} />;
      })}
      <Stream
        pts={[
          [x + 4, y],
          [x + 30, y],
        ]}
        color="white"
        n={4}
        speed={1.2}
        r={3}
        jitter={2}
      />
    </g>
  );

const Dam: React.FC<{x: number; y: number; t: number; o: number; hi: number}> = ({x, y, t, o, hi}) =>
  o <= 0.01 ? null : (
    <g opacity={o}>
      <Glow x={x} y={y} r={120} color="water" opacity={0.25 + 0.4 * hi} />
      <rect x={x - 82} y={y - 64} width={40} height={30} fill={C.water} opacity={0.55} />
      <path d={`M${x - 42},${y - 66} L${x - 30},${y - 66} L${x - 18},${y + 70} L${x - 42},${y + 70} Z`} fill="#5b6a9e" stroke="#c9d6ff" strokeWidth={1.5} />
      <Stream
        pts={[
          [x - 40, y - 40],
          [x - 10, y - 30],
          [x + 14, y - 4],
        ]}
        color="water"
        n={8}
        speed={0.9}
        r={4}
        jitter={2}
      />
      <MiniTurb x={x + 26} y={y + 14} a={t * 4} r={30} />
      <path d={`M${x - 18},${y + 64} Q${x + 30},${y + 56} ${x + 80},${y + 64}`} fill="none" stroke={C.water} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-t * 40} />
    </g>
  );

const Wind: React.FC<{x: number; y: number; t: number; o: number; hi: number}> = ({x, y, t, o, hi}) => {
  if (o <= 0.01) return null;
  const hy = y - 30;
  const a = t * 2.2;
  return (
    <g opacity={o}>
      <Glow x={x} y={hy} r={120} color="work" opacity={0.2 + 0.4 * hi} />
      <path d={`M${x - 5},${y + 70} L${x - 2},${hy} L${x + 2},${hy} L${x + 5},${y + 70} Z`} fill="#c9d6ff" />
      {[0, 1, 2].map((i) => {
        const g = a + (i * TAU) / 3;
        const tx = x + 62 * Math.cos(g);
        const ty = hy + 62 * Math.sin(g);
        const nx = -Math.sin(g) * 7;
        const ny = Math.cos(g) * 7;
        return <polygon key={i} points={`${x + nx},${hy + ny} ${tx},${ty} ${x - nx},${hy - ny}`} fill="#e8eeff" stroke="#c9d6ff" strokeWidth={1.2} />;
      })}
      <circle cx={x} cy={hy} r={6} fill={C.gold} />
      {[-40, 0, 40].map((d, i) => (
        <path key={d} d={`M${x - 96},${hy + d} q 14,-8 28,0 t 28,0`} fill="none" stroke={C.work} strokeOpacity={0.55} strokeWidth={2.5} strokeDasharray="12 10" strokeDashoffset={-t * 50 - i * 7} />
      ))}
    </g>
  );
};

export const Generator: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const intro = ramp(t, -0.4, 0.9);
  const out = 1 - ramp(t, dur - 0.9, dur, EASE_IN_OUT);
  const c1 = cue(1);
  const c2 = cue(2);
  const c3 = cue(3);
  const tPutar = Math.max(cue(0) + 1.0, wordOf(0, 'putar') - 0.4);
  const tFluks = Math.max(tPutar + 1.0, wordOf(0, 'fluks') - 0.3);
  const tSin = Math.max(c1 + 0.8, wordOf(1, 'bolak-balik') - 0.4);
  const tHz = Math.max(c2 + 0.6, wordOf(2, 'hertz') - 0.8);
  const tUap = Math.max(c3, wordOf(3, 'uap') - 0.3);
  const tAir = Math.max(tUap + 1.0, wordOf(3, 'air') - 0.3);
  const tAngin = Math.max(tAir + 1.0, wordOf(3, 'angin') - 0.3);
  const tFar = Math.max(tAngin + 1.2, wordOf(3, 'faraday') - 0.5);

  const th = thetaAt(t, tPutar);
  const rate = rateAt(t, tPutar);
  const eps = rate * Math.sin(th); // ε / (BAω)
  const flux = Math.cos(th);
  const fluxHi = ramp(t, tFluks - 0.2, tFluks + 0.8);
  const run = ramp(t, tPutar, tPutar + 1.2);

  // panel kanan
  const note0 = win(t, cue(0) + 0.3, tFluks - 0.1, 0.7, 0.6);
  const graph = win(t, tFluks - 0.3, c2 - 0.1, 0.8, 0.8);
  const epsOn = ramp(t, c1 - 0.2, c1 + 0.8);
  const fEps = win(t, tSin, c2 - 0.15, 0.7, 0.6);
  const pln = win(t, c2 + 0.1, c3 - 0.1, 0.8, 0.8);
  const plnDraw = ramp(t, tHz - 0.4, tHz + 3.2, (x) => x);
  const fHz = win(t, tHz + 0.6, c3 - 0.15, 0.7, 0.6);
  const slow = win(t, c2 + 0.3, c3 - 0.3, 0.8, 0.8);
  const src = ramp(t, c3 + 0.1, c3 + 1.0);
  const hiU = win(t, tUap, tAir, 0.4, 0.5) * (1 - ramp(t, tFar, tFar + 0.6));
  const hiA = win(t, tAir, tAngin, 0.4, 0.5) * (1 - ramp(t, tFar, tFar + 0.6));
  const hiW = win(t, tAngin, tFar + 0.2, 0.4, 0.6);
  const fFar = ramp(t, tFar - 0.1, tFar + 0.7);

  // kumparan: sudut ke vektor (y, z) setengah lebar
  const ey = R * Math.sin(th);
  const ez = R * Math.cos(th);
  const turns = [-6, 0, 6];

  // grafik bergulir Φ & ε
  const GX0 = 1190;
  const GX1 = 1730;
  const GM = 470;
  const GA = 105;
  const Wn = 8;
  const N = 140;
  const gF: [number, number][] = [];
  const gE: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const tt = t - Wn + (Wn * i) / N;
    const a = thetaAt(tt, tPutar);
    const x = GX0 + ((GX1 - GX0) * i) / N;
    gF.push([x, GM - GA * Math.cos(a)]);
    gE.push([x, GM - GA * rateAt(tt, tPutar) * Math.sin(a)]);
  }

  // PLN: 50 siklus dalam 1 detik (sumbu 600 px)
  const PX0 = 1180;
  const PX1 = 1760;
  const PM = 400;
  const pN = 700;
  const pPts: [number, number][] = [];
  const pEnd = Math.round(pN * plnDraw);
  for (let i = 0; i <= pEnd; i++) {
    const u = i / pN;
    pPts.push([PX0 + (PX1 - PX0) * u, PM - 52 * Math.sin(TAU * 50 * u)]);
  }
  const zoomPts: [number, number][] = Array.from({length: 81}, (_, i) => {
    const u = i / 80;
    return [1290 + 360 * u, 580 - 62 * Math.sin(TAU * u)];
  });

  // kabel AC: butir maju-mundur
  const wire: [number, number][] = [
    [RX[0], GY + RR + 34],
    [RX[0], 800],
    [889, 800],
    [925, 800],
    [RX[1], 800],
    [RX[1], GY + RR + 34],
  ];
  const lamp = run * Math.min(1, eps * eps * 1.15);

  // garis medan vertikal (U atas → S bawah) pada beberapa kedalaman z
  const fieldX = [455, 525, 600, 675, 745];
  const fieldZ = [-95, 0, 95];
  const reach = R * Math.abs(Math.cos(th));

  const jet = (c: string, o: number, seed: number) => (
    <Stream
      pts={[
        [110, 250],
        [170, 320],
        [215, 382],
      ]}
      color={c as never}
      n={9}
      speed={0.8}
      r={5}
      opacity={o}
      seed={seed}
      jitter={5}
    />
  );

  return (
    <AbsoluteFill style={{opacity: intro * out}}>
      <Stage>
        <Glow x={600} y={GY} r={340} color="spr" opacity={0.18} />
        <Motes x={600} y={GY} rx={380} ry={260} n={24} color="spr" opacity={0.35} seed={8} />
        <ellipse cx={560} cy={760} rx={480} ry={30} fill="#000" opacity={0.25} />
        {/* kutub: U atas, S bawah */}
        <Slab y0={170} y1={250} color={C.heat} label="U" o={intro} />
        {/* garis medan */}
        {fieldZ.map((z) =>
          fieldX.map((x, i) => {
            const a0 = P(x, 170, z);
            const a1 = P(x, -170, z);
            const w = Math.max(0, Math.min(1, (reach - Math.abs(z)) / 26 + 0.5)) * fluxHi;
            const col = interpolateColors(w, [0, 1], [C.spr, C.kin]);
            return (
              <g key={`${z}-${x}`}>
                <line x1={a0[0]} y1={a0[1]} x2={a1[0]} y2={a1[1]} stroke={col} strokeOpacity={0.3 + 0.45 * w} strokeWidth={2 + 1.5 * w} strokeDasharray="10 9" strokeDashoffset={-t * 36} />
                <Stream pts={[a0, a1]} color="spr" n={2} speed={0.28} r={4} jitter={0} seed={i * 1.9 + z * 0.03} opacity={0.6} />
              </g>
            );
          }),
        )}
        {/* turbin di ujung kiri poros */}
        <Glow x={TX} y={GY} r={170} color="gold" opacity={0.25 * run} />
        {(() => {
          const rim = Array.from({length: 49}, (_, i) => {
            const g = (i / 48) * TAU;
            return TP(TR * Math.sin(g), TR * Math.cos(g));
          });
          return (
            <g>
              <polyline points={pts(rim)} fill="#141d40" fillOpacity={0.85} stroke="#c9d6ff" strokeWidth={3} />
              {Array.from({length: 10}, (_, i) => {
                const g = th + (i * TAU) / 10;
                const tip = TP(TR * 0.92 * Math.sin(g), TR * 0.92 * Math.cos(g));
                const cup = TP(TR * 0.92 * Math.sin(g + 0.22), TR * 0.92 * Math.cos(g + 0.22));
                const front = Math.cos(g) > 0;
                return (
                  <g key={i} opacity={front ? 1 : 0.45}>
                    <line x1={TX} y1={GY} x2={tip[0]} y2={tip[1]} stroke="#c9d6ff" strokeWidth={4} strokeLinecap="round" />
                    <line x1={tip[0]} y1={tip[1]} x2={cup[0]} y2={cup[1]} stroke={C.gold} strokeWidth={6} strokeLinecap="round" />
                  </g>
                );
              })}
              <circle cx={TX} cy={GY} r={14} fill={C.gold} stroke="#fff" strokeWidth={2} />
            </g>
          );
        })()}
        <path d={`M${TX - 112},${GY + 40} A 125 125 0 0 1 ${TX - 70},${GY - 100}`} fill="none" stroke={C.work} strokeWidth={4} opacity={0.8 * run} markerEnd="url(#arrow-work)" />
        <Label x={TX} y={GY + 160} size={24} color="#c9d6ff" font="mono" opacity={intro}>
          turbin
        </Label>
        {/* poros */}
        <line x1={TX} y1={GY} x2={RX[1] + 40} y2={GY} stroke="#7d8cc0" strokeWidth={8} strokeLinecap="round" />
        {/* kumparan 3 lilitan */}
        {turns.map((d, k) => {
          const f = (R + d) / R;
          const ring = [P(X0 - d, ey * f, ez * f), P(X1 + d, ey * f, ez * f), P(X1 + d, -ey * f, -ez * f), P(X0 - d, -ey * f, -ez * f), P(X0 - d, ey * f, ez * f)];
          return (
            <g key={k}>
              <polyline points={pts(ring)} fill="none" stroke={COPPER2} strokeWidth={9} strokeLinejoin="round" />
              <polyline points={pts(ring)} fill="none" stroke={COPPER} strokeWidth={4.5} strokeLinejoin="round" />
            </g>
          );
        })}
        {/* bidang kumparan berpendar jingga sebanding fluks */}
        <polygon points={pts([P(X0, ey, ez), P(X1, ey, ez), P(X1, -ey, -ez), P(X0, -ey, -ez)])} fill={C.kin} fillOpacity={0.12 * fluxHi * Math.abs(flux)} />
        {/* kabel ke cincin geser */}
        {(() => {
          const a = P(X1, ey, ez);
          const b = P(X1, -ey, -ez);
          const r0 = P(RX[0], RR * Math.sin(th), RR * Math.cos(th));
          const r1 = P(RX[1], -RR * Math.sin(th), -RR * Math.cos(th));
          return (
            <g>
              <polyline points={pts([a, [a[0] + 40, a[1]], r0])} fill="none" stroke={COPPER} strokeWidth={3.5} />
              <polyline points={pts([b, [b[0] + 60, b[1]], r1])} fill="none" stroke={COPPER} strokeWidth={3.5} />
            </g>
          );
        })()}
        {/* cincin geser: lingkaran penuh di bidang yz */}
        {RX.map((x, k) => {
          const ring = Array.from({length: 41}, (_, i) => {
            const g = (i / 40) * TAU;
            return P(x, RR * Math.sin(g), RR * Math.cos(g));
          });
          return (
            <g key={x}>
              <polyline points={pts(ring)} fill="none" stroke={COPPER2} strokeWidth={13} />
              <polyline points={pts(ring)} fill="none" stroke={k ? '#d98d52' : '#f0b07a'} strokeWidth={6} />
              <rect x={x - 11} y={GY + RR + 8} width={22} height={28} rx={3} fill="#3a4266" stroke="#aab6e0" strokeWidth={2} />
            </g>
          );
        })}
        <Label x={992} y={GY} size={22} color={C.kin} font="mono" anchor="start" opacity={intro}>
          cincin geser
        </Label>
        {/* rangkaian AC + lampu */}
        <polyline points={pts(wire)} fill="none" stroke="#8b9ad0" strokeWidth={3} strokeLinejoin="round" />
        <Glow x={907} y={800} r={130} color="kin" opacity={0.8 * lamp} still />
        <circle cx={907} cy={800} r={24} fill="#1a2550" stroke="#dfe7ff" strokeWidth={2.5} />
        <circle cx={907} cy={800} r={19} fill={C.kin} opacity={0.15 + 0.75 * lamp} />
        {Array.from({length: 9}, (_, i) => {
          const base = 0.06 + (i / 9) * 0.88;
          const u = base + 0.035 * (1 - Math.cos(th)) * run;
          const [x, y] = pointAlong(wire, u);
          return (
            <g key={i} opacity={0.4 + 0.6 * run}>
              <circle cx={x} cy={y} r={10} fill="url(#soft-cyan)" />
              <circle cx={x} cy={y} r={4} fill={C.cyan} />
            </g>
          );
        })}
        <Arrow x1={RX[1] + 34} y1={650 - 45 * eps} x2={RX[1] + 34} y2={650 + 45 * eps} color="cyan" width={5} opacity={run * Math.min(1, Math.abs(eps) * 3)} pulse={false} />
        <Label x={RX[1] + 84} y={650} size={26} color={C.cyan} weight={700} opacity={epsOn}>
          AC
        </Label>
        <Label x={600} y={830} size={20} color={C.muted} font="mono" opacity={slow}>
          animasi diperlambat
        </Label>
        {/* S di bawah, digambar sesudah kumparan agar muka atasnya tampak di bawah kumparan */}
        <Slab y0={-250} y1={-170} color={C.pot} label="S" o={intro} />
        <Label x={842} y={334} size={30} color={C.spr} weight={700} font="serif" italic opacity={intro}>
          B ↓
        </Label>

        {/* jet sumber energi ke turbin */}
        {jet('white', src * hiU, 1)}
        {jet('water', src * hiA, 2)}
        {jet('work', src * hiW, 3)}

        {/* ---------- grafik Φ & ε ---------- */}
        <g opacity={graph}>
          <rect x={1150} y={300} width={620} height={340} rx={22} fill="#0b1330" fillOpacity={0.78} stroke={C.line} strokeWidth={2} />
          <line x1={GX0} y1={GM} x2={GX1} y2={GM} stroke={C.faint} strokeWidth={1.5} />
          <line x1={GX1} y1={GM - GA - 12} x2={GX1} y2={GM + GA + 12} stroke={C.faint} strokeWidth={1.5} strokeDasharray="4 6" />
          <polyline points={pts(gF)} fill="none" stroke={C.kin} strokeWidth={3} strokeDasharray="10 7" strokeLinejoin="round" opacity={fluxHi} />
          <polyline points={pts(gE)} fill="none" stroke={C.cyan} strokeWidth={4} strokeLinejoin="round" opacity={epsOn} />
          <circle cx={GX1} cy={GM - GA * flux} r={7} fill={C.kin} opacity={fluxHi} />
          <circle cx={GX1} cy={GM - GA * eps} r={8} fill="#fff" stroke={C.cyan} strokeWidth={3} opacity={epsOn} />
          <text x={1172} y={330} fontFamily={FONT.mono} fontSize={20} fill={C.kin} dominantBaseline="central" opacity={fluxHi}>
            fluks Φ ∝ cos θ
          </text>
          <text x={1500} y={330} fontFamily={FONT.mono} fontSize={20} fill={C.cyan} dominantBaseline="central" opacity={epsOn}>
            tegangan ε ∝ sin θ
          </text>
          <text x={1740} y={612} textAnchor="end" fontFamily={FONT.mono} fontSize={17} fill={C.muted} dominantBaseline="central">
            waktu → (kini di kanan)
          </text>
          <Ripple x={GX1} y={GM - GA * eps} p={(t - tSin) / 1.3} r={90} color="cyan" rings={2} width={2} />
        </g>

        {/* ---------- PLN 50 Hz ---------- */}
        <g opacity={pln}>
          <rect x={1150} y={300} width={620} height={360} rx={22} fill="#0b1330" fillOpacity={0.78} stroke={C.line} strokeWidth={2} />
          <line x1={PX0} y1={PM} x2={PX1} y2={PM} stroke={C.faint} strokeWidth={1.5} />
          <polyline points={pts(pPts)} fill="none" stroke={C.cyan} strokeWidth={1.8} strokeLinejoin="round" />
          {pPts.length > 1 ? <circle cx={pPts[pPts.length - 1][0]} cy={pPts[pPts.length - 1][1]} r={5} fill="#fff" opacity={plnDraw < 1 ? 1 : 0.5} /> : null}
          <line x1={PX0} y1={PM + 72} x2={PX1} y2={PM + 72} stroke={C.muted} strokeWidth={2} />
          <line x1={PX0} y1={PM + 64} x2={PX0} y2={PM + 80} stroke={C.muted} strokeWidth={2} />
          <line x1={PX1} y1={PM + 64} x2={PX1} y2={PM + 80} stroke={C.muted} strokeWidth={2} />
          <text x={(PX0 + PX1) / 2} y={PM + 94} textAnchor="middle" fontFamily={FONT.mono} fontSize={19} fill={C.muted} dominantBaseline="central">
            1 detik = 50 siklus bolak-balik
          </text>
          <text x={1172} y={330} fontFamily={FONT.head} fontWeight={600} fontSize={26} fill={C.gold} dominantBaseline="central">
            PLN · 50 Hz
          </text>
          {/* satu siklus diperbesar */}
          <g opacity={ramp(t, tHz + 1.2, tHz + 2.2)}>
            <line x1={PX0} y1={PM - 58} x2={1290} y2={520} stroke={C.muted} strokeOpacity={0.4} strokeWidth={1.2} strokeDasharray="3 5" />
            <line x1={PX0 + 11.6} y1={PM - 58} x2={1650} y2={520} stroke={C.muted} strokeOpacity={0.4} strokeWidth={1.2} strokeDasharray="3 5" />
            <line x1={1290} y1={580} x2={1650} y2={580} stroke={C.faint} strokeWidth={1.5} />
            <polygon points={pts([[1290, 580], ...zoomPts.slice(0, 41), [1470, 580]])} fill={C.cyan} fillOpacity={0.15} />
            <polygon points={pts([[1470, 580], ...zoomPts.slice(40), [1650, 580]])} fill={C.pot} fillOpacity={0.18} />
            <polyline points={pts(zoomPts)} fill="none" stroke={C.cyan} strokeWidth={3.5} />
            <text x={1380} y={562} textAnchor="middle" fontFamily={FONT.head} fontWeight={700} fontSize={22} fill={C.cyan}>
              +
            </text>
            <text x={1560} y={606} textAnchor="middle" fontFamily={FONT.head} fontWeight={700} fontSize={22} fill={C.pot}>
              −
            </text>
            <text x={1700} y={580} textAnchor="middle" fontFamily={FONT.mono} fontSize={17} fill={C.muted} dominantBaseline="central">
              1/50 s
            </text>
            {(() => {
              const u = fr(t * 0.5);
              const [x, y] = pointAlong(zoomPts, u);
              return <circle cx={x} cy={y} r={7} fill="#fff" opacity={cyc(u)} />;
            })()}
          </g>
        </g>

        {/* ---------- sumber energi ---------- */}
        <g opacity={src}>
          <g transform="translate(1515 500) scale(1.2) translate(-1515 -500)">
          <Steam x={1330} y={500} t={t} o={ramp(t, tUap - 0.1, tUap + 0.6)} hi={hiU} />
          <Dam x={1515} y={500} t={t} o={ramp(t, tAir - 0.1, tAir + 0.6)} hi={hiA} />
          <Wind x={1700} y={500} t={t} o={ramp(t, tAngin - 0.1, tAngin + 0.6)} hi={hiW} />
          </g>
          <Label x={1293} y={640} size={24} color="#c9d6ff" opacity={ramp(t, tUap, tUap + 0.6)}>
            uap
          </Label>
          <Label x={1520} y={640} size={24} color="#c9d6ff" opacity={ramp(t, tAir, tAir + 0.6)}>
            air terjun
          </Label>
          <Label x={1737} y={640} size={24} color="#c9d6ff" opacity={ramp(t, tAngin, tAngin + 0.6)}>
            angin
          </Label>
          <text x={1515} y={690} textAnchor="middle" fontFamily={FONT.mono} fontSize={19} fill={C.muted} dominantBaseline="central">
            hanya memutar turbin → generator
          </text>
          <Twinkles x={1500} y={290} rx={240} ry={40} n={5} color="kin" opacity={fFar} seed={9} />
        </g>
      </Stage>
      <Note x={1460} y={250} p={note0} color={C.work}>
        motor dibalik: <span style={{color: C.work}}>gerak</span> → <span style={{color: C.cyan}}>listrik</span>
      </Note>
      <Formula x={1460} y={770} p={fEps} accent={C.cyan}>
        <V color={C.cyan}>ε</V> = <V>N</V>
        <V color={C.spr}>B</V>
        <V>A</V>
        <V color={C.gold}>ω</V> sin <V>θ</V>
      </Formula>
      <Formula x={1460} y={770} p={fHz} accent={C.gold} caption="tegangan berbalik arah bolak-balik 50 kali tiap detik">
        <V>f</V> = 50 Hz
      </Formula>
      <Formula x={1515} y={300} p={fFar} accent={C.kin} caption="Hukum Faraday">
        <V color={C.cyan}>ε</V> = −<V>N</V>{' '}
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
        />
      </Formula>
    </AbsoluteFill>
  );
};
