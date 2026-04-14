# Cost Analysis: Per Doubt Breakdown

## Overview
This document calculates the infrastructure and database costs incurred when an asker submits a doubt on EduFoyer.

---

## 1. MongoDB Atlas Database Costs

### Data Storage Per Doubt

**Documents Created:**
1. **Doubt Document** (`Doubt` collection)
   - Fields: `subject` (200 chars max), `description` (5000 chars max), `image` (path string), `doubter_id`, `solver_id`, `status`, `is_solved`, `rating`, `category`, `timestamps`
   - **Estimated Size:** ~1-5 KB (average 2 KB)
   - **Indexes:** 5 indexes (subject, status, doubter_id, solver_id, compound)

2. **SolverDoubts Document** (`SolverDoubts` collection) - Created when solver accepts
   - Fields: `doubt_id`, `solver_id`, `assigned_at`, `resolved_at`, `resolution_status`, `livekit_room_name`, `feedback_rating`, `feedback_comment`, `timestamps`
   - **Estimated Size:** ~0.5-1 KB (average 0.7 KB)

3. **Notification Document** (`Notification` collection) - At least 1 per doubt
   - Fields: `user_id`, `doubt_id`, `message_type`, `content` (500 chars max), `is_read`, `createdAt`
   - **Estimated Size:** ~0.3-0.5 KB (average 0.4 KB)
   - **Multiple notifications possible:** DOUBT_SUBMITTED, DOUBT_ASSIGNED, DOUBT_RESOLVED

**Total Storage Per Doubt:**
- Minimum: ~1.8 KB (if no image, short descriptions)
- Average: ~3.1 KB
- Maximum: ~6.5 KB (with image path, long descriptions)

### Database Operations Per Doubt

**Write Operations (WRUs - Write Request Units):**
- `Doubt.create()`: 1 WRU
- `Notification.create()`: 1 WRU (minimum)
- `SolverDoubts.create()`: 1 WRU (when assigned)
- `Doubt.update()` (status changes): 2-4 WRUs (open → assigned → resolved)
- `SolverDoubts.update()`: 1-2 WRUs

**Read Operations (RRUs - Read Request Units):**
- Query potential solvers: ~5-20 RRUs (depending on solver count)
- Get doubt details: 1-2 RRUs
- Get user doubts list: 1 RRU per page load
- Index scans: ~2-5 RRUs per query

**Total Operations Per Doubt:**
- **Writes:** ~5-8 WRUs
- **Reads:** ~10-30 RRUs (varies by activity)

### MongoDB Atlas Pricing (As of 2024)

**M0 (Free Tier):**
- 512 MB storage
- 512 MB RAM
- Shared CPU
- **Cost:** $0/month (limited to 500 MB storage)

**M10 (Dedicated Cluster - Recommended for Production):**
- 2 GB storage
- 2 GB RAM
- Shared CPU
- **Pricing:** ~$0.08/hour = **~$57.60/month**
- **Storage:** $0.25/GB/month
- **Data Transfer:** First 1 GB free, then $0.12/GB

**M30 (Better Performance):**
- 10 GB storage
- 4 GB RAM
- Shared CPU
- **Pricing:** ~$0.20/hour = **~$144/month**

**Cost Per Doubt (Assuming M10):**
- **Storage:** 
  - 3.1 KB average × $0.25/GB = $0.000000775 per doubt
  - **~$0.00000078 per doubt** (negligible)
  
- **Operations:**
  - 1 WRU = 1 document write
  - 1 RRU = 1 document read
  - **M10 includes:** ~2,000,000 reads + 1,000,000 writes/month
  - If you process 1,000 doubts/month:
    - Writes: 5,000-8,000 WRUs (< 1% of free tier)
    - Reads: 10,000-30,000 RRUs (< 2% of free tier)
  - **Cost per doubt:** ~$0.00 (covered by free tier)

**MongoDB Total Cost Per Doubt: ~$0.000001** (effectively free for reasonable scale)

---

## 2. LiveKit Video Session Costs

### Resources Per Doubt Session

**When a solver accepts a doubt:**
- LiveKit room is created (`doubt-session-{doubtId}`)
- Room timeout: 20-60 minutes (based on category: small/medium/large)
- Max participants: 2 (asker + solver)
- Video/audio streaming: Real-time bidirectional

