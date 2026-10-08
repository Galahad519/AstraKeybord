# Astra — Keyboard Lab

POC local de clavier prédictif français. Les lettres les plus probables viennent autour d’un point central : centre = rang 1, haut = 2, bas = 3, gauche = 4, droite = 5. L’alphabet complet n’apparaît que sur demande.

## Intention et hypothèse de recherche

Le projet s’appuie sur l’essai **« Et si le clavier n’était plus un espace à parcourir ? »**, fourni dans `essai_clavier_predictif.pdf`. Ce document expose une intention de design et des hypothèses à tester ; il ne présente pas de résultats expérimentaux démontrant un gain.

Un clavier traditionnel fonctionne comme une carte stable : chaque caractère possède une position que l’utilisateur apprend à atteindre. Cette stabilité favorise la mémoire musculaire, mais impose de déplacer les doigts vers les lettres. Astra explore la relation inverse : rester autant que possible autour d’un point central et y faire venir les caractères les plus probables.

### Une logique stable, des lettres variables

Les lettres ne sont pas équiprobables : leur pertinence dépend des caractères précédents et du préfixe courant. Après « je vais prendre le mét », les suites plausibles sont plus restreintes que l’alphabet entier. Le POC utilise cette structure pour afficher cinq propositions, recalculées après chaque saisie.

Les caractères changent, mais **la position des rangs reste constante** : le choix le plus probable au centre, puis haut, bas, gauche et droite. L’hypothèse est qu’un apprentissage pourrait se construire autour de ce comportement plutôt qu’autour de positions fixes de lettres. Cette nouvelle forme de mémoire musculaire reste à évaluer.

### Réduire le mouvement, conserver l’intention

L’objectif de recherche est de réduire l’amplitude et la distance cumulée des mouvements nécessaires pour écrire. Une hausse de vitesse éventuelle serait un résultat à mesurer, pas une conséquence garantie. Le tap central et les quatre gestes directionnels permettent d’explorer cette hypothèse.

L’utilisateur choisit chaque caractère et conserve l’intention de ce qu’il écrit. Le moteur réduit les possibilités présentées ; il ne rédige pas la phrase à sa place. La V1 repose sur des statistiques locales. La prise en compte du contexte grammatical, des mots précédents ou des habitudes individuelles appartient aux évolutions possibles.

### Prévoir les exceptions

Une prédiction imparfaite fait partie du fonctionnement normal. Le clavier secondaire assure l’accès aux lettres absentes du Top 5, et les mesures permettent d’observer le coût de ce recours. L’exemple de neuf bonnes prédictions sur dix évoqué dans l’essai est illustratif : **90 % n’est ni un résultat mesuré ni une performance garantie du prototype**.

Le clavier sert ainsi de terrain d’étude pour une question plus générale : une interface qui rapproche les choix pertinents de l’utilisateur peut-elle réduire son effort, malgré le changement permanent de son contenu ?

## Installation et lancement

Node.js 22 (22.12 minimum), 24 ou 26+. La version 24 est recommandée ; les outils de test nécessitent aussi une version compatible. Dans ce dossier :

```bash
npm install
npm run dev
```

Ouvrir l’URL affichée dans le terminal, habituellement http://127.0.0.1:5173.

```bash
npm run test        # tests unitaires du moteur, du contrôleur et des mesures
npm run build       # vérification TypeScript + bundle statique dans dist/
npm run preview     # servir le build localement
```

Les dépendances nécessitent Internet à l’installation. L’application n’effectue aucun appel réseau externe : pas de backend, API, compte, fonte distante ni modèle distant.

Pour essayer sur un téléphone du même réseau : `npm run dev -- --host 0.0.0.0`, puis ouvrir l’adresse réseau indiquée par Vite. Cette option expose uniquement le serveur de développement sur votre réseau ; elle n’est pas activée par défaut.

## Boucle d’utilisation

- Cliquer ou toucher l’une des cinq lettres pour l’insérer.
- Maintenir le centre et glisser de **28 pixels CSS** au minimum vers une direction. La touche devient active, le relâchement valide une seule lettre.
- Les petits mouvements restent un tap. Un swipe qui revient dans la zone centrale est annulé. Un geste démarré sur une touche périphérique est un clic direct ; un déplacement de 28 px l’annule. `pointercancel` et perte de capture annulent la sélection. Le pointeur primaire seulement est accepté.
- Utiliser espace, apostrophe, virgule, point, trait d’union et retour arrière sous l’étoile.
- **Autres lettres** ouvre l’alphabet AZERTY avec les accents et ligatures. Choisir une lettre referme le panneau. Échap le ferme sans saisie.
- La première lettre et les débuts de phrase après un point sont automatiquement en majuscule. **⇧** inverse la casse de la prochaine frappe ; il permet notamment d’écrire le P de Paris.
- Tab puis Entrée/Espace activent les boutons. La zone de texte est en lecture seule : le clavier physique ne permet pas de contourner l’expérience avec une saisie ou un collage.
- Le toggle de probabilités masque les pourcentages. Le debug facultatif montre les contributions et les dix derniers contextes avant insertion.
- **Phrase de test** démarre une session de copie. La correspondance exacte termine automatiquement le test. **Terminer le test** permet aussi de produire un bilan incomplet avec erreurs restantes.
- **Nouvelle session** et les boutons de mode réinitialisent le texte et les mesures. Exporter d’abord si nécessaire. Rien n’est conservé au rechargement.

