# Web Editor - Documentation

## Table des matières

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Démarrage rapide](#démarrage-rapide)
4. [Interface utilisateur](#interface-utilisateur)
5. [Gestion des pages](#gestion-des-pages)
6. [Système de composants](#système-de-composants)
7. [Arborescence et navigation](#arborescence-et-navigation)
8. [Propriétés et styles](#propriétés-et-styles)
9. [Design tokens et variables CSS](#design-tokens-et-variables-css)
10. [Graphe de navigation](#graphe-de-navigation)
11. [Import/Export](#importexport)
12. [Raccourcis clavier](#raccourcis-clavier)
13. [Fonctionnalités avancées](#fonctionnalités-avancées)

---

## Introduction

Web Editor est un éditeur visuel de sites web qui permet de créer des interfaces utilisateur de manière intuitive via un système de glisser-déposer. L'application génère du code HTML/CSS propre et exportable, avec support pour les pages multiples, les composants réutilisables et la navigation inter-pages.

### Principales fonctionnalités

- Éditeur visuel WYSIWYG avec drag & drop
- Système de pages multiples avec routage
- Création et réutilisation de composants personnalisés
- Graphe de navigation interactif
- Design tokens et variables CSS globales
- Export en JSON ou ZIP (projet complet)
- Historique undo/redo
- Multi-sélection et manipulation d'éléments
- Système de grille magnétique

---

## Installation

### Prérequis

- Serveur web local (Apache, Nginx, WAMP, etc.)
- Navigateur moderne (Chrome, Firefox, Edge)

### Installation

1. Cloner ou télécharger le projet dans votre répertoire web
2. Ouvrir `index.php` dans votre navigateur
3. Aucune configuration supplémentaire n'est requise

---

## Démarrage rapide

### Créer votre première page

1. Au lancement, cliquez sur "Nouvelle page" dans le panneau vide
2. Configurez les propriétés de la page (titre, route, métadonnées)
3. Glissez des composants depuis la bibliothèque vers le workspace
4. Positionnez et stylisez les éléments via le panneau de propriétés
5. Exportez votre projet via le menu "Exporter"

### Workflow type

```
1. Créer une page
   └─> 2. Ajouter des composants
       └─> 3. Configurer les styles
           └─> 4. Créer la navigation
               └─> 5. Exporter le projet
```

---

## Interface utilisateur

### Barre supérieure

La barre supérieure contient les actions principales :

- **Importer** : Charger un projet JSON existant
- **Exporter** : 
  - JSON : Structure de données du projet
  - ZIP : Projet complet avec HTML/CSS/JS
- **Effacer** : Supprimer tout le projet
- **Graphe** : Visualiser la structure de navigation
- **Tokens** : Gérer les design tokens
- **Mode Composant** : Activer la création de composants réutilisables

### Panneau gauche

Trois onglets principaux :

1. **Composants** : Bibliothèque de composants HTML standard et personnalisés
2. **Arborescence** : Vue hiérarchique des éléments de la page courante
3. **Pages** : Liste et gestion des pages du projet

### Zone centrale (Canvas)

Workspace où vous construisez visuellement vos pages. Supporte :

- Zoom/dézoom avec Ctrl + molette
- Pan avec Ctrl + Shift + clic gauche
- Sélection multiple avec Ctrl + clic
- Redimensionnement en direct

### Panneau droit

Trois onglets :

1. **Propriétés** : Édition des attributs et styles de l'élément sélectionné
2. **Tokens** : Gestion des design tokens (couleurs, typographie, espacement)
3. **Variables CSS** : Variables CSS globales du projet

---

## Gestion des pages

### Créer une page

1. Cliquer sur l'onglet "Pages" dans le panneau gauche
2. Cliquer sur "+ Nouvelle page"
3. Configurer :
   - **Titre** : Nom de la page (affiché dans l'onglet du navigateur)
   - **Route** : URL de la page (ex: `/contact`)
   - **Description** : Métadonnée pour le SEO

### Navigation entre pages

- Cliquer sur une page dans la liste pour l'éditer
- La page courante est mise en évidence
- Les éléments sont automatiquement sauvegardés lors du changement de page

### Propriétés de page

Accessible en cliquant sur l'icône d'information à côté du nom de la page :

- Titre et métadonnées (description, keywords)
- Favicon personnalisé
- Scripts et styles personnalisés (head/body)
- Définir comme page principale

### Dupliquer/Supprimer

- **Dupliquer** : Créer une copie complète de la page avec tous ses éléments
- **Supprimer** : Retirer la page du projet (avec confirmation)

---

## Système de composants

### Composants HTML standard

Disponibles dans l'onglet "Composants" :

- **Conteneurs** : DIV, Section, Article, Header, Footer, Nav
- **Texte** : Heading (H1-H6), Paragraph, Span
- **Formulaires** : Input, Textarea, Button, Select, Form
- **Médias** : Image, Video
- **Listes** : UL, OL, LI
- **Liens** : A (ancre)

### Créer un composant personnalisé

1. Activer le "Mode Composant" dans la barre supérieure
2. Construire votre composant dans le workspace vide
3. Cliquer sur "Sauvegarder Composant"
4. Nommer le composant et confirmer
5. Le composant apparaît dans l'onglet "Mes Composants"

### Utiliser un composant personnalisé

1. Désactiver le mode composant
2. Ouvrir l'onglet "Mes Composants" dans le panneau gauche
3. Glisser le composant vers le workspace
4. Le composant est instancié avec de nouveaux IDs

### Gestion des composants

- **Charger** : Éditer un composant existant
- **Exporter** : Télécharger le composant en JSON
- **Importer** : Charger un composant depuis un fichier JSON
- **Dupliquer** : Créer une copie du composant
- **Supprimer** : Retirer le composant de la bibliothèque

---

## Arborescence et navigation

### Vue arborescence

L'onglet "Arborescence" affiche la structure hiérarchique de la page courante :

- Les éléments parents peuvent être pliés/dépliés
- Cliquer sur un élément pour le sélectionner
- Glisser un élément pour le réorganiser dans l'arborescence

### Manipulation dans l'arborescence

- **Drag & drop** : Déplacer un élément dans un autre conteneur
- **Pliage** : Cliquer sur la flèche pour plier/déplier les enfants
- **Sélection** : Cliquer sur un élément pour afficher ses propriétés

### Navigation dans les conteneurs

Lorsqu'un élément a des enfants :

- Cliquer sur l'élément parent le sélectionne
- Utiliser Shift + drag pour déplacer le parent même si un enfant est sous le curseur

---

## Propriétés et styles

### Panneau de propriétés

Le panneau droit affiche les propriétés de l'élément sélectionné :

1. **Propriétés générales**
   - Type d'élément
   - ID (unique)
   - Classe CSS

2. **Contenu**
   - Texte interne
   - Attributs HTML (src, href, alt, etc.)

3. **Styles**
   - Position : absolute, relative, static
   - Dimensions : width, height
   - Espacement : margin, padding
   - Couleurs : background, color, border
   - Typographie : font-family, font-size, font-weight
   - Affichage : display, flex, grid

4. **Styles pseudo-classes**
   - :hover
   - :active
   - :focus
   - ::before
   - ::after

### Édition des styles

Deux modes disponibles :

- **Mode visuel** : Champs de formulaire pour chaque propriété
- **Mode CSS brut** : Éditeur de texte avec syntaxe colorée

Basculer entre les modes via le bouton "CSS brut" dans le panneau de propriétés.

### Actions navigation

Pour les éléments interactifs (boutons, liens), définir la navigation :

1. Sélectionner l'élément
2. Dans "Actions navigation", cliquer sur "+ Ajouter une action"
3. Choisir :
   - **Type d'action** : click, dblclick, load
   - **Page cible** : Page vers laquelle naviguer

---

## Design tokens et variables CSS

### Design tokens

Les design tokens permettent de centraliser les valeurs de design :

#### Couleurs

1. Onglet "Tokens" dans le panneau droit
2. Section "Couleurs"
3. Ajouter une couleur avec un nom et une valeur hexadécimale
4. Utiliser `var(--nom-couleur)` dans les propriétés CSS

#### Typographie

Définir des tailles de police réutilisables :

```css
--text-sm: 14px
--text-base: 16px
--text-lg: 18px
```

#### Espacement

Créer des valeurs d'espacement cohérentes :

```css
--space-1: 8px
--space-2: 16px
--space-3: 24px
```

### Variables CSS globales

L'onglet "Variables CSS" permet de définir des variables CSS personnalisées :

1. Ajouter une variable avec un nom (sans `--`)
2. Définir sa valeur
3. La variable est accessible dans tout le projet

### Utilisation

Dans les propriétés de style, utiliser :

```css
background: var(--primary-color);
font-size: var(--text-lg);
padding: var(--space-2);
```

---

## Graphe de navigation

### Ouvrir le graphe

Cliquer sur le bouton "Graphe" dans la barre supérieure.

### Interface du graphe

Le graphe affiche :

- **Nodes (pages)** : Rectangles avec le titre de la page
- **Éléments affichés** : Liste des composants dans chaque page
- **Liens de navigation** : Flèches entre les éléments et les pages cibles

### Interactions

1. **Sélectionner une page** : Cliquer sur un node
2. **Ajouter des éléments** : Menu déroulant au-dessus du graphe
3. **Créer un lien** :
   - Glisser depuis le point vert d'un élément
   - Déposer sur le point rouge d'une page cible
   - Configurer l'action (click, dblclick, load)

4. **Modifier un lien** : Double-cliquer sur le lien (flèche)
5. **Supprimer un lien** : Double-cliquer puis "Supprimer"

### Navigation dans le graphe

- **Zoom** : Molette de la souris
- **Pan** : Glisser l'arrière-plan
- **Déplacer les nodes** : Glisser les rectangles de page

---

## Import/Export

### Exporter en JSON

1. Cliquer sur "Exporter" > "JSON"
2. Le fichier contient :
   - Structure des pages
   - Éléments et leurs propriétés
   - Composants personnalisés
   - Design tokens
   - Configuration globale

### Exporter en ZIP

1. Cliquer sur "Exporter" > "ZIP"
2. Le ZIP contient :
   - Fichiers HTML pour chaque page
   - Fichier CSS global
   - Fichier JavaScript pour la navigation
   - Assets (images, favicon)
   - Structure de dossiers organisée

### Importer un projet

1. Cliquer sur "Importer"
2. Sélectionner un fichier JSON
3. Le projet est chargé avec :
   - Toutes les pages
   - Tous les éléments
   - Composants personnalisés
   - Configuration

---

## Raccourcis clavier

### Ajouter des composants

- `Ctrl + Shift + D` : DIV
- `Ctrl + Shift + B` : Button
- `Ctrl + Shift + I` : Input
- `Ctrl + Shift + T` : Textarea
- `Ctrl + Shift + P` : Paragraph
- `Ctrl + Shift + H` : Heading
- `Ctrl + Shift + F` : Form
- `Ctrl + Shift + A` : Link
- `Ctrl + Shift + L` : Liste UL

### Actions sur les éléments

- `Delete` : Supprimer l'élément sélectionné
- `Ctrl + A` : Sélectionner tous les éléments
- `Ctrl + C` : Copier
- `Ctrl + V` : Coller
- `Ctrl + D` : Dupliquer
- `Ctrl + Z` : Annuler (Undo)
- `Ctrl + Shift + Z` : Refaire (Redo)
- `Ctrl + Click` : Multi-sélection

### Navigation et vue

- `Ctrl + Molette` : Zoom/Dézoom
- `Ctrl + Shift + Glisser` : Pan (déplacer la vue)
- `Shift + Glisser` : Déplacer le parent au lieu de l'enfant

---

## Fonctionnalités avancées

### Grille magnétique

Activer la grille pour aligner les éléments :

1. La grille s'adapte automatiquement au niveau de zoom
2. Les éléments se "collent" aux lignes de la grille lors du déplacement

### Guides de snap

Lors du déplacement d'éléments, des guides rouges apparaissent pour l'alignement :

- Alignement gauche/droite/centre avec d'autres éléments
- Alignement haut/bas/centre vertical
- Distance constante entre éléments

### Historique undo/redo

L'éditeur enregistre automatiquement chaque action :

- Jusqu'à 50 états dans l'historique
- `Ctrl + Z` pour annuler
- `Ctrl + Shift + Z` pour refaire

### Mode responsive

Tester différentes largeurs d'écran :

1. Bouton de breakpoint dans la barre supérieure
2. Choisir : Mobile (375px), Tablet (768px), Desktop, ou Custom
3. Le workspace s'adapte à la largeur choisie

### Éléments imbriqués

Les conteneurs (DIV, Section, etc.) peuvent contenir d'autres éléments :

1. Glisser un élément sur un conteneur
2. L'élément devient un enfant du conteneur
3. Visible dans l'arborescence avec l'indentation

### Copier/Coller entre pages

1. Sélectionner des éléments sur une page
2. `Ctrl + C` pour copier
3. Changer de page
4. `Ctrl + V` pour coller
5. Les IDs sont automatiquement régénérés

### Pseudo-styles

Définir des styles pour les états interactifs :

1. Sélectionner un élément
2. Dans le panneau de propriétés, section "Pseudo-styles"
3. Choisir `:hover`, `:active`, `:focus`, `::before`, ou `::after`
4. Définir les styles spécifiques à cet état

---

## Architecture du projet

### Structure des fichiers

```
editor/
├── index.php                 # Point d'entrée
├── css/
│   └── main.css             # Styles de l'éditeur
├── js/
│   ├── app.js               # Logique principale
│   ├── element.js           # Classe d'élément
│   ├── pages.js             # Gestion des pages
│   ├── component-creator.js # Création de composants
│   ├── graph.js             # Visualisation graphe
│   ├── features.js          # Fonctionnalités additionnelles
│   └── api.js               # Framework API (future extension)
└── README.md                # Cette documentation
```

### Format de données

Le projet est sauvegardé au format JSON avec la structure suivante :

```json
{
  "pages": [
    {
      "id": "page_xxx",
      "title": "Accueil",
      "route": "/",
      "elements": [...],
      "metadata": {...}
    }
  ],
  "customComponents": [...],
  "designTokens": {...},
  "cssVariables": {...}
}
```

---

## Dépannage

### Le graphe ne se met pas à jour

- Assurez-vous que le graphe est ouvert après modification
- Fermez et rouvrez le graphe pour forcer le rafraîchissement

### Les composants ne s'affichent pas

- Vérifiez que vous n'êtes pas en mode création de composant
- Vérifiez que la page courante existe

### Le zoom est décalé

- Fermez les outils de développement du navigateur
- Rechargez la page

### Les raccourcis ne fonctionnent pas

- Vérifiez que le focus est bien sur l'éditeur
- Certains raccourcis nécessitent la sélection d'un élément

---

## Contributions et support

Ce projet est en développement actif. Pour toute question ou suggestion, référez-vous au code source ou créez une issue dans le repository.

## Licence

Projet sous licence propriétaire. Tous droits réservés.
