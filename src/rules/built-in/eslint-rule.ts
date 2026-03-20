import * as path from 'path';
import { Rule, RuleContext, RuleResult } from '../types';

// ESLint default rules when workspace has no config
const DEFAULT_RULES: Record<string, string | [string, ...unknown[]]> = {
  // Syntax & correctness
  'no-undef': 'off', // generated code may reference external vars
  'no-unused-vars': 'warn',
  'no-dupe-keys': 'error',
  'no-dupe-args': 'error',
  'no-duplicate-case': 'error',
  'no-unreachable': 'error',
  'no-constant-condition': 'warn',
  'no-cond-assign': ['error', 'except-parens'],
  'no-extra-semi': 'warn',
  'valid-typeof': 'error',
  'use-isnan': 'error',
  'no-sparse-arrays': 'warn',
  'no-unexpected-multiline': 'error',

  // Security
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',

  // Best practices
  'eqeqeq': ['warn', 'smart'],
  'no-var': 'warn',
  'no-throw-literal': 'warn',
  'no-self-assign': 'error',
  'no-self-compare': 'error',
  'no-redeclare': 'error',
};

// Map file extensions for ESLint virtual file path
const LANG_EXT: Record<string, string> = {
  javascript: '.js',
  js: '.js',
  typescript: '.ts',
  ts: '.ts',
  jsx: '.jsx',
  tsx: '.tsx',
};

export class EslintRule implements Rule {
  readonly id = 'eslint';
  readonly name = 'ESLint';
  readonly description = 'Static analysis via ESLint';

  async check(context: RuleContext): Promise<RuleResult> {
    const lang = context.language.toLowerCase();
    // Only run for JS/TS
    if (!LANG_EXT[lang]) {
      return { ruleId: this.id, passed: true, violations: [] };
    }

    try {
      // Dynamic import so the extension still loads even if eslint is missing
      const { ESLint } = await import('eslint');

      const ext = LANG_EXT[lang];
      const virtualPath = path.join(
        context.workspaceRoot || '/tmp',
        `__ai_guard_generated${ext}`
      );

      // Try workspace config first, fall back to defaults
      let eslint: InstanceType<typeof ESLint>;
      try {
        eslint = new ESLint({
          cwd: context.workspaceRoot || undefined,
        });
        // Test if config resolves for this file
        await eslint.calculateConfigForFile(virtualPath);
      } catch {
        // No workspace config — use built-in defaults
        eslint = new ESLint({
          overrideConfigFile: true,
          overrideConfig: {
            rules: DEFAULT_RULES as any,
            languageOptions: {
              ecmaVersion: 'latest',
              sourceType: 'module',
              ...(ext === '.tsx' || ext === '.jsx'
                ? { parserOptions: { ecmaFeatures: { jsx: true } } }
                : {}),
            },
          },
          cwd: context.workspaceRoot || undefined,
        });
      }

      const results = await eslint.lintText(context.generatedCode, {
        filePath: virtualPath,
      });

      const violations: RuleResult['violations'] = [];
      for (const result of results) {
        for (const msg of result.messages) {
          violations.push({
            severity: msg.severity === 2 ? 'error' : 'warning',
            message: `[${msg.ruleId ?? 'parse'}] ${msg.message}`,
            line: msg.line,
            suggestion: msg.fix
              ? `Auto-fixable: replace text at col ${msg.fix.range[0]}-${msg.fix.range[1]}`
              : msg.suggestions?.[0]?.desc,
          });
        }
      }

      return {
        ruleId: this.id,
        passed: violations.every((v) => v.severity !== 'error'),
        violations,
      };
    } catch (err) {
      // ESLint not available — skip gracefully
      return {
        ruleId: this.id,
        passed: true,
        violations: [
          {
            severity: 'info' as const,
            message: `ESLint unavailable: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
}
