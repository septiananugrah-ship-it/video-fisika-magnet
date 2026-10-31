import React from 'react';
import {AbsoluteFill, Img, interpolateColors, staticFile} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, pathOf, ramp, rand} from '../anim';
import {Arrow, Glow, Ripple, Stage, Twinkles, pointAlong} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Judul bernuansa magnet:
//  · atas: pita medan B masuk layar (⊗); muatan + berputar berlawanan jarum jam dan − searah jarum jam
//    (F = qv×B selalu ke pusat, kelajuan tetap) dengan panah v (hijau) & F (kuning);
//  · bawah: magnet batang yang bergoyang pelan; garis medan dihitung langsung (RK2) dari dua kutub
//    sehingga melengkung ulang setiap frame (keluar U, masuk S), butir medan mengalir;
//  · kata "Bergerak": gelombang arus merambat di huruf-hurufnya, warna toska (arus) → ungu (medan).
const fr = (v: number) => ((v % 1) + 1) % 1;
type P = [number, number];
type Pole = {x: number; y: number; q: number};
const bdir = (ps: Pole[], x: number, y: number): P => {
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
const traceB = (ps: Pole[], x0: number, y0: number, steps: number, ds: number, stopR: number): P[] => {
  const pts: P[] = [[x0, y0]];
  let x = x0;
  let y = y0;
  for (let i = 0; i < steps; i++) {
    const [ax, ay] = bdir(ps, x, y);
    const [bx, by] = bdir(ps, x + ax * ds * 0.5, y + ay * ds * 0.5);
    x += bx * ds;
    y += by * ds;
    pts.push([x, y]);
    if (ps.some((c) => c.q < 0 && Math.hypot(x - c.x, y - c.y) < stopR)) break;
    if (y < 680 || y > 1090 || x < 100 || x > 1820) break;
  }
  return pts;
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
      <rect x={-L} y={h * 0.22} width={len} height={h * 0.28} fill="#000" opacity={0.18} />
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

const Charge: React.FC<{x: number; y: number; r: number; s: number}> = ({x, y, r, s}) => (
  <g>
    <circle cx={x} cy={y} r={r * 2.8} fill={`url(#soft-${s > 0 ? 'heat' : 'pot'})`} />
    <circle cx={x} cy={y} r={r} fill={s > 0 ? C.heat : C.pot} stroke={s > 0 ? '#ffc2ca' : '#c8e4ff'} strokeWidth={r * 0.08} />
    <circle cx={x - r * 0.32} cy={y - r * 0.36} r={r * 0.34} fill="#fff" opacity={0.3} />
    <line x1={x - r * 0.45} y1={y} x2={x + r * 0.45} y2={y} stroke="#fff" strokeWidth={r * 0.16} strokeLinecap="round" />
    {s > 0 ? <line x1={x} y1={y - r * 0.45} x2={x} y2={y + r * 0.45} stroke="#fff" strokeWidth={r * 0.16} strokeLinecap="round" /> : null}
  </g>
);

/** Muatan yang berputar dalam medan ⊗: + berlawanan jarum jam, − searah (F = qv×B ke pusat). */
const Orbit: React.FC<{cx: number; cy: number; R: number; s: number; t: number}> = ({cx, cy, R, s, t}) => {
  const w = 1.5;
  const at = (tt: number): P => {
    const ph = -Math.PI / 2 + s * w * tt;
    return [cx + R * Math.cos(ph), cy - R * Math.sin(ph)];
  };
  const [x, y] = at(t);
  const [x2, y2] = at(t + 0.01);
  const vx = x2 - x;
  const vy = y2 - y;
  const vn = Math.hypot(vx, vy) || 1;
  const fx = (cx - x) / R;
  const fy = (cy - y) / R;
  const trail = [1, 2, 3, 4, 5, 6].map((k) => at(t - k * 0.07));
  return (
    <g>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={s > 0 ? C.heat : C.pot} strokeOpacity={0.3} strokeWidth={2} strokeDasharray="4 8" />
      {trail.map(([tx, ty], k) => (
        <circle key={k} cx={tx} cy={ty} r={9 * (1 - k / 7)} fill={s > 0 ? C.heat : C.pot} opacity={0.35 * (1 - k / 6)} />
      ))}
      <Arrow x1={x} y1={y} x2={x + (vx / vn) * 62} y2={y + (vy / vn) * 62} color="work" width={4.5} pulse={false} />
      <Arrow x1={x} y1={y} x2={x + fx * 40} y2={y + fy * 40} color="force" width={4.5} pulse={false} />
      <Charge x={x} y={y} r={14} s={s} />
    </g>
  );
};

const CX = 960;
const CY = 470;
const BY = 128; // pita medan atas
const DY = 880; // magnet bawah

export const Title: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0.2, 1.4);
  const sub = ramp(t, 1.5, 2.5);
  const brand = ramp(t, 2.6, 3.6);
  const out = 1 - ramp(t, dur - 1.0, dur - 0.1, EASE_IN_OUT);
  const push = 1 + 0.035 * ramp(t, -0.8, dur, EASE_IN_OUT);
  const rig = ramp(t, 0.0, 1.2);
  const wave = ramp(t, 3.2, 4.6, EASE_IN_OUT);
  const title = BRAND.title;
  const HL = 'Bergerak';
  const split = title.indexOf(HL);

  // magnet: bergoyang pelan → garis medan dihitung ulang tiap frame
  const rot = 7 * Math.sin(t * 0.8 + 0.4);
  const ra = (rot * Math.PI) / 180;
  const half = 118;
  const ps: Pole[] = [
    {x: CX + half * Math.cos(ra), y: DY + half * Math.sin(ra), q: 1},
    {x: CX - half * Math.cos(ra), y: DY - half * Math.sin(ra), q: -1},
  ];
  const ANG = [-2.6, -2.05, -1.55, -1.1, -0.68, -0.3, 0.3, 0.68, 1.1, 1.55, 2.05, 2.6];
  const lines = ANG.map((an) => traceB(ps, ps[0].x + 24 * Math.cos(an + ra), ps[0].y + 24 * Math.sin(an + ra), 260, 7, 22));

  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 48%'}}>
        <Stage>
          <defs>
            <radialGradient id="ti-fade" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="#fff" stopOpacity={1} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            <mask id="ti-mask">
              <ellipse cx={CX} cy={DY} rx={780} ry={170} fill="url(#ti-fade)" />
            </mask>
            <linearGradient id="ti-band" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff" stopOpacity={0} />
              <stop offset="15%" stopColor="#fff" stopOpacity={1} />
              <stop offset="85%" stopColor="#fff" stopOpacity={1} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <mask id="ti-bmask">
              <rect x={0} y={40} width={1920} height={180} fill="url(#ti-band)" />
            </mask>
          </defs>
          <Glow x={CX} y={CY} r={720} color="spr" opacity={0.2 * a} />
          <Glow x={CX} y={CY} r={520} color="cyan" opacity={0.07 * a} />
          {/* butir medan melayang di latar */}
          {Array.from({length: 18}, (_, i) => {
            const ph = fr(t * (0.05 + rand(i) * 0.05) + rand(i * 3.3));
            const x = 100 + rand(i * 7.7) * 1720 + 24 * Math.sin(t * 0.9 + i);
            const y = 820 - ph * 620;
            const side = Math.abs(x - CX) > 640 ? 1 : 0.25;
            return <circle key={i} cx={x} cy={y} r={2 + rand(i * 2.1) * 2.5} fill={i % 3 === 0 ? C.cyan : C.spr} opacity={0.5 * cyc(ph) * side * a} />;
          })}

          {/* pita medan ⊗ + muatan yang berputar */}
          <g opacity={rig}>
            <g mask="url(#ti-bmask)">
              {Array.from({length: 2 * 22}, (_, k) => {
                const col = k % 22;
                const row = Math.floor(k / 22);
                const x = 120 + col * 80 + (row ? 40 : 0);
                const y = BY - 40 + row * 80;
                const tw = 0.35 + 0.25 * Math.sin(t * 1.6 - col * 0.35 + row);
                return (
                  <g key={k} opacity={tw}>
                    <circle cx={x} cy={y} r={11} fill="none" stroke={C.spr} strokeWidth={2} />
                    <path d={`M${x - 6},${y - 6} L${x + 6},${y + 6} M${x + 6},${y - 6} L${x - 6},${y + 6}`} stroke={C.spr} strokeWidth={2} />
                  </g>
                );
              })}
            </g>
            <Orbit cx={560} cy={BY} R={54} s={1} t={t} />
            <Orbit cx={1360} cy={BY} R={54} s={-1} t={t + 0.6} />
            <text x={1700} y={BY + 10} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={38} fill={C.spr} fontWeight={600}>
              B
            </text>
          </g>

          {/* magnet batang, garis medan hidup */}
          <g opacity={rig}>
            <g mask="url(#ti-mask)">
              {lines.map((pts, k) => (
                <g key={k}>
                  <path d={pathOf(pts)} fill="none" stroke={C.spr} strokeWidth={2.5} opacity={0.55} />
                  {[0, 0.5].map((o) => {
                    const ph = fr(t * 0.3 + o + k * 0.17);
                    const [x, y] = pointAlong(pts, ph);
                    return <circle key={o} cx={x} cy={y} r={4} fill={C.spr} opacity={cyc(ph)} />;
                  })}
                </g>
              ))}
            </g>
            <Glow x={ps[0].x} y={ps[0].y} r={90} color="heat" opacity={0.5} />
            <Glow x={ps[1].x} y={ps[1].y} r={90} color="pot" opacity={0.5} />
            <Magnet x={CX} y={DY} len={300} h={64} rot={rot} />
          </g>

          <Ripple x={CX} y={CY} p={(t - 0.8) / 2.2} r={760} color="spr" rings={2} width={2} />
          <Ripple x={CX} y={CY - 30} p={ramp(t, 3.3, 5.1, (x) => x)} r={520} color="cyan" rings={2} width={2} />
          <Twinkles x={CX} y={CY - 10} rx={620} ry={90} n={7} color="cyan" opacity={ramp(t, 2.2, 3.0)} seed={6} />
        </Stage>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 150}}>
          <div style={{fontFamily: FONT.head, fontSize: 28, letterSpacing: 12, color: C.gold, fontWeight: 600, opacity: a}}>{BRAND.series.toUpperCase()}</div>
          <div style={{display: 'flex', marginTop: 18}}>
            {title.split('').map((ch, i) => {
              const p = ramp(t, 0.5 + i * 0.045, 1.4 + i * 0.045, BACK);
              const hot = i >= split && i < split + HL.length;
              const k = i - split;
              // "Bergerak": gelombang arus merambat ke kanan
              const bob = hot ? 9 * Math.sin(t * 3.2 - k * 0.75) * wave + 3 * Math.sin(t * 1.3 - i * 0.4) * (1 - wave) * ramp(t, 1.8, 2.8) : 4 * Math.sin(t * 1.3 - i * 0.4) * ramp(t, 1.8, 2.8);
              const col = hot ? interpolateColors(0.5 + 0.5 * Math.sin(t * 1.4 - k * 0.5), [0, 1], [C.cyan, '#cfa8ff']) : C.ink;
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: FONT.head,
                    fontWeight: 700,
                    fontSize: 122,
                    letterSpacing: -3,
                    whiteSpace: 'pre',
                    display: 'inline-block',
                    color: col,
                    opacity: Math.min(1, p),
                    translate: `0px ${(1 - p) * 60 + bob}px`,
                    textShadow: hot ? `0 0 ${36 + 14 * Math.sin(t * 2 + i * 0.4)}px ${col}99` : '0 0 40px rgba(170,200,255,0.22)',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div style={{fontFamily: FONT.head, fontSize: 50, color: C.ink, fontWeight: 500, marginTop: 8, opacity: sub, translate: `0px ${(1 - sub) * 16}px`}}>{BRAND.subtitle}</div>
          <div style={{fontFamily: FONT.sans, fontSize: 26, color: C.muted, marginTop: 14, opacity: ramp(t, 2.1, 3.1)}}>{BRAND.course}</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginTop: 34,
              padding: '10px 26px 10px 14px',
              borderRadius: 999,
              border: '1.5px solid rgba(255,201,74,0.38)',
              background: 'rgba(30,22,40,0.55)',
              opacity: brand,
              translate: `0px ${(1 - brand) * 14}px`,
              boxShadow: `0 0 ${24 + 10 * Math.sin(t * 1.8)}px rgba(255,201,74,0.22)`,
            }}
          >
            <Img src={staticFile('scientian-logo.png')} style={{width: 46, height: 46, rotate: `${4 * Math.sin(t * 0.9)}deg`}} />
            <div style={{fontFamily: FONT.head, fontSize: 30, color: C.ink, fontWeight: 500, letterSpacing: 2}}>
              Explore <span style={{color: C.gold, fontWeight: 600}}>Science</span> with Yayan
            </div>
          </div>
          <div style={{fontFamily: FONT.mono, fontSize: 22, color: C.muted, marginTop: 40, opacity: ramp(t, 4.2, 5.2), letterSpacing: 3 + 2 * (1 - ramp(t, 4.2, 5.6))}}>
            muatan yang <span style={{color: C.cyan}}>bergerak</span> → <span style={{color: C.spr}}>medan magnet</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
