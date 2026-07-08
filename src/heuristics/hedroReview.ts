import { Violation, Suggestion } from '../commands/prReview';

export interface HEDRORule {
	id: string;
	name: string;
	description: string;
	severity: 'high' | 'medium' | 'low';
	confidence: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
	pattern: RegExp;
	message: string;
	suggestion?: string;
	evidence?: string[];
}

export const HEDRORules: HEDRORule[] = [
	{
		id: 'unwrap-init',
		name: 'Unwrap in Initialization',
		description: 'Avoid unwrap/expect in service initialization - should use Result propagation',
		severity: 'high',
		confidence: 'very-high',
		pattern: /\.unwrap\(\)|\.expect\([^)]+\)/,
		message: 'Avoid unwrap/expect in initialization - use Result propagation instead. Transient misconfiguration (AWS creds, endpoints, etc.) will panic the process instead of returning a clean initialization error.',
		suggestion: 'Return Result<T, Box<dyn Error>> and use ? operator',
		evidence: [
			'PR#44: SES client and gRPC clients initialization',
			'PR#44: dispatcher() method using unwrap() for SES email client'
		]
	},
	{
		id: 'sql-doc-required',
		name: 'SQL Documentation Required',
		description: 'SQL statements require parameter documentation with /// ### Parameters:',
		severity: 'high',
		confidence: 'high',
		pattern: /^(INSERT INTO|UPDATE|DELETE FROM|SELECT).*[$]/,
		message: 'SQL statements require parameter documentation. Add /// ### Parameters: comment block.',
		suggestion: 'Add parameter documentation before SQL function',
		evidence: [
			'PR#181: "Vc removeu a legenda, favor adicionar novamente"',
			'PR#181: Missing docs in create_invite_to_organization.rs and create_organization.rs'
		]
	},
	{
		id: 'platform-string-literal',
		name: 'Platform String Literal',
		description: 'Use Platform enum instead of String literal for platform values',
		severity: 'medium',
		confidence: 'high',
		pattern: /(?:["'])(hedro|novus)(["']\.to_string\(\)|["'])/,
		message: 'Consider using Platform enum from protos::generated::common::v1::Platform instead of String literal.',
		suggestion: 'Use Platform::Hedro or Platform::Novus from the proto-generated enum',
		evidence: [
			'PR#44: Email body using "hedro"/"novus" strings',
			'PR#44: Copilot recommendation for String instead of static',
			'PR#181: Lucas-H-Martins - "usar o enum aqui"'
		]
	},
	{
		id: 'platform-if-else',
		name: 'Platform If-Else Pattern',
		description: 'Simplify platform-based conditional logic',
		severity: 'low',
		confidence: 'medium',
		pattern: /if\s+[\w\.]+\.eq_ignore_ascii_case\(["']novus["']\)\s*\{[\s\S]*?return\s+["']Novus["']\.into\(\)[\s\S]*?\}[\s\S]*?["']Hedro["']\.into\(\)/,
		message: 'Unnecessary else block - simplify the conditional.',
		suggestion: 'Remove else block and return directly',
		evidence: [
			'PR#44: "nao precisa desse else pedro"'
		]
	},
	{
		id: 'rabbitmq-health',
		name: 'RabbitMQ Health Check',
		description: 'RabbitMQ should be added to ReadinessService for health checks',
		severity: 'medium',
		confidence: 'medium',
		pattern: /fn\s+health_http_server_setup/,
		message: 'Ensure RabbitMQ is added to ReadinessService for health checks.',
		evidence: [
			'PR#181: "Adiciona o RabbitMQ no ReadinessService, por favor"'
		]
	},
	{
		id: 'sql-param-append',
		name: 'SQL Parameter Append Only',
		description: 'New SQL parameters should be added at the end, not reorder existing ones',
		severity: 'medium',
		confidence: 'high',
		pattern: /[$]\d+.*-- .*\n.*\n.*[$]\d+.*-- .*\n.*[$]\d+.*-- .*\n(.*[$]\d+.*-- ).*(?!$)/,
		message: 'New SQL parameters should be appended at the end to maintain compatibility and avoid reordering.',
		evidence: [
			'PR#181: "sempre adicionar a frente... lembre-se quando adicionar parametros sempre adicionar o ultimo"'
		]
	},
	{
		id: 'ruskit-version',
		name: 'Ruskit Dependency Version',
		description: 'Ruskit dependencies should be updated to v1.73.5+',
		severity: 'medium',
		confidence: 'high',
		pattern: /ruskit\.git\?rev=v1\.(7[0-2]|[0-6][0-9])/,
		message: 'Update ruskit dependency to v1.73.5 or latest. Check devices branch for reference.',
		evidence: [
			'PR#44: "atualiza para a versao v1.73.5"',
			'PR#181: "atualiza para a versao v1.73.5"'
		]
	},
	{
		id: 'dangling-reference',
		name: 'Dangling Reference',
		description: 'String temporaries should be stored before building context to avoid dangling references',
		severity: 'high',
		confidence: 'high',
		pattern: /\.replace\([^)]+\)\s*(&?)/,
		message: 'String temporaries created with .replace() are dropped immediately and may create dangling references if stored in &str context.',
		suggestion: 'Store replaced strings in local variables before building context',
		evidence: [
			'PR#44: EmailContext storing &str with replaced strings causing compile error'
		]
	}
];

