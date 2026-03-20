# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | Türkçe | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

VS Code için çok modelli yapay zeka kod asistanı — halüsinasyon önleme özellikli.

<p align="center">
  <img src="media/team.jpg" width="500" alt="AI Guard Geliştirme Gerçeği">
  <br>
  <em>Geliştirmenin gerçeği: ben çukurda kod yazıyorum, yapay zekalar etrafta izliyor 😂</em>
</p>

> **Herkesi fork yapıp geliştirmeye davet ediyoruz! Birlikte daha büyük ve güçlü yapalım!**

## Genel Bakış

AI Guard, daha güvenli ve güvenilir yapay zeka destekli kod üretmek için üç aşamalı bir pipeline kullanır:

1. **Üretim (Generate)** — Üretim modeli promptunuzdan kod üretir
2. **İnceleme (Review)** — Ayrı bir inceleme modeli üretilen kodu kontrol eder
3. **Kural Kontrolü (Rule Check)** — Yerleşik ve özel kurallar çıktıyı doğrular

Üretim ve inceleme için farklı modeller kullanarak, AI Guard tek bir modelin gözden kaçırabileceği halüsinasyonları ve hataları yakalar.

## Özellikler

- **Çok modelli pipeline** — Herhangi bir OpenAI uyumlu model kullanılabilir
- **Yerleşik kurallar** — İmport doğrulama, sözdizimi kontrolü, güvenlik deseni tespiti
- **Özel kurallar** — `.ai-guard/rules/` ile genişletilebilir
- **Diff görünümü** — Önerilen değişikliklerin görsel karşılaştırması
- **Kenar çubuğu arayüzü** — Pipeline sonuçları için özel panel
- **Yapılandırılabilir** — Modeller, uç noktalar ve davranış üzerinde tam kontrol

## Hızlı Başlangıç

1. VS Code'a eklentiyi yükleyin
2. Ayarlar → AI Guard'da API anahtarlarını yapılandırın
3. Bir dosya açın ve `Ctrl+Shift+G` (Mac'te `Cmd+Shift+G`) tuşlarına basın

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `AI Guard: Generate Code` | Prompttan kod üret |
| `AI Guard: Review Selection` | Seçili kodu incele |
| `AI Guard: Run Full Pipeline` | Tam pipeline'ı çalıştır |
| `AI Guard: Show Review Diff` | Diff'i göster |
| `AI Guard: Configure Models` | Model ayarlarını aç |

## Yapılandırma

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

## Özel Kurallar

`.ai-guard/rules/` içinde `.js` dosyaları oluşturun:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'Kuralım',
  description: 'Bu kuralın kontrol ettiği şey',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## Geliştirme

```bash
npm install
npm run build    # Eklentiyi derle
npm run watch    # İzleme modu
npm run package  # .vsix olarak paketle
```

## Lisans

MIT
