export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
}

export interface CompletionResult {
  content: string;
  usage: { promptTokens: number; completionTokens: number };
  model: string;
  finishReason: string;
}

export interface ModelProvider {
  readonly name: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
  isAvailable(): Promise<boolean>;
}
