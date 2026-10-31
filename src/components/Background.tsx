import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig} from 'remotion';
import {rand} from '../anim';
import {C, FONT, H, MOOD_TINT, W} from '../theme';
import {TIMELINE} from '../timeline.ts';

const tintAt = (t: number) => {
  const stops: number[] = [];
  const colors: string[] = [];
  TIMELINE.scenes.forEach((s) => {
    stops.push(s.start + 0.01, Math.max(s.start + 0.02, s.end - 1.5));
    colors.push(MOOD_TINT[s.mood], MOOD_TINT[s.mood]);
  });
  return interpolateColors(t, stops, colors);
};

// Kisi cetak biru: garis halus 40 px, garis tebal tiap 200 px. Digeser dalam satu periode (200 px)
// lalu dibungkus, jadi tidak ada loncatan.
const P = 200;
const MINOR = (() => {
  const d: string[] = [];
  for (let x = -P; x <= W + P; x += 40) d.push(`M${x},${-P} V${H + P}`);
  for (let y = -P; y <= H + P; y += 40) d.push(`M${-P},${y} H${W + P}`);
  return d.join(' ');
})();
const MAJOR = (() => {
  const d: string[] = [];
  for (let x = -P; x <= W + P; x += P) d.push(`M${x},${-P} V${H + P}`);
  for (let y = -P; y <= H + P; y += P) d.push(`M${-P},${y} H${W + P}`);
  return d.join(' ');
})();

const DUST = Array.from({length: 46}, (_, i) => ({
  x: rand(i * 3.1) * W,
  y: rand(i * 5.7) * H,
  r: 1 + rand(i * 9.3) * 2.2,
  s: 4 + rand(i * 1.7) * 10,
  ph: rand(i * 2.9) * Math.PI * 2,
  c: [C.water, C.cyan, C.buoy, C.gold][i % 4],
}));

// gelembung yang naik pelan dari bawah (bergoyang ke samping, membesar sedikit saat naik)
const BUBBLES = Array.from({length: 22}, (_, i) => ({
  x: rand(i * 4.3 + 1) * W,
  r: 3 + rand(i * 2.1) * 7,
  s: 18 + rand(i * 6.7) * 26,
  ph: rand(i * 8.9) * 10,
}));

// Rumus "hantu" yang melayang pelan di latar (sangat samar, hanya tekstur hidup).
const GHOSTS = ['B = μ₀I/2πr', 'F = q v B', 'r = m v / q B', 'F = B I L', 'ε = −N ΔΦ/Δt', 'Φ = B A', 'μ_B = eħ/2m', 'f = γB/2π'];
const GHOST = GHOSTS.map((txt, i) => ({
  txt,
  y: 120 + ((i * 131) % 840),
  size: 60 + (i % 3) * 26,
  speed: 9 + (i % 4) * 4,
  off: rand(i * 7.7) * (W + 700),
  c: [C.water, C.press, C.buoy, C.cyan, C.gold, C.spr][i % 6],
}));

/** Latar malam biru tinta + kisi cetak biru yang bergeser pelan + debu energi berkelip. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const tint = tintAt(t);
  const shift = (t * 5) % P;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 85% 75% at 50% 42%, ${tint} 0%, ${C.bg} 75%)`}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${-shift} ${-shift * 0.5})`}>
          <path d={MINOR} stroke={C.grid} strokeOpacity={0.45} strokeWidth={1} fill="none" />
          <path d={MAJOR} stroke={C.grid} strokeOpacity={0.95} strokeWidth={1.5} fill="none" />
        </g>
        {/* cincin orbit samar yang berputar pelan di pojok */}
        <g transform={`translate(1780 960) rotate(${t * 3})`} opacity={0.5}>
          <ellipse rx={340} ry={140} fill="none" stroke={C.pot} strokeOpacity={0.14} strokeWidth={2.5} strokeDasharray="3 16" strokeLinecap="round" />
          <circle cx={340 * Math.cos(t * 0.35)} cy={140 * Math.sin(t * 0.35)} r={6} fill={C.water} opacity={0.5} />
        </g>
        <g transform={`translate(120 150) rotate(${-t * 4})`} opacity={0.45}>
          <ellipse rx={250} ry={96} fill="none" stroke={C.cyan} strokeOpacity={0.13} strokeWidth={2.5} strokeDasharray="3 16" strokeLinecap="round" />
          <circle cx={-250 * Math.cos(t * 0.45)} cy={-96 * Math.sin(t * 0.45)} r={5} fill={C.cyan} opacity={0.5} />
        </g>
        {/* gelombang energi tipis yang berjalan di bawah & atas */}
        {[0, 1].map((k) => {
          const base = k ? 1010 : 196;
          const pts = Array.from({length: 49}, (_, i) => {
            const x = (i / 48) * W;
            const y = base + 16 * Math.sin(x * 0.006 + t * (k ? 0.7 : -0.55) + k * 2) * Math.sin(x * 0.0017 + t * 0.2);
            return `${i ? 'L' : 'M'}${x.toFixed(0)},${y.toFixed(1)}`;
          }).join(' ');
          return <path key={k} d={pts} fill="none" stroke={k ? C.water : C.cyan} strokeOpacity={0.08} strokeWidth={2} />;
        })}
        {/* rumus hantu */}
        {GHOST.map((g, i) => {
          const span = W + 700;
          const x = ((((g.off + t * g.speed) % span) + span) % span) - 350;
          const edge = Math.min(1, (x + 350) / 300, (W + 350 - x) / 300);
          return (
            <text key={i} x={x} y={g.y + 10 * Math.sin(t * 0.3 + i)} fontFamily={FONT.serif} fontStyle="italic" fontSize={g.size} fill={g.c} opacity={0.033 * Math.max(0, edge)}>
              {g.txt}
            </text>
          );
        })}
        {BUBBLES.map((b, i) => {
          const span = H + 120;
          const y = H + 60 - ((((b.ph * 100 + t * b.s) % span) + span) % span);
          const x = b.x + 18 * Math.sin(t * 0.8 + i * 1.7);
          const edge = Math.min(1, (H + 60 - y) / 200, (y + 60) / 260);
          return (
            <g key={`b${i}`} opacity={0.22 * Math.max(0, edge)}>
              <circle cx={x} cy={y} r={b.r * (1 + 0.25 * (1 - y / H))} fill="none" stroke={C.water} strokeWidth={1.5} />
              <circle cx={x - b.r * 0.3} cy={y - b.r * 0.3} r={b.r * 0.25} fill="#fff" opacity={0.7} />
            </g>
          );
        })}
        {DUST.map((d, i) => {
          const y = (((d.y - t * d.s) % H) + H) % H;
          const tw = 0.35 + 0.35 * Math.sin(t * 0.9 + d.ph);
          return <circle key={i} cx={d.x + 14 * Math.sin(t * 0.2 + d.ph)} cy={y} r={d.r} fill={d.c} opacity={tw * Math.min(1, y / 120, (H - y) / 120)} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** Vinyet gelap di tepi layar. */
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse 90% 80% at 50% 46%, transparent 60%, rgba(2,4,10,0.55) 100%)'}} />
);
