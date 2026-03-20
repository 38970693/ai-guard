import * as vscode from 'vscode';
import { ModelRegistry } from '../models/model-registry';
import { RuleEngine } from '../rules/rule-engine';
import { PipelineConfig } from '../config/types';
import {
  PipelineRequest,
  PipelineResult,
  PipelineEvent,
  PipelineStageStatus,
  StageOutcome,
} from './types';
import { runGenerateStage } from './generate-stage';
import { runReviewStage } from './review-stage';
import { runRuleCheckStage } from './rule-check-stage';

export class PipelineEngine {
  constructor(
    private modelRegistry: ModelRegistry,
    private ruleEngine: RuleEngine,
    private pipelineConfig: () => PipelineConfig,
    private eventEmitter: vscode.EventEmitter<PipelineEvent>
  ) {}

  async run(request: PipelineRequest): Promise<PipelineResult> {
    const stages: StageOutcome[] = [];
    const config = this.pipelineConfig();
    let generatedCode: string | null = null;
    let correctedCode: string | null = null;
    let hasRuleErrors = false;

    // === Stage 1: Generate (always first) ===
    this.eventEmitter.fire({
      stage: 'generate',
      status: PipelineStageStatus.Running,
    });

    const genOutcome = await runGenerateStage(
      this.modelRegistry.getProvider('production'),
      request
    );
    stages.push(genOutcome);
    this.eventEmitter.fire({
      stage: 'generate',
      status: genOutcome.status,
      outcome: genOutcome,
    });

    if (genOutcome.status === PipelineStageStatus.Failed || !genOutcome.output) {
      return this.buildResult(stages, null, null);
    }

    generatedCode = genOutcome.output;

    // === Post-generate stages in configured order ===
    for (const stage of config.stageOrder) {
      if (stage === 'review') {
        const reviewOutcome = await this.runReview(config, request, generatedCode, hasRuleErrors);
        stages.push(reviewOutcome);
        if (reviewOutcome.reviewData?.correctedCode) {
          correctedCode = reviewOutcome.reviewData.correctedCode;
        }
      } else if (stage === 'ruleCheck') {
        const ruleOutcome = await this.runRuleCheck(config, request, generatedCode);
        stages.push(ruleOutcome);
        if (ruleOutcome.findings.some((f) => f.severity === 'error')) {
          hasRuleErrors = true;
        }
      }
    }

    // Ensure skipped stages are recorded
    const ranStages = new Set(stages.map((s) => s.stage));
    for (const name of ['review', 'ruleCheck'] as const) {
      if (!ranStages.has(name)) {
        stages.push({
          stage: name,
          status: PipelineStageStatus.Skipped,
          durationMs: 0,
          findings: [],
        });
      }
    }

    return this.buildResult(stages, generatedCode, correctedCode);
  }

  private async runReview(
    config: PipelineConfig,
    request: PipelineRequest,
    generatedCode: string,
    hasRuleErrors: boolean
  ): Promise<StageOutcome & { reviewData?: { correctedCode?: string | null } }> {
    if (!config.autoReview) {
      return { stage: 'review', status: PipelineStageStatus.Skipped, durationMs: 0, findings: [] };
    }

    if (config.skipReviewOnError && hasRuleErrors) {
      return {
        stage: 'review',
        status: PipelineStageStatus.Skipped,
        durationMs: 0,
        findings: [{
          severity: 'info',
          category: 'rule',
          message: 'Review skipped: rule check found errors (skipReviewOnError is enabled)',
        }],
      };
    }

    this.eventEmitter.fire({ stage: 'review', status: PipelineStageStatus.Running });

    const reviewProviders = this.modelRegistry.getReviewProviders();

    if (reviewProviders.length <= 1) {
      // Single agent — original behavior
      const reviewOutcome = await runReviewStage(
        this.modelRegistry.getProvider('review'),
        request,
        generatedCode
      );
      this.eventEmitter.fire({ stage: 'review', status: reviewOutcome.status, outcome: reviewOutcome });
      return reviewOutcome;
    }

    // Multiple agents — run in parallel, merge findings
    const start = Date.now();
    const results = await Promise.allSettled(
      reviewProviders.map((rp) =>
        runReviewStage(rp.provider, request, generatedCode)
          .then((outcome) => ({ name: rp.name, outcome }))
      )
    );

    const mergedFindings: import('./types').Finding[] = [];
    let correctedCode: string | null = null;
    const agentSummaries: string[] = [];

    for (const r of results) {
      if (r.status === 'fulfilled') {
        const { name, outcome } = r.value;
        // Prefix findings with agent name
        for (const f of outcome.findings) {
          mergedFindings.push({
            ...f,
            message: `[${name}] ${f.message}`,
          });
        }
        if (outcome.reviewData?.correctedCode && !correctedCode) {
          correctedCode = outcome.reviewData.correctedCode;
        }
        agentSummaries.push(`${name}: ${outcome.output ?? outcome.status}`);
      } else {
        agentSummaries.push(`Agent failed: ${r.reason}`);
      }
    }

    const hasErrors = mergedFindings.some((f) => f.severity === 'error');
    const hasWarnings = mergedFindings.some((f) => f.severity === 'warning');

    const mergedOutcome: StageOutcome & { reviewData?: { correctedCode?: string | null } } = {
      stage: 'review',
      status: hasErrors
        ? PipelineStageStatus.Failed
        : hasWarnings
        ? PipelineStageStatus.Warning
        : PipelineStageStatus.Passed,
      durationMs: Date.now() - start,
      output: agentSummaries.join('\n'),
      findings: mergedFindings,
      reviewData: { correctedCode },
    };

    this.eventEmitter.fire({ stage: 'review', status: mergedOutcome.status, outcome: mergedOutcome });
    return mergedOutcome;
  }

  private async runRuleCheck(
    config: PipelineConfig,
    request: PipelineRequest,
    generatedCode: string
  ): Promise<StageOutcome> {
    if (!config.autoRuleCheck) {
      return { stage: 'ruleCheck', status: PipelineStageStatus.Skipped, durationMs: 0, findings: [] };
    }

    this.eventEmitter.fire({ stage: 'ruleCheck', status: PipelineStageStatus.Running });

    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    const ruleOutcome = await runRuleCheckStage(
      this.ruleEngine,
      generatedCode,
      request.language,
      workspaceRoot,
      request.filePath
    );
    this.eventEmitter.fire({ stage: 'ruleCheck', status: ruleOutcome.status, outcome: ruleOutcome });
    return ruleOutcome;
  }

  private buildResult(
    stages: StageOutcome[],
    generatedCode: string | null,
    correctedCode: string | null
  ): PipelineResult {
    const allFindings = stages.flatMap((s) => s.findings);

    const totalFindings = {
      errors: allFindings.filter((f) => f.severity === 'error').length,
      warnings: allFindings.filter((f) => f.severity === 'warning').length,
      infos: allFindings.filter((f) => f.severity === 'info').length,
    };

    const approved =
      totalFindings.errors === 0 &&
      !stages.some((s) => s.status === PipelineStageStatus.Failed);

    return {
      stages,
      generatedCode,
      correctedCode,
      approved,
      totalFindings,
    };
  }
}
