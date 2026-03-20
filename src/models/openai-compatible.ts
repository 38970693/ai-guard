import { ModelConfig } from '../config/types';
import { ModelProvider, CompletionRequest, CompletionResult, ChatMessage } from './types';

export class OpenAICompatibleProvider implements ModelProvider {
  public readonly name: string;

  constructor(private config: ModelConfig) {
    this.name = `${config.model}@${new URL(config.endpoint).hostname}`;
  }

  async complete(request: CompletionRequest): Promise<CompletionResult> {
    const isAnthropic = this.config.endpoint.includes('anthropic');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let url: string;
    let body: string;

    if (isAnthropic) {
      // Native Anthropic API format
      headers['x-api-key'] = this.config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      url = `${this.config.endpoint.replace(/\/+$/, '')}/messages`;

      const systemMsg = request.messages.find((m) => m.role === 'system');
      const nonSystemMsgs = request.messages.filter((m) => m.role !== 'system');

      body = JSON.stringify({
        model: this.config.model,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
        ...(systemMsg ? { system: systemMsg.content } : {}),
        messages: nonSystemMsgs.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        ...(request.stop ? { stop_sequences: request.stop } : {}),
      });
    } else {
      // OpenAI-compatible format (works with OpenAI, DeepSeek, Ollama, etc.)
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      url = `${this.config.endpoint.replace(/\/+$/, '')}/chat/completions`;

      body = JSON.stringify({
        model: this.config.model,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
        messages: request.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        ...(request.stop ? { stop: request.stop } : {}),
      });
    }

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed [${response.status}]: ${errorText.slice(0, 500)}`
      );
    }

    const data: any = await response.json();

    if (isAnthropic) {
      return {
        content: data.content?.[0]?.text ?? '',
        usage: {
          promptTokens: data.usage?.input_tokens ?? 0,
          completionTokens: data.usage?.output_tokens ?? 0,
        },
        model: data.model ?? this.config.model,
        finishReason: data.stop_reason ?? 'unknown',
      };
    } else {
      const choice = data.choices?.[0];
      return {
        content: choice?.message?.content ?? '',
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
        },
        model: data.model ?? this.config.model,
        finishReason: choice?.finish_reason ?? 'unknown',
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey && !!this.config.endpoint;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(120_000),
        });

        // Retry on rate limit or server error
        if (response.status === 429 || response.status >= 500) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        return response;
      } catch (err) {
        lastError = err as Error;
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }
}
