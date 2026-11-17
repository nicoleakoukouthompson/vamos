import { lessons, questions } from '../content';
import { glossary, OFFICIAL_LINKS, SOURCE_DOCS } from '../content/sources';
import type { T } from '../content/types';
import { EXAM_FORMAT } from '../core/exam';
import { useT } from '../i18n/useT';
import { Card } from '../ui/kit';

/** Handbook chapters by printed page range (from the 2026 table of contents). */
export const CHAPTERS: { n: number; title: T; from: number; to: number }[] = [
  { n: 1, title: ['Illinois Driver’s License', 'Licencia de manejo de Illinois'], from: 4, to: 12 },
  { n: 2, title: ['Driver’s License Exams', 'Exámenes de licencia'], from: 13, to: 15 },
  { n: 3, title: ['Drivers Under Age 21', 'Conductores menores de 21'], from: 16, to: 20 },
  { n: 4, title: ['Traffic Laws', 'Leyes de tránsito'], from: 21, to: 39 },
  { n: 5, title: ['Sharing the Road', 'Compartir el camino'], from: 40, to: 47 },
  { n: 6, title: ['Driving Under the Influence', 'Manejar bajo la influencia'], from: 48, to: 53 },
  { n: 7, title: ['Traffic Violations/Crashes', 'Infracciones y choques'], from: 54, to: 57 },
  { n: 8, title: ['Revocation, Suspension, Denial, Cancellation', 'Revocación, suspensión, negación, cancelación'], from: 58, to: 62 },
  { n: 9, title: ['Roadway Signs', 'Señales de tránsito'], from: 63, to: 76 },
  { n: 10, title: ['Traffic Signals and Pavement Markings', 'Semáforos y marcas en el pavimento'], from: 77, to: 82 },
  { n: 11, title: ['Safe Driving Tips', 'Consejos para manejar seguro'], from: 83, to: 91 },
  { n: 12, title: ['Equipment for Safe Driving', 'Equipo para manejar seguro'], from: 92, to: 94 },
  { n: 13, title: ['Owning a Vehicle', 'Tener un vehículo'], from: 95, to: 99 },
];

export function coverage() {
  return CHAPTERS.map((ch) => {
    const inCh = (p: number) => p >= ch.from && p <= ch.to;
    const qs = questions.filter((q) => q.source.pages.some(inCh));
    const ls = lessons.filter((l) => l.sources.some((s) => s.pages.some(inCh)));
    const pages = [...new Set(qs.flatMap((q) => q.source.pages.filter(inCh)))].sort((a, b) => a - b);
    return { ch, questions: qs.length, lessons: ls.length, pages };
  });
}

export function Sources() {
  const { t, c } = useT();
  const doc = SOURCE_DOCS['IL-ROR-2026'];
  const cov = coverage();
  const flagged = questions.filter((q) => q.reviewFlags?.length);
  return (
    <div className="stack">
      <div className="page-head"><h1>{t('sourcesTitle')}</h1></div>

      <Card aria-labelledby="h-src">
        <h2 id="h-src">{t('handbookSection')}</h2>
        <p><strong>{doc.title}</strong>, {doc.publisher}. {doc.edition}. {doc.formNumber}.</p>
        <p className="small">{c(doc.howObtained)}</p>
        <p className="small">{c(['Citations use the printed page number at the bottom of each handbook page. In the PDF file, add 3 to find the viewer page (printed page 63 is PDF page 66).', 'Las citas usan el número impreso al pie de cada página del manual. En el archivo PDF, sume 3 para la página del visor (la página impresa 63 es la página 66 del PDF).'])}</p>
        <p className="small">{t('notOfficialQs')}</p>
        <p className="small">{t('examFormatNote', { n: EXAM_FORMAT.count, p: EXAM_FORMAT.passPct })}</p>
      </Card>

      <Card aria-labelledby="h-links">
        <h2 id="h-links">{t('officialLinks')}</h2>
        <ul className="link-list">
          {OFFICIAL_LINKS.map((l) => (
            <li key={l.id}><a href={l.url} target="_blank" rel="noopener noreferrer">{c(l.label)}</a><span className="muted small"> {c(l.note)}</span></li>
          ))}
        </ul>
      </Card>

      <Card aria-labelledby="h-cov">
        <h2 id="h-cov">{t('coverageTitle')}</h2>
        <p className="muted small">{t('coverageIntro')}</p>
        <div className="table-wrap" tabIndex={0} role="region" aria-labelledby="h-cov">
          <table className="table">
            <thead><tr><th scope="col">{t('coverageChapter')}</th><th scope="col">{t('coverageLessons')}</th><th scope="col">{t('coverageQuestions')}</th><th scope="col">{t('coveragePages')}</th></tr></thead>
            <tbody>
              {cov.map((r) => (
                <tr key={r.ch.n}>
                  <th scope="row">{r.ch.n}. {c(r.ch.title)} <span className="muted small">(pp. {r.ch.from} to {r.ch.to})</span></th>
                  <td>{r.lessons}</td><td>{r.questions}</td><td className="small">{r.pages.join(', ') || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>{t('notCovered')}</h3>
        <p className="small">{t('notCoveredBody')}</p>
      </Card>

      <Card aria-labelledby="h-priv">
        <h2 id="h-priv">{t('privacyTitle')}</h2>
        <p>{t('privacyBody')}</p>
        <p>{t('dataWhere')}</p>
      </Card>

      <Card aria-labelledby="h-voice">
        <h2 id="h-voice">{t('voiceTitle')}</h2>
        <p>{t('voiceBody')}</p>
      </Card>

      <Card aria-labelledby="h-off">
        <h2 id="h-off">{t('offlineTitle')}</h2>
        <p>{t('offlineBody')}</p>
      </Card>

      <Card aria-labelledby="h-gl">
        <h2 id="h-gl">{t('glossaryTitle')}</h2>
        <dl className="glossary">
          {glossary.map((g) => (
            <div key={g.id}><dt><span lang="en">{g.en}</span> <span aria-hidden="true">/</span> <span lang="es">{g.es}</span></dt><dd>{c(g.def)}</dd></div>
          ))}
        </dl>
      </Card>

      <Card aria-labelledby="h-lim">
        <h2 id="h-lim">{t('limitsTitle')}</h2>
        <ul>
          <li>{t('translationNote')}</li>
          <li>{c(['The official regulation on the written test format could not be reached from the build environment, so the practice test format is unverified.', 'No se pudo consultar el reglamento oficial del formato del examen escrito desde el entorno de desarrollo, así que el formato del examen de práctica no está verificado.'])}</li>
          <li>{c(['The handbook copy used was supplied by the project administrator and was not compared with the version currently posted online.', 'La copia del manual fue proporcionada por quien administra este proyecto y no se comparó con la versión publicada actualmente.'])}</li>
          <li>{c(['No official Spanish-language handbook was located or compared.', 'No se localizó ni comparó un manual oficial en español.'])}</li>
          <li>{c([`${flagged.length} questions carry legal details (penalties, thresholds) flagged for review against current statute.`, `${flagged.length} preguntas tienen detalles legales (sanciones, montos) marcados para revisar contra la ley vigente.`])}</li>
          <li>{c(['Progress does not sync between devices. Use backup export and import to move it.', 'El avance no se sincroniza entre dispositivos. Use exportar e importar respaldo para moverlo.'])}</li>
          <li>{c(['Voice features depend on the browser. Spoken answers are not available in every browser.', 'Las funciones de voz dependen del navegador. Las respuestas habladas no están disponibles en todos.'])}</li>
        </ul>
      </Card>
    </div>
  );
}
