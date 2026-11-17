import type { SceneId, T } from '../content/types';
import { useT } from '../i18n/useT';

/**
 * Top-down traffic diagrams built from a small set of primitives.
 * Conventions used in every scene (also shown in the legend):
 * - Your car is blue, outlined in white, with a "YOU" label and a stripe.
 * - Every vehicle has a pointed front showing its direction of travel.
 * - Other road users are labeled with letters or words, never color alone.
 * - Items marked `reveal` appear only after answering, so diagrams never
 *   give away the answer.
 */

type Heading = 'n' | 's' | 'e' | 'w';
type Item =
  | { k: 'road-h'; y: number; h: number; x1?: number; x2?: number }
  | { k: 'road-v'; x: number; w: number; y1?: number; y2?: number }
  | { k: 'line'; x1: number; y1: number; x2: number; y2: number; color: 'y' | 'w'; dash?: boolean; width?: number }
  | { k: 'rect'; x: number; y: number; w: number; h: number; fill: string; opacity?: number; pattern?: 'hatch' | 'zebra' }
  | { k: 'car'; x: number; y: number; h: Heading; you?: boolean; label?: T | string; color?: string; len?: number; wid?: number; kind?: 'car' | 'bus' | 'truck' | 'bike' | 'moto' | 'ambulance' | 'schoolbus'; reveal?: boolean }
  | { k: 'ped'; x: number; y: number; label?: T; reveal?: boolean; ghost?: boolean }
  | { k: 'stop'; x: number; y: number }
  | { k: 'light'; x: number; y: number; color: 'r' | 'g' | 'y' }
  | { k: 'arrow'; d: string; color?: string; reveal?: boolean; dash?: boolean }
  | { k: 'text'; x: number; y: number; t: T | string; size?: number; anchor?: 'start' | 'middle' | 'end'; reveal?: boolean; color?: string }
  | { k: 'badge'; x: number; y: number; t: string; reveal?: boolean }
  | { k: 'wheel'; x: number; y: number; angle: number }
  | { k: 'curb'; x1: number; y1: number; x2: number; y2: number }
  | { k: 'tracks'; y: number }
  | { k: 'gate'; x: number; y: number; w: number };

interface SceneDef {
  title: T;
  items: Item[];
}

const YOU: T = ['YOU', 'USTED'];
const ROAD = '#3a3f47';
const BLUE = '#1f5fd6';

const H = (y: number, h = 60, x1 = 0, x2 = 320): Item => ({ k: 'road-h', y, h, x1, x2 });
const V = (x: number, w = 60, y1 = 0, y2 = 240): Item => ({ k: 'road-v', x, w, y1, y2 });
const crossroads = (): Item[] => [
  H(90), V(130),
  { k: 'line', x1: 0, y1: 120, x2: 128, y2: 120, color: 'y', dash: true },
  { k: 'line', x1: 192, y1: 120, x2: 320, y2: 120, color: 'y', dash: true },
  { k: 'line', x1: 160, y1: 0, x2: 160, y2: 88, color: 'y', dash: true },
  { k: 'line', x1: 160, y1: 152, x2: 160, y2: 240, color: 'y', dash: true },
];
const stops4 = (): Item[] => [
  { k: 'stop', x: 202, y: 168 }, { k: 'stop', x: 118, y: 72 }, { k: 'stop', x: 112, y: 162 }, { k: 'stop', x: 208, y: 78 },
];

