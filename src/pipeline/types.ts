export type PipelineStageName = 'generate' | 'review' | 'ruleCheck';

export enum PipelineStageStatus {
  Pending = 'pending',
  Running = 'running',
  Passed = 'passed',
  Warning = 'warning',
  Failed = 'failed',
  Skipped = 'skipped',
}

export interface Finding {
  severity: 'error' | 'warning' | 'info';
  category: 'hallucination' | 'correctness' | 'security' | 'style' | 'rule';
  message: string;
  line?: number;
  column?: number;
  rule?: string;
  suggestion?: string;
}

export interface StageOutcome {
  stage: PipelineStageName;
  status: PipelineStageStatus;
  durationMs: number;
  output?: string;
  findings: Finding[];
  error?: string;
}

export interface PipelineRequest {
  prompt: string;
  context: string;
  language: string;
  filePath?: string;
}

export interface PipelineResult {
  stages: StageOutcome[];
  generatedCode: string | null;
  correctedCode: string | null;
  approved: boolean;
  totalFindings: { errors: number; warnings: number; infos: number };
}

export interface PipelineEvent {
  stage: PipelineStageName;
  status: PipelineStageStatus;
  outcome?: StageOutcome;
}
