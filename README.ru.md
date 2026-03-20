# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | Русский | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

Мультимодельный ИИ-ассистент для VS Code с предотвращением галлюцинаций.

<p align="center">
  <img src="media/team.jpg" width="500" alt="Реальность разработки AI Guard">
  <br>
  <em>Реальность разработки: я пишу код в яме, ИИ наблюдают и ревьюят вокруг 😂</em>
</p>

> **Добро пожаловать! Форкайте, улучшайте, делайте сильнее!**

## Обзор

AI Guard использует трёхэтапный пайплайн для генерации более безопасного и надёжного кода с помощью ИИ:

1. **Генерация (Generate)** — Продакшн-модель генерирует код по вашему запросу
2. **Ревью (Review)** — Отдельная модель проверяет сгенерированный код
3. **Проверка правил (Rule Check)** — Встроенные и пользовательские правила валидируют результат

Используя разные модели для генерации и ревью, AI Guard обнаруживает галлюцинации и ошибки, которые одна модель может пропустить.

## Возможности

- **Мультимодельный пайплайн** — Любые OpenAI-совместимые модели
- **Встроенные правила** — Валидация импортов, проверка синтаксиса, обнаружение паттернов безопасности
- **Пользовательские правила** — Расширение через `.ai-guard/rules/`
- **Просмотр diff** — Визуальное сравнение предложенных изменений
- **Боковая панель** — Выделенная панель для результатов пайплайна
- **Настраиваемость** — Полный контроль над моделями, эндпоинтами и поведением

## Быстрый старт

1. Установите расширение в VS Code
2. Настройте API-ключи в Настройки → AI Guard
3. Откройте файл и нажмите `Ctrl+Shift+G` (`Cmd+Shift+G` на Mac)

## Команды

| Команда | Описание |
|---------|----------|
| `AI Guard: Generate Code` | Генерация кода по запросу |
| `AI Guard: Review Selection` | Ревью выделенного кода |
| `AI Guard: Run Full Pipeline` | Запуск полного пайплайна |
| `AI Guard: Show Review Diff` | Показать diff |
| `AI Guard: Configure Models` | Настройка моделей |

## Конфигурация

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

## Пользовательские правила

Создайте `.js` файлы в `.ai-guard/rules/`:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'Моё правило',
  description: 'Что проверяет это правило',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## Разработка

```bash
npm install
npm run build    # Сборка расширения
npm run watch    # Режим наблюдения
npm run package  # Упаковка в .vsix
```

## Лицензия

MIT
