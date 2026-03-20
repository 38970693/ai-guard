export interface ModelConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
}

export interface RuleConfig {
  enableBuiltIn: boolean;
  customRulesPath: string;
  enableImportValidation: boolean;
  enableSyntaxCheck: boolean;
  enableSecurityPatterns: boolean;
}

export interface PipelineConfig {
  autoReview: boolean;
  autoRuleCheck: boolean;
  showDiffOnIssues: boolean;
}

export interface AiGuardConfig {
  productionModel: ModelConfig;
  reviewModel: ModelConfig;
  rules: RuleConfig;
  pipeline: PipelineConfig;
}
