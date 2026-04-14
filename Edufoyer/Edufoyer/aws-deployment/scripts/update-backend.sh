#!/bin/bash

# Backend Update Script
# This script updates the backend application on EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEB_SERVER_IP=""
KEY_PAIR_NAME=""
BACKEND_DIR="../backend"

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
    echo "Usage: $0 --ip WEB_SERVER_IP --key-pair KEY_PAIR_NAME [OPTIONS]"
    echo ""
    echo "Required:"
    echo "  --ip IP_ADDRESS        EC2 instance public IP address"
    echo "  --key-pair KEY_NAME    AWS Key Pair name"
    echo ""
    echo "Optional:"
    echo "  --backend-dir DIR      Backend directory path (default: ../backend)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --ip 54.123.45.67 --key-pair my-key-pair"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --ip)
            WEB_SERVER_IP="$2"
            shift 2
            ;;
        --key-pair)
            KEY_PAIR_NAME="$2"
            shift 2
            ;;
        --backend-dir)
            BACKEND_DIR="$2"
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
if [ -z "$WEB_SERVER_IP" ] || [ -z "$KEY_PAIR_NAME" ]; then
    print_error "Missing required parameters"
    show_usage
    exit 1
fi

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

# Check if key file exists
KEY_FILE="$HOME/.ssh/${KEY_PAIR_NAME}.pem"
if [ ! -f "$KEY_FILE" ]; then
    print_error "Key file not found: $KEY_FILE"
    print_warning "Make sure your key file is in ~/.ssh/ directory"
    exit 1
fi

print_status "Updating backend on EC2 instance: $WEB_SERVER_IP"

# Create deployment package
print_status "Creating deployment package..."
cd "$BACKEND_DIR"

# Create a clean deployment package
tar -czf backend-update.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=*.log \
    --exclude=uploads \
    --exclude=backend-update.tar.gz \
    .

print_success "Deployment package created"

# Copy to EC2
print_status "Copying files to EC2..."
scp -i "$KEY_FILE" backend-update.tar.gz ec2-user@$WEB_SERVER_IP:/tmp/

print_success "Files copied to EC2"

# Deploy on EC2
print_status "Deploying on EC2..."
ssh -i "$KEY_FILE" ec2-user@$WEB_SERVER_IP << EOF
    # Navigate to application directory
    cd /var/www/educational-platform
    
    # Stop the application
    echo "Stopping application..."
    pm2 stop educational-platform || true
    
    # Backup current version
    echo "Backing up current version..."
    sudo cp -r . ../backup-\$(date +%Y%m%d-%H%M%S) || true
    
    # Extract new version
    echo "Extracting new version..."
    sudo rm -rf *
    sudo tar -xzf /tmp/backend-update.tar.gz
    sudo chown -R ec2-user:ec2-user .
    
    # Install/update dependencies
    echo "Installing dependencies..."
    npm install --production
    
    # Start the application
    echo "Starting application..."
    pm2 start server.js --name "educational-platform"
    pm2 save
    
    # Show application status
    echo "Application status:"
    pm2 status
    
    # Clean up
    rm /tmp/backend-update.tar.gz
EOF

print_success "Backend update completed!"

# Clean up local files
rm -f backend-update.tar.gz

print_status "Backend has been successfully updated on EC2"
print_status "You can check the application status with:"
echo "  ssh -i $KEY_FILE ec2-user@$WEB_SERVER_IP 'pm2 status'"
print_status "View logs with:"
echo "  ssh -i $KEY_FILE ec2-user@$WEB_SERVER_IP 'pm2 logs educational-platform'"

























