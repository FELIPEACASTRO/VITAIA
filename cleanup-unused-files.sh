#!/bin/bash

# Script para limpeza de arquivos não utilizados
# Remove arquivos temporários, logs e artefatos de desenvolvimento

echo "🧹 Iniciando limpeza de arquivos não utilizados..."

# Remove arquivos de log
find . -name "*.log" -type f -delete
echo "✅ Arquivos de log removidos"

# Remove arquivos temporários
find . -name "*.tmp" -type f -delete
find . -name "*.temp" -type f -delete
echo "✅ Arquivos temporários removidos"

# Remove cache de node_modules desnecessário
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Cache do node_modules limpo"
fi

# Remove arquivos de backup
find . -name "*.bak" -type f -delete
find . -name "*~" -type f -delete
echo "✅ Arquivos de backup removidos"

# Remove arquivos de IDE
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete
echo "✅ Arquivos de sistema removidos"

# Remove coverage antigo se existir
if [ -d "coverage-old" ]; then
    rm -rf coverage-old
    echo "✅ Coverage antigo removido"
fi

# Remove builds antigos
if [ -d "dist-old" ]; then
    rm -rf dist-old
    echo "✅ Builds antigos removidos"
fi

# Lista arquivos grandes (>10MB) para revisão manual
echo "📊 Arquivos grandes encontrados (>10MB):"
find . -type f -size +10M -not -path "./node_modules/*" -not -path "./.git/*" -exec ls -lh {} \; 2>/dev/null || echo "Nenhum arquivo grande encontrado"

echo "🎉 Limpeza concluída!"
echo ""
echo "📈 Estatísticas do projeto:"
echo "- Linhas de código TypeScript: $(find . -name "*.ts" -not -path "./node_modules/*" -exec wc -l {} \; | awk '{sum+=$1} END {print sum}')"
echo "- Arquivos de teste: $(find . -name "*.test.ts" -o -name "*.spec.ts" | wc -l)"
echo "- Tamanho total (sem node_modules): $(du -sh --exclude=node_modules . | cut -f1)"