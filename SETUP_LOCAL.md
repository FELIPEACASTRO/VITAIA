# 🚀 VITAIA - Setup Local com Docker

Guia completo para executar a aplicação VITAIA localmente usando Docker.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** (versão 20.10 ou superior)
  - [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (versão 2.0 ou superior)
  - Geralmente já vem com Docker Desktop
- **Git** (para clonar o repositório)

---

## 🛠️ Passo a Passo - Setup Inicial

### 1️⃣ **Clone o Repositório (se ainda não tiver)**

```bash
git clone <url-do-repositorio>
cd vitaia
```

### 2️⃣ **Configure as Variáveis de Ambiente**

Copie o arquivo de exemplo e edite conforme necessário:

```bash
cp .env.example .env
```

**Edite o arquivo `.env`** e configure:
- ✅ **JWT_SECRET**: Altere para uma string aleatória segura em produção
- ⚙️ **OAuth** (Opcional): Configure se for usar autenticação OAuth
- 🤖 **OpenAI** (Opcional): Configure se for usar recursos de IA

**Para desenvolvimento local, os valores padrão já funcionam!**

### 3️⃣ **Execute com Docker Compose**

```bash
docker-compose up -d
```

Este comando irá:
- 📦 Baixar as imagens necessárias (PostgreSQL, Node.js)
- 🗄️ Criar o banco de dados PostgreSQL
- 🏗️ Construir a aplicação VITAIA
- 🚀 Iniciar os serviços

**Aguarde alguns minutos na primeira execução** (Docker precisa baixar as imagens).

### 4️⃣ **Aplicar Migrações do Banco de Dados**

Após os containers subirem, execute:

```bash
# Entrar no container da aplicação
docker exec -it vitaia-app sh

# Dentro do container, executar migrations
cd /app
npm run db:push

# Sair do container
exit
```

### 5️⃣ **Acesse a Aplicação**

Abra o navegador e acesse:

```
http://localhost:5000
```

✨ **Pronto! A VITAIA está rodando localmente!**

---

## 📊 Comandos Úteis

### **Ver logs em tempo real**
```bash
# Logs de todos os serviços
docker-compose logs -f

# Logs apenas da aplicação
docker-compose logs -f app

# Logs apenas do banco de dados
docker-compose logs -f postgres
```

### **Parar os serviços**
```bash
docker-compose down
```

### **Parar e remover volumes (⚠️ APAGA O BANCO DE DADOS)**
```bash
docker-compose down -v
```

### **Reiniciar os serviços**
```bash
docker-compose restart
```

### **Rebuildar a aplicação (após alterações no código)**
```bash
docker-compose up -d --build
```

### **Acessar o container da aplicação**
```bash
docker exec -it vitaia-app sh
```

### **Acessar o banco de dados PostgreSQL**
```bash
docker exec -it vitaia-postgres psql -U vitaia -d vitaia_db
```

---

## 👤 Usuário e Permissões

### **Usuário no Container**

A aplicação roda com um **usuário não-root** para segurança:

- **Usuário**: `vitaia`
- **UID**: 1001
- **GID**: 1001

Este usuário é criado automaticamente no Dockerfile e possui permissões apenas para:
- Ler arquivos da aplicação
- Escrever logs
- Conectar ao banco de dados

### **Banco de Dados**

Credenciais padrão (desenvolvimento):
- **Host**: `localhost` (ou `postgres` dentro do Docker)
- **Port**: `5432`
- **Database**: `vitaia_db`
- **User**: `vitaia`
- **Password**: `vitaia_dev_password`

**⚠️ IMPORTANTE**: Altere essas credenciais em produção!

---

## 🔧 Desenvolvimento Local (Sem Docker)

Se preferir rodar sem Docker (desenvolvimento):

### 1. **Instalar Dependências**
```bash
npm install
# ou
pnpm install
```

### 2. **Configurar PostgreSQL Local**

Instale PostgreSQL e crie o banco:
```sql
CREATE DATABASE vitaia_db;
CREATE USER vitaia WITH PASSWORD 'vitaia_dev_password';
GRANT ALL PRIVILEGES ON DATABASE vitaia_db TO vitaia;
```

### 3. **Configurar `.env`**
```bash
cp .env.example .env
# Edite DATABASE_URL para apontar para seu PostgreSQL local
```

### 4. **Executar Migrações**
```bash
npm run db:push
```

### 5. **Iniciar em Modo Desenvolvimento**
```bash
npm run dev
```

Acesse: `http://localhost:5000`

---

## 🐛 Resolução de Problemas

### **Erro: "Port 5000 already in use"**
```bash
# Encontrar processo usando a porta
lsof -i :5000

# Matar o processo (substitua <PID>)
kill -9 <PID>

# Ou altere a porta no docker-compose.yml
ports:
  - "3000:5000"  # Muda para porta 3000 no host
```

### **Erro: "Connection refused" ao banco de dados**
```bash
# Verificar se o PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs do PostgreSQL
docker-compose logs postgres

# Reiniciar o serviço
docker-compose restart postgres
```

### **Erro: "Migration failed"**
```bash
# Force push do schema
docker exec -it vitaia-app sh
npm run db:push --force
```

### **Container não inicia**
```bash
# Ver logs detalhados
docker-compose logs app

# Reconstruir sem cache
docker-compose build --no-cache
docker-compose up -d
```

---

## 📁 Estrutura do Projeto Docker

```
vitaia/
├── Dockerfile              # Configuração da imagem Docker
├── docker-compose.yml      # Orquestração de serviços
├── .env.example           # Exemplo de variáveis de ambiente
├── .env                   # Suas variáveis (não versionado)
├── package.json           # Dependências Node.js
├── drizzle/              # Schemas do banco de dados
├── server/               # Backend (Express + tRPC)
├── client/               # Frontend (React + Vite)
└── dist/                 # Build de produção (gerado)
```

---

## 🔒 Segurança - Produção

Antes de fazer deploy em produção:

1. ✅ Altere `JWT_SECRET` para valor aleatório forte
2. ✅ Altere senhas do PostgreSQL
3. ✅ Configure HTTPS/SSL
4. ✅ Configure OAuth real (não use valores padrão)
5. ✅ Use secrets manager (não .env em produção)
6. ✅ Configure firewall/security groups
7. ✅ Ative logs e monitoring

---

## 📞 Suporte

Problemas? Dúvidas?
- Verifique a [Documentação completa](./README.md)
- Abra uma issue no repositório
- Consulte os logs: `docker-compose logs -f`

---

**✨ VITAIA - A IA da Vida | Medical AI Assistant**
