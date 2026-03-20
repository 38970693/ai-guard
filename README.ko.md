# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Français](README.fr.md) | [Español](README.es.md) | [Português](README.pt.md) | 한국어 | [Русский](README.ru.md) | [العربية](README.ar.md) | [Italiano](README.it.md) | [Türkçe](README.tr.md) | [हिन्दी](README.hi.md) | [ภาษาไทย](README.th.md) | [Tiếng Việt](README.vi.md)**

**AI끼리 서로 「트집잡기」를 시키자.** — VS Code용 멀티모델 AI 코드 어시스턴트 — 할루시네이션 방지 기능 내장.

<p align="center">
  <img src="media/team.jpg" width="500" alt="AI Guard 개발 현실">
  <br>
  <em>개발 현장의 진실: 내가 구덩이에서 코딩하고, AI들이 주변에서 리뷰 😂</em>
</p>

> **포크하고 마음껏 수정하세요! 함께 더 크고 강하게 만들어요!**

## 개요

AI Guard는 3단계 파이프라인을 사용하여 더 안전하고 신뢰할 수 있는 AI 지원 코드를 생성합니다:

1. **생성 (Generate)** — 프로덕션 모델이 프롬프트에서 코드 생성
2. **리뷰 (Review)** — 별도의 리뷰 모델이 생성된 코드의 문제 확인
3. **규칙 검사 (Rule Check)** — 내장 및 사용자 정의 규칙으로 출력 검증

생성과 리뷰에 서로 다른 모델을 사용하여, 단일 모델이 놓칠 수 있는 할루시네이션과 오류를 포착합니다.

## 기능

- **멀티모델 파이프라인** — OpenAI 호환 모델 사용 가능
- **내장 규칙** — 임포트 검증, 구문 검사, 보안 패턴 감지
- **사용자 정의 규칙** — `.ai-guard/rules/`로 확장
- **Diff 보기** — 변경 제안 시각적 비교
- **사이드바 UI** — 파이프라인 결과 전용 패널
- **설정 가능** — 모델, 엔드포인트, 파이프라인 동작 완전 제어

## 빠른 시작

1. VS Code에 확장 설치
2. 설정 → AI Guard에서 API 키 구성
3. 파일을 열고 `Ctrl+Shift+G` (Mac: `Cmd+Shift+G`) 누르기

## 명령어

| 명령어 | 설명 |
|--------|------|
| `AI Guard: Generate Code` | 프롬프트에서 코드 생성 |
| `AI Guard: Review Selection` | 선택한 코드 리뷰 |
| `AI Guard: Run Full Pipeline` | 전체 파이프라인 실행 |
| `AI Guard: Show Review Diff` | 생성 코드와 리뷰 코드 차이 표시 |
| `AI Guard: Configure Models` | 모델 설정 패널 열기 |

## 설정

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

## 사용자 정의 규칙

`.ai-guard/rules/`에 `.js` 파일 생성:

```javascript
module.exports = {
  id: 'my-rule',
  name: '내 규칙',
  description: '이 규칙이 검사하는 내용',
  async check(context) {
    const issues = [];
    return { issues };
  }
};
```

## 개발

```bash
npm install
npm run build    # 확장 빌드
npm run watch    # 감시 모드
npm run package  # .vsix로 패키지
```

## 라이선스

MIT