export const SCENES: Record<SceneId, SceneDef> = {
  'four-way-arrival': {
    title: ['Four-way stop: car A stopped first', 'Alto de cuatro vías: el auto A se detuvo primero'],
    items: [...crossroads(), ...stops4(),
      { k: 'car', x: 175, y: 180, h: 'n', you: true },
      { k: 'car', x: 100, y: 135, h: 'e', label: 'A', color: '#b5651d' },
      { k: 'text', x: 70, y: 170, t: ['A stopped first', 'A se detuvo primero'], size: 10 },
      { k: 'badge', x: 100, y: 112, t: '1', reveal: true }, { k: 'badge', x: 196, y: 180, t: '2', reveal: true }],
  },
  'four-way-same-time': {
    title: ['Four-way stop: arriving at the same time', 'Alto de cuatro vías: llegan al mismo tiempo'],
    items: [...crossroads(), ...stops4(),
      { k: 'car', x: 175, y: 180, h: 'n', you: true },
      { k: 'car', x: 222, y: 105, h: 'w', label: ['Red', 'Rojo'], color: '#c0392b' },
      { k: 'text', x: 250, y: 135, t: ['On your right', 'A su derecha'], size: 10 },
      { k: 'badge', x: 222, y: 82, t: '1', reveal: true }, { k: 'badge', x: 196, y: 180, t: '2', reveal: true }],
  },
  'uncontrolled-same-time': {
    title: ['Intersection with no signs or signals', 'Intersección sin señales ni semáforos'],
    items: [...crossroads(),
      { k: 'car', x: 175, y: 180, h: 'n', you: true },
      { k: 'car', x: 222, y: 105, h: 'w', label: 'B', color: '#7d3c98' },
      { k: 'text', x: 160, y: 232, t: ['No signs, no signals', 'Sin señales ni semáforos'], size: 10 },
      { k: 'badge', x: 222, y: 82, t: '1', reveal: true }, { k: 'badge', x: 196, y: 180, t: '2', reveal: true }],
  },
  't-intersection': {
    title: ['T intersection with no controls', 'Intersección en T sin control'],
    items: [H(60), V(130, 60, 120, 240),
      { k: 'line', x1: 0, y1: 90, x2: 320, y2: 90, color: 'y', dash: true },
      { k: 'line', x1: 160, y1: 122, x2: 160, y2: 240, color: 'y', dash: true },
      { k: 'car', x: 175, y: 165, h: 'n', you: true },
      { k: 'car', x: 250, y: 75, h: 'w', label: 'B', color: '#7d3c98' },
      { k: 'text', x: 60, y: 50, t: ['Through road', 'Calle que continúa'], size: 10 },
      { k: 'text', x: 245, y: 200, t: ['Your road ends', 'Su calle termina'], size: 10 }],
  },
  'alley-exit': {
    title: ['Leaving an alley onto a city street', 'Salir de un callejón a una calle'],
    items: [
      { k: 'rect', x: 125, y: 0, w: 70, h: 120, fill: '#5a5f66' },
      { k: 'rect', x: 0, y: 120, w: 320, h: 30, fill: '#c9c2b4' },
      { k: 'curb', x1: 0, y1: 150, x2: 320, y2: 150 },
      H(150, 90),
      { k: 'line', x1: 0, y1: 195, x2: 320, y2: 195, color: 'y', dash: true },
      { k: 'car', x: 160, y: 80, h: 's', you: true },
      { k: 'ped', x: 230, y: 136, label: ['Person on sidewalk', 'Persona en la banqueta'] },
      { k: 'text', x: 70, y: 112, t: ['Alley', 'Callejón'], size: 10 },
      { k: 'text', x: 40, y: 140, t: ['Sidewalk', 'Banqueta'], size: 10 },
      { k: 'car', x: 40, y: 172, h: 'e', label: 'C', color: '#6c7a89' },
      { k: 'line', x1: 128, y1: 118, x2: 192, y2: 118, color: 'w', width: 3, dash: true },
      { k: 'badge', x: 208, y: 112, t: '1', reveal: true }],
  },
  'left-turn-oncoming': {
    title: ['Waiting to turn left across oncoming traffic', 'Esperando para dar vuelta a la izquierda frente al tráfico'],
    items: [...crossroads(),
      { k: 'car', x: 168, y: 128, h: 'n', you: true },
      { k: 'arrow', d: 'M168 112 Q168 104 120 104' , color: BLUE, dash: true },
      { k: 'car', x: 145, y: 40, h: 's', label: 'B', color: '#6c7a89' },
      { k: 'text', x: 240, y: 200, t: ['Wheels straight while waiting', 'Llantas rectas al esperar'], size: 10, reveal: true }],
  },
  'right-turn-bike': {
    title: ['Turning right across a bike lane', 'Dar vuelta a la derecha cruzando un carril para bicicletas'],
    items: [...crossroads(),
      { k: 'rect', x: 192, y: 152, w: 14, h: 88, fill: '#2f7d4f', opacity: 0.55 },
      { k: 'text', x: 236, y: 230, t: ['Bike lane', 'Carril de bici'], size: 10 },
      { k: 'car', x: 176, y: 178, h: 'n', you: true },
      { k: 'arrow', d: 'M176 160 Q178 128 230 128', color: BLUE, dash: true },
      { k: 'car', x: 199, y: 222, h: 'n', kind: 'bike', label: ['Bicycle', 'Bicicleta'] },
      { k: 'badge', x: 214, y: 210, t: '1', reveal: true }, { k: 'badge', x: 158, y: 178, t: '2', reveal: true }],
  },
  'left-turn-bike': {
    title: ['Turning left with an oncoming bicyclist', 'Vuelta a la izquierda con un ciclista de frente'],
    items: [...crossroads(),
      { k: 'car', x: 168, y: 160, h: 'n', you: true },
      { k: 'arrow', d: 'M168 140 Q168 104 110 104', color: BLUE, dash: true },
      { k: 'car', x: 146, y: 46, h: 's', kind: 'bike', label: ['Bicycle', 'Bicicleta'] },
      { k: 'badge', x: 128, y: 46, t: '1', reveal: true }, { k: 'badge', x: 188, y: 160, t: '2', reveal: true }],
  },
  'crosswalk-marked': {
    title: ['Person in a marked crosswalk', 'Persona en un cruce peatonal marcado'],
    items: [H(80, 80),
      { k: 'line', x1: 0, y1: 120, x2: 320, y2: 120, color: 'y', dash: true },
      { k: 'rect', x: 200, y: 80, w: 30, h: 80, fill: '#fff', pattern: 'zebra' },
      { k: 'line', x1: 190, y1: 122, x2: 190, y2: 160, color: 'w', width: 4 },
      { k: 'car', x: 120, y: 140, h: 'e', you: true },
      { k: 'ped', x: 215, y: 128, label: ['Pedestrian', 'Peatón'] },
      { k: 'text', x: 190, y: 176, t: ['Stop line', 'Línea de alto'], size: 10 },
      { k: 'text', x: 215, y: 72, t: ['Crosswalk', 'Cruce peatonal'], size: 10 }],
  },
  'parked-car-door': {
    title: ['Parked beside a bike lane', 'Estacionado junto a un carril para bicicletas'],
    items: [V(60, 200),
      { k: 'curb', x1: 260, y1: 0, x2: 260, y2: 240 },
      { k: 'rect', x: 260, y: 0, w: 60, h: 240, fill: '#c9c2b4' },
      { k: 'rect', x: 196, y: 0, w: 22, h: 240, fill: '#2f7d4f', opacity: 0.55 },
      { k: 'line', x1: 150, y1: 0, x2: 150, y2: 240, color: 'y', dash: true },
      { k: 'car', x: 239, y: 110, h: 'n', you: true },
      { k: 'car', x: 207, y: 215, h: 'n', kind: 'bike', label: ['Bicycle', 'Bicicleta'] },
      { k: 'car', x: 175, y: 60, h: 'n', label: 'C', color: '#6c7a89' },
      { k: 'text', x: 207, y: 14, t: ['Bike lane', 'Carril de bici'], size: 10 },
      { k: 'text', x: 290, y: 120, t: ['Curb', 'Orilla'], size: 10 },
      { k: 'arrow', d: 'M226 100 L200 88', color: '#c0392b', reveal: true },
      { k: 'text', x: 130, y: 140, t: ['Look back first', 'Mire atrás primero'], size: 10, reveal: true }],
  },
  'school-bus-two-lane': {
    title: ['School bus stopped on a two-lane road', 'Autobús escolar detenido en camino de dos carriles'],
    items: [H(80, 80),
      { k: 'line', x1: 0, y1: 120, x2: 320, y2: 120, color: 'y', dash: true },
      { k: 'car', x: 210, y: 100, h: 'w', kind: 'schoolbus', label: ['School bus', 'Autobús escolar'] },
      { k: 'stop', x: 196, y: 120 },
      { k: 'car', x: 90, y: 140, h: 'e', you: true },
      { k: 'text', x: 160, y: 60, t: ['Red lights flashing, stop arm out', 'Luces rojas intermitentes, brazo de alto extendido'], size: 10 },
      { k: 'text', x: 160, y: 190, t: ['Both directions stop', 'Ambos sentidos se detienen'], size: 11, reveal: true }],
  },
  'school-bus-four-lane': {
    title: ['School bus on the opposite side of a four-lane road', 'Autobús escolar del otro lado de un camino de cuatro carriles'],
    items: [H(50, 140),
      { k: 'line', x1: 0, y1: 118, x2: 320, y2: 118, color: 'y' }, { k: 'line', x1: 0, y1: 122, x2: 320, y2: 122, color: 'y' },
      { k: 'line', x1: 0, y1: 85, x2: 320, y2: 85, color: 'w', dash: true },
      { k: 'line', x1: 0, y1: 155, x2: 320, y2: 155, color: 'w', dash: true },
      { k: 'car', x: 220, y: 68, h: 'w', kind: 'schoolbus', label: ['School bus', 'Autobús escolar'] },
      { k: 'stop', x: 206, y: 86 },
      { k: 'car', x: 90, y: 170, h: 'e', you: true },
      { k: 'text', x: 160, y: 210, t: ['Four lanes, bus going the other way', 'Cuatro carriles, autobús en sentido contrario'], size: 10 },
      { k: 'text', x: 160, y: 40, t: ['Not required to stop; slow down and watch', 'No es obligatorio detenerse; reduzca y observe'], size: 10, reveal: true }],
  },
  'emergency-approach': {
    title: ['Emergency vehicle approaching from behind', 'Vehículo de emergencia acercándose por detrás'],
    items: [V(100, 120),
      { k: 'line', x1: 160, y1: 0, x2: 160, y2: 240, color: 'w', dash: true },
      { k: 'curb', x1: 220, y1: 0, x2: 220, y2: 240 },
      { k: 'car', x: 190, y: 90, h: 'n', you: true },
      { k: 'car', x: 130, y: 200, h: 'n', kind: 'ambulance', label: ['Ambulance', 'Ambulancia'] },
      { k: 'text', x: 60, y: 210, t: ['Siren and lights', 'Sirena y luces'], size: 10 },
      { k: 'arrow', d: 'M196 70 Q210 50 210 30', color: BLUE, reveal: true },
      { k: 'text', x: 266, y: 40, t: ['Pull right, stop if needed', 'Oríllese, deténgase si es necesario'], size: 9, reveal: true }],
  },
  'following-distance': {
    title: ['Measuring three seconds', 'Medir tres segundos'],
    items: [H(80, 80),
      { k: 'line', x1: 0, y1: 120, x2: 320, y2: 120, color: 'w', dash: true },
      { k: 'rect', x: 230, y: 60, w: 4, h: 20, fill: '#555' },
      { k: 'rect', x: 222, y: 52, w: 20, h: 10, fill: '#0b6b3a' },
      { k: 'text', x: 232, y: 46, t: ['Fixed object', 'Objeto fijo'], size: 10 },
      { k: 'car', x: 250, y: 140, h: 'e', label: 'A', color: '#6c7a89' },
      { k: 'car', x: 90, y: 140, h: 'e', you: true },
      { k: 'line', x1: 105, y1: 175, x2: 232, y2: 175, color: 'w', width: 2 },
      { k: 'text', x: 168, y: 192, t: ['"One-thousand-one, two, three"', '"Mil uno, mil dos, mil tres"'], size: 10 }],
  },
  'blind-spots': {
    title: ['Mirror view and blind spots', 'Vista de espejos y puntos ciegos'],
    items: [V(70, 180),
      { k: 'line', x1: 130, y1: 0, x2: 130, y2: 240, color: 'w', dash: true },
      { k: 'line', x1: 190, y1: 0, x2: 190, y2: 240, color: 'w', dash: true },
      { k: 'rect', x: 132, y: 30, w: 56, h: 60, fill: '#2f7d4f', opacity: 0.35 },
      { k: 'rect', x: 74, y: 120, w: 54, h: 60, fill: '#c0392b', opacity: 0.35, pattern: 'hatch' },
      { k: 'rect', x: 192, y: 120, w: 54, h: 60, fill: '#c0392b', opacity: 0.35, pattern: 'hatch' },
      { k: 'rect', x: 132, y: 190, w: 56, h: 48, fill: '#2f7d4f', opacity: 0.25 },
      { k: 'car', x: 160, y: 120, h: 'n', you: true },
      { k: 'text', x: 160, y: 62, t: 'A', size: 16 }, { k: 'text', x: 101, y: 155, t: 'B', size: 16 },
      { k: 'text', x: 219, y: 155, t: 'B', size: 16 }, { k: 'text', x: 160, y: 222, t: 'C', size: 16 },
      { k: 'text', x: 285, y: 155, t: ['B: blind spots', 'B: puntos ciegos'], size: 9, reveal: true }],
  },
  'hill-downhill-curb': {
    title: ['Parked facing downhill, curb on the right', 'Estacionado cuesta abajo, orilla a la derecha'],
    items: [V(110, 120),
      { k: 'curb', x1: 230, y1: 0, x2: 230, y2: 240 },
      { k: 'rect', x: 230, y: 0, w: 90, h: 240, fill: '#c9c2b4' },
      { k: 'car', x: 205, y: 120, h: 's', you: true },
      { k: 'wheel', x: 197, y: 127, angle: -25 }, { k: 'wheel', x: 213, y: 127, angle: -25 },
      { k: 'text', x: 60, y: 40, t: ['Downhill', 'Cuesta abajo'], size: 12 },
      { k: 'arrow', d: 'M60 60 L60 200', color: '#555' },
      { k: 'text', x: 275, y: 120, t: ['Curb', 'Orilla'], size: 10 },
      { k: 'text', x: 160, y: 228, t: ['Front wheels turned toward the curb', 'Llantas delanteras hacia la orilla'], size: 10, reveal: true }],
  },
  'hill-uphill-curb': {
    title: ['Parked facing uphill, curb on the right', 'Estacionado cuesta arriba, orilla a la derecha'],
    items: [V(110, 120),
      { k: 'curb', x1: 230, y1: 0, x2: 230, y2: 240 },
      { k: 'rect', x: 230, y: 0, w: 90, h: 240, fill: '#c9c2b4' },
      { k: 'car', x: 205, y: 120, h: 'n', you: true },
      { k: 'wheel', x: 197, y: 113, angle: -25 }, { k: 'wheel', x: 213, y: 113, angle: -25 },
      { k: 'text', x: 60, y: 40, t: ['Uphill', 'Cuesta arriba'], size: 12 },
      { k: 'arrow', d: 'M60 200 L60 60', color: '#555' },
      { k: 'text', x: 275, y: 120, t: ['Curb', 'Orilla'], size: 10 },
      { k: 'text', x: 160, y: 228, t: ['Front wheels turned away from the curb', 'Llantas delanteras lejos de la orilla'], size: 10, reveal: true }],
  },
  'hill-no-curb': {
    title: ['Parked on a hill with no curb', 'Estacionado en cuesta sin orilla'],
    items: [V(110, 120),
      { k: 'line', x1: 230, y1: 0, x2: 230, y2: 240, color: 'w', dash: true },
      { k: 'rect', x: 232, y: 0, w: 88, h: 240, fill: '#9c8e6a' },
      { k: 'car', x: 205, y: 120, h: 'n', you: true },
      { k: 'wheel', x: 197, y: 113, angle: 25 }, { k: 'wheel', x: 213, y: 113, angle: 25 },
      { k: 'text', x: 275, y: 120, t: ['Road edge', 'Borde'], size: 10 },
      { k: 'text', x: 160, y: 228, t: ['Front wheels turned toward the road edge', 'Llantas delanteras hacia el borde'], size: 10, reveal: true }],
  },
  'parallel-parking': {
    title: ['Parallel parked on a two-way street', 'Estacionado en paralelo en calle de doble sentido'],
    items: [H(60, 130),
      { k: 'line', x1: 0, y1: 118, x2: 320, y2: 118, color: 'y', dash: true },
      { k: 'curb', x1: 0, y1: 190, x2: 320, y2: 190 },
      { k: 'rect', x: 0, y: 190, w: 320, h: 50, fill: '#c9c2b4' },
      { k: 'car', x: 160, y: 176, h: 'e', you: true },
      { k: 'car', x: 70, y: 176, h: 'e', label: 'A', color: '#6c7a89' },
      { k: 'car', x: 250, y: 176, h: 'e', label: 'B', color: '#6c7a89' },
      { k: 'text', x: 160, y: 215, t: ['12 inches or less from the curb', '12 pulgadas o menos de la orilla'], size: 10, reveal: true }],
  },
  'yellow-lines-pass': {
    title: ['Two-lane road: solid and broken center lines', 'Camino de dos carriles: líneas centrales continua y discontinua'],
    items: [H(70, 100),
      { k: 'line', x1: 0, y1: 117, x2: 320, y2: 117, color: 'y' },
      { k: 'line', x1: 0, y1: 123, x2: 320, y2: 123, color: 'y', dash: true },
      { k: 'car', x: 90, y: 145, h: 'e', label: 'A', color: BLUE },
      { k: 'car', x: 230, y: 95, h: 'w', label: 'B', color: '#c0392b' },
      { k: 'text', x: 160, y: 62, t: ['Solid line on B’s side', 'Línea continua del lado de B'], size: 10 },
      { k: 'text', x: 160, y: 188, t: ['Broken line on A’s side', 'Línea discontinua del lado de A'], size: 10 }],
  },
  'double-yellow': {
    title: ['Double solid yellow center line', 'Doble línea amarilla continua'],
    items: [H(80, 90),
      { k: 'line', x1: 0, y1: 122, x2: 320, y2: 122, color: 'y' }, { k: 'line', x1: 0, y1: 128, x2: 320, y2: 128, color: 'y' },
      { k: 'rect', x: 196, y: 30, w: 40, h: 50, fill: '#5a5f66' },
      { k: 'text', x: 216, y: 22, t: ['Driveway', 'Entrada'], size: 10 },
      { k: 'car', x: 140, y: 150, h: 'e', you: true },
      { k: 'arrow', d: 'M160 150 Q214 146 214 86', color: BLUE, dash: true }],
  },
  'two-way-left-turn': {
    title: ['Center two-way left turn lane', 'Carril central de vuelta a la izquierda en ambos sentidos'],
    items: [H(40, 160),
      { k: 'line', x1: 0, y1: 95, x2: 320, y2: 95, color: 'y' }, { k: 'line', x1: 0, y1: 99, x2: 320, y2: 99, color: 'y', dash: true },
      { k: 'line', x1: 0, y1: 141, x2: 320, y2: 141, color: 'y', dash: true }, { k: 'line', x1: 0, y1: 145, x2: 320, y2: 145, color: 'y' },
      { k: 'text', x: 90, y: 126, t: '↰', size: 22, color: '#fff' }, { k: 'text', x: 230, y: 126, t: '↲', size: 22, color: '#fff' },
      { k: 'car', x: 60, y: 170, h: 'e', you: true },
      { k: 'car', x: 260, y: 70, h: 'w', label: 'B', color: '#6c7a89' },
      { k: 'text', x: 160, y: 30, t: ['Center lane: yellow lines, white arrows', 'Carril central: líneas amarillas, flechas blancas'], size: 10 }],
  },
  'stop-line-crosswalk': {
    title: ['Stop line, crosswalk, intersection', 'Línea de alto, cruce peatonal, intersección'],
    items: [V(130, 60), H(30, 60),
      { k: 'rect', x: 130, y: 96, w: 60, h: 22, fill: '#fff', pattern: 'zebra' },
      { k: 'line', x1: 162, y1: 126, x2: 190, y2: 126, color: 'w', width: 4 },
      { k: 'car', x: 175, y: 160, h: 'n', you: true },
      { k: 'text', x: 240, y: 130, t: ['1. Stop line', '1. Línea de alto'], size: 10 },
      { k: 'text', x: 240, y: 110, t: ['2. Crosswalk', '2. Cruce peatonal'], size: 10 },
      { k: 'text', x: 240, y: 64, t: ['3. Intersection', '3. Intersección'], size: 10 }],
  },
  'expressway-merge': {
    title: ['Entering an expressway', 'Entrar a una vía rápida'],
    items: [H(30, 100),
      { k: 'line', x1: 0, y1: 80, x2: 320, y2: 80, color: 'w', dash: true },
      { k: 'rect', x: 40, y: 130, w: 220, h: 30, fill: ROAD },
      { k: 'line', x1: 40, y1: 130, x2: 260, y2: 130, color: 'w', dash: true },
      { k: 'rect', x: 0, y: 160, w: 70, h: 30, fill: ROAD },
      { k: 'car', x: 90, y: 145, h: 'e', you: true },
      { k: 'car', x: 170, y: 105, h: 'e', label: 'A', color: '#6c7a89' },
      { k: 'car', x: 60, y: 105, h: 'e', label: 'B', color: '#6c7a89' },
      { k: 'text', x: 150, y: 178, t: ['Speed-change lane', 'Carril de aceleración'], size: 10 },
      { k: 'arrow', d: 'M110 145 Q160 140 200 116', color: BLUE, dash: true, reveal: true }],
  },
  'railroad-gates': {
    title: ['Railroad crossing with gates down', 'Cruce de ferrocarril con barreras abajo'],
    items: [V(130, 60),
      { k: 'tracks', y: 70 },
      { k: 'gate', x: 192, y: 112, w: 60 },
      { k: 'car', x: 175, y: 190, h: 'n', you: true },
      { k: 'line', x1: 214, y1: 96, x2: 214, y2: 172, color: 'w', width: 2 },
      { k: 'text', x: 262, y: 140, t: ['15 to 50 ft', '15 a 50 pies'], size: 11 },
      { k: 'text', x: 60, y: 60, t: ['Tracks', 'Vías'], size: 10 }],
  },
  'large-vehicle-right-turn': {
    title: ['Truck making a wide right turn', 'Camión dando una vuelta abierta a la derecha'],
    items: [...crossroads(),
      { k: 'car', x: 168, y: 175, h: 'n', kind: 'truck', label: ['Truck', 'Camión'] },
      { k: 'arrow', d: 'M168 140 Q170 112 240 108', color: '#b5651d', dash: true },
      { k: 'rect', x: 180, y: 160, w: 10, h: 60, fill: '#f1c40f', opacity: 0.4 },
      { k: 'text', x: 236, y: 200, t: ['Gap at the curb', 'Hueco junto a la orilla'], size: 10 },
      { k: 'car', x: 175, y: 232, h: 'n', you: true },
      { k: 'text', x: 236, y: 220, t: ['Do not enter the gap', 'No entre al hueco'], size: 10, reveal: true }],
  },
  'one-way-left-on-red': {
    title: ['One-way onto one-way, turning left', 'De un solo sentido a otra, vuelta a la izquierda'],
    items: [H(90), V(130),
      { k: 'text', x: 60, y: 84, t: ['ONE WAY ←', 'UN SOLO SENTIDO ←'], size: 10 },
      { k: 'text', x: 214, y: 210, t: ['ONE WAY ↑', 'UN SOLO SENTIDO ↑'], size: 10 },
      { k: 'light', x: 206, y: 156, color: 'r' },
      { k: 'car', x: 145, y: 180, h: 'n', you: true },
      { k: 'arrow', d: 'M145 160 Q145 124 100 124', color: BLUE, dash: true }],
  },
  'bus-stop-pedestrian': {
    title: ['Passing a stopped bus', 'Pasar junto a un autobús detenido'],
    items: [V(90, 140),
      { k: 'curb', x1: 230, y1: 0, x2: 230, y2: 240 },
      { k: 'rect', x: 230, y: 0, w: 90, h: 240, fill: '#c9c2b4' },
      { k: 'line', x1: 160, y1: 0, x2: 160, y2: 240, color: 'w', dash: true },
      { k: 'car', x: 196, y: 120, h: 'n', kind: 'bus', label: ['Bus', 'Autobús'] },
      { k: 'car', x: 128, y: 200, h: 'n', you: true },
      { k: 'text', x: 280, y: 110, t: ['Bus stop', 'Parada'], size: 10 },
      { k: 'ped', x: 178, y: 54, ghost: true, reveal: true, label: ['Hidden by the bus', 'Oculto por el autobús'] }],
  },
  'blocked-crosswalk': {
    title: ['Traffic backed up past the intersection', 'Tráfico detenido después de la intersección'],
    items: [...crossroads(),
      { k: 'rect', x: 162, y: 64, w: 28, h: 24, fill: '#fff', pattern: 'zebra' },
      { k: 'light', x: 206, y: 160, color: 'g' },
      { k: 'car', x: 175, y: 40, h: 'n', label: 'A', color: '#6c7a89' },
      { k: 'car', x: 175, y: 6, h: 'n', label: 'B', color: '#6c7a89' },
      { k: 'car', x: 175, y: 180, h: 'n', you: true },
      { k: 'text', x: 255, y: 30, t: ['No room past the corner', 'Sin espacio después de la esquina'], size: 10 }],
  },
};

