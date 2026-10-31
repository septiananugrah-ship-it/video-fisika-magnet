import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, EASE_IN_OUT, cyc, mix, pathOf, ramp, rand} from '../anim';
import {Arrow, Glow, Label, Motes, Ripple, Spark, Stage, Twinkles, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pembuka: tiga peristiwa listrik sehari-hari (semua gerak dihitung analitik per frame).
// (A) balon digosok ke rambut: elektron (biru) melompat rambut → balon, rambut tertinggal + dan berdiri;
//     balon didekatkan ke dinding → awan elektron molekul dinding terdorong menjauh (polarisasi), balon menempel;
// (B) awan badai: atas +, bawah − (AUDIT); petir menyambar berkali-kali, kanal ≈ 30 000 K > permukaan Matahari ≈ 5800 K;
// (C) baterai mendorong elektron keluar dari kutub − lewat ponsel kembali ke kutub + (arus konvensional berlawanan);
// lalu "satu gaya: gaya listrik" (pasangan + − dengan garis medan yang dihitung langsung),
// dan zoom ke atom (elektron terikat pada inti) & molekul H₂ (dua inti berbagi elektron).
const TAU = Math.PI * 2;
const fr = (v: number) => ((v % 1) + 1) % 1;
const lin = (x: number) => x;

type Q = {x: number; y: number; q: number};
/** Garis medan: integrasi RK2 dari titik awal searah (dir=1) atau berlawanan (dir=-1) medan. */
const trace = (qs: Q[], x0: number, y0: number, dir: number, steps: number, ds: number, stopR: number): [number, number][] => {
  const E = (x: number, y: number) => {
    let ex = 0;
    let ey = 0;
    for (const c of qs) {
      const dx = x - c.x;
      const dy = y - c.y;
      const r2 = dx * dx + dy * dy + 1e-3;
      const r3 = r2 * Math.sqrt(r2);
      ex += (c.q * dx) / r3;
      ey += (c.q * dy) / r3;
    }
    const m = Math.hypot(ex, ey) || 1;
    return [(dir * ex) / m, (dir * ey) / m];
  };
  const pts: [number, number][] = [[x0, y0]];
  let x = x0;
  let y = y0;
  for (let i = 0; i < steps; i++) {
    const [ax, ay] = E(x, y);
    const [bx, by] = E(x + ax * ds * 0.5, y + ay * ds * 0.5);
    x += bx * ds;
    y += by * ds;
    pts.push([x, y]);
    if (qs.some((c) => c.q * dir < 0 && Math.hypot(x - c.x, y - c.y) < stopR)) break;
  }
  return pts;
};

/** Bola muatan: merah (+) atau biru (−), sorotan tepi & tanda. */
const Charge: React.FC<{x: number; y: number; r: number; s: number; op?: number}> = ({x, y, r, s, op = 1}) =>
  op <= 0.001 ? null : (
    <g opacity={op}>
      <circle cx={x} cy={y} r={r * 2.6} fill={`url(#soft-${s > 0 ? 'heat' : 'pot'})`} />
      <circle cx={x} cy={y} r={r} fill={s > 0 ? C.heat : C.pot} stroke={s > 0 ? '#ffc2ca' : '#c8e4ff'} strokeWidth={r * 0.08} />
      <circle cx={x - r * 0.32} cy={y - r * 0.36} r={r * 0.34} fill="#fff" opacity={0.3} />
      <line x1={x - r * 0.45} y1={y} x2={x + r * 0.45} y2={y} stroke="#fff" strokeWidth={r * 0.16} strokeLinecap="round" />
      {s > 0 ? <line x1={x} y1={y - r * 0.45} x2={x} y2={y + r * 0.45} stroke="#fff" strokeWidth={r * 0.16} strokeLinecap="round" /> : null}
    </g>
  );

/** Bingkai panel. */
const Frame: React.FC<{color: string; op: number}> = ({color, op}) => (
  <rect x={-345} y={-235} width={690} height={470} rx={26} fill="rgba(14,22,50,0.6)" stroke={color} strokeOpacity={0.25 + 0.45 * op} strokeWidth={3} />
);

// ---------- (A) balon, rambut, dinding ----------
const HEAD = {x: -205, y: 95, r: 82};
const BR = 60; // jari-jari balon
const NE = 8; // elektron yang pindah
const STRANDS = Array.from({length: 11}, (_, i) => -2.75 + (i / 10) * 2.0); // sudut akar rambut (rad)
const WALL_X = 222;
const WALLM = Array.from({length: 4 * 11}, (_, i) => ({x: WALL_X + 20 + (i % 4) * 30, y: -200 + Math.floor(i / 4) * 40}));

const Balloon: React.FC<{t: number; rub0: number; rub1: number; move: number; stick: number; glue: number; dwall: number}> = ({t, rub0, rub1, move, stick, glue, dwall}) => {
  const rubbing = ramp(t, rub0 - 0.3, rub0) * (1 - ramp(t, rub1 - 0.3, rub1));
  const rubP = ramp(t, rub0, rub1, lin);
  const bx0 = HEAD.x + 46 * Math.sin(TAU * 1.9 * t) * rubbing;
  const by0 = HEAD.y - HEAD.r - BR + 6 + 6 * Math.abs(Math.sin(TAU * 1.9 * t)) * rubbing;
  const bob = (1 - stick) * 3 * Math.sin(t * 2.1);
  const bx = mix(bx0, WALL_X - BR - 2, move);
  const by = mix(by0, -40, move) + bob + stick * 1.2 * Math.sin(t * 1.3);
  // elektron yang sudah pindah
  const hops = Array.from({length: NE}, (_, k) => {
    const tk = rub0 + 0.25 + ((rub1 - rub0 - 0.6) * k) / NE;
    return ramp(t, tk, tk + 0.45, EASE);
  });
  const nGone = hops.reduce((a, b) => a + b, 0);
  const hairLift = Math.min(1, nGone / NE);
  // pusat tarikan rambut menuju balon
  return (
    <g>
      {/* dinding: plester + molekul yang terpolarisasi */}
      <rect x={WALL_X} y={-225} width={345 - WALL_X - 8} height={450} rx={8} fill="#1b2546" stroke="#56628f" strokeWidth={2.5} />
      {Array.from({length: 6}, (_, k) => (
        <line key={k} x1={WALL_X + 6} y1={-190 + k * 76} x2={337} y2={-190 + k * 76} stroke="#2c3966" strokeWidth={2} />
      ))}
      <rect x={WALL_X - 2} y={-225} width={10} height={450} fill={C.heat} opacity={0.0 + 0.35 * dwall * Math.exp(-0)} rx={4} />
      {WALLM.map((m, i) => {
        const d = Math.hypot(m.x - bx, m.y - by);
        const pol = move * 9 / (1 + (Math.max(0, d - BR) / 70) ** 2);
        const ux = (m.x - bx) / (d || 1);
        const uy = (m.y - by) / (d || 1);
        const jig = 0.8 * Math.sin(t * 3 + i * 1.7);
        return (
          <g key={i}>
            <circle cx={m.x + ux * pol + jig} cy={m.y + uy * pol} r={6} fill={C.pot} opacity={0.75} />
            <circle cx={m.x - ux * pol * 0.25} cy={m.y - uy * pol * 0.25} r={3.5} fill={C.heat} />
          </g>
        );
      })}
      {/* kepala & rambut */}
      <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill="#f1bf9e" stroke="#c98f6e" strokeWidth={2.5} />
      <circle cx={HEAD.x + 34} cy={HEAD.y + 6} r={5} fill="#3a2a2a" />
      <path d={`M${HEAD.x + 22},${HEAD.y + 38} q16,10 30,-2`} fill="none" stroke="#a5604c" strokeWidth={3} strokeLinecap="round" />
      {STRANDS.map((a, i) => {
        const rx = HEAD.x + HEAD.r * Math.cos(a);
        const ry = HEAD.y + HEAD.r * Math.sin(a);
        // ujung rambut: lurus keluar, lalu condong ke arah balon saat bermuatan +
        const tx0 = rx + 46 * Math.cos(a - 0.5);
        const ty0 = ry + 46 * Math.sin(a - 0.5) + 14;
        const toB = Math.atan2(by - ry, bx - rx);
        const lift = hairLift * (0.7 + 0.3 * Math.sin(t * 2.4 + i));
        const tx = mix(tx0, rx + 58 * Math.cos(toB), lift * 0.75);
        const ty = mix(ty0, ry + 58 * Math.sin(toB), lift * 0.75);
        const cx = (rx + tx) / 2 + 10 * Math.sin(t * 1.7 + i);
        const cy = (ry + ty) / 2 - 8;
        const plus = hops[i % NE] * (i < NE ? 1 : 0);
        return (
          <g key={i}>
            <path d={`M${rx},${ry} Q${cx},${cy} ${tx},${ty}`} fill="none" stroke="#5a3b2a" strokeWidth={6} strokeLinecap="round" />
            {plus > 0.01 ? (
              <g opacity={plus}>
                <circle cx={tx} cy={ty} r={9} fill={C.heat} />
                <path d={`M${tx - 5},${ty} h10 M${tx},${ty - 5} v10`} stroke="#fff" strokeWidth={2.2} />
              </g>
            ) : null}
          </g>
        );
      })}
      <path d={`M${HEAD.x - 78},${HEAD.y - 22} Q${HEAD.x - 70},${HEAD.y - 96} ${HEAD.x},${HEAD.y - 88} Q${HEAD.x + 64},${HEAD.y - 86} ${HEAD.x + 74},${HEAD.y - 30} Q${HEAD.x + 20},${HEAD.y - 64} ${HEAD.x - 78},${HEAD.y - 22} Z`} fill="#5a3b2a" />
      {/* tali & balon */}
      <path d={`M${bx},${by + BR + 8} q${-14 + 8 * Math.sin(t * 1.6)},40 ${4 + 6 * Math.sin(t * 1.2)},80 q12,30 ${-6},60`} fill="none" stroke="#c9d2f0" strokeWidth={2} opacity={0.75 * move} />
      <ellipse cx={bx} cy={by} rx={BR} ry={BR * 1.12} fill="#c7cff4" opacity={0.92} stroke="#eef2ff" strokeWidth={2.5} />
      <ellipse cx={bx - BR * 0.34} cy={by - BR * 0.42} rx={BR * 0.2} ry={BR * 0.3} fill="#fff" opacity={0.55} transform={`rotate(-20 ${bx - BR * 0.34} ${by - BR * 0.42})`} />
      <path d={`M${bx - 7},${by + BR * 1.12 + 9} l7,-10 l7,10 Z`} fill="#c7cff4" />
      {/* elektron melompat rambut → balon */}
      {hops.map((h, k) => {
        if (h <= 0.001) return null;
        const a = STRANDS[k];
        const sx = HEAD.x + (HEAD.r + 40) * Math.cos(a - 0.3);
        const sy = HEAD.y + (HEAD.r + 40) * Math.sin(a - 0.3);
        const th = 1.35 + k * 0.42 + rubP * 0.3;
        const ox = bx + BR * 0.62 * Math.cos(th + 0.15 * Math.sin(t * 1.4 + k));
        const oy = by + BR * 0.7 * Math.sin(th + 0.15 * Math.sin(t * 1.4 + k));
        const x = mix(sx, ox, h);
        const y = mix(sy, oy, h) - 34 * Math.sin(Math.PI * h);
        return <Spark key={k} x={x} y={y} r={6.5} color="pot" />;
      })}
      <Ripple x={WALL_X} y={-40} p={glue} r={150} color="force" />
      <Arrow x1={bx + BR * 0.2} y1={-40} x2={WALL_X - 6} y2={-40} color="force" width={5} opacity={dwall * 0.9} pulse={false} />
    </g>
  );
};

// ---------- (B) awan badai & petir ----------
const CLOUD: [number, number, number][] = [
  [-170, -130, 62],
  [-95, -160, 80],
  [0, -170, 92],
  [100, -150, 78],
  [170, -122, 58],
  [-120, -100, 60],
  [40, -105, 70],
  [130, -98, 52],
];
const bolt = (seed: number): [number, number][] => {
  const pts: [number, number][] = [];
  const n = 11;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const jx = i === 0 || i === n ? 0 : (rand(seed * 17 + i * 3.3) - 0.5) * 70;
    pts.push([-10 + 50 * u + jx, -70 + 258 * u]);
  }
  return pts;
};
const BOLTS = [bolt(1), bolt(2), bolt(3)];
const branch = (b: [number, number][], seed: number): [number, number][] => {
  const [x0, y0] = b[4];
  return [0, 1, 2, 3].map((k) => [x0 + k * (24 + 10 * rand(seed + k)) * (seed % 2 ? 1 : -1), y0 + k * 22] as [number, number]);
};

