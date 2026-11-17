import type { GlossaryTerm, SourceDocId, T } from './types';

export interface SourceDoc {
  id: SourceDocId;
  title: string;
  publisher: string;
  edition: string;
  formNumber: string;
  url: string;
  /** Printed page N appears on PDF viewer page N + offset. */
  pdfPageOffset: number;
  howObtained: T;
  verifiedOnline: boolean;
}

export const SOURCE_DOCS: Record<SourceDocId, SourceDoc> = {
  'IL-ROR-2026': {
    id: 'IL-ROR-2026',
    title: 'Illinois Rules of the Road 2026',
    publisher: 'Illinois Secretary of State',
    edition: 'Printed July 2026',
    formNumber: 'DSD A 112.47',
    url: 'https://www.ilsos.gov/content/dam/publications/pdf_publications/dsd_a112.pdf',
    pdfPageOffset: 3,
    howObtained: [
      'Read from a copy supplied by the project administrator on 2026-11-17. The official site could not be reached from the build environment, so the copy was not compared with the version currently posted online.',
      'Leído de una copia proporcionada por quien administra este proyecto el 2026-11-17. No se pudo acceder al sitio oficial desde el entorno de desarrollo, así que la copia no se comparó con la versión publicada actualmente en línea.',
    ],
    verifiedOnline: false,
  },
};

export interface OfficialLink {
  id: string;
  label: T;
  url: string;
  note: T;
}

/** Links for learners. Vamos does not reproduce or interpret eligibility rules. */
export const OFFICIAL_LINKS: OfficialLink[] = [
  { id: 'sos', label: ['Illinois Secretary of State', 'Secretaría de Estado de Illinois'], url: 'https://www.ilsos.gov/',
    note: ['Official requirements, documents, fees, appointments and facility locations.', 'Requisitos oficiales, documentos, cuotas, citas y ubicación de oficinas.'] },
  { id: 'handbook', label: ['Rules of the Road handbook (PDF)', 'Manual Rules of the Road (PDF)'], url: 'https://www.ilsos.gov/content/dam/publications/pdf_publications/dsd_a112.pdf',
    note: ['The official study handbook. Check for newer editions.', 'El manual oficial de estudio. Revise si hay ediciones más nuevas.'] },
  { id: 'jcar', label: ['Illinois Administrative Code: written examination rules', 'Código Administrativo de Illinois: reglas del examen escrito'], url: 'https://www.ilga.gov/commission/jcar/admincode/092/092010300000800R.html',
    note: ['Official regulation for the written test format. Not yet checked by Vamos; see Known limitations.', 'Reglamento oficial del formato del examen escrito. Vamos aún no lo ha revisado; vea Limitaciones conocidas.'] },
  { id: 'chicago', label: ['City of Chicago', 'Ciudad de Chicago'], url: 'https://www.chicago.gov/',
    note: ['Local parking, street and transportation information.', 'Información local de estacionamiento, calles y transporte.'] },
];

