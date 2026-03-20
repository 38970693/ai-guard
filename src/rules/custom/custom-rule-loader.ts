import * as fs from 'fs';
import * as path from 'path';
import { Rule } from '../types';

export function loadCustomRules(rulesDir: string): Rule[] {
  const rules: Rule[] = [];

  if (!fs.existsSync(rulesDir)) {
    return rules;
  }

  const files = fs.readdirSync(rulesDir).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    try {
      const fullPath = path.join(rulesDir, file);
      // Clear require cache to pick up changes
      delete require.cache[require.resolve(fullPath)];
      const mod = require(fullPath);

      const rule: Rule = mod.default ?? mod;

      if (rule && rule.id && rule.name && typeof rule.check === 'function') {
        rules.push(rule);
      } else {
        console.warn(
          `[AI Guard] Custom rule ${file} does not export a valid Rule object (needs id, name, check)`
        );
      }
    } catch (err) {
      console.error(`[AI Guard] Failed to load custom rule ${file}:`, err);
    }
  }

  return rules;
}
