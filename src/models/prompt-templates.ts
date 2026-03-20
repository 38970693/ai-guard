export const GENERATION_SYSTEM_PROMPT = `You are an expert code generator. Follow these rules strictly:

1. Only use APIs, functions, and methods that you are CERTAIN exist in the specified libraries.
2. Only import packages/modules that are real and published.
3. If unsure whether an API exists, use a well-known alternative or explicitly note the uncertainty.
4. Include proper error handling where appropriate.
5. Write clean, production-ready code.
6. DO NOT invent or hallucinate:
   - Package names that don't exist
   - API methods or properties that don't exist
   - Configuration options that don't exist
   - CLI flags or arguments that don't exist

Respond with ONLY the code, wrapped in a markdown code block with the language specified.`;

export const REVIEW_SYSTEM_PROMPT = `You are an expert code reviewer focused on detecting AI hallucinations and errors.
Your job is to carefully review AI-generated code and identify issues.

Check for the following categories of problems:

## Hallucination Detection
- **Fake packages**: Imported packages/modules that don't exist on npm/PyPI/etc.
- **Fake APIs**: Methods, functions, or properties that don't exist in the referenced libraries.
- **Wrong signatures**: Correct API names but wrong parameter types, counts, or return types.
- **Deprecated APIs**: Using APIs that have been removed in current versions.
- **Invented config options**: Configuration keys or CLI flags that don't exist.

## Correctness Issues
- Logic errors or off-by-one mistakes
- Missing error handling for operations that can fail
- Race conditions or async/await misuse
- Type mismatches

## Security Issues
- Hardcoded secrets or API keys
- SQL injection vulnerabilities
- Command injection
- XSS vulnerabilities
- Insecure use of eval() or similar

Respond in the following JSON format ONLY (no other text):
{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "findings": [
    {
      "severity": "error" | "warning" | "info",
      "category": "hallucination" | "correctness" | "security" | "style",
      "message": "Description of the issue",
      "line": <line number or null>,
      "suggestion": "How to fix it (optional)"
    }
  ],
  "summary": "Brief overall assessment",
  "correctedCode": "Full corrected code if changes needed, or null"
}`;

export function buildGeneratePrompt(
  userPrompt: string,
  context: string,
  language: string
): string {
  let prompt = userPrompt;
  if (context) {
    prompt += `\n\nExisting code context:\n\`\`\`${language}\n${context}\n\`\`\``;
  }
  if (language) {
    prompt += `\n\nLanguage: ${language}`;
  }
  return prompt;
}

export function buildReoptimizePrompt(
  originalPrompt: string,
  generatedCode: string,
  findings: Array<{ severity: string; category: string; message: string; line?: number; suggestion?: string }>,
  language: string
): string {
  const findingsList = findings
    .map((f, i) => {
      let entry = `${i + 1}. [${f.severity.toUpperCase()}] ${f.message}`;
      if (f.line) entry += ` (Line ${f.line})`;
      if (f.suggestion) entry += `\n   Suggestion: ${f.suggestion}`;
      return entry;
    })
    .join('\n');

  return `## Original Request
${originalPrompt}

## Previous Generated Code
\`\`\`${language}
${generatedCode}
\`\`\`

## Review Findings (issues to fix)
${findingsList}

## Instructions
The code above was reviewed and the issues listed above were found. Please generate an improved version of the code that fixes ALL the listed issues while maintaining the original functionality.

Language: ${language}

Respond with ONLY the corrected code, wrapped in a markdown code block with the language specified.`;
}

export function buildFixFindingPrompt(
  originalPrompt: string,
  generatedCode: string,
  finding: { severity: string; category: string; message: string; line?: number; suggestion?: string },
  language: string
): string {
  let issueDesc = `[${finding.severity.toUpperCase()}] ${finding.message}`;
  if (finding.line) issueDesc += ` (Line ${finding.line})`;
  if (finding.suggestion) issueDesc += `\nSuggestion: ${finding.suggestion}`;

  return `## Original Request
${originalPrompt}

## Current Code
\`\`\`${language}
${generatedCode}
\`\`\`

## Specific Issue to Fix
${issueDesc}

## Instructions
Fix ONLY the specific issue described above in the code. Keep all other functionality unchanged.

Language: ${language}

Respond with ONLY the corrected code, wrapped in a markdown code block with the language specified.`;
}

export function buildReviewPrompt(
  generatedCode: string,
  originalPrompt: string,
  language: string
): string {
  return `## Original Request
${originalPrompt}

## Generated Code to Review
\`\`\`${language}
${generatedCode}
\`\`\`

## Language
${language}

Review the above code for hallucinations, correctness issues, and security problems. Respond ONLY with the JSON format specified in your instructions.`;
}
