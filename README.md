# Git AI Assistant

Generate commit messages, PR descriptions, and code reviews using free AI models via OpenRouter — directly in VS Code.

## Features

- **Generate Commit Message** — reads staged changes and writes a Conventional Commits message directly into the SCM input box
- **Generate PR Description** — compares your branch with the base and generates a structured PR title + body
- **Review Changes** — analyzes your diff and returns categorized feedback (critical issues, suggestions, positives)

## Setup

1. Get a free API key at [openrouter.ai](https://openrouter.ai)
2. Open VS Code Settings (`Ctrl+,`) and search for `gitAiAssistant`
3. Set your **API Key** and preferred **model** (e.g. `google/gemini-2.0-flash-exp:free`)

## Usage

Open the Command Palette (`Ctrl+Shift+P`) and run:
- `Git AI: Generate Commit Message`
- `Git AI: Generate PR Description`
- `Git AI: Review Changes`

Commands also appear in the Source Control panel toolbar.