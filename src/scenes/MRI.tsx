import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, mix, ramp, rand, win} from '../anim';
import {Badge, Formula, Glow, Label, Motes, Note, Ripple, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {ATOM, C, FONT} from '../theme';

// MRI (semua analitik per frame).
// Penampang memanjang pemindai: magnet superkonduktor (lilitan ⊙ di atas, ⊗ di bawah → B ke kanan sepanjang lorong,
// kaidah tangan kanan), kumparan gradien (jingga) di dinding lorong, pasien berbaring di meja.
// Lensa: molekul air (O + 2 H) berputar acak; spin proton (emas) mula-mula acak, lalu searah B dan berpresesi.
// 1,5 T → f ≈ 64 MHz (42,58 MHz/T). Gradien: B sedikit berbeda di tiap irisan → tiap irisan beresonansi pada f sendiri
// (pita warna biru → jingga = f rendah → tinggi). Sinyal disusun menjadi irisan otak bergaya; tanpa radiasi pengion.

const TAU = Math.PI * 2;
const BX0 = 330; // magnet
const BX1 = 890;
const TOPA = 225;
const TOPB = 335; // dinding atas lorong
const BOTA = 590; // dinding bawah lorong
const BOTB = 700;
const TABLE = 548;
const IN = {x: 1460, y: 500, r: 205};

/** Siluet pasien berbaring (kepala di kanan). */
const Patient: React.FC<{dx: number}> = ({dx}) => {
  const hx = 790 + dx;
  return (
    <g>
      <path
        d={`M${hx - 640},${TABLE - 4} L${hx - 640},${TABLE - 34} Q${hx - 640},${TABLE - 46} ${hx - 620},${TABLE - 46} L${hx - 360},${TABLE - 50} Q${hx - 330},${TABLE - 82} ${hx - 290},${TABLE - 84} L${hx - 110},${TABLE - 84} Q${hx - 80},${TABLE - 82} ${hx - 70},${TABLE - 60} L${hx - 50},${TABLE - 56} L${hx - 50},${TABLE - 4} Z`}
        fill="#7f93c9"
        fillOpacity={0.55}
        stroke="#c9d6ff"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path d={`M${hx - 470},${TABLE - 48} L${hx - 120},${TABLE - 50}`} stroke="#c9d6ff" strokeOpacity={0.35} strokeWidth={2} strokeDasharray="6 8" />
      <circle cx={hx} cy={TABLE - 42} r={40} fill="#9fb0dc" fillOpacity={0.6} stroke="#c9d6ff" strokeWidth={2} />
      <path d={`M${hx + 36},${TABLE - 52} q 10,4 4,12`} fill="none" stroke="#c9d6ff" strokeWidth={2} />
    </g>
  );
};

/** Molekul air dengan dua H; spin proton emas. */
const Water: React.FC<{x: number; y: number; rot: number; spin: [number, number]; o: number; spinO: number}> = ({x, y, rot, spin, o, spinO}) => {
  const half = (104.5 / 2) * (Math.PI / 180);
  const d = 34;
  const hs = [rot - half, rot + half].map((a) => [x + d * Math.cos(a), y + d * Math.sin(a)] as [number, number]);
  return (
    <g opacity={o}>
      {hs.map(([hx, hy], k) => (
        <line key={k} x1={x} y1={y} x2={hx} y2={hy} stroke="#dfe6ff" strokeWidth={6} strokeOpacity={0.6} />
      ))}
      <circle cx={x} cy={y} r={21} fill={ATOM.O?.fill ?? C.heat} stroke="#ffd0d6" strokeWidth={1.5} />
      <circle cx={x - 7} cy={y - 8} r={7} fill="#fff" opacity={0.35} />
      {hs.map(([hx, hy], k) => {
        const a = spin[k];
        return (
          <g key={`h${k}`}>
            <circle cx={hx} cy={hy} r={12} fill="#f2f5ff" stroke="#9fb0dc" strokeWidth={1.5} />
            <circle cx={hx} cy={hy} r={22} fill="url(#soft-gold)" opacity={spinO} />
            <line
              x1={hx - 14 * Math.cos(a)}
              y1={hy - 14 * Math.sin(a)}
              x2={hx + 30 * Math.cos(a)}
              y2={hy + 30 * Math.sin(a)}
              stroke={C.gold}
              strokeWidth={4.5}
              strokeLinecap="round"
              markerEnd="url(#arrow-gold)"
              opacity={spinO}
            />
          </g>
        );
      })}
    </g>
  );
};

/** Irisan otak bergaya (aksial). */
const Brain: React.FC<{cx: number; cy: number; detail: number; t: number}> = ({cx, cy, detail, t}) => {
  const gyri = Array.from({length: 18}, (_, i) => {
    const a = (i / 18) * TAU + 0.1;
    const r0 = 0.62 + 0.08 * rand(i);
    const pts: string[] = [];
    for (let k = 0; k <= 8; k++) {
      const rr = r0 + (0.36 * k) / 8;
      const w = 0.07 * Math.sin(k * 1.7 + i * 2.3);
      const ax = a + w;
      pts.push(`${(cx + 120 * rr * Math.cos(ax)).toFixed(1)},${(cy + 150 * rr * Math.sin(ax)).toFixed(1)}`);
    }
    return pts.join(' ');
  });
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={148} ry={178} fill="#4b5060" />
      <ellipse cx={cx} cy={cy} rx={138} ry={168} fill="none" stroke="#14161d" strokeWidth={9} />
      <ellipse cx={cx} cy={cy} rx={126} ry={156} fill="#9a9fae" />
      <ellipse cx={cx} cy={cy} rx={98} ry={126} fill="#b9bdc9" opacity={0.7} />
      <g opacity={detail}>
        {gyri.map((p, i) => (
          <polyline key={i} points={p} fill="none" stroke="#6c7180" strokeWidth={3} strokeLinecap="round" />
        ))}
        <line x1={cx} y1={cy - 156} x2={cx} y2={cy - 40} stroke="#2a2d38" strokeWidth={3} />
        <line x1={cx} y1={cy + 60} x2={cx} y2={cy + 156} stroke="#2a2d38" strokeWidth={3} />
        <path d={`M${cx - 6},${cy - 38} Q${cx - 46},${cy - 30} ${cx - 40},${cy + 10} Q${cx - 30},${cy + 40} ${cx - 8},${cy + 52} Q${cx - 18},${cy + 10} ${cx - 6},${cy - 38} Z`} fill="#262935" />
        <path d={`M${cx + 6},${cy - 38} Q${cx + 46},${cy - 30} ${cx + 40},${cy + 10} Q${cx + 30},${cy + 40} ${cx + 8},${cy + 52} Q${cx + 18},${cy + 10} ${cx + 6},${cy - 38} Z`} fill="#262935" />
        <ellipse cx={cx - 70} cy={cy + 20} rx={14} ry={30} fill="#d4d7e0" opacity={0.5 + 0.1 * Math.sin(t)} />
        <ellipse cx={cx + 70} cy={cy + 20} rx={14} ry={30} fill="#d4d7e0" opacity={0.5 + 0.1 * Math.sin(t + 1)} />
      </g>
    </g>
  );
};

