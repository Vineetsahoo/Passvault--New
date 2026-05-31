# PassVault Server

PassVault Server is the Node.js and Express backend for the PassVault application. It exposes the API used by the client for authentication, password storage, alerts, sharing, sync, documents, and other account workflows.

## What This API Provides

- User registration, login, session refresh, and logout
- Password and secure document persistence
- Sharing, backup, sync, and transaction flows
- QR code and terminal QR support
- Monitoring, alerts, history, and storage endpoints
- Logging, validation, and security middleware

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- bcryptjs for password hashing
- helmet, cors, and express-rate-limit for security
- Joi and express-validator for validation
- Winston for logging
- Nodemon for local development

## Folder Guide

```text
server/
├── models/        # Database models
├── routes/        # API route handlers
├── middleware/    # Auth, uploads, and error handling middleware
├── services/      # Integrations such as email and Google Drive
├── scripts/       # Setup, seed, and maintenance scripts
├── utils/         # Shared helpers and utilities
├── logs/          # Runtime log output
├── uploads/       # Uploaded document storage
└── server.js      # Application entry point
```

## Setup

### Prerequisites

- Node.js 16 or newer
- npm
- MongoDB locally or a MongoDB Atlas connection string

### Install

```bash
cd server
npm install
```

### Environment Variables

Create a `.env` file in `server/` with values similar to these:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/passvault
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
JWT_REFRESH_EXPIRE=7d
BCRYPT_SALT_ROUNDS=12
CLIENT_URL=http://localhost:5173
ENCRYPTION_KEY=your-32-character-encryption-key
```

Update the values for your environment before running in production.

### Run Locally

```bash
npm run dev
```

The API runs on `http://localhost:5000` by default.

## Scripts

- `npm run dev` starts the server with nodemon
- `npm start` starts the production server
- `npm test` runs the test suite
- `npm run init` runs initial setup tasks
- `npm run setup` performs environment setup helpers
- `npm run test:db` checks the database connection
- `npm run seed` seeds sample data
- `npm run manage-shares` opens the share management utility
- `npm run generate-qr` generates terminal QR output
- `npm run check-ip` checks the current IP address

## API Usage

Common endpoints include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/passwords`
- `POST /api/passwords`
- `GET /api/documents`
- `GET /api/alerts`
- `GET /api/sync`

Use the client documentation and network requests as the primary reference for payload shapes and runtime behavior.

## Features

- JWT-based authentication with refresh tokens
- Secure password and document handling
- Account, device, and profile management
- Backup, sync, and sharing support
- Validation, rate limiting, and security headers
- Detailed logs and operational scripts

## Usage Notes

1. Start MongoDB before launching the server.
2. Configure `.env` before the first run.
3. Start this backend before the client so API calls resolve correctly.
4. Review the logs in `logs/` when diagnosing failures.

## Health And Debugging

- Health checks are available from the application routes if enabled in your environment.
- Runtime logs are written to `logs/`.
- Use the provided scripts for seeding, setup, and database verification.

## Related Documentation

- [Project overview](../README.md)
- [Client documentation](../client/README.md)