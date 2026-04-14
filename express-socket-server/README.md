# Express Socket Server

Standalone Socket.IO service extracted from backend realtime logic.

## What it handles

- Socket client connections
- `registerSolver` event:
  - joins `solver:{userId}` room
  - resolves subjects (from payload or Mongo `solvers` collection)
  - joins `subject:{subject}` rooms
- Health endpoint: `GET /health`
- Server-to-server event publishing:
  - `POST /emit`
  - `POST /emit-many`

## Environment

Copy `.env.example` to `.env` and update values.

- `SOCKET_PORT`
- `MONGODB_URI`
- `SOCKET_ALLOWED_ORIGINS` (comma-separated)
- `SOCKET_SERVER_API_KEY` (optional but recommended)

## Run

```bash
npm run dev
```

```bash
npm run build
npm start
```

## Publish event example

```bash
curl -X POST http://localhost:4001/emit \
  -H "Content-Type: application/json" \
  -H "x-socket-api-key: change-me" \
  -d "{\"event\":\"doubt:available\",\"room\":\"subject:math\",\"payload\":{\"doubtId\":\"123\"}}"
```
