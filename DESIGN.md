# DESIGN.md — Autobahn Studio

> Boussole DA du site **autobahn-studio.com**.
> Toute proposition visuelle, ajout de page ou refonte doit être lue à travers ce filtre.
> Si une décision contredit ce doc, on en discute AVANT de la prendre — on ne glisse pas dans les défauts par réflexe.

---

## 1. Identité visuelle — synthèse

Autobahn n'est pas "un studio créatif minimal de plus". Le site doit **trancher** avec la nouvelle vague de portfolios studio (Inter + dark mode + uppercase letter-spacé). On vise une identité **brutaliste contrôlée + technique + colorée par section**.

Trois piliers :

- **Brutalisme contrôlé** — layouts assumés, contrastes francs, filets épais, refus du polish, off-grid intentionnel.
- **Typographie mono partout, display lourde en titre** — feel documentaire / catalogue / archive technique. Pas de sans-serif lisse en corps de texte.
- **Fond blanc + accent fort par section** — chaque page a sa couleur d'accentuation propre. Sortir du noir comme défaut.

Ce que ça donne en pratique : un site qui ressemble plus à un fanzine / catalogue d'archive / dossier technique qu'à un site studio web. Plus proche d'un Are.na, FACE Studio, Linked by Air, Manuel Bürger que d'un Bureau Borsche / Studio Output / Awwwards 2024.

---

## 2. Famille esthétique — Brutalisme contrôlé

### Règles de mise en page

- **Grilles asymétriques** assumées. Pas tout centré. Décaler intentionnellement.
- **Espacements brutaux** : soit très grand (200px+), soit très serré (4-8px). Éviter les espaces "moyens et confortables" (32-48px) qui lissent la page.
- **Filets épais** : 2px / 4px / 8px. Pas de hairline 0.5px. Pas de border-radius non plus — tout est en angles vifs.
- **Off-grid intentionnel** : un élément qui sort du cadre, un texte qui chevauche, un bloc décalé de 12px par rapport au reste. Le déséquilibre est un outil, pas un bug.
- **Contraste typographique extrême** : un titre de 120-200px à côté d'un mono de 9px. Pas de tailles "moyennes".

### Détails graphiques signature

- Numérotation visible des sections (`##01`, `##02`, `[03]`).
- Tags et labels avec bordure franche autour, pas de pill rounded.
- Crochets typographiques en éléments décoratifs : `[ ]`, `{ }`, `< >`, `//`, `——`.
- Trames de fond ponctuelles (CSS `background-image` à base de répétitions), pas en permanence.
- Curseurs custom sur les éléments interactifs (déjà commencé avec les pointeurs custom).

### Ce qu'on évite (sinon je retombe dedans par défaut)

- Border-radius (sauf badges très specifiques)
- Ombres molles / `box-shadow: 0 4px 24px rgba(0,0,0,0.1)`
- Gradients doux
- Fade-in subtils sur tout (les apparitions doivent être brutales ou pas du tout — un slide-up 600ms avec ease-out, jamais un blur progressif)
- Parallax / scroll-storytelling
- Centrage par défaut
- "Polish" : tout doit avoir l'air légèrement brut, jamais lissé

---

## 3. Typographie

### Stack final visé

**Titres / display** — une typo display avec présence et caractère. Options concrètes (à choisir une) :
- `Migra` (Pangram Pangram) — display contemporaine inktrap
- `Tobias` ou `Tobias Display` (Klim) — serif noir lourde
- `ABC Whyte Inktrap` (Dinamo) — grotesk inktrap moderne
- `Reckless Neue` (Displaay) — serif éditoriale chaude
- `Editorial New` (Pangram Pangram) — italique très caractérisée

À défaut (variante gratuite Google Fonts) : `Fraunces`, `Instrument Serif`, `Big Shoulders Display`.

**Corps + UI + labels** — mono, partout. Options :
- `Departure Mono` (futur classique, esthétique pixel grid)
- `IBM Plex Mono` (Google Fonts, gratuit, solide)
- `Fragment Mono` (Pangram, plus designy)
- `JetBrains Mono` (gratuit, plus dev mais fonctionne)
- `ABC Diatype Mono` (Dinamo, mais payante)

