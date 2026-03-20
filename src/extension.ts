import * as vscode from 'vscode';
import { SettingsManager } from './config';
import { ModelRegistry } from './models';
import { PipelineEngine, PipelineEvent, PipelineResult, PipelineStageStatus } from './pipeline';
import { RuleEngine } from './rules';
import { StatusBarController, SidebarProvider, SettingsPanel, log, logError, getOutputChannel } from './ui';
import { registerContentProvider, showDiffView } from './diff';
import { buildFixFindingPrompt, buildReoptimizePrompt } from './models/prompt-templates';

let lastPipelineResult: PipelineResult | null = null;
let lastPipelineRequest: { prompt: string; language: string; context: string; filePath?: string } | null = null;

export function activate(context: vscode.ExtensionContext) {
  log('AI Guard extension activating...');

  // Core services
  const settings = new SettingsManager();
  const modelRegistry = new ModelRegistry(settings);
  const ruleEngine = new RuleEngine(settings);
  const pipelineEmitter = new vscode.EventEmitter<PipelineEvent>();
  const contentProvider = registerContentProvider(context);

  const pipeline = new PipelineEngine(
    modelRegistry,
    ruleEngine,
    () => settings.getPipelineConfig(),
    pipelineEmitter
  );

  // UI
  const statusBar = new StatusBarController(pipelineEmitter);

  const sidebarProvider = new SidebarProvider(
    context.extensionUri,
    pipelineEmitter,
    (prompt) => executePipeline(prompt),
    () => openLastDiff(),
    () => reoptimizeWithFindings(),
    (stage) => openCodeInEditor(stage),
    (finding) => fixSingleFinding(finding)
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'aiGuard.pipelineView',
      sidebarProvider
    ),
    statusBar,
    settings,
    pipelineEmitter
  );

  // === Helper functions ===

  async function executePipeline(prompt: string) {
    const editor = vscode.window.activeTextEditor;
    const language = editor?.document.languageId ?? 'typescript';
    const selection = editor?.selection;
    const context =
      selection && !selection.isEmpty
        ? editor!.document.getText(selection)
        : editor?.document.getText() ?? '';

    const request = { prompt, context, language, filePath: editor?.document.uri.fsPath };
    lastPipelineRequest = request;

    log(`Running pipeline: "${prompt.slice(0, 100)}..." (language: ${language})`);

    try {
      const result = await pipeline.run(request);

      lastPipelineResult = result;

      // Show result summary
      const { totalFindings } = result;
      const summary = result.approved
        ? 'All checks passed!'
        : `Found ${totalFindings.errors} error(s), ${totalFindings.warnings} warning(s)`;

      log(`Pipeline complete: ${summary}`);

      // Send findings to sidebar
      const allFindings = result.stages.flatMap((s) => s.findings);
      sidebarProvider.postMessage({
        type: 'findings',
        findings: allFindings,
        approved: result.approved,
        summary,
      });

      // Show diff if issues found
      if (!result.approved && settings.getPipelineConfig().showDiffOnIssues) {
        if (result.generatedCode && result.correctedCode) {
          await showDiffView(
            contentProvider,
            result.generatedCode,
            result.correctedCode,
            language,
            allFindings
          );
        }
      }

      // If approved, offer to insert the code
      if (result.approved && result.generatedCode) {
        const action = await vscode.window.showInformationMessage(
          'AI Guard: Code passed all checks!',
          'Insert Code',
          'Show Code',
          'Dismiss'
        );
        if (action === 'Insert Code') {
          await insertCode(result.correctedCode ?? result.generatedCode);
        } else if (action === 'Show Code') {
          const doc = await vscode.workspace.openTextDocument({
            content: result.correctedCode ?? result.generatedCode,
            language,
          });
          await vscode.window.showTextDocument(doc);
        }
      } else if (!result.approved && result.generatedCode) {
        const action = await vscode.window.showWarningMessage(
          `AI Guard: ${summary}`,
          'View Diff',
          'Insert Anyway',
          'Dismiss'
        );
        if (action === 'View Diff') {
          await openLastDiff();
        } else if (action === 'Insert Anyway') {
          await insertCode(result.correctedCode ?? result.generatedCode);
        }
      }
    } catch (err) {
      logError('Pipeline execution failed', err);
      vscode.window.showErrorMessage(
        `AI Guard: Pipeline failed — ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async function insertCode(code: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    await editor.edit((editBuilder) => {
      if (editor.selection.isEmpty) {
        editBuilder.insert(editor.selection.active, code);
      } else {
        editBuilder.replace(editor.selection, code);
      }
    });
  }

  async function fixSingleFinding(finding: any) {
    log(`Fix This clicked, finding: ${JSON.stringify(finding).slice(0, 200)}`);

    if (!lastPipelineResult || !lastPipelineRequest) {
      vscode.window.showWarningMessage('No pipeline results to fix. Please run the pipeline first.');
      return;
    }

    const generatedCode = lastPipelineResult.correctedCode ?? lastPipelineResult.generatedCode;
    if (!generatedCode) {
      vscode.window.showWarningMessage('No generated code to fix.');
      return;
    }

    const fixPrompt = buildFixFindingPrompt(
      lastPipelineRequest.prompt,
      generatedCode,
      finding,
      lastPipelineRequest.language
    );

    log(`Fixing finding: ${finding.message?.slice(0, 80) ?? '(no message)'}...`);
    await executePipeline(fixPrompt);
  }

  async function openCodeInEditor(stage: string) {
    if (!lastPipelineResult) {
      vscode.window.showInformationMessage('No pipeline results available');
      return;
    }

    const code = stage === 'generate'
      ? lastPipelineResult.generatedCode
      : lastPipelineResult.correctedCode ?? lastPipelineResult.generatedCode;

    if (!code) {
      vscode.window.showInformationMessage('No code to display');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const language = editor?.document.languageId ?? 'typescript';

    const doc = await vscode.workspace.openTextDocument({
      content: code,
      language,
    });
    await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.One });
  }

  async function openLastDiff() {
    if (!lastPipelineResult?.generatedCode) {
      vscode.window.showInformationMessage('No pipeline results to show');
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const language = editor?.document.languageId ?? 'typescript';
    const allFindings = lastPipelineResult.stages.flatMap((s) => s.findings);

    await showDiffView(
      contentProvider,
      lastPipelineResult.generatedCode,
      lastPipelineResult.correctedCode ?? lastPipelineResult.generatedCode,
      language,
      allFindings
    );
  }

  async function reoptimizeWithFindings() {
    if (!lastPipelineResult || !lastPipelineRequest) {
      vscode.window.showInformationMessage('No pipeline results to re-optimize');
      return;
    }

    const allFindings = lastPipelineResult.stages.flatMap((s) => s.findings);
    if (allFindings.length === 0) {
      vscode.window.showInformationMessage('No findings to optimize against');
      return;
    }

    const generatedCode = lastPipelineResult.correctedCode ?? lastPipelineResult.generatedCode;
    if (!generatedCode) {
      vscode.window.showInformationMessage('No generated code to re-optimize');
      return;
    }

    const reoptimizePrompt = buildReoptimizePrompt(
      lastPipelineRequest.prompt,
      generatedCode,
      allFindings,
      lastPipelineRequest.language
    );

    log('Re-optimizing with findings...');
    await executePipeline(reoptimizePrompt);
  }

  // === Register commands ===

  context.subscriptions.push(
    vscode.commands.registerCommand('aiGuard.generate', async () => {
      const prompt = await vscode.window.showInputBox({
        prompt: 'Describe the code you want to generate',
        placeHolder: 'e.g., Create a REST API endpoint for user authentication',
      });
      if (prompt) {
        await executePipeline(prompt);
      }
    }),

    vscode.commands.registerCommand('aiGuard.review', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Open a file to review');
        return;
      }

      const selection = editor.selection;
      const code = selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(selection);

      if (!code.trim()) {
        vscode.window.showWarningMessage('No code selected to review');
        return;
      }

      await executePipeline(`Review this existing code for issues:\n\n${code}`);
    }),

    vscode.commands.registerCommand('aiGuard.runPipeline', async () => {
      const prompt = await vscode.window.showInputBox({
        prompt: 'Describe what you want AI Guard to do',
        placeHolder: 'e.g., Add error handling to the selected function',
      });
      if (prompt) {
        await executePipeline(prompt);
      }
    }),

    vscode.commands.registerCommand('aiGuard.showDiff', () => openLastDiff()),

    vscode.commands.registerCommand('aiGuard.configureModels', () => {
      SettingsPanel.show(context.extensionUri, settings);
    })
  );

  log('AI Guard extension activated successfully');
}

export function deactivate() {
  log('AI Guard extension deactivated');
}
