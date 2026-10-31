import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, ramp} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Gaya Lorentz (AUDIT): F = qvB (v ⊥ B), F ⊥ v → kelajuan tetap, lintasan melingkar r = mv/(qB).
// Medan ⊗ masuk layar. Untuk muatan +: v ke kanan → F = q v×B ke atas → berputar berlawanan jarum jam di layar;
// muatan − berputar searah jarum jam. Posisi dihitung analitik: pusat + r(cos φ, −sin φ), φ = ωt.

type P = [number, number];
const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));
const REG = {x0: 150, x1: 1230, y0: 185, y1: 875};
const GRID: P[] = [];
for (let x = 195; x <= 1190; x += 90) for (let y = 230; y <= 840; y += 87) GRID.push([x, y]);

const Charge: React.FC<{x: number; y: number; r?: number; sign: 1 | -1; op?: number; trail?: P[]}> = ({x, y, r = 20, sign, op = 1, trail}) =>
  op <= 0.001 ? null : (
    <g opacity={op}>
      {trail?.map(([tx, ty], i) => (
        <circle key={i} cx={tx} cy={ty} r={r * 0.55 * (1 - i / (trail.length + 2))} fill={sign > 0 ? C.heat : C.pot} opacity={0.5 * (1 - i / trail.length)} />
      ))}
      <circle cx={x} cy={y} r={r * 2.6} fill={`url(#soft-${sign > 0 ? 'heat' : 'pot'})`} />
      <circle cx={x} cy={y} r={r} fill={`url(#lz-${sign > 0 ? 'pos' : 'neg'})`} stroke="#fff" strokeOpacity={0.5} strokeWidth={1.5} />
      <line x1={x - r * 0.45} y1={y} x2={x + r * 0.45} y2={y} stroke="#fff" strokeWidth={Math.max(2.5, r * 0.16)} strokeLinecap="round" />
      {sign > 0 ? <line x1={x} y1={y - r * 0.45} x2={x} y2={y + r * 0.45} stroke="#fff" strokeWidth={Math.max(2.5, r * 0.16)} strokeLinecap="round" /> : null}
    </g>
  );

const Gun: React.FC<{x: number; y: number; op: number}> = ({x, y, op}) =>
  op <= 0.001 ? null : (
    <g opacity={op}>
      <rect x={x - 150} y={y - 26} width={120} height={52} rx={10} fill="#26345e" stroke={C.muted} strokeWidth={2} />
      <rect x={x - 32} y={y - 13} width={24} height={26} rx={4} fill="#3b4c80" stroke={C.muted} strokeWidth={2} />
      <circle cx={x - 116} cy={y} r={8} fill={C.gold} opacity={0.8} />
    </g>
  );

/** Posisi & arah pada lingkaran: dir = +1 berlawanan jarum jam di layar, −1 searah. Mulai di titik `start` bergerak ke kanan. */
const orbit = (start: P, R: number, dir: 1 | -1, s: number) => {
  // pusat di atas (dir +1) atau di bawah (dir −1) titik awal
  const cx = start[0];
  const cy = start[1] - dir * R;
  const ph = -Math.PI / 2 + s / R; // sudut matematis (dir +1)
  const x = cx + R * Math.cos(ph);
  const y = cy - dir * R * Math.sin(ph);
  const vx = -Math.sin(ph);
  const vy = -dir * Math.cos(ph);
  return {x, y, vx, vy, cx, cy};
};
const circFrom = (start: P, R: number, dir: 1 | -1) => {
  const cy = start[1] - dir * R;
  const sw = dir > 0 ? 0 : 1;
  const opp = cy - (start[1] - cy);
  return `M${start[0]},${start[1]} A${R},${R} 0 1 ${sw} ${start[0]},${opp} A${R},${R} 0 1 ${sw} ${start[0]},${start[1]}`;
};

