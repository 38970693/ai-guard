# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | Português | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

Assistente de código IA multi-modelo para VS Code com prevenção de alucinações.

<p align="center">
  <img src="media/team.jpg" width="500" alt="Realidade do desenvolvimento AI Guard">
  <br>
  <em>A realidade do desenvolvimento: eu escrevo código no buraco, as IAs supervisionam ao redor 😂</em>
</p>

> **Todos são bem-vindos para fazer fork e melhorar! Vamos torná-lo maior e mais forte!**

## Visão Geral

AI Guard usa um pipeline de três estágios para gerar código assistido por IA mais seguro e confiável:

1. **Gerar (Generate)** — Um modelo de produção gera código a partir do seu prompt
2. **Revisar (Review)** — Um modelo de revisão separado verifica o código gerado
3. **Verificação de Regras (Rule Check)** — Regras integradas e personalizadas validam a saída

Usando modelos diferentes para geração e revisão, AI Guard detecta alucinações e erros que um único modelo poderia ignorar.

## Funcionalidades

- **Pipeline multi-modelo** — Use qualquer modelo compatível com OpenAI
- **Regras integradas** — Validação de imports, verificação de sintaxe, detecção de padrões de segurança
- **Regras personalizadas** — Estenda via `.ai-guard/rules/`
- **Visualização diff** — Comparação visual das alterações sugeridas
- **Interface sidebar** — Painel dedicado para resultados do pipeline
- **Configurável** — Controle total sobre modelos, endpoints e comportamento

## Início Rápido

1. Instale a extensão no VS Code
2. Configure suas chaves API em Configurações → AI Guard
3. Abra um arquivo e pressione `Ctrl+Shift+G` (`Cmd+Shift+G` no Mac)

## Comandos

| Comando | Descrição |
|---------|-----------|
| `AI Guard: Generate Code` | Gerar código a partir de um prompt |
| `AI Guard: Review Selection` | Revisar código selecionado |
| `AI Guard: Run Full Pipeline` | Executar pipeline completo |
| `AI Guard: Show Review Diff` | Mostrar diff entre código gerado e revisado |
| `AI Guard: Configure Models` | Abrir configuração de modelos |

## Configuração

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

## Regras Personalizadas

Crie arquivos `.js` em `.ai-guard/rules/`:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'Minha regra',
  description: 'O que esta regra verifica',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## Desenvolvimento

```bash
npm install
npm run build    # Compilar extensão
npm run watch    # Modo observação
npm run package  # Empacotar como .vsix
```

## Licença

MIT
