// @ts-ignore — vscode webview API
const vscode = acquireVsCodeApi();

// --- State ---
interface StageState {
  status: string;
  detail: string;
  duration?: number;
  code?: string; // generated/reviewed code
}

const stages: Record<string, StageState> = {
  generate: { status: 'Idle', detail: '' },
  review: { status: 'Idle', detail: '' },
  ruleCheck: { status: 'Idle', detail: '' },
};

const stageLabels: Record<string, string> = {
  review: 'Review',
  ruleCheck: 'Rule Check',
};

let currentStageOrder: string[] = ['ruleCheck', 'review'];

// --- DOM ---
function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function initUI() {
  // Run button
  $('runBtn').addEventListener('click', () => {
    const input = document.getElementById('promptInput') as HTMLTextAreaElement;
    const prompt = input.value.trim();
    if (!prompt) return;

    vscode.postMessage({ type: 'runPipeline', prompt });
    resetStages();
  });

  // Settings button
  $('settingsBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'openSettings' });
  });

  // Diff button
  $('diffBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'openDiff' });
  });

  // Re-optimize button
  $('reoptimizeBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'reoptimize' });
  });

  // Keyboard shortcut: Ctrl+Enter to run
  $('promptInput').addEventListener('keydown', (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key === 'Enter' && (ke.ctrlKey || ke.metaKey)) {
      $('runBtn').click();
    }
  });

  // Initial render of post-generate stages
  renderPostGenerateStages();
}

function renderPostGenerateStages() {
  const container = $('post-generate-stages');
  container.innerHTML = '';

  // Update subtitle
  const subtitleEl = $('pipeline-subtitle');
  if (subtitleEl) {
    const names = currentStageOrder.map((s) => stageLabels[s] || s);
    subtitleEl.textContent = 'Generate + ' + names.join(' + ');
  }

  currentStageOrder.forEach((stageName, index) => {
    // Arrow between stages
    if (index > 0) {
      const arrow = document.createElement('div');
      arrow.className = 'stage-arrow';
      arrow.innerHTML = '\u2193';
      container.appendChild(arrow);
    }

    const card = document.createElement('div');
    card.className = 'stage-card';
    card.id = `stage-${stageName}`;

    const header = document.createElement('div');
    header.className = 'stage-header';

    const icon = document.createElement('span');
    icon.className = 'stage-icon';
    icon.id = `icon-${stageName}`;
    icon.textContent = String(index + 2);

    const name = document.createElement('span');
    name.className = 'stage-name';
    name.textContent = stageLabels[stageName] || stageName;

    const status = document.createElement('span');
    status.className = 'stage-status';
    status.id = `status-${stageName}`;
    status.textContent = stages[stageName]?.status || 'Idle';

    // Reorder buttons
    const reorderBtns = document.createElement('span');
    reorderBtns.className = 'stage-reorder-btns';

    if (index > 0) {
      const upBtn = document.createElement('button');
      upBtn.className = 'stage-reorder-btn';
      upBtn.innerHTML = '\u25B2';
      upBtn.title = 'Move up';
      upBtn.addEventListener('click', () => moveStage(index, index - 1));
      reorderBtns.appendChild(upBtn);
    }

    if (index < currentStageOrder.length - 1) {
      const downBtn = document.createElement('button');
      downBtn.className = 'stage-reorder-btn';
      downBtn.innerHTML = '\u25BC';
      downBtn.title = 'Move down';
      downBtn.addEventListener('click', () => moveStage(index, index + 1));
      reorderBtns.appendChild(downBtn);
    }

    header.appendChild(icon);
    header.appendChild(name);
    header.appendChild(reorderBtns);
    header.appendChild(status);

    const detail = document.createElement('div');
    detail.className = 'stage-detail';
    detail.id = `detail-${stageName}`;

    card.appendChild(header);
    card.appendChild(detail);
    container.appendChild(card);

    // Re-apply current stage state
    updateStageUI(stageName);
  });
}

function moveStage(fromIndex: number, toIndex: number) {
  const item = currentStageOrder.splice(fromIndex, 1)[0];
  currentStageOrder.splice(toIndex, 0, item);
  vscode.postMessage({ type: 'updateStageOrder', order: [...currentStageOrder] });
  renderPostGenerateStages();
}

