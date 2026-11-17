import { NAV } from '../App';
import { useT } from '../i18n/useT';
import { Icon } from '../ui/icons';

export function More() {
  const { t } = useT();
  return (
    <div className="stack">
      <div className="page-head"><h1>{t('navMore')}</h1></div>
      <ul className="more-list">
        {NAV.map((n) => (
          <li key={n.path}><a href={'#' + n.path}><Icon name={n.icon} /> <span>{t(n.key)}</span><Icon name="arrowRight" size={16} /></a></li>
        ))}
      </ul>
      <p className="muted small">{t('tagline')}</p>
    </div>
  );
}
