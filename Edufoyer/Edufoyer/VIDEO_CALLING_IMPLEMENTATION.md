# Video Calling Feature - Implementation Guide

This document explains how the video calling feature (similar to Google Meet) is implemented in the EduFoyer application. The system uses **LiveKit** as the real-time communication infrastructure, enabling one-on-one video sessions between students (doubters) and solvers.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Flow Diagrams](#flow-diagrams)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Authentication & Token Generation](#authentication--token-generation)
7. [Entry Points & User Flows](#entry-points--user-flows)
8. [Security Features](#security-features)
9. [Configuration & Environment Variables](#configuration--environment-variables)

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │────▶│   Node Backend   │────▶│  LiveKit Cloud  │
│  (Vite + React) │     │  (Express API)   │     │  (WebRTC SFU)   │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │  1. Request token     │  2. Generate JWT       │
         │  (POST /generate-     │     with room grant    │
         │   token)              │                        │
         │                       │  3. Return token       │
         │◀──────────────────────┤                        │
         │                       │                        │
         │  4. Connect with token (WebSocket + WebRTC)    │
         └───────────────────────┼────────────────────────┘
                                 │
                        5. Audio/Video streams
                           flow through LiveKit
```

The flow is token-based: the backend generates short-lived JWT access tokens that authorize users to join specific LiveKit rooms. No credentials are sent directly to LiveKit from the frontend.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Real-time Infrastructure** | LiveKit (WebRTC-based SFU) |
| **Frontend SDK** | `@livekit/components-react`, `livekit-client` |
| **Backend SDK** | `livekit-server-sdk` (Node.js) |
| **Transport** | WebSocket (signaling) + WebRTC (media) |

---

## Flow Diagrams

### Doubt Solving Session Flow

```mermaid
sequenceDiagram
    participant S as Student
    participant Solver
    participant API as Backend API
    participant LK as LiveKit Cloud

    Note over S,Solver: 1. Doubt Assignment
    Solver->>API: Accept doubt (allotDoubt)
    API->>LK: Create room (doubt-session-{doubtId})
    API->>API: Store livekit_room_name in SolverDoubts
    API->>S: Email/notification with session link
    API->>Solver: Email/notification with session link

    Note over S,Solver: 2. Joining the Session
    S->>API: POST /generate-token (or /generate-token-email)
    API->>API: Validate user, fetch room name
    API->>S: Return JWT token + roomName
    S->>LK: Connect with token
    LK->>S: Establish WebRTC connection

    Solver->>API: POST /generate-token
    API->>Solver: Return JWT token
    Solver->>LK: Connect with token
    LK->>Solver: Establish WebRTC connection

    Note over S,Solver: 3. In-Call (LiveKit handles all media)
    S<->>LK: Audio/Video streams
    Solver<->>LK: Audio/Video streams
```

### Token Generation Decision Flow

```
User visits /dashboard/session/:doubtId
                    │
                    ▼
         ┌──────────────────────┐
         │ URL has ?email=true?  │
         └──────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
       YES                     NO
        │                       │
        ▼                       ▼
POST /generate-token-email   POST /generate-token
(no auth required)           (Bearer JWT required)
        │                       │
        │                       │ Checks: user is doubter OR solver
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
            Return { token, roomName }
```

---

## Backend Implementation

### Routes (`backend/routes/livekit.js`)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/livekit/generate-token` | POST | Required (JWT) | Generate token for authenticated doubt session |
| `/api/livekit/generate-token-email` | POST | None | Generate token for email link join (e.g. `/session/123?email=true`) |
| `/api/livekit/token-by-room` | POST | Required | Generate token for arbitrary room (e.g. PYQ rooms) |
| `/api/livekit/schedule-room` | POST | Required | Create a LiveKit room (e.g. Previous Year Live) |

### Room Creation (`backend/actions/solver/allotDoubt.js`)

When a solver **accepts** a doubt:

1. **Create LiveKit room** via `RoomServiceClient.createRoom()`:
   - Room name: `doubt-session-{doubtId}`
   - `maxParticipants: 2` (student + solver)
   - `emptyTimeout: 60` (cleanup when empty)

2. **Update database**:
   - `Doubt`: status → `assigned`, `solver_id` set
   - `SolverDoubts`: create record with `livekit_room_name`

3. **Notify both parties** via in-app notifications and email:
   - Session URL: `{FRONTEND_URL}/dashboard/session/{doubtId}`
   - Email link: `...?email=true` for auth-free join from email

---

## Frontend Implementation

### Primary Component: `LiveKitMeeting.jsx`

**Route:** `/dashboard/session/:doubtId`

This is the main video meeting UI used for doubt-solving sessions.

**Features:**
- Renders `LiveKitRoom` + `VideoConference` from `@livekit/components-react`
- Fetches token on mount (authenticated or email-based)
- Session timer based on doubt category (small: 20 min, medium: 30 min, large: 60 min)
- Profanity filter on in-call chat
- Screen recording detection and warnings
- Visual watermarks ("EduFoyer Session", "Private Session - Do Not Record")
- Post-session rating modals (doubter rates solver, solver rates doubter)
- Right-click disabled to prevent screenshot/context menu abuse

**Token fetch logic:**
```javascript
const isEmailJoin = new URLSearchParams(window.location.search).get('email') === 'true';
const res = isEmailJoin
  ? await livekitService.generateTokenForEmailJoin(doubtId)
  : await livekitService.generateToken(doubtId);
```

### Alternative Component: `LiveSession.jsx`

**Route:** Not currently used in `App.jsx` (LiveKitMeeting is used instead)

A lower-level implementation using `livekit-client` directly:
- Uses `Room` class with manual track attachment to `<video>` elements
- Custom UI (mute, video toggle, end call)
- Same token endpoints

### PYQ (Previous Year) Rooms: `JoinPyqRoom.jsx`

**Route:** `/dashboard/pyq/:roomName`

For scheduled "Previous Year Live" study sessions:
- Token via `livekitService.tokenByRoom(roomName)`
- Backend `POST /api/livekit/token-by-room` with explicit room name
- Same LiveKit `VideoConference` UI

---

## Authentication & Token Generation

### Authenticated Token (`/generate-token`)

**Checks performed:**
1. User must be logged in (JWT in `Authorization` header)
2. Doubt must exist and have an assignment in `SolverDoubts`
3. Assignment must have `livekit_room_name`
4. Doubt status must NOT be `resolved`; assignment must NOT be `session_completed`
5. User must be either the **doubter** or the **assigned solver**

**Token payload:**
- `identity`: user ID
- `name`: user's display name
- `ttl`: 3600 seconds (1 hour)
- Grant: `room`, `roomJoin`, `canPublish`, `canSubscribe`, `canPublishData`

### Email Token (`/generate-token-email`)

**Purpose:** Allow users to join via email link without being logged in.

**Checks:**
1. Doubt must exist
2. Doubt status must be `awaiting_solver` or `in_progress`
3. Room name: `doubt.roomName || doubt-session-${doubtId}`

**Token identity:** `email-join-{timestamp}` (anonymous)

**Note:** The Doubt model does not have a `roomName` field; the fallback `doubt-session-${doubtId}` matches the room created by `allotDoubt`.

---

## Entry Points & User Flows

| Entry Point | Component | Token Source |
|-------------|-----------|--------------|
| Dashboard modal "Accept & Join" | → `LiveKitMeeting` | `generateToken(doubtId)` |
| DoubtManagement "Join Session" button | → `LiveKitMeeting` | `generateToken(doubtId)` |
| SolveDoubt "Accept" (after accepting doubt) | → `LiveKitMeeting` | `generateToken(doubtId)` |
| SolverAcceptanceNotification "Join Session Now" | → `LiveKitMeeting` | `generateToken(doubtId)` |
| Email link (from allotment notification) | → `LiveKitMeeting` (?email=true) | `generateTokenForEmailJoin(doubtId)` |
| PreviousYearLive "Join Now" | → `JoinPyqRoom` | `tokenByRoom(roomName)` |

---

## Security Features

1. **Token-based access:** No long-lived credentials; JWTs expire in 1 hour.
2. **Authorization:** Only doubter and assigned solver can get tokens for a doubt session.
3. **Profanity filter:** Chat messages are checked before send; abusive content is blocked.
4. **Recording awareness:**
   - DevTools detection (window size checks)
   - Visual watermarks overlay
   - Warning toasts if recording is suspected
   - Screen sharing via LiveKit is allowed (legitimate use)
5. **Right-click disabled** on the meeting area to reduce screenshot temptation.
6. **CSP headers:** Backend allows LiveKit WebSocket/media origins in Content-Security-Policy.

---

## Configuration & Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `LIVEKIT_URL` | LiveKit server URL (e.g. `https://remote-xxx.livekit.cloud`) |
| `LIVEKIT_API_KEY` | API key from LiveKit Cloud |
| `LIVEKIT_API_SECRET` | API secret for token signing |
| `FRONTEND_URL` | Base URL for session links in emails |

### Frontend (`final/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_LIVEKIT_URL` | WebSocket URL (e.g. `wss://remote-xxx.livekit.cloud`) |

---

## Data Models

### SolverDoubts (MongoDB)

- `doubt_id`: Reference to Doubt
- `solver_id`: Assigned solver
- `livekit_room_name`: Room name for this session (e.g. `doubt-session-507f1f77bcf86cd799439011`)
- `resolution_status`: `session_scheduled`, `session_completed`, etc.

### Doubt (MongoDB)

- `status`: `open` → `assigned` → (session) → `resolved`
- `solver_id`: Set when assigned
- `category`: `small` | `medium` | `large` (determines session duration)

---

## Summary

The video calling feature is built on LiveKit and follows a standard token-based architecture. The backend creates rooms when doubts are assigned and issues JWT tokens to authorized participants. The frontend uses `LiveKitMeeting` (with `VideoConference`) for doubt sessions and `JoinPyqRoom` for ad-hoc PYQ rooms. Email links support joining without login via the `/generate-token-email` endpoint. Security measures include profanity filtering, recording awareness, and strict token authorization.
