# VITAIA - Guia de IA Multi-Provedor

## 🧠 Visão Geral

O VITAIA agora suporta **múltiplos provedores de IA** para análise médica, permitindo que você use **OpenAI ChatGPT**, **Google Gemini** e **DeepSeek** de forma integrada e inteligente.

## 🚀 Configuração Rápida

### 1. Configurar Chaves de API

Edite o arquivo `.env` e adicione suas chaves de API:

```bash
# OpenAI/ChatGPT
OPENAI_API_KEY=sk-your-openai-key-here

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key-here

# DeepSeek
DEEPSEEK_API_KEY=your-deepseek-api-key-here

# Configurações
DEFAULT_AI_PROVIDER=gemini
ENABLE_MULTI_PROVIDER=true
```

### 2. Obter Chaves de API

#### OpenAI ChatGPT

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Crie uma conta ou faça login
3. Vá em "API Keys" e crie uma nova chave
4. **Modelo usado**: GPT-4o (mais avançado)

#### Google Gemini

1. Acesse [ai.google.dev](https://ai.google.dev)
2. Clique em "Get API Key"
3. Crie um projeto no Google Cloud se necessário
4. **Modelo usado**: Gemini 2.0 Flash (rápido e eficiente)

#### DeepSeek

1. Acesse [platform.deepseek.com](https://platform.deepseek.com)
2. Crie uma conta
3. Vá em "API Keys" e gere uma chave
4. **Modelo usado**: DeepSeek Reasoner (especializado em raciocínio)

## 🎯 Características de Cada Provedor

### 🧠 OpenAI ChatGPT (GPT-4o)

- **Melhor para**: Casos complexos, análise detalhada
- **Pontos fortes**: Raciocínio avançado, suporte a imagens
- **Uso recomendado**: Diagnósticos difíceis, segunda opinião
- **Custo**: Médio-alto

### ✨ Google Gemini (2.0 Flash)

- **Melhor para**: Análises rápidas, diagnósticos gerais
- **Pontos fortes**: Velocidade, contexto extenso, multimodal
- **Uso recomendado**: Triagem inicial, análise de rotina
- **Custo**: Baixo-médio

### ⚡ DeepSeek (Reasoner)

- **Melhor para**: Raciocínio médico profundo
- **Pontos fortes**: Análise lógica, custo-benefício
- **Uso recomendado**: Casos que precisam de raciocínio estruturado
- **Custo**: Baixo

## 🔧 Como Usar

### 1. Interface do Paciente

Na página de detalhes do paciente, você encontrará:

- **Aba "Análise de IA"**: Ferramentas de análise médica
- **Aba "Config. IA"**: Configurações e status dos provedores

### 2. Tipos de Análise Disponíveis

#### 📋 Diagnóstico Diferencial

```typescript
// Entrada:
- Sintomas do paciente
- Resultados de exames (opcional)
- Histórico médico (opcional)
- Provedor específico (opcional)

// Saída:
- Top 5 diagnósticos diferenciais
- Características clínicas de apoio
- Testes diagnósticos recomendados
- Sinais de alerta
- Próximos passos
```

#### 💊 Plano de Tratamento

```typescript
// Entrada:
- Diagnóstico estabelecido
- Perfil do paciente
- Especialidade médica (opcional)

// Saída:
- Prioridades de tratamento imediato
- Intervenções farmacológicas
- Intervenções não-farmacológicas
- Parâmetros de monitoramento
- Cronograma de acompanhamento
```

#### 🧪 Análise Laboratorial

```typescript
// Entrada:
- Resultados laboratoriais
- Contexto clínico

// Saída:
- Valores anormais identificados
- Significado clínico
- Possíveis causas/condições
- Testes de acompanhamento
- Achados urgentes
```

#### 👥 Consenso Multi-Provedor

```typescript
// Entrada:
- Caso clínico completo
- Provedores selecionados

// Saída:
- Análise de cada provedor
- Resumo de consenso
- Nível de confiança
- Pontos de divergência
```

## 🛡️ Segurança e Conformidade

### Proteção de Dados

- ✅ Dados criptografados em trânsito
- ✅ Não armazenamento permanente nos provedores
- ✅ Logs de auditoria completos
- ✅ Conformidade LGPD

### Limitações Importantes

- ⚠️ **IA é auxiliar, não substituto médico**
- ⚠️ **Sempre revisar sugestões clinicamente**
- ⚠️ **Não usar para emergências médicas**
- ⚠️ **Validar com diretrizes clínicas**

## 🔄 Fallback Automático

O sistema possui fallback inteligente:

1. **Provedor principal falha** → Tenta Gemini automaticamente
2. **Múltiplos provedores offline** → Exibe aviso claro
3. **Verificação de saúde** → Monitora status a cada 5 minutos

## 📊 Monitoramento

### Status dos Provedores

- 🟢 **Online**: Funcionando normalmente
- 🔴 **Offline**: Indisponível ou erro de configuração
- ⚠️ **Aviso**: Apenas um provedor disponível

### Métricas de Uso

- Tokens consumidos por provedor
- Tempo de resposta
- Taxa de sucesso
- Custos estimados

## 🎛️ Configurações Avançadas

### Variáveis de Ambiente Completas

```bash
# URLs customizadas (opcional)
OPENAI_API_URL=https://api.openai.com/v1
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# Configurações de comportamento
DEFAULT_AI_PROVIDER=gemini          # openai, gemini, deepseek
ENABLE_MULTI_PROVIDER=true          # Habilita fallback automático
```

### Personalização por Especialidade

O sistema pode ser configurado para usar diferentes provedores baseado na especialidade médica:

```typescript
// Exemplo de configuração futura
const specialtyProviders = {
  cardiologia: "openai", // Casos complexos
  pediatria: "gemini", // Análise rápida
  radiologia: "deepseek", // Raciocínio estruturado
};
```

## 🚨 Solução de Problemas

### Erro: "API key not configured"

1. Verifique se a chave está no arquivo `.env`
2. Reinicie o servidor após adicionar a chave
3. Confirme que a chave está válida no provedor

### Erro: "Provider offline"

1. Verifique conexão com internet
2. Confirme se a chave de API não expirou
3. Verifique limites de uso do provedor

### Erro: "Failed to generate suggestions"

1. Tente com outro provedor
2. Verifique se o texto de entrada não está muito longo
3. Consulte logs do servidor para detalhes

## 📈 Roadmap Futuro

### Próximas Funcionalidades

- [ ] **Claude (Anthropic)** como 4º provedor
- [ ] **Análise de imagens médicas** multi-provedor
- [ ] **Especialização automática** por área médica
- [ ] **Métricas de qualidade** por provedor
- [ ] **Configuração por usuário** individual
- [ ] **API de consenso** para casos críticos

### Melhorias Planejadas

- [ ] **Cache inteligente** para reduzir custos
- [ ] **Análise de sentimento** das respostas
- [ ] **Comparação automática** entre provedores
- [ ] **Relatórios de uso** detalhados
- [ ] **Integração com guidelines** médicos

## 💡 Dicas de Uso

### Para Máxima Eficiência

1. **Use Gemini** para triagem inicial (rápido e barato)
2. **Use ChatGPT** para casos complexos (mais detalhado)
3. **Use DeepSeek** para raciocínio estruturado (custo-efetivo)
4. **Use Consenso** apenas para casos críticos (mais caro)

### Para Reduzir Custos

1. Configure Gemini como provedor padrão
2. Use consenso multi-provedor com parcimônia
3. Seja específico nas consultas para respostas mais diretas
4. Monitore uso através da aba de configurações

### Para Máxima Qualidade

1. Forneça contexto clínico detalhado
2. Use consenso multi-provedor para casos difíceis
3. Compare respostas entre provedores
4. Sempre valide com conhecimento médico

## 📞 Suporte

Para dúvidas ou problemas:

- 📧 Email: vitaia@medical-ai.com
- 📚 Documentação: [docs.vitaia.com](https://docs.vitaia.com)
- 🐛 Issues: GitHub Issues

---

**VITAIA - A IA da Vida** 🧬💚
_Transformando a medicina através da inteligência artificial responsável_
