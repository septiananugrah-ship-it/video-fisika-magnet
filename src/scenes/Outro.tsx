import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {EASE_IN_OUT, cyc, ramp, rand} from '../anim';
import {Glow, Motes, Spark, Stage, Twinkles, pointAlong} from '../components/primitives';
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

// butir yang mengorbit logo (warna = kode warna listrik: + merah, − biru, medan kuning, potensial ungu, arus toska, ion hijau)
const ORBIT: {hue: Hue; ph: number}[] = [
  {hue: 'heat', ph: 0},
  {hue: 'force', ph: 1.05},
  {hue: 'pot', ph: 2.09},
  {hue: 'cyan', ph: 3.14},
  {hue: 'spr', ph: 4.19},
  {hue: 'work', ph: 5.24},
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

/** Busur garis medan 2D dari + (kiri) ke − (kanan): lingkaran melalui kedua muatan, tonjolan h (positif = ke atas). */
const fieldArc = (x1: number, x2: number, y0: number, h: number, n = 26): [number, number][] => {
  const a = (x2 - x1) / 2;
  const mx = (x1 + x2) / 2;
  const hh = Math.abs(h);
  const sg = h >= 0 ? 1 : -1;
  const r = (a * a + hh * hh) / (2 * hh);
  const cy = r - hh; // pusat relatif terhadap y0 (ke bawah untuk busur atas)
  const p1 = Math.atan2(-cy, -a);
  let p2 = Math.atan2(-cy, a);
  while (p2 <= p1) p2 += Math.PI * 2;
  return Array.from({length: n + 1}, (_, i) => {
    const f = p1 + ((p2 - p1) * i) / n;
    return [mx + r * Math.cos(f), y0 + sg * (cy + r * Math.sin(f))];
  });
};

/** Motif kiri: pasangan + dan − dengan garis medan hidup (butir kuning mengalir dari + ke −). */
const ChargePair: React.FC<{x: number; y: number; t: number; opacity: number}> = ({x, y, t, opacity}) => {
  if (opacity <= 0.001) return null;
  const cy = y - 130;
  const x1 = x + 40;
  const x2 = x + 210;
  const breathe = 1 + 0.06 * Math.sin(t * 1.4);
  const arcs = [26, 60, 110, -26, -60, -110].map((h) => fieldArc(x1 + 16, x2 - 16, cy, h * breathe));
  return (
    <g opacity={opacity}>
      <Glow x={x1} y={cy} r={110} color="heat" opacity={0.45} />
      <Glow x={x2} y={cy} r={110} color="pot" opacity={0.45} />
      <line x1={x1 + 18} y1={cy} x2={x2 - 18} y2={cy} stroke={C.force} strokeWidth={2} strokeOpacity={0.55} strokeDasharray="6 9" strokeDashoffset={-t * 30} />
      {arcs.map((pts, k) => (
        <g key={k}>
          <polyline points={pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} fill="none" stroke={C.force} strokeWidth={2} strokeOpacity={0.5} strokeDasharray="6 9" strokeDashoffset={-t * 30} />
          {[0, 1].map((j) => {
            const p = fr(t * 0.35 + j / 2 + k * 0.17);
            const [px, py] = pointAlong(pts, p);
            return (
              <g key={j} opacity={cyc(p)}>
                <circle cx={px} cy={py} r={9} fill="url(#soft-force)" />
                <circle cx={px} cy={py} r={3.2} fill={C.force} />
              </g>
            );
          })}
        </g>
      ))}
      {[
        {cx: x1, pos: true},
        {cx: x2, pos: false},
      ].map(({cx, pos}) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={20 + 1.5 * Math.sin(t * 2 + cx)} fill={pos ? C.heat : C.pot} fillOpacity={0.35} stroke={pos ? C.heat : C.pot} strokeWidth={2.5} />
          <line x1={cx - 9} y1={cy} x2={cx + 9} y2={cy} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
          {pos ? <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} stroke="#fff" strokeWidth={3} strokeLinecap="round" /> : null}
        </g>
      ))}
      <text x={x + 125} y={cy + 105} textAnchor="middle" fontFamily={FONT.mono} fontSize={18} fill={C.force}>
        medan: + → −
      </text>
      <rect x={x - 6} y={y - 4} width={262} height={10} rx={4} fill="#26305a" stroke="#5b6a9e" strokeWidth={2} />
    </g>
  );
};

