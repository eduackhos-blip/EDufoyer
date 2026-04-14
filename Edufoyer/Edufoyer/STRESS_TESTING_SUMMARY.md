# API Stress Testing Summary

## Overview

A comprehensive stress testing framework has been created to test all APIs in the application. The stress test simulates multiple concurrent users making requests to various endpoints and measures performance metrics.

## Files Created

1. **`backend/stress-test.js`** - Main stress testing script
2. **`backend/STRESS_TEST_README.md`** - Detailed documentation
3. **`backend/run-stress-test.bat`** - Windows batch script for easy execution
4. **`backend/run-stress-test.sh`** - Linux/Mac shell script for easy execution

## Quick Start

### Prerequisites
```bash
cd backend
npm install axios  # Already installed
```

### Run Stress Test

**Option 1: Direct execution**
```bash
cd backend
node stress-test.js
```

**Option 2: Using npm scripts**
```bash
cd backend
npm run stress-test          # Default: 50 users, 60 seconds
npm run stress-test:light    # 10 users, 30 seconds
npm run stress-test:medium   # 50 users, 60 seconds
npm run stress-test:heavy    # 100 users, 120 seconds
```

**Option 3: Using helper scripts**
- Windows: Double-click `run-stress-test.bat` or run from command prompt
- Linux/Mac: `chmod +x run-stress-test.sh && ./run-stress-test.sh`

## Configuration

Set environment variables to customize the test:

```bash
BASE_URL=http://localhost:5000      # API base URL
CONCURRENT_USERS=100                # Number of concurrent users
REQUESTS_PER_USER=10                # Requests per user (not used in current version)
TEST_DURATION=120                   # Test duration in seconds
```

## APIs Tested

The stress test covers **all major API endpoints**:

### Public Endpoints (No Auth Required)
- ✅ `GET /health` - Health check
- ✅ `GET /api/rating/public` - Public ratings
- ✅ `GET /api/payment/test` - Payment gateway test

### Authentication APIs
- ✅ `POST /api/auth/register` - User registration
- ✅ `POST /api/auth/login` - User login
- ✅ `POST /api/auth/verify-email` - Email verification
- ✅ `POST /api/auth/forgot-password` - Password reset

### Profile APIs
- ✅ `GET /api/profile` - Get user profile
- ✅ `POST /api/profile/create` - Create profile

### Doubt APIs
- ✅ `POST /api/doubts/create` - Create doubt
- ✅ `GET /api/doubts/my-doubts` - Get user's doubts
- ✅ `GET /api/doubts/all` - Get all doubts
- ✅ `GET /api/doubts/:id` - Get doubt by ID
- ✅ `POST /api/doubts/feedback` - Submit feedback

### Solver APIs
- ✅ `GET /api/solver/available-doubts` - Get available doubts
- ✅ `GET /api/solver/assigned-doubts` - Get assigned doubts
- ✅ `POST /api/solver/accept-doubt` - Accept doubt
- ✅ `POST /api/solver/complete-doubt` - Complete doubt
- ✅ `GET /api/solver/solved-doubts` - Get solved doubts
- ✅ `GET /api/solver/metrics` - Get solver metrics

### Notification APIs
- ✅ `GET /api/notifications` - Get notifications
- ✅ `PATCH /api/notifications/mark-read` - Mark all as read

### Wallet APIs
- ✅ `GET /api/wallet` - Get wallet details
- ✅ `GET /api/wallet/balance` - Get wallet balance

### Social APIs
- ✅ `GET /api/social/posts` - Get posts feed
- ✅ `POST /api/social/posts` - Create post
- ✅ `GET /api/social/friends` - Get friends list
- ✅ `GET /api/social/study-groups` - Get study groups

### University APIs
- ✅ `GET /api/university/doubt-balance` - Get doubt balance
- ✅ `GET /api/university/kiit-users` - Get KIIT users

## Metrics Collected

The stress test collects and reports:

1. **Overall Statistics**
   - Total requests
   - Success rate
   - Failure rate
   - Requests per second (throughput)

2. **Response Time Statistics**
   - Average response time
   - Minimum response time
   - Maximum response time
   - P50 (Median)
   - P95 (95th percentile)
   - P99 (99th percentile)

3. **Error Breakdown**
   - Error codes and counts
   - Error percentages

4. **Per-Endpoint Statistics**
   - Total requests per endpoint
   - Success/failure counts
   - Response time statistics per endpoint

## Output

### Console Output
Real-time statistics printed to console including:
- Summary statistics
- Response time percentiles
- Error breakdown
- Per-endpoint detailed statistics

### JSON Report
A detailed JSON report is saved as `stress-test-report-{timestamp}.json` containing:
- Configuration used
- Summary statistics
- Error breakdown
- Per-endpoint statistics

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

## Best Practices

1. **Start Small**: Begin with light load and gradually increase
2. **Monitor Server**: Watch server logs and resource usage
3. **Database**: Ensure database can handle the load
4. **Rate Limiting**: Be aware of rate limiting configurations
5. **Network**: Run tests from same network for accurate results
6. **Cleanup**: Test users are created automatically (may need cleanup)

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Ensure server is running
   - Check BASE_URL is correct
   - Verify firewall/network settings

2. **Timeout Errors**
   - Increase timeout in script (currently 30 seconds)
   - Check server performance
   - Reduce concurrent users

3. **Authentication Errors**
   - Some endpoints require valid tokens
   - Test creates test users automatically
   - Check if email verification is required

4. **Rate Limiting**
   - Server has rate limiting configured
   - May affect test results
   - Adjust rate limit settings if needed

## Next Steps

1. Run the stress test with default settings
2. Review the results and identify bottlenecks
3. Optimize slow endpoints
4. Increase load gradually
5. Monitor server resources during tests
6. Compare results before/after optimizations

## Notes

- Test creates test users automatically with unique emails
- Some endpoints may fail due to missing data (expected)
- Rate limiting may affect results
- Test duration is approximate
- Results saved to JSON file for analysis

## Support

For detailed usage instructions, see `backend/STRESS_TEST_README.md`








