# Changelog

All notable changes to the "GitFlare Assistant" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.6] - 2026-07-08

### Added
- **HEDRO company-specific PR review rules** - Automatic code review based on real HEDRO engineer feedback
  - Unwrap/expect detection in service initialization (critical severity)
  - SQL parameter documentation requirements (critical severity)  
  - Platform enum usage enforcement (medium severity)
  - RabbitMQ health check integration (medium severity)
  - SQL parameter ordering rules (medium severity)
  - Ruskit dependency version requirements (v1.73.5+)
- **Documentação de especificação** - `.vscode/pr-review-spec.md` com todas as regras e heurísticas
- **Guia de modelos OpenRouter** - `.vscode/openrouter-models.md` com modelos recomendados para revisão

### Configuration
- New setting: `gitFlareAssistant.enableHEDRORules` (default: true) - Enable/disable HEDRO-specific rules
- New setting: `gitFlareAssistant.companyPatterns` (default: "hedro") - Select company pattern for review

## [0.1.5] - 2026-07-03

### Fixed
- **PR Review Tool agora gera análise real via IA** (não mais só o prompt)
  - Integração correta com OpenRouter API
  - Relatório gerado pela IA em vez do template estático
- Correção de chamada assíncrona em generateReviewContent

### Added
- **PR Review Tool**: Analyze pull requests from other users directly in VS Code
- **Interactive Model Picker** com busca por nome/ID

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
