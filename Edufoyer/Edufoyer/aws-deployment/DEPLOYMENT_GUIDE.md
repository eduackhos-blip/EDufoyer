# Complete AWS Deployment Guide

This guide will walk you through deploying your educational platform to AWS step by step.

## Prerequisites

### 1. AWS Account Setup
- Create an AWS account at https://aws.amazon.com
- Set up billing alerts to monitor costs
- Create an IAM user with appropriate permissions

### 2. Required Tools
- AWS CLI (install from https://aws.amazon.com/cli/)
- Node.js 18+ and npm
- Git
- SSH client

### 3. Domain Setup (Optional)
- Register a domain name
- Or use the provided CloudFront URL

## Step-by-Step Deployment

### Step 1: Prepare Your Environment

1. **Clone your repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd finalnls
   ```

2. **Install AWS CLI**:
   ```bash
   # Windows (using PowerShell)
   msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
   
   # macOS
   brew install awscli
   
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

3. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter your default region (e.g., us-east-1)
   # Enter your default output format (json)
   ```

### Step 2: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**:
   - Go to https://www.mongodb.com/atlas
   - Sign up for a free account
   - Verify your email

2. **Create a Cluster**:
   - Choose "Shared" (Free tier)
   - Select AWS as provider
   - Choose a region close to your AWS region
   - Name your cluster "educational-platform"
   - Click "Create Cluster"

3. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password
   - Set privileges to "Read and write to any database"

4. **Configure Network Access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Add Current IP Address" (for your local development)
   - For production, add your EC2 instance IP later

5. **Get Connection String**:
   - Go to "Database"
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `doubt-system`

### Step 3: Create AWS Key Pair

1. **Create Key Pair**:
   ```bash
   aws ec2 create-key-pair --key-name educational-platform-key --query 'KeyMaterial' --output text > ~/.ssh/educational-platform-key.pem
   chmod 400 ~/.ssh/educational-platform-key.pem
   ```

2. **Note the key name**: `educational-platform-key`

### Step 4: Deploy Infrastructure

1. **Run the deployment script**:
   ```bash
   cd aws-deployment
   ./scripts/deploy.sh --key-pair educational-platform-key --instance-type t3.medium
   ```

2. **Wait for deployment** (this may take 10-15 minutes)

3. **Note the outputs**:
   - Web Server IP
   - Frontend Bucket Name
   - CloudFront URL

### Step 5: Configure Environment Variables

1. **Update production.env**:
   ```bash
   # Edit aws-deployment/config/production.env
   # Update MONGODB_URI with your Atlas connection string
   # Update other environment variables as needed
   ```

2. **Copy environment file to EC2**:
   ```bash
   scp -i ~/.ssh/educational-platform-key.pem aws-deployment/config/production.env ec2-user@<WEB_SERVER_IP>:/var/www/educational-platform/.env
   ```

### Step 6: Deploy Backend

1. **Update backend deployment**:
   ```bash
   ./scripts/update-backend.sh --ip <WEB_SERVER_IP> --key-pair educational-platform-key
   ```

### Step 7: Deploy Frontend

1. **Update frontend deployment**:
   ```bash
   ./scripts/update-frontend.sh --bucket <FRONTEND_BUCKET_NAME>
   ```

### Step 8: Configure Domain (Optional)

1. **If you have a domain**:
   - Go to Route 53 in AWS Console
   - Create a hosted zone for your domain
   - Create CNAME record pointing to your CloudFront distribution
   - Update your CloudFront distribution to use your domain

2. **Set up SSL**:
   - Request SSL certificate in AWS Certificate Manager
   - Update CloudFront distribution to use the certificate

### Step 9: Health Check

1. **Run health check**:
   ```bash
   ./scripts/health-check.sh --ip <WEB_SERVER_IP> --cloudfront <CLOUDFRONT_URL>
   ```

## Cost Optimization

### Free Tier Usage
- Use t3.micro for development (free tier eligible)
- Use S3 standard storage
- Use CloudFront (first 1TB free per month)

### Production Recommendations
- Use t3.medium or larger for production
- Enable S3 lifecycle policies
- Set up CloudWatch alarms for cost monitoring

## Monitoring and Maintenance

### CloudWatch Setup
1. **Enable detailed monitoring** on EC2
2. **Set up CloudWatch alarms** for:
   - High CPU usage
   - High memory usage
   - Disk space
   - Application errors

### Log Management
1. **Configure CloudWatch Logs** for application logs
2. **Set up log retention policies**
3. **Monitor error rates**

### Backup Strategy
1. **Database backups** (MongoDB Atlas handles this)
2. **Application backups** (Git repository)
3. **Configuration backups** (store in secure location)

## Troubleshooting

### Common Issues

1. **EC2 Instance Not Accessible**:
   - Check security groups
   - Verify key pair configuration
   - Check instance status

2. **Database Connection Issues**:
   - Verify MongoDB Atlas network access
   - Check connection string
   - Verify database user permissions

3. **Frontend Not Loading**:
   - Check S3 bucket policy
   - Verify CloudFront distribution
   - Check CORS configuration

4. **Application Errors**:
   - Check PM2 logs: `pm2 logs educational-platform`
   - Check CloudWatch logs
   - Verify environment variables

### Useful Commands

```bash
# Check EC2 instance status
aws ec2 describe-instances --filters "Name=ip-address,Values=<IP>"

# Check S3 bucket contents
aws s3 ls s3://<BUCKET_NAME>

# Check CloudFront distribution
aws cloudfront get-distribution --id <DISTRIBUTION_ID>

# SSH into EC2 instance
ssh -i ~/.ssh/educational-platform-key.pem ec2-user@<IP>

# Check PM2 status
pm2 status
pm2 logs educational-platform
pm2 restart educational-platform
```

## Security Best Practices

1. **Use IAM roles** instead of access keys when possible
2. **Enable MFA** on AWS account
3. **Use least privilege** principle for IAM policies
4. **Regularly rotate** access keys
5. **Enable CloudTrail** for audit logging
6. **Use VPC** for network isolation
7. **Enable encryption** at rest and in transit

## Scaling Considerations

### Horizontal Scaling
- Use Application Load Balancer
- Deploy multiple EC2 instances
- Use Auto Scaling Groups

### Vertical Scaling
- Increase instance size
- Optimize application performance
- Use caching strategies

### Database Scaling
- Use MongoDB Atlas cluster scaling
- Implement read replicas
- Use connection pooling

## Support and Resources

- AWS Documentation: https://docs.aws.amazon.com/
- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com/
- CloudFormation Templates: https://aws.amazon.com/cloudformation/
- AWS Support: https://aws.amazon.com/support/

## Next Steps

1. **Set up monitoring** and alerting
2. **Implement CI/CD** pipeline
3. **Set up backup** strategies
4. **Plan for scaling**
5. **Security audit** and compliance

























