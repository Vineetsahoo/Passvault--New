# PassVault

PassVault is a split frontend and backend application for secure password and digital pass management.

## Overview

The repository is organized into two focused applications:

- [client/README.md](client/README.md) for the React + TypeScript frontend
- [server/README.md](server/README.md) for the Node.js + Express backend

The frontend handles the user experience, dashboard, and public pages. The backend provides authentication, persistence, encryption, and API endpoints.

## Project Layout

```
Passvault/
├── client/   # Frontend application and UI
├── server/   # Backend API and database services
└── README.md # Project overview and documentation entry point
```

## Core Capabilities

- Secure password and pass storage
- Authentication and protected user flows
- Dashboard views for monitoring and history
- QR, backup, sync, and sharing workflows
- Responsive UI with modern component architecture

## Development at a Glance

Run each app from its own folder so commands, environment variables, and dependencies stay isolated.

- Frontend: see [client/README.md](client/README.md)
- Backend: see [server/README.md](server/README.md)

## Recommended Setup

1. Install dependencies in both folders.
2. Configure the environment files described in the dedicated READMEs.
3. Start the backend first, then launch the frontend.

## Support Files

- [design.md](design.md) for product and UI direction
- [client/README.md](client/README.md) for frontend usage
- [server/README.md](server/README.md) for backend usage

## License

MIT