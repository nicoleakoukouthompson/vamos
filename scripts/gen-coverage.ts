// Generates docs/COVERAGE.md from the curriculum data. Run: npm run coverage
import { writeFileSync } from 'node:fs';
import { lessons, questions, units, CONTENT_VERSION } from '../src/content';
import { CHAPTERS } from '../src/screens/Sources';
import { scenarios, places } from '../src/content/scenarios';
import { SOURCE_DOCS } from '../src/content/sources';

const doc = SOURCE_DOCS['IL-ROR-2026'];
const L: string[] = [];
L.push('# Curriculum and source coverage matrix', '');
L.push(`Generated from \`src/content\` (content version ${CONTENT_VERSION}). Do not edit by hand; run \`npm run coverage\`.`, '');
L.push(`Source: **${doc.title}**, ${doc.publisher}, ${doc.edition}, form ${doc.formNumber}. Printed page N = PDF viewer page N + ${doc.pdfPageOffset}. ${doc.howObtained[0]}`, '');
L.push(`Totals: ${units.length} units, ${lessons.length} lessons, ${questions.length} distinct questions (each in English and Spanish), ${questions.filter((q) => q.examEligible && q.kind !== 'order').length} exam-eligible, ${scenarios.length} Chicago scenarios at ${places.length} places.`, '');
const kinds = questions.reduce<Record<string, number>>((a, q) => ((a[q.kind] = (a[q.kind] ?? 0) + 1), a), {});
const claims = questions.reduce<Record<string, number>>((a, q) => ((a[q.claim] = (a[q.claim] ?? 0) + 1), a), {});
L.push(`Question formats: ${Object.entries(kinds).map(([k, v]) => `${k} ${v}`).join(', ')}. Claim types: ${Object.entries(claims).map(([k, v]) => `${k} ${v}`).join(', ')} (law = stated as a legal requirement in the handbook; guidance = handbook safety advice; app = conservative app tip, labeled in the UI).`, '');
L.push('## By handbook chapter', '', '| Chapter | Printed pages | Lessons citing | Questions citing | Pages cited |', '|---|---|---|---|---|');
for (const ch of CHAPTERS) {
  const inCh = (p: number) => p >= ch.from && p <= ch.to;
  const qs = questions.filter((q) => q.source.pages.some(inCh));
  const ls = lessons.filter((l) => l.sources.some((s) => s.pages.some(inCh)));
  const pages = [...new Set(qs.flatMap((q) => q.source.pages.filter(inCh)))].sort((a, b) => a - b);
  L.push(`| ${ch.n}. ${ch.title[0]} | ${ch.from}-${ch.to} | ${ls.length} | ${qs.length} | ${pages.join(', ') || 'not covered'} |`);
}
L.push('', 'Chapters 1, 3, 8 and 13 (licensing documents, teen GDL rules, suspensions, registration) are intentionally not taught as lessons. They depend on personal circumstances; the app links to official Secretary of State resources instead.', '');
L.push('## By lesson', '', '| Unit | Lesson | Minutes | Questions | Handbook sources |', '|---|---|---|---|---|');
for (const u of units) for (const id of u.lessons) {
  const l = lessons.find((x) => x.id === id)!;
  L.push(`| ${u.title[0]} | ${l.title[0]} (\`${l.id}\`) | ${l.minutes} | ${l.questionIds.length} | ${l.sources.map((s) => `pp. ${s.pages.join(', ')} (${s.section})`).join('; ')} |`);
}
L.push('', '## Every question', '', '| ID | Topic | Format | Level | Claim | Exam | Printed pages | Section | Review flags |', '|---|---|---|---|---|---|---|---|---|');
for (const q of questions) L.push(`| \`${q.id}\` | ${q.topic} | ${q.kind} | ${q.level} | ${q.claim} | ${q.examEligible ? 'yes' : 'no'} | ${q.source.pages.join(', ')} | ${q.source.section} | ${(q.reviewFlags ?? []).join(' ')} |`);
L.push('', '## Chicago places', '', '| ID | Place | Lat, Lng | Verified |', '|---|---|---|---|');
for (const p of places) L.push(`| \`${p.id}\` | ${p.neighborhood}: ${p.name} | ${p.lat}, ${p.lng} | ${p.verified.method}, ${p.verified.date}, query "${p.verified.query}" |`);
writeFileSync('docs/COVERAGE.md', L.join('\n') + '\n');
console.log('wrote docs/COVERAGE.md');
