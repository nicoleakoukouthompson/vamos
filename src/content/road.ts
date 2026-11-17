import type { T } from './types';

export interface RoadStep {
  id: string;
  title: T;
  body: T;
  /** Official requirements apply; send people to official sources. */
  official?: boolean;
}

export const ROAD_STEPS: RoadStep[] = [
  { id: 'rs-requirements', official: true,
    title: ['Understand permit and supervision requirements', 'Entender los requisitos del permiso y de la supervisión'],
    body: ['Read the official Secretary of State pages for your age group: documents, fees, vision and written tests, and who may supervise practice. The handbook describes supervision for permit holders under 21 (a licensed adult 21 or older with at least one year of experience, in the front passenger seat). Confirm what applies to you with the Secretary of State. Vamos does not decide eligibility.',
      'Lea las páginas oficiales de la Secretaría de Estado para su grupo de edad: documentos, cuotas, examen de la vista y escrito, y quién puede supervisar la práctica. El manual describe la supervisión para titulares de permiso menores de 21 (un adulto con licencia, de 21 años o más, con al menos un año de experiencia, en el asiento del copiloto). Confirme con la Secretaría de Estado lo que le aplica. Vamos no determina elegibilidad.'] },
  { id: 'rs-questions',
    title: ['Prepare questions for a driving school', 'Preparar preguntas para una escuela de manejo'],
    body: ['Use the inquiry scripts below. Ask about adult beginners, Spanish instruction, experience with nervous learners, dual-control cars, pickup, lesson length, total price and cancellation.',
      'Use los guiones de abajo. Pregunte por adultos principiantes, clases en español, experiencia con personas nerviosas, autos con doble control, si pasan por usted, duración, precio total y cancelación.'] },
  { id: 'rs-compare',
    title: ['Compare instruction options', 'Comparar opciones de instrucción'],
    body: ['Add each school you contact to the comparison table. Note what they told you and when.', 'Agregue a la tabla cada escuela que contacte. Anote lo que le dijeron y cuándo.'] },
  { id: 'rs-arrange',
    title: ['Arrange instruction or qualified supervision', 'Contratar instrucción o supervisión calificada'],
    body: ['Book a first lesson or confirm a qualified supervising driver. Share any nervousness with them ahead of time.', 'Reserve una primera clase o confirme a un conductor supervisor calificado. Comparta sus nervios con anticipación.'] },
  { id: 'rs-controls',
    title: ['Learn the controls in a parked car', 'Conocer los controles en un auto estacionado'],
    body: ['With permission, sit in a parked car with the engine off. Find the seat and mirror adjustments, lights, wipers, hazard button, horn and parking brake.', 'Con permiso, siéntese en un auto estacionado con el motor apagado. Ubique los ajustes de asiento y espejos, luces, limpiadores, intermitentes, claxon y freno de mano.'] },
  { id: 'rs-passenger',
    title: ['Practice observation as a passenger', 'Practicar la observación como pasajero'],
    body: ['On ordinary trips, call out signs, signals, people walking and what you would do next. This is observation, not driving practice.', 'En trayectos normales, diga en voz alta las señales, semáforos, personas caminando y lo que haría después. Es observación, no práctica de manejo.'] },
  { id: 'rs-first',
    title: ['Complete your first supervised practice', 'Completar su primera práctica supervisada'],
    body: ['Usually in a quiet place your instructor chooses. Log it in the practice log afterward.', 'Normalmente en un lugar tranquilo que elija su instructor. Regístrela después en el registro de práctica.'] },
  { id: 'rs-basics',
    title: ['Build basic vehicle control', 'Desarrollar el control básico del vehículo'],
    body: ['Starting, stopping smoothly, steering, turning and backing slowly, under supervision.', 'Arrancar, frenar con suavidad, dirigir, dar vuelta y retroceder despacio, con supervisión.'] },
  { id: 'rs-traffic',
    title: ['Progress to intersections and ordinary traffic', 'Avanzar a intersecciones y tráfico normal'],
    body: ['When your instructor agrees. Apply what you learned about right of way, people walking and bicycles.', 'Cuando su instructor esté de acuerdo. Aplique lo aprendido sobre derecho de paso, peatones y bicicletas.'] },
  { id: 'rs-demanding',
    title: ['Add more demanding conditions when your instructor agrees', 'Agregar condiciones más exigentes cuando su instructor lo apruebe'],
    body: ['Night, rain, heavier traffic and later expressways, one at a time.', 'Noche, lluvia, más tráfico y después vías rápidas, una cosa a la vez.'] },
  { id: 'rs-roadtest', official: true,
    title: ['Prepare for the road test', 'Prepararse para el examen de manejo'],
    body: ['The handbook (printed p.14 and 15) lists what is graded, including checking controls, backing about 50 feet, a turnabout using an alley, hill parking and starting, and obeying signs, signals and right of way. Confirm current expectations with the Secretary of State.',
      'El manual (páginas impresas 14 y 15) enumera lo que se califica, como revisar los controles, retroceder unos 50 pies, dar la vuelta usando un callejón, estacionarse y arrancar en cuesta, y obedecer señales, semáforos y derecho de paso. Confirme los requisitos actuales con la Secretaría de Estado.'] },
];

