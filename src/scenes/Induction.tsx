import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, ramp} from '../anim';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Twinkles, V, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Induksi (AUDIT): Faraday 1831; ε = −N dΦ/dt; Lenz: arus induksi melawan perubahan (kekekalan energi).
// Posisi magnet x(t) analitik; Φ(x) = (1 + (d/190)²)^−1.5 (medan pada sumbu); ε ∝ dΦ/dt (beda hingga, per frame).
// Kutub U magnet menghadap kumparan: saat didorong masuk, muka kiri kumparan menjadi U (menolak);
// saat ditarik keluar, muka kiri menjadi S (menarik) — selalu melawan perubahan.

type P = [number, number];
const fr = (v: number) => ((v % 1) + 1) % 1;
const deg = (r: number) => (r * 180) / Math.PI;
const slot = (t: number, a: number, b: number, fi = 0.5, fo = 0.45) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b, EASE_IN_OUT));

const YC = 470;
const XC = 1030;
const CX0 = 880;
const CX1 = 1180;
const CR = 115;
const NT = 9;
const ML = 280;
const MH = 76;
const X_OUT = 430;
const X_IN = 1000;
const phi = (x: number) => Math.pow(1 + Math.pow((XC - 30 - x) / 190, 2), -1.5);

/* garis medan magnet batang (dua kutub, 1/r²), relatif ke pusat magnet */
const NP: P = [120, 0];
const SPo: P = [-120, 0];
const mfield = (x: number, y: number): P => {
  let bx = 0;
  let by = 0;
  for (const [p, q] of [
    [NP, 1],
    [SPo, -1],
  ] as const) {
    const dx = x - p[0];
    const dy = y - p[1];
    const r2 = dx * dx + dy * dy + 20;
    const r3 = r2 * Math.sqrt(r2);
    bx += (q * dx) / r3;
    by += (q * dy) / r3;
  }
  return [bx, by];
};
const traceM = (a: number): P[] => {
  let x = NP[0] + 10 * Math.cos(a);
  let y = NP[1] - 10 * Math.sin(a);
  const pts: P[] = [[x, y]];
  const h = 5;
  for (let i = 0; i < 1600; i++) {
    const [ax, ay] = mfield(x, y);
    const m1 = Math.hypot(ax, ay);
    const [bx, by] = mfield(x + (0.5 * h * ax) / m1, y + (0.5 * h * ay) / m1);
    const m2 = Math.hypot(bx, by);
    x += (h * bx) / m2;
    y += (h * by) / m2;
    if (Math.hypot(x - SPo[0], y - SPo[1]) < 12) {
      pts.push([x, y]);
      break;
    }
    if (i % 3 === 2) pts.push([x, y]);
    if (Math.abs(x) > 1500 || Math.abs(y) > 700) break;
  }
  return pts;
};
const ANG = [10, 24, 40, 62, 95].flatMap((d) => [d, -d]).map((d) => (d * Math.PI) / 180);
const MLINES = ANG.map(traceM);
const MPATHS = MLINES.map((l) => l.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '));

const Chev: React.FC<{x: number; y: number; ang: number; s?: number; color: string; op?: number}> = ({x, y, ang, s = 9, color, op = 1}) =>
  op <= 0.001 ? null : (
    <path d={`M${-s},${-0.8 * s} L${s},0 L${-s},${0.8 * s} L${-0.4 * s},0 Z`} transform={`translate(${x},${y}) rotate(${ang})`} fill={color} opacity={op} />
  );

const LEAD_A: P[] = [
  [CX1 - 5, YC + CR],
  [CX1 - 5, 700],
  [1500, 700],
  [1500, 662],
];
const LEAD_B: P[] = [
  [1620, 662],
  [1620, 740],
  [CX0 + 5, 740],
  [CX0 + 5, YC + CR],
];

export const Induction: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  /* ---- jadwal gerak magnet ---- */
  type Mv = {a: number; d: number; s: 1 | -1};
  const mv: Mv[] = [];
  const add = (a: number, d: number, s: 1 | -1) => {
    const prev = mv[mv.length - 1];
    const aa = prev ? Math.max(a, prev.a + prev.d + 0.3) : a;
    mv.push({a: aa, d, s});
  };
  add(wordOf(1, 'dorong'), 1.3, 1);
  add(wordOf(1, 'tarik'), 1.3, -1);
  add(wordOf(2, 'perubahan'), 2.6, 1);
  add(wordOf(2, 'makin'), 0.5, -1);
  add(cue(3) + 0.5, 0.7, 1);
  add(cue(3) + 3.4, 1.0, -1);
  add(cue(4) + 0.3, 1.5, 1);
  add(wordOf(4, 'kalau'), 1.8, -1);
  add(wordOf(4, 'ketiadaan') + 0.3, 1.8, 1);
  const xAt = (tt: number) => mv.reduce((acc, m) => acc + m.s * (X_IN - X_OUT) * ramp(tt, m.a, m.a + m.d, EASE_IN_OUT), X_OUT);
  const hh = 1 / 60;
  const dPhi = (tt: number) => (phi(xAt(tt + hh)) - phi(xAt(tt - hh))) / (2 * hh);
  const needleOf = (tt: number) => {
    let s = 0;
    for (let k = 0; k < 6; k++) s += dPhi(tt - k * 0.035);
    return Math.tanh(0.45 * (s / 6));
  };
  const xm = xAt(t);
  const ph = phi(xm);
  const nrm = needleOf(t); // −1..1, + = ke kanan
  const vel = (xAt(t + hh) - xAt(t - hh)) / (2 * hh);
  const vLen = Math.max(-170, Math.min(170, vel * 0.2));
  const bob = 4 * Math.sin(1.3 * t);

  /* ---- penanda waktu ---- */
  const qOp = slot(t, 0.3, cue(1) - 0.1, 0.6, 0.6);
  const tFar = wordOf(0, 'faraday');
  const fluxOp = ramp(t, cue(2) - 0.4, cue(2) + 0.4);
  const slowM = mv[2];
  const fastM = mv[3];
  const peakIn = (a: number, b: number) => {
    let m = 0;
    const e = Math.min(t, b);
    if (e <= a) return 0;
    for (let k = 0; k <= 24; k++) m = Math.max(m, Math.abs(needleOf(a + ((e - a) * k) / 24)));
    return m;
  };
  const barsOp = slot(t, slowM.a - 0.3, cue(4) - 0.1, 0.6, 0.6);
  const pkSlow = barsOp > 0.001 ? peakIn(slowM.a, slowM.a + slowM.d + 0.3) : 0;
  const pkFast = barsOp > 0.001 ? peakIn(fastM.a, fastM.a + fastM.d + 0.3) : 0;
  const tMin = wordOf(3, 'minus');
  const nHi = slot(t, tMin - 0.2, tMin + 2.2, 0.4, 0.6);
  const lenzOp = ramp(t, cue(4) - 0.2, cue(4) + 0.5);
  const tEn = wordOf(4, 'energi');
  const nPos = Math.min(1, Math.max(0, nrm) * 5);
  const nNeg = Math.min(1, Math.max(0, -nrm) * 5);
  const nS = Math.sign(nrm) * Math.min(1, Math.abs(nrm) * 3);
  const nA = Math.min(1, Math.abs(nrm) * 8);
  const curOp = Math.min(1, Math.abs(nrm) * 2.5);

  const turnX = (k: number) => CX0 + ((k + 0.5) * (CX1 - CX0)) / NT;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="in-cu" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0b07a" />
            <stop offset="100%" stopColor="#8a4e2a" />
          </linearGradient>
          <linearGradient id="in-n" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8a98" />
            <stop offset="100%" stopColor="#b8283c" />
          </linearGradient>
          <linearGradient id="in-s" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8ac8ff" />
            <stop offset="100%" stopColor="#1f5fa8" />
          </linearGradient>
          <clipPath id="in-view">
            <rect x={110} y={175} width={1250} height={700} />
          </clipPath>
          <clipPath id="in-core">
            <rect x={CX0} y={YC - CR + 6} width={CX1 - CX0} height={2 * CR - 12} />
          </clipPath>
        </defs>

        <Glow x={XC} y={YC} r={300} color="kin" opacity={0.15 + 0.5 * curOp} />

        {/* garis medan magnet */}
        <g clipPath="url(#in-view)">
          <g transform={`translate(${xm},${YC + bob})`}>
            {MPATHS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={C.spr} strokeWidth={2.2} opacity={0.55} />
            ))}
            {MLINES.map((l, i) =>
              [0, 1].map((j) => {
                const u = fr(t * 0.06 + j / 2 + i * 0.13);
                const a = pointAlong(l, u);
                const b = pointAlong(l, Math.min(1, u + 0.004));
                return <Chev key={`${i}-${j}`} x={a[0]} y={a[1]} ang={deg(Math.atan2(b[1] - a[1], b[0] - a[0]))} s={8} color={C.spr} op={cyc(u) * 0.9} />;
              }),
            )}
          </g>
        </g>

        {/* setengah belakang lilitan */}
        {Array.from({length: NT}, (_, k) => (
          <path key={k} d={`M${turnX(k)},${YC - CR} A20,${CR} 0 0 0 ${turnX(k)},${YC + CR}`} fill="none" stroke="#8a4e2a" strokeWidth={6} opacity={0.55} />
        ))}

        {/* fluks yang menembus kumparan (jingga) */}
        <g clipPath="url(#in-core)" opacity={fluxOp}>
          <rect x={CX0} y={YC - CR} width={CX1 - CX0} height={2 * CR} fill={C.kin} opacity={0.06 + 0.12 * ph} />
          <g transform={`translate(${xm},${YC + bob})`}>
            {MPATHS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={C.kin} strokeWidth={4} opacity={0.95} />
            ))}
          </g>
        </g>

        {/* medan induksi (Lenz) di dalam kumparan */}
        {[-78, 78].map((dy) => (
          <Arrow
            key={dy}
            x1={XC + 110 * nS}
            y1={YC + dy}
            x2={XC - 110 * nS}
            y2={YC + dy}
            color="kin"
            width={6}
            opacity={lenzOp * nA}
            pulse={false}
          />
        ))}

        {/* magnet batang: S kiri, U kanan (menghadap kumparan) */}
        <g transform={`translate(${xm},${YC + bob})`}>
          <rect x={-ML / 2 + 4} y={-MH / 2 + 8} width={ML} height={MH} rx={8} fill="#000" opacity={0.3} />
          <rect x={-ML / 2} y={-MH / 2} width={ML / 2} height={MH} rx={8} fill="url(#in-s)" />
          <rect x={0} y={-MH / 2} width={ML / 2} height={MH} rx={8} fill="url(#in-n)" />
          <rect x={-ML / 2} y={-MH / 2} width={ML} height={10} rx={5} fill="#fff" opacity={0.18} />
          <Label x={-ML / 4} y={2} size={40} weight={700}>
            S
          </Label>
          <Label x={ML / 4} y={2} size={40} weight={700}>
            U
          </Label>
        </g>

        {/* setengah depan lilitan + arus induksi (naik di depan saat fluks bertambah) */}
        {Array.from({length: NT}, (_, k) => {
          const hi = nHi * (0.5 + 0.5 * Math.sin(5 * t - k * 0.7));
          return (
            <g key={k}>
              <path d={`M${turnX(k)},${YC - CR} A20,${CR} 0 0 1 ${turnX(k)},${YC + CR}`} fill="none" stroke="url(#in-cu)" strokeWidth={8} strokeLinecap="round" />
              <path d={`M${turnX(k)},${YC - CR} A20,${CR} 0 0 1 ${turnX(k)},${YC + CR}`} fill="none" stroke={C.gold} strokeWidth={14} opacity={0.35 * hi} />
              {[0, 1].map((j) => {
                const u = fr(j / 2 + k * 0.11 + 1.6 * ph);
                const ps = Math.PI / 2 - Math.PI * u;
                return <circle key={j} cx={turnX(k) + 20 * Math.cos(ps)} cy={YC + CR * Math.sin(ps)} r={4.5} fill="#ffe2c4" opacity={cyc(u) * curOp} />;
              })}
            </g>
          );
        })}
        <Label x={XC} y={YC + CR + 40} size={26} color={C.gold} opacity={nHi}>
          N lilitan
        </Label>

        {/* kabel ke galvanometer */}
        {[LEAD_A, LEAD_B].map((L, i) => (
          <g key={i}>
            <path d={L.map((p, k) => `${k ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ')} fill="none" stroke="url(#in-cu)" strokeWidth={6} strokeLinejoin="round" />
            {Array.from({length: 7}, (_, j) => {
              const u = fr(j / 7 + 0.9 * ph);
              const [x, y] = pointAlong(L, u);
              return (
                <g key={j} opacity={cyc(u) * curOp}>
                  <circle cx={x} cy={y} r={12} fill="url(#soft-kin)" />
                  <circle cx={x} cy={y} r={4.5} fill="#ffe2c4" />
                </g>
              );
            })}
          </g>
        ))}

        {/* galvanometer */}
        <g>
          <rect x={1410} y={420} width={300} height={240} rx={22} fill="#121c40" stroke={C.muted} strokeOpacity={0.6} strokeWidth={2.5} />
          <path d={`M${1560 - 140 * Math.sin(0.96)},${610 - 140 * Math.cos(0.96)} A140,140 0 0 1 ${1560 + 140 * Math.sin(0.96)},${610 - 140 * Math.cos(0.96)}`} fill="none" stroke={C.line} strokeWidth={10} />
          {Array.from({length: 11}, (_, i) => {
            const a = ((-55 + i * 11) * Math.PI) / 180;
            const l = i === 5 ? 22 : 12;
            return <line key={i} x1={1560 + 140 * Math.sin(a)} y1={610 - 140 * Math.cos(a)} x2={1560 + (140 - l) * Math.sin(a)} y2={610 - (140 - l) * Math.cos(a)} stroke={i === 5 ? C.ink : C.muted} strokeWidth={i === 5 ? 3 : 2} />;
          })}
          <Label x={1560} y={445} size={22} color={C.muted}>
            0
          </Label>
          <g transform={`rotate(${55 * nrm} 1560 610)`}>
            <line x1={1560} y1={610} x2={1560} y2={484} stroke={C.kin} strokeWidth={5} strokeLinecap="round" />
          </g>
          <circle cx={1560} cy={610} r={11} fill={C.ink} />
          <Label x={1660} y={630} size={28} color={C.muted} weight={700}>
            G
          </Label>
          <circle cx={1500} cy={662} r={7} fill={C.ink} />
          <circle cx={1620} cy={662} r={7} fill={C.ink} />
          <Glow x={1560 + 126 * Math.sin((55 * nrm * Math.PI) / 180)} y={610 - 126 * Math.cos((55 * nrm * Math.PI) / 180)} r={40} color="kin" opacity={curOp} />
        </g>

        {/* kecepatan magnet */}
        <Arrow x1={xm} y1={YC - 82 + bob} x2={xm + vLen} y2={YC - 82 + bob} color="work" width={6} opacity={Math.min(1, Math.abs(vLen) / 30)} pulse={false} />
        <Label x={xm + vLen / 2} y={YC - 112 + bob} size={30} color={C.work} font="serif" italic opacity={Math.min(1, Math.abs(vLen) / 50)}>
          v
        </Label>
        <Label x={1560} y={392} size={24} color={C.muted} opacity={(1 - Math.min(1, Math.abs(nrm) * 8)) * ramp(t, 0.5, 1.5) * (1 - lenzOp) * (1 - slot(t, cue(3) - 0.5, cue(4) + 0.8, 0.4, 0.4))}>
          magnet diam → jarum 0
        </Label>

        {/* gaya Lenz pada magnet */}
        <g opacity={lenzOp}>
          <Arrow x1={xm + 70} y1={YC + 78 + bob} x2={xm + 70 - 150 * nS} y2={YC + 78 + bob} color="force" width={6} opacity={nA} pulse={false} />
          <Label x={xm + 70 - 75 * nS} y={YC + 112 + bob} size={28} color={C.force} font="serif" italic opacity={nA}>
            F
          </Label>
          <circle cx={CX0} cy={YC - CR - 42} r={27} fill={C.heat} opacity={nPos} />
          <Label x={CX0} y={YC - CR - 42} size={32} weight={700} opacity={nPos}>
            U
          </Label>
          <circle cx={CX0} cy={YC - CR - 42} r={27} fill={C.pot} opacity={nNeg} />
          <Label x={CX0} y={YC - CR - 42} size={32} weight={700} opacity={nNeg}>
            S
          </Label>
          <Label x={CX0 + 40} y={YC - CR - 42} size={26} color={C.heat} anchor="start" opacity={nPos}>
            menolak magnet masuk
          </Label>
          <Label x={CX0 + 40} y={YC - CR - 42} size={26} color={C.pot} anchor="start" opacity={nNeg}>
            menahan magnet keluar
          </Label>
        </g>

        {/* fluks Φ */}
        <g opacity={fluxOp * (1 - lenzOp)}>
          <Label x={XC} y={222} size={28} color={C.kin}>
            fluks Φ yang menembus kumparan
          </Label>
          <rect x={CX0} y={250} width={CX1 - CX0} height={20} rx={10} fill={C.line} opacity={0.6} />
          <rect x={CX0} y={250} width={(CX1 - CX0) * ph} height={20} rx={10} fill={C.kin} />
        </g>

        {/* pelan vs cepat */}
        {barsOp > 0.001 ? (
          <g opacity={barsOp}>
            <Label x={160} y={770} size={26} color={C.muted} anchor="start">
              dorong pelan
            </Label>
            <rect x={360} y={758} width={340} height={24} rx={8} fill={C.line} opacity={0.6} />
            <rect x={360} y={758} width={340 * pkSlow} height={24} rx={8} fill={C.kin} opacity={0.85} />
            <Label x={160} y={830} size={26} color={C.muted} anchor="start">
              cepat
            </Label>
            <rect x={360} y={818} width={340} height={24} rx={8} fill={C.line} opacity={0.6} />
            <rect x={360} y={818} width={340 * pkFast} height={24} rx={8} fill={C.kin} />
            <Label x={530} y={725} size={24} color={C.kin}>
              simpangan jarum terbesar
            </Label>
            <Twinkles x={360 + 300 * pkFast} y={830} rx={40} ry={16} n={3} color="kin" opacity={pkFast > 0.5 ? 1 : pkFast * 2} />
          </g>
        ) : null}

        {/* pertanyaan pembuka */}
        <g opacity={qOp}>
          <Label x={560} y={235} size={32} color={C.cyan}>
            listrik → magnet ✓
          </Label>
          <Label x={560} y={285} size={32} color={C.kin} opacity={0.6 + 0.4 * Math.sin(3 * t) ** 2}>
            magnet → listrik ?
          </Label>
        </g>

        <Ripple x={1560} y={560} p={ramp(t, mv[0].a + 0.3, mv[0].a + 1.6, (x) => x)} r={170} color="kin" />
        <Ripple x={1560} y={560} p={ramp(t, mv[3].a + 0.1, mv[3].a + 1.3, (x) => x)} r={190} color="kin" />
        <Motes x={XC} y={YC} rx={320} ry={200} n={18} color="kin" opacity={0.3} seed={6} />
      </Stage>

      <Note x={1560} y={300} p={slot(t, tFar - 0.5, cue(1) + 0.3, 0.6, 0.6)} color={C.kin}>
        Michael Faraday · 1831
      </Note>
      <Formula x={1560} y={292} p={slot(t, cue(3) - 0.1, cue(4) + 0.4)} accent={C.kin} size={62} caption="N = jumlah lilitan">
        <V color={C.kin}>ε</V> = −<V color={C.gold}>N</V>{' '}
        <Frac
          n={
            <>
              Δ<V color={C.kin}>Φ</V>
            </>
          }
          d={
            <>
              Δ<V>t</V>
            </>
          }
        />
      </Formula>
      <Note x={560} y={800} p={slot(t, tEn - 0.5, 99, 0.6, 0.1)} color={C.force} size={28}>
        usaha melawan tolakan → energi listrik
      </Note>
    </AbsoluteFill>
  );
};
