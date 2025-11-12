#!/bin/bash

# VITAIA Medical AI - Health Check Script
# This script performs comprehensive health checks on the system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
APP_URL="http://localhost:5000"
TIMEOUT=10
CRITICAL_ERRORS=0
WARNINGS=0

# Function to check HTTP endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    
    print_status "Checking $description..."
    
    local response=$(curl -s -w "%{http_code}" -o /tmp/health_response --max-time $TIMEOUT "$APP_URL$endpoint" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected_status" ]]; then
        print_success "$description is healthy"
        return 0
    else
        print_error "$description failed (HTTP $response)"
        ((CRITICAL_ERRORS++))
        return 1
    fi
}

# Function to check JSON response
check_json_endpoint() {
    local endpoint=$1
    local expected_field=$2
    local expected_value=$3
    local description=$4
    
    print_status "Checking $description..."
    
    local response=$(curl -s --max-time $TIMEOUT "$APP_URL$endpoint" 2>/dev/null || echo '{}')
    local actual_value=$(echo "$response" | jq -r ".$expected_field" 2>/dev/null || echo "null")
    
    if [[ "$actual_value" == "$expected_value" ]]; then
        print_success "$description is healthy"
        return 0
    else
        print_error "$description failed (expected: $expected_value, got: $actual_value)"
        ((CRITICAL_ERRORS++))
        return 1
    fi
}

# Function to check Docker container health
check_docker_health() {
    print_status "Checking Docker containers..."
    
    local containers=("vitaia-app" "vitaia-postgres" "vitaia-redis")
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "unknown")
            if [[ "$health" == "healthy" || "$health" == "unknown" ]]; then
                print_success "$container is running"
            else
                print_error "$container is unhealthy (status: $health)"
                ((CRITICAL_ERRORS++))
            fi
        else
            print_error "$container is not running"
            ((CRITICAL_ERRORS++))
        fi
    done
}

# Function to check database connectivity
check_database() {
    print_status "Checking database connectivity..."
    
    if docker exec vitaia-postgres pg_isready -U vitaia -d vitaia_db >/dev/null 2>&1; then
        print_success "Database is accessible"
    else
        print_error "Database is not accessible"
        ((CRITICAL_ERRORS++))
    fi
}

# Function to check Redis connectivity
check_redis() {
    print_status "Checking Redis connectivity..."
    
    if docker exec vitaia-redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is accessible"
    else
        print_error "Redis is not accessible"
        ((CRITICAL_ERRORS++))
    fi
}

# Function to check AI providers
check_ai_providers() {
    print_status "Checking AI providers status..."
    
    local response=$(curl -s --max-time $TIMEOUT "$APP_URL/api/status" 2>/dev/null || echo '{}')
    local openai=$(echo "$response" | jq -r '.aiProviders.openai' 2>/dev/null || echo "false")
    local gemini=$(echo "$response" | jq -r '.aiProviders.gemini' 2>/dev/null || echo "false")
    local deepseek=$(echo "$response" | jq -r '.aiProviders.deepseek' 2>/dev/null || echo "false")
    
    local providers_count=0
    
    if [[ "$openai" == "true" ]]; then
        print_success "OpenAI provider configured"
        ((providers_count++))
    fi
    
    if [[ "$gemini" == "true" ]]; then
        print_success "Gemini provider configured"
        ((providers_count++))
    fi
    
    if [[ "$deepseek" == "true" ]]; then
        print_success "DeepSeek provider configured"
        ((providers_count++))
    fi
    
    if [[ $providers_count -eq 0 ]]; then
        print_error "No AI providers configured"
        ((CRITICAL_ERRORS++))
    elif [[ $providers_count -eq 1 ]]; then
        print_warning "Only one AI provider configured (consider adding more for redundancy)"
        ((WARNINGS++))
    fi
}

# Function to check system resources
check_system_resources() {
    print_status "Checking system resources..."
    
    # Check disk space
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        print_error "Disk usage is critical: ${disk_usage}%"
        ((CRITICAL_ERRORS++))
    elif [[ $disk_usage -gt 80 ]]; then
        print_warning "Disk usage is high: ${disk_usage}%"
        ((WARNINGS++))
    else
        print_success "Disk usage is normal: ${disk_usage}%"
    fi
    
    # Check memory usage
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $mem_usage -gt 90 ]]; then
        print_error "Memory usage is critical: ${mem_usage}%"
        ((CRITICAL_ERRORS++))
    elif [[ $mem_usage -gt 80 ]]; then
        print_warning "Memory usage is high: ${mem_usage}%"
        ((WARNINGS++))
    else
        print_success "Memory usage is normal: ${mem_usage}%"
    fi
}

# Function to check security
check_security() {
    print_status "Checking security configuration..."
    
    local response=$(curl -s --max-time $TIMEOUT "$APP_URL/api/status" 2>/dev/null || echo '{}')
    local security_headers=$(echo "$response" | jq -r '.features.securityHeaders' 2>/dev/null || echo "false")
    local rate_limit=$(echo "$response" | jq -r '.features.rateLimit' 2>/dev/null || echo "false")
    local audit_log=$(echo "$response" | jq -r '.features.auditLog' 2>/dev/null || echo "false")
    
    if [[ "$security_headers" == "true" ]]; then
        print_success "Security headers enabled"
    else
        print_warning "Security headers disabled"
        ((WARNINGS++))
    fi
    
    if [[ "$rate_limit" == "true" ]]; then
        print_success "Rate limiting enabled"
    else
        print_warning "Rate limiting disabled"
        ((WARNINGS++))
    fi
    
    if [[ "$audit_log" == "true" ]]; then
        print_success "Audit logging enabled"
    else
        print_warning "Audit logging disabled"
        ((WARNINGS++))
    fi
}

# Function to generate health report
generate_report() {
    echo ""
    echo "============================================="
    echo "🏥 VITAIA Medical AI - Health Check Report"
    echo "============================================="
    echo "Timestamp: $(date)"
    echo "Critical Errors: $CRITICAL_ERRORS"
    echo "Warnings: $WARNINGS"
    echo ""
    
    if [[ $CRITICAL_ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
        print_success "🎉 All systems are healthy!"
        exit 0
    elif [[ $CRITICAL_ERRORS -eq 0 ]]; then
        print_warning "⚠️  System is operational with $WARNINGS warnings"
        exit 0
    else
        print_error "❌ System has $CRITICAL_ERRORS critical errors and $WARNINGS warnings"
        exit 1
    fi
}

# Main health check process
main() {
    echo "🔍 Starting VITAIA Medical AI Health Check..."
    echo ""
    
    # Basic connectivity checks
    check_endpoint "/health" "200" "Basic health endpoint"
    check_json_endpoint "/api/status" "status" "operational" "API status endpoint"
    
    # Infrastructure checks
    check_docker_health
    check_database
    check_redis
    
    # Application-specific checks
    check_ai_providers
    check_security
    
    # System resource checks
    check_system_resources
    
    # Generate final report
    generate_report
}

# Handle script interruption
trap 'print_error "Health check interrupted"; exit 1' INT TERM

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed. Please install jq first."
    exit 1
fi

# Run main function
main "$@"