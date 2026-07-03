import * as vscode from 'vscode';
import { getConfig, validateConfig, openSettings } from '../config';
import { execSync } from 'child_process';

export interface PRReviewConfig {
	prNumber: string;
	repository: {
		owner: string;
		repo: string;
		path: string;
		branch: string;
	};
	changes: {
		diff: string;
		additions: number;
		deletions: number;
		files: string[];
	};
	analysis: {
		violations: Violation[];
		suggestions: Suggestion[];
	};
	report: {
		executiveSummary: string;
		criticalIssues: string[];
		warnings: string[];
		positiveAspects: string[];
		recommendations: string[];
		grade: string;
		score: number;
	};
}

export interface Violation {
	type: 'error' | 'warning' | 'info';
	category: 'security' | 'format' | 'performance' | 'maintainability';
	message: string;
	location: string;
	severity: number;
}

export interface Suggestion {
	type: 'refactor' | 'optimization' | 'best-practice';
	title: string;
	description: string;
	impact: 'low' | 'medium' | 'high';
}

function getGitAPI(): any {
	return vscode.extensions.getExtension('vscode.git')?.exports?.getAPI(1);
}

async function pickRepository(gitAPI: any): Promise<string | undefined> {
	const repos: any[] = gitAPI?.repositories ?? [];

	if (repos.length === 0) {
		throw new Error('No Git repositories found in workspace.');
	}

	if (repos.length === 1) {
		return repos[0].rootUri.fsPath;
	}

	const items = repos.map((r: any) => ({
		label: `$(repo) ${require('path').basename(r.rootUri.fsPath)}`,
		description: r.rootUri.fsPath,
		repoPath: r.rootUri.fsPath,
		detail: `Branch: ${r.state?.HEAD?.name ?? 'unknown'}`
	}));

	const picked = await vscode.window.showQuickPick(items, {
		placeHolder: 'Select repository for PR review',
		matchOnDescription: true
	});

	return picked?.repoPath;
}

async function fetchPRInfo(prNumber: string, repoPath: string): Promise<any> {
	const command = `gh pr view ${prNumber} --json title,body,baseRefName,headRefName,author,additions,deletions,files`;

	const isGitHubCLICommandAllowed = (command: string): boolean => {
		const gitHubCLIPatterns = [
			/^gh pr view \d+ --json/,
			/^gh pr diff \d+$/
		];
		return gitHubCLIPatterns.some(pattern => pattern.test(command.trim()));
	};

	if (!isGitHubCLICommandAllowed(command)) {
		throw new Error(`GitHub CLI command not allowed: ${command}`);
	}

	try {
		const prJson = execSync(command, {
			cwd: repoPath,
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'pipe'],
			timeout: 30000
		}).trim();

		const prData = JSON.parse(prJson);

		const filesList = prData.files?.map((f: { path: string }) => f.path).join('\n') ?? '';

		return {
			title: prData.title ?? '',
			body: prData.body,
			baseRefName: prData.baseRefName ?? '',
			headRefName: prData.headRefName ?? '',
			author: prData.author?.login ?? '',
			additions: prData.additions ?? 0,
			deletions: prData.deletions ?? 0,
			files: filesList.split('\n').filter((f: string) => f.length > 0)
		};
	} catch (err: any) {
		const stderr = err.stderr?.toString?.() ?? '';
		throw new Error(`Failed to fetch PR info: ${stderr || err.message}`);
	}
}

async function fetchPRDiff(prNumber: string, repoPath: string): Promise<string> {
	const command = `gh pr diff ${prNumber}`;

	const isGitHubCLICommandAllowed = (command: string): boolean => {
		const gitHubCLIPatterns = [
			/^gh pr view \d+ --json/,
			/^gh pr diff \d+$/
		];
		return gitHubCLIPatterns.some(pattern => pattern.test(command.trim()));
	};

	if (!isGitHubCLICommandAllowed(command)) {
		throw new Error(`GitHub CLI command not allowed: ${command}`);
	}

	try {
		const diff = execSync(command, {
			cwd: repoPath,
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'pipe'],
			timeout: 60000
		}).trim();

		return diff;
	} catch (err: any) {
		const stderr = err.stderr?.toString?.() ?? '';
		throw new Error(`Failed to fetch PR diff: ${stderr || err.message}`);
	}
}

function isValidPRNumber(input: string): string | null {
	if (!input || typeof input !== 'string') return null;

	const githubURLOptions = input.match(/github\.com\/([a-zA-Z0-9_.-]+\/\S+)\/pull\/(\d+)/);
	if (githubURLOptions) {
		const prNumber = githubURLOptions[2];
		if (/^\d{1,8}$/.test(prNumber)) {
			return prNumber;
		}
	}

	if (/^\d{1,8}$/.test(input.trim())) {
		return input.trim();
	}

	return null;
}

