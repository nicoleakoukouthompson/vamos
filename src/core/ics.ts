import { addDays, type ISODate } from './dates';

/**
 * Build an iCalendar file with a weekly recurring study reminder on each
 * selected weekday, at the chosen local time, ending at the test date (or
 * after 26 weeks for flexible plans). The phone's calendar app delivers the
 * reminders; Vamos itself has no server and cannot send notifications.
 */
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function esc(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcs(opts: {
  today: ISODate; studyDays: number[]; time: string; minutes: number; until: ISODate | null; tz: string; title: string; description: string; uidSeed: string;
}): string {
  const [hh, mm] = opts.time.split(':').map(Number);
  const start = `${opts.today.replace(/-/g, '')}T${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}00`;
  const endMin = hh * 60 + mm + opts.minutes;
  const end = `${opts.today.replace(/-/g, '')}T${String(Math.floor(endMin / 60) % 24).padStart(2, '0')}${String(endMin % 60).padStart(2, '0')}00`;
  const until = (opts.until ?? addDays(opts.today, 7 * 26)).replace(/-/g, '') + 'T235959Z';
  const byday = [...opts.studyDays].sort().map((d) => DAYS[d]).join(',');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vamos//Study reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:vamos-${opts.uidSeed}@vamos.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${opts.tz}:${start}`,
    `DTEND;TZID=${opts.tz}:${end}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${until}`,
    `SUMMARY:${esc(opts.title)}`,
    `DESCRIPTION:${esc(opts.description)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(opts.title)}`, 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
