import { useRef, useState } from 'react';
import { useKeyboardController } from './hooks/useKeyboardController';
import { usePointerDistance } from './hooks/usePointerDistance';
import { POSITIONS, editDistance, formatDuration } from './utils/metrics';
import type { Position } from './utils/metrics';
import { PredictiveKeyboard } from './components/PredictiveKeyboard';
import { SecondaryKeyboard } from './components/SecondaryKeyboard';
import { TextDisplay } from './components/TextDisplay';
import { KeyboardStats } from './components/KeyboardStats';
import { DebugPanel } from './components/DebugPanel';
export default function App() {
  const { session, dispatch, predictions, uppercase, derived } = useKeyboardController();
  const [probabilities, setProbabilities] = useState(true);
  const [debug, setDebug] = useState(false);
  const fallbackButton = useRef<HTMLButtonElement>(null);
  const distance = usePointerDistance(pixels => dispatch({ type: 'distance', pixels }));
  const select = (position: Position) => dispatch({ type: 'insert', char: predictions[POSITIONS.indexOf(position)].char,
    source: 'prediction', position, now: performance.now() });
  const control = (char: string) => dispatch({ type: 'insert', char, source: 'control', now: performance.now() });
  const closeFallback = () => { dispatch({ type: 'close-fallback' }); fallbackButton.current?.focus(); };
  function downloadSession() {
    const blob = new Blob([JSON.stringify({ schemaVersion: 1, keyboardMode: 'predictive', ...session,
      derived, remainingErrors: session.mode === 'test' ? editDistance(session.text, session.target) : null,
      pointerDistanceUnit: 'css-pixels', hitRateProtocol: 'letters-only; fallback-letter-is-miss' }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = 'astra-session.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="app-shell">
    <header className="app-header"><a className="wordmark" href="./" aria-label="Astra, accueil"><span className="brand-mark" aria-hidden="true">✳</span> astra<span className="lab-label">KEYBOARD LAB</span></a><span className="version">PROTOTYPE <b>01</b></span></header>
    <main>
      <div className="intro"><div><div className="eyebrow">EXPÉRIENCE DE SAISIE / FRANÇAIS</div><h1>Cinq lettres.<br className="mobile-break"/> Un point de départ.</h1><p>Restez au centre. La prochaine lettre vient à vous.</p></div><span className="local-badge"><span className="status-dot"/>100 % local</span></div>
      <div className="session-toolbar"><div className="mode-switch" role="group" aria-label="Mode de saisie"><button aria-pressed={session.mode === 'free'} onClick={() => dispatch({ type: 'reset', mode: 'free' })}>Saisie libre</button><button aria-pressed={session.mode === 'test'} onClick={() => dispatch({ type: 'reset', mode: 'test' })}>Phrase de test</button></div><button className="text-button reset" onClick={() => dispatch({ type: 'reset' })}>↺ Nouvelle session</button></div>
      {session.mode === 'test' && <section className="target-panel"><div className="section-heading"><span className="eyebrow">PHRASE CIBLE</span><span className="mono">{Math.min(Array.from(session.text).length, session.target.length)} / {session.target.length}</span></div><p>{Array.from(session.target).map((char, i) => <span key={i} className={i < session.text.length ? (session.text[i] === char ? 'target-correct' : 'target-wrong') : ''}>{char}</span>)}</p><small>Respectez les accents et la casse. Utilisez ⇧ pour le P de Paris. Changer de mode démarre une nouvelle session.</small></section>}
      <TextDisplay text={session.text} target={session.target} test={session.mode === 'test'}/>
      {session.completed && <section className="summary" role="status"><span className="eyebrow">SESSION TERMINÉE</span><h2>{session.text === session.target ? 'Phrase recopiée. Bien joué.' : 'Votre expérience en chiffres.'}</h2><p>{formatDuration(derived.duration)} · {Math.round(derived.cpm)} car/min · Top-5 {derived.hitRate?.toFixed(1) ?? '—'} %</p><p>{session.metrics.errors} erreurs cumulées · {session.metrics.correctedErrors} corrigées · {editDistance(session.text, session.target)} erreurs restantes (distance d’édition)</p><p>{session.metrics.backspaces} retours arrière · {session.metrics.fallbackSelections} saisies de secours / {session.metrics.fallbackOpenings} ouvertures · {Math.round(session.metrics.pointerDistance)} px</p><button className="primary-button" onClick={downloadSession}>Exporter les résultats ↓</button><button className="text-button" onClick={() => dispatch({ type: 'reset' })}>Recommencer ↗</button></section>}
      <section className="keyboard-panel" aria-label="Zone de saisie" {...distance}>
        <div className="section-heading"><span className="eyebrow">CLAVIER PRÉDICTIF</span><label className="toggle-label"><input type="checkbox" checked={probabilities} onChange={e => setProbabilities(e.target.checked)}/><span className="toggle"/>Afficher les probabilités</label></div>
        <div className="keyboard-stage"><div className="side-note"><span className="note-number">01</span><h2>Un tap.<br/>Ou une direction.</h2><p>Touchez une lettre, ou glissez depuis le centre vers l’une des quatre directions.</p></div>
          <PredictiveKeyboard predictions={predictions} uppercase={uppercase} probabilities={probabilities} disabled={session.completed || session.secondaryOpen} onSelect={select}/>
          <div className="side-note right-note"><span className="tiny-cross" aria-hidden="true">⌖</span><p>Les cinq propositions<br/>évoluent à chaque frappe.</p><span className="mono subtle">CENTRE = CHOIX N° 1</span></div></div>
        <div className="keyboard-controls"><button aria-label="Majuscule pour la prochaine lettre" aria-pressed={uppercase} onClick={() => dispatch({ type: 'shift' })} disabled={session.completed}>⇧</button><button aria-label="Apostrophe" onClick={() => control("'")} disabled={session.completed}>'</button><button aria-label="Virgule" onClick={() => control(',')} disabled={session.completed}>,</button><button className="space-key" onClick={() => control(' ')} disabled={session.completed}>espace <span>␣</span></button><button aria-label="Point" onClick={() => control('.')} disabled={session.completed}>.</button><button aria-label="Trait d’union" onClick={() => control('-')} disabled={session.completed}>-</button><button aria-label="Retour arrière" onClick={() => dispatch({ type: 'backspace', now: performance.now() })} disabled={session.completed}>⌫</button></div>
        <button ref={fallbackButton} className="fallback-button" aria-expanded={session.secondaryOpen} aria-controls="secondary-keyboard" disabled={session.completed}
          onClick={() => session.secondaryOpen ? closeFallback() : dispatch({ type: 'open-fallback' })}><span>⌨</span> {session.secondaryOpen ? 'Masquer l’alphabet' : 'Autres lettres'} <span>↗</span></button>
        {session.secondaryOpen && <SecondaryKeyboard uppercase={uppercase} onClose={closeFallback} onSelect={char => { dispatch({ type: 'insert', char, source: 'fallback', now: performance.now() }); fallbackButton.current?.focus(); }}/>} 
        <p className="keyboard-hint">Cliquez · Touchez · Glissez <span>Seuil de geste : 28 px</span></p>
      </section>
      <KeyboardStats metrics={session.metrics} derived={derived} test={session.mode === 'test'}/>
      <div className="bottom-tools"><button className="text-button" aria-expanded={debug} onClick={() => setDebug(!debug)}><span className="mono">{'</>'}</span> {debug ? 'Masquer le debug' : 'Ouvrir le debug'} {debug ? '−' : '+'}</button><div>{session.mode === 'test' && !session.completed && <button className="text-button" disabled={session.metrics.startedAt === null} onClick={() => dispatch({ type: 'finish', now: performance.now() })}>Terminer le test</button>}<button className="text-button" onClick={downloadSession}>Exporter la session ↓</button></div></div>
      {debug && <DebugPanel predictions={predictions} session={session}/>}
    </main><footer><span>ASTRA / LABORATOIRE D’INTERACTION</span><span>Une hypothèse à explorer, une frappe à la fois.</span><span className="mono">V 0.1.0</span></footer>
  </div>;
}
