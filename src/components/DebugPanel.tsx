import type { Prediction } from '../engine/types';
import type { Session } from '../controller/keyboard';
import { getCurrentPrefix } from '../engine/dictionary';
export function DebugPanel({ predictions, session }: { predictions: Prediction[]; session: Session }) {
  return <section className="debug-panel"><div className="section-heading"><h2>À l’intérieur du moteur</h2><span className="mono">Préfixe : « {getCurrentPrefix(session.text) || '∅'} »</span></div>
    <p>Source : {predictions[0].source} · contributions pondérées · probabilités normalisées sur toutes les lettres, non calibrées.</p>
    <div className="table-scroll"><table><thead><tr><th>Lettre</th><th>Total</th><th>N-gram × .55</th><th>Dictionnaire × .35</th><th>Fréquence × .10</th></tr></thead>
      <tbody>{predictions.map(p => <tr key={p.char}><th>{p.char}</th><td>{p.score.toFixed(4)}</td><td>{p.contributions.ngram.toFixed(4)}</td><td>{p.contributions.dictionary.toFixed(4)}</td><td>{p.contributions.frequency.toFixed(4)}</td></tr>)}</tbody></table></div>
    <h3>Les 10 dernières frappes</h3>{session.history.length === 0 ? <p>En attente de la première frappe.</p> : <ol className="history">{session.history.map((item, i) => <li key={i}><code>« {item.context || '∅'} »</code><span>→ {item.predictions.join(' · ').toUpperCase()}</span><b>{item.selected === ' ' ? '␣' : item.selected}</b></li>)}</ol>}
  </section>;
}
