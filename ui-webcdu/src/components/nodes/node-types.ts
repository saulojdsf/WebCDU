import { ALERTA } from './ALERTA';
import { ARITIMETIC } from './ARITMETIC';
import { ATAN2 } from './ATAN2';
import { ATRASO } from './ATRASO';
import { COMPAR } from './COMPAR';
import { DERIVA } from './DERIVA';
import { DLAYONOFF } from './DLAYONOFF';
import { ENTRAD } from './ENTRAD';
import { EXPORT } from './EXPORT';
import { FIMPRG } from './FIMPRG';
import { FRACAO } from './FRACAO';
import { FUNCAO } from './FUNCAO';
import { GANHO } from './GANHO';
import { GENERIC } from './GENERIC';
import { GENERIC1P } from './GENERIC1P';
import { GENERIC2P } from './GENERIC2P';
import { GENERIC3P } from './GENERIC3P';
import { GENERIC4P } from './GENERIC4P';
import { HISTE1 } from './HISTE1';
import { HOLD } from './HOLD';
import { IMPORT } from './IMPORT';
import { INTRES } from './INTRES';
import { LAGNL } from './LAGNL';
import { LEDLAG } from './LEDLAG';
import { LIMITA } from './LIMITA';
import { LOGIC } from './LOGIC';
import { MINMAX } from './MINMAX';
import { MONEST } from './MONEST';
import { NOT } from './NOT';
import { OFFSET } from './OFFSET';
import { ORD1 } from './ORD1';
import { Placeholder } from './PLACEHOLDER';
import { POLS } from './POLS';
import { PROINT } from './PROINT';
import { PULSO } from './PULSO';
import { RAMPA } from './RAMPA';
import { SAIDA } from './SAIDA';
import { SELET2 } from './SELET2';
import { SOBDES } from './SOBDES';
import { WSHOUT } from './WSHOUT';
import { X2 } from './X2';
import { XK } from './XK';

// Central registry of all node components mapped by their GEdit/CFC tag.
// Keeping it isolated makes App.tsx lighter and easier to read/maintain.
export const BASE_NODE_TYPES = {
  alerta: ALERTA,
  fimprg: FIMPRG,
  deriva: DERIVA,
  subida: SOBDES,
  descid: SOBDES,
  soma: ARITIMETIC,
  divsao: ARITIMETIC,
  multpl: ARITIMETIC,
  min: MINMAX,
  max: MINMAX,
  noise: GENERIC1P,
  not: NOT,
  fflop1: LOGIC,
  x2: X2,
  xk: XK,
  reta: GENERIC2P,
  exp: GENERIC3P,
  deadb1: GENERIC4P,
  deadb2: GENERIC4P,
  histe1: HISTE1,
  sat01: GENERIC4P,
  steps: GENERIC4P,
  pulso: PULSO,
  rampa: RAMPA,
  monest: MONEST,
  offset: OFFSET,
  dlayon: DLAYONOFF,
  dlayof: DLAYONOFF,
  dismax: GENERIC3P,
  dismin: GENERIC3P,
  delay: GENERIC,
  atan2: ATAN2,
  and: LOGIC,
  or: LOGIC,
  xor: LOGIC,
  nand: LOGIC,
  nor: LOGIC,
  nxor: LOGIC,
  thold: HOLD,
  shold: HOLD,
  atraso: ATRASO,
  fex: GENERIC,
  proint: PROINT,
  ord1: ORD1,
  fracao: FRACAO,
  placeholder: Placeholder,
  lt: COMPAR,
  le: COMPAR,
  gt: COMPAR,
  ge: COMPAR,
  eq: COMPAR,
  ne: COMPAR,
  entrad: ENTRAD,
  export: EXPORT,
  abs: FUNCAO,
  acos: FUNCAO,
  asin: FUNCAO,
  atan: FUNCAO,
  cos: FUNCAO,
  degree: FUNCAO,
  invrs: FUNCAO,
  log: FUNCAO,
  log10: FUNCAO,
  menos: FUNCAO,
  radian: FUNCAO,
  round: FUNCAO,
  sin: FUNCAO,
  sinal: FUNCAO,
  sqrt: FUNCAO,
  ledlag: LEDLAG,
  ldlag2: LEDLAG,
  tan: FUNCAO,
  trunc: FUNCAO,
  ganho: GANHO,
  import: IMPORT,
  saida: SAIDA,
  limita: LIMITA,
  ratelm: LIMITA,
  pols: POLS,
  lagnl: LAGNL,
  wshout: WSHOUT,
  wshou2: WSHOUT,
  proin2: PROINT,
  selet2: SELET2,
  intres: INTRES,
} as const; 