function resetStages() {
  for (const stage of ['generate', 'review', 'ruleCheck']) {
    stages[stage] = { status: 'Pending', detail: '' };
    updateStageUI(stage);
  }
  $('findings-section').style.display = 'none';
  $('result-section').style.display = 'none';
  $('reoptimizeBtn').style.display = 'none';
}

function updateStageUI(stage: string) {
  const state = stages[stage];
  const statusEl = document.getElementById(`status-${stage}`);
  const iconEl = document.getElementById(`icon-${stage}`);
  const detailEl = document.getElementById(`detail-${stage}`);
  const card = document.getElementById(`stage-${stage}`);

  // Elements may not exist yet if stageOrder hasn't been rendered
  if (!statusEl || !iconEl || !detailEl || !card) return;

  statusEl.textContent = state.status;
  if (state.duration) {
    statusEl.textContent += ` (${(state.duration / 1000).toFixed(1)}s)`;
  }

  // Clear previous content
  detailEl.innerHTML = '';

  // For generate stage with code, show formatted code block
  if (stage === 'generate' && state.code) {
    const lineCount = state.code.split('\n').length;
    const summary = document.createElement('div');
    summary.className = 'stage-detail-summary';
    summary.textContent = `Generated ${lineCount} lines of code`;
    detailEl.appendChild(summary);

    // Code preview (collapsible)
    const codeWrapper = document.createElement('div');
    codeWrapper.className = 'code-preview collapsed';

    const codeBlock = document.createElement('pre');
    const codeEl = document.createElement('code');
    codeEl.textContent = state.code;
    codeBlock.appendChild(codeEl);
    codeWrapper.appendChild(codeBlock);
    detailEl.appendChild(codeWrapper);

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'stage-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'stage-action-btn';
    toggleBtn.textContent = '\u25B6 Show Code';
    toggleBtn.addEventListener('click', () => {
      const isCollapsed = codeWrapper.classList.contains('collapsed');
      codeWrapper.classList.toggle('collapsed');
      toggleBtn.textContent = isCollapsed ? '\u25BC Hide Code' : '\u25B6 Show Code';
    });
    actions.appendChild(toggleBtn);

    const openBtn = document.createElement('button');
    openBtn.className = 'stage-action-btn action-primary';
    openBtn.textContent = '\u{1F4C4} Open in Editor';
    openBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'openCodeInEditor', stage: 'generate' });
    });
    actions.appendChild(openBtn);

    detailEl.appendChild(actions);
  } else if (stage === 'review' && state.detail && state.status !== 'running') {
    // Review stage: show formatted review text with markdown rendering
    const reviewText = document.createElement('div');
    reviewText.className = 'review-detail';
    reviewText.innerHTML = renderMarkdown(state.detail);
    detailEl.appendChild(reviewText);
  } else if (state.detail) {
    // Other stages: also render with basic formatting
    const detailText = document.createElement('div');
    detailText.className = 'stage-detail-text';
    detailText.innerHTML = renderMarkdown(state.detail);
    detailEl.appendChild(detailText);
  }

  // Reset classes
  card.className = 'stage-card';

  switch (state.status) {
    case 'running':
      iconEl.innerHTML = '<span class="spinner"></span>';
      card.classList.add('stage-running');
      statusEl.textContent = 'Running...';
      break;
    case 'passed':
      iconEl.textContent = '\u2713';
      card.classList.add('stage-passed');
      break;
    case 'warning':
      iconEl.textContent = '\u26A0';
      card.classList.add('stage-warning');
      break;
    case 'failed':
      iconEl.textContent = '\u2717';
      card.classList.add('stage-failed');
      break;
    case 'skipped':
      iconEl.textContent = '\u2014';
      card.classList.add('stage-skipped');
      break;
    default: {
      let num = '1';
      if (stage !== 'generate') {
        const idx = currentStageOrder.indexOf(stage);
        num = idx >= 0 ? String(idx + 2) : '?';
      }
      iconEl.textContent = num;
      break;
    }
  }
}