const rot: Record<Heading, number> = { n: 0, e: 90, s: 180, w: 270 };

function Vehicle({ it, lang }: { it: Extract<Item, { k: 'car' }>; lang: 'en' | 'es' }) {
  const kind = it.kind ?? 'car';
  const dims = { car: [16, 30], bus: [20, 58], truck: [20, 54], schoolbus: [20, 50], ambulance: [18, 34], bike: [6, 18], moto: [7, 20] }[kind];
  const [w, l] = [it.wid ?? dims[0], it.len ?? dims[1]];
  const fill = it.you ? BLUE : kind === 'schoolbus' ? '#F6B800' : kind === 'ambulance' ? '#f4f4f4' : kind === 'bike' ? '#1d6b3c' : it.color ?? '#6c7a89';
  const label = it.you ? YOU : it.label;
  const text = typeof label === 'string' ? label : label ? label[lang === 'es' ? 1 : 0] : '';
  return (
    <g transform={`translate(${it.x} ${it.y})`}>
      <g transform={`rotate(${rot[it.h]})`}>
        <path d={`M${-w / 2} ${l / 2} L${-w / 2} ${-l / 2 + 6} L0 ${-l / 2 - 2} L${w / 2} ${-l / 2 + 6} L${w / 2} ${l / 2} Z`} fill={fill} stroke={it.you ? '#fff' : '#111'} strokeWidth={it.you ? 2.5 : 1.2} />
        {it.you && <rect x={-2} y={-l / 2 + 6} width={4} height={l - 8} fill="#fff" opacity="0.85" />}
        {kind === 'ambulance' && <rect x={-w / 2 + 2} y={-4} width={w - 4} height={4} fill="#c0392b" />}
        {(kind === 'ambulance') && <circle cx="0" cy={-l / 2 + 8} r="3" fill="#c0392b" className="blink" />}
      </g>
      {text && (
        <text x={0} y={(it.h === 'n' || it.h === 's' ? l / 2 : w / 2) + 13} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" stroke="#14171c" strokeWidth="3" paintOrder="stroke">{text}</text>
      )}
    </g>
  );
}

