import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Glow, Motes, Spark, Stage, Twinkles} from '../components/primitives';
import {BRAND} from '../brand';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

const REFS = [
  'R. A. Serway & J. W. Jewett, Physics for Scientists and Engineers (medan magnet, hukum Faraday)',
  'D. Halliday, R. Resnick & J. Walker, Fundamentals of Physics (gaya Lorentz, induksi, spin)',
  'A. G. Sarojo, Seri Fisika Dasar: Listrik dan Magnet',
  'P. Atkins & J. de Paula, Physical Chemistry (spin elektron, spektroskopi NMR)',
  'CODATA (μ₀, magneton Bohr, rasio giromagnetik proton) · NIST (kelimpahan isotop Cl)',
  'RPS Fisika Umum S1 Kimia UNESA (medan magnet)',
];

// butir yang mengorbit logo (kode warna magnet: kutub U merah, medan B ungu, kutub S biru, arus toska, fluks jingga, spin emas)
const ORBIT: {hue: Hue; ph: number}[] = [
  {hue: 'heat', ph: 0},
  {hue: 'spr', ph: 1.05},
  {hue: 'pot', ph: 2.09},
  {hue: 'cyan', ph: 3.14},
  {hue: 'kin', ph: 4.19},
  {hue: 'gold', ph: 5.24},
];
const OC = {x: 960, y: 188, rx: 190, ry: 48, tilt: -14, sp: 0.5};

const orbitPt = (a: number): [number, number] => {
  const c = Math.cos((OC.tilt * Math.PI) / 180);
  const s = Math.sin((OC.tilt * Math.PI) / 180);
  const ex = OC.rx * Math.cos(a);
  const ey = OC.ry * Math.sin(a);
  return [OC.x + ex * c - ey * s, OC.y + ex * s + ey * c];
};

const fr = (v: number) => ((v % 1) + 1) % 1;

const bez = (p: [number, number][], u: number): [number, number] => {
  const a = (1 - u) ** 3;
  const b = 3 * (1 - u) ** 2 * u;
  const c = 3 * (1 - u) * u * u;
  const d = u ** 3;
  return [a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0], a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1]];
};

