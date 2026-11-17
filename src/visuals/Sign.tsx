import type { SignId, T } from '../content/types';
import { useT } from '../i18n/useT';

/**
 * Road signs drawn as SVG. Lettering on signs stays in English, as on U.S.
 * roads. Accessible names are bilingual. Pictograms are simplified but keep
 * the official shape and color for each sign type.
 */
const RED = '#C8102E', YEL = '#FFCD00', YG = '#C6E000', ORG = '#F7801E', GRN = '#00703C', BLU = '#0057A8', BRN = '#6B3F1F', BLK = '#111', WHT = '#fff';

export const SIGN_NAMES: Record<SignId, T> = {
  stop: ['STOP sign (red octagon)', 'Señal de ALTO, dice STOP (octágono rojo)'],
  yield: ['YIELD sign (red and white downward triangle)', 'Señal de CEDA EL PASO, dice YIELD (triángulo rojo y blanco hacia abajo)'],
  'rr-advance': ['Railroad crossing advance warning (round yellow sign with X and RR)', 'Aviso de cruce de ferrocarril (señal redonda amarilla con X y RR)'],
  crossbuck: ['Railroad crossbuck (white X-shaped sign)', 'Cruz de ferrocarril (señal blanca en forma de X)'],
  'warning-blank': ['Diamond-shaped yellow warning sign', 'Señal de advertencia amarilla en forma de rombo'],
  school: ['School zone sign (five-sided, yellow-green, two children)', 'Señal de zona escolar (cinco lados, amarillo verdoso, dos niños)'],
  'school-crossing': ['School crossing sign (five-sided with downward arrow)', 'Señal de cruce escolar (cinco lados con flecha hacia abajo)'],
  'no-passing-pennant': ['No passing zone pennant (sideways yellow triangle)', 'Banderín de zona de no rebasar (triángulo amarillo de lado)'],
  'do-not-enter': ['DO NOT ENTER sign (red circle with white bar)', 'Señal DO NOT ENTER, no entre (círculo rojo con barra blanca)'],
  'wrong-way': ['WRONG WAY sign (red rectangle)', 'Señal WRONG WAY, sentido contrario (rectángulo rojo)'],
  'one-way': ['ONE WAY sign (black and white arrow)', 'Señal ONE WAY, un solo sentido (flecha blanca y negra)'],
  'speed-limit-30': ['SPEED LIMIT 30 sign', 'Señal SPEED LIMIT 30, límite de velocidad 30'],
  'no-turn-on-red': ['NO TURN ON RED sign', 'Señal NO TURN ON RED, no dar vuelta en rojo'],
  'no-u-turn': ['No U-turn sign (U arrow with red circle and slash)', 'Señal de no vuelta en U (flecha en U con círculo rojo y diagonal)'],
  'no-right-turn': ['No right turn sign (arrow with red circle and slash)', 'Señal de no vuelta a la derecha (flecha con círculo rojo y diagonal)'],
  merge: ['Merge warning sign (yellow diamond, two lanes joining)', 'Señal de incorporación (rombo amarillo, dos carriles que se unen)'],
  'lane-ends': ['Lane reduction warning sign (yellow diamond)', 'Señal de reducción de carriles (rombo amarillo)'],
  'keep-right': ['KEEP RIGHT sign (arrow passing to the right of an island)', 'Señal KEEP RIGHT, manténgase a la derecha (flecha que pasa a la derecha de una isla)'],
  'slow-moving': ['Slow-moving vehicle emblem (orange triangle with red border)', 'Emblema de vehículo lento (triángulo naranja con borde rojo)'],
  'signal-ahead': ['Signal ahead warning sign (yellow diamond with traffic light)', 'Señal de semáforo adelante (rombo amarillo con semáforo)'],
  'stop-ahead': ['Stop ahead warning sign', 'Señal de alto adelante'],
  'pedestrian-crossing': ['Pedestrian crossing sign (yellow-green diamond with a person walking)', 'Señal de cruce peatonal (rombo amarillo verdoso con persona caminando)'],
  slippery: ['Slippery when wet sign (car with skid marks)', 'Señal de pavimento resbaloso (auto con huellas de derrape)'],
  workers: ['Workers ahead sign (orange diamond)', 'Señal de trabajadores adelante (rombo naranja)'],
  flagger: ['Flagger ahead sign (orange diamond, person with flag)', 'Señal de abanderado adelante (rombo naranja, persona con bandera)'],
  'all-way': ['STOP sign with ALL-WAY plaque', 'Señal de STOP con placa ALL-WAY'],
  'divided-highway': ['Divided highway begins sign', 'Señal de inicio de carretera dividida'],
  'two-way-traffic': ['Two-way traffic sign', 'Señal de tráfico en dos sentidos'],
  'curve-right': ['Curve to the right warning sign', 'Señal de curva a la derecha'],
  'disability-parking': ['Reserved parking for persons with disabilities sign', 'Señal de estacionamiento reservado para personas con discapacidad'],
  'guide-green': ['Green guide sign', 'Señal informativa verde'],
  'services-blue': ['Blue services sign', 'Señal azul de servicios'],
  'recreation-brown': ['Brown recreation sign', 'Señal café de recreación'],
};

