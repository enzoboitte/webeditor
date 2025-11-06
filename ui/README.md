# Système de Templates UI

## Structure d'un fichier JSON de composant

Chaque composant UI est défini dans un fichier JSON dans le dossier `./ui/`.

### Exemple de structure :

```json
{
  "name": "NomDuComposant",
  "icon": "🎨",
  "category": "ui",
  "parameters": {
    "paramName": {
      "type": "text|select|checkbox|textarea",
      "default": "valeur par défaut",
      "label": "Label affiché",
      "options": ["opt1", "opt2"]
    }
  },
  "html": "<div>{{paramName}}</div>",
  "css": {
    "background": "#fff",
    "width": "{{width}}"
  },
  "macros": {
    "MACRO_NAME": {
      "value1": "résultat1",
      "value2": "résultat2"
    }
  },
  "actions": [
    {
      "event": "click|load|dblclick",
      "type": "api",
      "label": "Description de l'action"
    }
  ]
}
```

## Types de paramètres

- **text** : Champ texte simple
- **textarea** : Zone de texte multiligne
- **select** : Liste déroulante (nécessite `options`)
- **checkbox** : Case à cocher (booléen)

## Macros dans le HTML

- `{{paramName}}` : Remplacé par la valeur du paramètre
- `{{CLASS}}` : Remplacé par la classe CSS de l'élément
- `{{ID}}` : Remplacé par l'ID de l'élément

## Macros dans le CSS

- `{{paramName}}` : Valeur directe du paramètre
- `{{MACRO_NAME}}` : Utilise le système de macros pour mapper des valeurs

### Exemple de macro CSS :

```json
{
  "parameters": {
    "size": {
      "type": "select",
      "options": ["small", "medium", "large"],
      "default": "medium"
    }
  },
  "css": {
    "padding": "{{SIZE_PADDING}}"
  },
  "macros": {
    "SIZE_PADDING": {
      "small": "6px 12px",
      "medium": "10px 20px",
      "large": "14px 28px"
    }
  }
}
```

## Actions API

Chaque composant peut définir plusieurs types d'actions :

- **click** : Déclenché au clic sur l'élément
- **dblclick** : Déclenché au double-clic
- **load** : Déclenché au chargement de la page

### Configuration d'une action :

```json
{
  "event": "load",
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {"Content-Type": "application/json"},
  "body": {},
  "successAction": "replace",
  "target": "element-id"
}
```

### Types d'actions de succès :

- **popup** : Affiche le résultat dans une alerte
- **insert** : Insère le contenu dans l'élément cible
- **replace** : Remplace le contenu de l'élément cible

## Créer un nouveau composant

1. Créez un fichier JSON dans `./ui/`
2. Définissez la structure selon le template ci-dessus
3. Rechargez l'éditeur
4. Le composant apparaîtra automatiquement dans la bibliothèque

## Exemples fournis

- `button.json` - Bouton avec variantes
- `card.json` - Carte avec ombre configurable
- `navbar.json` - Barre de navigation
- `modal.json` - Fenêtre modale
- `datatable.json` - Tableau de données
- `form.json` - Formulaire
- `gallery.json` - Galerie d'images