export const PRE_TASKS: { id: string; text: T }[] = [
  { id: 'pt-dashboard', text: ['Identify dashboard controls in a parked vehicle, with the owner’s permission.', 'Identificar los controles del tablero en un vehículo estacionado, con permiso del dueño.'] },
  { id: 'pt-intersections', text: ['Watch an intersection as a passenger and narrate who should go first.', 'Observar una intersección como pasajero y narrar quién debe pasar primero.'] },
  { id: 'pt-walk', text: ['Notice and name ten signs during a walk.', 'Notar y nombrar diez señales durante una caminata.'] },
  { id: 'pt-image', text: ['Describe the hazards in a Chicago scenario diagram in Vamos.', 'Describir los peligros de un diagrama de escenario de Chicago en Vamos.'] },
  { id: 'pt-explain', text: ['Explain one driving decision out loud, including why it is safe.', 'Explicar en voz alta una decisión de manejo, incluido por qué es segura.'] },
];

export const SCRIPTS: { id: string; title: T; en: string; es: string }[] = [
  { id: 'sc-call', title: ['Phone or email inquiry', 'Consulta por teléfono o correo'],
    en: `Hello, I am an adult beginner preparing for my permit and I have not driven before. I would like to ask a few questions:
1. Do you teach adult beginners with no experience?
2. Do you offer lessons in Spanish?
3. Do you have experience with nervous learners? How do you usually start?
4. Do your cars have dual controls (an instructor brake)?
5. Can you pick me up, and from where?
6. How long is each lesson, and what is the total price for a package?
7. What is your cancellation policy?
8. What days and times are available in the next few weeks?
Thank you.`,
    es: `Hola, soy una persona adulta principiante, me estoy preparando para el permiso y nunca he manejado. Quisiera hacer unas preguntas:
1. ¿Enseñan a adultos principiantes sin experiencia?
2. ¿Ofrecen clases en español?
3. ¿Tienen experiencia con personas nerviosas? ¿Cómo suelen empezar?
4. ¿Sus autos tienen doble control (freno para el instructor)?
5. ¿Pueden pasar por mí y desde dónde?
6. ¿Cuánto dura cada clase y cuál es el precio total de un paquete?
7. ¿Cuál es su política de cancelación?
8. ¿Qué días y horarios tienen disponibles en las próximas semanas?
Gracias.` },
  { id: 'sc-anxiety', title: ['Sharing nervousness with an instructor', 'Compartir los nervios con un instructor'],
    en: `Before we start, I want to let you know that driving makes me nervous. It helps me when:
- you explain what we will do before we start,
- we begin somewhere quiet,
- we stop to talk if I feel overwhelmed.
Can we plan the first lesson that way?`,
    es: `Antes de empezar, quiero comentarle que manejar me pone nerviosa o nervioso. Me ayuda que:
- me explique lo que vamos a hacer antes de empezar,
- empecemos en un lugar tranquilo,
- paremos a platicar si me siento abrumada o abrumado.
¿Podemos planear así la primera clase?` },
];

export const ANXIETY_PLAN: T[] = [
  ['Before a lesson: review one short lesson in Vamos, not the whole book.', 'Antes de una clase: repase una lección corta en Vamos, no todo el libro.'],
  ['Tell your instructor what helps you, using the script above.', 'Dígale a su instructor qué le ayuda, usando el guion de arriba.'],
  ['While safely parked before starting: adjust seat and mirrors, take a few slow breaths, and say the first two steps out loud.', 'Estacionado y con seguridad antes de arrancar: ajuste asiento y espejos, respire despacio unas veces y diga en voz alta los dos primeros pasos.'],
  ['Pick one small goal per session, such as smooth stops.', 'Elija una meta pequeña por sesión, como frenar con suavidad.'],
  ['Afterward, log what went well before what needs another attempt.', 'Después, anote lo que salió bien antes de lo que necesita otro intento.'],
  ['Your own confidence rating is useful, but your instructor decides when you are ready for harder conditions.', 'Su propia calificación de confianza es útil, pero su instructor decide cuándo está listo o lista para condiciones más difíciles.'],
];
