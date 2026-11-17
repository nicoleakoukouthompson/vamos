import { useEffect, useMemo, useRef, useState } from 'react';
import { lessonById, questionById, units } from '../content';
import { places, SCENARIO_LABEL, scenarios } from '../content/scenarios';
import type { Scenario } from '../content/types';
import { formatDate } from '../core/dates';
import { useT } from '../i18n/useT';
import { recordAnswer } from '../store/store';
import { Icon } from '../ui/icons';
import { Btn, Card, LinkBtn, Notice, Visual } from '../ui/kit';
import { PracticeQuestion } from '../ui/QuestionCard';
import 'leaflet/dist/leaflet.css';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function MapView({ list, selected, onSelect }: { list: Scenario[]; selected: string | null; onSelect: (id: string) => void }) {
  const { t, c } = useT();
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let errors = 0;
    let loads = 0;
    import('leaflet').then((L) => {
      if (cancelled || !el.current || mapRef.current) return;
      const map = L.map(el.current, { scrollWheelZoom: false, keyboard: true }).setView([41.875, -87.66], 11);
      const tiles = L.tileLayer(TILE_URL, {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      tiles.on('tileload', () => { loads++; setFailed(false); });
      tiles.on('tileerror', () => { errors++; if (errors >= 3 && loads === 0) setFailed(true); });
      tiles.addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
      map.whenReady(() => map.invalidateSize());
    }).catch(() => setFailed(true));
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    import('leaflet').then((L) => {
      const group = layerRef.current;
      if (!group) return;
      group.clearLayers();
      const byPlace = new Map<string, Scenario[]>();
      list.forEach((s) => byPlace.set(s.placeId, [...(byPlace.get(s.placeId) ?? []), s]));
      for (const [pid, ss] of byPlace) {
        const pl = places.find((x) => x.id === pid)!;
        const icon = L.divIcon({ className: 'pin', html: `<span class="pin-dot${ss.some((s) => s.id === selected) ? ' is-on' : ''}">${ss.length}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] });
        const m = L.marker([pl.lat, pl.lng], { icon, title: `${pl.neighborhood}: ${pl.name}`, alt: `${pl.neighborhood}: ${pl.name}`, keyboard: true });
        m.on('click', () => onSelect(ss[0].id));
        m.on('keypress', () => onSelect(ss[0].id));
        m.addTo(group);
      }
    });
  }, [list, selected, onSelect, ready]);

  return (
    <div className="map-wrap">
      {failed && <Notice kind="warn">{t('mapUnavailable')}</Notice>}
      <div ref={el} className="map" role="region" aria-label={t('mapLabel')} />
      <p className="muted small">{t('mapAttribution')} · {c(SCENARIO_LABEL)}</p>
    </div>
  );
}

export default function Scenarios() {
  const { t, c, lang } = useT();
  const [view, setView] = useState<'map' | 'list'>('map');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [practicing, setPracticing] = useState(false);
  const [seed, setSeed] = useState(1);
  const detailRef = useRef<HTMLDivElement>(null);
  const list = useMemo(() => scenarios.filter((s) => (!topic || s.topic === topic) && (!level || s.difficulty === level)), [topic, level]);
  const topicsPresent = units.filter((u) => scenarios.some((s) => s.topic === u.id));
  const sel = scenarios.find((s) => s.id === selected) ?? null;
  const select = (id: string) => { setSelected(id); setPracticing(false); requestAnimationFrame(() => detailRef.current?.focus()); };

  return (
    <div className="stack">
      <div className="page-head">
        <h1>{t('scenariosTitle')}</h1>
        <p className="lead">{t('scenariosIntro')}</p>
      </div>
      <Notice>{t('scenariosDisclaimer')}</Notice>
      <div className="toolbar">
        <div className="segmented" role="group" aria-label={`${t('showMap')} / ${t('showList')}`}>
          <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}><Icon name="map" /> {t('showMap')}</button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}><Icon name="log" /> {t('showList')}</button>
        </div>
        <label className="field inline"><span>{t('filterTopic')}</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">{t('allTopics')}</option>
            {topicsPresent.map((u) => <option key={u.id} value={u.id}>{c(u.title)}</option>)}
          </select>
        </label>
        <label className="field inline"><span>{t('filterDifficulty')}</span>
          <select value={level} onChange={(e) => setLevel(Number(e.target.value))}>
            <option value={0}>{t('allLevels')}</option>
            <option value={1}>{t('level1')}</option><option value={2}>{t('level2')}</option><option value={3}>{t('level3')}</option>
          </select>
        </label>
      </div>

      {view === 'map' && <MapView list={list} selected={selected} onSelect={select} />}

      {sel && (
        <Card className="scenario-detail">
          <div ref={detailRef} tabIndex={-1}>
            {(() => {
              const pl = places.find((x) => x.id === sel.placeId)!;
              const q = questionById.get(sel.questionId)!;
              const lesson = lessonById.get(sel.lessonId)!;
              return (
                <>
                  <p className="eyebrow"><Icon name="pin" size={16} /> {pl.neighborhood}: {pl.name}</p>
                  <h2>{c(sel.title)}</h2>
                  <p className="label-illustrated">{c(SCENARIO_LABEL)}</p>
                  <p>{c(sel.setup)}</p>
                  {!practicing && <Visual spec={sel.visual} size="sm" />}
                  <p className="muted small">{t('coordsChecked', { d: formatDate(pl.verified.date, lang, { month: 'short', day: 'numeric', year: 'numeric' }) })}</p>
                  {practicing ? (
                    <PracticeQuestion q={q} seedKey={`sc-${sel.id}-${seed}`} onGraded={(r) => recordAnswer(q.id, r, 'scenario')} onNext={() => setPracticing(false)} nextLabel={t('done')} />
                  ) : (
                    <div className="row wrap">
                      <Btn kind="primary" onClick={() => { setSeed((n) => n + 1); setPracticing(true); }}>{t('practiceThis')}</Btn>
                      <LinkBtn href={`#/lesson/${lesson.id}`}>{t('openLesson')}: {c(lesson.title)}</LinkBtn>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="sr-only">{t('showList')}</h2>
        {list.length === 0 ? <p>{t('noScenarioMatch')}</p> : (
          <ul className="scenario-list">
            {list.map((s) => {
              const pl = places.find((x) => x.id === s.placeId)!;
              return (
                <li key={s.id}>
                  <button type="button" className={`scenario-item${selected === s.id ? ' is-on' : ''}`} onClick={() => select(s.id)} aria-pressed={selected === s.id}>
                    <span className="scenario-place small muted"><Icon name="pin" size={14} /> {pl.neighborhood}</span>
                    <span className="scenario-title">{c(s.title)}</span>
                    <span className="small muted">{t(`level${s.difficulty}` as 'level1')}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
