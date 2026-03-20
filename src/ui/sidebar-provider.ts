import * as vscode from 'vscode';
import { PipelineEvent } from '../pipeline/types';

export class SidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  constructor(
    private extensionUri: vscode.Uri,
    private eventEmitter: vscode.EventEmitter<PipelineEvent>,
    private onRunPipeline: (prompt: string) => void,
    private onOpenDiff: () => void,
    private onReoptimize: () => void = () => {},
    private onOpenCodeInEditor: (stage: string) => void = () => {},
    private onFixFinding: (finding: any) => void | Promise<void> = () => {}
  ) {
    eventEmitter.event((event) => {
      this.view?.webview.postMessage({
        type: 'pipelineEvent',
        ...event,
      });
    });

    // Send updated stageOrder and model info when config changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('aiGuard.pipeline.stageOrder')) {
        this.sendStageOrder();
      }
      if (e.affectsConfiguration('aiGuard.productionModel') || e.affectsConfiguration('aiGuard.reviewModel') || e.affectsConfiguration('aiGuard.reviewAgents')) {
        this.sendModelInfo();
      }
    });
  }

  private sendStageOrder() {
    const order = vscode.workspace.getConfiguration('aiGuard').get<string[]>('pipeline.stageOrder', ['ruleCheck', 'review']);
    this.view?.webview.postMessage({ type: 'stageOrder', order });
  }

  private sendModelInfo() {
    const config = vscode.workspace.getConfiguration('aiGuard');
    const prodModel = config.get<string>('productionModel.model', 'gpt-4o');

    // Check for multi-agent config
    const reviewAgents = config.get<any[]>('reviewAgents', []);
    const enabledAgents = reviewAgents.filter((a: any) => a.enabled !== false);

    if (enabledAgents.length > 0) {
      this.view?.webview.postMessage({
        type: 'modelInfo',
        generate: { model: prodModel },
        reviewAgents: enabledAgents.map((a: any) => ({
          name: a.name,
          model: a.model,
        })),
      });
    } else {
      const reviewModel = config.get<string>('reviewModel.model', 'claude-sonnet-4-20250514');
      this.view?.webview.postMessage({
        type: 'modelInfo',
        generate: { model: prodModel },
        reviewAgents: [{ name: 'Review', model: reviewModel }],
      });
    }
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'media'),
      ],
    };

    webviewView.webview.html = '';
    webviewView.webview.html = this.getHtml(webviewView.webview);

    // Send initial stageOrder and model info
    this.sendStageOrder();
    this.sendModelInfo();

    webviewView.webview.onDidReceiveMessage((msg) => {
      switch (msg.type) {
        case 'runPipeline':
          Promise.resolve(this.onRunPipeline(msg.prompt)).catch((err) => {
            vscode.window.showErrorMessage(`Pipeline failed: ${err}`);
          });
          break;
        case 'openDiff':
          Promise.resolve(this.onOpenDiff()).catch((err) => {
            vscode.window.showErrorMessage(`Failed to open diff: ${err}`);
          });
          break;
        case 'openSettings':
          vscode.commands.executeCommand('aiGuard.configureModels');
          break;
        case 'reoptimize':
          Promise.resolve(this.onReoptimize()).catch((err) => {
            vscode.window.showErrorMessage(`Re-optimize failed: ${err}`);
          });
          break;
        case 'openCodeInEditor':
          Promise.resolve(this.onOpenCodeInEditor(msg.stage)).catch((err) => {
            vscode.window.showErrorMessage(`Failed to open code in editor: ${err}`);
          });
          break;
        case 'fixFinding':
          this.view?.webview.postMessage({ type: 'fixStarted' });
          Promise.resolve(this.onFixFinding(msg.finding)).catch((err) => {
            this.view?.webview.postMessage({ type: 'fixError', error: String(err) });
          });
          break;
        case 'updateStageOrder':
          vscode.workspace.getConfiguration('aiGuard').update(
            'pipeline.stageOrder',
            msg.order,
            vscode.ConfigurationTarget.Global
          );
          break;
      }
    });
  }

  postMessage(message: any) {
    this.view?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'webview.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'main.css')
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:;">
  <link href="${styleUri}" rel="stylesheet">
  <title>AI Guard</title>
</head>
<body>
  <div id="app">
    <!-- Top Toolbar -->
    <div class="top-toolbar">
      <button id="settingsBtn" class="icon-btn" title="Settings">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M9.1 4.4L8.6 2H7.4L6.9 4.4L6.2 4.7L4.2 3.4L3.4 4.2L4.7 6.2L4.4 6.9L2 7.4V8.6L4.4 9.1L4.7 9.8L3.4 11.8L4.2 12.6L6.2 11.3L6.9 11.6L7.4 14H8.6L9.1 11.6L9.8 11.3L11.8 12.6L12.6 11.8L11.3 9.8L11.6 9.1L14 8.6V7.4L11.6 6.9L11.3 6.2L12.6 4.2L11.8 3.4L9.8 4.7L9.1 4.4ZM8 10C6.9 10 6 9.1 6 8C6 6.9 6.9 6 8 6C9.1 6 10 6.9 10 8C10 9.1 9.1 10 8 10Z"/></svg>
      </button>
    </div>

    <!-- Input Section -->
    <div class="input-section">
      <textarea id="promptInput" placeholder="Describe the code you want to generate..." rows="3"></textarea>
      <div class="input-footer">
        <div class="model-tags" id="model-tags">
          <span class="model-tag model-tag-generate" id="tag-generate" title="Generation Model">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3l6 5-6 5V3z"/></svg>
            <span id="tag-generate-name">--</span>
          </span>
          <span class="model-tag model-tag-review" title="Review Model">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1C4.1 1 1 3.6 1 7c0 1.8.8 3.4 2.2 4.5L2 15l4-2.5c.6.1 1.3.2 2 .2 3.9 0 7-2.6 7-6S11.9 1 8 1z"/></svg>
            <span id="tag-review-name">--</span>
          </span>
        </div>
        <button id="runBtn" class="submit-btn" title="Run Pipeline (Ctrl+Enter)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2l12 6-12 6V2z"/></svg>
        </button>
      </div>
    </div>

    <div class="pipeline-stages">
      <div class="stage-card" id="stage-generate">
        <div class="stage-header">
          <span class="stage-icon" id="icon-generate">1</span>
          <span class="stage-name">Generate</span>
          <span class="stage-status" id="status-generate">Idle</span>
        </div>
        <div class="stage-detail" id="detail-generate"></div>
      </div>

      <div class="stage-arrow">&#x2193;</div>

      <div id="post-generate-stages"></div>
    </div>

    <div class="findings-section" id="findings-section" style="display:none;">
      <h3>Findings</h3>
      <div id="findings-list"></div>
      <div class="findings-actions">
        <button id="reoptimizeBtn" class="primary-btn" style="display:none;">
          &#x1F504; Re-optimize with Findings
        </button>
        <button id="diffBtn" class="secondary-btn" style="display:none;">
          View Diff
        </button>
      </div>
    </div>

    <div class="result-section" id="result-section" style="display:none;">
      <div class="result-badge" id="result-badge"></div>
    </div>
  </div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
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