const Storm: React.FC<{t: number; strikes: number[]; hot: number}> = ({t, strikes, hot}) => {
  const sv = strikes.map((s) => ({draw: ramp(t, s, s + 0.12, lin), fade: 1 - ramp(t, s + 0.18, s + 0.8, EASE_IN_OUT)}));
  const flash = Math.max(0, ...sv.map((v) => (v.draw > 0 ? v.fade * v.draw : 0)));
  const drift = 10 * Math.sin(t * 0.4);
  return (
    <g>
      <rect x={-345} y={-235} width={690} height={470} rx={26} fill="#dfe8ff" opacity={0.12 * flash} />
      {/* hujan */}
      {Array.from({length: 28}, (_, i) => {
        const ph = fr(t * (0.9 + rand(i) * 0.5) + rand(i * 2.3));
        const x = -260 + rand(i * 5.1) * 520 - ph * 30;
        const y = -80 + ph * 260;
        return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 20} stroke="#8fb6ff" strokeWidth={2} opacity={0.45 * cyc(ph)} />;
      })}
      {/* tanah, rumah, pohon */}
      <rect x={-345} y={188} width={690} height={40} fill="#16223f" />
      {[-260, -205, 210, 270].map((x, k) => (
        <g key={k}>
          {k < 2 ? (
            <path d={`M${x - 26},188 v-34 l26,-22 l26,22 v34 Z`} fill="#26345e" stroke="#3b4a7c" strokeWidth={2} />
          ) : (
            <>
              <rect x={x - 4} y={160} width={8} height={28} fill="#3b3048" />
              <circle cx={x} cy={150 + 2 * Math.sin(t * 1.5 + k)} r={22} fill="#1f4a46" />
            </>
          )}
        </g>
      ))}
      {[-120, -60, 0, 60, 120].map((x, k) => (
        <g key={k} opacity={0.7}>
          <circle cx={x + 20} cy={204} r={7} fill={C.heat} />
          <path d={`M${x + 16},204 h8 M${x + 20},200 v8`} stroke="#fff" strokeWidth={1.8} />
        </g>
      ))}
      {/* petir */}
      {sv.map((v, k) => {
        if (v.draw <= 0 || v.fade <= 0) return null;
        const b = BOLTS[k % 3];
        const d = pathOf(b);
        return (
          <g key={k} opacity={v.fade}>
            <path d={d} fill="none" stroke="#fff6c8" strokeWidth={18} strokeOpacity={0.18} strokeLinejoin="round" pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - v.draw)} />
            <path d={pathOf(branch(b, k + 1))} fill="none" stroke="#fff3b0" strokeWidth={3} opacity={v.draw} />
            <path d={d} fill="none" stroke={C.force} strokeWidth={7} strokeLinejoin="round" pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - v.draw)} />
            <path d={d} fill="none" stroke="#fff" strokeWidth={2.5} strokeLinejoin="round" pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - v.draw)} />
            <Glow x={b[b.length - 1][0]} y={186} r={120} color="force" opacity={v.draw} still />
          </g>
        );
      })}
      {/* awan */}
      <g transform={`translate(${drift} 0)`}>
        {CLOUD.map(([x, y, r], k) => (
          <circle key={k} cx={x} cy={y + 3 * Math.sin(t * 0.8 + k)} r={r} fill={k < 5 ? '#3a4672' : '#273258'} />
        ))}
        <ellipse cx={0} cy={-90} rx={210} ry={28} fill="#1d2747" />
        <circle cx={0} cy={-120} r={190} fill="url(#soft-force)" opacity={0.6 * flash} />
        {[-130, -65, 0, 65, 130].map((x, k) => (
          <g key={k}>
            <circle cx={x} cy={-190 + 4 * Math.sin(t * 1.3 + k)} r={9} fill={C.heat} />
            <path d={`M${x - 5},${-190 + 4 * Math.sin(t * 1.3 + k)} h10 M${x},${-195 + 4 * Math.sin(t * 1.3 + k)} v10`} stroke="#fff" strokeWidth={2} />
            <circle cx={x + 18} cy={-92 + 3 * Math.sin(t * 1.6 + k)} r={9} fill={C.pot} />
            <path d={`M${x + 13},${-92 + 3 * Math.sin(t * 1.6 + k)} h10`} stroke="#fff" strokeWidth={2} />
          </g>
        ))}
      </g>
      {/* suhu kanal petir vs Matahari */}
      <g opacity={hot}>
        <rect x={70} y={20} width={262} height={46} rx={23} fill="rgba(10,16,36,0.88)" stroke={C.force} strokeWidth={2} />
        <text x={201} y={51} textAnchor="middle" fontFamily={FONT.mono} fontSize={23} fill={C.force}>
          petir ≈ 30 000 K
        </text>
        <rect x={70} y={78} width={262} height={46} rx={23} fill="rgba(10,16,36,0.88)" stroke={C.kin} strokeWidth={2} />
        <circle cx={96} cy={101} r={10 + Math.sin(t * 2)} fill={C.kin} />
        <text x={214} y={109} textAnchor="middle" fontFamily={FONT.mono} fontSize={21} fill={C.kin}>
          Matahari ≈ 5800 K
        </text>
      </g>
    </g>
  );
};