export async function reviewPR(): Promise<void> {
	const config = getConfig();
	const validationError = validateConfig(config);

	if (validationError) {
		const action = await vscode.window.showErrorMessage(validationError, 'Open Settings');
		if (action === 'Open Settings') {
			openSettings();
		}
		return;
	}

	const gitAPI = getGitAPI();
	let repoPath: string | undefined;

	if (!gitAPI?.repositories?.length) {
		vscode.window.showErrorMessage('No Git repositories found.');
		return;
	}

	try {
		repoPath = await pickRepository(gitAPI);
	} catch (err: any) {
		vscode.window.showErrorMessage(err.message);
		return;
	}

	if (!repoPath) {
		return;
	}

	const prInput = await vscode.window.showInputBox({
		title: 'GitFlare: Review Pull Request',
		placeHolder: 'Enter PR number (e.g., 123) or PR URL',
		prompt: 'The extension will fetch and analyze PR changes using GitHub CLI'
	});

	if (!prInput) {
		return;
	}

	const prNumber = isValidPRNumber(prInput);
	if (!prNumber) {
		vscode.window.showErrorMessage('Invalid PR number or URL format.');
		return;
	}

	const isGitHubCLIAvailable = (): boolean => {
		try {
			execSync('gh --version', { stdio: ['pipe', 'pipe', 'pipe'] });
			return true;
		} catch {
			return false;
		}
	};

	if (!isGitHubCLIAvailable()) {
		vscode.window.showErrorMessage(
			'GitHub CLI (gh) not found. Please install it to use PR review feature.'
		);
		return;
	}

	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `GitFlare: Analyzing PR #${prNumber}...`,
			cancellable: false
		},
		async () => {
			let prInfo: any;
			try {
				prInfo = await fetchPRInfo(prNumber, repoPath!);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to fetch PR info: ${error instanceof Error ? error.message : String(error)}`);
				return;
			}

			let diff: string;
			try {
				diff = await fetchPRDiff(prNumber, repoPath!);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to fetch PR diff: ${error instanceof Error ? error.message : String(error)}`);
				return;
			}

			if (!diff || diff.length < 10) {
				vscode.window.showWarningMessage(`PR #${prNumber} appears to have no changes.`);
				return;
			}

			const analysis = analyzeChanges(diff, prInfo);

			await vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: 'GitFlare: Generating AI review...',
					cancellable: false
				},
				async () => {
					try {
						const reviewContent = generateReviewContent(prInfo, diff, analysis, config.language);
						showReviewResults(prInfo, reviewContent);
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to generate review: ${error instanceof Error ? error.message : String(error)}`);
					}
				}
			);
		}
	);
}

function analyzeChanges(diff: string, prInfo: any): { violations: Violation[]; suggestions: Suggestion[] } {
	const violations: Violation[] = [];
	const suggestions: Suggestion[] = [];

	const securityPatterns = [
		{ pattern: /password\s*[:=]\s*['"][^'"]+['"]/, message: 'Hardcoded password detected' },
		{ pattern: /secret\s*[:=]\s*['"][^'"]+['"]/, message: 'Hardcoded secret detected' },
		{ pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/, message: 'API key in code' },
		{ pattern: /`[^`]*password[^`]*`/, message: 'Password in code block' }
	] as const;

	const lines = diff.split('\n');
	let currentFile = '';

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line.startsWith('diff --git')) {
			const match = line.match(/diff --git a\/(.+) b\//);
			if (match) {
				currentFile = match[1];
			}
		}

		if (line.startsWith('+') && !line.startsWith('+++')) {
			const addedLine = line.substring(1);

			for (const sp of securityPatterns) {
				if (sp.pattern.test(addedLine.toLowerCase())) {
					violations.push({
						type: 'error',
						category: 'security',
						message: sp.message,
						location: `${currentFile}:${i}`,
						severity: 10
					});
				}
			}
		}
	}

	return { violations, suggestions };
}

function generateReviewContent(prInfo: any, diff: string, analysis: { violations: Violation[]; suggestions: Suggestion[] }, language: string): string {
	const systemPrompt = language === 'pt-BR' 
		? 'Você é um revisor de código sênior. Analise a PR e forneça um relatório detalhado em português com: 1) Resumo executivo, 2) Problemas críticos, 3) Avisos, 4) Aspectos positivos, 5) Recomendações, 6) Nota final (A-F). Seja construtivo e profissional.'
		: 'You are a senior code reviewer. Analyze the PR and provide a detailed report with: 1) Executive summary, 2) Critical issues, 3) Warnings, 4) Positive aspects, 5) Recommendations, 6) Final grade (A-F). Be constructive and professional.';

	const context = `
PR Title: ${prInfo.title}
Author: ${prInfo.author}
Base Branch: ${prInfo.baseRefName}
Head Branch: ${prInfo.headRefName}
Additions: +${prInfo.additions} -${prInfo.deletions}

Files changed (${prInfo.files.length}):
${prInfo.files.join('\n')}

Diff:
${diff.slice(0, 20000)}

Security violations found: ${analysis.violations.length}
Suggestions: ${analysis.suggestions.length}
`;

	return `${systemPrompt}\n\n${context}`;
}

function showReviewResults(prInfo: any, reviewContent: string): void {
	const panel = vscode.window.createWebviewPanel(
		'prReview',
		`PR #${prInfo.prNumber || 'Unknown'} Review`,
		vscode.ViewColumn.Beside,
		{ enableScripts: true }
	);

	const escapedContent = reviewContent
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\n/g, '<br>');

	panel.webview.html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
      padding: 20px;
    }
    .toolbar {
      margin-bottom: 20px;
    }
    .toolbar button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 16px;
      margin-right: 10px;
      cursor: pointer;
    }
    .content {
      white-space: pre-wrap;
      line-height: 1.5;
    }
    h1 {
      color: var(--vscode-textLink-foreground);
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>GitFlare PR Review</h1>
  <div class="toolbar">
    <button onclick="copy()">Copy</button>
  </div>
  <div class="content">${escapedContent}</div>
  <script>
    const vscode = acquireVsCodeApi();
    function copy() {
      vscode.postMessage({ command: 'copy' });
    }
  </script>
</body>
</html>`;

	panel.webview.onDidReceiveMessage(async (message) => {
		if (message.command === 'copy') {
			await vscode.env.clipboard.writeText(reviewContent);
			vscode.window.showInformationMessage('PR review copied to clipboard!');
		}
	});
}