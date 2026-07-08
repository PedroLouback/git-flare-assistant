# Modelos OpenRouter Recomendados para Revisão de Código

## Gratuitos (Free)

### 1. Google - gemini-2.0-flash-exp:free
- **Contexto**: ~1M tokens
- **Velocidade**: Alta
- **Qualidade**: Muito boa para análise de código
- **Recomendação**: ⭐⭐⭐⭐⭐ (Melhor opção gratuita atual)

### 2. Meta - llama-3.3-70b-instruct:free
- **Contexto**: ~128K tokens
- **Velocidade**: Alta
- **Qualidade**: Boa para revisão técnica
- **Recomendação**: ⭐⭐⭐⭐

### 3. Meta - llama-3.1-405b-instruct:free
- **Contexto**: ~128K tokens  
- **Velocidade**: Média
- **Qualidade**: Excelente (modelo mais poderoso gratuito)
- **Recomendação**: ⭐⭐⭐⭐⭐

## Baratos (Paid - baixo custo)

### 1. Google - gemini-2.0-flash-exp
- **Preço**: ~$0.000075/1K input, $0.0003/1K output
- **Contexto**: 1M tokens
- **Recomendação**: ⭐⭐⭐⭐⭐

### 2. Google - gemini-flash-8b:free
- **Preço**: Grátis
- **Contexto**: 1M tokens
- **Velocidade**: Muito alta
- **Recomendação**: ⭐⭐⭐⭐

### 3. OpenAI - gpt-4o-mini
- **Preço**: ~$0.00015/1K input, $0.0006/1K output
- **Contexto**: 128K tokens
- **Recomendação**: ⭐⭐⭐

### 4. OpenAI - o1-mini (~0.015/1K input)
- **Preço**: Mais caro mas bom para debugging
- **Recomendação**: Use apenas quando precisar de raciocínio profundo

## Configuração Recomendada

```json
"gitFlareAssistant.model": "google/gemini-2.0-flash-exp:free"
```

Para revisão de código específica HEDRO, o `gemini-2.0-flash-exp:free` é ideal por:
- Contexto amplo para analisar diffs grandes
- Velocidade para resposta rápida
- Qualidade de análise técnica
- Gratuito (sem limite conhecido)