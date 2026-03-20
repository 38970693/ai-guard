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

    // Send updated stageOrder when config changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('aiGuard.pipeline.stageOrder')) {
        this.sendStageOrder();
      }
    });
  }

  private sendStageOrder() {
    const order = vscode.workspace.getConfiguration('aiGuard').get<string[]>('pipeline.stageOrder', ['ruleCheck', 'review']);
    this.view?.webview.postMessage({ type: 'stageOrder', order });
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

    // Send initial stageOrder
    this.sendStageOrder();

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
    <div class="header">
      <div class="header-top">
        <h2>AI Guard Pipeline</h2>
        <button id="settingsBtn" class="header-icon-btn" title="Settings">&#9881;</button>
      </div>
      <p class="subtitle" id="pipeline-subtitle">Generate + Rule Check + Review</p>
    </div>

    <div class="input-section">
      <textarea id="promptInput" placeholder="Describe the code you want to generate..." rows="4"></textarea>
      <div class="button-row">
        <button id="runBtn" class="primary-btn">
          &#9654; Run Pipeline
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