/** Motif kanan: rangkaian kecil (baterai, lampu), elektron biru mengalir − → +, arus toska berlawanan. */
const CIRC = (x: number, y: number): [number, number][] => [
  [x + 30, y - 60],
  [x + 30, y - 220],
  [x + 220, y - 220],
  [x + 220, y - 60],
  [x + 30, y - 60],
];
const Circuit: React.FC<{x: number; y: number; t: number; opacity: number}> = ({x, y, t, opacity}) => {
  if (opacity <= 0.001) return null;
  const loop = CIRC(x, y);
  const lamp = 0.8 + 0.2 * Math.sin(t * 2.6);
  // baterai di sisi bawah (x+125, y−60): pelat panjang (+) kanan, pendek (−) kiri
  const bx = x + 125;
  const by = y - 60;
  // lampu di sisi atas
  const lx = x + 125;
  const ly = y - 220;
  return (
    <g opacity={opacity}>
      <Glow x={lx} y={ly} r={120} color="kin" opacity={0.5 * lamp} />
      <polyline points={loop.map((p) => p.join(',')).join(' ')} fill="none" stroke="#8b9ad0" strokeWidth={3} strokeLinejoin="round" />
      <rect x={bx - 20} y={by - 22} width={40} height={44} fill="#0d1430" />
      <line x1={bx + 9} y1={by - 22} x2={bx + 9} y2={by + 22} stroke={C.heat} strokeWidth={4} />
      <line x1={bx - 9} y1={by - 12} x2={bx - 9} y2={by + 12} stroke={C.pot} strokeWidth={6} />
      <text x={bx + 26} y={by - 30} textAnchor="middle" fontFamily={FONT.head} fontWeight={700} fontSize={18} fill={C.heat}>
        +
      </text>
      <text x={bx - 26} y={by - 30} textAnchor="middle" fontFamily={FONT.head} fontWeight={700} fontSize={18} fill={C.pot}>
        −
      </text>
      <circle cx={lx} cy={ly} r={22} fill="#1a2550" stroke="#dfe7ff" strokeWidth={2.5} />
      <circle cx={lx} cy={ly} r={18} fill={C.kin} opacity={0.6 * lamp} />
      <path d={`M${lx - 12},${ly + 6} L${lx - 6},${ly - 8} L${lx},${ly + 4} L${lx + 6},${ly - 8} L${lx + 12},${ly + 6}`} fill="none" stroke="#fff4d6" strokeWidth={2.2} />
      {/* elektron: keluar dari kutub − (kiri baterai) → kiri → atas → kanan → kembali ke + */}
      {Array.from({length: 10}, (_, i) => {
        const p = fr(t * 0.12 + i / 10);
        // loop dimulai di pojok kiri-bawah; elektron dari − bergerak ke kiri lalu naik: urutan loop terbalik dimulai dari bawah-tengah
        const [ex, ey] = pointAlong([[bx - 22, by], [x + 30, by], [x + 30, y - 220], [x + 220, y - 220], [x + 220, by], [bx + 22, by]], p);
        return (
          <g key={i} opacity={cyc(p)}>
            <circle cx={ex} cy={ey} r={10} fill="url(#soft-pot)" />
            <circle cx={ex} cy={ey} r={4.5} fill={C.pot} />
          </g>
        );
      })}
      <line x1={x + 236} y1={y - 110} x2={x + 236} y2={y - 170} stroke={C.cyan} strokeWidth={3} markerEnd="url(#arrow-cyan)" />
      <text x={x + 125} y={y - 22} textAnchor="middle" fontFamily={FONT.mono} fontSize={18} fill={C.cyan}>
        arus + → − · e⁻ sebaliknya
      </text>
      <rect x={x - 6} y={y - 4} width={262} height={10} rx={4} fill="#26305a" stroke="#5b6a9e" strokeWidth={2} />
    </g>
  );
};

/** Penutup: logo SCIENTIAN, tagline, nama penyusun, rujukan, dan pil penutup seri (motif listrik). */
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
        <Glow x={960} y={188} r={200} color="cyan" opacity={0.25 * logo} />
        <Motes x={960} y={300} rx={620} ry={260} n={40} color="cyan" opacity={0.45 * logo} seed={13} />
        {/* muatan + dan − melayang pelan; pasangan berlawanan saling mendekat sedikit */}
        {Array.from({length: 24}, (_, k) => {
          const p = ((((t + rand(k * 3.1) * 14) / (10 + 5 * rand(k))) % 1) + 1) % 1;
          const pos = k % 2 === 0;
          const x = 60 + rand(k * 5.3) * 1800 + 10 * Math.sin(t * 0.7 + k);
          const y = pos ? 1000 - p * 900 : 100 + p * 900;
          const col = pos ? C.heat : C.pot;
          return (
            <g key={k} opacity={cyc(p) * 0.4 * logo}>
              <circle cx={x} cy={y} r={7} fill="none" stroke={col} strokeWidth={1.6} />
              <line x1={x - 3.5} y1={y} x2={x + 3.5} y2={y} stroke={col} strokeWidth={1.6} />
              {pos ? <line x1={x} y1={y - 3.5} x2={x} y2={y + 3.5} stroke={col} strokeWidth={1.6} /> : null}
            </g>
          );
        })}
        <path d={ellipseD} fill="none" stroke={C.cyan} strokeOpacity={0.18 * orbitOn} strokeWidth={1.5} strokeDasharray="4 10" strokeDashoffset={-t * 14} />
        {ring(false)}
        <ChargePair x={110} y={860} t={t} opacity={0.85 * motif} />
        <Circuit x={1560} y={860} t={t} opacity={0.85 * motif} />
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
            border: `2px solid ${C.cyan}`,
            background: 'rgba(10,16,36,0.85)',
            boxShadow: `0 0 ${16 + 12 * (0.5 + 0.5 * Math.sin(t * 2))}px ${C.cyan}66`,
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
