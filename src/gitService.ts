import * as vscode from 'vscode';
import { execSync } from 'child_process';

function getWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    throw new Error('No workspace folder open in VS Code.');
  }
  return folders[0].uri.fsPath;
}

function git(command: string, cwd: string): string {
  try {
    return execSync(`git ${command}`, {
      cwd,
      encoding: 'utf8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (err: any) {
    const stderr = err.stderr?.toString?.() ?? '';
    const stdout = err.stdout?.toString?.() ?? '';
    throw new Error(stderr || stdout || err.message);
  }
}

export async function getStagedDiff(): Promise<string> {
  const cwd = getWorkspaceRoot();

  // Verifica se é um repo git
  try {
    git('rev-parse --is-inside-work-tree', cwd);
  } catch {
    throw new Error('No Git repository found in current workspace.');
  }

  // Tenta staged primeiro
  const staged = git('diff --staged', cwd);
  if (staged && staged.length > 0) {
    return staged;
  }

  // Fallback para unstaged
  const unstaged = git('diff', cwd);
  if (unstaged && unstaged.length > 0) {
    return unstaged;
  }

  throw new Error('No changes found. Stage your changes with git add first.');
}

export async function getCurrentBranch(): Promise<string> {
  const cwd = getWorkspaceRoot();
  try {
    return git('rev-parse --abbrev-ref HEAD', cwd);
  } catch {
    return 'unknown';
  }
}

export async function getCommitLog(baseBranch: string): Promise<string> {
  const cwd = getWorkspaceRoot();
  try {
    return git(`log ${baseBranch}..HEAD --oneline --no-merges`, cwd);
  } catch {
    return '';
  }
}

export async function getPRDiff(baseBranch: string): Promise<string> {
  const cwd = getWorkspaceRoot();

  try {
    const diff = git(`diff ${baseBranch}...HEAD`, cwd);
    if (diff && diff.length > 0) {
      return diff;
    }
  } catch {
    // fallback abaixo
  }

  return getStagedDiff();
}