# VITAIA - A IA da Vida

**Inteligência Artificial Médica para Diagnóstico e Tratamento**

![VITAIA](https://img.shields.io/badge/VITAIA-v1.0.0-10B981?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green?style=flat-square)

## 🎯 Visão Geral

VITAIA é uma plataforma inovadora de inteligência artificial médica que auxilia profissionais de saúde na tomada de decisões clínicas. Combinando análise de sintomas, resultados de exames, histórico médico e diretrizes clínicas atualizadas, VITAIA fornece sugestões de diagnóstico, tratamento e medicação baseadas em IA.

**Conceito:** "Vita" (vida em latim) + "AI" (Inteligência Artificial) = A IA da Vida

### ✨ Características Principais

- **Multi-Especialidade**: Suporte para 50+ especialidades médicas brasileiras
- **Análise Inteligente**: Processamento de sintomas, exames e histórico médico
- **Sugestões de IA**: Diagnóstico diferencial, tratamentos e medicações recomendadas
- **Análise de Imagens**: Suporte para radiografias, tomografias e ressonâncias
- **Explicabilidade**: Raciocínio detalhado por trás de cada sugestão
- **Conformidade LGPD**: Proteção completa de dados de pacientes
- **Auditoria**: Logs detalhados de todas as operações
- **Dashboard Premium**: Interface moderna com dark/light mode
- **Pesquisa Clínica**: Framework para estudos clínicos piloto
- **Integração EHR**: Suporte HL7/FHIR para sistemas de prontuário eletrônico

## 🏗️ Arquitetura

### Stack Tecnológico

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS 4 + Shadcn/UI
- Vite (build tool)
- tRPC para comunicação com backend

**Backend:**
- Express.js 4
- tRPC 11 (RPC framework)
- Node.js

**Banco de Dados:**
- PostgreSQL 14+
- Drizzle ORM

**IA & ML:**
- Google Gemini (LLM comercial)
- Clinical-BR-LlaMA-2-7B (modelo open-source)
- Análise de imagens médicas

**Autenticação & Segurança:**
- Manus OAuth
- JWT Sessions
- LGPD Compliance

## 📊 Estrutura do Banco de Dados

### 29 Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários (médicos) |
| `patients` | Dados dos pacientes |
| `consultations` | Consultas/atendimentos |
| `medicalHistory` | Histórico médico |
| `examResults` | Resultados de exames |
| `aiSuggestions` | Sugestões geradas por IA |
| `aiExplanations` | Explicabilidade das sugestões |
| `suggestionFeedback` | Feedback dos médicos |
| `patientConsent` | Consentimento LGPD |
| `medicalImages` | Imagens médicas |
| `researchProtocol` | Protocolos de pesquisa |
| `medicalSpecialties` | Especialidades médicas |
| `clinicalGuidelines` | Diretrizes clínicas |
| `specialtyMedications` | Medicações por especialidade |
| `auditLogs` | Logs de auditoria |
| ... e mais 14 tabelas de suporte |

## 🚀 Começando

### 🐳 **Opção 1: Docker (Recomendado)**

Forma mais rápida e fácil de executar localmente:

```bash
# Clonar repositório
git clone https://github.com/FELIPEACASTRO/VITAIA.git
cd VITAIA

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar com Docker Compose
docker-compose up -d

# Aplicar migrações do banco de dados
docker exec -it vitaia-app npm run db:push

# Acessar: http://localhost:5000
```

**📖 [Guia Completo de Setup Local com Docker →](./SETUP_LOCAL.md)**

### 💻 **Opção 2: Instalação Manual**

#### Pré-requisitos

- Node.js 18+
- pnpm ou npm
- PostgreSQL 14+
- Git

#### Instalação

```bash
# Clonar repositório
git clone https://github.com/FELIPEACASTRO/VITAIA.git
cd VITAIA

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar migrações do banco de dados
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

### Variáveis de Ambiente

Veja `.env.example` para configuração completa. Principais variáveis:

```env
# Banco de Dados
DATABASE_URL=postgresql://vitaia:password@localhost:5432/vitaia_db

# Autenticação
JWT_SECRET=seu_secret_seguro_aqui
VITE_APP_ID=seu_app_id_oauth

# IA & APIs (Opcional)
OPENAI_API_KEY=sua_chave_openai
BUILT_IN_FORGE_API_KEY=sua_chave_forge

# Aplicação
VITE_APP_TITLE=VITAIA
VITE_APP_LOGO=/vitaia-logo.svg
```

## 📁 Estrutura do Projeto

```
VITAIA/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilitários
│   │   └── const.ts       # Constantes e cores VITAIA
│   └── index.html
├── server/                 # Backend Express
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # Query helpers
│   └── _core/             # Infraestrutura
├── drizzle/               # Schema e migrações
│   └── schema.ts          # Definição de tabelas
├── shared/                # Código compartilhado
├── storage/               # S3 helpers
├── VITAIA_DESIGN_SYSTEM.md # Design system completo
├── ANVISA_COMPLIANCE.md   # Conformidade regulatória
└── SCALABILITY_ROADMAP.md # Roadmap de escalabilidade
```

## 🎨 Design System VITAIA

### Paleta de Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| Verde Vivo | `#10B981` | Ações positivas, sucesso |
| Azul Ciano | `#06B6D4` | Informações, destaques |
| Roxo Moderno | `#8B5CF6` | Elementos de IA |
| Vermelho Alerta | `#EF4444` | Erros, avisos críticos |
| Âmbar Aviso | `#F59E0B` | Avisos, atenção |

### Tipografia

- **Headlines**: Inter Bold (700)
- **Body**: Inter Regular (400)
- **Code**: JetBrains Mono

## 🔌 API tRPC Endpoints

### Autenticação
- `auth.me` - Obter usuário atual
- `auth.logout` - Fazer logout

### Pacientes
- `patients.create` - Criar novo paciente
- `patients.list` - Listar pacientes
- `patients.getById` - Obter detalhes do paciente
- `patients.update` - Atualizar paciente
- `patients.delete` - Deletar paciente

### Consultas
- `consultations.create` - Criar nova consulta
- `consultations.getByPatient` - Listar consultas do paciente
- `consultations.getById` - Obter detalhes da consulta

### IA
- `ai.generateSuggestions` - Gerar sugestões de diagnóstico
- `ai.analyzeImage` - Analisar imagem médica
- `ai.getSuggestionHistory` - Histórico de sugestões

### Explicabilidade
- `explanations.create` - Criar explicação
- `explanations.getById` - Obter explicação

### Feedback
- `feedback.create` - Registrar feedback
- `feedback.getStats` - Estatísticas de feedback

### Pesquisa Clínica
- `research.createProtocol` - Criar protocolo de pesquisa
- `research.enrollParticipant` - Inscrever participante
- `research.getProtocols` - Listar protocolos

## 🧪 Testes

```bash
# Executar testes unitários
pnpm test

# Executar testes de integração
pnpm test:integration

# Cobertura de testes
pnpm test:coverage
```

## 📈 Roadmap

### Curto Prazo (Próximos 3 meses)
- ✅ Explicabilidade de IA
- ✅ Dashboard LGPD
- ✅ Sistema de feedback
- ✅ Criptografia de dados
- [ ] Validação com 5-10 médicos reais
- [ ] Conformidade LGPD completa

### Médio Prazo (3-6 meses)
- ✅ Análise de imagens médicas
- ✅ Protocolos de pesquisa
- ✅ Integração HL7/FHIR
- [ ] Estudo clínico piloto
- [ ] Integração com EHR real
- [ ] Suporte a múltiplas especialidades

### Longo Prazo (6-12 meses)
- [ ] Documentação ANVISA
- [ ] Aprovação regulatória
- [ ] Escalabilidade para 1000+ médicos
- [ ] Modelo de monetização
- [ ] Expansão para América Latina

## 🔐 Segurança & Conformidade

### LGPD (Lei Geral de Proteção de Dados)
- ✅ Criptografia end-to-end
- ✅ Consentimento explícito de pacientes
- ✅ Direito ao esquecimento
- ✅ Logs de auditoria completos
- ✅ Política de retenção de dados

### Regulamentação Médica
- ✅ IA como auxílio, não substituição
- ✅ Revisão obrigatória de sugestões
- ✅ Rastreabilidade de decisões
- ✅ Conformidade com diretrizes clínicas

## 📚 Documentação

- [VITAIA_DESIGN_SYSTEM.md](./VITAIA_DESIGN_SYSTEM.md) - Design system completo
- [ANVISA_COMPLIANCE.md](./ANVISA_COMPLIANCE.md) - Conformidade regulatória
- [SCALABILITY_ROADMAP.md](./SCALABILITY_ROADMAP.md) - Roadmap de escalabilidade

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **VITAIA Team** - Desenvolvimento de IA Médica

## 📞 Suporte

Para suporte, envie um email para vitaia@medical-ai.com ou abra uma issue no GitHub.

## 🙏 Agradecimentos

- Google Gemini por fornecer LLM de alta qualidade
- PUCPR pelo modelo Clinical-BR-LlaMA-2-7B
- Comunidade médica brasileira por feedback e validação
- Manus por infraestrutura e ferramentas

---

**VITAIA - A IA da Vida** 🧬💚

*Transformando a medicina através da inteligência artificial responsável*