export const Lorentz: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const regOp = ramp(t, -0.5, 0.6);
  const m1 = 1 - ramp(t, cue(3) - 0.35, cue(3) + 0.4, EASE_IN_OUT);
  const p2 = slot(t, cue(3) - 0.1, cue(4) - 0.05, 0.6, 0.55);
  const p3 = ramp(t, cue(4) - 0.2, cue(4) + 0.5);

  /* ---- fase 1: diam vs bergerak ---- */
  const still = slot(t, 0.2, cue(2) - 0.1, 0.7, 0.6);
  const tM = wordOf(0, 'bergerak') - 0.3;
  const V0 = 190;
  const R0 = 230;
  const start0: P = [760, 760];
  const s0 = Math.max(0, t - tM) * V0;
  const o0 = orbit(start0, R0, 1, s0);
  const mOp = ramp(t, tM, tM + 0.4) * m1;
  const trail0: P[] = Array.from({length: 14}, (_, i) => {
    const o = orbit(start0, R0, 1, Math.max(0, s0 - (i + 1) * 0.05 * V0));
    return [o.x, o.y];
  });
  const vOp = ramp(t, tM + 0.1, tM + 0.7);
  const tF = wordOf(1, 'gayanya');
  const fOp = ramp(t, tF - 0.3, tF + 0.3);
  const perpOp = ramp(t, wordOf(1, 'tegak') - 0.2, wordOf(1, 'tegak') + 0.4);
  const fx = -(o0.x - o0.cx) / R0;
  const fy = -(o0.y - o0.cy) / R0;
  const dials = slot(t, cue(2) - 0.2, cue(3) + 0.1, 0.6, 0.5);

  /* ---- fase 2: m vs 2m ---- */
  const t3 = cue(3) + 0.3;
  const st3: P = [690, 818];
  const V2 = 200;
  const s3 = Math.max(0, t - t3) * V2;
  const lightO = orbit(st3, 150, 1, s3);
  const heavyO = orbit(st3, 300, 1, s3);
  const tr = (R: number): P[] =>
    Array.from({length: 12}, (_, i) => {
      const o = orbit(st3, R, 1, Math.max(0, s3 - (i + 1) * 0.05 * V2));
      return [o.x, o.y];
    });
  const in3 = ramp(t, t3 - 0.2, t3 + 0.3);
  const legend = ramp(t, wordOf(3, 'berat') - 0.6, wordOf(3, 'berat') + 0.2);

  /* ---- fase 3: + dan − ---- */
  const t4 = cue(4) + 0.2;
  const SP: P = [690, 535];
  const R4 = 165;
  const V4 = 200;
  const parts = [0, 1, 2].map((j) => {
    const tj = t4 + j * 1.6;
    return {tj, s: Math.max(0, t - tj) * V4, op: ramp(t, tj - 0.05, tj + 0.25)};
  });

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <radialGradient id="lz-pos" cx="35%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#ffc2ca" />
            <stop offset="55%" stopColor={C.heat} />
            <stop offset="100%" stopColor="#7a1626" />
          </radialGradient>
          <radialGradient id="lz-neg" cx="35%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#cfe6ff" />
            <stop offset="55%" stopColor={C.pot} />
            <stop offset="100%" stopColor="#123a72" />
          </radialGradient>
        </defs>

        {/* daerah medan ⊗ */}
        <g opacity={regOp}>
          <rect x={REG.x0} y={REG.y0} width={REG.x1 - REG.x0} height={REG.y1 - REG.y0} rx={26} fill={C.spr} fillOpacity={0.05} stroke={C.spr} strokeOpacity={0.4} strokeWidth={2} />
          {GRID.map(([x, y], i) => {
            const w = 0.3 + 0.18 * Math.sin(1.4 * t - (x + y) * 0.008);
            return (
              <g key={i} opacity={w}>
                <circle cx={x} cy={y} r={11} fill="none" stroke={C.spr} strokeWidth={2} />
                <path d={`M${x - 7},${y - 7} L${x + 7},${y + 7} M${x + 7},${y - 7} L${x - 7},${y + 7}`} stroke={C.spr} strokeWidth={2} />
              </g>
            );
          })}
        </g>
        <Label x={1540} y={215} size={28} color={C.spr} opacity={regOp}>
          medan B ⊗ (masuk layar)
        </Label>

        {/* ===== fase 1 ===== */}
        <g opacity={m1}>
          <Charge x={400} y={330 + 3 * Math.sin(2 * t)} sign={1} op={still} />
          <Label x={400} y={392} size={26} color={C.muted} opacity={still}>
            diam: v = 0 → F = 0
          </Label>
          <Gun x={700} y={760} op={slot(t, tM - 1.2, tM + 1.6, 0.6, 0.8)} />
          <Ripple x={start0[0]} y={start0[1]} p={ramp(t, tM, tM + 1.2, (x) => x)} r={90} color="heat" />
          <path d={circFrom(start0, R0, 1)} fill="none" stroke={C.heat} strokeWidth={2} strokeDasharray="6 10" opacity={0.35 * ramp(t, tM + 2, tM + 4) * mOp} />
          <Glow x={o0.cx} y={o0.cy} r={200} color="force" opacity={0.25 * fOp * mOp} />
          <circle cx={o0.cx} cy={o0.cy} r={6} fill={C.force} opacity={0.7 * fOp * mOp} />
          {mOp > 0.001 ? (
            <g opacity={mOp}>
              <Arrow x1={o0.x + 24 * o0.vx} y1={o0.y + 24 * o0.vy} x2={o0.x + 140 * o0.vx} y2={o0.y + 140 * o0.vy} color="work" width={6} opacity={vOp} />
              <Label x={o0.x + 172 * o0.vx} y={o0.y + 172 * o0.vy} size={34} color={C.work} font="serif" italic opacity={vOp}>
                v
              </Label>
              <Arrow x1={o0.x + 26 * fx} y1={o0.y + 26 * fy} x2={o0.x + 125 * fx} y2={o0.y + 125 * fy} color="force" width={6} opacity={fOp} />
              <Label x={o0.x + 156 * fx} y={o0.y + 156 * fy} size={34} color={C.force} font="serif" italic opacity={fOp}>
                F
              </Label>
              <path
                d={`M${o0.x + 30 * o0.vx},${o0.y + 30 * o0.vy} L${o0.x + 30 * o0.vx + 30 * fx},${o0.y + 30 * o0.vy + 30 * fy} L${o0.x + 30 * fx},${o0.y + 30 * fy}`}
                fill="none"
                stroke={C.ink}
                strokeWidth={2.5}
                opacity={perpOp * 0.9}
              />
              <Charge x={o0.x} y={o0.y} sign={1} trail={trail0} />
            </g>
          ) : null}
        </g>

        {/* panel kelajuan & arah (baris 2) */}
        {dials > 0.001 ? (
          <g opacity={dials}>
            <path d="M1320,660 A100,100 0 0 1 1520,660" fill="none" stroke={C.line} strokeWidth={14} strokeLinecap="round" />
            <path d="M1320,660 A100,100 0 0 1 1478,580" fill="none" stroke={C.work} strokeWidth={14} strokeLinecap="round" opacity={0.85} />
            <line x1={1420} y1={660} x2={1420 + 82 * Math.cos(-0.65)} y2={660 + 82 * Math.sin(-0.65)} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
            <circle cx={1420} cy={660} r={9} fill={C.ink} />
            <Label x={1420} y={712} size={26} color={C.muted}>
              kelajuan |v|
            </Label>
            <Label x={1420} y={752} size={30} color={C.work} weight={600}>
              tetap
            </Label>
            <circle cx={1680} cy={630} r={78} fill="none" stroke={C.line} strokeWidth={3} />
            <Arrow x1={1680} y1={630} x2={1680 + 62 * o0.vx} y2={630 + 62 * o0.vy} color="work" width={6} pulse={false} />
            <Label x={1680} y={738} size={26} color={C.muted}>
              arah v
            </Label>
            <Label x={1680} y={776} size={30} color={C.force} weight={600}>
              berubah
            </Label>
          </g>
        ) : null}

        {/* ===== fase 2: m dan 2m ===== */}
        {p2 > 0.001 ? (
          <g opacity={p2}>
            {[
              {o: heavyO, R: 300, r: 18, lab: '2m'},
              {o: lightO, R: 150, r: 11, lab: 'm'},
            ].map(({o, R, r, lab}) => (
              <g key={lab}>
                <path d={circFrom(st3, R, 1)} fill="none" stroke={C.heat} strokeWidth={2.4} opacity={0.5 * in3} pathLength={1000} strokeDasharray="1000 1000" strokeDashoffset={1000 * (1 - Math.min(1, s3 / (2 * Math.PI * R)))} />
                <line x1={o.cx} y1={o.cy} x2={o.x} y2={o.y} stroke={C.ink} strokeWidth={2} strokeDasharray="6 6" opacity={0.5 * in3} />
                <circle cx={o.cx} cy={o.cy} r={4} fill={C.ink} opacity={0.6 * in3} />
                <Charge x={o.x} y={o.y} r={r} sign={1} op={in3} trail={tr(R)} />
                <Label x={o.x} y={o.y - r - 26} size={28} color={C.ink} font="serif" italic opacity={in3}>
                  {lab}
                </Label>
              </g>
            ))}
            <Ripple x={st3[0]} y={st3[1]} p={ramp(t, t3, t3 + 1.2, (x) => x)} r={80} color="heat" />
            <g opacity={legend}>
              <circle cx={1380} cy={600} r={11} fill={C.heat} />
              <Label x={1410} y={600} size={30} anchor="start">
                <tspan fontFamily="Source Serif 4" fontStyle="italic">m</tspan> → jari-jari <tspan fontFamily="Source Serif 4" fontStyle="italic">r</tspan>
              </Label>
              <circle cx={1380} cy={680} r={18} fill={C.heat} />
              <Label x={1410} y={680} size={30} anchor="start">
                <tspan fontFamily="Source Serif 4" fontStyle="italic">2m</tspan> → jari-jari <tspan fontFamily="Source Serif 4" fontStyle="italic">2r</tspan>
              </Label>
              <Label x={1540} y={750} size={24} color={C.muted}>
                (q, v, B sama)
              </Label>
              <Twinkles x={1540} y={640} rx={200} ry={60} n={4} color="heat" opacity={0.7} />
            </g>
          </g>
        ) : null}

        {/* ===== fase 3: + dan − ===== */}
        {p3 > 0.001 ? (
          <g opacity={p3}>
            <Gun x={SP[0] - 10} y={SP[1]} op={slot(t, t4 - 0.9, t4 + 1.2, 0.5, 0.8)} />
            {([1, -1] as const).map((dir) => (
              <g key={dir}>
                <path
                  d={circFrom(SP, R4, dir)}
                  fill="none"
                  stroke={dir > 0 ? C.heat : C.pot}
                  strokeWidth={2.6}
                  opacity={0.55}
                  pathLength={1000}
                  strokeDasharray="1000 1000"
                  strokeDashoffset={1000 * (1 - Math.min(1, parts[0].s / (2 * Math.PI * R4)))}
                />
                {parts.map((pp, j) => {
                  const o = orbit(SP, R4, dir, pp.s);
                  const trail: P[] = Array.from({length: 10}, (_, i) => {
                    const q = orbit(SP, R4, dir, Math.max(0, pp.s - (i + 1) * 0.05 * V4));
                    return [q.x, q.y];
                  });
                  const fx4 = (o.cx - o.x) / R4;
                  const fy4 = (o.cy - o.y) / R4;
                  return (
                    <g key={j}>
                      {j === 0 ? <Arrow x1={o.x + 22 * fx4} y1={o.y + 22 * fy4} x2={o.x + 100 * fx4} y2={o.y + 100 * fy4} color="force" width={5} opacity={pp.op} /> : null}
                      <Charge x={o.x} y={o.y} r={16} sign={dir} op={pp.op} trail={trail} />
                    </g>
                  );
                })}
              </g>
            ))}
            <Ripple x={SP[0]} y={SP[1]} p={ramp(t, t4, t4 + 1.2, (x) => x)} r={90} color="gold" />
            <Label x={SP[0] + R4 + 70} y={SP[1] - R4} size={30} color={C.heat} anchor="start">
              + berbelok ke atas
            </Label>
            <Label x={SP[0] + R4 + 70} y={SP[1] + R4} size={30} color={C.pot} anchor="start">
              − berbelok ke bawah
            </Label>
            {/* panel vektor */}
            <g>
              <rect x={1300} y={300} width={480} height={430} rx={18} fill="#0d1636" stroke={C.line} strokeWidth={2} opacity={0.9} />
              <Label x={1540} y={340} size={26} color={C.muted}>
                v sama, B ⊗ sama
              </Label>
              <Charge x={1380} y={450} r={22} sign={1} />
              <Arrow x1={1410} y1={450} x2={1530} y2={450} color="work" width={6} />
              <Label x={1560} y={450} size={30} color={C.work} font="serif" italic>
                v
              </Label>
              <Arrow x1={1680} y1={500} x2={1680} y2={390} color="force" width={6} />
              <Label x={1715} y={430} size={30} color={C.force} font="serif" italic>
                F
              </Label>
              <Charge x={1380} y={630} r={22} sign={-1} />
              <Arrow x1={1410} y1={630} x2={1530} y2={630} color="work" width={6} />
              <Label x={1560} y={630} size={30} color={C.work} font="serif" italic>
                v
              </Label>
              <Arrow x1={1680} y1={580} x2={1680} y2={690} color="force" width={6} />
              <Label x={1715} y={655} size={30} color={C.force} font="serif" italic>
                F
              </Label>
            </g>
          </g>
        ) : null}

        <Motes x={690} y={530} rx={460} ry={300} n={20} color="spr" opacity={0.3} seed={4} />
      </Stage>

      <Formula x={1540} y={350} p={slot(t, tF - 0.3, cue(3) - 0.1)} accent={C.force} size={70} caption="F ⊥ v  dan  F ⊥ B">
        <V color={C.force}>F</V> = <V>q</V>
        <V color={C.work}>v</V>
        <V color={C.spr}>B</V>
      </Formula>
      <Formula x={1540} y={360} p={slot(t, wordOf(3, 'jari') - 0.4, cue(4) - 0.05)} accent={C.heat} size={70} caption="jari-jari lintasan melingkar">
        <V>r</V> ={' '}
        <Frac
          n={
            <>
              <V>m</V>
              <V color={C.work}>v</V>
            </>
          }
          d={
            <>
              <V>q</V>
              <V color={C.spr}>B</V>
            </>
          }
        />
      </Formula>
    </AbsoluteFill>
  );
};
