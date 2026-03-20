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
  Finding,
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

    // === Stage 1: Generate ===
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

    // === Stage 2: Review (optional) ===
    if (config.autoReview) {
      this.eventEmitter.fire({
        stage: 'review',
        status: PipelineStageStatus.Running,
      });

      const reviewOutcome = await runReviewStage(
        this.modelRegistry.getProvider('review'),
        request,
        generatedCode
      );
      stages.push(reviewOutcome);
      this.eventEmitter.fire({
        stage: 'review',
        status: reviewOutcome.status,
        outcome: reviewOutcome,
      });

      if (reviewOutcome.reviewData?.correctedCode) {
        correctedCode = reviewOutcome.reviewData.correctedCode;
      }
    } else {
      stages.push({
        stage: 'review',
        status: PipelineStageStatus.Skipped,
        durationMs: 0,
        findings: [],
      });
    }

    // === Stage 3: Rule Check (optional) ===
    if (config.autoRuleCheck) {
      this.eventEmitter.fire({
        stage: 'ruleCheck',
        status: PipelineStageStatus.Running,
      });

      const workspaceRoot =
        vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';

      const ruleOutcome = await runRuleCheckStage(
        this.ruleEngine,
        generatedCode,
        request.language,
        workspaceRoot,
        request.filePath
      );
      stages.push(ruleOutcome);
      this.eventEmitter.fire({
        stage: 'ruleCheck',
        status: ruleOutcome.status,
        outcome: ruleOutcome,
      });
    } else {
      stages.push({
        stage: 'ruleCheck',
        status: PipelineStageStatus.Skipped,
        durationMs: 0,
        findings: [],
      });
    }

    return this.buildResult(stages, generatedCode, correctedCode);
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
