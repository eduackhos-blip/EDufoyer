# Express Socket Server

Standalone Socket.IO service for Edufoyer live sessions (WebRTC signaling, rooms, chat, solver presence) plus HTTP fan-out for the Next.js app.

## What it handles

- Authenticated Socket.IO connections (JWT)
- `registerSolver` / `join:admin` presence rooms
- Session rooms: join/leave, timers, disconnect grace
- WebRTC signaling relay + in-room chat
- Health: `GET /health`
- Server-to-server publish: `POST /emit`, `POST /emit-many`

## Environment

Copy `.env.example` to `.env.development` or `.env.production` and fill in values.

| Variable | Description |
|----------|-------------|
| `SOCKET_PORT` | Listen port (default `4001`) |
| `MONGODB_URI` | Same MongoDB as Next.js |
| `SOCKET_ALLOWED_ORIGINS` | Comma-separated browser origins (must include `https://edufoyer.com` in production) |
| `SOCKET_SERVER_API_KEY` | Shared secret for `/emit` (set a strong value in production) |
| `JWT_SECRET` | Same secret as Next.js JWT signing |
| `NEXT_API_URL` | Next.js base URL for session end processing |

Env file loaded by `NODE_ENV`: `.env.production` or `.env.development`, then fallback `.env`.

### Production origins

For deployment, `SOCKET_ALLOWED_ORIGINS` should include at least:

```text
https://edufoyer.com,https://www.edufoyer.com
```

These are also included in code defaults when the env var is unset.

Set `NEXT_API_URL=https://edufoyer.com` so session finalize callbacks hit the live app.

## Run

```bash
npm run dev
```

```bash
npm run build
NODE_ENV=production npm start
```

On boot the server logs allowed origins — confirm `https://edufoyer.com` appears.

## Publish event example

```bash
curl -X POST http://localhost:4001/emit \
  -H "Content-Type: application/json" \
  -H "x-socket-api-key: change-me" \
  -d "{\"event\":\"doubt:available\",\"room\":\"subject:math\",\"payload\":{\"doubtId\":\"123\"}}"
```
