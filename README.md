# Auth System Backend

A Node.js authentication service with JWT tokens, multi-device session management, email verification, and password reset.

## Overview

A complete authentication system handling user registration, JWT-based auth, multi-device session management, email verification, and password reset—with security and scalability as core concerns.

## Key Technical Achievements

**Architecture & Patterns**
- Layered architecture (Routes → Middleware → Controllers → Services → Models) for clean separation of concerns
- Middleware pipeline for composable auth, validation, rate limiting, and logging
- Global error handling with structured HTTP responses

**Authentication & Security**
- JWT-based auth with access/refresh token pattern + token versioning for instant logout
- Bcrypt password hashing (10 rounds) with secure password reset workflow
- Rate limiting on sensitive endpoints to prevent brute force attacks
- Role-based access control (RBAC) with admin/user roles

**Session Management**
- Multi-session support allowing users to track active sessions across devices
- Session tracking with IP address, device info, and activity timestamps
- Selective logout (per-session or bulk logout)

**Performance & Reliability**
- Redis integration for caching and rate limit tracking
- BullMQ job queue + worker pattern for async email processing (non-blocking)
- Winston structured logging with daily log rotation
- Graceful shutdown with proper database disconnection

## Tech Stack

- **Backend:** Node.js, Express.js (ES Modules)
- **Database:** MongoDB (Mongoose ODM)
- **Caching:** Redis (IORedis)
- **Auth:** JWT, bcrypt
- **Validation:** Joi
- **Jobs:** BullMQ + Nodemailer
- **Logging:** Winston with daily rotation
- **Dev:** Nodemon, dotenv

## Features

- ✅ User registration & email verification
- ✅ Secure login with JWT (access + refresh tokens)
- ✅ Password reset workflow via email
- ✅ Multi-device session tracking with logout control
- ✅ Role-based access control (Admin/User)
- ✅ Rate limiting on auth endpoints
- ✅ Async email processing with BullMQ workers
- ✅ Audit logging for sensitive operations
- ✅ Graceful error handling & structured logging

## Quick Start

```bash
# Install dependencies
npm install

# Configure .env (MongoDB, Redis, JWT_SECRET, SMTP credentials)
cp .env.example .env

# Start services in separate terminals
redis-server              # Terminal 1
mongod                    # Terminal 2
npm run dev               # Terminal 3
npm run worker:email      # Terminal 4 (for background jobs)
```

Server runs on `http://localhost:3000`

Health check: `curl http://localhost:3000/health`

## API Endpoints

**Authentication**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/verify-email` - Verify email token
- `POST /api/v1/auth/refresh-token` - Get new access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

**Session Management**
- `GET /api/v1/auth/sessions` - View all active sessions
- `POST /api/v1/auth/logout` - Logout specific session
- `POST /api/v1/auth/logout-all` - Logout all sessions

**User**
- `POST /api/v1/auth/change-password` - Change password
- `GET /api/v1/users/profile` - Get user profile

## Database Schema

**User**
- email (unique), password (bcrypt), role, emailVerified, tokenVersion, emailVerificationToken, passwordResetToken, lastLogin, isActive

**Session**
- userId, token, userAgent, ipAddress, isActive, createdAt, lastActivity, expiresAt

**Audit**
- userId, action, description, ipAddress, userAgent, metadata, createdAt

## Project Structure

```
src/
├── controllers/      # Route handlers (Auth, User)
├── middleware/       # Auth, validation, rate limiting, error handling, logging
├── models/          # MongoDB schemas (User, Session, Audit)
├── routes/          # API endpoints
├── services/        # Business logic (Email, Token, Queue)
├── queues/          # BullMQ job queue
├── workers/         # Background job workers (Email)
├── config/          # DB & Redis connections
└── utils/           # Logger, validation schemas, email utilities
```

## Key Implementation Details

| Aspect | Implementation |
|--------|---|
| **JWT** | Access token (24h) + Refresh token (7d) with token versioning |
| **Password** | Bcrypt hashing (10 salt rounds) |
| **Sessions** | Per-device tracking with IP, user agent, last activity |
| **Rate Limiting** | Dynamic per-endpoint (login: 5/min, register: 3/min, etc.) |
| **Email Queue** | BullMQ + Redis + worker process (non-blocking) |
| **Logging** | Winston with daily rotation (dev/error logs) |
| **Error Handling** | Global middleware with structured error responses |

## What Demonstrates My Skills

- **Backend Architecture:** Layered design with clear separation of concerns
- **Security:** JWT patterns, password hashing, rate limiting, input validation
- **Database:** MongoDB schema design with proper indexing
- **Async Processing:** Job queues for background tasks
- **Production-Ready:** Error handling, logging, graceful shutdown
- **Best Practices:** ES Modules, async/await, middleware composition

---

**Version:** 0.2.0
