# Spécification fonctionnelle – Index BreastWise

## 1. Présentation générale

- Produit : BreastWise (site d’accompagnement des femmes dans le parcours du cancer du sein)
- Objectifs :
  - aider à organiser le quotidien pendant le traitement,
  - vulgariser les documents médicaux,
  - offrir un soutien émotionnel continu et bienveillant.
- Public cible : femmes en traitement + éventuellement leurs proches.

## 2. Liste des pages / modules

> Le détail de chaque page se trouve dans un fichier dédié dans `docs/pages/`.

- **Accueil**
  - Route : `/`
  - Rôle : présenter BreastWise, expliquer la promesse, orienter vers l’inscription / connexion.
  - Détail : `docs/pages/accueil.md`

- **Tableau de bord “Énergie, Émotion & Traitement”**
  - Route : `/dashboard`
  - Rôle : vue d’ensemble de l’état du jour et des étapes du traitement.
  - Détail : `docs/pages/dashboard.md`

- **État du jour (historique détaillé)**
  - Route : `/etat-du-jour`
  - Rôle : voir l’évolution énergie / fatigue / humeur sur le temps.
  - Détail : `docs/pages/etat_du_jour.md`

- **Suivi du traitement**
  - Route : `/traitement`
  - Rôle : timeline des rendez-vous et étapes médicales.
  - Détail : `docs/pages/traitement.md`

- **Plan du jour avec IA**
  - Route : `/plan-du-jour`
  - Rôle : proposer un planning adapté à l’état du moment.
  - Détail : `docs/pages/plan_du_jour.md`

- **Journal guidé & soutien moral**
  - Route : `/journal`
  - Rôle : permettre d’exprimer ses émotions avec des questions guidées.
  - Détail : `docs/pages/journal.md`

- **Espace bien-être / exercices**
  - Route : `/bien-etre`
  - Rôle : bibliothèque d’exercices (respiration, visualisation, etc.).
  - Détail : `docs/pages/bien_etre.md`

- **Documents & vulgarisation**
  - Route : `/documents`
  - Rôle : importer, consulter et comprendre les documents médicaux.
  - Détail : `docs/pages/documents.md`

## 3. Règles UX / ton global

- Langue : français.
- Ton : chaleureux, rassurant, simple, jamais culpabilisant.
- Mettre en avant les petites victoires et les efforts (“Vous avez pris soin de vous aujourd’hui.”).
- Éviter le jargon médical sans explication claire à côté.
- Proposer toujours une action douce après une alerte (ex : exercice de respiration, pause, contacter un proche).

## 4. Lien avec les autres docs

- `docs/modeles_donnees.md` : décrit les tables utilisées par toutes ces pages (Utilisateurs, Rendez-vous, Suivi énergie/émotion, Documents).
- `docs/ia_fonctionnalites.md` : décrit comment l’IA intervient (plan du jour, vulgarisation, messages de soutien).
- `docs/maquettes_fonctionnelles.md` : croquis / maquettes d’écrans si besoin.

## 5. Prochaines étapes

- Créer un fichier par page dans `docs/pages/`.
- Pour chaque page, décrire :
  - Objectif de la page
  - Contenu affiché
  - Actions possibles
  - Navigation depuis/vers les autres pages
  - Questions ouvertes ou idées futures