### LiveKit Pricing (As of 2024)

**Cloud Plan Pricing:**
- **Free Tier:** 5,000 participant-minutes/month
- **Starter:** $0.003/participant-minute = **$0.003 per minute per participant**
- **Pro:** $0.002/participant-minute (with annual commitment)

**Cost Calculation Per Doubt:**

**Scenario 1: Small Doubt (20 minutes)**
- 2 participants × 20 minutes = 40 participant-minutes
- **Cost:** 40 × $0.003 = **$0.12 per doubt**

**Scenario 2: Medium Doubt (30 minutes)**
- 2 participants × 30 minutes = 60 participant-minutes
- **Cost:** 60 × $0.003 = **$0.18 per doubt**

**Scenario 3: Large Doubt (60 minutes)**
- 2 participants × 60 minutes = 120 participant-minutes
- **Cost:** 120 × $0.003 = **$0.36 per doubt**

**Average Cost Per Doubt (assuming 30-minute average):**
- **~$0.18 per doubt** (LiveKit video session)

**Note:** If you stay within the free tier (5,000 participant-minutes/month), you can handle **~83 medium doubts/month** for free.

---

## 3. AWS EC2 Compute Costs

### Server Resources Per Doubt

**CPU Usage:**
- API request handling: ~0.01-0.05 CPU seconds
- Database queries: ~0.02-0.1 CPU seconds
- LiveKit token generation: ~0.01 CPU seconds
- Socket.IO events: ~0.005 CPU seconds
- **Total:** ~0.045-0.165 CPU seconds per doubt

**Memory Usage:**
- Request processing: ~5-10 MB (temporary)
- Database connection pooling: ~50 MB (shared)
- **Total:** ~5-10 MB per request (temporary)

**Network Bandwidth:**
- API request/response: ~2-5 KB
- Static asset serving: ~0 KB (if cached)
- **Total:** ~2-5 KB per doubt

### AWS EC2 Pricing (US East - N. Virginia)

**t3.medium (Recommended):**
- 2 vCPUs, 4 GB RAM
- **On-Demand:** $0.0416/hour = **~$30/month**
- **Network:** First 1 GB free, then $0.09/GB

**t3.small (Minimum):**
- 2 vCPUs, 2 GB RAM
- **On-Demand:** $0.0208/hour = **~$15/month**

**t3.large (For Scale):**
- 2 vCPUs, 8 GB RAM
- **On-Demand:** $0.0832/hour = **~$60/month**

**Cost Per Doubt (Assuming t3.medium):**
- Server runs 24/7 regardless of doubt volume
- **Fixed Cost:** $30/month
- **Per-Doubt Share:**
  - If 100 doubts/month: $30/100 = **$0.30 per doubt**
  - If 1,000 doubts/month: $30/1,000 = **$0.03 per doubt**
  - If 10,000 doubts/month: $30/10,000 = **$0.003 per doubt**

**Average Cost Per Doubt (assuming 1,000 doubts/month):**
- **~$0.03 per doubt** (EC2 compute)

---

## 4. Email Sending Costs (Optional)

### SMTP Usage Per Doubt

**Emails Sent:**
- Notification to asker: 1 email (when doubt is submitted)
- Notification to solver: 1 email (when doubt is assigned)
- **Total:** 2 emails per doubt (if email notifications enabled)

### Gmail SMTP (Free Tier)
- **Free:** 500 emails/day, 2,000 emails/month
- **Cost:** $0 (within free tier)

### AWS SES (Production Alternative)
- **Free Tier:** 62,000 emails/month (from EC2)
- **Cost:** $0.10 per 1,000 emails after free tier
- **Cost per doubt:** 2 emails × $0.0001 = **$0.0002 per doubt**

**Email Cost Per Doubt: ~$0.00** (if using Gmail or AWS SES free tier)

---

## 5. Other Infrastructure Costs