// ---------- (C) baterai, rangkaian, ponsel ----------
const BX = -240;
const PX = 205;
const LOOP: [number, number][] = [
  [BX, 80],
  [BX, 150],
  [PX, 150],
  [PX, 112],
  [PX, -112],
  [PX, -150],
  [BX, -150],
  [BX, -80],
  [BX, 80],
];

const Circuit: React.FC<{t: number; flow: number; push: number; on: number; day: number}> = ({t, flow, push, on, day}) => {
  const n = 24;
  const sp = 0.07 + 0.05 * push;
  return (
    <g>
      <path d={pathOf(LOOP.slice(0, 8))} fill="none" stroke="#b77a3c" strokeWidth={9} strokeLinejoin="round" />
      <path d={pathOf(LOOP.slice(0, 8))} fill="none" stroke="#f0b070" strokeWidth={2.5} strokeLinejoin="round" opacity={0.6} />
      {/* elektron: keluar dari kutub −, lewat ponsel, kembali ke kutub + */}
      {Array.from({length: n}, (_, i) => {
        const u = fr(t * sp + i / n);
        const [x, y] = pointAlong(LOOP, u);
        return <Spark key={i} x={x} y={y} r={5.5} color="pot" opacity={flow} />;
      })}
      {/* baterai */}
      <rect x={BX - 16} y={-100} width={32} height={14} rx={4} fill="#c8cfe6" />
      <rect x={BX - 42} y={-88} width={84} height={176} rx={14} fill="#2b3762" stroke="#a9b4d8" strokeWidth={3} />
      <rect x={BX - 42} y={-88} width={84} height={70} rx={14} fill={C.heat} opacity={0.35 + 0.25 * push} />
      <rect x={BX - 42} y={18} width={84} height={70} rx={14} fill={C.pot} opacity={0.35 + 0.25 * push} />
      <circle cx={BX} cy={0} r={70} fill="url(#soft-cyan)" opacity={0.6 * push * (0.8 + 0.2 * Math.sin(t * 4))} />
      <text x={BX} y={-40} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={40} fill="#fff">
        +
      </text>
      <text x={BX} y={52} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={44} fill="#fff">
        −
      </text>
      {/* ponsel */}
      <rect x={PX - 66} y={-118} width={132} height={236} rx={20} fill="#0e1430" stroke="#9aa6cc" strokeWidth={3.5} />
      <rect x={PX - 56} y={-100} width={112} height={200} rx={10} fill="#0a0f24" />
      <rect x={PX - 56} y={-100} width={112} height={200} rx={10} fill={C.cyan} opacity={0.32 * on + 0.06 * on * Math.sin(t * 2)} />
      <circle cx={PX} cy={-10} r={110} fill="url(#soft-cyan)" opacity={0.7 * on} />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <rect key={k} x={PX - 42 + (k % 3) * 32} y={-74 + Math.floor(k / 3) * 34} width={20} height={20} rx={5} fill={[C.kin, C.work, C.spr, C.force, C.press, C.pot][k]} opacity={0.85 * on} />
      ))}
      {/* indikator daya ponsel */}
      <rect x={PX - 36} y={26} width={64} height={30} rx={6} fill="none" stroke="#e8f0ff" strokeWidth={2.5} opacity={on} />
      <rect x={PX + 29} y={35} width={5} height={12} rx={2} fill="#e8f0ff" opacity={on} />
      <rect x={PX - 32} y={30} width={56 * (0.25 + 0.75 * day)} height={22} rx={3} fill={C.work} opacity={on} />
      <text x={PX} y={82} textAnchor="middle" fontFamily={FONT.mono} fontSize={18} fill="#e8f0ff" opacity={on}>
        {`${Math.round(25 + 75 * day)}%`}
      </text>
      <Label x={0} y={186} size={24} color={C.pot} font="mono" opacity={flow}>
        elektron →
      </Label>
    </g>
  );
};

