# VITAIA - Documentação da Arquitetura

## 🏛️ Visão Geral da Arquitetura

O VITAIA foi desenvolvido seguindo os princípios da **Clean Architecture**, garantindo alta testabilidade, manutenibilidade e extensibilidade. A arquitetura é baseada em camadas bem definidas com inversão de dependências.

## 📐 Estrutura em Camadas

### 1. **Domain Layer** (Camada de Domínio)
**Responsabilidade**: Regras de negócio puras, sem dependências externas

```
server/domain/
├── entities/           # Entidades de negócio
├── value-objects/      # Objetos de valor
├── interfaces/         # Contratos e abstrações
└── services/          # Serviços de domínio
```

#### **Entidades**
- `Patient.ts`: Entidade principal com regras de negócio do paciente
- Encapsula comportamentos e invariantes
- Validações de domínio integradas

#### **Value Objects**
- `CPF.ts`: Validação de CPF brasileiro
- `Email.ts`: Validação e normalização de email
- Imutáveis e auto-validáveis

#### **Interfaces**
- `IRepository.ts`: Contrato para repositórios
- `IUseCase.ts`: Contrato para casos de uso
- `IAIProvider.ts`: Contrato para provedores de IA

### 2. **Application Layer** (Camada de Aplicação)
**Responsabilidade**: Orquestração de casos de uso

```
server/application/
└── use-cases/         # Casos de uso da aplicação
```

#### **Use Cases**
- `CreatePatientUseCase.ts`: Criação de pacientes
- `AnalyzeSymptomsUseCase.ts`: Análise de sintomas com IA
- Coordenam entidades e serviços de domínio

### 3. **Infrastructure Layer** (Camada de Infraestrutura)
**Responsabilidade**: Implementações concretas e integrações externas

```
server/infrastructure/
├── repositories/      # Implementações de repositório
└── ai-providers/     # Provedores de IA
```

#### **Repositórios**
- `PatientRepository.ts`: Implementação com Drizzle ORM
- Padrão Repository com paginação e filtros

#### **Provedores de IA**
- `GeminiAIProvider.ts`: Integração com Google Gemini
- Implementação do padrão Strategy

### 4. **Presentation Layer** (Camada de Apresentação)
**Responsabilidade**: Interface com o mundo externo

```
server/_core/          # Servidor Express
server/routers.ts      # Rotas tRPC
```

## 🎯 Padrões de Design Implementados

### **Factory Pattern**
```typescript
class AIProviderFactory {
  private static instance: AIProviderFactory;
  private providers: Map<string, () => IAIProvider> = new Map();
  
  public static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }
}
```

**Benefícios**:
- Criação centralizada de objetos
- Fácil adição de novos provedores
- Singleton para instância única

### **Strategy Pattern**
```typescript
interface IAIAnalysisStrategy {
  analyze(symptoms: string[], providers: IAIProvider[]): Promise<AnalysisResult>;
}

class SingleProviderStrategy implements IAIAnalysisStrategy { /* ... */ }
class ConsensusStrategy implements IAIAnalysisStrategy { /* ... */ }
class FallbackStrategy implements IAIAnalysisStrategy { /* ... */ }
```

**Benefícios**:
- Algoritmos intercambiáveis
- Extensibilidade sem modificação
- Testabilidade individual

### **Observer Pattern**
```typescript
interface IMetricsObserver {
  onMetricCollected(metric: IMetric): void;
}

class MetricsCollector {
  private observers: Set<IMetricsObserver> = new Set();
  
  collectMetric(metric: IMetric): void {
    this.observers.forEach(observer => observer.onMetricCollected(metric));
  }
}
```

**Benefícios**:
- Desacoplamento de notificações
- Múltiplos observadores
- Extensibilidade de métricas

### **Repository Pattern**
```typescript
interface IRepository<T, K = string> {
  findById(id: K): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: K, entity: Partial<T>): Promise<T | null>;
  delete(id: K): Promise<boolean>;
}
```

**Benefícios**:
- Abstração de acesso a dados
- Testabilidade com mocks
- Troca de implementações

## 🔄 Fluxo de Dados

### **Criação de Paciente**
```
1. tRPC Router recebe requisição
2. CreatePatientUseCase é executado
3. Patient entity é criada com validações
4. PatientRepository persiste no banco
5. Resposta é retornada ao cliente
```

### **Análise de Sintomas**
```
1. tRPC Router recebe sintomas
2. AnalyzeSymptomsUseCase é executado
3. AIProviderFactory cria provedores
4. Strategy executa análise
5. Métricas são coletadas
6. Resultado é retornado
```

