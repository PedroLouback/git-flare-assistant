import * as vscode from 'vscode';
import { generateCommitMessage } from './commands/commitMessage';
import { generatePRDescription } from './commands/prDescription';
import { reviewChanges } from './commands/reviewChanges';
import { getConfig, openSettings } from './config';

export function activate(context: vscode.ExtensionContext): void {
	const disposable1 = vscode.commands.registerCommand('git-ai-assistant.generateCommitMessage', generateCommitMessage);
	const disposable2 = vscode.commands.registerCommand('git-ai-assistant.generatePRDescription', generatePRDescription);
	const disposable3 = vscode.commands.registerCommand('git-ai-assistant.reviewChanges', reviewChanges);

	context.subscriptions.push(disposable1, disposable2, disposable3);

	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBarItem.text = "$(sparkle) Git AI";
	statusBarItem.tooltip = "Git AI Assistant - Click to generate commit message";
	statusBarItem.command = 'git-ai-assistant.generateCommitMessage';
	statusBarItem.show();
	context.subscriptions.push(statusBarItem);

	const config = getConfig();
	if (!config.apiKey || config.apiKey.trim() === '') {
		vscode.window.showInformationMessage(
			'Git AI Assistant: Please configure your OpenRouter API key to get started.',
			'Configure'
		).then((selection) => {
			if (selection === 'Configure') {
				openSettings();
			}
		});
	}
}

export function deactivate(): void {}