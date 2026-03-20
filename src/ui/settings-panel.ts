import * as vscode from 'vscode';
import { SettingsManager } from '../config';

export class SettingsPanel {
  private static currentPanel: SettingsPanel | undefined;
  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  static show(extensionUri: vscode.Uri, settings: SettingsManager) {
    if (SettingsPanel.currentPanel) {
      SettingsPanel.currentPanel.panel.reveal();
      SettingsPanel.currentPanel.syncSettings(settings);
      return;
    }
    SettingsPanel.currentPanel = new SettingsPanel(extensionUri, settings);
  }

  private constructor(
    private extensionUri: vscode.Uri,
    private settings: SettingsManager
  ) {
    this.panel = vscode.window.createWebviewPanel(
      'aiGuard.settings',
      'AI Guard Settings',
      vscode.ViewColumn.One,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    this.panel.iconPath = vscode.Uri.joinPath(extensionUri, 'media', 'icon.svg');
    this.panel.webview.html = this.getHtml();

    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposables
    );

    this.panel.onDidDispose(() => {
      SettingsPanel.currentPanel = undefined;
      this.disposables.forEach((d) => d.dispose());
    });

    // Send current settings to webview
    this.syncSettings(settings);
  }

  private syncSettings(settings: SettingsManager) {
    const config = settings.getFullConfig();
    this.panel.webview.postMessage({ type: 'loadSettings', config });
  }

  private async handleMessage(msg: any) {
    switch (msg.type) {
      case 'saveSettings': {
        const cfg = vscode.workspace.getConfiguration('aiGuard');
        const updates = msg.config;

        // Batch all setting updates
        const writes: Thenable<void>[] = [];
        for (const [key, value] of Object.entries(updates)) {
          writes.push(cfg.update(key, value, vscode.ConfigurationTarget.Global));
        }
        await Promise.all(writes);

        vscode.window.showInformationMessage('AI Guard: Settings saved');
        break;
      }
      case 'testConnection': {
        await this.testConnection(msg.role);
        break;
      }
    }
  }

