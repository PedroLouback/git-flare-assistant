import * as vscode from 'vscode';
import { getConfig, validateConfig, openSettings } from '../config';
import { callOpenRouter, OpenRouterMessage } from '../openrouter';
import { getPRDiff, getCurrentBranch, getCommitLog } from '../gitService';

export async function generatePRDescription(): Promise<void> {
	const config = getConfig();
	const validationError = validateConfig(config);

	if (validationError) {
		vscode.window.showErrorMessage(validationError, 'Open Settings').then((selection) => {
			if (selection === 'Open Settings') {
				openSettings();
			}
		});
		return;
	}

	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: 'Git AI: Generating PR description...',
			cancellable: false
		},
		async () => {
			let currentBranch: string;
			let diff: string;
			let commitLog: string;

			try {
				currentBranch = await getCurrentBranch();
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to get current branch: ${error instanceof Error ? error.message : String(error)}`);
				return;
			}

			try {
				diff = await getPRDiff(config.baseBranch);
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to get PR diff: ${error instanceof Error ? error.message : String(error)}`);
				return;
			}

			try {
				commitLog = await getCommitLog(config.baseBranch);
			} catch {
				commitLog = '';
			}

			if (!diff || diff.length < 10) {
				vscode.window.showWarningMessage(`No changes found between current branch and ${config.baseBranch}.`);
				return;
			}

			diff = diff.substring(0, 10000);
			commitLog = commitLog.substring(0, 2000);

			const context = `
Branch: ${currentBranch}
Base: ${config.baseBranch}

Recent commits:
${commitLog}

Changes diff:
${diff}
`;

			const systemMessage: OpenRouterMessage = {
				role: 'system',
				content: config.language === 'pt-BR'
					? 'Você é um desenvolvedor experiente. Gere uma descrição de Pull Request com: 1) Um título claro na primeira linha (sem heading markdown), 2) Uma linha em branco, 3) Seção ## Resumo com o que foi alterado e por quê, 4) Seção ## Alterações com bullet points das principais mudanças, 5) Seção ## Testes descrevendo como testar. Seja conciso e profissional. Retorne APENAS a descrição do PR.'
					: 'You are an expert developer. Generate a Pull Request description with: 1) A clear title on the first line (no markdown heading), 2) A blank line, 3) ## Summary section with what was changed and why, 4) ## Changes section with bullet points of main changes, 5) ## Testing section describing how to test. Be concise and professional. Return ONLY the PR description.'
			};

			const userMessage: OpenRouterMessage = {
				role: 'user',
				content: `Generate a PR description for these changes:\n\n${context}`
			};

			let prDescription: string;
			try {
				prDescription = await callOpenRouter({
					apiKey: config.apiKey,
					model: config.model,
					messages: [systemMessage, userMessage],
					temperature: 0.4,
					maxTokens: 1024
				});
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to generate PR description: ${error instanceof Error ? error.message : String(error)}`);
				return;
			}

			const panel = vscode.window.createWebviewPanel(
				'prDescription',
				'PR Description',
				vscode.ViewColumn.Beside,
				{ enableScripts: true }
			);

			panel.webview.html = getWebviewHtml(prDescription);
			panel.webview.onDidReceiveMessage(async (message) => {
				if (message.command === 'copy') {
					vscode.env.clipboard.writeText(prDescription);
					vscode.window.showInformationMessage('PR description copied to clipboard!');
				} else if (message.command === 'openEditor') {
					const doc = await vscode.workspace.openTextDocument({
						content: prDescription,
						language: 'markdown'
					});
					await vscode.window.showTextDocument(doc);
				}
			});
		}
	);
}

function getWebviewHtml(content: string): string {
	const escapedContent = content
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/\n/g, '<br>');

	return `<!DOCTYPE html>
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
		}
	</style>
</head>
<body>
	<div class="toolbar">
		<button onclick="copy()">📋 Copy All</button>
		<button onclick="openEditor()">✏️ Open in Editor</button>
	</div>
	<div class="content">${escapedContent}</div>
	<script>
		const vscode = acquireVsCodeApi();
		function copy() {
			vscode.postMessage({ command: 'copy' });
		}
		function openEditor() {
			vscode.postMessage({ command: 'openEditor' });
		}
	</script>
</body>
</html>`;
}