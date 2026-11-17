import type { Scenario, ScenarioPlace } from './types';

const V = (query: string) => ({
  method: 'OpenStreetMap Nominatim search, first result',
  date: '2026-11-17',
  query,
});

/**
 * Real places, pinned at area or corridor level. Coordinates came from
 * OpenStreetMap Nominatim on the date shown. Pins mark an area for context;
 * they do not describe current lanes, signals, signs or restrictions.
 */
export const places: ScenarioPlace[] = [
  { id: 'pilsen-18th', name: 'West 18th Street', neighborhood: 'Pilsen', lat: 41.8580254, lng: -87.6517972, verified: V('West 18th Street, Pilsen, Chicago') },
  { id: 'lv-26th', name: '26th Street at the Little Village Arch', neighborhood: 'Little Village', lat: 41.8445495, lng: -87.7033179, verified: V('Little Village Arch, Chicago') },
  { id: 'lv-kedzie', name: 'Kedzie Avenue and 26th Street', neighborhood: 'Little Village', lat: 41.8448239, lng: -87.7049465, verified: V('26th Street & South Kedzie Avenue, Chicago') },
  { id: 'logan-square', name: 'Logan Square', neighborhood: 'Logan Square', lat: 41.9283727, lng: -87.7067636, verified: V('Logan Square, Chicago') },
  { id: 'wicker-milwaukee', name: 'North Milwaukee Avenue', neighborhood: 'Wicker Park', lat: 41.9131298, lng: -87.681726, verified: V('North Milwaukee Avenue, Wicker Park, Chicago') },
  { id: 'hyde-park-53rd', name: 'East 53rd Street', neighborhood: 'Hyde Park', lat: 41.799431, lng: -87.5989744, verified: V('East 53rd Street, Hyde Park, Chicago') },
  { id: 'loop', name: 'The Loop', neighborhood: 'Downtown', lat: 41.8816094, lng: -87.6294574, verified: V('The Loop, Chicago') },
  { id: 'jane-byrne', name: 'Jane Byrne Interchange', neighborhood: 'Near West Side', lat: 41.8749385, lng: -87.6457695, verified: V('Jane Byrne Interchange, Chicago') },
  { id: 'dusable-lsd', name: 'DuSable Lake Shore Drive', neighborhood: 'Edgewater', lat: 41.9766732, lng: -87.650273, verified: V('North Lake Shore Drive, Chicago') },
];

export const SCENARIO_LABEL = [
  'Illustrated practice scenario inspired by this area. Street conditions and controls may differ.',
  'Escenario ilustrado de práctica inspirado en esta zona. Las condiciones y controles de la calle pueden ser distintos.',
] as const;

