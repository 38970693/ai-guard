# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | [한국어](README.ko.md) | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | Tiếng Việt**

Trợ lý code AI đa mô hình cho VS Code với tính năng ngăn chặn ảo giác.

<p align="center">
  <img src="media/team.jpg" width="500" alt="Thực tế phát triển AI Guard">
  <br>
  <em>Thực tế phát triển: tôi viết code dưới hố, các AI đứng xung quanh giám sát 😂</em>
</p>

> **Chào mừng mọi người fork và cải tiến! Cùng nhau làm cho nó lớn mạnh hơn!**

## Tổng quan

AI Guard sử dụng pipeline ba giai đoạn để tạo code hỗ trợ AI an toàn và đáng tin cậy hơn:

1. **Tạo (Generate)** — Mô hình sản xuất tạo code từ prompt của bạn
2. **Đánh giá (Review)** — Mô hình đánh giá riêng kiểm tra code đã tạo
3. **Kiểm tra quy tắc (Rule Check)** — Quy tắc tích hợp và tùy chỉnh xác thực đầu ra

Bằng cách sử dụng các mô hình khác nhau cho tạo và đánh giá, AI Guard phát hiện ảo giác và lỗi mà một mô hình đơn lẻ có thể bỏ sót.

## Tính năng

- **Pipeline đa mô hình** — Sử dụng bất kỳ mô hình tương thích OpenAI nào
- **Quy tắc tích hợp** — Xác thực import, kiểm tra cú pháp, phát hiện mẫu bảo mật
- **Quy tắc tùy chỉnh** — Mở rộng qua `.ai-guard/rules/`
- **Xem diff** — So sánh trực quan các thay đổi được đề xuất
- **Giao diện sidebar** — Bảng điều khiển chuyên dụng cho kết quả pipeline
- **Cấu hình linh hoạt** — Kiểm soát hoàn toàn mô hình, endpoint và hành vi

## Bắt đầu nhanh

1. Cài đặt extension trong VS Code
2. Cấu hình API key tại Cài đặt → AI Guard
3. Mở file và nhấn `Ctrl+Shift+G` (Mac dùng `Cmd+Shift+G`)

## Lệnh

| Lệnh | Mô tả |
|------|-------|
| `AI Guard: Generate Code` | Tạo code từ prompt |
| `AI Guard: Review Selection` | Đánh giá code đã chọn |
| `AI Guard: Run Full Pipeline` | Chạy toàn bộ pipeline |
| `AI Guard: Show Review Diff` | Hiển thị diff |
| `AI Guard: Configure Models` | Mở cài đặt mô hình |

## Cấu hình

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

## Quy tắc tùy chỉnh

Tạo file `.js` trong `.ai-guard/rules/`:

```javascript
module.exports = {
  id: 'my-rule',
  name: 'Quy tắc của tôi',
  description: 'Quy tắc này kiểm tra gì',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## Phát triển

```bash
npm install
npm run build    # Build extension
npm run watch    # Chế độ theo dõi
npm run package  # Đóng gói thành .vsix
```

## Giấy phép

MIT
