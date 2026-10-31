import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, pathOf, ramp, rand, smoothPath, win} from '../anim';
import {DrawPath, Glow, Motes, Ripple, Spark, Stage, Stream, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C, FONT, type Hue} from '../theme';

// Peta video: tiga kartu bagian dengan ikon yang terus bergerak (dihitung analitik):
// (1) muatan + dan − dengan garis medan yang dihitung langsung (RK2) — jaraknya bernapas, garis melengkung ulang;
// (2) kisi ion Na⁺/Cl⁻ yang bergetar + atom (elektron mengorbit inti);
// (3) petir yang menyambar berkala, baterai yang mendorong elektron, gel elektroforesis (pita pendek lebih cepat ke kutub +);
// dihubungkan oleh lintasan "kawat" tempat sebutir arus (toska) merambat.
const PARTS = [
  {n: '1', title: 'Konsep', color: C.pot, hue: 'pot' as Hue, items: ['Muatan', 'Hukum Coulomb', 'Medan listrik', 'Potensial', 'Kapasitor', 'Arus dan hambatan', 'Rangkaian']},
  {n: '2', title: 'Listrik di dunia kimia', color: C.work, hue: 'work' as Hue, items: ['Ikatan ion', 'Atom hidrogen', 'Elektronvolt', 'Elektrolisis']},
  {n: '3', title: 'Penerapan', color: C.kin, hue: 'kin' as Hue, items: ['Petir', 'Baterai', 'Elektroforesis']},
];
const KEYS = [
  ['muatan', 'coulomb', 'medan', 'potensial', 'kapasitor', 'arus', 'rangkaian'],
  ['ion', 'hidrogen', 'elektronvolt', 'elektrolisis'],
  ['petir', 'baterai', 'elektroforesis'],
];
const CX = [380, 960, 1540];
const TOP = 196;
const CW = 500;
const CH = 600;
const PY = TOP + CH + 40;
const ICON_Y = TOP + 196;

const X0P = CX[0] - 200;
const X1P = CX[2] + 200;
const PTS: [number, number][] = Array.from({length: 61}, (_, i) => {
  const u = i / 60;
  const x = X0P + (X1P - X0P) * u;
  const y = PY + 9 * (1 - Math.cos(((x - CX[0]) / (CX[1] - CX[0])) * Math.PI * 2)) * (x > CX[0] && x < CX[2] ? 1 : 0.3);
  return [x, y];
});
const PTS_D = smoothPath(PTS);
const UX = CX.map((x) => (x - X0P) / (X1P - X0P));

const fr = (v: number) => ((v % 1) + 1) % 1;

type Q = {x: number; y: number; q: number};
const trace = (qs: Q[], x0: number, y0: number, steps: number, ds: number, stopR: number, box: number[]): [number, number][] => {
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
    return [ex / m, ey / m];
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
    if (qs.some((c) => c.q < 0 && Math.hypot(x - c.x, y - c.y) < stopR)) break;
    if (x < box[0] || x > box[1] || y < box[2] || y > box[3]) break;
  }
  return pts;
};

const Charge: React.FC<{x: number; y: number; r: number; s: number}> = ({x, y, r, s}) => (
  <g>
    <circle cx={x} cy={y} r={r * 2.6} fill={`url(#soft-${s > 0 ? 'heat' : 'pot'})`} />
    <circle cx={x} cy={y} r={r} fill={s > 0 ? C.heat : C.pot} stroke={s > 0 ? '#ffc2ca' : '#c8e4ff'} strokeWidth={r * 0.08} />
    <circle cx={x - r * 0.32} cy={y - r * 0.36} r={r * 0.34} fill="#fff" opacity={0.3} />
    <line x1={x - r * 0.45} y1={y} x2={x + r * 0.45} y2={y} stroke="#fff" strokeWidth={r * 0.16} strokeLinecap="round" />
    {s > 0 ? <line x1={x} y1={y - r * 0.45} x2={x} y2={y + r * 0.45} stroke="#fff" strokeWidth={r * 0.16} strokeLinecap="round" /> : null}
  </g>
);

