import * as vscode from 'vscode';
import { getConfig, validateConfig, openSettings } from '../config';
import { callOpenRouter, OpenRouterMessage } from '../openrouter';
import { getStagedDiff } from '../gitService';

export async function generateCommitMessage(): Promise<void> {
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
			title: 'Git AI: Generating commit message...',
			cancellable: false
		},
		async () => {
			let diff: string;
			try {
				diff = await getStagedDiff();
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to get staged changes: ${error instanceof Error ? error.message : String(error)}`);
				return;
			}

			if (!diff || diff.length < 10) {
				vscode.window.showWarningMessage('No staged changes found. Stage your changes first.');
				return;
			}

			diff = diff.substring(0, 8000);

			const systemMessage: OpenRouterMessage = {
				role: 'system',
				content: config.language === 'pt-BR'
					? 'Você é um desenvolvedor experiente. Gere uma mensagem de commit git concisa seguindo o formato Conventional Commits (tipo(escopo): descrição). Tipos: feat, fix, docs, style, refactor, test, chore. Primeira linha máx 72 chars. Opcionalmente adicione linha em branco e bullet points com detalhes. Retorne APENAS a mensagem de commit, sem explicações.'
					: 'You are an expert developer. Generate a concise git commit message following Conventional Commits format (type(scope): description). Types: feat, fix, docs, style, refactor, test, chore. First line max 72 chars. Optionally add a blank line and bullet points for details. Return ONLY the commit message, no explanations.'
			};

			const userMessage: OpenRouterMessage = {
				role: 'user',
				content: `Generate a commit message for these changes:\n\n${diff}`
			};

			let commitMessage: string;
			try {
				commitMessage = await callOpenRouter({
					apiKey: config.apiKey,
					model: config.model,
					messages: [systemMessage, userMessage],
					temperature: 0.3,
					maxTokens: 256
				});
			} catch (error) {
				vscode.window.showErrorMessage(`Failed to generate commit message: ${error instanceof Error ? error.message : String(error)}`);
				return;
			}

			const gitExtension = vscode.extensions.getExtension('vscode.git');
			if (gitExtension) {
				const gitAPI = await gitExtension.activate();
				const repo = gitAPI?.repositories?.[0];
				if (repo) {
					repo.inputBox.value = commitMessage;
				}
			}

			vscode.window.showInformationMessage('✅ Commit message generated!', 'Copy').then((selection) => {
				if (selection === 'Copy') {
					vscode.env.clipboard.writeText(commitMessage);
				}
			});
		}
	);
}