const Diamond = ({ fill, children }: { fill: string; children?: React.ReactNode }) => (
  <g>
    <rect x="15" y="15" width="70" height="70" rx="6" transform="rotate(45 50 50)" fill={fill} stroke={BLK} strokeWidth="3" />
    <rect x="19" y="19" width="62" height="62" rx="4" transform="rotate(45 50 50)" fill="none" stroke={BLK} strokeWidth="2" />
    {children}
  </g>
);

const RectSign = ({ fill = WHT, stroke = BLK, h = 70, children }: { fill?: string; stroke?: string; h?: number; children?: React.ReactNode }) => (
  <g>
    <rect x="18" y={50 - h / 2} width="64" height={h} rx="4" fill={fill} stroke={stroke} strokeWidth="2.5" />
    {children}
  </g>
);

const Txt = ({ y, s = 12, fill = BLK, children, x = 50, w = 800 }: { y: number; s?: number; fill?: string; children: React.ReactNode; x?: number; w?: number }) => (
  <text x={x} y={y} textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight={w} fontSize={s} fill={fill}>{children}</text>
);

const Slash = () => (
  <g>
    <circle cx="50" cy="50" r="26" fill="none" stroke={RED} strokeWidth="5" />
    <line x1="32" y1="32" x2="68" y2="68" stroke={RED} strokeWidth="5" />
  </g>
);

const Person = ({ x, y, s = 1, fill = BLK }: { x: number; y: number; s?: number; fill?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill} stroke={fill}>
    <circle cx="0" cy="-14" r="4" />
    <path d="M0 -9 L-2 4 L-6 14 M-2 4 L4 14 M0 -6 L-7 0 M0 -6 L6 -1" strokeWidth="3" fill="none" strokeLinecap="round" />
  </g>
);

const octagon = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 8) + (i * Math.PI) / 4;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
};

