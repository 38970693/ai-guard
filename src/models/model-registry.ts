import { SettingsManager } from '../config';
import { ReviewAgentConfig } from '../config/types';
import { ModelProvider } from './types';
import { OpenAICompatibleProvider } from './openai-compatible';

export type ModelRole = 'production' | 'review';

export interface NamedProvider {
  name: string;
  provider: ModelProvider;
}

export class ModelRegistry {
  private productionProvider!: ModelProvider;
  private reviewProviders: NamedProvider[] = [];

  constructor(private settings: SettingsManager) {
    this.refresh();
    settings.onDidChange(() => this.refresh());
  }

  private refresh() {
    this.productionProvider = new OpenAICompatibleProvider(
      this.settings.getModelConfig('productionModel')
    );

    const agents = this.settings.getReviewAgents();
    this.reviewProviders = agents
      .filter((a) => a.enabled)
      .map((a) => ({
        name: a.name,
        provider: new OpenAICompatibleProvider(a),
      }));
  }

  getProvider(role: ModelRole): ModelProvider {
    if (role === 'production') {
      return this.productionProvider;
    }
    // Return first review provider for backward compat
    if (this.reviewProviders.length === 0) {
      throw new Error('No review agent configured or enabled');
    }
    return this.reviewProviders[0].provider;
  }

  getReviewProviders(): NamedProvider[] {
    return this.reviewProviders;
  }

  async checkAvailability(): Promise<Record<ModelRole, boolean>> {
    const [prod, ...reviews] = await Promise.all([
      this.productionProvider.isAvailable(),
      ...this.reviewProviders.map((r) => r.provider.isAvailable()),
    ]);
    return { production: prod, review: reviews.some(Boolean) };
  }
}
