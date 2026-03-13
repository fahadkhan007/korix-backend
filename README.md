# Korix — Backend API

Korix is a **project management and collaboration platform**. This repository contains the backend REST API built with Node.js, Express, TypeScript, PostgreSQL (via Prisma), and Redis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express v5 |
| ORM | Prisma v7 (with `@prisma/adapter-pg`) |
| Database | PostgreSQL |
| Cache / Sessions | Redis |
| Auth | JWT (access + refresh tokens) |
| Password Hashing | bcryptjs |
| Rate Limiting | express-rate-limit + rate-limit-redis |

---

## Project Structure

```
backend/
├── index.ts                        # App entry point
├── prisma/
│   └── schema.prisma               # Database schema
└── app/
    ├── config/
    │   ├── env.ts                  # Environment variable exports
    │   └── ratelimitRedis.ts       # Dedicated Redis client for rate limiting (DB 2)
    ├── controllers/
    │   └── auth.controller.ts      # Register, login, refresh, profile, logout
    ├── database/
    │   ├── database.ts             # Prisma client
    │   └── redis.ts                # Redis client for auth tokens (DB 1)
    ├── middlewares/
    │   ├── auth.middleware.ts      # JWT access token verification (protect)
    │   ├── error.middleware.ts     # Global error handler
    │   └── ratelimit.middleware.ts # IP-based and user-based rate limiters
    ├── models/
    │   └── user.model.ts           # Prisma user query helpers
    └── routers/
        └── auth.router.ts          # Auth route definitions
```

---

## Environment Variables

Create a `.env` file in the `backend/` root:

```env
PORT=8000
DATABASE_URL=postgresql://username:password@localhost:5432/korix
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
REDIS_URL=redis://localhost:6379
```

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/register` | ❌ Public | IP (10/15min) | Create a new account |
| `POST` | `/login` | ❌ Public | IP (10/15min) | Login and receive tokens |
| `POST` | `/refresh` | ❌ Public (cookie) | IP (10/15min) | Rotate refresh token, get new access token |
| `GET` | `/profile` | ✅ Bearer token | User (60/15min) | Get authenticated user's profile |
| `POST` | `/logout` | ✅ Bearer token | User (60/15min) | Revoke refresh token and clear cookie |

---

## Auth System

- **Access Token** — short-lived (15 minutes), sent in response body, used via `Authorization: Bearer <token>` header
- **Refresh Token** — long-lived (7 days), stored in an `httpOnly` cookie, validated against Redis
- **Token Rotation** — every `/refresh` call issues a new refresh token and invalidates the old one
- Refresh tokens are stored in **Redis DB 1** under the key `refresh:<userId>`

---

## Rate Limiting

Two rate limiters, both backed by **Redis DB 2**:

| Limiter | Key | Limit | Applied to |
|---|---|---|---|
| `ipRateLimiter` | Client IP | 10 req / 15 min | `/register`, `/login`, `/refresh` |
| `userRateLimiter` | User ID (from JWT) | 60 req / 15 min | `/profile`, `/logout` |

---

## Error Handling

A global error middleware catches and normalizes all errors:

| Error Type | Status |
|---|---|
| Prisma unique constraint (`P2002`) | `409 Conflict` |
| Prisma record not found (`P2025`) | `404 Not Found` |
| Prisma foreign key violation (`P2003`) | `400 Bad Request` |
| Prisma validation error | `400 Bad Request` |
| `JsonWebTokenError` | `401 Unauthorized` |
| `TokenExpiredError` | `401 Unauthorized` |
| Unhandled errors | `500 Internal Server Error` |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Server runs at `http://localhost:8000` by default.

---

## Current Status

| Feature | Status |
|---|---|
| Auth (register / login / logout) | ✅ Complete |
| JWT access + refresh token flow | ✅ Complete |
| Redis refresh token storage + rotation | ✅ Complete |
| Global error handling | ✅ Complete |
| Rate limiting (IP + user-based) | ✅ Complete |
| Email verification | ✅ Complete |
| CORS configuration | ✅ Complete |
| Project management features | 🔲 Planned |
| Team / collaboration features | 🔲 Planned |