const Tag: React.FC<{x: number; y: number; color: string; children: React.ReactNode}> = ({x, y, color, children}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={color} opacity={0.92}>
    {children}
  </text>
);

/** Ikon tiap bagian (SVG, selalu bergerak). */
const Icon: React.FC<{i: number; x: number; y: number; t: number; act: number}> = ({i, x, y, t, act}) => {
  if (i === 0) {
    const sep = 190 + 30 * Math.sin(t * 1.1);
    const qs: Q[] = [
      {x: x - sep / 2, y, q: 1},
      {x: x + sep / 2, y, q: -1},
    ];
    const box = [x - 235, x + 235, y - 100, y + 100];
    const lines = [-1.3, -0.85, -0.42, 0, 0.42, 0.85, 1.3, 2.2, -2.2, Math.PI].map((a) => trace(qs, qs[0].x + 22 * Math.cos(a), y + 22 * Math.sin(a), 90, 7, 20, box));
    return (
      <g>
        <Glow x={x} y={y} r={170} color="pot" opacity={0.25 + 0.3 * act} />
        {lines.map((pts, k) => (
          <g key={k}>
            <path d={pathOf(pts)} fill="none" stroke={C.force} strokeWidth={2.5} opacity={0.55} />
            {(() => {
              const ph = fr(t * 0.4 + k * 0.23);
              const [px, py] = pointAlong(pts, ph);
              return <circle cx={px} cy={py} r={4.5} fill={C.force} opacity={cyc(ph)} />;
            })()}
          </g>
        ))}
        <Charge x={qs[0].x} y={y} r={26} s={1} />
        <Charge x={qs[1].x} y={y} r={26} s={-1} />
        <Tag x={x} y={y + 128} color={C.force}>
          garis medan
        </Tag>
      </g>
    );
  }
  if (i === 1) {
    const lx = x - 130;
    const ax = x + 125;
    const ea = t * 1.8;
    const rot = (u: number, v: number): [number, number] => [ax + u * Math.cos(-0.4) - v * Math.sin(-0.4), y + u * Math.sin(-0.4) + v * Math.cos(-0.4)];
    const [ex, ey] = rot(78 * Math.cos(ea), 32 * Math.sin(ea));
    const trail = [1, 2, 3, 4].map((k) => rot(78 * Math.cos(ea - k * 0.1), 32 * Math.sin(ea - k * 0.1)));
    return (
      <g>
        <Glow x={x} y={y} r={170} color="work" opacity={0.25 + 0.3 * act} />
        {Array.from({length: 12}, (_, k) => {
          const c = k % 4;
          const r = Math.floor(k / 4);
          const na = (c + r) % 2 === 0;
          const px = lx - 81 + c * 54 + 2.5 * Math.sin(t * 4.1 + k * 1.9);
          const py = y - 56 + r * 56 + 2.5 * Math.sin(t * 3.7 + k * 2.7);
          return (
            <g key={k}>
              <circle cx={px} cy={py} r={na ? 13 : 21} fill={na ? ATOM.Na.fill : ATOM.Cl.fill} stroke="#fff" strokeOpacity={0.4} strokeWidth={1.5} />
              <text x={px} y={py + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={na ? 16 : 22} fill="#0b1430">
                {na ? '+' : '−'}
              </text>
            </g>
          );
        })}
        <ellipse cx={ax} cy={y} rx={78} ry={32} fill="none" stroke={C.pot} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="5 7" transform={`rotate(${(-0.4 * 180) / Math.PI} ${ax} ${y})`} />
        <Charge x={ax} y={y} r={15} s={1} />
        <Spark x={ex} y={ey} r={6.5} color="pot" trail={trail} />
        <Tag x={lx} y={y + 128} color={C.work}>
          kisi ion
        </Tag>
        <Tag x={ax} y={y + 128} color={C.work}>
          atom
        </Tag>
      </g>
    );
  }
  // petir + baterai + gel
  const bx = x - 160;
  const ph = fr(t * 0.42);
  const flash = ph < 0.35 ? cyc(ph / 0.35) : 0;
  const boltPts: [number, number][] = [
    [bx - 4, y - 50],
    [bx + 18, y - 8],
    [bx - 8, y + 4],
    [bx + 16, y + 46],
    [bx - 4, y + 58],
    [bx + 14, y + 100],
  ];
  const vx = x;
  const gx = x + 160;
  const bands = [0.85, 0.55, 0.35];
  return (
    <g>
      <Glow x={x} y={y} r={170} color="kin" opacity={0.25 + 0.3 * act} />
      {/* awan + petir */}
      <circle cx={bx} cy={y - 50} r={70} fill="url(#soft-force)" opacity={flash} />
      {[
        [-36, -66, 30],
        [0, -82, 40],
        [36, -68, 32],
        [-10, -54, 32],
        [24, -52, 28],
      ].map(([dx, dy, r], k) => (
        <circle key={k} cx={bx + dx + 3 * Math.sin(t * 0.7)} cy={y + dy} r={r} fill={k < 3 ? '#3a4672' : '#2a3460'} />
      ))}
      <path d={pathOf(boltPts)} fill="none" stroke={C.force} strokeWidth={14} strokeOpacity={0.2 * flash} strokeLinejoin="round" />
      <path d={pathOf(boltPts)} fill="none" stroke={C.force} strokeWidth={5} opacity={flash} strokeLinejoin="round" />
      <path d={pathOf(boltPts)} fill="none" stroke="#fff" strokeWidth={2} opacity={flash} strokeLinejoin="round" />
      {/* baterai: elektron keluar dari −, kembali ke + */}
      {(() => {
        const loop: [number, number][] = [
          [vx + 4, y + 66],
          [vx + 4, y + 84],
          [vx + 58, y + 84],
          [vx + 58, y - 84],
          [vx + 4, y - 84],
          [vx + 4, y - 66],
        ];
        return (
          <g>
            <path d={pathOf(loop)} fill="none" stroke="#b77a3c" strokeWidth={5} strokeLinejoin="round" />
            {Array.from({length: 7}, (_, k) => {
              const u = fr(t * 0.32 + k / 7);
              const [ex, ey] = pointAlong(loop, u);
              return <circle key={k} cx={ex} cy={ey} r={5} fill={C.pot} opacity={cyc(u)} />;
            })}
            <rect x={vx - 40} y={y - 78} width={30} height={10} rx={3} fill="#c8cfe6" transform={`translate(${16} 0)`} />
            <rect x={vx - 32} y={y - 68} width={64} height={136} rx={12} fill="#2b3762" stroke="#a9b4d8" strokeWidth={3} />
            <rect x={vx - 26} y={y - 62 + 124 * (1 - (0.65 + 0.15 * Math.sin(t * 1.2)))} width={52} height={124 * (0.65 + 0.15 * Math.sin(t * 1.2))} rx={8} fill={C.work} opacity={0.55} />
            <text x={vx} y={y - 38} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={30} fill="#fff">
              +
            </text>
            <text x={vx} y={y + 42} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={32} fill="#fff">
              −
            </text>
          </g>
        );
      })()}
      {/* gel elektroforesis: DNA (−) bergerak ke kutub + di bawah */}
      <rect x={gx - 44} y={y - 92} width={88} height={190} rx={8} fill="#1d3a5a" stroke="#8fc6e8" strokeOpacity={0.7} strokeWidth={2.5} />
      {[0, 1].map((k) => (
        <rect key={k} x={gx - 34 + k * 40} y={y - 84} width={28} height={8} rx={2} fill="#0b1430" />
      ))}
      {[0, 1].map((lane) =>
        bands.map((sp, b) => {
          const p = fr(t * 0.12 * sp + lane * 0.13 + b * 0.05);
          return <rect key={`${lane}-${b}`} x={gx - 34 + lane * 40} y={y - 74 + p * 160} width={28} height={6} rx={2} fill="#9ef0ff" opacity={cyc(p) * 0.9} />;
        }),
      )}
      <text x={gx + 60} y={y - 80} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={28} fill={C.pot}>
        −
      </text>
      <text x={gx + 60} y={y + 86} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={28} fill={C.heat}>
        +
      </text>
      <Tag x={bx} y={y + 128} color={C.kin}>
        petir
      </Tag>
      <Tag x={vx + 10} y={y + 128} color={C.kin}>
        baterai
      </Tag>
      <Tag x={gx} y={y + 128} color={C.kin}>
        gel
      </Tag>
    </g>
  );
};

export const Roadmap: React.FC = () => {
  const {t, cue, dur, wordOf} = useScene();
  const head = ramp(t, 0, 0.8);
  const ps = [ramp(t, cue(1) - 0.2, cue(1) + 0.7, BACK), ramp(t, cue(2) - 0.2, cue(2) + 0.7, BACK), ramp(t, cue(3) - 0.2, cue(3) + 0.7, BACK)];
  const act = [win(t, cue(1) - 0.2, cue(2) - 0.3, 0.6, 0.8), win(t, cue(2) - 0.2, cue(3) - 0.3, 0.6, 0.8), win(t, cue(3) - 0.2, dur, 0.6, 0.8)];
  const pathP =
    UX[0] * ramp(t, 0.6, cue(1), EASE_IN_OUT) +
    (UX[1] - UX[0]) * ramp(t, cue(2) - 0.6, cue(2) + 0.6, EASE_IN_OUT) +
    (UX[2] - UX[1]) * ramp(t, cue(3) - 0.6, cue(3) + 0.6, EASE_IN_OUT) +
    (1 - UX[2]) * ramp(t, cue(3) + 0.6, cue(3) + 2.2, EASE_IN_OUT);
  const [lx, ly] = pointAlong(PTS, pathP);
  const lead: [number, number][] = [1, 2, 3, 4, 5].map((k) => pointAlong(PTS, Math.max(0, pathP - k * 0.008)));
  const loop = ramp(t, cue(3) + 1.6, cue(3) + 2.6);
  const ghost = win(t, 0.4, cue(3) + 0.6, 0.8, 0.8);
  const itemAt = (i: number, k: number) => wordOf(i + 1, KEYS[i][k]) - 0.15;
  const imp = ramp(t, wordOf(0, 'listrik') - 0.2, wordOf(0, 'listrik') + 0.6);
  const three = ramp(t, wordOf(0, 'tiga') - 0.2, wordOf(0, 'tiga') + 0.6);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT.head, fontSize: 50, fontWeight: 700, color: C.ink, opacity: head, translate: `0px ${(1 - head) * 14}px`}}>
        Peta perjalanan: <span style={{color: C.cyan, opacity: 0.35 + 0.65 * imp}}>listrik</span> <span style={{color: C.muted, opacity: 0.35 + 0.65 * three}}>dalam tiga bagian</span>
      </div>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={36} color="pot" opacity={0.4} seed={11} />
        {/* muatan samar yang melayang di latar */}
        {Array.from({length: 18}, (_, k) => {
          const ph = fr(t * (0.05 + rand(k) * 0.05) + rand(k * 3.1));
          const x = 60 + rand(k * 5.3) * 1800 + 18 * Math.sin(t * 0.8 + k);
          const y = 900 - ph * 760;
          const pos = k % 2 === 0;
          return (
            <g key={k} opacity={0.35 * cyc(ph) * head}>
              <circle cx={x} cy={y} r={6} fill={pos ? C.heat : C.pot} opacity={0.6} />
              <path d={pos ? `M${x - 3.5},${y} h7 M${x},${y - 3.5} v7` : `M${x - 3.5},${y} h7`} stroke="#fff" strokeWidth={1.5} />
            </g>
          );
        })}
        {PARTS.map((p, i) => (
          <rect
            key={`gh${i}`}
            x={CX[i] - CW / 2}
            y={TOP}
            width={CW}
            height={CH}
            rx={24}
            fill="none"
            stroke={p.color}
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeDasharray="10 12"
            strokeDashoffset={-t * 24}
            opacity={ghost * (1 - Math.min(1, ps[i]))}
          />
        ))}
        {PARTS.map((p, i) => (
          <Glow key={`gl${i}`} x={CX[i]} y={TOP + CH / 2} r={420} color={p.hue} opacity={0.35 * act[i]} />
        ))}
        <path d={PTS_D} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" opacity={head} />
        <DrawPath d={PTS_D} p={pathP} stroke="cyan" width={3} halo opacity={0.85} />
        <Spark x={lx} y={ly} r={7} color="cyan" trail={lead} opacity={(1 - loop) * ramp(t, 0.6, 1.0)} />
        <Stream pts={PTS} color="cyan" n={5} speed={0.12} r={5} jitter={2} opacity={loop} />
        {PARTS.map((p, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <Ripple x={CX[i]} y={PY} p={ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 1.4, (x) => x)} r={90} color={p.hue} />
            <circle cx={CX[i]} cy={PY} r={20 + 4 * Math.sin(t * 2.4 + i)} fill={`url(#soft-${p.hue})`} />
            <circle cx={CX[i]} cy={PY} r={11} fill={p.color} />
            <circle cx={CX[i]} cy={PY} r={4.5} fill="#fff" opacity={0.8} />
          </g>
        ))}
      </Stage>
      {PARTS.map((p, i) => {
        const q0 = Math.min(1, ps[i]);
        return (
          <div
            key={p.n}
            style={{
              position: 'absolute',
              left: CX[i] - CW / 2,
              top: TOP,
              width: CW,
              height: CH,
              borderRadius: 24,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.94), rgba(10,16,36,0.94))',
              border: `1.5px solid ${p.color}55`,
              borderTop: `8px solid ${p.color}`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 ${40 + 40 * act[i]}px ${p.color}${Math.round(0x22 + 0x30 * act[i]).toString(16).padStart(2, '0')}`,
              opacity: Math.min(1, ps[i] * 1.3) * (0.35 + 0.65 * q0),
              translate: `0px ${(1 - q0) * 40 - 6 * act[i]}px`,
              scale: String(0.9 + 0.1 * ps[i]),
              fontFamily: FONT.head,
              color: C.ink,
              padding: '22px 34px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(105deg, transparent ${-40 + 150 * q0 - 16}%, rgba(255,230,210,0.12) ${-40 + 150 * q0}%, transparent ${-40 + 150 * q0 + 16}%)`,
              }}
            />
            <div style={{fontFamily: FONT.mono, fontSize: 22, color: p.color, letterSpacing: 4}}>BAGIAN {p.n}</div>
            <div style={{fontSize: i === 1 ? 29 : 31, fontWeight: 700, marginTop: 4, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{p.title}</div>
            <div style={{height: i === 0 ? 196 : 212}} />
            <div>
              {p.items.map((it, k) => {
                const q = ramp(t, itemAt(i, k), itemAt(i, k) + 0.6);
                return (
                  <div key={it} style={{fontSize: i === 0 ? 25 : 27, color: C.muted, lineHeight: i === 0 ? 1.4 : 1.7, opacity: q, translate: `${(1 - q) * 14}px 0px`, whiteSpace: 'nowrap'}}>
                    <span style={{color: p.color, marginRight: 8}}>—</span>
                    {it}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <Stage>
        {PARTS.map((_, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <g transform={`translate(${CX[i]} ${ICON_Y}) scale(0.8) translate(${-CX[i]} ${-ICON_Y})`}>
              <Icon i={i} x={CX[i]} y={ICON_Y} t={t} act={act[i]} />
            </g>
          </g>
        ))}
      </Stage>
    </AbsoluteFill>
  );
};
