import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, win} from '../anim';
import {Arrow, Glow, Label, Motes, Note, Ripple, Stage, Stream, Twinkles, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Motor DC (semua analitik per frame).
// Kutub U (merah, kiri) dan S (biru, kanan) → B ke kanan (+x). Kumparan berputar pada sumbu z (menuju penonton),
// digambar dengan proyeksi miring: z ke arah penonton tampak ke kiri-bawah.
// Sisi kumparan di kanan (cos θ > 0) selalu membawa arus keluar (+z): F = I L × B = (+z)×(+x) = +y → ke atas;
// sisi kiri arus masuk (−z) → ke bawah ⇒ putaran berlawanan jarum jam (dilihat dari depan).
// Komutator cincin belah membalik arus tiap ½ putaran (saat kumparan tegak, celah melewati sikat): arus & gaya
// memudar ke nol lalu muncul berlawanan (silang-pudar, tanpa ambang).

const TAU = Math.PI * 2;
const fr = (v: number) => ((v % 1) + 1) % 1;
const MX = 600;
const MY = 480;
const KX = -0.36;
const KY = 0.21;
const R = 140;
const L = 170;
const ZC = 240; // posisi komutator di sumbu
const RC = 32;
const P = (x: number, y: number, z: number): [number, number] => [MX + x + KX * z, MY - y + KY * z];
const sgn = (c: number) => Math.max(-1, Math.min(1, c / 0.22));
const OM = TAU / 3.4;
const TS = 0.9;
const thetaAt = (t: number, t0: number) => {
  const u = Math.max(0, t - t0);
  return OM * (u - TS * (1 - Math.exp(-u / TS)));
};
const pts = (a: [number, number][]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const COPPER = '#e39a5a';
const COPPER2 = '#b8743f';

/** Balok kutub (muka depan, atas, kanan terlihat). */
const PoleBox: React.FC<{x0: number; x1: number; color: string; label: string; o: number}> = ({x0, x1, color, label, o}) => {
  const y0 = -170;
  const y1 = 170;
  const z0 = -200;
  const z1 = 200;
  const front = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)];
  const top = [P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)];
  const right = [P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)];
  const c = P((x0 + x1) / 2, 0, z1);
  return (
    <g opacity={o}>
      <polygon points={pts(right)} fill={color} fillOpacity={0.5} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <polygon points={pts(top)} fill={color} fillOpacity={0.62} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <polygon points={pts(front)} fill={color} fillOpacity={0.82} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} strokeLinejoin="round" />
      <line x1={front[3][0] + 14} y1={front[3][1] + 12} x2={front[2][0] - 14} y2={front[2][1] + 12} stroke="#fff" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
      <text x={c[0]} y={c[1]} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={84} fill="#fff" opacity={0.92}>
        {label}
      </text>
    </g>
  );
};

/** Busur cincin komutator (layar) di pusat c. */
const arc = (c: [number, number], r: number, a0: number, a1: number) => {
  const n = 14;
  return Array.from({length: n + 1}, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [c[0] + r * Math.cos(a), c[1] - r * Math.sin(a)] as [number, number];
  });
};

/* ---------------- Ikon penerapan ---------------- */

const Fan: React.FC<{x: number; y: number; t: number; o: number; hi: number}> = ({x, y, t, o, hi}) => {
  if (o <= 0.01) return null;
  const a = (t * 7 * 180) / Math.PI;
  const hy = y - 30;
  return (
    <g opacity={o}>
      <Glow x={x} y={hy} r={120} color="work" opacity={0.25 + 0.35 * hi} />
      <ellipse cx={x} cy={y + 92} rx={56} ry={12} fill="#2a3768" stroke="#8b9ad0" strokeWidth={2} />
      <rect x={x - 5} y={hy + 50} width={10} height={44} fill="#5b6a9e" />
      <circle cx={x} cy={hy} r={66} fill="#0d1430" fillOpacity={0.6} stroke="#8b9ad0" strokeWidth={2.5} />
      {[0, 120, 240].map((k) => (
        <ellipse key={k} cx={x} cy={hy - 30} rx={15} ry={30} fill={C.work} fillOpacity={0.55} stroke={C.work} strokeWidth={1.5} transform={`rotate(${a + k} ${x} ${hy})`} />
      ))}
      {Array.from({length: 8}, (_, i) => {
        const g = (i / 8) * TAU;
        return <line key={i} x1={x + 20 * Math.cos(g)} y1={hy + 20 * Math.sin(g)} x2={x + 66 * Math.cos(g)} y2={hy + 66 * Math.sin(g)} stroke="#8b9ad0" strokeOpacity={0.35} strokeWidth={1.2} />;
      })}
      <circle cx={x} cy={hy} r={13} fill={C.cyan} fillOpacity={0.5 + 0.3 * Math.sin(t * 5)} stroke="#e4f7ff" strokeWidth={2} />
      {[-28, 0, 28].map((dy, i) => (
        <path key={dy} d={`M${x + 78},${hy + dy} q 18,-10 36,0 t 36,0`} fill="none" stroke={C.work} strokeWidth={2.5} strokeOpacity={0.6} strokeDasharray="14 12" strokeDashoffset={-t * 60 - i * 9} />
      ))}
    </g>
  );
};

