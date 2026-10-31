// Teks khusus mesin suara (TTS). Subtitle tetap memakai `text` (dengan simbol),
// sedangkan ElevenLabs menerima versi yang ejaannya dibuat ramah pengucapan Indonesia:
// huruf tunggal dibaca sebagai nama hurufnya (J → "je", B → "be"), nama huruf Yunani
// dieja seperti di kelas (theta → "teta", rho → "ro"), nama tokoh dieja seperti diucapkan. Baris boleh memberi `tts` sendiri.
import type {Line} from './script.ts';

const LETTER: Record<string, string> = {
  F: 'ef',
  W: 'we',
  K: 'ka',
  U: 'u',
  T: 'te',
  Q: 'ki',
  H: 'ha',
  P: 'pe',
  g: 'ge',
  v: 'fe',
  m: 'em',
  h: 'ha',
  k: 'ka',
  x: 'eks',
  y: 'ye',
  s: 'es',
  d: 'de',
  f: 'ef',
  A: 'a',
  V: 'fe',
  L: 'el',
  r: 'er',
  p: 'pe',
  t: 'te',
  e: 'e',
  X: 'eks',
};

const WORD: Record<string, string> = {
  theta: 'teta',
  rho: 'ro',
  gamma: 'gama',
  Archimedes: 'Arkimedes',
  Torricelli: 'Toriceli',
  Pascal: 'Paskal',
  pascal: 'paskal',
  Feynman: 'Fainmen',
  Joule: 'Jul',
  joule: 'jul',
  James: 'Jems',
  Boltzmann: 'Boltsman',
  Hooke: 'Huk',
  watt: 'wat',
  kilojoule: 'kilojul',
  roller: 'roler',
  coaster: 'koster',
  Bernoulli: 'Bernuli',
  Poiseuille: 'Pwasey',
  Reynolds: 'Reinolds',
  Büchner: 'Bukhner',
  Hawke: 'Hok',
  Olympic: 'Olimpik',
  Titanic: 'Titanik',
  Venturi: 'Venturi',
  Ostwald: 'Ostwald',
  eta: 'eta',
  Newton: 'Nyuton',
  Planck: 'Plank',
  Galileo: 'Galileo',
  Doppler: 'Dopler',
  Carnot: 'Karno',
  Coulomb: 'Kulom',
  Ørsted: 'Ersted',
  Hans: 'Hans',
  Christian: 'Kristian',
  Lorentz: 'Lorens',
  Lenz: 'Lens',
  Stern: 'Stern',
  Gerlach: 'Gerlakh',
  MRI: 'em-er-i',
  NMR: 'en-em-er',
  PLN: 'pe-el-en',
  Charles: 'Syarl',
  Augustin: 'Ogustan',
  Faraday: 'Faradei',
  Ohm: 'Om',
  Daniell: 'Daniel',
  Avogadro: 'Avogadro',
  Maxwell: 'Maksvel',
  Ludwig: 'Ludvig',
  Gibbs: 'Gibs',
  Celsius: 'Selsius',
  Young: 'Yang',
  Bragg: 'Brag',
  Broglie: 'Broi',
  Davisson: 'Devison',
  Germer: 'Germer',
  Schrödinger: 'Syrodinger',
  headphone: 'hedfon',
  fret: 'fret',
  Taipei: 'Taipei',
  deuterium: 'deuterium',
  nitrogen: 'nitrogen',
};

export const ttsText = (line: Line) => {
  if (line.tts) return line.tts;
  return line.text
    .split(/(\s+)/)
    .map((tok) => {
      const m = tok.match(/^([A-Za-zÀ-ž]+)([.,;:!?]*)$/);
      if (!m) return tok;
      const [, core, punct] = m;
      if (core.length === 1 && LETTER[core]) return LETTER[core] + punct;
      if (WORD[core]) return WORD[core] + punct;
      return tok;
    })
    .join('');
};
