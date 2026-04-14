#!/bin/bash

# Frontend Update Script
# This script updates the frontend application on S3 and CloudFront

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_BUCKET=""
CLOUDFRONT_DISTRIBUTION_ID=""
FRONTEND_DIR="../final"
REGION="us-east-1"

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

# Function to show usage
show_usage() {
    echo "Usage: $0 --bucket BUCKET_NAME [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  --bucket BUCKET_NAME    S3 bucket name for frontend"
    echo ""
    echo "Optional:"
    echo "  --distribution-id ID    CloudFront distribution ID for cache invalidation"
    echo "  --frontend-dir DIR      Frontend directory path (default: ../final)"
    echo "  --region REGION         AWS region (default: us-east-1)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --bucket educational-platform-frontend-123456789012"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --bucket)
            FRONTEND_BUCKET="$2"
            shift 2
            ;;
        --distribution-id)
            CLOUDFRONT_DISTRIBUTION_ID="$2"
            shift 2
            ;;
        --frontend-dir)
            FRONTEND_DIR="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$FRONTEND_BUCKET" ]; then
    print_error "Missing required parameter: --bucket"
    show_usage
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

print_status "Updating frontend on S3 bucket: $FRONTEND_BUCKET"

# Build the React app
print_status "Building React application..."
cd "$FRONTEND_DIR"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Build the application
print_status "Building application..."
npm run build

if [ ! -d "dist" ]; then
    print_error "Build failed. No dist directory found."
    exit 1
fi

print_success "Application built successfully"

# Upload to S3
print_status "Uploading to S3..."
aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete --region $REGION

print_success "Files uploaded to S3"

# Invalidate CloudFront cache if distribution ID is provided
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    print_status "Invalidating CloudFront cache..."
    
    # Create invalidation
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text \
        --region $REGION)
    
    print_success "CloudFront cache invalidation created: $INVALIDATION_ID"
    
    # Wait for invalidation to complete
    print_status "Waiting for cache invalidation to complete..."
    aws cloudfront wait invalidation-completed \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --id $INVALIDATION_ID \
        --region $REGION
    
    print_success "CloudFront cache invalidation completed"
else
    print_warning "No CloudFront distribution ID provided. Cache will not be invalidated."
    print_warning "You may need to manually invalidate the cache or wait for TTL to expire."
fi

print_success "Frontend update completed!"

# Get the CloudFront URL
CLOUDFRONT_URL=$(aws cloudfront get-distribution \
    --id $CLOUDFRONT_DISTRIBUTION_ID \
    --query 'Distribution.DomainName' \
    --output text \
    --region $REGION 2>/dev/null || echo "Unknown")

print_status "Frontend is now available at:"
echo "  S3 Bucket: s3://$FRONTEND_BUCKET"
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "  CloudFront URL: https://$CLOUDFRONT_URL"
fi

























