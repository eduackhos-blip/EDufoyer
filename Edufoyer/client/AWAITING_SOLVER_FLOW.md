# Awaiting Solver Flow Documentation

## Overview
This document describes the new "Awaiting Solver" flow that shows users a waiting page when they submit a doubt, and provides real-time notifications when a solver accepts their doubt.

## Flow Description

### 1. User Submits Doubt
- User fills out the doubt form in `AskDoubt.jsx`
- After successful submission, user is redirected to `/dashboard/awaiting/{doubtId}`
- The awaiting page shows a waiting status with real-time updates

### 2. Awaiting Solver Page (`AwaitingSolverPage.jsx`)
- **Location**: `/dashboard/awaiting/:doubtId`
- **Features**:
  - Shows doubt details (subject, category, description)
  - Displays elapsed time since submission
  - Real-time polling every 10 seconds for updates
  - Live notifications sidebar
  - "What happens next" guide
  - Help section

### 3. Real-time Notifications
- **Polling**: Checks for notifications every 10 seconds
- **Notification Types**:
  - `DOUBT_SUBMITTED`: Initial confirmation
  - `DOUBT_ASSIGNED`: When solver accepts
- **Visual Indicators**: Different icons and colors for each notification type

### 4. Solver Acceptance Flow
When a solver accepts the doubt:
1. Backend sends notification with type `DOUBT_ASSIGNED`
2. Frontend detects the notification
3. Shows `SolverAcceptanceNotification` modal
4. User can either:
   - Join session immediately
   - Join later (redirects to session page)

## Components

### AwaitingSolverPage.jsx
**Main Features:**
- Doubt details display
- Time elapsed counter
- Real-time notification polling
- Status updates
- Help and guidance sections

**Key State:**
```javascript
const [doubt, setDoubt] = useState(null);
const [notifications, setNotifications] = useState([]);
const [showAcceptanceNotification, setShowAcceptanceNotification] = useState(false);
const [solverInfo, setSolverInfo] = useState(null);
```

### SolverAcceptanceNotification.jsx
**Features:**
- Modal popup when solver accepts
- Solver information display
- Session join button
- "Join later" option

## API Integration

### Backend Endpoints Used:
- `GET /api/doubts/:doubtId` - Fetch doubt details
- `GET /api/notifications` - Fetch user notifications
- `PATCH /api/notifications/mark-read` - Mark notifications as read

### Notification Types:
- `DOUBT_SUBMITTED`: Doubt created successfully
- `DOUBT_ASSIGNED`: Solver has accepted the doubt
- `ASSIGNED_TO_SOLVER`: Solver notification (for solvers)

## User Experience Flow

```
1. User submits doubt
   ↓
2. Redirect to /dashboard/awaiting/{doubtId}
   ↓
3. Show "Awaiting Solver" page with:
   - Doubt details
   - Elapsed time
   - Live notifications
   - Help section
   ↓
4. Poll for notifications every 10s
   ↓
5. When solver accepts:
   - Show acceptance notification modal
   - User can join session or join later
   ↓
6. Redirect to session page
```

## Technical Implementation

### Real-time Updates
- **Polling Interval**: 10 seconds
- **Auto-refresh**: Fetches doubt status and notifications
- **Notification Detection**: Checks for `DOUBT_ASSIGNED` type
- **State Management**: React hooks for real-time updates

### Error Handling
- Loading states for all async operations
- Error boundaries for failed requests
- Retry mechanisms for network issues
- User-friendly error messages

### Performance Optimizations
- Debounced refresh operations
- Efficient notification filtering
- Minimal re-renders with proper state management

## Styling and UI

### Design Principles:
- **Clean Interface**: Minimal distractions while waiting
- **Clear Status**: Obvious waiting state with progress indicators
- **Helpful Guidance**: "What happens next" section
- **Real-time Feedback**: Live updates and notifications

### Visual Elements:
- **Status Icons**: Clock, Bell, CheckCircle, User
- **Color Coding**: Blue (waiting), Green (accepted), Yellow (notifications)
- **Animations**: Smooth transitions and loading states
- **Responsive Design**: Works on all screen sizes

## Testing Scenarios

### Happy Path:
1. User submits doubt → Redirects to awaiting page
2. Page shows doubt details and waiting status
3. Solver accepts → Notification appears
4. User clicks "Join Session" → Redirects to session

### Edge Cases:
1. **Network Issues**: Graceful error handling
2. **Long Wait Times**: Help section and support contact
3. **Multiple Notifications**: Proper notification management
4. **Page Refresh**: Maintains state and continues polling

## Future Enhancements

### Potential Improvements:
1. **WebSocket Integration**: Real-time updates without polling
2. **Push Notifications**: Browser notifications for solver acceptance
3. **Estimated Wait Time**: Show average wait times
4. **Solver Matching**: Show progress of solver matching
5. **Chat Support**: Live chat while waiting

### Analytics:
- Track average wait times
- Monitor user engagement during waiting
- Measure conversion rates from waiting to session

## Configuration

### Environment Variables:
- `FRONTEND_URL`: For notification links
- `API_BASE_URL`: Backend API endpoint
- `POLLING_INTERVAL`: Refresh interval (default: 10s)

### Customization Options:
- Polling frequency
- Notification display duration
- Auto-redirect timing
- Help section content

## Troubleshooting

### Common Issues:
1. **Stuck on Loading**: Check API endpoints and authentication
2. **No Notifications**: Verify notification service integration
3. **Session Redirect Fails**: Check routing configuration
4. **Real-time Updates Not Working**: Verify polling mechanism

### Debug Information:
- Console logs for API calls
- Network tab for request/response details
- State inspection in React DevTools
- Notification service status

## Conclusion

The Awaiting Solver flow provides a seamless experience for users waiting for solver assignment. The real-time updates and clear status indicators keep users informed, while the acceptance notification ensures they don't miss when a solver is ready to help.



