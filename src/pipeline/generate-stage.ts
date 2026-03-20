import { ModelProvider } from '../models/types';
import { GENERATION_SYSTEM_PROMPT, buildGeneratePrompt } from '../models/prompt-templates';
import { StageOutcome, PipelineStageStatus, PipelineRequest } from './types';

export async function runGenerateStage(
  provider: ModelProvider,
  request: PipelineRequest
): Promise<StageOutcome> {
  const start = Date.now();

  try {
    const userMessage = buildGeneratePrompt(
      request.prompt,
      request.context,
      request.language
    );

    const result = await provider.complete({
      messages: [
        { role: 'system', content: GENERATION_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    // Extract code from markdown code block if present
    const code = extractCodeBlock(result.content) ?? result.content;

    return {
      stage: 'generate',
      status: PipelineStageStatus.Passed,
      durationMs: Date.now() - start,
      output: code,
      findings: [],
    };
  } catch (err) {
    return {
      stage: 'generate',
      status: PipelineStageStatus.Failed,
      durationMs: Date.now() - start,
      findings: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function extractCodeBlock(text: string): string | null {
  const match = text.match(/```[\w]*\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}
