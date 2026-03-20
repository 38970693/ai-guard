# AI Guard

**🌍 [English](README.md) | 中文 | [日本語](README.ja.md)**

多模型 AI 代码助手，VS Code 插件，内置幻觉防护机制。

<p align="center">
  <img src="media/team.jpg" width="500" alt="AI Guard 开发现实">
  <br>
  <em>真实的开发现场：我在坑里写代码，AI们在旁边审查 😂</em>
</p>

> **欢迎大家魔改，做大做强，再创辉煌！**

## 概述

AI Guard 使用三阶段流水线来生成更安全、更可靠的 AI 辅助代码：

1. **生成（Generate）** — 生产模型根据你的提示生成代码
2. **审查（Review）** — 另一个审查模型检查生成的代码是否存在问题
3. **规则检查（Rule Check）** — 内置和自定义规则验证输出（导入验证、语法检查、安全模式检测）

通过使用不同的模型进行生成和审查，AI Guard 能捕获单一模型可能遗漏的幻觉和错误。

## 功能特性

- **多模型流水线** — 支持任何 OpenAI 兼容模型用于生成和审查
- **内置规则** — 导入验证、语法检查、安全模式检测
- **自定义规则** — 通过 `.ai-guard/rules/` 扩展自己的规则
- **差异视图** — 审查模型建议修改时的可视化对比
- **侧边栏 UI** — 展示流水线结果和状态的专用面板
- **高度可配置** — 完全控制模型、端点和流水线行为

## 快速开始

1. 在 VS Code 中安装本扩展
2. 在 设置 → AI Guard 中配置你的 API 密钥
3. 打开文件，按 `Ctrl+Shift+G`（Mac 上 `Cmd+Shift+G`）运行完整流水线

## 命令

| 命令 | 说明 |
|------|------|
| `AI Guard: Generate Code` | 根据提示生成代码 |
| `AI Guard: Review Selection` | 审查选中的代码 |
| `AI Guard: Run Full Pipeline` | 运行完整流水线（生成 + 审查 + 规则检查） |
| `AI Guard: Show Review Diff` | 显示生成代码与审查代码的差异 |
| `AI Guard: Configure Models` | 打开模型配置面板 |

## 配置

### 模型

AI Guard 支持任何 OpenAI 兼容的 API 端点。通过 VS Code 设置配置：

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

### 规则

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `aiGuard.rules.enableBuiltIn` | `true` | 启用内置规则 |
| `aiGuard.rules.enableImportValidation` | `true` | 检查导入的模块是否存在 |
| `aiGuard.rules.enableSyntaxCheck` | `true` | 验证语法正确性 |
| `aiGuard.rules.enableSecurityPatterns` | `true` | 检测潜在安全问题 |
| `aiGuard.rules.customRulesPath` | `.ai-guard/rules` | 自定义规则目录 |

### 流水线

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| `aiGuard.pipeline.autoReview` | `true` | 生成后自动运行审查 |
| `aiGuard.pipeline.autoRuleCheck` | `true` | 生成后自动运行规则检查 |
| `aiGuard.pipeline.showDiffOnIssues` | `true` | 发现问题时自动显示差异视图 |

## 自定义规则

在 `.ai-guard/rules/` 目录下创建 `.js` 文件：

```javascript
module.exports = {
  id: 'my-rule',
  name: '我的自定义规则',
  description: '这个规则检查什么',
  async check(context) {
    const issues = [];
    // 分析 context.code、context.language 等
    return { issues };
  }
};
```

## 开发

```bash
npm install
npm run build    # 构建扩展
npm run watch    # 监听模式
npm run package  # 打包为 .vsix
```

## 架构

```
src/
├── extension.ts          # 入口文件
├── config/               # 配置管理
├── models/               # AI 模型提供者（OpenAI 兼容）
├── pipeline/             # 三阶段流水线引擎
│   ├── generate-stage    # 阶段一：代码生成
│   ├── review-stage      # 阶段二：AI 审查
│   └── rule-check-stage  # 阶段三：规则验证
├── rules/                # 幻觉检测规则
│   ├── built-in/         # 导入、语法、安全检查
│   └── custom/           # 自定义规则加载器
├── diff/                 # 差异可视化
└── ui/                   # 侧边栏、状态栏、设置面板
```

## 许可证

MIT
