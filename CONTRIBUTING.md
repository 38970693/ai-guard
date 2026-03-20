# Contributing to AI Guard

We welcome contributions! Here's how to get started.

## How to Contribute

1. **Fork** this repository
2. **Clone** your fork locally
3. **Create a branch** for your changes: `git checkout -b feature/my-feature`
4. **Make your changes** and test them
5. **Commit** with a clear message
6. **Push** to your fork: `git push origin feature/my-feature`
7. **Open a Pull Request** against the `master` branch

## Development Setup

```bash
git clone https://github.com/<your-username>/ai-guard.git
cd ai-guard
npm install
npm run build
```

Press `F5` in VS Code to launch the Extension Development Host for testing.

## What You Can Contribute

- Bug fixes
- New built-in rules for hallucination detection
- Custom rule examples
- UI/UX improvements
- Documentation
- Support for new model providers
- Tests

## Custom Rules

Adding a new built-in rule:

1. Create a new file in `src/rules/built-in/`
2. Implement the `Rule` interface from `src/rules/types.ts`
3. Register it in `src/rules/rule-engine.ts`

## Code Style

- TypeScript with strict mode
- Use async/await over raw promises
- Keep functions focused and small

## Reporting Issues

Open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- VS Code version and OS
