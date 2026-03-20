// Example custom rule for AI Guard
// Place .js files in this directory to add custom rules
// Each file must export an object with: id, name, description, check(context)

module.exports = {
  id: 'no-console-log',
  name: 'No Console Log',
  description: 'Warns about console.log statements in generated code',

  async check(context) {
    const violations = [];
    const lines = context.generatedCode.split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/console\.log\s*\(/)) {
        violations.push({
          severity: 'warning',
          message: 'console.log() found — consider using a proper logger',
          line: i + 1,
          suggestion: 'Replace with a structured logging library',
        });
      }
    }

    return {
      ruleId: this.id,
      passed: violations.length === 0,
      violations,
    };
  },
};
