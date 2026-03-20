# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | العربية | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

**دع الذكاء الاصطناعي يكتشف أخطاء بعضه البعض.** — مساعد برمجة ذكاء اصطناعي متعدد النماذج لـ VS Code مع منع الهلوسة.

<p align="center">
  <img src="media/team.jpg" width="500" alt="واقع تطوير AI Guard">
  <br>
  <em>واقع التطوير: أنا أكتب الكود في الحفرة، والذكاء الاصطناعي يراقب من حولي 😂</em>
</p>

> **مرحباً بالجميع للمشاركة والتحسين! لنجعله أكبر وأقوى!**

## نظرة عامة

يستخدم AI Guard خط أنابيب من ثلاث مراحل لتوليد كود أكثر أماناً وموثوقية بمساعدة الذكاء الاصطناعي:

1. **التوليد (Generate)** — نموذج الإنتاج يولد الكود من تعليماتك
2. **المراجعة (Review)** — نموذج مراجعة منفصل يفحص الكود المولد
3. **فحص القواعد (Rule Check)** — قواعد مدمجة ومخصصة تتحقق من المخرجات

باستخدام نماذج مختلفة للتوليد والمراجعة، يكتشف AI Guard الهلوسات والأخطاء التي قد يفوتها نموذج واحد.

## الميزات

- **خط أنابيب متعدد النماذج** — استخدم أي نموذج متوافق مع OpenAI
- **قواعد مدمجة** — التحقق من الاستيراد، فحص بناء الجملة، كشف أنماط الأمان
- **قواعد مخصصة** — التوسيع عبر `.ai-guard/rules/`
- **عرض الفروقات** — مقارنة مرئية للتغييرات المقترحة
- **واجهة الشريط الجانبي** — لوحة مخصصة لنتائج خط الأنابيب
- **قابل للتخصيص** — تحكم كامل في النماذج والنقاط النهائية والسلوك

## البدء السريع

1. ثبت الإضافة في VS Code
2. اضبط مفاتيح API في الإعدادات → AI Guard
3. افتح ملفاً واضغط `Ctrl+Shift+G` (`Cmd+Shift+G` على Mac)

## الأوامر

| الأمر | الوصف |
|-------|-------|
| `AI Guard: Generate Code` | توليد كود من تعليمات |
| `AI Guard: Review Selection` | مراجعة الكود المحدد |
| `AI Guard: Run Full Pipeline` | تشغيل خط الأنابيب الكامل |
| `AI Guard: Show Review Diff` | عرض الفروقات |
| `AI Guard: Configure Models` | فتح إعدادات النماذج |

## الإعداد

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

## القواعد المخصصة

أنشئ ملفات `.js` في `.ai-guard/rules/`:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'قاعدتي',
  description: 'ما تفحصه هذه القاعدة',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## التطوير

```bash
npm install
npm run build    # بناء الإضافة
npm run watch    # وضع المراقبة
npm run package  # تعبئة كـ .vsix
```

## الترخيص

MIT
