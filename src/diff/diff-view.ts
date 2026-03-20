import * as vscode from 'vscode';
import { Finding } from '../pipeline/types';

const SCHEME = 'ai-guard';

class AiGuardContentProvider implements vscode.TextDocumentContentProvider {
  private contents = new Map<string, string>();
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

  setContent(uri: vscode.Uri, content: string) {
    this.contents.set(uri.toString(), content);
    this._onDidChange.fire(uri);
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.contents.get(uri.toString()) ?? '';
  }

  dispose() {
    this._onDidChange.dispose();
  }
}

let provider: AiGuardContentProvider | undefined;

export function registerContentProvider(
  context: vscode.ExtensionContext
): AiGuardContentProvider {
  if (!provider) {
    provider = new AiGuardContentProvider();
    context.subscriptions.push(
      vscode.workspace.registerTextDocumentContentProvider(SCHEME, provider)
    );
  }
  return provider;
}

export async function showDiffView(
  contentProvider: AiGuardContentProvider,
  originalCode: string,
  correctedCode: string,
  language: string,
  findings: Finding[]
): Promise<void> {
  const leftUri = vscode.Uri.parse(`${SCHEME}:Generated.${getExtension(language)}`);
  const rightUri = vscode.Uri.parse(`${SCHEME}:Reviewed.${getExtension(language)}`);

  contentProvider.setContent(leftUri, originalCode);
  contentProvider.setContent(rightUri, correctedCode);

  await vscode.commands.executeCommand(
    'vscode.diff',
    leftUri,
    rightUri,
    `AI Guard: Generated vs Reviewed (${findings.length} findings)`
  );

  // Add diagnostics for findings
  const diagnostics = findings
    .filter((f) => f.line)
    .map((f) => {
      const range = new vscode.Range(
        (f.line ?? 1) - 1,
        0,
        (f.line ?? 1) - 1,
        1000
      );
      const diag = new vscode.Diagnostic(
        range,
        `[${f.category}] ${f.message}${f.suggestion ? `\nSuggestion: ${f.suggestion}` : ''}`,
        f.severity === 'error'
          ? vscode.DiagnosticSeverity.Error
          : f.severity === 'warning'
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information
      );
      diag.source = 'AI Guard';
      return diag;
    });

  const collection = vscode.languages.createDiagnosticCollection('ai-guard');
  collection.set(leftUri, diagnostics);
}

function getExtension(language: string): string {
  const map: Record<string, string> = {
    typescript: 'ts',
    javascript: 'js',
    python: 'py',
    java: 'java',
    go: 'go',
    rust: 'rs',
    cpp: 'cpp',
    c: 'c',
    csharp: 'cs',
  };
  return map[language.toLowerCase()] ?? 'txt';
}