function showFindings(findings: any[]) {
  if (findings.length === 0) {
    $('findings-section').style.display = 'none';
    return;
  }

  $('findings-section').style.display = 'block';
  const list = $('findings-list');
  list.innerHTML = '';

  const errorCount = findings.filter((f: any) => f.severity === 'error').length;
  const warningCount = findings.filter((f: any) => f.severity === 'warning').length;

  for (const f of findings) {
    const item = document.createElement('div');
    item.className = `finding-item finding-${f.severity}`;

    const icon =
      f.severity === 'error' ? '\u274C' : f.severity === 'warning' ? '\u26A0\uFE0F' : '\u2139\uFE0F';

    const hasFixable = f.severity === 'error' || f.severity === 'warning';

    item.innerHTML = `
      <div class="finding-header">
        <span class="finding-icon">${icon}</span>
        <span class="finding-severity">${f.severity.toUpperCase()}</span>
        ${f.category ? `<span class="finding-category">[${f.category}]</span>` : ''}
        ${f.line ? `<span class="finding-line">Line ${f.line}</span>` : ''}
      </div>
      <div class="finding-message">${escapeHtml(f.message)}</div>
      ${f.suggestion ? `<div class="finding-suggestion">Suggestion: ${escapeHtml(f.suggestion)}</div>` : ''}
      ${f.rule ? `<div class="finding-rule">Rule: ${f.rule}</div>` : ''}
      ${hasFixable ? `<div class="finding-actions-row"></div>` : ''}
    `;

    // Add per-finding fix button for errors/warnings
    if (hasFixable) {
      const actionsRow = item.querySelector('.finding-actions-row')!;

      const fixBtn = document.createElement('button');
      fixBtn.className = 'finding-fix-btn';
      fixBtn.innerHTML = '\u{1F527} Fix This';
      fixBtn.addEventListener('click', () => {
        vscode.postMessage({
          type: 'fixFinding',
          finding: f,
        });
      });
      actionsRow.appendChild(fixBtn);
    }

    list.appendChild(item);
  }

  // Show action buttons
  $('diffBtn').style.display = 'block';

  // Show fix-all button if there are errors or warnings
  if (errorCount > 0 || warningCount > 0) {
    $('reoptimizeBtn').style.display = 'block';
    $('reoptimizeBtn').innerHTML = `\u{1F527} Fix All Issues (${errorCount + warningCount})`;
  } else {
    $('reoptimizeBtn').style.display = 'none';
  }
}

function showResult(approved: boolean, summary: string) {
  $('result-section').style.display = 'block';
  const badge = $('result-badge');
  badge.className = `result-badge ${approved ? 'result-approved' : 'result-rejected'}`;
  badge.textContent = approved ? `\u2705 ${summary}` : `\u274C ${summary}`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Simple markdown-to-HTML renderer for review/detail output */
function renderMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  const lines = escaped.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        result.push('</code></pre>');
        inCodeBlock = false;
      } else {
        if (inList) { result.push('</ul>'); inList = false; }
        result.push('<pre class="md-code-block"><code>');
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      if (inList) { result.push('</ul>'); inList = false; }
      result.push('<br>');
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headerMatch) {
      if (inList) { result.push('</ul>'); inList = false; }
      const level = headerMatch[1].length;
      result.push(`<strong class="md-h${level}">${headerMatch[2]}</strong>`);
      continue;
    }

    // List items (- or * or numbered)
    const listMatch = line.match(/^\s*[-*]\s+(.+)/) || line.match(/^\s*\d+\.\s+(.+)/);
    if (listMatch) {
      if (!inList) { result.push('<ul class="md-list">'); inList = true; }
      result.push(`<li>${inlineFormat(listMatch[1])}</li>`);
      continue;
    }

    // Regular line
    if (inList) { result.push('</ul>'); inList = false; }
    result.push(`<p class="md-line">${inlineFormat(line)}</p>`);
  }

  if (inCodeBlock) result.push('</code></pre>');
  if (inList) result.push('</ul>');

  return result.join('\n');
}