Mon vote : `Migra` pour les titres + `Departure Mono` (ou `IBM Plex Mono` en gratuit) pour tout le reste. À discuter.

### Règles d'usage

- **Titres** : pas en uppercase letter-spacé. On laisse la display respirer en bas/haut de casse normale, ponctuation comprise.
- **Mono** : pas de letter-spacing en uppercase systématique. Casse normale, minuscules majoritaires. L'esthétique mono se suffit à elle-même.
- **Hiérarchie par taille + poids extrême**, pas par changement de famille. Pas plus de 2 familles totales sur le site.
- **Tailles** : `9px / 11px / 14px / 18px / 32px / 64px / 120px+`. Pas de `16px` ou `20px` "safe".
- **Italiques** : usage assumé et visible, surtout en titre display. Pas réservé aux légendes.

---

## 4. Couleurs

### Principe

**Fond clair par défaut sur toutes les pages.** Le dark mode peut rester comme toggle utilisateur mais c'est plus une option qu'un défaut. Aujourd'hui le site est en dark par défaut, ça doit s'inverser.

Chaque section principale a sa **couleur d'accentuation forte**, utilisée généreusement (pas juste pour un lien d'accent — pour le titre principal, pour des blocs entiers, pour les éléments clés).

### Palette par section (proposition à valider/ajuster)

| Section  | Couleur          | Hex       | Usage |
|----------|------------------|-----------|-------|
| Home     | Orange brûlé     | `#E84A1F` | Titre principal, filets clés, bandeau footer |
| Team     | Bleu cobalt      | `#1A2ED5` | (déjà existant — on garde) |
| Lab      | Vert acide       | `#7AE810` | Titre LAB, marqueurs de mois, picto actif |
| Studio   | Rose chaud       | `#FF4D8A` | Bio-block highlight, bouton submit |
| Contact  | Violet électrique| `#5B1FE8` | Titre, sélecteur destinataire, bouton Send |

Le fond reste constant (`#F5F4F0` ou `#FFFFFF` pur) pour ne pas faire 5 sites différents. C'est l'**accent** qui change. Les noirs et gris secondaires restent neutres.

### Règles