export function applyHEDRORules(diff: string): { violations: Violation[]; suggestions: Suggestion[] } {
	const violations: Violation[] = [];
	const suggestions: Suggestion[] = [];

	const lines = diff.split('\n');
	let currentFile = '';

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		if (line.startsWith('diff --git')) {
			const match = line.match(/diff --git a\/(.+?) b\//);
			if (match) {
				currentFile = match[1];
			}
		}

		if (line.startsWith('+') && !line.startsWith('+++')) {
			const addedLine = line.substring(1);

			for (const rule of HEDRORules) {
				if (rule.pattern.test(addedLine)) {
					violations.push({
						type: rule.severity === 'high' ? 'error' : rule.severity === 'medium' ? 'warning' : 'info',
						category: 'maintainability',
						message: rule.message,
						location: `${currentFile}:${i}`,
						severity: rule.severity === 'high' ? 10 : rule.severity === 'medium' ? 5 : 1
					});

					if (rule.suggestion) {
						suggestions.push({
							type: 'best-practice',
							title: rule.name,
							description: rule.suggestion,
							impact: rule.severity
						});
					}
				}
			}
		}
	}

	return { violations, suggestions };
}

export function getHEDROSystemPrompt(language: string): string {
	return language === 'pt-BR' 
		? `Você é um revisor de código sênior da empresa HEDRO. Analise a PR aplicando estes critérios específicos:

1. TRATAMENTO DE ERROS (Crítico): Evite .unwrap()/.expect() em inicialização - use Result propagation
2. DOCUMENTAÇÃO SQL (Crítico): Statements SQL requerem documentação de parâmetros com /// ### Parameters:
3. PLATFORM ENUM (Médio): Use Platform enum do proto ao invés de String literals ("hedro"/"novus")
4. RMQ HEALTH (Médio): RabbitMQ deve estar no ReadinessService
5. ORDEM SQL PARAMS: Novos parâmetros no final, não reordene
6. RUASKIT: Atualize para v1.73.5+
7. PADRÕES: Referencie o código de devices branch como referência

Seja direto, técnico e construtivo. Foque no que NÃO foi aceito nas revisões anteriores.`
		: `You are a senior code reviewer at HEDRO company. Analyze the PR applying these specific criteria:

1. ERROR HANDLING (Critical): Avoid .unwrap()/.expect() in initialization - use Result propagation
2. SQL DOCUMENTATION (Critical): SQL statements require /// ### Parameters: documentation
3. PLATFORM ENUM (Medium): Use Platform enum from proto instead of String literals ("hedro"/"novus")
4. RMQ HEALTH (Medium): RabbitMQ must be in ReadinessService
5. SQL PARAMS ORDER: New parameters at the end, don't reorder
6. RUASKIT: Update to v1.73.5+
7. PATTERNS: Reference devices branch as example

Be direct, technical, and constructive. Focus on what was NOT accepted in previous reviews.`;
}