/** Inline formatting: bold, italic, inline code */
function inlineFormat(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// --- Message Handling ---
window.addEventListener('message', (event) => {
  const msg = event.data;

  switch (msg.type) {
    case 'pipelineEvent': {
      const stage = msg.stage;
      if (stages[stage]) {
        stages[stage].status = msg.status;
        if (msg.outcome) {
          stages[stage].duration = msg.outcome.durationMs;

          if (msg.outcome.error) {
            stages[stage].detail = msg.outcome.error;
            stages[stage].code = undefined;
          } else if (stage === 'generate' && msg.outcome.output) {
            // Store code separately for formatted display
            stages[stage].code = msg.outcome.output;
            stages[stage].detail = '';
          } else if (stage === 'review' && msg.outcome.output) {
            stages[stage].detail = msg.outcome.output;
            stages[stage].code = undefined;
          } else {
            stages[stage].detail = `${msg.outcome.findings?.length ?? 0} finding(s)`;
            stages[stage].code = undefined;
          }
        }
        updateStageUI(stage);
      }
      break;
    }
    case 'findings': {
      showFindings(msg.findings ?? []);
      showResult(msg.approved, msg.summary);
      break;
    }
    case 'fixStarted': {
      // Reset stages and show that fix pipeline is running
      resetStages();
      break;
    }
    case 'fixError': {
      // Re-enable fix buttons and show error
      const errorBadge = $('result-badge');
      $('result-section').style.display = 'block';
      errorBadge.className = 'result-badge result-rejected';
      errorBadge.textContent = `\u274C Fix failed: ${msg.error}`;
      break;
    }
    case 'stageOrder': {
      currentStageOrder = msg.order;
      renderPostGenerateStages();
      break;
    }
    case 'modelInfo': {
      updateModelTags(msg.generate, msg.reviewAgents ?? [{ name: 'Review', model: msg.review?.model ?? '--' }]);
      break;
    }
  }
});

/** Shorten model name for display in tags */
function shortenModelName(model: string): string {
  // Map common model IDs to short display names
  const shortNames: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'o3': 'o3',
    'o4-mini': 'o4-mini',
    'claude-opus-4-20250514': 'Claude Opus',
    'claude-sonnet-4-20250514': 'Claude Sonnet',
    'claude-haiku-3-5-20241022': 'Claude Haiku',
    'gemini-2.5-pro': 'Gemini Pro',
    'gemini-2.5-flash': 'Gemini Flash',
    'deepseek-chat': 'DeepSeek V3',
    'deepseek-reasoner': 'DeepSeek R1',
    'mistral-large-latest': 'Mistral Large',
    'codestral-latest': 'Codestral',
    'grok-3': 'Grok 3',
    'qwen-max': 'Qwen Max',
    'qwen-coder-plus': 'Qwen Coder',
    'llama-3.3-70b-versatile': 'Llama 3.3',
    'MiniMax-Text-01': 'MiniMax Text',
    'MiniMax-M1': 'MiniMax M1',
  };
  return shortNames[model] || model;
}

function updateModelTags(generate: { model: string }, reviewAgents: { name: string; model: string }[]) {
  const genName = document.getElementById('tag-generate-name');
  if (genName) genName.textContent = shortenModelName(generate.model);

  // Remove old review tags
  const container = document.getElementById('model-tags');
  if (!container) return;
  container.querySelectorAll('.model-tag-review').forEach((el) => el.remove());

  // Add a tag for each review agent
  const reviewSvg = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1C4.1 1 1 3.6 1 7c0 1.8.8 3.4 2.2 4.5L2 15l4-2.5c.6.1 1.3.2 2 .2 3.9 0 7-2.6 7-6S11.9 1 8 1z"/></svg>';
  for (const agent of reviewAgents) {
    const tag = document.createElement('span');
    tag.className = 'model-tag model-tag-review';
    tag.title = agent.name;
    tag.innerHTML = `${reviewSvg}<span>${shortenModelName(agent.model)}</span>`;
    container.appendChild(tag);
  }
}

// --- Init ---
let _initialized = false;
function safeInitUI() {
  if (_initialized) return;
  _initialized = true;
  initUI();
}
document.addEventListener('DOMContentLoaded', safeInitUI);
// Also try immediate init in case DOM is already ready
if (document.readyState !== 'loading') {
  safeInitUI();
}