const Washer: React.FC<{x: number; y: number; t: number; o: number; hi: number}> = ({x, y, t, o, hi}) => {
  if (o <= 0.01) return null;
  const dy = y + 6;
  const a = t * 4.5;
  return (
    <g opacity={o}>
      <Glow x={x} y={dy} r={120} color="work" opacity={0.25 + 0.35 * hi} />
      <rect x={x - 72} y={y - 92} width={144} height={190} rx={14} fill="#1c2852" stroke="#8b9ad0" strokeWidth={2.5} />
      <line x1={x - 72} y1={y - 58} x2={x + 72} y2={y - 58} stroke="#8b9ad0" strokeWidth={2} />
      <circle cx={x + 44} cy={y - 75} r={8} fill="none" stroke={C.cyan} strokeWidth={2} />
      <rect x={x - 58} y={y - 80} width={46} height={10} rx={4} fill={C.cyan} fillOpacity={0.4 + 0.2 * Math.sin(t * 3)} />
      <defs>
        <clipPath id="motor-door">
          <circle cx={x} cy={dy} r={46} />
        </clipPath>
      </defs>
      <circle cx={x} cy={dy} r={52} fill="#0b1330" stroke="#c9d6ff" strokeWidth={4} />
      <g clipPath="url(#motor-door)">
        <path
          d={`M${x - 50},${dy + 10 + 5 * Math.sin(t * 3)} Q${x - 25},${dy + 2 + 8 * Math.sin(t * 3 + 1)} ${x},${dy + 10} T${x + 50},${dy + 8 + 5 * Math.sin(t * 3 + 2)} L${x + 50},${dy + 60} L${x - 50},${dy + 60} Z`}
          fill={C.water}
          opacity={0.45}
        />
        {[C.press, C.gold, C.work].map((col, i) => {
          const g = a + (i * TAU) / 3;
          return <ellipse key={i} cx={x + 26 * Math.cos(g)} cy={dy + 26 * Math.sin(g)} rx={13} ry={9} fill={col} opacity={0.85} transform={`rotate(${(g * 180) / Math.PI} ${x + 26 * Math.cos(g)} ${dy + 26 * Math.sin(g)})`} />;
        })}
      </g>
      <path d={`M${x + 64},${dy} A 64 64 0 0 1 ${x},${dy + 64}`} fill="none" stroke={C.work} strokeWidth={3} strokeOpacity={0.7} markerEnd="url(#arrow-work)" transform={`rotate(${(t * 40) % 360} ${x} ${dy})`} />
    </g>
  );
};

