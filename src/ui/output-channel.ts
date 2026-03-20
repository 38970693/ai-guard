import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('AI Guard');
  }
  return channel;
}

export function log(message: string) {
  const timestamp = new Date().toISOString();
  getOutputChannel().appendLine(`[${timestamp}] ${message}`);
}

export function logError(message: string, error?: unknown) {
  const errMsg = error instanceof Error ? error.message : String(error ?? '');
  log(`ERROR: ${message}${errMsg ? ` — ${errMsg}` : ''}`);
}
