# AI Guard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-%3E%3D1.85.0-blue.svg)](https://code.visualstudio.com/)
[![Version](https://img.shields.io/badge/version-0.2.0-green.svg)](https://github.com/38970693/ai-guard/releases)

**🌍 English | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

**Let AIs find each other's mistakes.** — Multi-model AI code assistant for VS Code with hallucination prevention.

<p align="center">
  <img src="media/team.jpg" width="500" alt="AI Guard - Real development scene">
  <br>
  <em>Real dev scene: me coding in the trenches, AIs reviewing from the sidelines</em>
</p>

> **Fork it, hack it, make it yours!** Contributions welcome!

## Overview

AI Guard uses a three-stage pipeline to generate safer, more reliable AI-assisted code:

1. **Generate** — A production model generates code from your prompt
2. **Review** — A separate review model checks the generated code for issues
3. **Rule Check** — Built-in and custom rules validate the output (import validation, syntax check, security patterns)

By using different models for generation and review, AI Guard catches hallucinations and errors that a single model might miss.

## Features

- **Multi-model pipeline** — Use any OpenAI-compatible models for generation and review
- **Multi-agent review** — Configure multiple review agents to run in parallel for broader coverage
- **ESLint integration** — Static analysis via ESLint (uses workspace config or sensible defaults)
- **Custom rules** — Extend with your own rules via `.ai-guard/rules/`
- **Configurable stage order** — Reorder pipeline stages; optionally skip review when rule check finds errors (saves tokens)
- **Diff view** — Visual comparison when the review model suggests changes
- **Sidebar UI** — Dedicated panel showing pipeline results and status
- **Configurable** — Full control over models, endpoints, and pipeline behavior

## Quick Start

1. Install the extension in VS Code
2. Configure your API keys in Settings → AI Guard
3. Open a file and press `Ctrl+Shift+G` (`Cmd+Shift+G` on Mac) to run the full pipeline

## Commands

| Command | Description |
|---------|-------------|
| `AI Guard: Generate Code` | Generate code from a prompt |
| `AI Guard: Review Selection` | Review selected code |
| `AI Guard: Run Full Pipeline` | Generate + Review + Rule Check |
| `AI Guard: Show Review Diff` | Display diff between generated and reviewed code |
| `AI Guard: Configure Models` | Open model configuration panel |

## Configuration

### Models

AI Guard supports any OpenAI-compatible API endpoint. Configure via VS Code settings:

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

### Rules

| Setting | Default | Description |
|---------|---------|-------------|
| `aiGuard.rules.enableBuiltIn` | `true` | Enable built-in rules |
| `aiGuard.rules.enableEslint` | `true` | Use ESLint for static analysis |
| `aiGuard.rules.customRulesPath` | `.ai-guard/rules` | Custom rules directory |
| `aiGuard.rules.enableImportValidation` | `false` | (Legacy) Check if imports exist |
| `aiGuard.rules.enableSyntaxCheck` | `false` | (Legacy) Validate syntax |
| `aiGuard.rules.enableSecurityPatterns` | `false` | (Legacy) Detect security issues |

### Pipeline

| Setting | Default | Description |
|---------|---------|-------------|
| `aiGuard.pipeline.autoReview` | `true` | Auto-run review after generation |
| `aiGuard.pipeline.autoRuleCheck` | `true` | Auto-run rules after generation |
| `aiGuard.pipeline.showDiffOnIssues` | `true` | Show diff when issues found |
| `aiGuard.pipeline.stageOrder` | `["ruleCheck", "review"]` | Order of post-generation stages |
| `aiGuard.pipeline.skipReviewOnError` | `true` | Skip AI review when rule check finds errors (saves tokens) |

### Multi-Agent Review

You can configure multiple review agents to run in parallel. When set, this overrides the single `reviewModel`:

```json
{
  "aiGuard.reviewAgents": [
    {
      "name": "Claude",
      "endpoint": "https://api.anthropic.com/v1",
      "model": "claude-sonnet-4-20250514",
      "apiKey": "your-key"
    },
    {
      "name": "DeepSeek",
      "endpoint": "https://api.deepseek.com/v1",
      "model": "deepseek-chat",
      "apiKey": "your-key"
    }
  ]
}

## Custom Rules

Create `.js` files in `.ai-guard/rules/`:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'My Custom Rule',
  description: 'What this rule checks',
  async check(context) {
    const issues = [];
    // Analyze context.code, context.language, etc.
    return { issues };
  }
};
```

## Development

```bash
npm install
npm run build    # Build extension
npm run watch    # Watch mode
npm run package  # Package as .vsix
```

## Architecture

```
src/
├── extension.ts          # Entry point
├── config/               # Settings management
├── models/               # AI model providers (OpenAI-compatible)
├── pipeline/             # Three-stage pipeline engine
│   ├── generate-stage    # Stage 1: Code generation
│   ├── review-stage      # Stage 2: AI review
│   └── rule-check-stage  # Stage 3: Rule validation
├── rules/                # Hallucination detection rules
│   ├── built-in/         # Import, syntax, security checks
│   └── custom/           # Custom rule loader
├── diff/                 # Diff visualization
└── ui/                   # Sidebar, status bar, settings panel
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
