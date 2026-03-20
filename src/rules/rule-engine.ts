import * as path from 'path';
import { SettingsManager } from '../config';
import { Rule, RuleContext, RuleResult } from './types';
import { ImportValidationRule } from './built-in/import-validation';
import { SyntaxCheckRule } from './built-in/syntax-check';
import { SecurityPatternsRule } from './built-in/security-patterns';
import { loadCustomRules } from './custom/custom-rule-loader';

export class RuleEngine {
  private builtInRules: Rule[] = [];
  private customRules: Rule[] = [];

  constructor(private settings: SettingsManager) {
    this.initBuiltInRules();
  }

  private initBuiltInRules() {
    const config = this.settings.getRuleConfig();

    this.builtInRules = [];

    if (config.enableImportValidation) {
      this.builtInRules.push(new ImportValidationRule());
    }
    if (config.enableSyntaxCheck) {
      this.builtInRules.push(new SyntaxCheckRule());
    }
    if (config.enableSecurityPatterns) {
      this.builtInRules.push(new SecurityPatternsRule());
    }
  }

  private loadCustom(workspaceRoot: string): void {
    const config = this.settings.getRuleConfig();
    if (config.customRulesPath) {
      const rulesDir = path.isAbsolute(config.customRulesPath)
        ? config.customRulesPath
        : path.join(workspaceRoot, config.customRulesPath);
      this.customRules = loadCustomRules(rulesDir);
    }
  }

  getAllRules(workspaceRoot: string): Rule[] {
    this.initBuiltInRules(); // Refresh config
    this.loadCustom(workspaceRoot);
    return [...this.builtInRules, ...this.customRules];
  }

  async runAll(context: RuleContext): Promise<RuleResult[]> {
    const rules = this.getAllRules(context.workspaceRoot);

    const results = await Promise.allSettled(
      rules.map((rule) => rule.check(context))
    );

    return results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      // Rule threw an error
      return {
        ruleId: rules[i].id,
        passed: false,
        violations: [
          {
            severity: 'warning' as const,
            message: `Rule '${rules[i].name}' failed to execute: ${result.reason}`,
          },
        ],
      };
    });
  }
}
