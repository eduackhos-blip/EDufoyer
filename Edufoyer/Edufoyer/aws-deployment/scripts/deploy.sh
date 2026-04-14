#!/bin/bash

# AWS Deployment Script for Educational Platform
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="educational-platform"
REGION="us-east-1"
KEY_PAIR_NAME=""
INSTANCE_TYPE="t3.medium"
DOMAIN_NAME=""

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

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    print_success "AWS CLI is installed"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Deploy CloudFormation stack
deploy_infrastructure() {
    print_status "Deploying AWS infrastructure..."
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
        print_warning "Stack $STACK_NAME already exists. Updating..."
        aws cloudformation update-stack \
            --stack-name $STACK_NAME \
            --template-body file://infrastructure/cloudformation-template.yaml \
            --parameters ParameterKey=KeyPairName,ParameterValue=$KEY_PAIR_NAME \
                       ParameterKey=InstanceType,ParameterValue=$INSTANCE_TYPE \
                       ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME \
            --capabilities CAPABILITY_IAM \
            --region $REGION
    else
        print_status "Creating new stack..."
        aws cloudformation create-stack \
            --stack-name $STACK_NAME \
            --template-body file://infrastructure/cloudformation-template.yaml \
            --parameters ParameterKey=KeyPairName,ParameterValue=$KEY_PAIR_NAME \
                       ParameterKey=InstanceType,ParameterValue=$INSTANCE_TYPE \
                       ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME \
            --capabilities CAPABILITY_IAM \
            --region $REGION
    fi
    
    print_status "Waiting for stack deployment to complete..."
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION || \
    aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $REGION
    
    print_success "Infrastructure deployed successfully"
}

# Get stack outputs
get_outputs() {
    print_status "Getting stack outputs..."
    
    WEB_SERVER_IP=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`WebServerPublicIP`].OutputValue' \
        --output text)
    
    FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
        --output text)
    
    CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontURL`].OutputValue' \
        --output text)
    
    print_success "Stack outputs retrieved"
    echo "Web Server IP: $WEB_SERVER_IP"
    echo "Frontend Bucket: $FRONTEND_BUCKET"
    echo "CloudFront URL: $CLOUDFRONT_URL"
}

# Build and deploy frontend
deploy_frontend() {
    print_status "Building and deploying frontend..."
    
    # Build the React app
    cd ../final
    npm install
    npm run build
    
    # Upload to S3
    aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete
    
    print_success "Frontend deployed to S3"
}

# Deploy backend
deploy_backend() {
    print_status "Deploying backend to EC2..."
    
    # Create deployment package
    cd ../backend
    tar -czf backend-deployment.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=*.log \
        .
    
    # Copy to EC2
    scp -i ~/.ssh/$KEY_PAIR_NAME.pem backend-deployment.tar.gz ec2-user@$WEB_SERVER_IP:/tmp/
    
    # Deploy on EC2
    ssh -i ~/.ssh/$KEY_PAIR_NAME.pem ec2-user@$WEB_SERVER_IP << 'EOF'
        cd /var/www/educational-platform
        sudo rm -rf *
        sudo tar -xzf /tmp/backend-deployment.tar.gz
        sudo chown -R ec2-user:ec2-user .
        
        # Install dependencies
        npm install --production
        
        # Install PM2 if not already installed
        npm install -g pm2
        
        # Start application with PM2
        pm2 delete all || true
        pm2 start server.js --name "educational-platform"
        pm2 save
        pm2 startup
EOF
    
    print_success "Backend deployed successfully"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up CloudWatch monitoring..."
    
    # Create CloudWatch dashboard
    aws cloudwatch put-dashboard \
        --dashboard-name "EducationalPlatform-Dashboard" \
        --dashboard-body file://monitoring/dashboard.json \
        --region $REGION
    
    print_success "Monitoring setup completed"
}

# Main deployment function
main() {
    print_status "Starting AWS deployment for Educational Platform..."
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --key-pair)
                KEY_PAIR_NAME="$2"
                shift 2
                ;;
            --instance-type)
                INSTANCE_TYPE="$2"
                shift 2
                ;;
            --domain)
                DOMAIN_NAME="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --key-pair KEY_PAIR_NAME    AWS Key Pair name (required)"
                echo "  --instance-type TYPE        EC2 instance type (default: t3.medium)"
                echo "  --domain DOMAIN_NAME        Domain name (optional)"
                echo "  --region REGION             AWS region (default: us-east-1)"
                echo "  --help                      Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option $1"
                exit 1
                ;;
        esac
    done
    
    # Validate required parameters
    if [ -z "$KEY_PAIR_NAME" ]; then
        print_error "Key pair name is required. Use --key-pair option."
        exit 1
    fi
    
    # Check dependencies
    check_aws_cli
    check_dependencies
    
    # Deploy infrastructure
    deploy_infrastructure
    
    # Get outputs
    get_outputs
    
    # Deploy applications
    deploy_frontend
    deploy_backend
    
    # Setup monitoring
    setup_monitoring
    
    print_success "Deployment completed successfully!"
    print_status "Your application is now available at:"
    echo "  Frontend: $CLOUDFRONT_URL"
    echo "  Backend API: http://$WEB_SERVER_IP:5000"
    echo "  Health Check: http://$WEB_SERVER_IP:5000/health"
}

# Run main function
main "$@"

