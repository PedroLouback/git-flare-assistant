import * as https from 'https';

export interface OpenRouterMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface OpenRouterOptions {
	apiKey: string;
	model: string;
	messages: OpenRouterMessage[];
	maxTokens?: number;
	temperature?: number;
}

export async function callOpenRouter(options: OpenRouterOptions): Promise<string> {
	const { apiKey, model, messages, maxTokens, temperature } = options;

	const body = JSON.stringify({
		model,
		messages,
		max_tokens: maxTokens ?? 1024,
		temperature: temperature ?? 0.3
	});

	const requestOptions = {
		hostname: 'openrouter.ai',
		path: '/api/v1/chat/completions',
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://github.com/git-ai-assistant',
			'X-Title': 'Git AI Assistant',
			'Content-Length': Buffer.byteLength(body)
		},
		timeout: 30000
	};

	return new Promise((resolve, reject) => {
		const req = https.request(requestOptions, (res) => {
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				if (res.statusCode && res.statusCode !== 200) {
					reject(new Error(`OpenRouter API error ${res.statusCode}: ${data}`));
					return;
				}

				try {
					const parsed = JSON.parse(data);
					const content = parsed.choices[0].message.content;
					resolve(content);
				} catch (parseError) {
					reject(new Error(`Failed to parse response: ${parseError}`));
				}
			});
		});

		req.on('error', (error) => {
			reject(error);
		});

		req.on('timeout', () => {
			req.destroy();
			reject(new Error('OpenRouter API request timed out'));
		});

		req.write(body);
		req.end();
	});
}