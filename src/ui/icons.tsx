/** Small line icon set (no emoji, no icon font). Decorative: hidden from screen readers. */
const P: Record<string, string> = {
  today: 'M4 6h16M4 6v13h16V6M8 3v4M16 3v4M8 12h3v3H8z',
  learn: 'M3 7l9-4 9 4-9 4-9-4zm4 2v5c0 2 10 2 10 0V9',
  review: 'M4 12a8 8 0 1 0 3-6.2M4 4v5h5',
  map: 'M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14',
  exam: 'M7 3h10v18H7zM10 7h4M10 11h4M10 15h2',
  road: 'M8 3l-4 18M16 3l4 18M12 5v3M12 11v3M12 17v3',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.5',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  log: 'M6 3h12v18H6zM9 8h6M9 12h6M9 16h3',
  check: 'M5 12l4 4 10-10',
  x: 'M6 6l12 12M18 6L6 18',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  alert: 'M12 3l10 18H2L12 3zM12 10v5M12 18v.5',
  speaker: 'M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 4l13 8-13 8z',
  stop: 'M6 6h12v12H6z',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  flag: 'M5 21V4h11l-2 4 2 4H5',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  arrowLeft: 'M19 12H5M11 6l-6 6 6 6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  plus: 'M12 5v14M5 12h14',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  upload: 'M12 21V9M7 14l5-5 5 5M4 3h16',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  pin: 'M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name]} />
    </svg>
  );
}
