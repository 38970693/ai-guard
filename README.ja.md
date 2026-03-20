# AI Guard

**🌍 [English](README.md) | [中文](README.zh-CN.md) | 日本語**

VS Code 用マルチモデル AI コードアシスタント。ハルシネーション防止機能内蔵。

<p align="center">
  <img src="media/team.jpg" width="500" alt="AI Guard 開発の現実">
  <br>
  <em>開発現場の真実：私が穴の中でコードを書き、AIたちが周りでレビュー 😂</em>
</p>

> **フォーク大歓迎！自由に改造して、もっと強くしよう！**

## 概要

AI Guard は3段階パイプラインを使用して、より安全で信頼性の高い AI 支援コードを生成します：

1. **生成（Generate）** — プロダクションモデルがプロンプトからコードを生成
2. **レビュー（Review）** — 別のレビューモデルが生成コードの問題をチェック
3. **ルールチェック（Rule Check）** — 組み込みルールとカスタムルールで出力を検証（インポート検証、構文チェック、セキュリティパターン検出）

生成とレビューに異なるモデルを使用することで、単一モデルでは見逃す可能性のあるハルシネーションやエラーを検出します。

## 機能

- **マルチモデルパイプライン** — 任意の OpenAI 互換モデルを生成・レビューに使用
- **組み込みルール** — インポート検証、構文チェック、セキュリティパターン検出
- **カスタムルール** — `.ai-guard/rules/` でルールを拡張
- **差分ビュー** — レビューモデルが変更を提案した場合のビジュアル比較
- **サイドバー UI** — パイプライン結果とステータスを表示する専用パネル
- **高い設定自由度** — モデル、エンドポイント、パイプライン動作を完全制御

## クイックスタート

1. VS Code に拡張機能をインストール
2. 設定 → AI Guard で API キーを設定
3. ファイルを開き、`Ctrl+Shift+G`（Mac は `Cmd+Shift+G`）でフルパイプラインを実行

## コマンド

| コマンド | 説明 |
|----------|------|
| `AI Guard: Generate Code` | プロンプトからコードを生成 |
| `AI Guard: Review Selection` | 選択コードをレビュー |
| `AI Guard: Run Full Pipeline` | フルパイプライン実行（生成 + レビュー + ルールチェック） |
| `AI Guard: Show Review Diff` | 生成コードとレビューコードの差分を表示 |
| `AI Guard: Configure Models` | モデル設定パネルを開く |

## 設定

### モデル

AI Guard は任意の OpenAI 互換 API エンドポイントをサポートします。VS Code 設定で構成：

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

### ルール

| 設定 | デフォルト | 説明 |
|------|-----------|------|
| `aiGuard.rules.enableBuiltIn` | `true` | 組み込みルールを有効化 |
| `aiGuard.rules.enableImportValidation` | `true` | インポートの存在確認 |
| `aiGuard.rules.enableSyntaxCheck` | `true` | 構文の検証 |
| `aiGuard.rules.enableSecurityPatterns` | `true` | セキュリティ問題の検出 |
| `aiGuard.rules.customRulesPath` | `.ai-guard/rules` | カスタムルールディレクトリ |

### パイプライン

| 設定 | デフォルト | 説明 |
|------|-----------|------|
| `aiGuard.pipeline.autoReview` | `true` | 生成後に自動レビュー |
| `aiGuard.pipeline.autoRuleCheck` | `true` | 生成後に自動ルールチェック |
| `aiGuard.pipeline.showDiffOnIssues` | `true` | 問題検出時に差分を表示 |

## カスタムルール

`.ai-guard/rules/` に `.js` ファイルを作成：

```javascript
module.exports = {
  id: 'my-rule',
  name: 'カスタムルール',
  description: 'このルールがチェックする内容',
  async check(context) {
    const issues = [];
    // context.code、context.language などを分析
    return { issues };
  }
};
```

## 開発

```bash
npm install
npm run build    # 拡張機能をビルド
npm run watch    # ウォッチモード
npm run package  # .vsix にパッケージ
```

## アーキテクチャ

```
src/
├── extension.ts          # エントリーポイント
├── config/               # 設定管理
├── models/               # AI モデルプロバイダー（OpenAI 互換）
├── pipeline/             # 3段階パイプラインエンジン
│   ├── generate-stage    # ステージ1：コード生成
│   ├── review-stage      # ステージ2：AI レビュー
│   └── rule-check-stage  # ステージ3：ルール検証
├── rules/                # ハルシネーション検出ルール
│   ├── built-in/         # インポート、構文、セキュリティチェック
│   └── custom/           # カスタムルールローダー
├── diff/                 # 差分可視化
└── ui/                   # サイドバー、ステータスバー、設定パネル
```

## ライセンス

MIT