### Domain & SSL (Namecheap/Route53)
- **Domain:** ~$10-15/year = **~$1/month**
- **SSL Certificate:** Free (Let's Encrypt via Nginx)
- **Cost per doubt:** Negligible (fixed cost)

### Nginx (Reverse Proxy)
- **Cost:** $0 (included in EC2)
- **Cost per doubt:** $0

### PM2 (Process Manager)
- **Cost:** $0 (open source)
- **Cost per doubt:** $0

### Socket.IO (Real-time)
- **Cost:** $0 (included in Node.js server)
- **Cost per doubt:** $0

---

## Total Cost Summary Per Doubt

### Breakdown (Assuming 1,000 doubts/month):

| Component | Cost Per Doubt | Notes |
|-----------|---------------|-------|
| **MongoDB Atlas** | $0.000001 | Negligible (covered by free tier) |
| **LiveKit Video** | $0.18 | Main variable cost (30-min average session) |
| **EC2 Compute** | $0.03 | Fixed cost divided by volume |
| **Email** | $0.00 | Free tier (Gmail/SES) |
| **Domain/SSL** | $0.001 | Fixed cost divided by volume |
| **Other** | $0.00 | Included in EC2 |
| **TOTAL** | **~$0.21 per doubt** | |

### Cost Breakdown by Volume:

| Monthly Doubts | EC2 Cost/Doubt | LiveKit Cost/Doubt | Total Cost/Doubt |
|----------------|----------------|-------------------|------------------|
| 100 | $0.30 | $0.18 | **$0.48** |
| 500 | $0.06 | $0.18 | **$0.24** |
| 1,000 | $0.03 | $0.18 | **$0.21** |
| 5,000 | $0.006 | $0.18 | **$0.186** |
| 10,000 | $0.003 | $0.18 | **$0.183** |

---

## Cost Optimization Strategies

### 1. Reduce LiveKit Costs
- **Use shorter sessions:** Encourage efficient problem-solving
- **Monitor room timeouts:** Ensure rooms close when empty
- **Upgrade to Pro plan:** $0.002/min if high volume (annual commitment)

### 2. Optimize EC2 Costs
- **Use Reserved Instances:** Save 30-50% on EC2 costs
- **Auto-scaling:** Scale down during low-traffic hours
- **Spot Instances:** For non-critical workloads (not recommended for production)

### 3. MongoDB Optimization
- **Use indexes efficiently:** Reduce query costs
- **Archive old doubts:** Move resolved doubts to cold storage
- **Monitor usage:** Stay within free tier limits if possible

### 4. Email Optimization
- **Batch notifications:** Reduce email sends
- **Use AWS SES:** Free tier covers most use cases

---

## Revenue Model Recommendations

### Suggested Pricing Per Doubt:
- **Student pays:** $0.50 - $2.00 per doubt (depending on category)
- **Platform cost:** ~$0.21 per doubt
- **Platform margin:** ~$0.29 - $1.79 per doubt (60-90% margin)

### Alternative Models:
- **Subscription:** $10-20/month for unlimited doubts
- **Freemium:** Free tier (5 doubts/month), then pay-per-doubt
- **Solver commission:** 20-30% of doubt price to solver

---

## Monthly Cost Estimates

### Low Volume (100 doubts/month):
- **EC2:** $30
- **MongoDB:** $0 (free tier)
- **LiveKit:** $18 (100 × $0.18)
- **Total:** ~$48/month

### Medium Volume (1,000 doubts/month):
- **EC2:** $30
- **MongoDB:** $0-57 (free tier or M10)
- **LiveKit:** $180 (1,000 × $0.18)
- **Total:** ~$210-267/month

### High Volume (10,000 doubts/month):
- **EC2:** $30-60 (t3.large)
- **MongoDB:** $57-144 (M10-M30)
- **LiveKit:** $1,800 (10,000 × $0.18)
- **Total:** ~$1,887-2,004/month

---

## Conclusion

**Primary Cost Driver:** LiveKit video sessions (~86% of variable costs)

**Break-Even Point:** 
- If charging $0.50/doubt: Need ~420 doubts/month to cover $210/month
- If charging $1.00/doubt: Need ~210 doubts/month to cover $210/month

**Recommendation:** 
- Start with free tiers (MongoDB M0, LiveKit free tier)
- Scale infrastructure as revenue grows
- Focus on optimizing LiveKit session duration and usage

---

*Last Updated: 2024*
*Assumptions: US-based infrastructure, standard pricing, 30-minute average session duration*

