# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | Deutsch | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

Multi-Model KI-Code-Assistent für VS Code mit Halluzinationsprävention.

<p align="center">
  <img src="media/team.jpg" width="500" alt="AI Guard Entwicklungsrealität">
  <br>
  <em>Die Realität der Entwicklung: Ich schreibe Code in der Grube, die KIs schauen zu und reviewen 😂</em>
</p>

> **Jeder ist willkommen zu forken und zu verbessern! Macht es größer und stärker!**

## Überblick

AI Guard verwendet eine dreistufige Pipeline, um sichereren und zuverlässigeren KI-gestützten Code zu generieren:

1. **Generieren (Generate)** — Ein Produktionsmodell generiert Code aus Ihrem Prompt
2. **Review** — Ein separates Review-Modell prüft den generierten Code auf Probleme
3. **Regelprüfung (Rule Check)** — Eingebaute und benutzerdefinierte Regeln validieren die Ausgabe

Durch die Verwendung unterschiedlicher Modelle für Generierung und Review erkennt AI Guard Halluzinationen und Fehler, die ein einzelnes Modell möglicherweise übersieht.

## Funktionen

- **Multi-Model-Pipeline** — Verwenden Sie beliebige OpenAI-kompatible Modelle
- **Eingebaute Regeln** — Import-Validierung, Syntaxprüfung, Sicherheitsmuster-Erkennung
- **Benutzerdefinierte Regeln** — Erweitern Sie mit eigenen Regeln über `.ai-guard/rules/`
- **Diff-Ansicht** — Visueller Vergleich bei Änderungsvorschlägen
- **Sidebar-UI** — Dediziertes Panel für Pipeline-Ergebnisse
- **Konfigurierbar** — Volle Kontrolle über Modelle, Endpunkte und Pipeline-Verhalten

## Schnellstart

1. Installieren Sie die Erweiterung in VS Code
2. Konfigurieren Sie Ihre API-Schlüssel unter Einstellungen → AI Guard
3. Öffnen Sie eine Datei und drücken Sie `Ctrl+Shift+G` (`Cmd+Shift+G` auf Mac)

## Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `AI Guard: Generate Code` | Code aus einem Prompt generieren |
| `AI Guard: Review Selection` | Ausgewählten Code reviewen |
| `AI Guard: Run Full Pipeline` | Vollständige Pipeline ausführen |
| `AI Guard: Show Review Diff` | Diff zwischen generiertem und reviewtem Code |
| `AI Guard: Configure Models` | Modellkonfiguration öffnen |

## Konfiguration

### Modelle

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

### Regeln

| Einstellung | Standard | Beschreibung |
|-------------|----------|-------------|
| `aiGuard.rules.enableBuiltIn` | `true` | Eingebaute Regeln aktivieren |
| `aiGuard.rules.enableImportValidation` | `true` | Import-Existenz prüfen |
| `aiGuard.rules.enableSyntaxCheck` | `true` | Syntax validieren |
| `aiGuard.rules.enableSecurityPatterns` | `true` | Sicherheitsprobleme erkennen |
| `aiGuard.rules.customRulesPath` | `.ai-guard/rules` | Verzeichnis für benutzerdefinierte Regeln |

## Benutzerdefinierte Regeln

Erstellen Sie `.js`-Dateien in `.ai-guard/rules/`:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'Meine Regel',
  description: 'Was diese Regel prüft',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## Entwicklung

```bash
npm install
npm run build    # Erweiterung bauen
npm run watch    # Watch-Modus
npm run package  # Als .vsix verpacken
```

## Architektur

```
src/
├── extension.ts          # Einstiegspunkt
├── config/               # Einstellungsverwaltung
├── models/               # KI-Modellanbieter (OpenAI-kompatibel)
├── pipeline/             # Dreistufige Pipeline-Engine
│   ├── generate-stage    # Stufe 1: Code-Generierung
│   ├── review-stage      # Stufe 2: KI-Review
│   └── rule-check-stage  # Stufe 3: Regelvalidierung
├── rules/                # Halluzinationserkennungsregeln
│   ├── built-in/         # Import-, Syntax-, Sicherheitsprüfungen
│   └── custom/           # Benutzerdefinierter Regel-Loader
├── diff/                 # Diff-Visualisierung
└── ui/                   # Sidebar, Statusleiste, Einstellungspanel
```

## Lizenz

MIT
