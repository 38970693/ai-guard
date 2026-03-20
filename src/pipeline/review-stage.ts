import { ModelProvider } from '../models/types';
import { REVIEW_SYSTEM_PROMPT, buildReviewPrompt } from '../models/prompt-templates';
import { StageOutcome, PipelineStageStatus, Finding, PipelineRequest } from './types';

export interface ReviewResult {
  approved: boolean;
  confidence: number;
  findings: Finding[];
  summary: string;
  correctedCode: string | null;
}

export async function runReviewStage(
  provider: ModelProvider,
  request: PipelineRequest,
  generatedCode: string
): Promise<StageOutcome & { reviewData?: ReviewResult }> {
  const start = Date.now();

  try {
    const userMessage = buildReviewPrompt(
      generatedCode,
      request.prompt,
      request.language
    );

    const result = await provider.complete({
      messages: [
        { role: 'system', content: REVIEW_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const reviewData = parseReviewResponse(result.content);

    const hasErrors = reviewData.findings.some((f) => f.severity === 'error');
    const hasWarnings = reviewData.findings.some((f) => f.severity === 'warning');

    return {
      stage: 'review',
      status: hasErrors
        ? PipelineStageStatus.Failed
        : hasWarnings
        ? PipelineStageStatus.Warning
        : PipelineStageStatus.Passed,
      durationMs: Date.now() - start,
      output: reviewData.summary,
      findings: reviewData.findings,
      reviewData,
    };
  } catch (err) {
    return {
      stage: 'review',
      status: PipelineStageStatus.Failed,
      durationMs: Date.now() - start,
      findings: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function parseReviewResponse(content: string): ReviewResult {
  // Try to extract JSON from the response (may be wrapped in markdown)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonStr.trim());

    return {
      approved: parsed.approved ?? false,
      confidence: parsed.confidence ?? 0.5,
      findings: (parsed.findings ?? []).map((f: any) => ({
        severity: f.severity ?? 'warning',
        category: f.category ?? 'correctness',
        message: f.message ?? 'Unknown issue',
        line: f.line ?? undefined,
        suggestion: f.suggestion ?? undefined,
      })),
      summary: parsed.summary ?? 'Review completed',
      correctedCode: parsed.correctedCode ?? null,
    };
  } catch {
    // If JSON parsing fails, treat the entire response as a warning
    return {
      approved: false,
      confidence: 0.3,
      findings: [
        {
          severity: 'warning',
          category: 'correctness',
          message: `Review model returned non-JSON response: ${content.slice(0, 200)}`,
        },
      ],
      summary: 'Review response could not be parsed',
      correctedCode: null,
    };
  }
}
