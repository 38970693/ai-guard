# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | Français | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

Assistant multi-modèle IA pour VS Code avec prévention des hallucinations.

<p align="center">
  <img src="media/team.jpg" width="500" alt="Réalité du développement AI Guard">
  <br>
  <em>La réalité du développement : je code dans le trou, les IA supervisent autour 😂</em>
</p>

> **Bienvenue à tous pour forker et améliorer ! Ensemble, faisons-le grandir !**

## Aperçu

AI Guard utilise un pipeline en trois étapes pour générer du code assisté par IA plus sûr et fiable :

1. **Génération (Generate)** — Un modèle de production génère le code à partir de votre prompt
2. **Revue (Review)** — Un modèle de revue séparé vérifie le code généré
3. **Vérification des règles (Rule Check)** — Des règles intégrées et personnalisées valident la sortie

En utilisant différents modèles pour la génération et la revue, AI Guard détecte les hallucinations et erreurs qu'un seul modèle pourrait manquer.

## Fonctionnalités

- **Pipeline multi-modèle** — Utilisez n'importe quel modèle compatible OpenAI
- **Règles intégrées** — Validation des imports, vérification syntaxique, détection de patterns de sécurité
- **Règles personnalisées** — Étendez via `.ai-guard/rules/`
- **Vue diff** — Comparaison visuelle des modifications suggérées
- **Interface sidebar** — Panneau dédié aux résultats du pipeline
- **Configurable** — Contrôle total sur les modèles, endpoints et comportement

## Démarrage rapide

1. Installez l'extension dans VS Code
2. Configurez vos clés API dans Paramètres → AI Guard
3. Ouvrez un fichier et appuyez sur `Ctrl+Shift+G` (`Cmd+Shift+G` sur Mac)

## Commandes

| Commande | Description |
|----------|-------------|
| `AI Guard: Generate Code` | Générer du code à partir d'un prompt |
| `AI Guard: Review Selection` | Réviser le code sélectionné |
| `AI Guard: Run Full Pipeline` | Exécuter le pipeline complet |
| `AI Guard: Show Review Diff` | Afficher le diff entre code généré et révisé |
| `AI Guard: Configure Models` | Ouvrir la configuration des modèles |

## Configuration

### Modèles

```json
{
  "aiGuard.productionModel.endpoint": "https://api.openai.com/v1",
  "aiGuard.productionModel.model": "gpt-4o",
  "aiGuard.productionModel.apiKey": "your-key",
  "aiGuard.reviewModel.endpoint": "https://api.openai.com/v1",
  "aiGuard.reviewModel.model": "claude-sonnet-4-20250514",
  "aiGuard.reviewModel.apiKey": "your-key"
}
```

### Règles

| Paramètre | Défaut | Description |
|-----------|--------|-------------|
| `aiGuard.rules.enableBuiltIn` | `true` | Activer les règles intégrées |
| `aiGuard.rules.enableImportValidation` | `true` | Vérifier l'existence des imports |
| `aiGuard.rules.enableSyntaxCheck` | `true` | Valider la syntaxe |
| `aiGuard.rules.enableSecurityPatterns` | `true` | Détecter les problèmes de sécurité |
| `aiGuard.rules.customRulesPath` | `.ai-guard/rules` | Répertoire des règles personnalisées |

## Règles personnalisées

Créez des fichiers `.js` dans `.ai-guard/rules/` :

```javascript
module.exports = {
  id: 'my-rule',
  name: 'Ma règle',
  description: 'Ce que cette règle vérifie',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## Développement

```bash
npm install
npm run build    # Compiler l'extension
npm run watch    # Mode surveillance
npm run package  # Empaqueter en .vsix
```

## Architecture

```
src/
├── extension.ts          # Point d'entrée
├── config/               # Gestion des paramètres
├── models/               # Fournisseurs de modèles IA (compatible OpenAI)
├── pipeline/             # Moteur de pipeline en trois étapes
│   ├── generate-stage    # Étape 1 : Génération de code
│   ├── review-stage      # Étape 2 : Revue IA
│   └── rule-check-stage  # Étape 3 : Validation des règles
├── rules/                # Règles de détection d'hallucinations
│   ├── built-in/         # Vérifications d'imports, syntaxe, sécurité
│   └── custom/           # Chargeur de règles personnalisées
├── diff/                 # Visualisation des différences
└── ui/                   # Sidebar, barre de statut, panneau de paramètres
```

## Licence

MIT
