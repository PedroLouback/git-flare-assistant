# Especificação de Revisão Automática de PRs - HEDRO

Baseado em análise de PRs reais: notifications#44, onboarding#181

## 1. REGRAS DESCOBERTAS

### 1.1 Tratamento de Erros em Inicialização (Confiança: ALTA)
- **Padrão**: Evitar `.unwrap()` e `.expect()` em inicialização de serviços/clientes
- **Severidade**: ALTA
- **Categorias**: tratamento de erros, robustez, segurança
- **Pattern de detecção**: `.unwrap()` ou `.expect()` em `main.rs` ou `container.rs`
- **Sugestão**: Retornar `Result<T, Box<dyn Error>>` e usar `?` operator
- **Evidências**: 
  - PR#44: Copilot - SES client e gRPC external service clients
  - PR#44: dispatcher() usando .unwrap() para criar SES email client e clients externos

### 1.2 Documentação SQL (Confiança: ALTA)
- **Padrão**: Comentários de documentação de parâmetros são obrigatórios
- **Severidade**: ALTA
- **Categorias**: documentação, segurança, legibilidade, DBA
- **Pattern**: `/// ### Parameters:` seguido de lista numerada `$N` com descrições
- **Evidências**:
  - PR#181: "Vc removeu a legenda, favor adicionar novamente" (create_organization.rs)
  - PR#181: "Removeu as legendas favor adicionar novamente" (create_invite_to_organization.rs)
  - PR#181: "Voltar com a legenda" (create_user.rs)
- **Ação requerida**: Sempre manter documentação SQL em arquivos `.rs` com queries

### 1.3 Platform Enum Usage (Confiança: ALTA)
- **Padrão**: Usar `Platform` enum do proto ao invés de `String`
- **Severidade**: MÉDIA
- **Categorias**: nomenclatura, type safety, clean code, performance
- **Pattern**: Detectar `"hedro".to_string()` ou `"novus".to_string()` onde deveria ser `Platform::Hedro` ou `Platform::Novus`
- **Evidências**:
  - PR#44: Copilot - "recomendo retornar uma String and um vez do 'static"
  - PR#181: Lucas - "usar o enum aqui", "existe o enum ja para isso"
- **Sugestão**: `match s.as_str() { "novus" => Platform::Novus, _ => Platform::Hedro }`

### 1.4 Ordem de Parâmetros SQL (Confiança: ALTA)
- **Padrão**: Novos parâmetros SQL devem ser adicionados no final, não reordenar
- **Severidade**: MÉDIA
- **Categorias**: boas práticas, banco de dados, manutenibilidade
- **Pattern**: Quando adicionar parâmetros, usar sequência crescente no final
- **Evidências**:
  - PR#181: "é uma boa prática sempre adicionar a frente (nao precisa mudar mais)"
- **Ação**: Verificar consistência de numeração dos parâmetros

### 1.5 RabbitMQ Health Check (Confiança: ALTA)
- **Padrão**: RabbitMQ deve ser adicionado ao ReadinessService
- **Severidade**: MÉDIA
- **Categorias**: observabilidade, health checks, confiabilidade
- **Pattern**: `.rabbitmq(...)` no HealthReadinessServiceImpl
- **Evidências**:
  - PR#181: "Adiciona o RabbitMQ no ReadinessService, por favor"
- **Sugestão**: Passar conexão RabbitMQ para health service

### 1.6 Dead Code Removal (Confiança: MÉDIA)
- **Padrão**: Remover código morto é aceitável se verificado que não é usado
- **Severidade**: BAIXA
- **Categorias**: limpeza, manutenibilidade, SOLID
- **Evidências**:
  - PR#181: Remoção de `impl From<OrganizationInvitePb>` não utilizado
  - "Pelo que olhei aqui o impl From<OrganizationInvitePb> era código morto, não era chamado"
- **Crítico**: Verificar se código removido realmente não é chamado

### 1.7 Atualização de Dependências Ruskit (Confiança: ALTA)
- **Padrão**: Manter dependências ruskit atualizadas (v1.73.5+)
- **Severidade**: MÉDIA
- **Categorias**: boas práticas, manutenção
- **Pattern**: `ruskit.git?rev=v1.73.` ou superior
- **Evidências**:
  - PR#44 e PR#181: ambos solicitaram atualização para v1.73.5
- **Sugestão**: "Pode ver o código de devices na branch develop para referência"

## 2. HEURÍSTICAS DE COMPORTAMENTO DOS REVISORES

| Heurística | Evidências |
|------------|-----------|
| **Direto e objetivo** | "nao existe parametro 10 nem 11" - sem explicações longas |
| **Exigem documentação** | Comentários sobre remoção de documentação SQL são recorrentes |
| **Priorizam consistência** | Referenciam outras branches/repos como referência |
| **Cobham boas práticas** | Panic risks, type safety, error handling são cobrados |
| **Conservadores com refatorações** | Preferem mudanças incrementais, não grandes refatorações |
| **Focam em clean code** | Sugerem simplificações de código (remover else desnecessário) |

### Nível de Exigência
- **ALTO**: Erros de compilação, documentação removida, panic risks
- **MÉDIO**: Type safety, health checks, atualizações de dependências
- **BAIXO**: Simplificações de código, refatorações, dead code

## 3. PADRÕES DE EXIGÊNCIA

### Changes Requested (Obrigatório)
1. Erros de compilação (dangling references, type mismatches)
2. Remoção de documentação existente
3. Panic risks em código crítico de inicialização

### Commented (Sugestão)
1. Melhorias de type safety (Platform enum)
2. Simplificações de código (remover else desnecessário)
3. Extração de funções duplicadas
4. Dead code removal

## 4. IMPLEMENTAÇÃO NA EXTENSÃO

### Arquivo: src/heuristics/hedroReview.ts

Contém regras específicas implementadas:
- `unwrap_in_init`: Detecta .unwrap()/.expect() em arquivos de inicialização
- `sql_doc_required`: Exige documentação em statements SQL
- `platform_string_literal`: Detecta uso de strings para platform
- `rabbitmq_health`: Verifica se RabbitMQ está no health check
- `ruskit_version`: Verifica versão mínima das dependências

### Configurações (package.json)
- `enableHEDRORules`: Ativar/desativar regras HEDRO
- `companyPatterns`: Selecionar padrão de empresa (hedro/custom)

## 5. CHECKLIST DE VERIFICAÇÃO

### Antes do merge
- [ ] Nenhum `.unwrap()` em main.rs/container.rs sem tratamento adequado
- [ ] Documentação SQL preservada em arquivos de queries
- [ ] Platform enum usado consistentemente (não strings literais)
- [ ] RabbitMQ no ReadinessService (se serviço usa RabbitMQ)
- [ ] Dependências ruskit atualizadas para v1.73.5+
- [ ] Código morto removido com justificativa ou preservado

## 6. EVOLUÇÃO FUTURA

Esta especificação deve ser atualizada conforme novas PRs forem analisadas:
- Aumentar nível de confiança conforme mais evidências surgirem
- Adicionar novos padrões identificados
- Ajustar severidades conforme feedback dos revisores
- Refinar patterns para reduzir falsos positivos

---

**Status**: Implementado parcialmente (prReview.ts + hedroReview.ts)
**Data da última atualização**: 2026-07-08
**PRs analisadas**: notifications#44, onboarding#181