export const scenarios: Scenario[] = [
  { id: 'sc-pilsen-bus', placeId: 'pilsen-18th', topic: 'pedestrians', difficulty: 2, lessonId: 'l-peds', questionId: 'pd-bus-stop',
    title: ['Someone stepping out from behind a bus', 'Alguien que sale por detrás de un autobús'],
    setup: ['On a busy shopping street, a bus is stopped at the curb. People are getting off with bags.', 'En una calle comercial transitada, un autobús está detenido en la orilla. Bajan personas con bolsas.'],
    visual: { type: 'scene', id: 'bus-stop-pedestrian' } },
  { id: 'sc-pilsen-crosswalk', placeId: 'pilsen-18th', topic: 'pedestrians', difficulty: 1, lessonId: 'l-peds', questionId: 'pd-marked',
    title: ['A person in the crosswalk', 'Una persona en el cruce peatonal'],
    setup: ['A person with a stroller steps into a marked crosswalk ahead of you.', 'Una persona con carriola entra a un cruce marcado frente a usted.'],
    visual: { type: 'scene', id: 'crosswalk-marked' } },
  { id: 'sc-lv-box', placeId: 'lv-26th', topic: 'right-of-way', difficulty: 2, lessonId: 'l-row-alleys', questionId: 'rw-block-intersection',
    title: ['Not blocking the crosswalk', 'No bloquear el cruce'],
    setup: ['Traffic on a busy commercial corridor is backed up past the next corner. Your light is green.', 'El tráfico en un corredor comercial está detenido más allá de la siguiente esquina. Su semáforo está en verde.'],
    visual: { type: 'scene', id: 'blocked-crosswalk' } },
  { id: 'sc-lv-truck', placeId: 'lv-kedzie', topic: 'sharing', difficulty: 3, lessonId: 'l-big', questionId: 'sh-truck-right',
    title: ['A delivery truck turning right', 'Un camión de reparto dando vuelta a la derecha'],
    setup: ['A delivery truck ahead signals right and swings left first.', 'Un camión de reparto adelante pone la direccional derecha y primero se abre a la izquierda.'],
    visual: { type: 'scene', id: 'large-vehicle-right-turn' } },
  { id: 'sc-logan-4way', placeId: 'logan-square', topic: 'right-of-way', difficulty: 2, lessonId: 'l-row-stops', questionId: 'rw-4way-same-time',
    title: ['A four-way stop on a side street', 'Un alto de cuatro vías en una calle lateral'],
    setup: ['On a residential side street, you and another car reach a four-way stop together.', 'En una calle residencial, usted y otro auto llegan juntos a un alto de cuatro vías.'],
    visual: { type: 'scene', id: 'four-way-same-time' } },
  { id: 'sc-wicker-door', placeId: 'wicker-milwaukee', topic: 'sharing', difficulty: 2, lessonId: 'l-bikes', questionId: 'sh-dooring',
    title: ['Opening your door near a bike lane', 'Abrir la puerta junto a un carril para bicicletas'],
    setup: ['You have just parked on a street where cyclists ride close to parked cars.', 'Acaba de estacionarse en una calle donde los ciclistas pasan cerca de los autos estacionados.'],
    visual: { type: 'scene', id: 'parked-car-door' } },
  { id: 'sc-wicker-hook', placeId: 'wicker-milwaukee', topic: 'sharing', difficulty: 3, lessonId: 'l-bikes', questionId: 'sh-bike-right-turn',
    title: ['Checking for a cyclist before turning', 'Revisar si viene un ciclista antes de dar vuelta'],
    setup: ['You are about to turn right across a bike lane.', 'Está por dar vuelta a la derecha cruzando un carril para bicicletas.'],
    visual: { type: 'scene', id: 'right-turn-bike' } },
  { id: 'sc-hp-turn', placeId: 'hyde-park-53rd', topic: 'pedestrians', difficulty: 2, lessonId: 'l-peds', questionId: 'pd-turning',
    title: ['Turning through a busy crosswalk', 'Dar vuelta junto a un cruce transitado'],
    setup: ['On a walkable commercial street, many people cross with the WALK signal as you wait to turn.', 'En una calle comercial muy caminada, muchas personas cruzan con la señal WALK mientras espera para dar vuelta.'] },
  { id: 'sc-loop-oneway', placeId: 'loop', topic: 'right-of-way', difficulty: 3, lessonId: 'l-row-alleys', questionId: 'rw-one-way-left-red',
    title: ['Left on red between one-way streets', 'Vuelta a la izquierda en rojo entre calles de un solo sentido'],
    setup: ['Downtown has many one-way streets. You are at a red light on one, turning left onto another.', 'El centro tiene muchas calles de un solo sentido. Está en rojo en una, y va a dar vuelta a la izquierda hacia otra.'],
    visual: { type: 'scene', id: 'one-way-left-on-red' } },
  { id: 'sc-loop-dne', placeId: 'loop', topic: 'sign-meanings', difficulty: 1, lessonId: 'l-sign-rules', questionId: 'sg-do-not-enter',
    title: ['A DO NOT ENTER sign', 'Una señal de DO NOT ENTER'],
    setup: ['You are about to turn onto a street and notice a red and white sign facing you.', 'Va a dar vuelta hacia una calle y ve una señal roja y blanca frente a usted.'],
    visual: { type: 'sign', id: 'do-not-enter' } },
  { id: 'sc-loop-bridge', placeId: 'loop', topic: 'conditions', difficulty: 2, lessonId: 'l-winter', questionId: 'cd-bridge-ice',
    title: ['Icy bridges on a dry day', 'Puentes con hielo en un día seco'],
    setup: ['After a cold night, the streets look dry, but you will cross a river bridge.', 'Después de una noche fría, las calles se ven secas, pero va a cruzar un puente sobre el río.'] },
  { id: 'sc-byrne-merge', placeId: 'jane-byrne', topic: 'expressway', difficulty: 3, lessonId: 'l-xway', questionId: 'sg-lane-ends',
    title: ['Lanes merging in heavy traffic (later stage)', 'Carriles que se unen con tráfico pesado (etapa posterior)'],
    setup: ['Expressway traffic is slow and a lane ends ahead. This is a later-stage skill to practice only when an instructor agrees.', 'El tráfico en la vía rápida va lento y un carril termina adelante. Es una habilidad de etapa posterior, solo cuando un instructor lo apruebe.'],
    visual: { type: 'sign', id: 'lane-ends' } },
  { id: 'sc-lsd-winter', placeId: 'dusable-lsd', topic: 'conditions', difficulty: 3, lessonId: 'l-winter', questionId: 'cd-winter-braking',
    title: ['Braking on a snowy day', 'Frenar en un día con nieve'],
    setup: ['Snow is falling and traffic ahead is slowing. You need to stop smoothly.', 'Está nevando y el tráfico de adelante va frenando. Necesita detenerse con suavidad.'] },
];
