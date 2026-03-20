# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | ภาษาไทย | [Tiếng Việt](README.vi.md)**

ผู้ช่วยเขียนโค้ด AI หลายโมเดลสำหรับ VS Code พร้อมระบบป้องกัน Hallucination

<p align="center">
  <img src="media/team.jpg" width="500" alt="ความจริงของการพัฒนา AI Guard">
  <br>
  <em>ความจริงของการพัฒนา: ผมเขียนโค้ดอยู่ในหลุม AI ยืนดูรอบๆ 😂</em>
</p>

> **ยินดีต้อนรับทุกคน! Fork ไปแก้ไข ทำให้ใหญ่ขึ้นและแข็งแกร่งขึ้น!**

## ภาพรวม

AI Guard ใช้ Pipeline สามขั้นตอนเพื่อสร้างโค้ดที่ปลอดภัยและเชื่อถือได้มากขึ้น:

1. **สร้าง (Generate)** — โมเดลหลักสร้างโค้ดจาก prompt ของคุณ
2. **ตรวจสอบ (Review)** — โมเดลตรวจสอบแยกต่างหากตรวจโค้ดที่สร้างขึ้น
3. **ตรวจกฎ (Rule Check)** — กฎในตัวและกฎที่กำหนดเองตรวจสอบผลลัพธ์

การใช้โมเดลที่แตกต่างกันสำหรับการสร้างและตรวจสอบ ทำให้ AI Guard จับ Hallucination และข้อผิดพลาดที่โมเดลเดียวอาจพลาดได้

## คุณสมบัติ

- **Pipeline หลายโมเดล** — ใช้โมเดลที่เข้ากันได้กับ OpenAI ได้ทุกตัว
- **กฎในตัว** — ตรวจสอบ import, ตรวจ syntax, ตรวจจับรูปแบบความปลอดภัย
- **กฎที่กำหนดเอง** — ขยายผ่าน `.ai-guard/rules/`
- **มุมมอง Diff** — เปรียบเทียบภาพการเปลี่ยนแปลงที่แนะนำ
- **Sidebar UI** — แผงเฉพาะสำหรับผลลัพธ์ Pipeline
- **ปรับแต่งได้** — ควบคุมโมเดล, endpoint และพฤติกรรมได้เต็มที่

## เริ่มต้นอย่างรวดเร็ว

1. ติดตั้งส่วนขยายใน VS Code
2. ตั้งค่า API key ใน Settings → AI Guard
3. เปิดไฟล์แล้วกด `Ctrl+Shift+G` (Mac ใช้ `Cmd+Shift+G`)

## คำสั่ง

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `AI Guard: Generate Code` | สร้างโค้ดจาก prompt |
| `AI Guard: Review Selection` | ตรวจสอบโค้ดที่เลือก |
| `AI Guard: Run Full Pipeline` | รัน Pipeline ทั้งหมด |
| `AI Guard: Show Review Diff` | แสดง Diff |
| `AI Guard: Configure Models` | เปิดการตั้งค่าโมเดล |

## การตั้งค่า

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

## กฎที่กำหนดเอง

สร้างไฟล์ `.js` ใน `.ai-guard/rules/`:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'กฎของฉัน',
  description: 'กฎนี้ตรวจสอบอะไร',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## การพัฒนา

```bash
npm install
npm run build    # สร้างส่วนขยาย
npm run watch    # โหมดเฝ้าดู
npm run package  # แพ็คเกจเป็น .vsix
```

## สัญญาอนุญาต

MIT
