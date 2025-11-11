# VITAIA - Medical AI Assistant
# Dockerfile para desenvolvimento e produção

FROM node:20-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Stage de dependências
FROM base AS deps
RUN pnpm install --frozen-lockfile

# Stage de build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build da aplicação
ENV NODE_ENV=production
RUN pnpm run build

# Stage de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vitaia

# Copiar arquivos necessários
COPY --from=builder --chown=vitaia:nodejs /app/dist ./dist
COPY --from=builder --chown=vitaia:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=vitaia:nodejs /app/package.json ./package.json
COPY --from=builder --chown=vitaia:nodejs /app/drizzle ./drizzle

USER vitaia

EXPOSE 5000

ENV PORT=5000
ENV HOST=0.0.0.0

CMD ["node", "dist/index.js"]
