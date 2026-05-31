# PassVault Client

PassVault Client is the React frontend for the PassVault application. It provides the user interface for authentication, dashboards, password workflows, QR tools, settings, and the public marketing pages.

## What This App Does

- Presents the public site and product pages
- Handles sign in, sign up, and authenticated navigation
- Renders the dashboard and user management screens
- Connects to the backend API for passwords, sync, backup, and notifications
- Falls back to demo mode when the API is unavailable

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router DOM
- Lucide React and React Icons
- Headless UI and Radix UI primitives

## Folder Guide

```text
src/
├── App.tsx              # Application routing and layout
├── main.tsx             # App bootstrap
├── index.css            # Global styles
├── components/          # Shared UI, auth, and dashboard components
├── pages/               # Public pages and feature pages
├── services/            # API, storage, sync, and domain services
└── utils/               # Validation and helper utilities
```

## Setup

### Prerequisites

- Node.js 18 or newer
- npm
- A running PassVault backend if you want real API data

### Install

```bash
cd client
npm install
```

### Environment Variables

Create a `.env` file in `client/`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_NODE_ENV=development
VITE_DEBUG=true
```

If your backend runs on a different host or port, update `VITE_API_URL` accordingly.

### Run Locally

```bash
npm run dev
```

The app runs at `http://localhost:5173` by default.

## Scripts

- `npm run dev` starts the Vite development server
- `npm run build` creates a production build
- `npm run preview` previews the production build locally
- `npm run lint` runs ESLint
- `npm run dev:backend` starts the backend from the client workspace
- `npm run dev:both` starts both frontend and backend together
- `npm run update-db` refreshes the browserslist database

## Usage

1. Start the backend first so authenticated flows can load real data.
2. Run the client with `npm run dev`.
3. Open `http://localhost:5173` in your browser.
4. Sign in with your account or use the demo mode if the backend is offline.

## Features

- Public landing pages and informational content
- Authentication screens and protected application routing
- Dashboard sections for passwords, history, backups, notifications, and settings
- QR code scanning and terminal QR workflows
- Responsive UI designed for desktop and mobile
- Client-side validation and service integration

## Build And Deploy

```bash
npm run build
npm run preview
```

The production output is written to `dist/`.

## Related Documentation

- [Project overview](../README.md)
- [Backend documentation](../server/README.md)
