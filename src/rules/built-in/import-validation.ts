import * as fs from 'fs';
import * as path from 'path';
import { Rule, RuleContext, RuleResult } from '../types';

export class ImportValidationRule implements Rule {
  readonly id = 'import-validation';
  readonly name = 'Import Validation';
  readonly description = 'Checks if imported modules actually exist';

  async check(context: RuleContext): Promise<RuleResult> {
    const violations: RuleResult['violations'] = [];
    const imports = this.extractImports(context.generatedCode, context.language);

    for (const imp of imports) {
      if (imp.isRelative) {
        // Check relative imports against workspace
        if (context.workspaceRoot) {
          const basePath = context.filePath
            ? path.dirname(context.filePath)
            : context.workspaceRoot;
          const resolved = this.resolveRelativePath(basePath, imp.module);
          if (!resolved) {
            violations.push({
              severity: 'warning',
              message: `Relative import '${imp.module}' may not exist at resolved path`,
              line: imp.line,
              suggestion: `Verify the file exists at the expected location`,
            });
          }
        }
      } else {
        // Check package imports against node_modules
        if (context.workspaceRoot && context.language.match(/^(typescript|javascript|tsx|jsx|ts|js)$/i)) {
          const pkgName = this.getPackageName(imp.module);
          const nodeModulesPath = path.join(context.workspaceRoot, 'node_modules', pkgName);
          try {
            fs.accessSync(nodeModulesPath);
          } catch {
            // Also check if it's a Node.js built-in
            if (!this.isNodeBuiltin(pkgName)) {
              violations.push({
                severity: 'error',
                message: `Package '${pkgName}' is not installed (not found in node_modules)`,
                line: imp.line,
                suggestion: `Run: npm install ${pkgName}`,
              });
            }
          }
        }
      }
    }

    return {
      ruleId: this.id,
      passed: violations.length === 0,
      violations,
    };
  }

  private extractImports(
    code: string,
    language: string
  ): { module: string; line: number; isRelative: boolean }[] {
    const results: { module: string; line: number; isRelative: boolean }[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip comments and empty lines
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*') || line.startsWith('#')) {
        continue;
      }

      // ES6 imports: import ... from 'module' (must start with import keyword)
      const esMatch = line.match(/^import\s+.*\s+from\s+['"]([^'"]+)['"]/);
      if (esMatch) {
        results.push({
          module: esMatch[1],
          line: i + 1,
          isRelative: esMatch[1].startsWith('.'),
        });
        continue;
      }

      // Side-effect imports: import 'module' (must start with import keyword)
      const sideEffectMatch = line.match(/^import\s+['"]([^'"]+)['"]/);
      if (sideEffectMatch) {
        results.push({
          module: sideEffectMatch[1],
          line: i + 1,
          isRelative: sideEffectMatch[1].startsWith('.'),
        });
        continue;
      }

      // require(): must be a statement, not inside a string
      // Match patterns like: const x = require('module'), require('module'), module.exports = require('module')
      if (line.match(/^(?:const|let|var|module\.exports)\s.*require\s*\(/) || line.match(/^require\s*\(/)) {
        const reqMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (reqMatch) {
          results.push({
            module: reqMatch[1],
            line: i + 1,
            isRelative: reqMatch[1].startsWith('.'),
          });
          continue;
        }
      }

      // Python imports: import module / from module import ...
      if (language.match(/^python|py$/i)) {
        const pyMatch =
          line.match(/^import\s+([\w.]+)/) ??
          line.match(/^from\s+([\w.]+)\s+import/);
        if (pyMatch) {
          results.push({
            module: pyMatch[1],
            line: i + 1,
            isRelative: pyMatch[1].startsWith('.'),
          });
        }
      }
    }

    return results;
  }

  private getPackageName(module: string): string {
    // Handle scoped packages: @scope/package/subpath -> @scope/package
    if (module.startsWith('@')) {
      const parts = module.split('/');
      return parts.slice(0, 2).join('/');
    }
    // Regular packages: package/subpath -> package
    return module.split('/')[0];
  }

  private resolveRelativePath(basePath: string, modulePath: string): string | null {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', ''];
    const base = path.resolve(basePath, modulePath);

    for (const ext of extensions) {
      if (fs.existsSync(base + ext)) return base + ext;
    }
    // Check for index files
    for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
      if (fs.existsSync(path.join(base, `index${ext}`))) {
        return path.join(base, `index${ext}`);
      }
    }
    return null;
  }

  private isNodeBuiltin(name: string): boolean {
    const builtins = new Set([
      'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
      'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https',
      'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode',
      'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'sys',
      'timers', 'tls', 'tty', 'url', 'util', 'v8', 'vm', 'worker_threads',
      'zlib', 'fs/promises', 'stream/promises', 'node:fs', 'node:path',
      'node:http', 'node:https', 'node:crypto', 'node:os', 'node:url',
      'node:util', 'node:stream', 'node:buffer', 'node:events',
      'node:child_process', 'node:worker_threads', 'node:test',
    ]);
    return builtins.has(name) || name.startsWith('node:');
  }
}
