#!/bin/bash

# MongoDB Atlas Setup Script
# This script helps you set up MongoDB Atlas for your educational platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "MongoDB Atlas Setup for Educational Platform"
echo "=================================================="
echo ""

print_status "Step 1: Create MongoDB Atlas Account"
echo "1. Go to https://www.mongodb.com/atlas"
echo "2. Sign up for a free account"
echo "3. Verify your email address"
echo ""

print_status "Step 2: Create a New Cluster"
echo "1. Click 'Build a Database'"
echo "2. Choose 'Shared' (Free tier)"
echo "3. Select AWS as provider"
echo "4. Choose a region close to your AWS region"
echo "5. Name your cluster (e.g., 'educational-platform')"
echo "6. Click 'Create Cluster'"
echo ""

print_status "Step 3: Create Database User"
echo "1. Go to 'Database Access' in the left sidebar"
echo "2. Click 'Add New Database User'"
echo "3. Choose 'Password' authentication"
echo "4. Create a username and strong password"
echo "5. Set privileges to 'Read and write to any database'"
echo "6. Click 'Add User'"
echo ""

print_status "Step 4: Configure Network Access"
echo "1. Go to 'Network Access' in the left sidebar"
echo "2. Click 'Add IP Address'"
echo "3. Click 'Add Current IP Address' (for your local development)"
echo "4. For production, add your EC2 instance IP:"
echo "   - Get your EC2 IP from AWS Console"
echo "   - Add it in the format: x.x.x.x/32"
echo "5. Click 'Confirm'"
echo ""

print_status "Step 5: Get Connection String"
echo "1. Go to 'Database' in the left sidebar"
echo "2. Click 'Connect' on your cluster"
echo "3. Choose 'Connect your application'"
echo "4. Select 'Node.js' and version '4.1 or later'"
echo "5. Copy the connection string"
echo "6. Replace <password> with your database user password"
echo "7. Replace <dbname> with 'doubt-system'"
echo ""

print_status "Step 6: Update Environment Variables"
echo "Update your production.env file with:"
echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/doubt-system?retryWrites=true&w=majority"
echo ""

print_status "Step 7: Test Connection"
echo "You can test the connection using:"
echo "node -e \"const mongoose = require('mongoose'); mongoose.connect('YOUR_CONNECTION_STRING').then(() => console.log('Connected!')).catch(err => console.error(err));\""
echo ""

print_success "MongoDB Atlas setup instructions completed!"
print_warning "Remember to:"
echo "1. Keep your database credentials secure"
echo "2. Use environment variables for connection strings"
echo "3. Enable backup and monitoring in Atlas"
echo "4. Set up alerts for database performance"
echo ""

print_status "Next steps:"
echo "1. Complete the MongoDB Atlas setup"
echo "2. Update your production.env file"
echo "3. Run the deployment script"

























