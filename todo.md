# Assistente Médico de IA - TODO

## Funcionalidades Planejadas

### Autenticacao e Seguranca
- [x] Autenticacao OAuth via Manus
- [ ] Conformidade com LGPD (anonimizacao de dados sensiveis)
- [ ] Criptografia de dados em repouso e em transito
- [x] Logs de auditoria para todas as operacoes (estrutura criada)

### Gerenciamento de Pacientes
- [x] Criar/editar/deletar perfil de paciente
- [x] Armazenar historico medico do paciente
- [x] Registrar sintomas atuais
- [x] Registrar resultados de exames
- [x] Visualizar historico completo do paciente

### Integracao com IA (Abordagem Hibrida)
- [x] Integracao com LLM comercial (Gemini/OpenAI/Claude) para analises complexas
- [ ] Integracao com modelo open-source (Clinical-BR-LlaMA) para tarefas simples
- [x] Prompt engineering para sugestoes de diagnostico
- [x] Sugestoes de tratamento baseadas em IA
- [x] Sugestoes de medicacao
- [ ] Geracao de resumo de consulta (formato SOAP)
- [ ] Explicacao de diagnostico em linguagem simples
- [ ] RAG (Retrieval Augmented Generation) com protocolos medicos

### Interface de Usuario
- [x] Dashboard principal para medicos
- [x] Formulario de entrada de sintomas
- [x] Formulario de entrada de resultados de exames
- [x] Visualizacao de historico do paciente
- [x] Painel de sugestoes de IA
- [x] Interface responsiva (mobile-friendly)

### Armazenamento de Dados
- [x] Tabela de usuarios (medicos)
- [x] Tabela de pacientes
- [x] Tabela de consultas/atendimentos
- [x] Tabela de historico medico
- [x] Tabela de resultados de exames
- [x] Tabela de logs de auditoria

### Testes e Documentação
- [ ] Testes de integração com LLM
- [ ] Testes de segurança e LGPD
- [ ] Documentação de arquitetura
- [ ] Documentação de uso da aplicação
- [ ] Guia de conformidade com LGPD

## Notas Importantes

- Todos os dados sensíveis devem ser tratados com conformidade LGPD
- As sugestões de IA são apenas para auxílio ao médico, nunca substituem a decisão clínica
- Implementar revisão humana obrigatória antes de qualquer recomendação crítica
- Manter logs detalhados de todas as operações para auditoria