- L'accent doit être utilisé **massivement** sur sa page, pas en touche. Au moins le titre principal + un élément structurel (filet, bandeau, bloc plein).
- Pas plus de 2 couleurs simultanées sur une page (le fond + l'accent + le noir/gris pour le texte).
- Pas de gradients. Pas de transparences fines. Aplats nets.

---

## 5. Layout — règles à suivre

### Grilles

- **12 colonnes desktop**, mais on n'aligne pas tout dessus. On break la grille de manière contrôlée.
- **Mobile** : 4 colonnes, idem on casse.
- **Vide assumé** : certains blocs prennent 2 colonnes sur 12, le reste est blanc. Pas peur du vide.

### Hiérarchie

- Le titre principal de chaque page doit prendre **au moins 30% de la hauteur visible** au chargement.
- Les méta-données (date, n° d'ordre, catégorie) sont visibles partout, en mono petit. Elles font partie de la DA.
- Les CTA principaux sont **plein aplat couleur d'accent**, pas de bordure outline-only.

### Composants signature

- **Tags fermés** : `[motion]`, `[vfx]`, `[3d]` — avec crochets typographiques, pas avec border CSS arrondi.
- **Tables / listes** : visibles, alignées mono, séparateurs filets épais (2px).
- **Cartes** : pas de shadow, pas de radius. Bordures franches ou pas de bordure du tout (juste un fond couleur).
- **Boutons** : aplat couleur d'accent + texte mono petit en uppercase ou normal selon contexte. Pas de hover qui change tout — juste un shift de couleur ou un underline qui apparaît.

---

## 6. Animation & interaction

- **Apparitions** : transitions de 200-400ms maximum, easing brut (`cubic-bezier(0.5, 0, 0.75, 0)` = ease-in cassant). Pas d'`ease-in-out` "smooth".
- **Hovers** : changement instantané (transition 0s) ou très court (100ms). Pas de smooth lent qui sent le studio web.
- **Scroll-revealed** : OK mais brut. Le contenu apparaît cut, pas en fade flou.
- **Curseurs custom** : maintenir, c'est bien.
- **Pas de** : parallax, scroll-storytelling, GSAP magique avec 14 timelines, lottie de chargement.

---

## 7. Anti-patterns explicites — à NE PAS faire

À chaque fois que je propose un truc qui rentre dans ces cases, c'est un retour à mes défauts — challenge-moi ou refuse.

- ❌ Fond noir uni par défaut sur la page
- ❌ Typo Inter, Geist, Helvetica, DM Sans, Manrope ou autre grotesk neutre dominante
- ❌ Uppercase + letter-spacing systématique pour les labels ("MENTIONS LÉGALES" toujours stylé comme ça)
- ❌ Toggle dark/light qui inverse juste les couleurs sans nouvelle saveur
- ❌ Vidéo plein écran en bg avec un titre centré et un compteur de créateurs
- ❌ Carousel auto qui fade entre 4 photos
- ❌ Hover avec scale(1.05) + opacity 0.8 partout
- ❌ Footer mono "© 2026 Autobahn — All rights reserved" centré
- ❌ Border-radius sur les images, les cartes, les boutons
- ❌ Shadow `0 4px 20px rgba(0,0,0,0.1)` ou similaire
- ❌ Gradient soft en arrière-plan d'un titre
- ❌ Boutons outline avec un cercle qui tourne au hover

---

## 8. Références concrètes — sites à étudier

Ce sont les baromètres. Quand je propose un visuel, je dois pouvoir le rapprocher d'un de ces sites, pas d'un site Awwwards moyen.

- **Linked by Air** — linkedbyair.net — brutalisme contrôlé propre, archive technique
- **FACE Studio** — face-studio.com — brutalisme, mono, contrastes francs
- **Manuel Bürger** — manuelbuerger.com — print-influenced, asymétrie
- **Bureau Cool** — bureau-cool.com — minimalisme cassé, mono partout
- **Cosmos.so** — base de données / archive feel
- **Are.na** — same energy : fonctionnel pousse, mono, archive
- **North Studio (NZ)** — northdesign.co.nz — sérigraphie / print energy
- **Pentagram Editorial** — projets type Saturday Night Live posters, hand-set type
- **Praline (London)** — pralinepraline.com — éditorial print → digital

À l'inverse, voici des sites qui **représentent ce qu'on évite** (très beaux mais ce sont les défauts du moment) :
- Awwwards Sites of the Day 2023-2024 (en moyenne)
- Bureau Borsche projets clients luxe
- Studio Output portfolio
- Locomotive Mtl

---

## 9. Stack technique de la transition

Le site existe déjà avec une DA "default Claude" — on transitionne progressivement, on ne refait pas tout d'un coup. Ordre de priorité :

1. **Typos** : remplacer Geist + Inter par la stack mono + display choisie (gros impact visuel, refacto modéré)
2. **Couleurs par section** : injecter les 5 couleurs d'accent dans le `design.css`, basculer le défaut light/dark
3. **Composants** : retirer border-radius, ombres, fade-ins. Reprendre boutons, cartes, footers en aplat brut.
4. **Layouts** : casser les grilles centrées sur 1-2 pages d'abord (Lab et Studio s'y prêtent bien), généraliser ensuite.
5. **Animations** : remplacer les transitions smooth par des cuts ou des transitions brutales courtes.

Chaque étape se valide visuellement avant la suivante.

---

## 10. Workflow avec Claude

Quand je (Claude) propose une modif visuelle, je dois :

1. Citer ce doc explicitement ("d'après §3, on utilise mono pour les labels donc...").
2. Donner une référence concrète (un site de la section 8, ou un autre, mais nommé).
3. Si je ne sais pas comment trancher → poser une question, ne pas proposer "mon défaut".
4. Si tu (Guillaume) penses que je glisse vers mes défauts → reformule la demande avec "Tu retombes dans les anti-patterns. Relis DESIGN.md §7."

Ce doc est vivant : tu peux le modifier à tout moment, je le relis à chaque session sur ce projet.
