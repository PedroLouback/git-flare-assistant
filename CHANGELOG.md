# Changelog

All notable changes to the "GitFlare Assistant" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-07-02

### Added
- **PR Review Tool**: Analyze pull requests from other users directly in VS Code
  - Select repository from workspace
  - Enter PR number or URL for analysis
  - GitHub CLI integration for fetching PR details and diffs
  - Security vulnerability detection (passwords, secrets, API keys)
  - Webview panel with formatted review report
  - Copy review to clipboard functionality
- **Interactive Model Picker** (command and settings integration)
  - Fetch models from OpenRouter API (sorted by popularity)
  - Search models by name or ID
  - Show pricing and context window info
  - Fallback to curated models when API unavailable

### Changed
- Improved commit message generation prompt structure
- Enhanced model validation with curated model list
- Better error handling with descriptive messages

### Configuration
- New setting: `gitFlareAssistant.useModelPicker` (default: true) - Show model picker in settings
- Model selection command: `GitFlare: Select Model`

## [Unreleased]

### Added
- GitHub CLI integration for PR description generation
- PR number/URL input for fetching real PR data
- Bilingual README (English and Portuguese)
- Issue templates for feature requests and bug reports
- Contribution guidelines
- Publisher metadata (PedroLouback)
- Code of Conduct
- GitHub Actions CI/CD for automatic publishing

### Changed
- PR description now fetches PR details and diff via `gh pr view` and `gh pr diff`
- PR description webview shows PR number in title
- Improved PR description prompt with more context (author, stats, files)

### Configuration
- New setting: `gitAiAssistant.useGitHubCLI` (default: true) - Enable/disable GitHub CLI for PR descriptions

## [0.0.1] - Initial Release

### Added
- Generate commit messages using AI (Conventional Commits format)
- Generate PR descriptions comparing current branch with base
- Code review with categorized feedback (issues, suggestions, positives)
- Multi-language support (English, Portuguese)
- Settings for API key, model selection, and base branch