# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | Italiano | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

Assistente di codice IA multi-modello per VS Code con prevenzione delle allucinazioni.

<p align="center">
  <img src="media/team.jpg" width="500" alt="Realtà dello sviluppo AI Guard">
  <br>
  <em>La realtà dello sviluppo: io scrivo codice nella buca, le IA supervisionano intorno 😂</em>
</p>

> **Benvenuti a fare fork e migliorare! Rendiamolo più grande e più forte!**

## Panoramica

AI Guard utilizza una pipeline a tre fasi per generare codice assistito dall'IA più sicuro e affidabile:

1. **Generazione (Generate)** — Un modello di produzione genera codice dal tuo prompt
2. **Revisione (Review)** — Un modello di revisione separato controlla il codice generato
3. **Controllo regole (Rule Check)** — Regole integrate e personalizzate validano l'output

Utilizzando modelli diversi per generazione e revisione, AI Guard rileva allucinazioni ed errori che un singolo modello potrebbe non notare.

## Funzionalità

- **Pipeline multi-modello** — Usa qualsiasi modello compatibile con OpenAI
- **Regole integrate** — Validazione import, controllo sintassi, rilevamento pattern di sicurezza
- **Regole personalizzate** — Estendi tramite `.ai-guard/rules/`
- **Vista diff** — Confronto visivo delle modifiche suggerite
- **Interfaccia sidebar** — Pannello dedicato per i risultati della pipeline
- **Configurabile** — Controllo completo su modelli, endpoint e comportamento

## Avvio rapido

1. Installa l'estensione in VS Code
2. Configura le chiavi API in Impostazioni → AI Guard
3. Apri un file e premi `Ctrl+Shift+G` (`Cmd+Shift+G` su Mac)

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `AI Guard: Generate Code` | Genera codice da un prompt |
| `AI Guard: Review Selection` | Revisiona il codice selezionato |
| `AI Guard: Run Full Pipeline` | Esegui la pipeline completa |
| `AI Guard: Show Review Diff` | Mostra diff tra codice generato e revisionato |
| `AI Guard: Configure Models` | Apri configurazione modelli |

## Configurazione

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

## Regole personalizzate

Crea file `.js` in `.ai-guard/rules/`:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'La mia regola',
  description: 'Cosa controlla questa regola',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## Sviluppo

```bash
npm install
npm run build    # Compila l'estensione
npm run watch    # Modalità osservazione
npm run package  # Impacchetta come .vsix
```

## Licenza

MIT
