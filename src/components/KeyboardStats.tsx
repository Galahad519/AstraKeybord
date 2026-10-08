import { deriveMetrics, formatDuration, POSITIONS } from '../utils/metrics';
import type { KeyboardMetrics } from '../utils/metrics';
export function KeyboardStats({ metrics, derived, test }: { metrics: KeyboardMetrics; derived: ReturnType<typeof deriveMetrics>; test: boolean }) {
  return <section className="stats-panel" aria-label="Statistiques de session">
    <div className="section-heading"><span className="eyebrow">MESURES EN DIRECT</span><span className="live-tag">● SESSION LOCALE</span></div>
    <div className="primary-stats">
      <div className="stat highlight"><span>Top-5 hit rate</span><strong data-testid="hit-rate">{derived.hitRate === null ? '—' : derived.hitRate.toFixed(1)}<small> %</small></strong><p>Lettres saisies via les prédictions</p></div>
      <div className="stat"><span>Vitesse de saisie</span><strong>{Math.round(derived.cpm)}<small> car/min</small></strong><p>{metrics.charactersTyped} caractères tapés</p></div>
      <div className="stat"><span>Distance parcourue</span><strong data-testid="distance">{Math.round(metrics.pointerDistance).toLocaleString('fr')}<small> px</small></strong><p>Dans la zone du clavier</p></div>
      <div className="stat"><span>Temps écoulé</span><strong className="mono">{formatDuration(derived.duration)}</strong><p>Depuis la première frappe</p></div>
    </div>
    <div className="detail-stats"><span>Retours arrière <b data-testid="backspaces">{metrics.backspaces}</b></span><span>Erreurs corrigées <b>{test ? metrics.correctedErrors : '—'}</b></span><span>Alphabet ouvert <b>{metrics.fallbackOpenings}</b></span><span>Saisies de secours <b>{metrics.fallbackSelections}</b></span></div>
    <div className="position-stats"><span>Répartition</span>{POSITIONS.map((position, i) => <span key={position}>{['●', '↑', '↓', '←', '→'][i]} {position} <b>{metrics.positions[position]}</b></span>)}</div>
    <p className="metric-note">Top-5 : lettres uniquement, hors espaces et ponctuation. Une lettre choisie dans l’alphabet compte comme un échec. {test ? `${metrics.errors} erreur(s) de saisie cumulée(s).` : 'Les erreurs sont mesurées en mode phrase de test.'}</p>
  </section>;
}
