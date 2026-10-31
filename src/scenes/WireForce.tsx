import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, ramp} from '../anim';
import {Arrow, Formula, Glow, Label, Motes, Ripple, Stage, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Gaya pada kawat berarus (AUDIT): F = BIL = 0,1 T × 5 A × 0,20 m = 0,10 N; kawat sejajar searah tarik, berlawanan tolak.
// Celah magnet: U di atas, S di bawah → B ke bawah. Arus ⊙ keluar layar: F = I L×B = ẑ×(−ŷ) = +x̂ → kawat terdorong ke kanan.
// Arus ⊙ → medan berlawanan jarum jam; ⊗ → searah jarum jam.

const fr = (v: number) => ((v % 1) + 1) % 1;
const deg = (r: number) => (r * 180) / Math.PI;
const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));
const damp = (x: number, w = 5.5, k = 1.9) => (x <= 0 ? 0 : 1 - Math.exp(-k * x) * (Math.cos(w * x) + (k / w) * Math.sin(w * x)));

const Chev: React.FC<{x: number; y: number; ang: number; s?: number; color: string; op?: number}> = ({x, y, ang, s = 9, color, op = 1}) =>
  op <= 0.001 ? null : (
    <path d={`M${-s},${-0.8 * s} L${s},0 L${-s},${0.8 * s} L${-0.4 * s},0 Z`} transform={`translate(${x},${y}) rotate(${ang})`} fill={color} opacity={op} />
  );

/** Kawat dilihat dari ujung, dengan simbol arus (⊙ = 1, ⊗ = −1) dan lingkaran medan beranimasi. */
const EndWire: React.FC<{x: number; y: number; dir: 1 | -1; t: number; fieldOp: number; radii?: number[]}> = ({x, y, dir, t, fieldOp, radii = [55, 95, 140]}) => (
  <g>
    {radii.map((r, k) => {
      const op = fieldOp * 0.85 * Math.pow(55 / r, 0.6);
      return (
        <g key={k}>
          <circle cx={x} cy={y} r={r} fill="none" stroke={C.spr} strokeWidth={2.2} opacity={op} />
          {[0, 1, 2].map((j) => {
            // ⊙: berlawanan jarum jam (φ naik, y = cy − r sin φ); ⊗: searah jarum jam
            const ph = (j / 3) * Math.PI * 2 + k * 0.9 + dir * t * 0.9 * (55 / r);
            const px = x + r * Math.cos(ph);
            const py = y - r * Math.sin(ph);
            const ang = deg(Math.atan2(-dir * Math.cos(ph), -dir * Math.sin(ph)));
            return <Chev key={j} x={px} y={py} ang={ang} s={9} color={C.spr} op={op * 1.1} />;
          })}
        </g>
      );
    })}
    <circle cx={x} cy={y} r={70} fill="url(#soft-cyan)" opacity={0.8} />
    <circle cx={x} cy={y} r={28} fill="url(#wf-cu-r)" stroke="#ffd2a6" strokeWidth={2} />
    <circle cx={x} cy={y} r={13} fill="none" stroke={C.cyan} strokeWidth={3} />
    {dir > 0 ? (
      <circle cx={x} cy={y} r={4.5} fill={C.cyan} />
    ) : (
      <path d={`M${x - 8},${y - 8} L${x + 8},${y + 8} M${x + 8},${y - 8} L${x - 8},${y + 8}`} stroke={C.cyan} strokeWidth={3} />
    )}
  </g>
);

const DX = 108; // vektor kedalaman (miring)
const DY = -72;
const Block: React.FC<{x: number; y: number; w: number; h: number; front: string; top: string; side: string; showTop?: boolean}> = ({x, y, w, h, front, top, side, showTop = true}) => (
  <g>
    {showTop ? <path d={`M${x},${y} L${x + w},${y} L${x + w + DX},${y + DY} L${x + DX},${y + DY} Z`} fill={top} /> : null}
    <path d={`M${x + w},${y} L${x + w + DX},${y + DY} L${x + w + DX},${y + h + DY} L${x + w},${y + h} Z`} fill={side} />
    <rect x={x} y={y} width={w} height={h} fill={front} />
  </g>
);