/** Motif kiri: magnet batang dengan garis medan hidup (butir ungu mengalir di luar magnet dari U ke S). */
const BarMagnet: React.FC<{x: number; y: number; t: number; opacity: number}> = ({x, y, t, opacity}) => {
  if (opacity <= 0.001) return null;
  const cy = y - 130;
  const xn = x + 45;
  const xs = x + 205;
  const breathe = 1 + 0.05 * Math.sin(t * 1.4);
  const loops: [number, number][][] = [28, 62, 100, -28, -62, -100].map((h0) => {
    const h = h0 * breathe;
    return [
      [xn, cy],
      [xn - 0.6 * Math.abs(h), cy - 1.45 * h],
      [xs + 0.6 * Math.abs(h), cy - 1.45 * h],
      [xs, cy],
    ];
  });
  return (
    <g opacity={opacity}>
      <Glow x={xn} y={cy} r={110} color="heat" opacity={0.4} />
      <Glow x={xs} y={cy} r={110} color="pot" opacity={0.4} />
      {loops.map((p, k) => (
        <g key={k}>
          <path d={`M${p[0].join(',')} C${p[1].join(',')} ${p[2].join(',')} ${p[3].join(',')}`} fill="none" stroke={C.spr} strokeWidth={2.5} strokeOpacity={0.75} strokeDasharray="6 9" strokeDashoffset={-t * 30} />
          {[0, 1].map((j) => {
            const u = fr(t * 0.3 + j / 2 + k * 0.17);
            const [px, py] = bez(p, u);
            return (
              <g key={j} opacity={cyc(u)}>
                <circle cx={px} cy={py} r={9} fill="url(#soft-spr)" />
                <circle cx={px} cy={py} r={3.2} fill={C.spr} />
              </g>
            );
          })}
        </g>
      ))}
      <rect x={xn} y={cy - 22} width={80} height={44} rx={6} fill={C.heat} />
      <rect x={xn + 80} y={cy - 22} width={80} height={44} rx={6} fill={C.pot} />
      <rect x={xn + 6} y={cy - 17} width={148} height={6} rx={3} fill="#fff" opacity={0.25} />
      <text x={xn + 40} y={cy + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={26} fill="#fff">
        U
      </text>
      <text x={xn + 120} y={cy + 2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={26} fill="#fff">
        S
      </text>
      <text x={x + 125} y={y - 22} textAnchor="middle" fontFamily={FONT.mono} fontSize={18} fill={C.spr}>
        medan: keluar U, masuk S
      </text>
      <rect x={x - 6} y={y - 4} width={262} height={10} rx={4} fill="#26305a" stroke="#5b6a9e" strokeWidth={2} />
    </g>
  );
};

/** Motif kanan: muatan + melingkar dalam medan ⊗ (F = qv × B selalu ke pusat, kelajuan tetap). */
const Circler: React.FC<{x: number; y: number; t: number; opacity: number}> = ({x, y, t, opacity}) => {
  if (opacity <= 0.001) return null;
  const cx = x + 125;
  const cy = y - 140;
  const r = 70;
  const w = 1.6;
  const pos = (a: number): [number, number] => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const a = t * w;
  const [px, py] = pos(a);
  const trail = [1, 2, 3, 4, 5, 6].map((k) => pos(a - k * 0.09));
  const vx = -Math.sin(a);
  const vy = -Math.cos(a);
  return (
    <g opacity={opacity}>
      <Glow x={cx} y={cy} r={140} color="spr" opacity={0.3} />
      {Array.from({length: 20}, (_, i) => {
        const gx = x + 20 + (i % 5) * 52;
        const gy = y - 230 + Math.floor(i / 5) * 56;
        const o = 0.35 + 0.15 * Math.sin(t * 1.5 + i);
        return (
          <g key={i} stroke={C.spr} strokeOpacity={o} strokeWidth={2} strokeLinecap="round">
            <line x1={gx - 5} y1={gy - 5} x2={gx + 5} y2={gy + 5} />
            <line x1={gx - 5} y1={gy + 5} x2={gx + 5} y2={gy - 5} />
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.work} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="5 7" />
      <Spark x={px} y={py} r={9} color="heat" trail={trail} />
      <line x1={px} y1={py} x2={px + vx * 46} y2={py + vy * 46} stroke={C.work} strokeWidth={4} markerEnd="url(#arrow-work)" />
      <line x1={px} y1={py} x2={px + (cx - px) * 0.55} y2={py + (cy - py) * 0.55} stroke={C.force} strokeWidth={4} markerEnd="url(#arrow-force)" />
      <text x={px} y={py + 1} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={14} fill="#fff">
        +
      </text>
      <text x={x + 125} y={y - 22} textAnchor="middle" fontFamily={FONT.mono} fontSize={18} fill={C.force}>
        F ⊥ v → lintasan melingkar
      </text>
      <rect x={x - 6} y={y - 4} width={262} height={10} rx={4} fill="#26305a" stroke="#5b6a9e" strokeWidth={2} />
    </g>
  );
};

/** Penutup: logo SCIENTIAN, tagline, nama penyusun, rujukan, dan pil penutup seri (motif magnet). */
export const Outro: React.FC = () => {
  const {t, dur} = useScene();
  const logo = ramp(t, 0.2, 1.6);
  const name = ramp(t, 1.4, 2.4);
  const by = ramp(t, 2.4, 3.4);
  const next = ramp(t, 6, 7);
  const motif = ramp(t, 1.0, 3.0);
  const out = 1 - ramp(t, dur - 1.6, dur - 0.1, EASE_IN_OUT);
  const orbitOn = ramp(t, 0.8, 2.2);
  const pts = ORBIT.map((o) => {
    const a = o.ph + t * OC.sp;
    const trail = [1, 2, 3, 4, 5].map((k) => orbitPt(a - k * 0.07));
    return {o, a, p: orbitPt(a), trail, front: Math.sin(a) > 0};
  });
  const ring = (front: boolean) =>
    pts
      .filter((q) => q.front === front)
      .map((q) => <Spark key={q.o.hue} x={q.p[0]} y={q.p[1]} r={5.25 + 1.25 * Math.sin(q.a)} color={q.o.hue} trail={q.trail} opacity={orbitOn * (0.8 + 0.2 * Math.sin(q.a))} />);
  const ellipseD = (() => {
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const [x, y] = orbitPt((i / 48) * Math.PI * 2);
      d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  })();
  return (
    <AbsoluteFill style={{opacity: out}}>
      <Stage>
        <Glow x={960} y={240} r={440} color="pot" opacity={0.3 * logo} />
        <Glow x={960} y={188} r={200} color="spr" opacity={0.25 * logo} />
        <Motes x={960} y={300} rx={620} ry={260} n={40} color="spr" opacity={0.45 * logo} seed={13} />
        {/* jarum kompas kecil melayang pelan & berayun */}
        {Array.from({length: 24}, (_, k) => {
          const p = ((((t + rand(k * 3.1) * 14) / (10 + 5 * rand(k))) % 1) + 1) % 1;
          const x = 60 + rand(k * 5.3) * 1800 + 10 * Math.sin(t * 0.7 + k);
          const y = 1000 - p * 900;
          const a = rand(k * 2.9) * 360 + 30 * Math.sin(t * 0.5 + k);
          return (
            <g key={k} opacity={cyc(p) * 0.4 * logo} transform={`rotate(${a} ${x} ${y})`}>
              <polygon points={`${x + 11},${y} ${x},${y - 3.5} ${x},${y + 3.5}`} fill={C.heat} />
              <polygon points={`${x - 11},${y} ${x},${y - 3.5} ${x},${y + 3.5}`} fill={C.pot} />
            </g>
          );
        })}
        <path d={ellipseD} fill="none" stroke={C.spr} strokeOpacity={0.18 * orbitOn} strokeWidth={1.5} strokeDasharray="4 10" strokeDashoffset={-t * 14} />
        {ring(false)}
        <BarMagnet x={110} y={860} t={t} opacity={0.85 * motif} />
        <Circler x={1560} y={860} t={t} opacity={0.85 * motif} />
        <Twinkles x={960} y={530} rx={360} ry={30} n={4} color="gold" opacity={by * 0.7} seed={17} />
      </Stage>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 70}}>
        <Img
          src={staticFile('scientian-logo.png')}
          style={{
            width: 230,
            height: 230,
            opacity: logo,
            scale: String((0.85 + 0.15 * logo) * (1 + 0.015 * Math.sin(t * 1.3))),
            rotate: `${(1 - logo) * -20}deg`,
          }}
        />
        <div style={{fontFamily: FONT.head, fontSize: 64, fontWeight: 700, letterSpacing: 16 + 6 * (1 - name), color: C.ink, marginTop: 4, opacity: name, textShadow: `0 0 ${18 + 8 * Math.sin(t * 1.6)}px ${C.cyan}55`}}>{BRAND.channel}</div>
        <div style={{fontFamily: FONT.head, fontSize: 28, color: C.muted, letterSpacing: 3, marginTop: 4, opacity: name}}>
          Explore <span style={{color: C.gold}}>Science</span> with Yayan
        </div>
        <div style={{marginTop: 34, fontFamily: FONT.sans, fontSize: 24, color: C.muted, opacity: by, letterSpacing: 2}}>DISUSUN OLEH</div>
        <div style={{fontFamily: FONT.head, fontSize: 46, fontWeight: 600, color: C.ink, opacity: by, marginTop: 2, translate: `0px ${(1 - by) * 12}px`}}>{BRAND.author}</div>
        <div style={{marginTop: 34, textAlign: 'center'}}>
          <div style={{fontFamily: FONT.mono, fontSize: 18, letterSpacing: 4, color: C.gold, marginBottom: 10, opacity: ramp(t, 3.4, 4.2)}}>RUJUKAN</div>
          {REFS.map((r, i) => {
            const o = ramp(t, 3.7 + i * 0.22, 4.6 + i * 0.22);
            return (
              <div key={r} style={{fontFamily: FONT.sans, fontSize: 21, color: C.muted, lineHeight: 1.55, opacity: o, translate: `0px ${(1 - o) * 10}px`}}>
                {r}
              </div>
            );
          })}
          <div style={{marginTop: 12, fontFamily: FONT.sans, fontSize: 19, color: C.muted, opacity: 0.85 * ramp(t, 5.2, 6.0)}}>
            Ilustrasi skematis · μ₀ = 4π×10⁻⁷ T·m/A · arus konvensional · kaidah tangan kanan
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            fontFamily: FONT.head,
            fontSize: 30,
            color: C.ink,
            opacity: next,
            padding: '10px 28px',
            borderRadius: 999,
            border: `2px solid ${C.spr}`,
            background: 'rgba(10,16,36,0.85)',
            boxShadow: `0 0 ${16 + 12 * (0.5 + 0.5 * Math.sin(t * 2))}px ${C.spr}66`,
            translate: `0px ${(1 - next) * 14}px`,
          }}
        >
          <span style={{color: C.ink}}>{BRAND.next}</span>
        </div>
      </AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
        {ring(true)}
      </svg>
    </AbsoluteFill>
  );
};