function body(id: SignId): React.ReactNode {
  switch (id) {
    case 'stop':
      return (<g><polygon points={octagon(50, 50, 44)} fill={RED} /><polygon points={octagon(50, 50, 40)} fill="none" stroke={WHT} strokeWidth="3" /><Txt y={58} s={22} fill={WHT}>STOP</Txt></g>);
    case 'all-way':
      return (<g><polygon points={octagon(50, 40, 34)} fill={RED} /><polygon points={octagon(50, 40, 31)} fill="none" stroke={WHT} strokeWidth="2.5" /><Txt y={47} s={17} fill={WHT}>STOP</Txt><rect x="24" y="78" width="52" height="18" fill={RED} stroke={WHT} strokeWidth="2" /><Txt y={91} s={10} fill={WHT}>ALL-WAY</Txt></g>);
    case 'yield':
      return (<g><polygon points="6,12 94,12 50,90" fill={RED} /><polygon points="22,22 78,22 50,70" fill={WHT} /><Txt y={40} s={11}>YIELD</Txt></g>);
    case 'stop-ahead':
      return (<Diamond fill={YEL}><polygon points={octagon(50, 40, 11)} fill={RED} /><path d="M50 72 L50 54 M44 60 L50 52 L56 60" stroke={BLK} strokeWidth="4" fill="none" /></Diamond>);
    case 'rr-advance':
      return (<g><circle cx="50" cy="50" r="44" fill={YEL} stroke={BLK} strokeWidth="3" /><line x1="22" y1="22" x2="78" y2="78" stroke={BLK} strokeWidth="6" /><line x1="78" y1="22" x2="22" y2="78" stroke={BLK} strokeWidth="6" /><Txt x={26} y={56} s={16}>R</Txt><Txt x={74} y={56} s={16}>R</Txt></g>);
    case 'crossbuck':
      return (<g><g transform="rotate(35 50 50)"><rect x="4" y="40" width="92" height="20" fill={WHT} stroke={BLK} strokeWidth="2" /><Txt y={54} s={9}>RAILROAD</Txt></g><g transform="rotate(-35 50 50)"><rect x="4" y="40" width="92" height="20" fill={WHT} stroke={BLK} strokeWidth="2" /><Txt y={54} s={9}>CROSSING</Txt></g></g>);
    case 'warning-blank':
      return <Diamond fill={YEL} />;
    case 'school':
    case 'school-crossing':
      return (<g><polygon points="50,6 92,40 92,94 8,94 8,40" fill={YG} stroke={BLK} strokeWidth="3" /><Person x={40} y={66} s={1.2} /><Person x={60} y={68} s={1.05} />{id === 'school-crossing' && <path d="M50 78 L50 90 M44 84 L50 91 L56 84" stroke={BLK} strokeWidth="3" fill="none" />}</g>);
    case 'no-passing-pennant':
      return (<g><polygon points="4,22 4,78 96,50" fill={YEL} stroke={BLK} strokeWidth="3" /><Txt x={36} y={42} s={9}>NO</Txt><Txt x={36} y={53} s={9}>PASSING</Txt><Txt x={36} y={64} s={9}>ZONE</Txt></g>);
    case 'do-not-enter':
      return (<g><rect x="8" y="8" width="84" height="84" fill={WHT} stroke={BLK} strokeWidth="1.5" /><circle cx="50" cy="50" r="38" fill={RED} /><rect x="20" y="44" width="60" height="12" fill={WHT} /><Txt y={36} s={10} fill={WHT}>DO NOT</Txt><Txt y={72} s={10} fill={WHT}>ENTER</Txt></g>);
    case 'wrong-way':
      return (<RectSign fill={RED} stroke={WHT} h={56}><rect x="21" y="25" width="58" height="50" fill="none" stroke={WHT} strokeWidth="2" /><Txt y={46} s={13} fill={WHT}>WRONG</Txt><Txt y={63} s={13} fill={WHT}>WAY</Txt></RectSign>);
    case 'one-way':
      return (<g><rect x="4" y="32" width="92" height="36" fill={BLK} /><path d="M10 50 L70 50 L70 40 L92 50 L70 60 L70 50" fill={WHT} stroke={WHT} strokeWidth="4" strokeLinejoin="round" /><rect x="12" y="44" width="46" height="12" fill={WHT} /><Txt x={35} y={54} s={9}>ONE WAY</Txt></g>);
    case 'speed-limit-30':
      return (<RectSign h={84}><Txt y={28} s={11}>SPEED</Txt><Txt y={41} s={11}>LIMIT</Txt><Txt y={77} s={34}>30</Txt></RectSign>);
    case 'no-turn-on-red':
      return (<RectSign h={74}><Txt y={30} s={13}>NO TURN</Txt><Txt y={50} s={13}>ON</Txt><Txt y={72} s={13}>RED</Txt></RectSign>);
    case 'no-u-turn':
      return (<RectSign h={74}><path d="M60 70 L60 42 A10 10 0 0 0 40 42 L40 62 M33 56 L40 66 L47 56" stroke={BLK} strokeWidth="5" fill="none" /><Slash /></RectSign>);
    case 'no-right-turn':
      return (<RectSign h={74}><path d="M42 72 L42 46 L60 46 M54 38 L64 46 L54 54" stroke={BLK} strokeWidth="5" fill="none" /><Slash /></RectSign>);
    case 'merge':
      return (<Diamond fill={YEL}><path d="M50 78 L50 24 M42 32 L50 22 L58 32 M34 72 Q34 54 49 48" stroke={BLK} strokeWidth="5" fill="none" /></Diamond>);
    case 'lane-ends':
      return (<Diamond fill={YEL}><path d="M40 78 L40 24 M60 78 L60 56 L44 40 L44 24" stroke={BLK} strokeWidth="5" fill="none" /></Diamond>);
    case 'keep-right':
      return (<RectSign h={84}><ellipse cx="44" cy="62" rx="9" ry="16" fill={BLK} /><path d="M50 82 C70 70 66 46 50 30 M44 34 L50 26 L58 32" stroke={BLK} strokeWidth="5" fill="none" /></RectSign>);
    case 'slow-moving':
      return (<g><polygon points="50,8 94,86 6,86" fill={RED} /><polygon points="50,24 80,78 20,78" fill={ORG} /></g>);
    case 'signal-ahead':
      return (<Diamond fill={YEL}><rect x="41" y="26" width="18" height="48" rx="3" fill={BLK} /><circle cx="50" cy="35" r="6" fill={RED} /><circle cx="50" cy="50" r="6" fill={YEL} /><circle cx="50" cy="65" r="6" fill={GRN} /></Diamond>);
    case 'pedestrian-crossing':
      return (<Diamond fill={YG}><Person x={50} y={58} s={1.6} /></Diamond>);
    case 'slippery':
      return (<Diamond fill={YEL}><rect x="40" y="26" width="20" height="24" rx="4" fill={BLK} /><path d="M38 56 q6 6 0 12 q-6 6 0 12 M62 56 q-6 6 0 12 q6 6 0 12" stroke={BLK} strokeWidth="3.5" fill="none" /></Diamond>);
    case 'workers':
      return (<Diamond fill={ORG}><Person x={46} y={60} s={1.5} /><path d="M54 70 L66 60 L70 70 Z" fill={BLK} /></Diamond>);
    case 'flagger':
      return (<Diamond fill={ORG}><Person x={46} y={62} s={1.5} /><line x1="56" y1="40" x2="56" y2="66" stroke={BLK} strokeWidth="2.5" /><rect x="56" y="40" width="12" height="9" fill={BLK} /></Diamond>);
    case 'divided-highway':
      return (<Diamond fill={YEL}><path d="M38 80 L38 54 Q38 44 46 40 L46 22 M62 80 L62 54 Q62 44 54 40 L54 22" stroke={BLK} strokeWidth="4.5" fill="none" /><ellipse cx="50" cy="62" rx="5" ry="12" fill={BLK} /></Diamond>);
    case 'two-way-traffic':
      return (<Diamond fill={YEL}><path d="M40 78 L40 28 M33 36 L40 26 L47 36 M60 22 L60 72 M53 64 L60 74 L67 64" stroke={BLK} strokeWidth="4.5" fill="none" /></Diamond>);
    case 'curve-right':
      return (<Diamond fill={YEL}><path d="M44 80 L44 56 Q44 40 60 30 M52 26 L64 28 L60 40" stroke={BLK} strokeWidth="5" fill="none" /></Diamond>);
    case 'disability-parking':
      return (<RectSign h={84}><Txt y={26} s={9}>RESERVED</Txt><Txt y={37} s={9}>PARKING</Txt><rect x="34" y="44" width="32" height="32" fill={BLU} /><circle cx="50" cy="50" r="3" fill={WHT} /><path d="M50 54 L50 64 L58 64 L61 72 M44 60 a8 8 0 1 0 11 10" stroke={WHT} strokeWidth="2.5" fill="none" /></RectSign>);
    case 'guide-green':
      return (<RectSign fill={GRN} stroke={WHT} h={56}><Txt y={46} s={11} fill={WHT}>Chicago</Txt><Txt y={62} s={11} fill={WHT}>12 →</Txt></RectSign>);
    case 'services-blue':
      return (<RectSign fill={BLU} stroke={WHT} h={56}><Txt y={46} s={11} fill={WHT}>GAS</Txt><Txt y={62} s={11} fill={WHT}>FOOD</Txt></RectSign>);
    case 'recreation-brown':
      return (<RectSign fill={BRN} stroke={WHT} h={56}><Txt y={46} s={10} fill={WHT}>STATE</Txt><Txt y={62} s={10} fill={WHT}>PARK</Txt></RectSign>);
  }
}

export function Sign({ id, size = 120, decorative = false }: { id: SignId; size?: number; decorative?: boolean }) {
  const { c } = useT();
  const name = c(SIGN_NAMES[id]);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : name} aria-hidden={decorative || undefined} className="sign-svg">
      {!decorative && <title>{name}</title>}
      {body(id)}
    </svg>
  );
}