export const glossary: GlossaryTerm[] = [
  { id: 'yield', en: 'yield', es: 'ceder el paso', def: ['Let other road users go first; slow down or stop if needed.', 'Dejar pasar primero a otros usuarios; reducir o detenerse si es necesario.'] },
  { id: 'right-of-way', en: 'right of way', es: 'derecho de paso', def: ['Who should go first. It is given, not taken.', 'Quién debe pasar primero. Se cede, no se toma.'] },
  { id: 'stop', en: 'STOP sign', es: 'señal de ALTO (dice STOP)', def: ['Red octagon. Complete stop required.', 'Octágono rojo. Se requiere alto total.'] },
  { id: 'crosswalk', en: 'crosswalk', es: 'cruce peatonal', def: ['Where people cross. Can be marked with paint or unmarked at intersections.', 'Donde cruzan las personas. Puede estar pintado o sin marcar en las intersecciones.'] },
  { id: 'sidewalk', en: 'sidewalk', es: 'banqueta (acera)', def: ['Walkway beside the street.', 'Camino para peatones junto a la calle.'] },
  { id: 'shoulder', en: 'shoulder', es: 'acotamiento', def: ['Paved or gravel edge outside the travel lanes.', 'Orilla pavimentada o de grava fuera de los carriles.'] },
  { id: 'alley', en: 'alley', es: 'callejón', def: ['Narrow service road behind buildings. Default limit 15 mph.', 'Calle de servicio angosta detrás de edificios. Límite de 15 mph.'] },
  { id: 'driveway', en: 'driveway', es: 'entrada de autos', def: ['Private access between the street and a property.', 'Acceso privado entre la calle y una propiedad.'] },
  { id: 'pass', en: 'pass', es: 'rebasar', def: ['Move around a slower vehicle going the same way.', 'Adelantar a un vehículo más lento en el mismo sentido.'] },
  { id: 'merge', en: 'merge', es: 'incorporarse', def: ['Join a lane of moving traffic.', 'Unirse a un carril con tráfico en movimiento.'] },
  { id: 'blind-spot', en: 'blind spot', es: 'punto ciego', def: ['Area beside and behind you that mirrors do not show.', 'Zona a su lado y detrás que los espejos no muestran.'] },
  { id: 'turn-signal', en: 'turn signal', es: 'direccional', def: ['Light that shows which way you will turn or move.', 'Luz que indica hacia dónde va a dar vuelta o moverse.'] },
  { id: 'hazard', en: 'hazard lights', es: 'luces intermitentes', def: ['Both turn signals flashing: disabled or parked vehicle.', 'Ambas direccionales parpadeando: vehículo descompuesto o estacionado.'] },
  { id: 'expressway', en: 'expressway', es: 'vía rápida (autopista)', def: ['High-speed, multi-lane road with ramps.', 'Camino de alta velocidad y varios carriles con rampas.'] },
  { id: 'speed-change', en: 'speed-change lane', es: 'carril de aceleración', def: ['Ramp lane used to match expressway speed.', 'Carril de la rampa para igualar la velocidad de la vía rápida.'] },
  { id: 'crossbuck', en: 'crossbuck', es: 'cruz de ferrocarril', def: ['White X-shaped railroad crossing sign; treat as yield.', 'Señal blanca en forma de X en cruces de tren; se trata como ceder el paso.'] },
  { id: 'permit', en: 'instruction permit', es: 'permiso de aprendizaje', def: ['Allows supervised practice driving. Requirements are set by the Secretary of State.', 'Permite practicar con supervisión. Los requisitos los fija la Secretaría de Estado.'] },
  { id: 'hydroplane', en: 'hydroplaning', es: 'hidroplaneo', def: ['Tires ride on water and lose contact with the road.', 'Las llantas flotan sobre el agua y pierden contacto con el camino.'] },
  { id: 'skid', en: 'skid', es: 'derrape', def: ['Tires lose traction and slide.', 'Las llantas pierden tracción y se deslizan.'] },
  { id: 'tailgating', en: 'tailgating', es: 'seguir muy de cerca', def: ['Following too closely.', 'Ir demasiado cerca del vehículo de adelante.'] },
  { id: 'bac', en: 'BAC', es: 'concentración de alcohol en la sangre (BAC)', def: ['Blood-alcohol concentration. .08% or more is illegal.', 'Concentración de alcohol en la sangre. .08% o más es ilegal.'] },
  { id: 'dutch-reach', en: 'Dutch Reach', es: 'apertura holandesa', def: ['Opening the car door with the far hand to look back for cyclists.', 'Abrir la puerta con la mano lejana para mirar atrás por ciclistas.'] },
  { id: 'flagger', en: 'flagger', es: 'abanderado', def: ['Work zone worker who directs traffic.', 'Trabajador de obra que dirige el tráfico.'] },
  { id: 'no-zone', en: 'No Zone', es: 'zona ciega (No Zone)', def: ['Large vehicle blind spot.', 'Punto ciego de un vehículo grande.'] },
];
