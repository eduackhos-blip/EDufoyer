#!/bin/bash

# Health Check Script
# This script checks the health of your deployed application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEB_SERVER_IP=""
CLOUDFRONT_URL=""
KEY_PAIR_NAME=""

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
    echo "Usage: $0 --ip WEB_SERVER_IP [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  --ip IP_ADDRESS        EC2 instance public IP address"
    echo ""
    echo "Optional:"
    echo "  --cloudfront URL       CloudFront URL for frontend health check"
    echo "  --key-pair KEY_NAME    AWS Key Pair name for SSH access"
    echo "  --help                 Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --ip 54.123.45.67 --cloudfront https://d1234567890abc.cloudfront.net"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --ip)
            WEB_SERVER_IP="$2"
            shift 2
            ;;
        --cloudfront)
            CLOUDFRONT_URL="$2"
            shift 2
            ;;
        --key-pair)
            KEY_PAIR_NAME="$2"
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
if [ -z "$WEB_SERVER_IP" ]; then
    print_error "Missing required parameter: --ip"
    show_usage
    exit 1
fi

print_status "Performing health checks for Educational Platform"
echo "======================================================"

# Check backend health
print_status "Checking backend health..."
BACKEND_HEALTH_URL="http://$WEB_SERVER_IP:5000/health"

if curl -s -f "$BACKEND_HEALTH_URL" > /dev/null; then
    print_success "Backend is healthy"
    
    # Get detailed health information
    HEALTH_RESPONSE=$(curl -s "$BACKEND_HEALTH_URL")
    echo "Health Response:"
    echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    print_error "Backend health check failed"
    print_warning "Backend may not be running or accessible"
fi

# Check frontend health
if [ ! -z "$CLOUDFRONT_URL" ]; then
    print_status "Checking frontend health..."
    
    if curl -s -f "$CLOUDFRONT_URL" > /dev/null; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend health check failed"
        print_warning "Frontend may not be deployed or CloudFront may be misconfigured"
    fi
else
    print_warning "No CloudFront URL provided. Skipping frontend health check."
fi

# Check EC2 instance status (if key pair is provided)
if [ ! -z "$KEY_PAIR_NAME" ]; then
    KEY_FILE="$HOME/.ssh/${KEY_PAIR_NAME}.pem"
    if [ -f "$KEY_FILE" ]; then
        print_status "Checking EC2 instance status..."
        
        # Check if SSH is accessible
        if ssh -i "$KEY_FILE" -o ConnectTimeout=10 -o BatchMode=yes ec2-user@$WEB_SERVER_IP exit 2>/dev/null; then
            print_success "EC2 instance is accessible via SSH"
            
            # Check PM2 status
            print_status "Checking PM2 application status..."
            PM2_STATUS=$(ssh -i "$KEY_FILE" ec2-user@$WEB_SERVER_IP "pm2 status" 2>/dev/null || echo "PM2 not found")
            echo "$PM2_STATUS"
            
            # Check disk space
            print_status "Checking disk space..."
            DISK_USAGE=$(ssh -i "$KEY_FILE" ec2-user@$WEB_SERVER_IP "df -h /" 2>/dev/null || echo "Unable to check disk usage")
            echo "$DISK_USAGE"
            
            # Check memory usage
            print_status "Checking memory usage..."
            MEMORY_USAGE=$(ssh -i "$KEY_FILE" ec2-user@$WEB_SERVER_IP "free -h" 2>/dev/null || echo "Unable to check memory usage")
            echo "$MEMORY_USAGE"
            
        else
            print_error "EC2 instance is not accessible via SSH"
            print_warning "Check your security groups and key pair configuration"
        fi
    else
        print_warning "Key file not found: $KEY_FILE"
        print_warning "Cannot perform detailed EC2 health checks"
    fi
else
    print_warning "No key pair provided. Skipping detailed EC2 health checks."
fi

# Check AWS services
print_status "Checking AWS services..."

# Check if AWS CLI is available
if command -v aws &> /dev/null; then
    print_success "AWS CLI is available"
    
    # Check EC2 instance status
    print_status "Checking EC2 instance status in AWS..."
    INSTANCE_ID=$(aws ec2 describe-instances \
        --filters "Name=ip-address,Values=$WEB_SERVER_IP" \
        --query 'Reservations[0].Instances[0].InstanceId' \
        --output text 2>/dev/null || echo "Not found")
    
    if [ "$INSTANCE_ID" != "None" ] && [ "$INSTANCE_ID" != "Not found" ]; then
        INSTANCE_STATE=$(aws ec2 describe-instances \
            --instance-ids $INSTANCE_ID \
            --query 'Reservations[0].Instances[0].State.Name' \
            --output text 2>/dev/null || echo "Unknown")
        
        if [ "$INSTANCE_STATE" = "running" ]; then
            print_success "EC2 instance is running"
        else
            print_error "EC2 instance is not running. State: $INSTANCE_STATE"
        fi
    else
        print_warning "Could not find EC2 instance with IP: $WEB_SERVER_IP"
    fi
else
    print_warning "AWS CLI not available. Cannot check AWS services."
fi

print_status "Health check completed!"
echo ""
print_status "Summary:"
echo "  Backend URL: http://$WEB_SERVER_IP:5000"
if [ ! -z "$CLOUDFRONT_URL" ]; then
    echo "  Frontend URL: $CLOUDFRONT_URL"
fi
echo "  Health Check: http://$WEB_SERVER_IP:5000/health"

























