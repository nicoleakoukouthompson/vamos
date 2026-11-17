import type { SignalId, T } from '../content/types';
import { useT } from '../i18n/useT';

/**
 * Traffic and pedestrian signals. Each one has a visible text caption so that
 * meaning never depends on color alone, and "flashing" is stated in words
 * (the blink animation is turned off under reduced motion).
 */
export const SIGNAL_NAMES: Record<SignalId, T> = {
  red: ['Steady red light', 'Luz roja fija'],
  yellow: ['Steady yellow light', 'Luz amarilla fija'],
  green: ['Steady green light', 'Luz verde fija'],
  'flashing-red': ['Flashing red light', 'Luz roja intermitente'],
  'flashing-yellow': ['Flashing yellow light', 'Luz amarilla intermitente'],
  'red-arrow-left': ['Steady red left arrow', 'Flecha roja fija a la izquierda'],
  'flashing-yellow-arrow-left': ['Flashing yellow left arrow', 'Flecha amarilla intermitente a la izquierda'],
  'green-arrow-left': ['Green left arrow', 'Flecha verde a la izquierda'],
  'red-with-green-arrow': ['Red light with a green right arrow', 'Luz roja con flecha verde a la derecha'],
  dark: ['Signal not working (all lights off)', 'Semáforo sin funcionar (todas las luces apagadas)'],
  'ped-walk': ['Pedestrian signal: walking person', 'Señal peatonal: persona caminando'],
  'ped-flashing-hand': ['Pedestrian signal: flashing upraised hand', 'Señal peatonal: mano levantada intermitente'],
  'lane-red-x': ['Lane signal: red X over a lane', 'Señal de carril: X roja sobre un carril'],
};

const OFF = '#2b2f36';
const R = '#E0342B', Y = '#F6B800', G = '#1FAE5B';

type Lamp = { color: string; on: boolean; flash?: boolean; arrow?: 'left' | 'right' };

function lamps(id: SignalId): Lamp[] | null {
  switch (id) {
    case 'red': return [{ color: R, on: true }, { color: Y, on: false }, { color: G, on: false }];
    case 'yellow': return [{ color: R, on: false }, { color: Y, on: true }, { color: G, on: false }];
    case 'green': return [{ color: R, on: false }, { color: Y, on: false }, { color: G, on: true }];
    case 'flashing-red': return [{ color: R, on: true, flash: true }, { color: Y, on: false }, { color: G, on: false }];
    case 'flashing-yellow': return [{ color: R, on: false }, { color: Y, on: true, flash: true }, { color: G, on: false }];
    case 'red-arrow-left': return [{ color: R, on: true, arrow: 'left' }, { color: Y, on: false, arrow: 'left' }, { color: G, on: false, arrow: 'left' }];
    case 'flashing-yellow-arrow-left': return [{ color: R, on: false, arrow: 'left' }, { color: Y, on: true, flash: true, arrow: 'left' }, { color: G, on: false, arrow: 'left' }];
    case 'green-arrow-left': return [{ color: R, on: false, arrow: 'left' }, { color: Y, on: false, arrow: 'left' }, { color: G, on: true, arrow: 'left' }];
    case 'red-with-green-arrow': return [{ color: R, on: true }, { color: Y, on: false }, { color: G, on: true, arrow: 'right' }];
    case 'dark': return [{ color: R, on: false }, { color: Y, on: false }, { color: G, on: false }];
    default: return null;
  }
}

const Arrow = ({ cx, cy, dir, color }: { cx: number; cy: number; dir: 'left' | 'right'; color: string }) => (
  <path
    d={dir === 'left' ? `M${cx + 8} ${cy} L${cx - 6} ${cy} M${cx - 1} ${cy - 6} L${cx - 8} ${cy} L${cx - 1} ${cy + 6}` : `M${cx - 8} ${cy} L${cx + 6} ${cy} M${cx + 1} ${cy - 6} L${cx + 8} ${cy} L${cx + 1} ${cy + 6}`}
    stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"
  />
);

export function Signal({ id, size = 120 }: { id: SignalId; size?: number }) {
  const { c } = useT();
  const name = c(SIGNAL_NAMES[id]);
  const ls = lamps(id);
  let art: React.ReactNode;
  if (ls) {
    art = (
      <g>
        <rect x="30" y="4" width="40" height="112" rx="8" fill="#14171c" />
        {ls.map((l, i) => {
          const cy = 24 + i * 36;
          const fill = l.on && !l.arrow ? l.color : OFF;
          return (
            <g key={i} className={l.on && l.flash ? 'blink' : undefined}>
              <circle cx="50" cy={cy} r="14" fill={fill} stroke="#000" strokeWidth="1" />
              {l.arrow && <Arrow cx={50} cy={cy} dir={l.arrow} color={l.on ? l.color : '#4a4f57'} />}
            </g>
          );
        })}
      </g>
    );
  } else if (id === 'ped-walk' || id === 'ped-flashing-hand') {
    art = (
      <g>
        <rect x="18" y="18" width="64" height="84" rx="6" fill="#14171c" />
        {id === 'ped-walk' ? (
          <g stroke="#f4f4f4" fill="#f4f4f4"><circle cx="50" cy="40" r="6" /><path d="M50 47 L47 66 L40 82 M47 66 L56 82 M49 52 L40 60 M49 52 L58 58" strokeWidth="5" fill="none" strokeLinecap="round" /></g>
        ) : (
          <g className="blink" fill="#F28C28"><rect x="38" y="44" width="24" height="30" rx="6" /><rect x="38" y="30" width="5" height="18" rx="2" /><rect x="44" y="26" width="5" height="20" rx="2" /><rect x="50" y="27" width="5" height="19" rx="2" /><rect x="56" y="31" width="5" height="16" rx="2" /><rect x="30" y="52" width="10" height="5" rx="2" transform="rotate(-30 35 54)" /></g>
        )}
      </g>
    );
  } else {
    art = (
      <g>
        <rect x="14" y="20" width="72" height="72" rx="6" fill="#14171c" />
        <path d="M30 36 L70 76 M70 36 L30 76" stroke={R} strokeWidth="9" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <figure className="signal-fig">
      <svg viewBox="0 0 100 120" width={size} height={size * 1.2} role="img" aria-label={name}>
        <title>{name}</title>
        {art}
      </svg>
      <figcaption>{name}</figcaption>
    </figure>
  );
}
