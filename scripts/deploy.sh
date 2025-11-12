#!/bin/bash

# VITAIA Medical AI - Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 VITAIA Medical AI - Production Deployment"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check required commands
check_dependencies() {
    print_status "Checking dependencies..."
    
    local deps=("docker" "docker-compose" "node" "npm")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            print_error "$dep is not installed"
            exit 1
        fi
    done
    
    print_success "All dependencies are installed"
}

# Validate environment configuration
validate_environment() {
    print_status "Validating environment configuration..."
    
    if [[ ! -f ".env" ]]; then
        print_error ".env file not found. Copy .env.production to .env and configure it."
        exit 1
    fi
    
    # Check critical environment variables
    source .env
    
    local required_vars=("JWT_SECRET" "DATABASE_URL")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            print_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if JWT_SECRET is the default (insecure)
    if [[ "$JWT_SECRET" == "your-super-secure-jwt-secret-here-change-this" ]]; then
        print_error "JWT_SECRET is still set to default value. Please change it!"
        exit 1
    fi
    
    # Check if at least one AI provider is configured
    if [[ -z "$OPENAI_API_KEY" && -z "$GEMINI_API_KEY" && -z "$DEEPSEEK_API_KEY" ]]; then
        print_warning "No AI provider API keys configured. Some features will not work."
    fi
    
    print_success "Environment validation passed"
}

# Run security checks
security_check() {
    print_status "Running security checks..."
    
    # Check for security vulnerabilities
    npm audit --audit-level=moderate
    
    # Check file permissions
    find . -name "*.sh" -exec chmod +x {} \;
    
    print_success "Security checks completed"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    # Install dependencies
    npm ci --only=production
    
    # Run tests
    print_status "Running tests..."
    npm run test
    
    # Build the application
    npm run build
    
    print_success "Application built successfully"
}

# Deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Build new images
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if docker-compose ps | grep -q "unhealthy"; then
        print_error "Some services are unhealthy"
        docker-compose logs
        exit 1
    fi
    
    print_success "Docker deployment completed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations inside the app container
    docker-compose exec app npm run db:push
    
    print_success "Database migrations completed"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if application is responding
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f http://localhost:5000/health &> /dev/null; then
            print_success "Application is responding"
            break
        fi
        
        print_status "Attempt $attempt/$max_attempts: Waiting for application..."
        sleep 5
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        print_error "Application failed to start"
        docker-compose logs app
        exit 1
    fi
    
    # Check API status
    local status_response=$(curl -s http://localhost:5000/api/status)
    if echo "$status_response" | grep -q '"status":"operational"'; then
        print_success "API is operational"
    else
        print_error "API is not operational"
        echo "$status_response"
        exit 1
    fi
    
    print_success "Deployment verification completed"
}

# Cleanup old resources
cleanup() {
    print_status "Cleaning up old resources..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    print_success "Cleanup completed"
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    
    check_dependencies
    validate_environment
    security_check
    build_application
    deploy_docker
    run_migrations
    verify_deployment
    cleanup
    
    print_success "🎉 VITAIA Medical AI deployed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "  - Application URL: http://localhost:5000"
    echo "  - Health Check: http://localhost:5000/health"
    echo "  - API Status: http://localhost:5000/api/status"
    echo ""
    echo "📝 Next Steps:"
    echo "  1. Configure SSL certificates for HTTPS"
    echo "  2. Set up monitoring and alerting"
    echo "  3. Configure backup procedures"
    echo "  4. Review security settings"
    echo ""
    echo "📚 Documentation: ./MULTI_PROVIDER_AI_GUIDE.md"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"