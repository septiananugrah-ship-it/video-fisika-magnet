import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, pathOf, ramp, rand, smoothPath, win} from '../anim';
import {Arrow, DrawPath, Glow, Motes, Ripple, Spark, Stage, Stream, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Peta video: tiga kartu bagian dengan ikon yang terus bergerak (dihitung analitik):
// (1) magnet batang bergoyang dengan garis medan yang dihitung langsung (RK2, keluar U masuk S);
// (2) spektrometer massa (ion berbelok dalam B ⊗, dua isotop beda jari-jari) + elektron berspin yang berpresesi;
// (3) kumparan motor berputar di antara kutub U–S + cincin MRI dengan kumparan RF berputar;
// dihubungkan oleh lintasan "kawat" tempat sebutir arus (toska) merambat.
const PARTS = [
  {n: '1', title: 'Konsep', color: C.pot, hue: 'pot' as Hue, items: ['Kutub dan medan', 'Arus menghasilkan medan', 'Gaya Lorentz', 'Gaya pada kawat', 'Induksi elektromagnetik']},
  {n: '2', title: 'Magnet di dunia kimia', color: C.work, hue: 'work' as Hue, items: ['Spektrometer massa', 'Momen magnet & spin', 'Resonansi magnetik inti']},
  {n: '3', title: 'Penerapan', color: C.kin, hue: 'kin' as Hue, items: ['Motor listrik', 'Generator', 'MRI']},
];
const KEYS = [
  ['kutub', 'arus', 'lorentz', 'kawat', 'induksi'],
  ['spektrometer', 'momen', 'resonansi'],
  ['motor', 'generator', 'mri'],
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

type Pole = {x: number; y: number; q: number};
type P = [number, number];
const bdir = (ps: Pole[], x: number, y: number): [number, number] => {
  let bx = 0;
  let by = 0;
  for (const c of ps) {
    const dx = x - c.x;
    const dy = y - c.y;
    const r2 = dx * dx + dy * dy + 1e-3;
    const r3 = r2 * Math.sqrt(r2);
    bx += (c.q * dx) / r3;
    by += (c.q * dy) / r3;
  }
  const m = Math.hypot(bx, by) || 1;
  return [bx / m, by / m];
};
const traceB = (ps: Pole[], x0: number, y0: number, steps: number, ds: number, stopR: number, box: number[]): [number, number][] => {
  const pts: [number, number][] = [[x0, y0]];
  let x = x0;
  let y = y0;
  for (let i = 0; i < steps; i++) {
    const [ax, ay] = bdir(ps, x, y);
    const [bx, by] = bdir(ps, x + ax * ds * 0.5, y + ay * ds * 0.5);
    x += bx * ds;
    y += by * ds;
    pts.push([x, y]);
    if (ps.some((c) => c.q < 0 && Math.hypot(x - c.x, y - c.y) < stopR)) break;
    if (x < box[0] || x > box[1] || y < box[2] || y > box[3]) break;
  }
  return pts;
};

/** Garis yang lolos keluar kotak dicerminkan ke sisi S (simetri dipol: cermin + arah dibalik). */
const withMirror = (lines: [number, number][][], s: Pole, cx: number, cy: number, ang: number, near = 30): [number, number][][] => {
  const ax = Math.cos(ang);
  const ay = Math.sin(ang);
  const extra = lines
    .filter((l) => {
      const [x, y] = l[l.length - 1];
      return Math.hypot(x - s.x, y - s.y) > near;
    })
    .map((l) =>
      l
        .map(([x, y]): P => {
          const d = (x - cx) * ax + (y - cy) * ay;
          return [x - 2 * d * ax, y - 2 * d * ay];
        })
        .reverse(),
    );
  return [...lines, ...extra];
};
const Magnet: React.FC<{x: number; y: number; len: number; h: number; rot: number}> = ({x, y, len, h, rot}) => {
  const r = h * 0.18;
  const L = len / 2;
  const left = `M0,${-h / 2} H${-L + r} Q${-L},${-h / 2} ${-L},${-h / 2 + r} V${h / 2 - r} Q${-L},${h / 2} ${-L + r},${h / 2} H0 Z`;
  const right = `M0,${-h / 2} H${L - r} Q${L},${-h / 2} ${L},${-h / 2 + r} V${h / 2 - r} Q${L},${h / 2} ${L - r},${h / 2} H0 Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={left} fill={C.pot} />
      <path d={right} fill={C.heat} />
      <rect x={-L + r} y={-h / 2 + h * 0.1} width={len - 2 * r} height={h * 0.18} rx={h * 0.09} fill="#fff" opacity={0.25} />
      <rect x={-L} y={-h / 2} width={len} height={h} rx={r} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
      <text x={-L / 2} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={h * 0.55} fill="#fff" transform={`rotate(${-rot} ${-L / 2} 0)`}>
        S
      </text>
      <text x={L / 2} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={h * 0.55} fill="#fff" transform={`rotate(${-rot} ${L / 2} 0)`}>
        U
      </text>
    </g>
  );
};

const Tag: React.FC<{x: number; y: number; color: string; children: React.ReactNode}> = ({x, y, color, children}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={color} opacity={0.92}>
    {children}
  </text>
);

/** Ikon tiap bagian (SVG, selalu bergerak). */
const Icon: React.FC<{i: number; x: number; y: number; t: number; act: number}> = ({i, x, y, t, act}) => {
  if (i === 0) {
    // magnet batang bergoyang; garis medan dihitung ulang (keluar U, masuk S)
    const rot = 10 * Math.sin(t * 1.1);
    const ra = (rot * Math.PI) / 180;
    const ps: Pole[] = [
      {x: x + 78 * Math.cos(ra), y: y + 78 * Math.sin(ra), q: 1},
      {x: x - 78 * Math.cos(ra), y: y - 78 * Math.sin(ra), q: -1},
    ];
    const box = [x - 235, x + 235, y - 105, y + 105];
    const lines = withMirror([-2.5, -1.9, -1.35, -0.85, -0.4, 0, 0.4, 0.85, 1.35, 1.9, 2.5].map((a) => traceB(ps, ps[0].x + 20 * Math.cos(a + ra), ps[0].y + 20 * Math.sin(a + ra), 160, 6, 18, box)), ps[1], x, y, ra);
    return (
      <g>
        <Glow x={x} y={y} r={170} color="spr" opacity={0.25 + 0.3 * act} />
        {lines.map((pts, k) => (
          <g key={k}>
            <path d={pathOf(pts)} fill="none" stroke={C.spr} strokeWidth={2.5} opacity={0.6} />
            {(() => {
              const ph = fr(t * 0.4 + k * 0.23);
              const [px, py] = pointAlong(pts, ph);
              return <circle cx={px} cy={py} r={4.5} fill={C.spr} opacity={cyc(ph)} />;
            })()}
          </g>
        ))}
        <Magnet x={x} y={y} len={190} h={50} rot={rot} />
        <Tag x={x} y={y + 128} color={C.spr}>
          garis medan
        </Tag>
      </g>
    );
  }
  if (i === 1) {
    // spektrometer massa: ion + masuk ke atas dalam B ⊗, berbelok ke kiri (F = qv×B), dua isotop beda jari-jari
    const lx = x - 95;
    const ex = lx + 70;
    const by = y + 72;
    const ax = x + 140;
    const pre = t * 1.6;
    const tipX = ax + 24 * Math.sin(pre);
    const tipY = y - 74 + 6 * Math.cos(pre);
    return (
      <g>
        <Glow x={x} y={y} r={170} color="work" opacity={0.25 + 0.3 * act} />
        <rect x={lx - 140} y={y - 100} width={230} height={172} rx={10} fill={C.spr} opacity={0.07} stroke={C.spr} strokeOpacity={0.35} strokeWidth={1.5} />
        {Array.from({length: 12}, (_, k) => {
          const cx = lx - 112 + (k % 4) * 58;
          const cy = y - 72 + Math.floor(k / 4) * 50;
          return (
            <g key={k} opacity={0.35 + 0.15 * Math.sin(t * 1.5 + k)}>
              <circle cx={cx} cy={cy} r={7} fill="none" stroke={C.spr} strokeWidth={1.5} />
              <path d={`M${cx - 4},${cy - 4} L${cx + 4},${cy + 4} M${cx + 4},${cy - 4} L${cx - 4},${cy + 4}`} stroke={C.spr} strokeWidth={1.5} />
            </g>
          );
        })}
        <rect x={ex - 6} y={by} width={12} height={34} fill="#5d6a8c" />
        <rect x={lx - 150} y={by + 2} width={180} height={10} rx={4} fill={C.force} opacity={0.6} />
        {[56, 78].map((R, k) => {
          const cx = ex - R;
          const arc: [number, number][] = Array.from({length: 25}, (_, j) => {
            const a = (j / 24) * Math.PI;
            return [cx + R * Math.cos(a), by - R * Math.sin(a)];
          });
          const ph = fr(t * 0.45 + k * 0.5);
          const [px, py] = pointAlong(arc, ph);
          const trail = [1, 2, 3, 4].map((j) => pointAlong(arc, Math.max(0, ph - j * 0.03)));
          const hit = fr(t * 0.45 + k * 0.5 + 0.0);
          return (
            <g key={R}>
              <path d={pathOf(arc)} fill="none" stroke={k ? C.kin : C.work} strokeWidth={2} strokeDasharray="5 6" opacity={0.6} />
              <Spark x={px} y={py} r={5.5} color={k ? 'kin' : 'work'} trail={trail} opacity={cyc(ph)} />
              <circle cx={ex - 2 * R} cy={by + 7} r={8 + 6 * Math.sin(Math.PI * hit) ** 8} fill={k ? C.kin : C.work} opacity={0.8} />
            </g>
          );
        })}
        {/* elektron berspin */}
        <ellipse cx={ax} cy={y - 74} rx={24} ry={6} fill="none" stroke={C.gold} strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="3 5" />
        <circle cx={ax} cy={y} r={30} fill={C.pot} />
        {[0, 1, 2].map((k) => {
          const c = Math.cos(t * 3 + (k * Math.PI) / 3);
          return <ellipse key={k} cx={ax} cy={y} rx={Math.abs(c) * 30 + 0.5} ry={30} fill="none" stroke="#dff0ff" strokeOpacity={0.2 + 0.3 * Math.max(0, Math.sin(t * 3 + (k * Math.PI) / 3))} strokeWidth={1.5} />;
        })}
        <circle cx={ax - 9} cy={y - 11} r={9} fill="#fff" opacity={0.35} />
        <Arrow x1={ax} y1={y + 6} x2={tipX} y2={tipY} color="gold" width={5} pulse={false} />
        <Tag x={lx - 30} y={y + 128} color={C.work}>
          spektrometer
        </Tag>
        <Tag x={ax} y={y + 128} color={C.work}>
          spin
        </Tag>
      </g>
    );
  }
  // motor: kumparan berputar di antara kutub U–S; MRI: cincin magnet dengan kumparan RF berputar
  const mx = x - 95;
  const w = t * 2.2;
  const hw = 50 * Math.cos(w);
  const gx = x + 145;
  const coil: [number, number][] = [
    [mx - hw, y + 48],
    [mx - hw, y - 48],
    [mx + hw, y - 48],
    [mx + hw, y + 48],
    [mx - hw, y + 48],
  ];
  return (
    <g>
      <Glow x={x} y={y} r={170} color="kin" opacity={0.25 + 0.3 * act} />
      {[-30, -10, 10, 30].map((dy, k) => {
        const pts: [number, number][] = [
          [mx - 88, y + dy],
          [mx + 88, y + dy],
        ];
        const ph = fr(t * 0.5 + k * 0.27);
        const [px, py] = pointAlong(pts, ph);
        return (
          <g key={k}>
            <line x1={mx - 88} y1={y + dy} x2={mx + 88} y2={y + dy} stroke={C.spr} strokeWidth={1.8} opacity={0.4} />
            <circle cx={px} cy={py} r={3.5} fill={C.spr} opacity={cyc(ph)} />
          </g>
        );
      })}
      <path d={`M${mx - 140},${y - 70} H${mx - 96} Q${mx - 80},${y} ${mx - 96},${y + 70} H${mx - 140} Z`} fill={C.heat} />
      <path d={`M${mx + 140},${y - 70} H${mx + 96} Q${mx + 80},${y} ${mx + 96},${y + 70} H${mx + 140} Z`} fill={C.pot} />
      <text x={mx - 120} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={26} fill="#fff">
        U
      </text>
      <text x={mx + 120} y={y + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={26} fill="#fff">
        S
      </text>
      <line x1={mx} y1={y - 78} x2={mx} y2={y + 92} stroke="#8a96b8" strokeWidth={4} />
      <path d={pathOf(coil)} fill="none" stroke="#e09a5a" strokeWidth={6} strokeLinejoin="round" opacity={0.6 + 0.4 * Math.abs(Math.cos(w))} />
      {Array.from({length: 6}, (_, k) => {
        const ph = fr(t * 0.5 + k / 6);
        const [px, py] = pointAlong(coil, ph);
        return <circle key={k} cx={px} cy={py} r={4.5} fill={C.cyan} opacity={0.4 + 0.6 * Math.abs(Math.cos(w))} />;
      })}
      {/* MRI */}
      <circle cx={gx} cy={y} r={80} fill="#c3cde3" opacity={0.9} />
      <circle cx={gx} cy={y} r={44} fill="#0d1838" />
      <circle cx={gx} cy={y} r={62} fill="none" stroke={C.cyan} strokeWidth={8} strokeDasharray="60 330" strokeDashoffset={-t * 120} opacity={0.8} />
      <circle cx={gx} cy={y} r={14} fill="none" stroke={C.spr} strokeWidth={2.5} />
      <circle cx={gx} cy={y} r={3.5} fill={C.spr} />
      <circle cx={gx} cy={y} r={30 + 6 * Math.sin(t * 3)} fill="none" stroke={C.spr} strokeOpacity={0.3} strokeWidth={1.5} />
      <Tag x={mx} y={y + 128} color={C.kin}>
        motor
      </Tag>
      <Tag x={gx} y={y + 128} color={C.kin}>
        MRI
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
  const imp = ramp(t, wordOf(0, 'kemagnetan') - 0.2, wordOf(0, 'kemagnetan') + 0.6);
  const three = ramp(t, wordOf(0, 'tiga') - 0.2, wordOf(0, 'tiga') + 0.6);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT.head, fontSize: 50, fontWeight: 700, color: C.ink, opacity: head, translate: `0px ${(1 - head) * 14}px`}}>
        Peta perjalanan: <span style={{color: C.spr, opacity: 0.35 + 0.65 * imp}}>kemagnetan</span> <span style={{color: C.muted, opacity: 0.35 + 0.65 * three}}>dalam tiga bagian</span>
      </div>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={36} color="spr" opacity={0.4} seed={11} />
        {/* simbol medan ⊙ samar yang melayang di latar */}
        {Array.from({length: 18}, (_, k) => {
          const ph = fr(t * (0.05 + rand(k) * 0.05) + rand(k * 3.1));
          const x = 60 + rand(k * 5.3) * 1800 + 18 * Math.sin(t * 0.8 + k);
          const y = 900 - ph * 760;
          return (
            <g key={k} opacity={0.35 * cyc(ph) * head}>
              <circle cx={x} cy={y} r={8} fill="none" stroke={C.spr} strokeWidth={1.5} />
              <circle cx={x} cy={y} r={2.2} fill={C.spr} />
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
            <div style={{height: 212}} />
            <div>
              {p.items.map((it, k) => {
                const q = ramp(t, itemAt(i, k), itemAt(i, k) + 0.6);
                return (
                  <div key={it} style={{fontSize: 27, color: C.muted, lineHeight: i === 0 ? 1.55 : 1.7, opacity: q, translate: `${(1 - q) * 14}px 0px`, whiteSpace: 'nowrap'}}>
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
