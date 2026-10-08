import { useEffect, useRef } from 'react';
const rows = ['azertyuiop', 'qsdfghjklm', 'wxcvbn', 'éèêëàâùûüîïôöçœæÿ'];
export function SecondaryKeyboard({ uppercase, onSelect, onClose }: {
  uppercase: boolean; onSelect: (char: string) => void; onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => { panel.current?.querySelector('button')?.focus(); }, []);
  return <div id="secondary-keyboard" className="secondary-keyboard" ref={panel} role="group" aria-label="Alphabet complet"
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); onClose(); } }}>
    <div className="section-heading"><span className="eyebrow">ALPHABET COMPLET</span><button onClick={onClose} className="text-button">Fermer ×</button></div>
    {rows.map(row => <div className="alphabet-row" key={row}>{Array.from(row).map(char => <button key={char}
      aria-label={`Insérer ${uppercase ? char.toLocaleUpperCase('fr') : char}`}
      onClick={() => onSelect(char)}>{uppercase ? char.toLocaleUpperCase('fr') : char}</button>)}</div>)}
    <p>Une sélection referme l’alphabet et actualise les prédictions.</p>
  </div>;
}
