# AWS Deployment Guide for Educational Platform

This guide will help you deploy your educational platform to AWS with the following architecture:

## Architecture Overview

```
Internet → CloudFront (CDN) → S3 (Frontend)
         ↓
         Route 53 → Load Balancer → EC2 (Backend)
         ↓
         MongoDB Atlas / DocumentDB
```

## Components

1. **Frontend**: React app hosted on S3 + CloudFront
2. **Backend**: Node.js API on EC2 with PM2
3. **Database**: MongoDB Atlas (recommended) or AWS DocumentDB
4. **CDN**: CloudFront for global content delivery
5. **Domain**: Route 53 for DNS management
6. **SSL**: AWS Certificate Manager for HTTPS

## Prerequisites

- AWS Account with appropriate permissions
- Domain name (optional but recommended)
- MongoDB Atlas account (for database)
- Basic knowledge of AWS services

## Deployment Steps

1. **Database Setup** (MongoDB Atlas)
2. **Backend Deployment** (EC2)
3. **Frontend Deployment** (S3 + CloudFront)
4. **Domain Configuration** (Route 53)
5. **SSL Setup** (Certificate Manager)
6. **Monitoring Setup** (CloudWatch)

## Cost Estimation

- **EC2 t3.medium**: ~$30/month
- **S3 + CloudFront**: ~$5-10/month
- **Route 53**: ~$0.50/month
- **MongoDB Atlas M10**: ~$57/month
- **Total**: ~$90-100/month

## Files in this directory

- `infrastructure/` - Terraform/CloudFormation templates
- `scripts/` - Deployment automation scripts
- `config/` - Environment configurations
- `monitoring/` - CloudWatch dashboards and alarms

