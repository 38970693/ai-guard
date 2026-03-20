import { Rule, RuleContext, RuleResult } from '../types';

export class SyntaxCheckRule implements Rule {
  readonly id = 'syntax-check';
  readonly name = 'Syntax Check';
  readonly description = 'Verifies generated code has no obvious syntax errors';

  async check(context: RuleContext): Promise<RuleResult> {
    const violations: RuleResult['violations'] = [];

    if (context.language.match(/^(typescript|javascript|tsx|jsx|ts|js)$/i)) {
      this.checkJsSyntax(context.generatedCode, violations);
    } else if (context.language.match(/^(python|py)$/i)) {
      this.checkPythonSyntax(context.generatedCode, violations);
    }

    // Generic checks for all languages
    this.checkBracketBalance(context.generatedCode, violations);

    return {
      ruleId: this.id,
      passed: violations.length === 0,
      violations,
    };
  }

  private checkJsSyntax(
    code: string,
    violations: RuleResult['violations']
  ): void {
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect common JS/TS syntax issues
      // Double semicolons
      if (line.match(/;;(?!\s*$)/)) {
        violations.push({
          severity: 'warning',
          message: 'Double semicolon detected',
          line: i + 1,
          suggestion: 'Remove the extra semicolon',
        });
      }

      // Unclosed template literals (simple heuristic)
      const backtickCount = (line.match(/`/g) || []).length;
      if (backtickCount % 2 !== 0 && !this.isMultilineTemplate(lines, i)) {
        // Could be a multi-line template, skip if next lines continue it
      }

      // Assignment in condition (common mistake)
      const condMatch = line.match(/\bif\s*\(\s*(\w+)\s*=\s*(?!=)/);
      if (condMatch) {
        violations.push({
          severity: 'warning',
          message: `Possible accidental assignment in condition (did you mean '===' instead of '='?)`,
          line: i + 1,
          suggestion: `Use '===' for comparison`,
        });
      }
    }
  }

  private checkPythonSyntax(
    code: string,
    violations: RuleResult['violations']
  ): void {
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Mixed tabs and spaces
      if (line.match(/^\t+ /) || line.match(/^ +\t/)) {
        violations.push({
          severity: 'error',
          message: 'Mixed tabs and spaces in indentation',
          line: i + 1,
          suggestion: 'Use consistent indentation (spaces recommended)',
        });
      }

      // Missing colon after control structures
      if (
        line.match(/^\s*(if|elif|else|for|while|def|class|with|try|except|finally)\b/) &&
        !line.trim().endsWith(':') &&
        !line.trim().endsWith(':\\') &&
        !line.includes('#') &&
        line.trim().length > 0
      ) {
        // Only flag if this looks like a complete statement (not multi-line)
        if (!lines[i + 1]?.trim().startsWith('.') && !line.trim().endsWith('(') && !line.trim().endsWith('\\')) {
          violations.push({
            severity: 'warning',
            message: `Control structure may be missing trailing colon ':'`,
            line: i + 1,
            suggestion: `Add ':' at the end of the statement`,
          });
        }
      }
    }
  }

  private checkBracketBalance(
    code: string,
    violations: RuleResult['violations']
  ): void {
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const stack: { char: string; line: number }[] = [];
    const lines = code.split('\n');
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        const prev = j > 0 ? line[j - 1] : '';

        // Track string state (simplified)
        if ((ch === '"' || ch === "'" || ch === '`') && prev !== '\\') {
          if (inString && ch === stringChar) {
            inString = false;
          } else if (!inString) {
            inString = true;
            stringChar = ch;
          }
          continue;
        }

        if (inString) continue;

        // Skip comments
        if (ch === '/' && line[j + 1] === '/') break;

        if (pairs[ch]) {
          stack.push({ char: ch, line: i + 1 });
        } else if (ch === ')' || ch === ']' || ch === '}') {
          const last = stack.pop();
          if (!last || pairs[last.char] !== ch) {
            violations.push({
              severity: 'error',
              message: `Unmatched '${ch}'`,
              line: i + 1,
              suggestion: `Check bracket matching`,
            });
          }
        }
      }
    }

    for (const unclosed of stack) {
      violations.push({
        severity: 'error',
        message: `Unclosed '${unclosed.char}' opened at line ${unclosed.line}`,
        line: unclosed.line,
        suggestion: 'Add the matching closing bracket',
      });
    }
  }

  private isMultilineTemplate(lines: string[], lineIndex: number): boolean {
    // Check if this is part of a multi-line template literal
    for (let i = lineIndex + 1; i < Math.min(lineIndex + 10, lines.length); i++) {
      if (lines[i].includes('`')) return true;
    }
    return false;
  }
}
