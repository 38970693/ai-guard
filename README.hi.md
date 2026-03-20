# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | हिन्दी | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

**AI को एक-दूसरे की गलतियाँ खोजने दो।** — VS Code के लिए मल्टी-मॉडल AI कोड असिस्टेंट — हैलुसिनेशन रोकथाम के साथ।

<p align="center">
  <img src="media/team.jpg" width="500" alt="AI Guard विकास की वास्तविकता">
  <br>
  <em>विकास की सच्चाई: मैं गड्ढे में कोड लिख रहा हूँ, AI चारों ओर से निगरानी कर रहे हैं 😂</em>
</p>

> **सभी का स्वागत है! Fork करें, सुधारें, और मजबूत बनाएं!**

## अवलोकन

AI Guard तीन चरणों वाली पाइपलाइन का उपयोग करता है:

1. **जनरेट (Generate)** — प्रोडक्शन मॉडल आपके प्रॉम्प्ट से कोड जनरेट करता है
2. **रिव्यू (Review)** — एक अलग रिव्यू मॉडल जनरेट किए गए कोड की जाँच करता है
3. **नियम जाँच (Rule Check)** — बिल्ट-इन और कस्टम नियम आउटपुट को मान्य करते हैं

जनरेशन और रिव्यू के लिए अलग-अलग मॉडल का उपयोग करके, AI Guard उन हैलुसिनेशन और त्रुटियों को पकड़ता है जो एक मॉडल चूक सकता है।

## विशेषताएं

- **मल्टी-मॉडल पाइपलाइन** — कोई भी OpenAI-संगत मॉडल उपयोग करें
- **बिल्ट-इन नियम** — इम्पोर्ट सत्यापन, सिंटैक्स जाँच, सुरक्षा पैटर्न पहचान
- **कस्टम नियम** — `.ai-guard/rules/` के माध्यम से विस्तार
- **Diff दृश्य** — सुझाए गए परिवर्तनों की दृश्य तुलना
- **साइडबार UI** — पाइपलाइन परिणामों के लिए समर्पित पैनल
- **कॉन्फ़िगर करने योग्य** — मॉडल, एंडपॉइंट और व्यवहार पर पूर्ण नियंत्रण

## त्वरित शुरुआत

1. VS Code में एक्सटेंशन इंस्टॉल करें
2. सेटिंग्स → AI Guard में API कुंजियाँ कॉन्फ़िगर करें
3. एक फ़ाइल खोलें और `Ctrl+Shift+G` (Mac पर `Cmd+Shift+G`) दबाएं

## कमांड

| कमांड | विवरण |
|-------|-------|
| `AI Guard: Generate Code` | प्रॉम्प्ट से कोड जनरेट करें |
| `AI Guard: Review Selection` | चयनित कोड की समीक्षा करें |
| `AI Guard: Run Full Pipeline` | पूरी पाइपलाइन चलाएं |
| `AI Guard: Show Review Diff` | Diff दिखाएं |
| `AI Guard: Configure Models` | मॉडल सेटिंग्स खोलें |

## कॉन्फ़िगरेशन

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

## कस्टम नियम

`.ai-guard/rules/` में `.js` फ़ाइलें बनाएं:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'मेरा नियम',
  description: 'यह नियम क्या जाँचता है',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## विकास

```bash
npm install
npm run build    # एक्सटेंशन बिल्ड करें
npm run watch    # वॉच मोड
npm run package  # .vsix के रूप में पैकेज करें
```

## लाइसेंस

MIT