## 📊 Análise de Complexidade

### **Operações de Banco de Dados**
- **Busca por ID**: O(1) - Índice de chave primária
- **Busca paginada**: O(log n) - Índices otimizados
- **Inserção**: O(1) - Inserção direta
- **Atualização**: O(1) - Busca por índice + update

### **Validações de Domínio**
- **Validação CPF**: O(1) - Algoritmo de tamanho fixo
- **Validação Email**: O(1) - Regex de tamanho limitado
- **Cálculo de idade**: O(1) - Operações matemáticas simples

### **Análise de IA**
- **Single Provider**: O(n) - n = número de sintomas
- **Consensus Strategy**: O(p×n) - p = provedores, n = sintomas
- **Fallback Strategy**: O(p×n) no pior caso

### **Sistema de Cache**
- **InMemory Cache**: O(1) - Map operations
- **LRU Cache**: O(1) - Doubly linked list + hash map
- **TTL Cache**: O(1) get/set, O(n) cleanup

## 🛡️ Tratamento de Erros

### **Hierarquia de Erros**
```typescript
abstract class DomainError extends Error {
  abstract code: string;
}

class ValidationError extends DomainError {
  code = 'VALIDATION_ERROR';
}

class BusinessRuleError extends DomainError {
  code = 'BUSINESS_RULE_ERROR';
}
```

### **Error Boundaries**
- Cada camada trata seus próprios erros
- Propagação controlada entre camadas
- Logging estruturado de erros

## 🔧 Configuração e Extensibilidade

### **Adicionando Novo Provedor de IA**
1. Implementar interface `IAIProvider`
2. Registrar no `AIProviderFactory`
3. Configurar variáveis de ambiente
4. Adicionar testes unitários

### **Adicionando Nova Entidade**
1. Criar entidade na camada de domínio
2. Definir value objects necessários
3. Implementar repository
4. Criar casos de uso
5. Adicionar rotas tRPC

### **Adicionando Nova Estratégia de Análise**
1. Implementar `IAIAnalysisStrategy`
2. Registrar no mapa de estratégias
3. Adicionar testes específicos
4. Documentar comportamento

## 📈 Métricas e Monitoramento

### **Métricas Coletadas**
- Tempo de resposta por endpoint
- Taxa de sucesso/erro por provedor
- Uso de cache (hit/miss ratio)
- Contadores de operações de banco

### **Health Checks**
- Status dos provedores de IA
- Conectividade do banco de dados
- Uso de memória e CPU
- Latência de rede

## 🚀 Escalabilidade

### **Horizontal Scaling**
- Stateless application design
- Database connection pooling
- Cache distribuído (Redis ready)
- Load balancer ready

### **Vertical Scaling**
- Otimização de queries
- Índices de banco otimizados
- Memory-efficient data structures
- Lazy loading strategies

## 🔐 Segurança

### **Data Protection**
- Validação rigorosa de entrada
- Sanitização de dados
- Criptografia de dados sensíveis
- Audit logging

### **Access Control**
- Interface-based security
- Role-based access (preparado)
- Rate limiting (preparado)
- CORS configuration

## 🧪 Testabilidade

### **Dependency Injection**
- Todas as dependências são injetadas
- Interfaces bem definidas
- Mocking facilitado

### **Test Doubles**
- Mock repositories
- Stub AI providers
- Fake metrics collectors
- In-memory databases

### **Test Coverage**
- Unit tests: 95%+ domain layer
- Integration tests: 90%+ use cases
- Contract tests: API interfaces
- Performance tests: Critical paths

## 📝 Documentação de Código

### **Comentários JSDoc**
- Todas as interfaces públicas documentadas
- Complexidade algorítmica especificada
- Exemplos de uso incluídos
- Parâmetros e retornos detalhados

### **Type Safety**
- TypeScript strict mode
- Branded types para IDs
- Discriminated unions
- Generic constraints

## 🔄 Continuous Integration

### **Quality Gates**
- Minimum test coverage: 90%
- No TypeScript errors
- Linting rules compliance
- Security vulnerability scan

### **Automated Testing**
- Unit tests on every commit
- Integration tests on PR
- Performance regression tests
- Contract tests for APIs

---

Esta arquitetura garante que o VITAIA seja:
- **Testável**: Cada componente pode ser testado isoladamente
- **Manutenível**: Mudanças são localizadas e controladas
- **Extensível**: Novos recursos podem ser adicionados facilmente
- **Escalável**: Pode crescer horizontalmente e verticalmente
- **Confiável**: Tratamento robusto de erros e falhas