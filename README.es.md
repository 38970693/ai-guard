# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | Español | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

Asistente de código IA multi-modelo para VS Code con prevención de alucinaciones.

<p align="center">
  <img src="media/team.jpg" width="500" alt="Realidad del desarrollo de AI Guard">
  <br>
  <em>La realidad del desarrollo: yo escribo código en el hoyo, las IAs supervisan alrededor 😂</em>
</p>

> **¡Bienvenidos a hacer fork y mejorar! ¡Hagámoslo más grande y más fuerte!**

## Descripción

AI Guard utiliza un pipeline de tres etapas para generar código asistido por IA más seguro y confiable:

1. **Generar (Generate)** — Un modelo de producción genera código a partir de tu prompt
2. **Revisar (Review)** — Un modelo de revisión separado verifica el código generado
3. **Verificación de reglas (Rule Check)** — Reglas integradas y personalizadas validan la salida

Al usar diferentes modelos para generación y revisión, AI Guard detecta alucinaciones y errores que un solo modelo podría pasar por alto.

## Características

- **Pipeline multi-modelo** — Usa cualquier modelo compatible con OpenAI
- **Reglas integradas** — Validación de imports, verificación de sintaxis, detección de patrones de seguridad
- **Reglas personalizadas** — Extiende mediante `.ai-guard/rules/`
- **Vista diff** — Comparación visual de cambios sugeridos
- **Interfaz sidebar** — Panel dedicado para resultados del pipeline
- **Configurable** — Control total sobre modelos, endpoints y comportamiento

## Inicio rápido

1. Instala la extensión en VS Code
2. Configura tus claves API en Configuración → AI Guard
3. Abre un archivo y presiona `Ctrl+Shift+G` (`Cmd+Shift+G` en Mac)

## Comandos

| Comando | Descripción |
|---------|-------------|
| `AI Guard: Generate Code` | Generar código desde un prompt |
| `AI Guard: Review Selection` | Revisar código seleccionado |
| `AI Guard: Run Full Pipeline` | Ejecutar pipeline completo |
| `AI Guard: Show Review Diff` | Mostrar diff entre código generado y revisado |
| `AI Guard: Configure Models` | Abrir configuración de modelos |

## Configuración

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

## Reglas personalizadas

Crea archivos `.js` en `.ai-guard/rules/`:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'Mi regla',
  description: 'Qué verifica esta regla',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## Desarrollo

```bash
npm install
npm run build    # Compilar extensión
npm run watch    # Modo vigilancia
npm run package  # Empaquetar como .vsix
```

## Licencia

MIT
