import * as vscode from 'vscode';
import { AiGuardConfig, ModelConfig, ReviewAgentConfig, RuleConfig, PipelineConfig } from './types';

export class SettingsManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor() {
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('aiGuard')) {
          this._onDidChange.fire();
          this.checkStageOrderWarning();
        }
      })
    );
  }

  private checkStageOrderWarning() {
    const config = this.getPipelineConfig();
    if (!config.skipReviewOnError) return;

    const reviewIdx = config.stageOrder.indexOf('review');
    const ruleCheckIdx = config.stageOrder.indexOf('ruleCheck');
    if (reviewIdx >= 0 && ruleCheckIdx >= 0 && reviewIdx < ruleCheckIdx) {
      vscode.window.showWarningMessage(
        'AI Guard: "skipReviewOnError" is enabled but Review runs before Rule Check. ' +
        'Move Rule Check before Review for this setting to take effect, or disable skipReviewOnError.',
        'Move Rule Check First',
        'Disable skipReviewOnError'
      ).then((choice) => {
        if (choice === 'Move Rule Check First') {
          this.config.update('pipeline.stageOrder', ['ruleCheck', 'review'], vscode.ConfigurationTarget.Global);
        } else if (choice === 'Disable skipReviewOnError') {
          this.config.update('pipeline.skipReviewOnError', false, vscode.ConfigurationTarget.Global);
        }
      });
    }
  }

  private get config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('aiGuard');
  }

  getModelConfig(role: 'productionModel' | 'reviewModel'): ModelConfig {
    return {
      endpoint: this.config.get<string>(`${role}.endpoint`, 'https://api.openai.com/v1'),
      model: this.config.get<string>(`${role}.model`, 'gpt-4o'),
      apiKey: this.config.get<string>(`${role}.apiKey`, ''),
      maxTokens: this.config.get<number>(`${role}.maxTokens`, 4096),
      temperature: this.config.get<number>(`${role}.temperature`, 0.2),
    };
  }

  getRuleConfig(): RuleConfig {
    return {
      enableBuiltIn: this.config.get<boolean>('rules.enableBuiltIn', true),
      customRulesPath: this.config.get<string>('rules.customRulesPath', '.ai-guard/rules'),
      enableEslint: this.config.get<boolean>('rules.enableEslint', true),
      enableImportValidation: this.config.get<boolean>('rules.enableImportValidation', false),
      enableSyntaxCheck: this.config.get<boolean>('rules.enableSyntaxCheck', false),
      enableSecurityPatterns: this.config.get<boolean>('rules.enableSecurityPatterns', false),
    };
  }

  getPipelineConfig(): PipelineConfig {
    return {
      autoReview: this.config.get<boolean>('pipeline.autoReview', true),
      autoRuleCheck: this.config.get<boolean>('pipeline.autoRuleCheck', true),
      showDiffOnIssues: this.config.get<boolean>('pipeline.showDiffOnIssues', true),
      stageOrder: this.config.get<('review' | 'ruleCheck')[]>('pipeline.stageOrder', ['ruleCheck', 'review']),
      skipReviewOnError: this.config.get<boolean>('pipeline.skipReviewOnError', true),
    };
  }

  getReviewAgents(): ReviewAgentConfig[] {
    const agents = this.config.get<ReviewAgentConfig[]>('reviewAgents', []);
    if (agents.length > 0) {
      return agents;
    }
    // Backward compat: wrap single reviewModel as an agent
    const legacy = this.getModelConfig('reviewModel');
    return [{
      ...legacy,
      name: 'Review Agent 1',
      enabled: true,
    }];
  }

  getFullConfig(): AiGuardConfig {
    return {
      productionModel: this.getModelConfig('productionModel'),
      reviewModel: this.getModelConfig('reviewModel'),
      reviewAgents: this.getReviewAgents(),
      rules: this.getRuleConfig(),
      pipeline: this.getPipelineConfig(),
    };
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this._onDidChange.dispose();
  }
}
