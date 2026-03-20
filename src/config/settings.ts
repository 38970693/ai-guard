import * as vscode from 'vscode';
import { AiGuardConfig, ModelConfig, RuleConfig, PipelineConfig } from './types';

export class SettingsManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private _onDidChange = new vscode.EventEmitter<void>();
  public readonly onDidChange = this._onDidChange.event;

  constructor() {
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('aiGuard')) {
          this._onDidChange.fire();
        }
      })
    );
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
      enableImportValidation: this.config.get<boolean>('rules.enableImportValidation', true),
      enableSyntaxCheck: this.config.get<boolean>('rules.enableSyntaxCheck', true),
      enableSecurityPatterns: this.config.get<boolean>('rules.enableSecurityPatterns', true),
    };
  }

  getPipelineConfig(): PipelineConfig {
    return {
      autoReview: this.config.get<boolean>('pipeline.autoReview', true),
      autoRuleCheck: this.config.get<boolean>('pipeline.autoRuleCheck', true),
      showDiffOnIssues: this.config.get<boolean>('pipeline.showDiffOnIssues', true),
    };
  }

  getFullConfig(): AiGuardConfig {
    return {
      productionModel: this.getModelConfig('productionModel'),
      reviewModel: this.getModelConfig('reviewModel'),
      rules: this.getRuleConfig(),
      pipeline: this.getPipelineConfig(),
    };
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this._onDidChange.dispose();
  }
}