  private async testConnection(role: 'productionModel' | 'reviewModel') {
    const config = this.settings.getModelConfig(role);
    if (!config.apiKey) {
      this.panel.webview.postMessage({
        type: 'testResult',
        role,
        success: false,
        message: 'API Key is empty',
      });
      return;
    }

    try {
      const isAnthropic = config.endpoint.includes('anthropic');
      const url = isAnthropic
        ? `${config.endpoint}/messages`
        : `${config.endpoint}/chat/completions`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (isAnthropic) {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const body = isAnthropic
        ? { model: config.model, max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] }
        : { model: config.model, max_tokens: 5, messages: [{ role: 'user', content: 'hi' }] };

      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (resp.ok) {
        this.panel.webview.postMessage({
          type: 'testResult',
          role,
          success: true,
          message: `Connected! Model: ${config.model}`,
        });
      } else {
        const text = await resp.text();
        let detail = `HTTP ${resp.status}`;
        try {
          const json = JSON.parse(text);
          detail = json.error?.message ?? json.message ?? detail;
        } catch {}
        this.panel.webview.postMessage({
          type: 'testResult',
          role,
          success: false,
          message: detail,
        });
      }
    } catch (err) {
      this.panel.webview.postMessage({
        type: 'testResult',
        role,
        success: false,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private getHtml(): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Guard Settings</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 24px 32px;
      max-width: 720px;
      margin: 0 auto;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .page-subtitle {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 24px;
    }
    .section {
      margin-bottom: 24px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      overflow: hidden;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: color-mix(in srgb, var(--vscode-badge-background) 15%, var(--vscode-editor-background));
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .section-header h2 {
      font-size: 14px;
      font-weight: 600;
    }
    .section-header .badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      font-weight: 600;
    }
    .section-body {
      padding: 16px;
    }
    .field {
      margin-bottom: 14px;
    }
    .field:last-child {
      margin-bottom: 0;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--vscode-foreground);
    }
    label .hint {
      font-weight: 400;
      color: var(--vscode-descriptionForeground);
    }
    input[type="text"],
    input[type="password"],
    input[type="number"],
    select {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }
    input:focus, select:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }
    .row {
      display: flex;
      gap: 12px;
    }
    .row > .field {
      flex: 1;
    }
    .api-key-row {
      display: flex;
      gap: 8px;
    }
    .api-key-row input {
      flex: 1;
    }
    .toggle-btn {
      padding: 6px 8px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      white-space: nowrap;
    }
    .toggle-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .test-btn {
      padding: 6px 12px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      white-space: nowrap;
    }
    .test-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .test-result {
      font-size: 11px;
      margin-top: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      display: none;
    }
    .test-result.success {
      display: block;
      color: var(--vscode-testing-iconPassed);
      background: color-mix(in srgb, var(--vscode-testing-iconPassed) 10%, var(--vscode-editor-background));
    }
    .test-result.error {
      display: block;
      color: var(--vscode-editorError-foreground);
      background: color-mix(in srgb, var(--vscode-editorError-foreground) 10%, var(--vscode-editor-background));
    }

    /* Checkbox / toggle row */
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid color-mix(in srgb, var(--vscode-panel-border) 50%, transparent);
    }
    .toggle-row:last-child {
      border-bottom: none;
    }
    .toggle-label {
      font-size: 12px;
    }
    .toggle-desc {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }
    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--vscode-button-background);
      cursor: pointer;
    }

    /* Save bar */
    .save-bar {
      position: sticky;
      bottom: 0;
      background: var(--vscode-editor-background);
      border-top: 1px solid var(--vscode-panel-border);
      padding: 12px 0;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .save-btn {
      padding: 8px 24px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }
    .save-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .preset-select {
      width: auto;
      min-width: 160px;
    }

    /* Review Agent Cards */
    .agent-card {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 12px;
      background: color-mix(in srgb, var(--vscode-editor-background) 95%, var(--vscode-badge-background));
    }
    .agent-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .agent-card-header .agent-name-input {
      font-weight: 600;
      font-size: 13px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      flex: 1;
      padding: 2px 4px;
    }
    .agent-card-header .agent-name-input:focus {
      outline: none;
      border-bottom: 1px solid var(--vscode-focusBorder);
    }
    .agent-toggle-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .agent-toggle-label {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }
    .agent-remove-btn {
      padding: 2px 8px;
      font-size: 11px;
      background: transparent;
      color: var(--vscode-editorError-foreground);
      border: 1px solid var(--vscode-editorError-foreground);
      border-radius: 3px;
      cursor: pointer;
      opacity: 0.7;
    }
    .agent-remove-btn:hover {
      opacity: 1;
      background: color-mix(in srgb, var(--vscode-editorError-foreground) 10%, transparent);
    }
    .add-agent-btn {
      width: 100%;
      padding: 8px;
      background: transparent;
      color: var(--vscode-button-background);
      border: 1px dashed var(--vscode-button-background);
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      opacity: 0.8;
      transition: opacity 0.15s, background 0.15s;
    }
    .add-agent-btn:hover {
      opacity: 1;
      background: color-mix(in srgb, var(--vscode-button-background) 8%, transparent);
    }
  </style>
</head>
<body>
  <h1>AI Guard Settings</h1>
  <p class="page-subtitle">Configure API keys and model assignments for each pipeline stage</p>

  <!-- Generate Model -->
  <div class="section">
    <div class="section-header">
      <h2>Stage 1 &mdash; Generate</h2>
      <span class="badge">Production Model</span>
    </div>
    <div class="section-body">
      <div class="field">
        <label>Preset</label>
        <select id="prod-preset" class="preset-select">
          <option value="">Custom</option>
          <optgroup label="OpenAI">
            <option value="openai-gpt4o">GPT-4o</option>
            <option value="openai-gpt4o-mini">GPT-4o Mini</option>
            <option value="openai-o3">o3</option>
            <option value="openai-o4-mini">o4-mini</option>
          </optgroup>
          <optgroup label="Anthropic">
            <option value="claude-opus">Claude Opus 4</option>
            <option value="claude-sonnet">Claude Sonnet 4</option>
            <option value="claude-haiku">Claude Haiku 3.5</option>
          </optgroup>
          <optgroup label="Google">
            <option value="gemini-pro">Gemini 2.5 Pro</option>
            <option value="gemini-flash">Gemini 2.5 Flash</option>
          </optgroup>
          <optgroup label="DeepSeek">
            <option value="deepseek-v3">DeepSeek V3</option>
            <option value="deepseek-r1">DeepSeek R1</option>
          </optgroup>
          <optgroup label="Mistral">
            <option value="mistral-large">Mistral Large</option>
            <option value="mistral-codestral">Codestral</option>
          </optgroup>
          <optgroup label="xAI">
            <option value="xai-grok">Grok 3</option>
          </optgroup>
          <optgroup label="Alibaba">
            <option value="qwen-max">Qwen Max</option>
            <option value="qwen-coder">Qwen Coder</option>
          </optgroup>
          <optgroup label="Meta (via Groq)">
            <option value="groq-llama">Llama 3.3 70B</option>
          </optgroup>
          <optgroup label="MiniMax">
            <option value="minimax-text">MiniMax-Text-01</option>
            <option value="minimax-m1">MiniMax-M1</option>
          </optgroup>
          <optgroup label="Moonshot (Kimi)">
            <option value="kimi-k2">Kimi K2</option>
            <option value="kimi-moonshot">Moonshot-v1-128k</option>
          </optgroup>
          <optgroup label="Xiaomi (MiMo)">
            <option value="mimo-7b">MiMo-7B</option>
          </optgroup>
          <optgroup label="Cohere">
            <option value="cohere-command">Command R+</option>
          </optgroup>
          <optgroup label="Local">
            <option value="ollama">Ollama</option>
            <option value="lmstudio">LM Studio</option>
          </optgroup>
        </select>
      </div>
      <div class="field">
        <label>API Endpoint</label>
        <input type="text" id="prod-endpoint" placeholder="https://api.openai.com/v1">
      </div>
      <div class="field">
        <label>Model Name</label>
        <input type="text" id="prod-model" placeholder="gpt-4o">
      </div>
      <div class="field">
        <label>API Key</label>
        <div class="api-key-row">
          <input type="password" id="prod-apiKey" placeholder="sk-...">
          <button class="toggle-btn" data-target="prod-apiKey">Show</button>
          <button class="test-btn" data-role="productionModel">Test</button>
        </div>
        <div class="test-result" id="test-productionModel"></div>
      </div>
      <div class="row">
        <div class="field">
          <label>Max Tokens</label>
          <input type="number" id="prod-maxTokens" min="1" max="128000" value="4096">
        </div>
        <div class="field">
          <label>Temperature <span class="hint">(0-2)</span></label>
          <input type="number" id="prod-temperature" min="0" max="2" step="0.1" value="0.2">
        </div>
      </div>
    </div>
  </div>

  <!-- Review Agents (Multi-Agent) -->
  <div class="section">
    <div class="section-header">
      <h2>Stage 2 &mdash; Review Agents</h2>
      <span class="badge" id="agent-count-badge">0 agents</span>
    </div>
    <div class="section-body">
      <p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 12px;">
        Configure one or more review agents. All enabled agents run in parallel and their findings are merged.
      </p>
      <div id="review-agents-container"></div>
      <button class="add-agent-btn" id="addAgentBtn">+ Add Review Agent</button>
    </div>
  </div>

  <!-- Pipeline Settings -->
  <div class="section">
    <div class="section-header">
      <h2>Pipeline</h2>
    </div>
    <div class="section-body">
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Auto Review</div>
          <div class="toggle-desc">Automatically run review model after generation</div>
        </div>
        <input type="checkbox" id="pipeline-autoReview">
      </div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Auto Rule Check</div>
          <div class="toggle-desc">Automatically run rule checks after generation</div>
        </div>
        <input type="checkbox" id="pipeline-autoRuleCheck">
      </div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Show Diff on Issues</div>
          <div class="toggle-desc">Automatically show diff view when issues are found</div>
        </div>
        <input type="checkbox" id="pipeline-showDiffOnIssues">
      </div>
    </div>
  </div>

  <!-- Rules Settings -->
  <div class="section">
    <div class="section-header">
      <h2>Stage 3 &mdash; Rules</h2>
    </div>
    <div class="section-body">
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Import Validation</div>
          <div class="toggle-desc">Check if imported modules actually exist</div>
        </div>
        <input type="checkbox" id="rules-enableImportValidation">
      </div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Syntax Check</div>
          <div class="toggle-desc">Verify generated code has no syntax errors</div>
        </div>
        <input type="checkbox" id="rules-enableSyntaxCheck">
      </div>
      <div class="toggle-row">
        <div>
          <div class="toggle-label">Security Patterns</div>
          <div class="toggle-desc">Detect potential security issues in generated code</div>
        </div>
        <input type="checkbox" id="rules-enableSecurityPatterns">
      </div>
      <div class="field" style="margin-top: 12px;">
        <label>Custom Rules Path <span class="hint">(relative to workspace)</span></label>
        <input type="text" id="rules-customRulesPath" placeholder=".ai-guard/rules">
      </div>
    </div>
  </div>

  <div class="save-bar">
    <button class="save-btn" id="saveBtn">Save Settings</button>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    // Preset definitions
    const PRESETS = {
      // OpenAI
      'openai-gpt4o':      { endpoint: 'https://api.openai.com/v1',          model: 'gpt-4o' },
      'openai-gpt4o-mini': { endpoint: 'https://api.openai.com/v1',          model: 'gpt-4o-mini' },
      'openai-o3':         { endpoint: 'https://api.openai.com/v1',          model: 'o3' },
      'openai-o4-mini':    { endpoint: 'https://api.openai.com/v1',          model: 'o4-mini' },
      // Anthropic
      'claude-opus':       { endpoint: 'https://api.anthropic.com/v1',       model: 'claude-opus-4-20250514' },
      'claude-sonnet':     { endpoint: 'https://api.anthropic.com/v1',       model: 'claude-sonnet-4-20250514' },
      'claude-haiku':      { endpoint: 'https://api.anthropic.com/v1',       model: 'claude-haiku-3-5-20241022' },
      // Google
      'gemini-pro':        { endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',  model: 'gemini-2.5-pro' },
      'gemini-flash':      { endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai',  model: 'gemini-2.5-flash' },
      // DeepSeek
      'deepseek-v3':       { endpoint: 'https://api.deepseek.com/v1',        model: 'deepseek-chat' },
      'deepseek-r1':       { endpoint: 'https://api.deepseek.com/v1',        model: 'deepseek-reasoner' },
      // Mistral
      'mistral-large':     { endpoint: 'https://api.mistral.ai/v1',          model: 'mistral-large-latest' },
      'mistral-codestral': { endpoint: 'https://api.mistral.ai/v1',          model: 'codestral-latest' },
      // xAI
      'xai-grok':          { endpoint: 'https://api.x.ai/v1',               model: 'grok-3' },
      // Alibaba Qwen
      'qwen-max':          { endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-max' },
      'qwen-coder':        { endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-coder-plus' },
      // Groq (Meta Llama)
      'groq-llama':        { endpoint: 'https://api.groq.com/openai/v1',     model: 'llama-3.3-70b-versatile' },
      // MiniMax
      'minimax-text':      { endpoint: 'https://api.minimax.chat/v1',        model: 'MiniMax-Text-01' },
      'minimax-m1':        { endpoint: 'https://api.minimax.chat/v1',        model: 'MiniMax-M1' },
      // Moonshot (Kimi)
      'kimi-k2':           { endpoint: 'https://api.moonshot.cn/v1',         model: 'kimi-k2' },
      'kimi-moonshot':     { endpoint: 'https://api.moonshot.cn/v1',         model: 'moonshot-v1-128k' },
      // Xiaomi (MiMo)
      'mimo-7b':           { endpoint: 'https://api.xiaomi.com/v1',          model: 'MiMo-7B-RL' },
      // Cohere
      'cohere-command':    { endpoint: 'https://api.cohere.com/v2',          model: 'command-r-plus' },
      // Local
      'ollama':            { endpoint: 'http://localhost:11434/v1',           model: 'llama3' },
      'lmstudio':          { endpoint: 'http://localhost:1234/v1',            model: 'loaded-model' },
    };

    function $(id) { return document.getElementById(id); }

    let reviewAgents = [];
    let agentIdCounter = 0;

    // Preset handlers for production model
    $('prod-preset').addEventListener('change', (e) => {
      const p = PRESETS[e.target.value];
      if (p) {
        $('prod-endpoint').value = p.endpoint;
        $('prod-model').value = p.model;
      }
    });

    // Show/hide API key (delegated)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle-btn');
      if (btn) {
        const input = $(btn.dataset.target);
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = 'Hide';
        } else {
          input.type = 'password';
          btn.textContent = 'Show';
        }
      }
    });

    // Test connection
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.test-btn');
      if (btn) {
        const role = btn.dataset.role;
        saveSettings();
        btn.textContent = 'Testing...';
        btn.disabled = true;
        vscode.postMessage({ type: 'testConnection', role });
      }
    });

    // Save
    $('saveBtn').addEventListener('click', saveSettings);

    // === Review Agents Management ===

    function getPresetOptions() {
      let html = '<option value="">Custom</option>';
      const groups = {
        'OpenAI': ['openai-gpt4o', 'openai-gpt4o-mini', 'openai-o3', 'openai-o4-mini'],
        'Anthropic': ['claude-opus', 'claude-sonnet', 'claude-haiku'],
        'Google': ['gemini-pro', 'gemini-flash'],
        'DeepSeek': ['deepseek-v3', 'deepseek-r1'],
        'Mistral': ['mistral-large', 'mistral-codestral'],
        'xAI': ['xai-grok'],
        'Alibaba': ['qwen-max', 'qwen-coder'],
        'Meta (via Groq)': ['groq-llama'],
        'MiniMax': ['minimax-text', 'minimax-m1'],
        'Moonshot (Kimi)': ['kimi-k2', 'kimi-moonshot'],
        'Xiaomi (MiMo)': ['mimo-7b'],
        'Cohere': ['cohere-command'],
        'Local': ['ollama', 'lmstudio'],
      };
      const labels = {
        'openai-gpt4o': 'GPT-4o', 'openai-gpt4o-mini': 'GPT-4o Mini', 'openai-o3': 'o3', 'openai-o4-mini': 'o4-mini',
        'claude-opus': 'Claude Opus 4', 'claude-sonnet': 'Claude Sonnet 4', 'claude-haiku': 'Claude Haiku 3.5',
        'gemini-pro': 'Gemini 2.5 Pro', 'gemini-flash': 'Gemini 2.5 Flash',
        'deepseek-v3': 'DeepSeek V3', 'deepseek-r1': 'DeepSeek R1',
        'mistral-large': 'Mistral Large', 'mistral-codestral': 'Codestral',
        'xai-grok': 'Grok 3',
        'qwen-max': 'Qwen Max', 'qwen-coder': 'Qwen Coder',
        'groq-llama': 'Llama 3.3 70B',
        'minimax-text': 'MiniMax-Text-01', 'minimax-m1': 'MiniMax-M1',
        'kimi-k2': 'Kimi K2', 'kimi-moonshot': 'Moonshot-v1-128k',
        'mimo-7b': 'MiMo-7B', 'cohere-command': 'Command R+',
        'ollama': 'Ollama', 'lmstudio': 'LM Studio',
      };
      for (const [group, keys] of Object.entries(groups)) {
        html += '<optgroup label="' + group + '">';
        for (const k of keys) html += '<option value="' + k + '">' + (labels[k] || k) + '</option>';
        html += '</optgroup>';
      }
      return html;
    }

    function addAgentCard(agent) {
      const id = agentIdCounter++;
      agent._id = id;
      reviewAgents.push(agent);
      renderAgents();
      return id;
    }

    function removeAgent(id) {
      reviewAgents = reviewAgents.filter(a => a._id !== id);
      renderAgents();
    }

    function renderAgents() {
      const container = $('review-agents-container');
      container.innerHTML = '';
      $('agent-count-badge').textContent = reviewAgents.filter(a => a.enabled !== false).length + ' agent(s)';

      reviewAgents.forEach((agent) => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        card.dataset.agentId = agent._id;
        card.innerHTML =
          '<div class="agent-card-header">' +
            '<input class="agent-name-input" value="' + escapeAttr(agent.name || '') + '" placeholder="Agent name..." data-field="name">' +
            '<div class="agent-toggle-row">' +
              '<label class="agent-toggle-label">Enabled</label>' +
              '<input type="checkbox" class="agent-enabled-cb" ' + (agent.enabled !== false ? 'checked' : '') + '>' +
              '<button class="agent-remove-btn" title="Remove agent">&times;</button>' +
            '</div>' +
          '</div>' +
          '<div class="field">' +
            '<label>Preset</label>' +
            '<select class="preset-select agent-preset">' + getPresetOptions() + '</select>' +
          '</div>' +
          '<div class="field">' +
            '<label>API Endpoint</label>' +
            '<input type="text" class="agent-endpoint" value="' + escapeAttr(agent.endpoint || '') + '" placeholder="https://api.openai.com/v1">' +
          '</div>' +
          '<div class="field">' +
            '<label>Model Name</label>' +
            '<input type="text" class="agent-model" value="' + escapeAttr(agent.model || '') + '" placeholder="model-name">' +
          '</div>' +
          '<div class="field">' +
            '<label>API Key</label>' +
            '<div class="api-key-row">' +
              '<input type="password" class="agent-apiKey" value="' + escapeAttr(agent.apiKey || '') + '" placeholder="sk-...">' +
              '<button class="toggle-btn" data-target="">Show</button>' +
            '</div>' +
          '</div>' +
          '<div class="row">' +
            '<div class="field"><label>Max Tokens</label><input type="number" class="agent-maxTokens" min="1" max="128000" value="' + (agent.maxTokens || 4096) + '"></div>' +
            '<div class="field"><label>Temperature</label><input type="number" class="agent-temperature" min="0" max="2" step="0.1" value="' + (agent.temperature ?? 0.1) + '"></div>' +
          '</div>';

        // Wire up preset select
        const presetSelect = card.querySelector('.agent-preset');
        detectAgentPreset(presetSelect, agent.endpoint, agent.model);
        presetSelect.addEventListener('change', (e) => {
          const p = PRESETS[e.target.value];
          if (p) {
            card.querySelector('.agent-endpoint').value = p.endpoint;
            card.querySelector('.agent-model').value = p.model;
          }
        });

        // Wire up toggle-btn for this card's apiKey
        const toggleBtn = card.querySelector('.toggle-btn');
        const apiKeyInput = card.querySelector('.agent-apiKey');
        toggleBtn.addEventListener('click', () => {
          if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleBtn.textContent = 'Hide';
          } else {
            apiKeyInput.type = 'password';
            toggleBtn.textContent = 'Show';
          }
        });

        // Wire up remove
        card.querySelector('.agent-remove-btn').addEventListener('click', () => removeAgent(agent._id));

        container.appendChild(card);
      });
    }

    function detectAgentPreset(select, endpoint, model) {
      for (const [key, p] of Object.entries(PRESETS)) {
        if (p.endpoint === endpoint && p.model === model) {
          select.value = key;
          return;
        }
      }
      for (const [key, p] of Object.entries(PRESETS)) {
        if (p.endpoint === endpoint) {
          select.value = key;
          return;
        }
      }
      select.value = '';
    }

    function escapeAttr(s) {
      return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function collectAgents() {
      const cards = document.querySelectorAll('.agent-card');
      const agents = [];
      cards.forEach(card => {
        agents.push({
          name: card.querySelector('.agent-name-input').value.trim() || 'Unnamed Agent',
          endpoint: card.querySelector('.agent-endpoint').value.trim(),
          model: card.querySelector('.agent-model').value.trim(),
          apiKey: card.querySelector('.agent-apiKey').value,
          maxTokens: parseInt(card.querySelector('.agent-maxTokens').value) || 4096,
          temperature: parseFloat(card.querySelector('.agent-temperature').value) ?? 0.1,
          enabled: card.querySelector('.agent-enabled-cb').checked,
        });
      });
      return agents;
    }

    // Add agent button
    $('addAgentBtn').addEventListener('click', () => {
      addAgentCard({
        name: 'Review Agent ' + (reviewAgents.length + 1),
        endpoint: 'https://api.openai.com/v1',
        model: '',
        apiKey: '',
        maxTokens: 4096,
        temperature: 0.1,
        enabled: true,
      });
    });

    function saveSettings() {
      const agents = collectAgents();
      const config = {
        'productionModel.endpoint':   $('prod-endpoint').value,
        'productionModel.model':      $('prod-model').value,
        'productionModel.apiKey':     $('prod-apiKey').value,
        'productionModel.maxTokens':  parseInt($('prod-maxTokens').value) || 4096,
        'productionModel.temperature': parseFloat($('prod-temperature').value) || 0.2,

        'reviewAgents': agents,

        // Also keep reviewModel synced with first agent for backward compat
        'reviewModel.endpoint':   agents[0]?.endpoint || '',
        'reviewModel.model':      agents[0]?.model || '',
        'reviewModel.apiKey':     agents[0]?.apiKey || '',
        'reviewModel.maxTokens':  agents[0]?.maxTokens || 4096,
        'reviewModel.temperature': agents[0]?.temperature ?? 0.1,

        'pipeline.autoReview':       $('pipeline-autoReview').checked,
        'pipeline.autoRuleCheck':    $('pipeline-autoRuleCheck').checked,
        'pipeline.showDiffOnIssues': $('pipeline-showDiffOnIssues').checked,

        'rules.enableImportValidation': $('rules-enableImportValidation').checked,
        'rules.enableSyntaxCheck':      $('rules-enableSyntaxCheck').checked,
        'rules.enableSecurityPatterns':  $('rules-enableSecurityPatterns').checked,
        'rules.customRulesPath':        $('rules-customRulesPath').value,
      };
      vscode.postMessage({ type: 'saveSettings', config });
    }

    // Load settings from extension
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'loadSettings') {
        const c = msg.config;
        $('prod-endpoint').value    = c.productionModel.endpoint;
        $('prod-model').value       = c.productionModel.model;
        $('prod-apiKey').value      = c.productionModel.apiKey;
        $('prod-maxTokens').value   = c.productionModel.maxTokens;
        $('prod-temperature').value = c.productionModel.temperature;

        // Detect production preset
        for (const [key, p] of Object.entries(PRESETS)) {
          if (p.endpoint === c.productionModel.endpoint && p.model === c.productionModel.model) {
            $('prod-preset').value = key;
            break;
          }
        }

        // Load review agents
        reviewAgents = [];
        agentIdCounter = 0;
        const agents = c.reviewAgents || [];
        if (agents.length > 0) {
          agents.forEach(a => addAgentCard(a));
        } else {
          // Backward compat: create one agent from reviewModel
          addAgentCard({
            name: 'Review Agent 1',
            endpoint: c.reviewModel.endpoint,
            model: c.reviewModel.model,
            apiKey: c.reviewModel.apiKey,
            maxTokens: c.reviewModel.maxTokens,
            temperature: c.reviewModel.temperature,
            enabled: true,
          });
        }

        $('pipeline-autoReview').checked       = c.pipeline.autoReview;
        $('pipeline-autoRuleCheck').checked    = c.pipeline.autoRuleCheck;
        $('pipeline-showDiffOnIssues').checked = c.pipeline.showDiffOnIssues;

        $('rules-enableImportValidation').checked = c.rules.enableImportValidation;
        $('rules-enableSyntaxCheck').checked      = c.rules.enableSyntaxCheck;
        $('rules-enableSecurityPatterns').checked  = c.rules.enableSecurityPatterns;
        $('rules-customRulesPath').value          = c.rules.customRulesPath;
      }

      if (msg.type === 'testResult') {
        const el = $('test-' + msg.role);
        const btn = document.querySelector('.test-btn[data-role="' + msg.role + '"]');
        if (btn) { btn.textContent = 'Test'; btn.disabled = false; }
        if (el) {
          el.textContent = msg.message;
          el.className = 'test-result ' + (msg.success ? 'success' : 'error');
        }
      }
    });
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
