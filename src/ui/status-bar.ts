import * as vscode from 'vscode';
import { PipelineEvent, PipelineStageStatus } from '../pipeline/types';

export class StatusBarController implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(eventEmitter: vscode.EventEmitter<PipelineEvent>) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.item.command = 'aiGuard.runPipeline';
    this.setIdle();
    this.item.show();

    this.disposables.push(
      eventEmitter.event((event) => this.onPipelineEvent(event))
    );
  }

  private onPipelineEvent(event: PipelineEvent) {
    switch (event.status) {
      case PipelineStageStatus.Running:
        this.setRunning(event.stage);
        break;
      case PipelineStageStatus.Passed:
        if (event.stage === 'ruleCheck') {
          this.setPassed();
        }
        break;
      case PipelineStageStatus.Warning:
        if (event.stage === 'ruleCheck' || event.stage === 'review') {
          this.setWarning(event.outcome?.findings.length ?? 0);
        }
        break;
      case PipelineStageStatus.Failed:
        this.setFailed(event.outcome?.error ?? 'Pipeline failed');
        break;
    }
  }

  private setIdle() {
    this.item.text = '$(shield) AI Guard';
    this.item.tooltip = 'Click to run AI Guard pipeline';
    this.item.backgroundColor = undefined;
  }

  private setRunning(stage: string) {
    const stageNames: Record<string, string> = {
      generate: 'Generating...',
      review: 'Reviewing...',
      ruleCheck: 'Checking rules...',
    };
    this.item.text = `$(loading~spin) ${stageNames[stage] ?? 'Running...'}`;
    this.item.tooltip = `AI Guard: ${stageNames[stage]}`;
    this.item.backgroundColor = undefined;
  }

  private setPassed() {
    this.item.text = '$(shield) AI Guard: Passed';
    this.item.tooltip = 'All checks passed';
    this.item.backgroundColor = undefined;
    this.resetAfterDelay();
  }

  private setWarning(count: number) {
    this.item.text = `$(shield) AI Guard: ${count} warning(s)`;
    this.item.tooltip = 'Click to view findings';
    this.item.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground'
    );
    this.resetAfterDelay(10000);
  }

  private setFailed(reason: string) {
    this.item.text = `$(shield) AI Guard: Issues found`;
    this.item.tooltip = reason;
    this.item.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.errorBackground'
    );
    this.resetAfterDelay(15000);
  }

  private resetAfterDelay(ms = 5000) {
    setTimeout(() => this.setIdle(), ms);
  }

  dispose() {
    this.item.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