## Stack et architecture

React 19, TypeScript, Vite, CSS, Pointer Events natifs, Vitest, Playwright. Aucun moteur de prédiction ne dépend de React.

```text
src/
  components/       étoile, touche, alphabet, texte, statistiques, debug
  hooks/            adaptation React, gestes et distance du pointeur
  controller/       réducteur pur : saisie, casse, session, historique, métriques
  engine/           prédicteur, dictionnaire, n-grams, ranking, types
  data/             lexique français pondéré, fréquences et n-grams
  utils/metrics.ts  schéma commun, durée, CPM, Top-5, distance d’édition
```

Flux : UI → contrôleur → moteur → données linguistiques. Les événements de saisie portent une source (`prediction`, `fallback`, `control`, `azerty`) ; l’interface AZERTY de comparaison pourra utiliser le même réducteur et les mêmes mesures. Les temps monotones `performance.now()` sont passés aux actions ; le réducteur reste déterministe et testable.

## Prédiction

`predictNextCharacters(text): Prediction[]` renvoie toutes les lettres classées ; `predictTop5(text)` en garde cinq. L’interface consomme l’adaptateur `PredictionEngine.predict(text)` dans `useKeyboardController`.

1. Normalisation Unicode NFC et minuscules françaises, **sans suppression des accents**.
2. Extraction du segment de lettres courant ; espace, apostrophe droite/courbe, tiret et ponctuation marquent une frontière.
3. N-gram : contexte de deux caractères connu (trigramme), sinon un caractère (bigramme), sinon fréquence générale. Un espace virtuel représente le début de mot.
4. Dictionnaire : distribution des lettres immédiatement après le préfixe. L’index de préfixes est construit une seule fois.
5. Chaque distribution est normalisée. Score = `0.55 × ngram + 0.35 × dictionary + 0.10 × frequency`. Les poids sont dans `src/engine/ranking.ts`.
6. Tri décroissant, départage stable par caractère. Les contributions du debug s’additionnent au score. Les probabilités sont normalisées sur **toutes** les lettres, pas seulement sur le Top 5. Si le dictionnaire ne reconnaît rien, ses scores valent zéro et la normalisation finale redistribue la masse disponible.

Les pourcentages sont des scores relatifs heuristiques, **pas des probabilités linguistiques calibrées**. Les cinq lettres n’ont pas à totaliser 100 %. Espaces et ponctuation restent dans les commandes secondaires et ne sont pas prédits en V1.

### Modifier les données

Ajouter des mots dans les listes de `src/data/frenchWords.ts` (lexique composé manuellement, sans corpus importé). Les mots courants reçoivent un poids 12 et les autres 2 ; adapter ces poids selon les besoins. Les doublons sont éliminés.

Les bigrammes et trigrammes sont dérivés du lexique une seule fois au chargement, avec ses poids. Ajouter un mot enrichit donc à la fois le dictionnaire et les n-grams. Pour une règle explicite, ajouter une entrée après la construction dans `src/data/frenchNgrams.ts` :

```ts
Object.assign(TRIGRAMS, { qu: { e: 70, i: 22, a: 6, o: 2 } });
Object.assign(BIGRAMS, { m: { e: 40, a: 25, i: 15, o: 12, u: 8 } });
```

Ajouter tout nouveau caractère prédit à `LETTER_FREQUENCIES` et au clavier secondaire si nécessaire. L’ensemble des candidats principaux vient de cette table. Le moteur est synchrone, local et déterministe ; le déplacer dans un Worker nécessitera seulement un adaptateur asynchrone dans le contrôleur/hook, sans changer les composants de touches.

## Protocole de mesure V1

| Mesure | Définition |
| --- | --- |
| Caractères tapés | Insertions cumulées, espaces/ponctuation compris. Les suppressions ne décrémentent pas ce compteur. La longueur du texte est affichée séparément. |
| Durée | Temps depuis la première insertion. Inclut les pauses ; figé à la fin du test. Avant la première frappe : zéro. |
| Car/min | Insertions cumulées × 60 000 / durée en ms. Débit brut, corrections comprises. |
| Top-5 hit rate | Lettres saisies via les propositions / lettres saisies au total. Une lettre choisie dans l’alphabet compte comme un échec, même si elle figurait aussi dans les propositions, conformément au protocole du POC. Casse ignorée. Espaces et ponctuation exclus. |
| Ouvertures alphabet | Nombre de passages fermé → ouvert, y compris si aucune lettre n’est choisie. Une ouverture seule ne change pas le hit rate. |
| Saisies de secours | Nombre d’insertions depuis l’alphabet. |
| Retours arrière | Nombre d’activations de ⌫, même sur texte vide. |
| Erreurs de saisie | En test seulement, insertion différente du caractère cible à la même position. Une erreur de décalage peut donc en produire plusieurs. |
| Erreurs corrigées | Suppressions d’insertions marquées erronées. Une suppression de caractère correct n’en est pas une. Non mesurable en saisie libre (affiché « — »). |
| Erreurs restantes | Distance de Levenshtein entre le texte final et la cible complète ; inclut les caractères manquants si test interrompu. |
| Distance | Somme euclidienne des mouvements Pointer Events, en pixels CSS, dans **toute la zone du clavier** (étoile, contrôles, alphabet). Inclut le survol souris ; le tactile ne mesure que les contacts. Pas de distance inventée entre deux contacts ni hors de la zone. Inclut la préparation avant la première frappe. |
| Positions | Nombre de sélections prédictives par direction, clics, taps, swipes et activation accessible compris. |