export const WireForce: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const magOp = Math.min(ramp(t, -0.5, 0.6), 1 - ramp(t, cue(3) - 0.4, cue(3) + 0.4, EASE_IN_OUT));
  const tOn = wordOf(0, 'merasakan') - 0.6;
  const on = ramp(t, tOn - 0.1, tOn + 0.3);
  const jump = 70 * damp(t - tOn);
  const fArrow = ramp(t, tOn + 0.1, tOn + 0.6);
  const G = {x: 700, y: 545};
  const wx = G.x + jump;
  const wy = G.y;
  const tB = wordOf(1, 'besarnya');
  const lOp = ramp(t, wordOf(1, 'panjang') - 0.4, wordOf(1, 'panjang') + 0.3);
  const numOp = ramp(t, cue(2) - 0.1, cue(2) + 0.6);
  const tAns = wordOf(2, 'newton');
  const ans = ramp(t, tAns - 0.8, tAns);
  const cam = 1 + 0.05 * ramp(t, tOn - 0.3, tOn + 2.0, EASE_IN_OUT) * (1 - ramp(t, cue(1), cue(1) + 1.5, EASE_IN_OUT));

  // kawat sejajar
  const parOp = ramp(t, cue(3) - 0.1, cue(3) + 0.7);
  const pA = ramp(t, cue(3) + 0.8, cue(3) + 2.4, EASE_IN_OUT);
  const tOpp = wordOf(3, 'berlawanan');
  const pB = ramp(t, tOpp - 0.3, tOpp + 1.3, EASE_IN_OUT);
  const dA = 250 - 80 * pA + 3 * Math.sin(3 * t) * pA;
  const dB = 250 + 80 * pB + 3 * Math.sin(3 * t + 1) * pB;
  const AC = 555;
  const BC = 1365;
  const PY = 560;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <radialGradient id="wf-cu-r" cx="38%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffd2a6" />
            <stop offset="55%" stopColor="#c47a44" />
            <stop offset="100%" stopColor="#5e3018" />
          </radialGradient>
          <linearGradient id="wf-cu" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0b07a" />
            <stop offset="100%" stopColor="#8a4e2a" />
          </linearGradient>
          <linearGradient id="wf-n" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7a8a" />
            <stop offset="100%" stopColor="#b8283c" />
          </linearGradient>
          <linearGradient id="wf-s" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7cc0ff" />
            <stop offset="100%" stopColor="#1f5fa8" />
          </linearGradient>
          <linearGradient id="wf-fe" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3a4468" />
            <stop offset="100%" stopColor="#59658e" />
          </linearGradient>
        </defs>

        {/* ===================== magnet & kawat ===================== */}
        {magOp > 0.001 ? (
          <g opacity={magOp} transform={`translate(${G.x},${G.y}) scale(${cam}) translate(${-G.x},${-G.y})`}>
            <Glow x={G.x + 60} y={G.y} r={360} color="spr" opacity={0.3} />
            {/* kuk besi */}
            <Block x={380} y={235} w={120} h={620} front="url(#wf-fe)" top="#6b77a0" side="#2a3252" />
            {/* kutub S (bawah) — muka atas tampak sebagai lantai celah */}
            <Block x={500} y={745} w={400} h={110} front="url(#wf-s)" top="#9ccfff" side="#1a4b86" />
            {/* garis medan U → S */}
            {Array.from({length: 7}, (_, i) => {
              const x = 530 + i * 57;
              return (
                <g key={i}>
                  <line x1={x} y1={350} x2={x} y2={740} stroke={C.spr} strokeWidth={2.4} opacity={0.6} />
                  {[0, 1, 2].map((j) => {
                    const ph = fr(t * 0.22 + j / 3 + i * 0.13);
                    return <Chev key={j} x={x} y={360 + ph * 370} ang={90} s={9} color={C.spr} op={cyc(ph) * 0.95} />;
                  })}
                </g>
              );
            })}
            {/* kabel */}
            <path d={`M${wx},${wy + 20} Q950,790 1200,690`} fill="none" stroke="url(#wf-cu)" strokeWidth={6} />
            <path d={`M${wx + DX},${wy + DY} Q1000,390 1200,430`} fill="none" stroke="url(#wf-cu)" strokeWidth={6} />
            {Array.from({length: 5}, (_, j) => {
              const ph = fr(t * 0.4 + j / 5);
              const u = ph;
              // kabel depan: dari baterai (+, bawah) ke kawat
              const x = (1 - u) * (1 - u) * 1200 + 2 * (1 - u) * u * 950 + u * u * wx;
              const y = (1 - u) * (1 - u) * 690 + 2 * (1 - u) * u * 790 + u * u * (wy + 20);
              return <circle key={j} cx={x} cy={y} r={4} fill="#dff8ff" opacity={cyc(ph) * on} />;
            })}
            {Array.from({length: 5}, (_, j) => {
              const u = fr(t * 0.4 + j / 5);
              const x0 = wx + DX;
              const y0 = wy + DY;
              const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * 1000 + u * u * 1200;
              const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * 390 + u * u * 430;
              return <circle key={j} cx={x} cy={y} r={4} fill="#dff8ff" opacity={cyc(u) * on} />;
            })}
            {/* baterai: + (panjang) di bawah */}
            <line x1={1200} y1={430} x2={1200} y2={540} stroke="#c98552" strokeWidth={6} />
            <line x1={1200} y1={580} x2={1200} y2={690} stroke="#c98552" strokeWidth={6} />
            <line x1={1180} y1={540} x2={1220} y2={540} stroke={C.ink} strokeWidth={6} />
            <line x1={1160} y1={580} x2={1240} y2={580} stroke={C.ink} strokeWidth={4} />
            <Label x={1265} y={538} size={24} color={C.muted}>
              −
            </Label>
            <Label x={1265} y={582} size={24} color={C.muted}>
              +
            </Label>
            <Label x={1300} y={640} size={30} color={C.cyan} anchor="start" opacity={numOp}>
              I = 5 A
            </Label>
            {/* posisi awal (bayangan) */}
            <circle cx={G.x} cy={G.y} r={28} fill="none" stroke={C.muted} strokeWidth={2} strokeDasharray="5 6" opacity={0.6 * on} />
            {/* kawat miring (silinder) */}
            <path
              d={`M${wx - 17},${wy - 21} L${wx - 17 + DX},${wy - 21 + DY} A28,28 0 0 1 ${wx + 17 + DX},${wy + 21 + DY} L${wx + 17},${wy + 21} Z`}
              fill="url(#wf-cu)"
              stroke="#5e3018"
              strokeWidth={1.5}
            />
            <circle cx={wx + DX} cy={wy + DY} r={28} fill="#8a4e2a" stroke="#5e3018" strokeWidth={1.5} />
            {Array.from({length: 4}, (_, j) => {
              const ph = fr(t * 0.6 + j / 4);
              return <circle key={j} cx={wx + DX * (1 - ph)} cy={wy + DY * (1 - ph)} r={4.5} fill="#dff8ff" opacity={cyc(ph) * on} />;
            })}
            <EndWire x={wx} y={wy} dir={1} t={t} fieldOp={0.55 * on} radii={[50, 80]} />
            {/* panjang L */}
            <g opacity={lOp}>
              <line x1={wx + 30} y1={wy + 34} x2={wx + 30 + DX} y2={wy + 34 + DY} stroke={C.ink} strokeWidth={2.5} />
              <line x1={wx + 22} y1={wy + 26} x2={wx + 38} y2={wy + 42} stroke={C.ink} strokeWidth={2.5} />
              <line x1={wx + 22 + DX} y1={wy + 26 + DY} x2={wx + 38 + DX} y2={wy + 42 + DY} stroke={C.ink} strokeWidth={2.5} />
              <Label x={wx + 128} y={wy + 24} size={28} anchor="start" font="serif" italic>
                L
              </Label>
              <Label x={wx + 152} y={wy + 26} size={26} anchor="start" opacity={numOp}>
                = 20 cm
              </Label>
            </g>
            {/* kutub U (atas), digambar di depan garis medan */}
            <Block x={500} y={235} w={400} h={110} front="url(#wf-n)" top="#ffa0ac" side="#8a1f30" />
            <Label x={700} y={290} size={52} weight={700}>
              U
            </Label>
            <Label x={700} y={800} size={52} weight={700}>
              S
            </Label>
            <Label x={560} y={420} size={34} color={C.spr} font="serif" italic>
              B
            </Label>
            <Label x={600} y={420} size={26} color={C.spr} anchor="start" opacity={numOp}>
              = 0,1 T
            </Label>
            {/* gaya */}
            <Arrow x1={wx + 40} y1={wy + 70} x2={wx + 40 + 150 * fArrow} y2={wy + 70} color="force" width={7} opacity={fArrow} />
            <Label x={wx + 205} y={wy + 70} size={34} color={C.force} font="serif" italic anchor="start" opacity={fArrow * (1 - ans)}>
              F
            </Label>
            <Label x={wx + 205} y={wy + 70} size={30} color={C.force} weight={600} anchor="start" opacity={ans}>
              F = 0,1 N
            </Label>
            <Ripple x={wx} y={wy} p={ramp(t, tOn + 0.1, tOn + 1.3, (x) => x)} r={130} color="force" />
            <Twinkles x={wx + 270} y={wy + 70} rx={90} ry={30} n={4} color="force" opacity={ans} />
            <Motes x={G.x} y={G.y} rx={360} ry={280} n={18} color="spr" opacity={0.3} seed={5} />
          </g>
        ) : null}

        {/* ===================== kawat sejajar ===================== */}
        {parOp > 0.001 ? (
          <g opacity={parOp}>
            {[
              {cx: AC, d: dA, dirs: [1, 1] as const, sgn: -1, p: pA, head: 'searah → tarik-menarik', op: 1},
              {cx: BC, d: dB, dirs: [1, -1] as const, sgn: 1, p: pB, head: 'berlawanan → tolak-menolak', op: ramp(t, tOpp - 0.6, tOpp)},
            ].map(({cx, d, dirs, sgn, p, head, op}) => (
              <g key={cx} opacity={op}>
                <rect x={cx - 400} y={195} width={800} height={670} rx={22} fill="#0d1636" fillOpacity={0.6} stroke={C.line} strokeWidth={2} />
                <Label x={cx} y={250} size={34} color={C.ink} weight={600}>
                  {head}
                </Label>
                <EndWire x={cx - d / 2} y={PY} dir={dirs[0]} t={t} fieldOp={1} />
                <EndWire x={cx + d / 2} y={PY} dir={dirs[1]} t={t} fieldOp={1} />
                {/* gaya: sgn −1 → ke dalam (tarik), +1 → ke luar (tolak) */}
                <Arrow x1={cx - d / 2 + (sgn < 0 ? 34 : -34)} y1={PY} x2={cx - d / 2 + (sgn < 0 ? 34 + 70 * (0.4 + 0.6 * p) : -34 - 90 * (0.4 + 0.6 * p))} y2={PY} color="force" width={6} pulse={false} />
                <Arrow x1={cx + d / 2 + (sgn < 0 ? -34 : 34)} y1={PY} x2={cx + d / 2 + (sgn < 0 ? -34 - 70 * (0.4 + 0.6 * p) : 34 + 90 * (0.4 + 0.6 * p))} y2={PY} color="force" width={6} pulse={false} />
                <Label x={cx - d / 2} y={PY + 190} size={26} color={C.cyan}>
                  {dirs[0] > 0 ? '⊙ keluar' : '⊗ masuk'}
                </Label>
                <Label x={cx + d / 2} y={PY + 190} size={26} color={C.cyan}>
                  {dirs[1] > 0 ? '⊙ keluar' : '⊗ masuk'}
                </Label>
                <Ripple x={cx} y={PY} p={ramp(t, (sgn < 0 ? cue(3) + 2.2 : tOpp + 1.1), (sgn < 0 ? cue(3) + 3.4 : tOpp + 2.3), (x) => x)} r={140} color="force" />
              </g>
            ))}
          </g>
        ) : null}
      </Stage>

      <Formula x={1470} y={300} p={slot(t, tB - 0.3, cue(2) - 0.05)} accent={C.force} size={74} caption="medan × arus × panjang kawat">
        <V color={C.force}>F</V> = <V color={C.spr}>B</V>
        <V color={C.cyan}>I</V>
        <V>L</V>
      </Formula>
      <Formula x={1470} y={300} p={slot(t, cue(2) - 0.05, cue(3) - 0.1)} accent={C.force} size={56}>
        <V color={C.force}>F</V> = <span style={{color: C.spr}}>0,1 T</span> × <span style={{color: C.cyan}}>5 A</span> × 0,20 m
        <br />= <span style={{color: C.force}}>0,1 N</span>
      </Formula>
    </AbsoluteFill>
  );
};
