import { Rule, RuleContext, RuleResult } from '../types';

interface SecurityPattern {
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}

const SECURITY_PATTERNS: SecurityPattern[] = [
  {
    pattern: /\beval\s*\(/,
    message: 'Use of eval() detected — potential code injection risk',
    severity: 'error',
    suggestion: 'Avoid eval(). Use JSON.parse() for data, or Function() with strict input validation',
  },
  {
    pattern: /\bnew\s+Function\s*\(/,
    message: 'Dynamic Function() constructor — similar risks to eval()',
    severity: 'warning',
    suggestion: 'Avoid dynamic code execution if possible',
  },
  {
    pattern: /innerHTML\s*=/,
    message: 'Direct innerHTML assignment — potential XSS vulnerability',
    severity: 'error',
    suggestion: 'Use textContent for plain text, or sanitize HTML with DOMPurify',
  },
  {
    pattern: /document\.write\s*\(/,
    message: 'document.write() usage — can cause XSS and overwrites entire page',
    severity: 'error',
    suggestion: 'Use DOM manipulation methods instead',
  },
  {
    pattern: /\b(exec|execSync|spawn|spawnSync)\s*\([^)]*(\$\{|`|\+\s*\w)/,
    message: 'Potential command injection — user input in shell command',
    severity: 'error',
    suggestion: 'Use parameterized commands or escape shell arguments',
  },
  {
    pattern: /['"](?:sk-|api[_-]?key|secret[_-]?key|password|token)\s*[:=]\s*['"][A-Za-z0-9+/=_-]{16,}['"]/i,
    message: 'Possible hardcoded secret or API key',
    severity: 'error',
    suggestion: 'Use environment variables or a secrets manager',
  },
  {
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*\+\s*(?:req\.|params\.|query\.|body\.|\$\{)/i,
    message: 'Potential SQL injection — string concatenation in SQL query',
    severity: 'error',
    suggestion: 'Use parameterized queries / prepared statements',
  },
  {
    pattern: /crypto\.createCipher\b/,
    message: 'crypto.createCipher is deprecated and insecure (no IV)',
    severity: 'warning',
    suggestion: 'Use crypto.createCipheriv with a random IV',
  },
  {
    pattern: /Math\.random\s*\(\s*\)/,
    message: 'Math.random() is not cryptographically secure',
    severity: 'info',
    suggestion: 'For security-sensitive use, use crypto.randomBytes() or crypto.getRandomValues()',
  },
  {
    pattern: /disable.*ssl|verify\s*=\s*false|rejectUnauthorized\s*:\s*false/i,
    message: 'SSL/TLS verification disabled',
    severity: 'error',
    suggestion: 'Keep SSL verification enabled in production',
  },
  {
    pattern: /cors\s*\(\s*\)|\bAccess-Control-Allow-Origin['"]\s*:\s*['"]?\*/,
    message: 'Wildcard CORS configuration — allows all origins',
    severity: 'warning',
    suggestion: 'Restrict CORS to specific trusted origins',
  },
];

export class SecurityPatternsRule implements Rule {
  readonly id = 'security-patterns';
  readonly name = 'Security Patterns';
  readonly description = 'Detects potential security issues in generated code';

  async check(context: RuleContext): Promise<RuleResult> {
    const violations: RuleResult['violations'] = [];
    const lines = context.generatedCode.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*')) {
        continue;
      }

      for (const sp of SECURITY_PATTERNS) {
        if (sp.pattern.test(line)) {
          violations.push({
            severity: sp.severity,
            message: sp.message,
            line: i + 1,
            suggestion: sp.suggestion,
          });
        }
      }
    }

    return {
      ruleId: this.id,
      passed: violations.length === 0,
      violations,
    };
  }
}