const ECar: React.FC<{x: number; y: number; t: number; o: number; hi: number}> = ({x, y, t, o, hi}) => {
  if (o <= 0.01) return null;
  const by = y + 2 * Math.sin(t * 7);
  const wa = (t * 400) % 360;
  return (
    <g opacity={o}>
      <Glow x={x} y={y} r={120} color="work" opacity={0.25 + 0.35 * hi} />
      <line x1={x - 92} y1={y + 62} x2={x + 92} y2={y + 62} stroke="#8b9ad0" strokeWidth={2.5} strokeDasharray="18 14" strokeDashoffset={t * 160} />
      {[-12, 6, 24].map((d, i) => (
        <line key={d} x1={x - 96 - i * 6} y1={by + d - 10} x2={x - 70 - i * 6} y2={by + d - 10} stroke={C.work} strokeOpacity={0.5 + 0.3 * Math.sin(t * 6 + i)} strokeWidth={3} strokeLinecap="round" />
      ))}
      <path
        d={`M${x - 82},${by + 28} L${x - 82},${by + 4} Q${x - 80},${by - 8} ${x - 60},${by - 10} L${x - 34},${by - 12} L${x - 12},${by - 38} Q${x - 4},${by - 44} ${x + 10},${by - 44} L${x + 34},${by - 44} Q${x + 46},${by - 44} ${x + 54},${by - 30} L${x + 64},${by - 12} Q${x + 84},${by - 8} ${x + 86},${by + 6} L${x + 86},${by + 28} Z`}
        fill="#2b5fa8"
        stroke="#cfe0ff"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path d={`M${x - 6},${by - 14} L${x + 8},${by - 36} L${x + 30},${by - 36} L${x + 30},${by - 14} Z`} fill="#bfe7ff" opacity={0.55} />
      <path d={`M${x + 36},${by - 14} L${x + 36},${by - 36} Q${x + 44},${by - 36} ${x + 48},${by - 28} L${x + 56},${by - 14} Z`} fill="#bfe7ff" opacity={0.55} />
      <path d={`M${x - 46},${by - 4} L${x - 54},${by + 10} L${x - 46},${by + 10} L${x - 52},${by + 22}`} fill="none" stroke={C.cyan} strokeWidth={3} strokeLinejoin="round" opacity={0.7 + 0.3 * Math.sin(t * 5)} />
      {[-50, 52].map((wx) => (
        <g key={wx} transform={`rotate(${wa} ${x + wx} ${y + 40})`}>
          <circle cx={x + wx} cy={y + 40} r={20} fill="#151d3c" stroke="#cfe0ff" strokeWidth={3} />
          <line x1={x + wx - 13} y1={y + 40} x2={x + wx + 13} y2={y + 40} stroke="#cfe0ff" strokeWidth={2.5} />
          <line x1={x + wx} y1={y + 27} x2={x + wx} y2={y + 53} stroke="#cfe0ff" strokeWidth={2.5} />
        </g>
      ))}
    </g>
  );
};

