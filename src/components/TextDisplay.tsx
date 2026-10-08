import { useEffect, useRef } from 'react';
export function TextDisplay({ text, target, test }: { text: string; target: string; test: boolean }) {
  const output = useRef<HTMLDivElement>(null);
  useEffect(() => { if (output.current) output.current.scrollTop = output.current.scrollHeight; }, [text]);
  return <section className="text-panel">
    <div className="section-heading"><span className="eyebrow">VOTRE TEXTE</span><span className="muted mono">{Array.from(text).length} caractères</span></div>
    <div className="text-output" ref={output} role="textbox" aria-label="Texte saisi" aria-readonly="true" tabIndex={0}>
      {text ? Array.from(text).map((char, index) => <span key={index} className={test && char !== Array.from(target)[index] ? 'incorrect' : ''}>{char}</span>)
        : <span className="placeholder">Les lettres viennent à vous.</span>}<span className="caret" aria-hidden="true"/>
    </div>
    <div className="text-footnote"><span className="status-dot"/>Saisie avec le clavier expérimental uniquement<span className="mono">FR</span></div>
  </section>;
}