La distance souris et la distance tactile ne sont donc **pas directement comparables**. Garder le même dispositif, viewport et protocole dans une future comparaison AZERTY. La saisie au clavier via focus n’a pas de distance pointeur associée.

L’export JSON contient la version du schéma, le mode, le texte, la cible, les métriques brutes/dérivées, les dix derniers contextes et la définition du protocole. Les horodatages sont relatifs à la page. L’export reste un téléchargement local.

## Tests navigateur

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright démarre Vite automatiquement s’il n’est pas déjà actif. Deux configurations : desktop Chromium et téléphone tactile émulé. Les scénarios vérifient la saisie, accents, retour arrière, hit rate, clavier accessible, toggle, debug, swipe, annulation, phrase cible complète, fin de session, export et absence de débordement horizontal. Captures dans `test-results/`. Il reste utile de tester sur de vrais téléphones pour évaluer la prise en main et le confort du geste.

## Évaluation UX et pistes issues de l’essai

La difficulté centrale est le compromis entre déplacement réduit et recherche visuelle. Un clavier dynamique peut imposer de regarder les propositions à chaque frappe et perdre, au départ, l’avantage de la mémoire musculaire acquise sur AZERTY. La qualité du moteur seule ne suffit donc pas à valider le concept.

Une future comparaison devra observer plusieurs dimensions :

| Dimension | État dans la V1 / évaluation à prévoir |
| --- | --- |
| Vitesse | Caractères par minute disponibles ; comparer l’évolution au fil des sessions, pas seulement le premier essai. |
| Mouvement | Distance du pointeur disponible ; comparer sur le même dispositif et avec le même protocole. |
| Précision | Erreurs, corrections et retours arrière disponibles en mode test. |
| Couverture des propositions | Top-5 et recours à l’alphabet disponibles selon les conventions décrites ci-dessus. |
| Apprentissage | Prévoir des sessions répétées et tenir compte de l’expérience préalable avec AZERTY. Aucun suivi longitudinal intégré. |
| Effort cognitif et recherche visuelle | Prévoir observations et retours utilisateurs ; ces dimensions ne sont pas mesurées automatiquement par le POC. |

Les essais devraient notamment déterminer si le gain de mouvement compense le temps de lecture des propositions et l’accès aux exceptions. Une supériorité immédiate face à un utilisateur expérimenté d’AZERTY n’est pas un prérequis ; un bénéfice à terme reste néanmoins à démontrer.

Pistes proposées par l’essai, **non implémentées dans la V1** :

- Ouvrir l’alphabet par appui long ou geste supplémentaire.
- Utiliser des diagonales pour accéder à des propositions secondaires, voire tester neuf choix (centre et huit directions).
- Enrichir la prédiction avec le contexte de phrase, la grammaire ou les habitudes linguistiques de l’utilisateur.

Ces variantes pourront être étudiées séparément pour identifier leur effet sur la précision, l’amplitude des gestes et la charge cognitive. Elles ne changent pas le périmètre actuel : cinq propositions, quatre directions et moteur local sans LLM.

## Limites et prochaines étapes

- Petit lexique heuristique, pas un modèle entraîné ni une preuve de supériorité face à AZERTY. Les formes rares, noms propres et conjugaisons peuvent nécessiter souvent le secours.
- Modèle de caractères et de préfixes ; pas de compréhension sémantique, adaptation à l’utilisateur ou suggestion de mots.
- Saisie en fin de texte uniquement, pas de déplacement de curseur ; lettres françaises et ponctuation minimale, pas de chiffres ni emoji.
- Pas de persistance, ni service worker/offline installable. Une page déjà chargée fonctionne sans connexion ; il faut garder le serveur local pour la recharger.
- Annulation tactile et retours dans la zone morte doivent être évalués sur matériel réel.
- Ajouter un clavier AZERTY permanent utilisant le contrôleur commun, un corpus indépendant avec fréquences validées, des essais contrebalancés, puis éventuellement un Worker si le lexique grossit.

## Validation de cette version

27 tests unitaires réussis ; 9 scénarios navigateur réussis (desktop et tactile émulé), dont les quatre directions tactiles et la phrase complète. Le scénario exclusivement tactile est ignoré sur desktop. Build TypeScript/Vite validé. Aucun test sur téléphone physique à ce stade.
