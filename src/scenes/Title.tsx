import React from 'react';
import {AbsoluteFill, Img, interpolateColors, staticFile} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, pathOf, ramp, rand} from '../anim';
import {Arrow, Glow, Ripple, Stage, Twinkles, pointAlong} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Judul bernuansa muatan:
//  · atas: kawat tembaga; elektron (biru) hanyut ke kiri di antara inti logam (+) yang bergetar,
//    arus konvensional I (toska) ke kanan;
//  · bawah: muatan + dan − yang saling menarik; garis medan dihitung langsung (RK2) dari medan dua muatan
//    sehingga melengkung ulang setiap frame saat jaraknya "bernapas"; panjang panah gaya ∝ 1/r².
//  · kata "Menyatukan": huruf-hurufnya saling mendekat (tertarik), warnanya bergradasi + (merah) → − (biru).
const fr = (v: number) => ((v % 1) + 1) % 1;

type Q = {x: number; y: number; q: number};
const trace = (qs: Q[], x0: number, y0: number, steps: number, ds: number, stopR: number): [number, number][] => {
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
  }
  return pts;
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

const CX = 960;
const CY = 470;
// kawat atas
const WY = 128;
const WX0 = 230;
const WX1 = 1620;
// dipol bawah
const DY = 880;

export const Title: React.FC = () => {
  const {t, dur} = useScene();
  const a = ramp(t, 0.2, 1.4);
  const sub = ramp(t, 1.5, 2.5);
  const brand = ramp(t, 2.6, 3.6);
  const out = 1 - ramp(t, dur - 1.0, dur - 0.1, EASE_IN_OUT);
  const push = 1 + 0.035 * ramp(t, -0.8, dur, EASE_IN_OUT);
  const rig = ramp(t, 0.0, 1.2);
  const pull = ramp(t, 3.2, 4.8, EASE_IN_OUT);
  const title = BRAND.title;
  const HL = 'Menyatukan';
  const split = title.indexOf(HL);

  // dipol: jarak bernapas
  const sep = 560 + 70 * Math.sin(t * 0.9 + 0.6);
  const qs: Q[] = [
    {x: CX - sep / 2, y: DY, q: 1},
    {x: CX + sep / 2, y: DY, q: -1},
  ];
  const ANG = [-1.25, -0.95, -0.65, -0.35, 0.35, 0.65, 0.95, 1.25, 2.3, -2.3, 2.8, -2.8];
  const lines = ANG.map((an) => trace(qs, qs[0].x + 26 * Math.cos(an), DY + 26 * Math.sin(an), 150, 8, 24));
  const fL = 64 * (560 / sep) ** 2;

  return (
    <AbsoluteFill style={{opacity: out}}>
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 48%'}}>
        <Stage>
          <defs>
            <linearGradient id="ti-wire" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6c08a" />
              <stop offset="45%" stopColor="#b9733a" />
              <stop offset="100%" stopColor="#6d3d1c" />
            </linearGradient>
            <radialGradient id="ti-fade" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="#fff" stopOpacity={1} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </radialGradient>
            <mask id="ti-mask">
              <ellipse cx={CX} cy={DY} rx={760} ry={150} fill="url(#ti-fade)" />
            </mask>
          </defs>
          <Glow x={CX} y={CY} r={720} color="pot" opacity={0.22 * a} />
          <Glow x={CX} y={CY} r={520} color="heat" opacity={0.08 * a} />
          {/* muatan kecil melayang di latar */}
          {Array.from({length: 18}, (_, i) => {
            const ph = fr(t * (0.05 + rand(i) * 0.05) + rand(i * 3.3));
            const x = 100 + rand(i * 7.7) * 1720 + 24 * Math.sin(t * 0.9 + i);
            const y = 820 - ph * 620;
            const side = Math.abs(x - CX) > 640 ? 1 : 0.25;
            const pos = rand(i * 4.4) > 0.5;
            return (
              <g key={i} opacity={0.5 * cyc(ph) * side * a}>
                <circle cx={x} cy={y} r={7} fill={pos ? C.heat : C.pot} opacity={0.5} />
                <path d={pos ? `M${x - 4},${y} h8 M${x},${y - 4} v8` : `M${x - 4},${y} h8`} stroke="#fff" strokeWidth={1.6} />
              </g>
            );
          })}

          {/* kawat dengan elektron hanyut */}
          <g opacity={rig}>
            <rect x={WX0} y={WY - 22} width={WX1 - WX0} height={44} rx={22} fill="url(#ti-wire)" opacity={0.35} />
            <rect x={WX0} y={WY - 22} width={WX1 - WX0} height={44} rx={22} fill="none" stroke="#f0b070" strokeOpacity={0.6} strokeWidth={2} />
            {Array.from({length: 30}, (_, i) => {
              const x = WX0 + 30 + i * ((WX1 - WX0 - 60) / 29);
              return <circle key={i} cx={x + 1.5 * Math.sin(t * 6 + i * 2.3)} cy={WY + 1.5 * Math.sin(t * 5.3 + i * 1.7)} r={5} fill={C.heat} opacity={0.55} />;
            })}
            {Array.from({length: 26}, (_, i) => {
              const ph = fr(-t * 0.06 + i / 26);
              const x = WX0 + 16 + ph * (WX1 - WX0 - 32);
              const y = WY + 11 * Math.sin(i * 2.7 + t * 2.2);
              const edge = Math.min(1, ph * 12, (1 - ph) * 12);
              return (
                <g key={i} opacity={edge}>
                  <circle cx={x} cy={y} r={15} fill="url(#soft-pot)" />
                  <circle cx={x} cy={y} r={5.5} fill={C.pot} />
                  <circle cx={x} cy={y} r={2.4} fill="#fff" opacity={0.85} />
                </g>
              );
            })}
            <Arrow x1={WX1 + 34} y1={WY} x2={WX1 + 150} y2={WY} color="cyan" width={6} />
            <text x={WX1 + 92} y={WY - 30} textAnchor="middle" fontFamily={FONT.serif} fontStyle="italic" fontSize={34} fill={C.cyan}>
              I
            </text>
            <text x={WX0 - 26} y={WY + 9} textAnchor="end" fontFamily={FONT.mono} fontSize={24} fill={C.pot}>
              e⁻ ←
            </text>
          </g>

          {/* dipol: + dan − saling menarik, garis medan hidup */}
          <g opacity={rig}>
            <g mask="url(#ti-mask)">
              {lines.map((pts, k) => (
                <g key={k}>
                  <path d={pathOf(pts)} fill="none" stroke={C.force} strokeWidth={2.5} opacity={0.5} />
                  {[0, 0.5].map((o) => {
                    const ph = fr(t * 0.3 + o + k * 0.17);
                    const [x, y] = pointAlong(pts, ph);
                    return <circle key={o} cx={x} cy={y} r={4} fill={C.force} opacity={cyc(ph)} />;
                  })}
                </g>
              ))}
            </g>
            <Charge x={qs[0].x} y={DY} r={30} s={1} />
            <Charge x={qs[1].x} y={DY} r={30} s={-1} />
            <Arrow x1={qs[0].x + 38} y1={DY} x2={qs[0].x + 38 + fL} y2={DY} color="force" width={6} pulse={false} />
            <Arrow x1={qs[1].x - 38} y1={DY} x2={qs[1].x - 38 - fL} y2={DY} color="force" width={6} pulse={false} />
          </g>

          <Ripple x={CX} y={CY} p={(t - 0.8) / 2.2} r={760} color="pot" rings={2} width={2} />
          <Ripple x={CX} y={CY - 30} p={ramp(t, 3.3, 5.1, (x) => x)} r={520} color="force" rings={2} width={2} />
          <Twinkles x={CX} y={CY - 10} rx={620} ry={90} n={7} color="force" opacity={ramp(t, 2.2, 3.0)} seed={6} />
        </Stage>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 150}}>
          <div style={{fontFamily: FONT.head, fontSize: 28, letterSpacing: 12, color: C.gold, fontWeight: 600, opacity: a}}>{BRAND.series.toUpperCase()}</div>
          <div style={{display: 'flex', marginTop: 18}}>
            {title.split('').map((ch, i) => {
              const p = ramp(t, 0.5 + i * 0.045, 1.4 + i * 0.045, BACK);
              const bob = 4 * Math.sin(t * 1.3 - i * 0.4) * ramp(t, 1.8, 2.8);
              const hot = i >= split && i < split + HL.length;
              const k = i - split;
              const mid = (HL.length - 1) / 2;
              // huruf "Menyatukan" mula-mula renggang lalu saling menarik ke tengah kata
              const gap = hot ? (k - mid) * 3.2 * (1 - pull) : 0;
              const col = hot ? interpolateColors(k / (HL.length - 1), [0, 0.5, 1], [C.heat, '#e7c8ff', C.pot]) : C.ink;
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
                    translate: `${gap}px ${(1 - p) * 60 + bob}px`,
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
            muatan <span style={{color: C.heat}}>+</span> dan <span style={{color: C.pot}}>−</span> saling <span style={{color: C.force}}>menarik</span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
