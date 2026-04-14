# API Stress Testing Guide

This document explains how to run stress tests on all APIs in the application.

## Prerequisites

1. Make sure the backend server is running:
   ```bash
   cd backend
   npm start
   ```

2. Install dependencies (if not already installed):
   ```bash
   cd backend
   npm install axios
   ```

## Running Stress Tests

### Basic Usage

Run the stress test with default settings:
```bash
cd backend
node stress-test.js
```

### Configuration via Environment Variables

You can configure the stress test using environment variables:

```bash
# Set base URL (default: http://localhost:5000)
BASE_URL=http://localhost:5000

# Set number of concurrent users (default: 50)
CONCURRENT_USERS=100

# Set requests per user (default: 10)
REQUESTS_PER_USER=20

# Set test duration in seconds (default: 60)
TEST_DURATION=120

# Run with custom settings
BASE_URL=http://localhost:5000 CONCURRENT_USERS=100 TEST_DURATION=120 node stress-test.js
```

### Windows PowerShell Example

```powershell
$env:BASE_URL="http://localhost:5000"
$env:CONCURRENT_USERS="100"
$env:TEST_DURATION="120"
node stress-test.js
```

### Windows CMD Example

```cmd
set BASE_URL=http://localhost:5000
set CONCURRENT_USERS=100
set TEST_DURATION=120
node stress-test.js
```

## What Gets Tested

The stress test covers all major API endpoints:

### Public Endpoints
- `GET /health` - Health check
- `GET /api/rating/public` - Public ratings
- `GET /api/payment/test` - Payment test

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset

### Profile Endpoints
- `GET /api/profile` - Get user profile
- `POST /api/profile/create` - Create profile

### Doubt Endpoints
- `POST /api/doubts/create` - Create doubt
- `GET /api/doubts/my-doubts` - Get user's doubts
- `GET /api/doubts/all` - Get all doubts
- `GET /api/doubts/:id` - Get doubt by ID
- `POST /api/doubts/feedback` - Submit feedback

### Solver Endpoints
- `GET /api/solver/available-doubts` - Get available doubts
- `GET /api/solver/assigned-doubts` - Get assigned doubts
- `POST /api/solver/accept-doubt` - Accept doubt
- `POST /api/solver/complete-doubt` - Complete doubt
- `GET /api/solver/solved-doubts` - Get solved doubts
- `GET /api/solver/metrics` - Get solver metrics

### Notification Endpoints
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/mark-read` - Mark all as read

### Wallet Endpoints
- `GET /api/wallet` - Get wallet
- `GET /api/wallet/balance` - Get wallet balance

### Social Endpoints
- `GET /api/social/posts` - Get posts
- `POST /api/social/posts` - Create post
- `GET /api/social/friends` - Get friends
- `GET /api/social/study-groups` - Get study groups

### University Endpoints
- `GET /api/university/doubt-balance` - Get doubt balance
- `GET /api/university/kiit-users` - Get KIIT users

## Test Results

The stress test generates:

1. **Console Output**: Real-time statistics including:
   - Total requests
   - Success/failure rates
   - Response time statistics (avg, min, max, P50, P95, P99)
   - Error breakdown
   - Per-endpoint statistics

2. **JSON Report**: A detailed report file named `stress-test-report-{timestamp}.json` containing:
   - Configuration used
   - Summary statistics
   - Error breakdown
   - Per-endpoint detailed statistics

## Understanding Results

### Key Metrics

- **Requests per Second (RPS)**: Throughput of your API
- **Success Rate**: Percentage of successful requests
- **Response Time Percentiles**:
  - **P50 (Median)**: 50% of requests complete within this time
  - **P95**: 95% of requests complete within this time
  - **P99**: 99% of requests complete within this time

### Interpreting Results

- **High Success Rate (>95%)**: API is handling load well
- **Low Success Rate (<90%)**: May indicate bottlenecks or errors
- **High P95/P99 times**: Some endpoints may need optimization
- **Error patterns**: Check specific error codes for issues

## Tips

1. **Start Small**: Begin with lower concurrent users and gradually increase
2. **Monitor Server**: Watch server logs and resource usage during tests
3. **Database**: Ensure database can handle the load
4. **Rate Limiting**: Be aware of rate limiting that may affect results
5. **Network**: Run tests from same network as server for accurate results

## Troubleshooting

### Connection Errors
- Ensure server is running
- Check BASE_URL is correct
- Verify firewall/network settings

### Timeout Errors
- Increase timeout in script (currently 30 seconds)
- Check server performance
- Reduce concurrent users

### Authentication Errors
- Some endpoints require valid tokens
- Test creates test users automatically
- Check if email verification is required

## Example Output

```
🚀 Starting Stress Test
============================================================
Base URL: http://localhost:5000
Concurrent Users: 50
Requests per User: 10
Test Duration: 60 seconds
============================================================

📊 Stress Test Results
============================================================
Total Duration: 60.23 seconds
Total Requests: 1250
Successful Requests: 1180 (94.40%)
Failed Requests: 70 (5.60%)
Requests per Second: 20.75

⏱️  Response Time Statistics (ms)
------------------------------------------------------------
Average: 245.32ms
Min: 12.45ms
Max: 2345.67ms
P50 (Median): 189.23ms
P95: 567.89ms
P99: 1234.56ms
```

## Notes

- The test creates test users automatically
- Some endpoints may fail due to missing data (e.g., doubts, profiles)
- Rate limiting may affect results if configured
- Test duration is approximate - actual duration may vary slightly








