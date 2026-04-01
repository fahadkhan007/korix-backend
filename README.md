# Korix Backend

Backend API for **Korix**, a project collaboration platform with authentication, project management, team invites, subprojects, and task workflows.

## Live Links

- Frontend: https://korix-frontend.vercel.app/
- Backend API: https://korix-backend.onrender.com/api

## What This Service Handles

- JWT auth with access and refresh tokens
- Email verification and resend verification flow
- Redis-backed refresh token storage
- Rate limiting with Redis
- Project creation and project listing
- Role-based project access
- Member invitations and invite acceptance
- Subproject creation
- Task creation, assignment, update, and deletion

## Stack

- Node.js
- TypeScript
- Express 5
- Prisma
- PostgreSQL
- Redis
- JWT
- Nodemailer

## Main API Areas

### Auth

Base path: `/api/auth`

- `POST /register`
- `POST /login`
- `POST /refresh`
- `GET /verify-email`
- `GET /profile`
- `POST /logout`
- `POST /resend-verification`

### Projects

Base path: `/api/projects`

- `POST /`
- `GET /`
- `GET /:projectId`
- `GET /:projectId/role`
- `POST /:projectId/members`
- `PATCH /:projectId/members`
- `GET /:projectId/subprojects`
- `POST /:projectId/subprojects`
- `POST /invites/accept`

### Tasks

Project-scoped task routes:

- `POST /api/projects/:projectId/tasks`
- `GET /api/projects/:projectId/tasks`
- `GET /api/projects/:projectId/tasks/:taskId`
- `PATCH /api/projects/:projectId/tasks/:taskId`
- `DELETE /api/projects/:projectId/tasks/:taskId`

## Project Structure

```text
backend/
├── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── app/
    ├── config/
    ├── controllers/
    ├── database/
    ├── middlewares/
    ├── models/
    ├── routers/
    ├── templates/
    └── utils/
```

## Environment Variables

Create a `.env` file in `backend/`.

```env
PORT=8000
FRONTEND_CLIENT_URL=http://localhost:5173
BACKEND_CLIENT_URL=http://localhost:8000
DATABASE_URL=postgresql://username:password@localhost:5432/korix
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
SMTP_KEY=your_smtp_key
SMTP_LOGIN=your_smtp_login
SMTP_FROM=your_from_email
SMTP_SERVER=your_smtp_server
SMTP_PORT=587
```

## Local Development

```bash
npm install
npm run generate
npx prisma migrate dev
npm run dev
```

The API runs on `http://localhost:8000`.

## Build

```bash
npm run build
npm start
```

Note: Prisma generate requires `DATABASE_URL` to be available in the environment.

## Current Status

- Auth flow is implemented
- Email verification is implemented
- Project and member flows are implemented
- Task backend API is implemented
- Frontend is already consuming this backend
- AI-driven task generation is planned for a future phase

## Notes

- Refresh tokens are stored in Redis
- Role checks are enforced at the project level
- Task assignment is restricted to existing project members
