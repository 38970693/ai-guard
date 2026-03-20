import { SettingsManager } from '../config';
import { ModelProvider } from './types';
import { OpenAICompatibleProvider } from './openai-compatible';

export type ModelRole = 'production' | 'review';

export class ModelRegistry {
  private providers = new Map<ModelRole, ModelProvider>();

  constructor(private settings: SettingsManager) {
    this.refresh();
    settings.onDidChange(() => this.refresh());
  }

  private refresh() {
    this.providers.set(
      'production',
      new OpenAICompatibleProvider(this.settings.getModelConfig('productionModel'))
    );
    this.providers.set(
      'review',
      new OpenAICompatibleProvider(this.settings.getModelConfig('reviewModel'))
    );
  }

  getProvider(role: ModelRole): ModelProvider {
    const provider = this.providers.get(role);
    if (!provider) {
      throw new Error(`No provider configured for role: ${role}`);
    }
    return provider;
  }

  async checkAvailability(): Promise<Record<ModelRole, boolean>> {
    const [prod, review] = await Promise.all([
      this.getProvider('production').isAvailable(),
      this.getProvider('review').isAvailable(),
    ]);
    return { production: prod, review };
  }
}
