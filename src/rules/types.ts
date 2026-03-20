import { Finding } from '../pipeline/types';

export interface RuleContext {
  generatedCode: string;
  language: string;
  workspaceRoot: string;
  filePath?: string;
}

export interface RuleResult {
  ruleId: string;
  passed: boolean;
  violations: Omit<Finding, 'category' | 'rule'>[];
}

export interface Rule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  check(context: RuleContext): Promise<RuleResult>;
}
