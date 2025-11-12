# VITAIA Medical AI - Production Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build dependencies and application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm@latest

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

# Set working directory
WORKDIR /app

# Install only production system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates

# Create non-root user for security
RUN addgroup -g 1001 -S vitaia && \
    adduser -S vitaia -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=vitaia:vitaia /app/dist ./dist
COPY --from=builder --chown=vitaia:vitaia /app/client/dist ./client/dist
COPY --from=builder --chown=vitaia:vitaia /app/package.json ./
COPY --from=builder --chown=vitaia:vitaia /app/drizzle ./drizzle

# Install only production dependencies
RUN npm install -g pnpm@latest && \
    pnpm install --prod --frozen-lockfile && \
    pnpm store prune && \
    npm cache clean --force

# Set proper permissions
RUN chown -R vitaia:vitaia /app

# Switch to non-root user
USER vitaia

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL maintainer="VITAIA Team <vitaia@medical-ai.com>"
LABEL version="1.0.0"
LABEL description="VITAIA Medical AI - Multi-Provider AI for Healthcare"
LABEL org.opencontainers.image.title="VITAIA Medical AI"
LABEL org.opencontainers.image.description="Advanced medical AI platform with multi-provider support"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="VITAIA"