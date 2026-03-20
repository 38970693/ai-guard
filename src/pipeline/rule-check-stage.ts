import { RuleEngine } from '../rules/rule-engine';
import { StageOutcome, PipelineStageStatus, Finding } from './types';

export async function runRuleCheckStage(
  ruleEngine: RuleEngine,
  generatedCode: string,
  language: string,
  workspaceRoot: string,
  filePath?: string
): Promise<StageOutcome> {
  const start = Date.now();

  try {
    const results = await ruleEngine.runAll({
      generatedCode,
      language,
      workspaceRoot,
      filePath,
    });

    const findings: Finding[] = results.flatMap((r) =>
      r.violations.map((v) => ({
        ...v,
        category: 'rule' as const,
        rule: r.ruleId,
      }))
    );

    const hasErrors = findings.some((f) => f.severity === 'error');
    const hasWarnings = findings.some((f) => f.severity === 'warning');

    return {
      stage: 'ruleCheck',
      status: hasErrors
        ? PipelineStageStatus.Failed
        : hasWarnings
        ? PipelineStageStatus.Warning
        : PipelineStageStatus.Passed,
      durationMs: Date.now() - start,
      output: `${findings.length} rule violation(s) found`,
      findings,
    };
  } catch (err) {
    return {
      stage: 'ruleCheck',
      status: PipelineStageStatus.Failed,
      durationMs: Date.now() - start,
      findings: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