export const Motor: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const intro = ramp(t, -0.4, 0.9);
  const out = 1 - ramp(t, dur - 0.9, dur, EASE_IN_OUT);
  const c1 = cue(1);
  const c2 = cue(2);
  const tCur = Math.max(cue(0) + 0.8, wordOf(0, 'berarus') - 0.2);
  const tPush = Math.max(tCur + 1.2, wordOf(0, 'didorong') - 0.3);
  const tSpin = Math.max(tPush + 1.2, wordOf(0, 'berputar') - 0.5);
  const tKom = Math.max(c1 + 0.2, wordOf(1, 'komutator') - 0.3);
  const tFan = Math.max(c2 + 0.2, wordOf(2, 'kipas') - 0.3);
  const tWash = Math.max(tFan + 1.0, wordOf(2, 'mesin') - 0.3);
  const tCar = Math.max(tWash + 1.0, wordOf(2, 'mobil') - 0.3);
  const tGerak = Math.max(tCar + 1.0, wordOf(2, 'gerak') - 0.4);

  const th = thetaAt(t, tSpin);
  const s1 = sgn(Math.cos(th));
  const coilIn = ramp(t, 0.1, 1.4);
  const cur = ramp(t, tCur, tCur + 0.8);
  const force = ramp(t, tPush, tPush + 0.7);
  const komHi = win(t, tKom - 0.2, c2 - 0.2, 0.8, 0.9);

  // kamera: dorong pelan ke komutator saat baris komutator
  const cam = 1 + 0.1 * komHi;
  const fx = P(0, 0, ZC)[0];
  const fy = P(0, 0, ZC)[1] + 30;

  // panel kanan
  const panel = win(t, tPush - 0.4, c2 - 0.1, 0.9, 0.8);
  const note0 = win(t, tPush + 0.3, c1 - 0.25, 0.7, 0.55);
  const graph = win(t, tKom - 0.2, c2 - 0.1, 0.8, 0.8);
  const icons = ramp(t, c2 + 0.1, c2 + 1.0);
  const fanIn = ramp(t, tFan - 0.1, tFan + 0.7);
  const washIn = ramp(t, tWash - 0.1, tWash + 0.7);
  const carIn = ramp(t, tCar - 0.1, tCar + 0.7);
  const noteG = ramp(t, tGerak - 0.2, tGerak + 0.6);

  // sisi kumparan (sudut θ dan θ+π)
  const sides = [th, th + Math.PI].map((a, k) => ({a, k, x: R * Math.cos(a), y: R * Math.sin(a), s: k === 0 ? s1 : -s1}));
  const turns = [-7, 0, 7];

  // lintasan arus di kumparan (arah maju: masuk lewat setengah cincin B → sisi B → belakang → sisi A → setengah cincin A)
  const hA: [number, number, number] = [RC * Math.cos(th), RC * Math.sin(th), ZC - 10];
  const hB: [number, number, number] = [-hA[0], -hA[1], ZC - 10];
  const [A, B] = sides;
  const loop3: [number, number, number][] = [hB, [B.x, B.y, L], [B.x, B.y, -L], [A.x, A.y, -L], [A.x, A.y, L], hA];
  const loop = loop3.map((p) => P(p[0], p[1], p[2]));

  // rangkaian luar: baterai di bawah komutator; + ke sikat kiri, − dari sikat kanan
  const cc = P(0, 0, ZC);
  const bL: [number, number] = [cc[0] - RC - 16, cc[1]];
  const bR: [number, number] = [cc[0] + RC + 16, cc[1]];
  const BAT = {x: cc[0], y: 790};
  const wireL: [number, number][] = [
    [BAT.x - 18, BAT.y],
    [cc[0] - 96, BAT.y],
    [cc[0] - 96, cc[1]],
    [bL[0] - 12, cc[1]],
  ];
  const wireR: [number, number][] = [
    [bR[0] + 12, cc[1]],
    [cc[0] + 96, cc[1]],
    [cc[0] + 96, BAT.y],
    [BAT.x + 18, BAT.y],
  ];
  const ext = cur * (0.25 + 0.75 * Math.abs(s1));

  // kilatan saat komutator membalik arus (celah melewati sikat)
  const phi = th - Math.PI / 2;
  const sinceFlip = th > Math.PI / 2 ? (fr(phi / Math.PI) * Math.PI) / OM : 99;
  const flipP = sinceFlip / 0.9;

  // panel tampak depan
  const EV = {x: 1500, y: 410};
  const ER = 128;

  // grafik bergulir: arus di sisi A (berbalik) & torsi (selalu positif)
  const GX0 = 1370;
  const GX1 = 1740;
  const Wn = 6.8;
  const N = 110;
  const gI: [number, number][] = [];
  const gT: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const tt = t - Wn + (Wn * i) / N;
    const a = thetaAt(tt, tSpin);
    const sI = sgn(Math.cos(a)) * ramp(tt, tCur, tCur + 0.8);
    const x = GX0 + ((GX1 - GX0) * i) / N;
    gI.push([x, 732 - 30 * sI]);
    gT.push([x, 834 - 40 * sI * Math.cos(a)]);
  }

  return (
    <AbsoluteFill style={{opacity: intro * out}}>
      <Stage>
        <g transform={`translate(${fx},${fy}) scale(${cam}) translate(${-fx},${-fy})`}>
          <Glow x={P(-370, 0, 200)[0]} y={MY} r={260} color="heat" opacity={0.3} />
          <Glow x={P(370, 0, 200)[0]} y={MY} r={260} color="pot" opacity={0.3} />
          <Motes x={MX} y={MY} rx={420} ry={260} n={26} color="spr" opacity={0.4} seed={3} />
          <ellipse cx={MX - 20} cy={MY + 250} rx={470} ry={34} fill="#000" opacity={0.25} />
          <PoleBox x0={-460} x1={-280} color={C.heat} label="U" o={intro} />
          <PoleBox x0={280} x1={460} color={C.pot} label="S" o={intro} />
          {/* garis medan B: kiri (U) → kanan (S), di belakang kumparan */}
          {[-120, -60, 0, 60, 120].map((yy, i) => {
            const z = -110;
            const a0 = P(-280, yy, z);
            const a1 = P(280, yy, z);
            return (
              <g key={yy}>
                <line x1={a0[0]} y1={a0[1]} x2={a1[0]} y2={a1[1]} stroke={C.spr} strokeOpacity={0.4} strokeWidth={2.2} strokeDasharray="10 10" strokeDashoffset={-t * 40} />
                <Stream pts={[a0, a1]} color="spr" n={4} speed={0.3} r={4.5} jitter={0} seed={i * 1.7} opacity={0.75} />
              </g>
            );
          })}
          {/* poros */}
          {(() => {
            const a0 = P(0, 0, -250);
            const a1 = P(0, 0, ZC + 40);
            return <line x1={a0[0]} y1={a0[1]} x2={a1[0]} y2={a1[1]} stroke="#7d8cc0" strokeWidth={7} strokeLinecap="round" />;
          })()}
          {/* kumparan: 3 lilitan */}
          <g opacity={coilIn}>
            {turns.map((d, k) => {
              const rr = R + d;
              const pa = [th, th + Math.PI].map((a) => [rr * Math.cos(a), rr * Math.sin(a)]);
              const ring = [P(pa[0][0], pa[0][1], L + d), P(pa[0][0], pa[0][1], -L - d), P(pa[1][0], pa[1][1], -L - d), P(pa[1][0], pa[1][1], L + d), P(pa[0][0], pa[0][1], L + d)];
              return (
                <g key={k}>
                  <polyline points={pts(ring)} fill="none" stroke={COPPER2} strokeWidth={9} strokeLinejoin="round" />
                  <polyline points={pts(ring)} fill="none" stroke={COPPER} strokeWidth={4.5} strokeLinejoin="round" />
                </g>
              );
            })}
            {/* kabel ke setengah cincin */}
            <polyline points={pts([loop[4], loop[5]])} fill="none" stroke={COPPER} strokeWidth={4} />
            <polyline points={pts([loop[0], loop[1]])} fill="none" stroke={COPPER} strokeWidth={4} />
          </g>
          {/* arus di kumparan (toska): dua set yang bersilang-pudar saat arus dibalik */}
          {[1, -1].map((dir) => {
            const o = cur * Math.max(0, dir * s1);
            if (o < 0.01) return null;
            return Array.from({length: 12}, (_, i) => {
              const u = fr(t * 0.32 + i / 12);
              const [x, y] = pointAlong(loop, dir > 0 ? u : 1 - u);
              return (
                <g key={`${dir}-${i}`} opacity={o * cyc(u)}>
                  <circle cx={x} cy={y} r={11} fill="url(#soft-cyan)" />
                  <circle cx={x} cy={y} r={4} fill={C.cyan} />
                </g>
              );
            });
          })}
          {sides.map((sd) => {
            const m0 = P(sd.x, sd.y, -80 * sd.s);
            const m1 = P(sd.x, sd.y, 80 * sd.s);
            return <Arrow key={`i${sd.k}`} x1={m0[0]} y1={m0[1]} x2={m1[0]} y2={m1[1]} color="cyan" width={5} opacity={cur * Math.abs(sd.s)} pulse={false} />;
          })}
          {/* gaya: sisi kanan ke atas, sisi kiri ke bawah */}
          {sides.map((sd) => {
            const m = P(sd.x, sd.y, 0);
            const up = sd.s;
            return (
              <g key={`f${sd.k}`}>
                <Arrow x1={m[0]} y1={m[1] - 16 * up} x2={m[0]} y2={m[1] - (16 + 105 * Math.abs(up)) * up} color="force" width={7} opacity={force * Math.abs(up)} />
                <Label x={m[0] + 30} y={m[1] - 92 * up} size={30} color={C.force} weight={700} font="serif" italic opacity={force * Math.max(0, Math.abs(up) - 0.3) * 1.4}>
                  F
                </Label>
              </g>
            );
          })}
          {/* komutator cincin belah (berputar bersama kumparan) */}
          {[0, 1, 2, 3].map((k) => {
            const c = P(0, 0, ZC - 20 + k * 12);
            const g = 0.2;
            const shade = k === 3 ? 1 : 0.55 + 0.1 * k;
            return (
              <g key={k} opacity={shade}>
                <polyline points={pts(arc(c, RC, th - Math.PI / 2 + g, th + Math.PI / 2 - g))} fill="none" stroke={k === 3 ? '#f0b07a' : COPPER2} strokeWidth={11} strokeLinecap="butt" />
                <polyline points={pts(arc(c, RC, th + Math.PI / 2 + g, th + (3 * Math.PI) / 2 - g))} fill="none" stroke={k === 3 ? '#d98d52' : COPPER2} strokeWidth={11} strokeLinecap="butt" />
              </g>
            );
          })}
          <Glow x={cc[0]} y={cc[1] + 18} r={90} color="kin" opacity={0.5 * komHi} />
          {th > Math.PI / 2 ? <Ripple x={cc[0]} y={cc[1] + 18} p={flipP} r={70 + 50 * komHi} color="cyan" rings={2} width={2} /> : null}
          {/* sikat karbon */}
          {[bL, bR].map((b, k) => (
            <g key={k}>
              <rect x={b[0] - 11 + (k ? -1 : 1) * 3} y={b[1] + 4} width={22} height={28} rx={3} fill="#3a4266" stroke="#aab6e0" strokeWidth={2} />
            </g>
          ))}
          {/* rangkaian luar + baterai */}
          <polyline points={pts(wireL)} fill="none" stroke="#8b9ad0" strokeWidth={3} strokeLinejoin="round" />
          <polyline points={pts(wireR)} fill="none" stroke="#8b9ad0" strokeWidth={3} strokeLinejoin="round" />
          <rect x={BAT.x - 20} y={BAT.y - 26} width={40} height={52} fill="#0d1430" />
          <line x1={BAT.x - 9} y1={BAT.y - 24} x2={BAT.x - 9} y2={BAT.y + 24} stroke={C.heat} strokeWidth={4} />
          <line x1={BAT.x + 9} y1={BAT.y - 13} x2={BAT.x + 9} y2={BAT.y + 13} stroke={C.pot} strokeWidth={7} />
          <Label x={BAT.x - 30} y={BAT.y - 38} size={24} color={C.heat} weight={700}>
            +
          </Label>
          <Label x={BAT.x + 30} y={BAT.y - 38} size={24} color={C.pot} weight={700}>
            −
          </Label>
          {[wireL, wireR].map((w, k) =>
            Array.from({length: 6}, (_, i) => {
              const u = fr(t * 0.4 + i / 6 + k * 0.08);
              const [x, y] = pointAlong(w, u);
              return (
                <g key={`${k}-${i}`} opacity={ext * cyc(u)}>
                  <circle cx={x} cy={y} r={10} fill="url(#soft-cyan)" />
                  <circle cx={x} cy={y} r={3.8} fill={C.cyan} />
                </g>
              );
            }),
          )}
          {/* arah putar */}
          {(() => {
            const c = P(0, 0, L + 30);
            const a0 = 0.35 + th;
            const a1 = 1.25 + th;
            const rr = R + 46;
            const d = `M${c[0] + rr * Math.cos(a0)},${c[1] - rr * Math.sin(a0)} A ${rr} ${rr} 0 0 0 ${c[0] + rr * Math.cos(a1)},${c[1] - rr * Math.sin(a1)}`;
            return <path d={d} fill="none" stroke={C.work} strokeWidth={4} strokeOpacity={0.75 * ramp(t, tSpin, tSpin + 1)} markerEnd="url(#arrow-work)" />;
          })()}
          <Label x={470} y={300} size={30} color={C.spr} weight={700} font="serif" italic opacity={intro}>
            B →
          </Label>
          <Label x={cc[0] - 150} y={cc[1] + 70} size={22} color={C.kin} font="mono" opacity={komHi}>
            komutator
          </Label>
          <Label x={cc[0] + 150} y={cc[1] + 70} size={22} color="#c9d6ff" font="mono" opacity={komHi}>
            sikat
          </Label>
        </g>

        {/* ---------- panel kanan: tampak depan ---------- */}
        <g opacity={panel}>
          <rect x={1230} y={190} width={540} height={460} rx={22} fill="#0b1330" fillOpacity={0.75} stroke={C.line} strokeWidth={2} />
          <text x={1256} y={222} fontFamily={FONT.mono} fontSize={18} fill={C.muted} dominantBaseline="central">
            tampak depan
          </text>
          <rect x={1258} y={300} width={56} height={220} rx={8} fill={C.heat} fillOpacity={0.8} />
          <rect x={1686} y={300} width={56} height={220} rx={8} fill={C.pot} fillOpacity={0.8} />
          <text x={1286} y={410} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={36} fill="#fff">
            U
          </text>
          <text x={1714} y={410} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={36} fill="#fff">
            S
          </text>
          {[330, 370, 410, 450, 490].map((yy, i) => (
            <g key={yy}>
              <line x1={1316} y1={yy} x2={1684} y2={yy} stroke={C.spr} strokeOpacity={0.3} strokeWidth={1.6} strokeDasharray="8 8" strokeDashoffset={-t * 30} />
              <Stream
                pts={[
                  [1318, yy],
                  [1682, yy],
                ]}
                color="spr"
                n={3}
                speed={0.25}
                r={3.6}
                jitter={0}
                seed={i * 2.3}
                opacity={0.6}
              />
            </g>
          ))}
          {(() => {
            const pa = sides.map((sd) => [EV.x + ER * Math.cos(sd.a), EV.y - ER * Math.sin(sd.a)] as [number, number]);
            return (
              <g>
                <line x1={pa[0][0]} y1={pa[0][1]} x2={pa[1][0]} y2={pa[1][1]} stroke={COPPER} strokeWidth={6} strokeLinecap="round" />
                {sides.map((sd, k) => {
                  const [x, y] = pa[k];
                  const oOut = Math.max(0, sd.s) * cur;
                  const oIn = Math.max(0, -sd.s) * cur;
                  return (
                    <g key={k}>
                      <circle cx={x} cy={y} r={19} fill="#0d1430" stroke={COPPER} strokeWidth={3} />
                      <circle cx={x} cy={y} r={5} fill={C.cyan} opacity={oOut} />
                      <g opacity={oIn} stroke={C.cyan} strokeWidth={3.5} strokeLinecap="round">
                        <line x1={x - 8} y1={y - 8} x2={x + 8} y2={y + 8} />
                        <line x1={x - 8} y1={y + 8} x2={x + 8} y2={y - 8} />
                      </g>
                      <Arrow x1={x} y1={y - 24 * sd.s} x2={x} y2={y - (24 + 80 * Math.abs(sd.s)) * sd.s} color="force" width={5} opacity={force * Math.abs(sd.s)} pulse={false} />
                      <Label x={x + (Math.cos(sd.a) > 0 ? 30 : -30)} y={y + 26} size={20} color={C.muted} font="mono">
                        {k === 0 ? 'A' : 'B'}
                      </Label>
                    </g>
                  );
                })}
                {/* komutator tampak depan */}
                <polyline points={pts(arc([EV.x, EV.y], 22, th - Math.PI / 2 + 0.25, th + Math.PI / 2 - 0.25))} fill="none" stroke="#f0b07a" strokeWidth={8} />
                <polyline points={pts(arc([EV.x, EV.y], 22, th + Math.PI / 2 + 0.25, th + (3 * Math.PI) / 2 - 0.25))} fill="none" stroke="#d98d52" strokeWidth={8} />
                <rect x={EV.x - 44} y={EV.y - 7} width={14} height={14} rx={2} fill="#3a4266" stroke="#aab6e0" strokeWidth={1.5} />
                <rect x={EV.x + 30} y={EV.y - 7} width={14} height={14} rx={2} fill="#3a4266" stroke="#aab6e0" strokeWidth={1.5} />
                <path
                  d={`M${EV.x + 170 * Math.cos(0.5)},${EV.y - 170 * Math.sin(0.5)} A 170 170 0 0 0 ${EV.x + 170 * Math.cos(1.15)},${EV.y - 170 * Math.sin(1.15)}`}
                  fill="none"
                  stroke={C.work}
                  strokeWidth={4}
                  strokeOpacity={0.8 * ramp(t, tSpin, tSpin + 1)}
                  markerEnd="url(#arrow-work)"
                />
              </g>
            );
          })()}
          <text x={1500} y={612} textAnchor="middle" fontFamily={FONT.mono} fontSize={18} fill={C.muted}>
            <tspan fill={C.cyan}>⊙ keluar</tspan> · <tspan fill={C.cyan}>⊗ masuk</tspan> · <tspan fill={C.force}>F = I L × B</tspan>
          </text>
        </g>

        {/* grafik bergulir */}
        <g opacity={graph * panel}>
          <rect x={1230} y={682} width={540} height={186} rx={18} fill="#0b1330" fillOpacity={0.75} stroke={C.line} strokeWidth={2} />
          <text x={1252} y={732} fontFamily={FONT.mono} fontSize={19} fill={C.cyan} dominantBaseline="central">
            arus di A
          </text>
          <text x={1252} y={818} fontFamily={FONT.mono} fontSize={19} fill={C.work} dominantBaseline="central">
            torsi
          </text>
          <line x1={GX0} y1={732} x2={GX1} y2={732} stroke={C.faint} strokeWidth={1.5} />
          <line x1={GX0} y1={834} x2={GX1} y2={834} stroke={C.faint} strokeWidth={1.5} />
          <polyline points={pts(gI)} fill="none" stroke={C.cyan} strokeWidth={3.5} strokeLinejoin="round" />
          <polyline points={pts(gT)} fill="none" stroke={C.work} strokeWidth={3.5} strokeLinejoin="round" />
          <circle cx={GX1} cy={gI[N][1]} r={6} fill="#fff" />
          <circle cx={GX1} cy={gT[N][1]} r={6} fill="#fff" />
          <text x={1555} y={700} textAnchor="middle" fontFamily={FONT.mono} fontSize={16} fill={C.muted} dominantBaseline="central">
            arus dibalik tiap ½ putaran → torsi tetap searah
          </text>
        </g>

        {/* ikon penerapan */}
        <g opacity={icons}>
          <line x1={1210} y1={330} x2={1800} y2={330} stroke="#8b9ad0" strokeWidth={2.5} strokeOpacity={0.6} />
          {[1300, 1530, 1745].map((x, i) => (
            <line key={x} x1={x} y1={330} x2={x} y2={i === 2 ? 400 : 375} stroke="#8b9ad0" strokeWidth={2.5} strokeOpacity={0.6} />
          ))}
          <Stream
            pts={[
              [1210, 330],
              [1800, 330],
            ]}
            color="cyan"
            n={12}
            speed={0.25}
            r={4.5}
            jitter={0}
          />
          <Fan x={1300} y={500} t={t} o={fanIn} hi={win(t, tFan, tWash, 0.5, 0.6)} />
          <Washer x={1530} y={500} t={t} o={washIn} hi={win(t, tWash, tCar, 0.5, 0.6)} />
          <ECar x={1745} y={500} t={t} o={carIn} hi={win(t, tCar, tGerak + 2, 0.5, 0.6)} />
          <Label x={1300} y={640} size={24} color="#c9d6ff" opacity={fanIn}>
            kipas angin
          </Label>
          <Label x={1530} y={640} size={24} color="#c9d6ff" opacity={washIn}>
            mesin cuci
          </Label>
          <Label x={1745} y={640} size={24} color="#c9d6ff" opacity={carIn}>
            mobil listrik
          </Label>
          <Twinkles x={1520} y={770} rx={260} ry={30} n={5} color="work" opacity={noteG} seed={4} />
        </g>
      </Stage>
      <Note x={1500} y={760} p={note0} color={C.force}>
        sisi A didorong <span style={{color: C.force}}>↑</span>, sisi B <span style={{color: C.force}}>↓</span> → kumparan berputar
      </Note>
      <Note x={1500} y={770} p={noteG} color={C.work} size={34}>
        <span style={{color: C.cyan}}>energi listrik</span> → <span style={{color: C.work}}>gerak</span>
      </Note>
      <div style={{position: 'absolute', left: 1230, top: 245, width: 540, textAlign: 'center', fontFamily: FONT.head, fontSize: 24, color: C.muted, opacity: icons * (1 - panel)}}>
        motor ada di mana-mana
      </div>
    </AbsoluteFill>
  );
};
