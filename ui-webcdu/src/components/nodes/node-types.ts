import { ALERTA } from './ALERTA';
import { FIMPRG } from './FIMPRG';
import { DERIVA } from './DERIVA';
import { SOBDES } from './SOBDES';
import { ARITIMETIC } from './ARITMETIC';
import { MINMAX } from './MINMAX';
import { GENERIC1P } from './GENERIC1P';
import { NOT } from './NOT';
import { LOGIC } from './LOGIC';
import { X2 } from './X2';
import { XK } from './XK';
import { GENERIC2P } from './GENERIC2P';
import { GENERIC3P } from './GENERIC3P';
import { GENERIC4P } from './GENERIC4P';
import { HISTE1 } from './HISTE1';
import { PULSO } from './PULSO';
import { RAMPA } from './RAMPA';
import { MONEST } from './MONEST';
import { OFFSET } from './OFFSET';
import { DLAYONOFF } from './DLAYONOFF';
import { GENERIC } from './GENERIC';
import { ATAN2 } from './ATAN2';
import { HOLD } from './HOLD';
import { ATRASO } from './ATRASO';
import { PROINT } from './PROINT';
import { ORD1 } from './ORD1';
import { FRACAO } from './FRACAO';
import { Placeholder } from './PLACEHOLDER';
import { COMPAR } from './COMPAR';
import { ENTRAD } from './ENTRAD';
import { EXPORT } from './EXPORT';
import { FUNCAO } from './FUNCAO';
import { LEDLAG } from './LEDLAG';
import { GANHO } from './GANHO';
import { IMPORT } from './IMPORT';
import { SAIDA } from './SAIDA';
import { LIMITA } from './LIMITA';
import { POLS } from './POLS';
import { LAGNL } from './LAGNL';
import { WSHOUT } from './WSHOUT';
import { SELET2 } from './SELET2';
import { INTRES } from './INTRES';

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