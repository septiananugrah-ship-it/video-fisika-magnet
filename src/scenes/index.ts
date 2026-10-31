import type React from 'react';
import {Generator} from './Generator';
import {Hook} from './Hook';
import {Induction} from './Induction';
import {Lorentz} from './Lorentz';
import {MRI} from './MRI';
import {MassSpec} from './MassSpec';
import {Motor} from './Motor';
import {NMR} from './NMR';
import {Oersted} from './Oersted';
import {Outro} from './Outro';
import {Poles} from './Poles';
import {Recap} from './Recap';
import {Roadmap} from './Roadmap';
import {Spin} from './Spin';
import {Title} from './Title';
import {WireForce} from './WireForce';

// Pemetaan id adegan di naskah → komponen visual.
export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  title: Title,
  roadmap: Roadmap,
  poles: Poles,
  oersted: Oersted,
  lorentz: Lorentz,
  wireforce: WireForce,
  induction: Induction,
  massspec: MassSpec,
  spin: Spin,
  nmr: NMR,
  motor: Motor,
  generator: Generator,
  mri: MRI,
  recap: Recap,
  outro: Outro,
};