export function Scene({ id, reveal = false, size = 'md' }: { id: SceneId; reveal?: boolean; size?: 'sm' | 'md' }) {
  const { lang, c } = useT();
  const def = SCENES[id];
  if (!def) return null;
  const tx = (t: T | string) => (typeof t === 'string' ? t : c(t));
  const items = def.items.filter((i) => !('reveal' in i && i.reveal) || reveal);
  return (
    <figure className={`scene scene-${size}`}>
      <svg viewBox="0 0 320 240" role="img" aria-label={c(def.title)} className="scene-svg">
        <title>{c(def.title)}</title>
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#c0392b" strokeWidth="3" />
          </pattern>
          <pattern id="zebra" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="4" height="8" fill="#fff" /><rect x="4" width="4" height="8" fill={ROAD} />
          </pattern>
          <marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="context-stroke" /></marker>
        </defs>
        <rect width="320" height="240" fill="#cfe3c4" />
        {items.map((it, i) => {
          switch (it.k) {
            case 'road-h': return <rect key={i} x={it.x1 ?? 0} y={it.y} width={(it.x2 ?? 320) - (it.x1 ?? 0)} height={it.h} fill={ROAD} />;
            case 'road-v': return <rect key={i} x={it.x} y={it.y1 ?? 0} width={it.w} height={(it.y2 ?? 240) - (it.y1 ?? 0)} fill={ROAD} />;
            case 'line': return <line key={i} x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} stroke={it.color === 'y' ? '#F2C200' : '#fff'} strokeWidth={it.width ?? 2.5} strokeDasharray={it.dash ? '10 8' : undefined} />;
            case 'rect': return <rect key={i} x={it.x} y={it.y} width={it.w} height={it.h} fill={it.pattern ? `url(#${it.pattern})` : it.fill} opacity={it.opacity} />;
            case 'curb': return <line key={i} x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} stroke="#8a8378" strokeWidth="4" />;
            case 'car': return <Vehicle key={i} it={it} lang={lang} />;
            case 'ped': return (
              <g key={i} transform={`translate(${it.x} ${it.y})`} opacity={it.ghost ? 0.9 : 1}>
                <circle r="9" fill="#fff" stroke="#111" strokeWidth="1.5" strokeDasharray={it.ghost ? '3 2' : undefined} />
                <circle cy="-2" r="2.2" fill="#111" /><path d="M0 0 L0 5 M-3 2 L3 2 M0 5 L-2 8 M0 5 L2 8" stroke="#111" strokeWidth="1.4" />
                {it.label && <text y="22" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#14171c" stroke="#fff" strokeWidth="3" paintOrder="stroke">{c(it.label)}</text>}
              </g>);
            case 'stop': return (
              <g key={i} transform={`translate(${it.x} ${it.y})`}><circle r="8" fill="#C8102E" stroke="#fff" strokeWidth="1.5" /><text y="2.5" textAnchor="middle" fontSize="5" fontWeight="800" fill="#fff">STOP</text></g>);
            case 'light': return (
              <g key={i} transform={`translate(${it.x} ${it.y})`}>
                <rect x="-6" y="-16" width="12" height="32" rx="2" fill="#14171c" />
                {(['r', 'y', 'g'] as const).map((col, j) => <circle key={col} cy={-9 + j * 9} r="3.5" fill={col === it.color ? { r: '#E0342B', y: '#F6B800', g: '#1FAE5B' }[col] : '#3a3f47'} />)}
                <text x="10" y="4" fontSize="9" fontWeight="700" fill="#14171c" stroke="#fff" strokeWidth="3" paintOrder="stroke">{it.color === 'r' ? c(['Red', 'Rojo']) : it.color === 'g' ? c(['Green', 'Verde']) : c(['Yellow', 'Amarillo'])}</text>
              </g>);
            case 'arrow': return <path key={i} d={it.d} stroke={it.color ?? '#14171c'} strokeWidth="3" fill="none" strokeDasharray={it.dash ? '6 4' : undefined} markerEnd="url(#ah)" />;
            case 'text': return <text key={i} x={it.x} y={it.y} textAnchor={it.anchor ?? 'middle'} fontSize={it.size ?? 11} fontWeight="700" fill={it.color ?? '#14171c'} stroke={it.color ? 'none' : '#fff'} strokeWidth="3" paintOrder="stroke">{tx(it.t)}</text>;
            case 'badge': return (<g key={i} transform={`translate(${it.x} ${it.y})`}><circle r="9" fill="#14171c" stroke="#fff" strokeWidth="2" /><text y="3.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{it.t}</text></g>);
            case 'wheel': return <rect key={i} x={it.x - 3} y={it.y - 6} width="6" height="12" rx="1.5" fill="#111" stroke="#fff" strokeWidth="1" transform={`rotate(${it.angle} ${it.x} ${it.y})`} />;
            case 'tracks': return (
              <g key={i}>
                <rect x="0" y={it.y - 4} width="320" height="34" fill="#7a6a55" />
                {Array.from({ length: 27 }, (_, j) => <rect key={j} x={j * 12} y={it.y - 4} width="5" height="34" fill="#5b4b38" />)}
                <line x1="0" y1={it.y + 4} x2="320" y2={it.y + 4} stroke="#ccc" strokeWidth="3" />
                <line x1="0" y1={it.y + 22} x2="320" y2={it.y + 22} stroke="#ccc" strokeWidth="3" />
              </g>);
            case 'gate': return (
              <g key={i}><rect x={it.x - 4} y={it.y - 4} width="8" height="8" fill="#14171c" />
                <rect x={it.x - it.w - 4} y={it.y - 2} width={it.w} height="5" fill="url(#zebraRed)" stroke="#c0392b" />
                <circle cx={it.x + 10} cy={it.y} r="4" fill="#E0342B" className="blink" />
                <text x={it.x + 18} y={it.y + 4} fontSize="9" fontWeight="700" fill="#14171c" stroke="#fff" strokeWidth="3" paintOrder="stroke">{c(['Lights flashing', 'Luces parpadeando'])}</text></g>);
          }
        })}
      </svg>
      <figcaption>
        <span>{c(def.title)}</span>
        <span className="legend"><span className="legend-you" aria-hidden="true" /> {c(['Blue with white stripe: your car. Points show direction.', 'Azul con franja blanca: su auto. La punta indica la dirección.'])}</span>
      </figcaption>
    </figure>
  );
}