export const MRI: React.FC = () => {
  const {t, cue, wordOf, dur} = useScene();
  const intro = ramp(t, -0.4, 0.9);
  const out = 1 - ramp(t, dur - 0.9, dur, EASE_IN_OUT);
  const c1 = cue(1);
  const c2 = cue(2);
  const c3 = cue(3);
  const tTubuh = Math.max(cue(0) + 1.5, wordOf(0, 'tubuh') - 0.3);
  const tAir = Math.max(c1 + 0.3, wordOf(1, 'air') - 0.4);
  const tProton = Math.max(tAir + 1.0, wordOf(1, 'proton') - 0.4);
  const tMag = Math.max(c2 + 0.2, wordOf(2, 'superkonduktor') - 0.3);
  const tTesla = Math.max(tMag + 0.8, wordOf(2, 'tesla') - 0.4);
  const tBumi = Math.max(tTesla + 0.8, wordOf(2, 'bumi') - 0.5);
  const tSel = Math.max(tBumi + 0.6, wordOf(2, 'menyelaraskan') - 0.3);
  const tFreq = Math.max(tSel + 1.2, wordOf(2, 'frekuensi') - 0.3);
  const tGrad = Math.max(c3 + 0.2, wordOf(3, 'gradien') - 0.3);
  const tSendiri = Math.max(tGrad + 1.5, wordOf(3, 'frekuensinya') - 0.3);
  const tGambar = Math.max(tSendiri + 1.5, wordOf(3, 'gambar') - 0.6);
  const tTanpa = Math.max(tGambar + 1.0, wordOf(3, 'tanpa') - 0.3);

  const slide = ramp(t, 0.2, tTubuh + 0.6, EASE_IN_OUT);
  const dx = -300 * (1 - slide);
  const magOn = ramp(t, tMag - 0.2, tMag + 0.8);
  const field = 0.35 + 0.65 * ramp(t, tTesla - 0.3, tTesla + 0.7);
  const align = ramp(t, tSel - 0.1, tSel + 2.2, EASE_IN_OUT);
  const grad = ramp(t, tGrad - 0.2, tGrad + 1.0);
  const bands = ramp(t, tSendiri - 0.4, tSendiri + 0.6);
  const inset = win(t, tAir - 0.3, tGambar - 0.2, 0.9, 0.8);
  const molO = ramp(t, tAir - 0.1, tAir + 0.8);
  const spinO = ramp(t, tProton - 0.2, tProton + 0.6);
  const img = ramp(t, tGambar - 0.3, tGambar + 0.5);
  const scan = ramp(t, tGambar - 0.2, tGambar + 2.8, (x) => x);
  const signal = win(t, tGambar - 0.3, dur, 0.6, 0.6);

  const n0 = win(t, cue(0) + 0.3, c1 - 0.15, 0.7, 0.55);
  const n1 = win(t, tAir, c2 - 0.15, 0.7, 0.55);
  const n2 = win(t, tBumi - 0.2, c3 - 0.15, 0.7, 0.55);
  const n3 = win(t, tGrad, dur + 2, 0.7, 0.55);
  const fF = win(t, tFreq, tTanpa - 0.3, 0.7, 0.55);
  const fT = ramp(t, tTanpa - 0.1, tTanpa + 0.7);
  const badge = ramp(t, tTesla - 0.3, tTesla + 0.5);

  // irisan yang sedang beresonansi (bergerak bolak-balik halus sepanjang tubuh)
  const sx = 610 + 230 * Math.sin((t - tSendiri) * 0.9);
  const fcol = (u: number) => interpolateColors(u, [0, 0.5, 1], [C.pot, C.spr, C.kin]);

  // titik-titik spin di tubuh
  const bodySpins = Array.from({length: 13}, (_, i) => {
    const x = 470 + i * 30 + dx;
    const y = TABLE - 22 - (i % 3) * 16 - (x > 690 + dx ? 6 : 0);
    const a0 = rand(i * 3.1) * TAU - Math.PI + 0.5 * Math.sin(t * 0.6 + i);
    const a = mix(a0, 0.45 * Math.sin(t * 3 + i), align);
    return {x, y, a};
  });

  const mols = Array.from({length: 6}, (_, i) => {
    const gx = IN.x - 112 + (i % 3) * 112 + (Math.floor(i / 3) ? 30 : -10) + 10 * Math.sin(t * 0.5 + i * 2);
    const gy = IN.y - 72 + Math.floor(i / 3) * 140 + 10 * Math.cos(t * 0.45 + i);
    const rot = rand(i * 7) * TAU + t * (0.35 + 0.25 * rand(i + 2)) * (i % 2 ? 1 : -1);
    const spins = [0, 1].map((k) => {
      const ar = rand(i * 5 + k * 11) * TAU - Math.PI + 0.4 * Math.sin(t * 0.7 + i + k);
      return mix(ar, 0.42 * Math.sin(t * 3.2 + i * 1.3 + k * 2), align);
    }) as [number, number];
    return {gx, gy, rot, spins};
  });

  const coilRow = (y: number, out: boolean) =>
    Array.from({length: 8}, (_, i) => {
      const x = BX0 + 50 + i * 66;
      return (
        <g key={`${y}-${i}`}>
          <circle cx={x} cy={y} r={15} fill="#0d1430" stroke={C.cyan} strokeWidth={2.5} />
          {out ? (
            <circle cx={x} cy={y} r={4.5} fill={C.cyan} />
          ) : (
            <g stroke={C.cyan} strokeWidth={2.5} strokeLinecap="round">
              <line x1={x - 6} y1={y - 6} x2={x + 6} y2={y + 6} />
              <line x1={x - 6} y1={y + 6} x2={x + 6} y2={y - 6} />
            </g>
          )}
        </g>
      );
    });

  const scanY = IN.y - 190 + 380 * scan;

  return (
    <AbsoluteFill style={{opacity: intro * out}}>
      <Stage>
        <defs>
          <clipPath id="mri-inset">
            <circle cx={IN.x} cy={IN.y} r={IN.r} />
          </clipPath>
          <clipPath id="mri-scan">
            <rect x={IN.x - 200} y={IN.y - 200} width={400} height={Math.max(0, scanY - (IN.y - 200))} />
          </clipPath>
        </defs>
        <Motes x={610} y={460} rx={420} ry={260} n={26} color="spr" opacity={0.35} seed={11} />
        <Glow x={610} y={460} r={380} color="spr" opacity={0.15 + 0.15 * field} />
        {/* meja */}
        <rect x={130} y={TABLE} width={800} height={14} rx={6} fill="#3a4672" stroke="#8b9ad0" strokeWidth={2} />
        <rect x={180} y={TABLE + 14} width={14} height={150} fill="#2a3560" />
        <ellipse cx={560} cy={740} rx={470} ry={26} fill="#000" opacity={0.25} />
        {/* garis medan B di lorong (ke kanan) */}
        {[365, 405, 572].map((y, i) => (
          <g key={y} opacity={field}>
            <line x1={BX0 - 20} y1={y} x2={BX1 + 30} y2={y} stroke={C.spr} strokeOpacity={0.45} strokeWidth={2.2} strokeDasharray="12 10" strokeDashoffset={-t * 50} markerEnd="url(#arrow-spr)" />
            <Stream
              pts={[
                [BX0 - 20, y],
                [BX1 + 20, y],
              ]}
              color="spr"
              n={5}
              speed={0.3}
              r={4}
              jitter={0}
              seed={i * 2.1}
            />
          </g>
        ))}
        {/* pita gradien: f berbeda tiap irisan */}
        <g opacity={bands * 0.9}>
          {Array.from({length: 14}, (_, i) => {
            const x = BX0 + 20 + i * 37;
            const u = i / 13;
            const near = Math.exp(-(((x + 18 - sx) / 34) ** 2));
            return <rect key={i} x={x} y={TOPB + 12} width={36} height={BOTA - TOPB - 24} fill={fcol(u)} opacity={0.18 + 0.45 * near} />;
          })}
          <rect x={sx - 18} y={TOPB + 8} width={36} height={BOTA - TOPB - 16} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={2} />
        </g>
        <Patient dx={dx} />
        {/* spin proton di tubuh */}
        {bodySpins.map((s, i) => (
          <g key={i} opacity={spinO * 0.95}>
            <circle cx={s.x} cy={s.y} r={4} fill="#f2f5ff" />
            <line x1={s.x} y1={s.y} x2={s.x + 18 * Math.cos(s.a)} y2={s.y + 18 * Math.sin(s.a)} stroke={C.gold} strokeWidth={2.5} markerEnd="url(#arrow-gold)" />
          </g>
        ))}
        {/* rumah magnet */}
        {[
          [TOPA, TOPB],
          [BOTA, BOTB],
        ].map(([a, b], k) => (
          <g key={k}>
            <rect x={BX0} y={a} width={BX1 - BX0} height={b - a} rx={26} fill="#1b2650" stroke="#a9bbef" strokeWidth={3} />
            <rect x={BX0 + 14} y={a + 12} width={BX1 - BX0 - 28} height={b - a - 24} rx={18} fill="#0f1838" stroke={C.cyan} strokeOpacity={0.3 + 0.4 * magOn} strokeWidth={1.5} />
            {/* kumparan gradien di dinding lorong */}
            <rect x={BX0 + 10} y={k ? a + 2 : b - 12} width={BX1 - BX0 - 20} height={10} rx={4} fill={C.kin} opacity={0.35 + 0.55 * grad * (0.75 + 0.25 * Math.sin(t * 6))} />
          </g>
        ))}
        <Glow x={610} y={280} r={220} color="cyan" opacity={0.35 * magOn} />
        <Glow x={610} y={645} r={220} color="cyan" opacity={0.35 * magOn} />
        {coilRow(280, true)}
        {coilRow(645, false)}
        <Label x={610} y={TOPA - 22} size={22} color="#c9d6ff" font="mono" opacity={intro * (1 - badge)}>
          magnet superkonduktor
        </Label>
        <Label x={BX1 + 70} y={TOPB + 6} size={20} color={C.kin} font="mono" anchor="start" opacity={0.5 + 0.5 * grad}>
          kumparan
        </Label>
        <Label x={BX1 + 70} y={TOPB + 32} size={20} color={C.kin} font="mono" anchor="start" opacity={0.5 + 0.5 * grad}>
          gradien
        </Label>
        <Label x={BX0 - 52} y={385} size={32} color={C.spr} weight={700} font="serif" italic opacity={field}>
          B
        </Label>
        {/* skala frekuensi */}
        <g opacity={bands}>
          {Array.from({length: 14}, (_, i) => (
            <rect key={i} x={BX0 + 20 + i * 37} y={752} width={37} height={16} fill={fcol(i / 13)} opacity={0.85} />
          ))}
          <polygon points={`${sx},748 ${sx - 9},734 ${sx + 9},734`} fill="#fff" />
          <text x={BX0 + 20} y={792} fontFamily={FONT.mono} fontSize={19} fill={C.pot} dominantBaseline="central">
            B sedikit lebih kecil · f rendah
          </text>
          <text x={BX0 + 538} y={792} textAnchor="end" fontFamily={FONT.mono} fontSize={19} fill={C.kin} dominantBaseline="central">
            f tinggi
          </text>
        </g>
        {/* sinyal → gambar */}
        <Stream
          pts={[
            [sx, 470],
            [1000, 420],
            [1255, 470],
          ]}
          color="kin"
          n={10}
          speed={0.45}
          r={4.5}
          opacity={signal}
        />

        {/* ---------- lensa molekul air ---------- */}
        <g opacity={inset}>
          <line x1={640 + dx} y1={TABLE - 60} x2={IN.x - IN.r * 0.95} y2={IN.y - 60} stroke={C.muted} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 6" />
          <line x1={640 + dx} y1={TABLE - 30} x2={IN.x - IN.r * 0.9} y2={IN.y + 90} stroke={C.muted} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 6" />
          <circle cx={640 + dx} cy={TABLE - 45} r={22} fill="none" stroke={C.muted} strokeWidth={2} />
          <circle cx={IN.x} cy={IN.y} r={IN.r} fill="#0a1230" stroke="#a9bbef" strokeWidth={3} />
          <g clipPath="url(#mri-inset)">
            <Glow x={IN.x} y={IN.y} r={230} color="water" opacity={0.3} />
            {mols.map((m, i) => (
              <Water key={i} x={m.gx} y={m.gy} rot={m.rot} spin={m.spins} o={molO} spinO={spinO} />
            ))}
            <g opacity={align}>
              <line x1={IN.x - 150} y1={IN.y + 168} x2={IN.x + 150} y2={IN.y + 168} stroke={C.spr} strokeWidth={4} markerEnd="url(#arrow-spr)" />
              <text x={IN.x - 175} y={IN.y + 168} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={28} fill={C.spr}>
                B
              </text>
            </g>
          </g>
          <Ripple x={IN.x} y={IN.y} p={(t - tSel) / 1.6} r={210} color="gold" rings={2} width={2} />
        </g>

        {/* ---------- gambar tersusun ---------- */}
        <g opacity={img}>
          <rect x={IN.x - 215} y={IN.y - 215} width={430} height={430} rx={22} fill="#05070f" stroke="#a9bbef" strokeWidth={3} />
          <g clipPath="url(#mri-scan)">
            <Brain cx={IN.x} cy={IN.y} detail={ramp(scan, 0.3, 1)} t={t} />
          </g>
          {scan < 1 ? (
            <g opacity={Math.sin(Math.PI * scan)}>
              <line x1={IN.x - 200} y1={scanY} x2={IN.x + 200} y2={scanY} stroke={C.kin} strokeWidth={3} />
              <rect x={IN.x - 200} y={scanY - 14} width={400} height={14} fill={C.kin} opacity={0.18} />
            </g>
          ) : null}
          <text x={IN.x - 195} y={IN.y - 190} fontFamily={FONT.mono} fontSize={16} fill={C.muted} dominantBaseline="central">
            irisan otak (skematis)
          </text>
          <Twinkles x={IN.x} y={IN.y} rx={190} ry={190} n={4} color="kin" opacity={ramp(scan, 0.85, 1)} seed={3} />
        </g>
      </Stage>
      <Badge x={610} y={TOPA - 22} text="1,5 – 3 T" color={C.spr} opacity={badge} scale={0.9 + 0.1 * badge} />
      <Note x={IN.x} y={215} p={n0} color={C.gold}>
        MRI = NMR untuk tubuh manusia
      </Note>
      <Note x={IN.x} y={215} p={n1} color={C.gold}>
        H<Sub>2</Sub>O → tiap molekul membawa 2 proton
      </Note>
      <Note x={IN.x} y={215} p={n2} color={C.spr} size={28}>
        1,5–3 T ≈ puluhan ribu × medan Bumi (≈ 50 μT)
      </Note>
      <Note x={IN.x} y={215} p={n3} color={C.kin} size={28}>
        gradien → tiap irisan punya <V>f</V> sendiri
      </Note>
      <Formula x={IN.x} y={805} p={fF} accent={C.gold} caption="pada B = 1,5 T (≈ 42,6 MHz per tesla)">
        <V>f</V> ≈ 64 MHz
      </Formula>
      <Note x={IN.x} y={800} p={fT} color={C.work} size={34}>
        <span style={{color: C.work}}>✓</span> tanpa radiasi pengion
      </Note>
    </AbsoluteFill>
  );
};