// ---------- tata letak ----------
const SLOTS = [360, 960, 1560];
const SLOT_Y = 320;
const SLOT_S = 0.5;
const FY = 700; // baris "gaya listrik"
const AX = 600; // lensa atom
const MX = 1320; // lensa molekul
const LY = 500;
const LR = 240;

export const Hook: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const c = [0, 1, 2, 3, 4, 5].map(cue);

  const pos = (appear: number, move: number, ax: number, ay: number, as: number, k: number) => {
    const m = ramp(t, move, move + 1.0, EASE_IN_OUT);
    return {x: mix(ax, SLOTS[k], m), y: mix(ay, SLOT_Y, m), s: mix(as, SLOT_S, m), op: ramp(t, appear - 0.4, appear + 0.5), m};
  };
  const pA = pos(c[0] - 0.9, c[1] - 0.6, 960, 530, 1.05, 0);
  const pB = pos(c[1] - 0.3, c[2] - 0.6, 960, 665, 0.84, 1);
  const pC = pos(c[2] - 0.3, c[3] - 0.4, 960, 665, 0.84, 2);

  // balon
  const rub0 = c[0] - 0.5;
  const rub1 = wordOf(0, 'dekatkan') - 0.1;
  const move = ramp(t, wordOf(0, 'dekatkan'), wordOf(0, 'dinding') + 0.7, EASE_IN_OUT);
  const stick = ramp(t, wordOf(0, 'menempel') - 0.3, wordOf(0, 'menempel') + 0.4);
  const glue = ramp(t, wordOf(0, 'lem') - 0.1, wordOf(0, 'lem') + 1.4, lin);
  const dwall = ramp(t, wordOf(0, 'menempel') - 0.2, wordOf(0, 'menempel') + 0.5);
  // petir
  const strikes = [c[1] + 0.4, wordOf(1, 'petir') - 0.1, wordOf(1, 'matahari') - 0.05];
  const hot = ramp(t, wordOf(1, 'panas') - 0.3, wordOf(1, 'panas') + 0.4);
  // baterai
  const flow = ramp(t, c[2] - 0.1, c[2] + 0.8);
  const push = ramp(t, wordOf(2, 'mendorong') - 0.3, wordOf(2, 'mendorong') + 0.5);
  const on = ramp(t, wordOf(2, 'menyalakan') - 0.3, wordOf(2, 'menyalakan') + 0.5);
  const day = ramp(t, wordOf(2, 'menyalakan'), cue(3) + 1.5, lin);

  // satu gaya
  const tags = ramp(t, c[3] - 0.1, c[3] + 0.7);
  const conv = ramp(t, wordOf(3, 'satu') - 0.3, wordOf(3, 'gaya') + 0.5, EASE_IN_OUT);
  const gl = ramp(t, c[4] - 0.5, c[4] + 0.3);
  const pull = ramp(t, c[4] - 0.3, c[4] + 1.6, EASE_IN_OUT);
  // zoom
  const zp = ramp(t, c[5] - 0.2, c[5] + 1.3, EASE_IN_OUT);
  const zs = 1 + 4 * zp;
  const world = 1 - ramp(t, c[5] + 0.2, c[5] + 1.1, EASE_IN_OUT);
  const atomP = ramp(t, c[5] + 0.5, c[5] + 1.4);
  const molP = ramp(t, wordOf(5, 'molekul') - 0.7, wordOf(5, 'molekul') + 0.2);
  const inti = ramp(t, wordOf(5, 'inti') - 0.3, wordOf(5, 'inti') + 0.4);
  const km = ramp(t, wordOf(5, 'kimia') - 0.3, wordOf(5, 'kimia') + 0.4);
  const ls = ramp(t, wordOf(5, 'listrik') - 0.3, wordOf(5, 'listrik') + 0.4);
  const end = 1 - ramp(t, dur - 0.6, dur + 0.4, EASE_IN_OUT);

  // pasangan + − yang saling menarik (garis medan dihitung langsung)
  const sep = mix(800, 640, pull) + 14 * Math.sin(t * 1.4);
  const qs: Q[] = [
    {x: 960 - sep / 2, y: FY, q: 1},
    {x: 960 + sep / 2, y: FY, q: -1},
  ];
  const lines = gl > 0.01 ? [-1.1, -0.75, -0.4, 0.4, 0.75, 1.1].map((a) => trace(qs, qs[0].x + 30 * Math.cos(a), FY + 30 * Math.sin(a), 1, 140, 9, 26)) : [];

  // atom: elektron mengorbit inti
  const ms = t - c[5];
  const eA = ms * 1.6;
  const ex = AX + 170 * Math.cos(eA);
  const ey = LY + 70 * Math.sin(eA);
  const rot = (x: number, y: number): [number, number] => {
    const a = -0.35;
    const dx = x - AX;
    const dy = y - LY;
    return [AX + dx * Math.cos(a) - dy * Math.sin(a), LY + dx * Math.sin(a) + dy * Math.cos(a)];
  };
  const [eX, eY] = rot(ex, ey);
  const eTrail = [1, 2, 3, 4, 5].map((k) => rot(AX + 170 * Math.cos(eA - k * 0.08), LY + 70 * Math.sin(eA - k * 0.08)));
  const dA = Math.hypot(eX - AX, eY - LY);

  return (
    <AbsoluteFill style={{opacity: end}}>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={34} color="pot" opacity={0.3} seed={2} />
        <g transform={`translate(960 ${FY}) scale(${zs}) translate(-960 ${-FY})`} opacity={world}>
          <g opacity={pA.op} transform={`translate(${pA.x} ${pA.y}) scale(${pA.s})`}>
            <Frame color={C.pot} op={pA.m} />
            <Balloon t={t} rub0={rub0} rub1={rub1} move={move} stick={stick} glue={glue} dwall={dwall} />
          </g>
          <g opacity={pB.op} transform={`translate(${pB.x} ${pB.y}) scale(${pB.s})`}>
            <Frame color={C.force} op={pB.m} />
            <Storm t={t} strikes={strikes} hot={hot} />
          </g>
          <g opacity={pC.op} transform={`translate(${pC.x} ${pC.y}) scale(${pC.s})`}>
            <Frame color={C.cyan} op={pC.m} />
            <Circuit t={t} flow={flow} push={push} on={on} day={day} />
          </g>
          {['balon menempel', 'petir', 'baterai'].map((s, k) => (
            <Label key={s} x={SLOTS[k]} y={SLOT_Y + 150} size={30} color={[C.pot, C.force, C.cyan][k]} weight={600} opacity={tags}>
              {s}
            </Label>
          ))}
          {SLOTS.map((x, k) => (
            <path key={k} d={`M${x},${SLOT_Y + 178} C${x},${SLOT_Y + 240} 960,${SLOT_Y + 200} 960,${FY - 80}`} fill="none" stroke={C.force} strokeWidth={3} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - conv)} pathLength={1000} opacity={0.7 * (1 - gl * 0.6)} />
          ))}
          <circle cx={960} cy={FY - 80} r={9 + 2 * Math.sin(t * 4)} fill={C.force} opacity={conv * (1 - gl)} />
          <Ripple x={960} y={FY - 80} p={ramp(t, wordOf(3, 'gaya') - 0.1, wordOf(3, 'gaya') + 1.3, lin)} r={140} color="force" />

          {/* gaya listrik */}
          <g opacity={gl}>
            {lines.map((pts, k) => (
              <g key={k}>
                <path d={pathOf(pts)} fill="none" stroke={C.force} strokeWidth={2.5} opacity={0.45} strokeDasharray="10 12" strokeDashoffset={-t * 40} />
                {[0, 0.5].map((o) => {
                  const ph = fr(t * 0.35 + o + k * 0.13);
                  const [x, y] = pointAlong(pts, ph);
                  return <circle key={o} cx={x} cy={y} r={4} fill={C.force} opacity={cyc(ph)} />;
                })}
              </g>
            ))}
            <Charge x={qs[0].x} y={FY} r={30} s={1} />
            <Charge x={qs[1].x} y={FY} r={30} s={-1} />
            <Arrow x1={qs[0].x + 40} y1={FY} x2={qs[0].x + 40 + 70 * (640 / sep) ** 2} y2={FY} color="force" width={6} />
            <Arrow x1={qs[1].x - 40} y1={FY} x2={qs[1].x - 40 - 70 * (640 / sep) ** 2} y2={FY} color="force" width={6} />
            <Glow x={960} y={FY} r={260} color="force" opacity={0.35} />
            <Label x={960} y={FY} size={70} color={C.force} weight={700}>
              gaya listrik
            </Label>
            <Ripple x={960} y={FY} p={ramp(t, c[4] - 0.1, c[4] + 1.6, lin)} r={360} color="force" />
          </g>
        </g>

        {/* atom: elektron terikat pada inti */}
        <g opacity={atomP}>
          <defs>
            <clipPath id="hk-la">
              <circle cx={AX} cy={LY} r={LR} />
            </clipPath>
            <clipPath id="hk-lm">
              <circle cx={MX} cy={LY} r={LR} />
            </clipPath>
          </defs>
          <Glow x={AX} y={LY} r={420} color="pot" opacity={0.4} />
          <circle cx={AX} cy={LY} r={LR} fill="#0b1430" />
          <g clipPath="url(#hk-la)">
            {Array.from({length: 10}, (_, k) => {
              const a = (k / 10) * TAU + 0.2;
              const ph = fr(t * 0.4 + k * 0.1);
              const r0 = 40 + ph * 190;
              return <circle key={k} cx={AX + r0 * Math.cos(a)} cy={LY + r0 * Math.sin(a)} r={3} fill={C.force} opacity={0.5 * cyc(ph)} />;
            })}
            <ellipse cx={AX} cy={LY} rx={170} ry={70} fill="none" stroke={C.pot} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 10" transform={`rotate(${(-0.35 * 180) / Math.PI} ${AX} ${LY})`} />
            <Charge x={AX} y={LY} r={30} s={1} />
            <Arrow x1={eX} y1={eY} x2={eX + ((AX - eX) / dA) * 70} y2={eY + ((LY - eY) / dA) * 70} color="force" width={5} pulse={false} opacity={inti} />
            <Spark x={eX} y={eY} r={9} color="pot" trail={eTrail} />
          </g>
          <circle cx={AX} cy={LY} r={LR} fill="none" stroke={C.pot} strokeOpacity={0.3} strokeWidth={14} />
          <circle cx={AX} cy={LY} r={LR} fill="none" stroke="#bfe0ff" strokeWidth={3} />
          <Label x={AX} y={LY - LR - 40} size={34} color={C.ink} weight={600}>
            atom
          </Label>
          <Label x={AX} y={LY + LR + 36} size={26} color={C.muted} font="mono" opacity={inti}>
            elektron − ditarik inti +
          </Label>
        </g>

        {/* molekul H₂: dua inti berbagi dua elektron */}
        <g opacity={molP}>
          <Glow x={MX} y={LY} r={420} color="work" opacity={0.35} />
          <circle cx={MX} cy={LY} r={LR} fill="#0b1430" />
          <g clipPath="url(#hk-lm)">
            <ellipse cx={MX} cy={LY} rx={170} ry={95} fill="url(#soft-pot)" opacity={0.9 + 0.1 * Math.sin(t * 2)} />
            {[0, 1].map((k) => {
              const ph = t * 1.3 + k * Math.PI;
              const x = MX + 130 * Math.sin(ph);
              const y = LY + 62 * Math.sin(2 * ph) * (k ? -1 : 1);
              const tr = [1, 2, 3, 4].map((j) => [MX + 130 * Math.sin(ph - j * 0.08), LY + 62 * Math.sin(2 * (ph - j * 0.08)) * (k ? -1 : 1)] as [number, number]);
              return (
                <g key={k}>
                  {[-70, 70].map((nx) => (
                    <line key={nx} x1={x} y1={y} x2={MX + nx} y2={LY} stroke={C.force} strokeWidth={2} strokeDasharray="4 7" opacity={0.45} />
                  ))}
                  <Spark x={x} y={y} r={8} color="pot" trail={tr} />
                </g>
              );
            })}
            <Charge x={MX - 70 + 2 * Math.sin(t * 5)} y={LY} r={24} s={1} />
            <Charge x={MX + 70 - 2 * Math.sin(t * 5)} y={LY} r={24} s={1} />
          </g>
          <circle cx={MX} cy={LY} r={LR} fill="none" stroke={C.work} strokeOpacity={0.3} strokeWidth={14} />
          <circle cx={MX} cy={LY} r={LR} fill="none" stroke="#c4f7df" strokeWidth={3} />
          <Label x={MX} y={LY - LR - 40} size={34} color={C.ink} weight={600}>
            molekul H₂
          </Label>
          <Label x={MX} y={LY + LR + 36} size={26} color={C.muted} font="mono">
            dua inti berbagi elektron
          </Label>
        </g>
        <Label x={880} y={LY + LR + 110} size={50} color={C.work} weight={700} anchor="end" opacity={km}>
          kimia
        </Label>
        <Label x={960} y={LY + LR + 110} size={50} color={C.muted} weight={600} opacity={ls}>
          =
        </Label>
        <Label x={1040} y={LY + LR + 110} size={50} color={C.force} weight={700} anchor="start" opacity={ls}>
          listrik
        </Label>
        <Twinkles x={960} y={LY + LR + 110} rx={240} ry={40} n={6} color="force" opacity={0.7 * ls} seed={3} />
      </Stage>
    </AbsoluteFill>
  );
};
