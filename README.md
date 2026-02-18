# APIdoci - API Documentation Hub

APIdoci is an API documentation hub with login-gated ReDoc, built on Next.js App Router.

## Tech stack

- Next.js (App Router, Route Handlers)
- React + TypeScript
- Chakra UI v3 + Emotion
- React Hook Form
- ReDoc standalone bundle (`public/redoc.standalone.js`)

## What this app does

- Shows a login page at `/login`
- Authenticates against an upstream auth API
- Stores session data in an encrypted HTTP-only cookie
- Protects the docs page at `/`
- Serves OpenAPI JSON through `/api/spec`
- Renders docs via ReDoc using `NEXT_PUBLIC_OPENAPI_URL`

## Routes and methods used

Internal routes:

- `POST /api/auth/login`: validates credentials, calls upstream login, writes session cookie
- `POST /api/auth/activity`: refreshes activity timestamp and cookie TTL
- `POST /api/auth/logout`: calls upstream logout and clears local cookie
- `GET /api/spec`: returns parsed OpenAPI JSON (only for authenticated sessions)

Upstream auth API calls:

- `POST {AUTH_API_BASE_URL}/login`
- `POST {AUTH_API_BASE_URL}/GetLoggedUser`
- `POST {AUTH_API_BASE_URL}/LogoutUser`

## Login and session flow

1. User submits credentials in `components/auth/login-form.tsx`.
2. App calls `POST /api/auth/login`.
3. Server calls upstream `/login` and `/GetLoggedUser`.
4. Server stores `{ token, sessionId, applicationName, user, lastActivityAt }` in an encrypted cookie.
5. Visiting `/` requires an active session; otherwise user is redirected to `/login`.
6. `SessionActivityGuard` periodically calls `POST /api/auth/activity` and logs out on inactivity timeout.

Session details:

- Cookie is encrypted with AES-256-GCM (`lib/auth/session.ts`)
- Cookie is `httpOnly`, `sameSite=lax`, and `secure` in production
- Inactivity timeout is controlled by `SESSION_INACTIVITY_MINUTES`

## OpenAPI JSON delivery

Browser path:

- ReDoc loads from `NEXT_PUBLIC_OPENAPI_URL` (default: `/api/spec`)

Server source loading (`app/api/spec/route.ts`):

- Uses `OPENAPI_SPEC_SOURCE` when set
- Falls back to `public/demo.json` when unset
- Supports:
  - local file path (resolved inside project root only)
  - absolute `http/https` URL
- Parses JSON and returns it with:
  - `Cache-Control: private, no-store, max-age=0`

Typical local setup:

- Set `OPENAPI_SPEC_SOURCE=private/demo.json` in `.env.local`

## Environment variables

```dotenv
# Frontend URL ReDoc requests
NEXT_PUBLIC_OPENAPI_URL=/api/spec

# Source used by /api/spec (local path or absolute http/https URL)
OPENAPI_SPEC_SOURCE=private/demo.json

# Upstream auth service base URL
AUTH_API_BASE_URL=http://your-auth-api

# Application name sent to upstream auth API
AUTH_APPLICATION_NAME=com.lapp.flutter

# Optional fixed session id (useful in strict mock matching)
AUTH_DEMO_SESSION_ID=

# Secret used to encrypt/decrypt the auth cookie
AUTH_SESSION_SECRET=replace-with-a-long-random-secret

# Cookie name used for auth session
AUTH_SESSION_COOKIE_NAME=api_doci_auth

# Inactivity timeout
SESSION_INACTIVITY_MINUTES=30

# Minimum time before login submit is accepted (anti-bot)
LOGIN_MIN_SUBMIT_MS=1200
```

Notes:

- `AUTH_API_BASE_URL` can be provided with or without protocol; app normalizes it.
- In production, `AUTH_SESSION_SECRET` must be explicitly set.
- `LOGIN_MIN_SUBMIT_MS` and a honeypot field are both used by the login form.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Configure `.env.local` (copy from `.env.example`).

3. Start development server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000/login
```

## Demo account

Use this demo account on the login page:

- Username: `demo@example.com`
- Password: `demo123`

## Main files

- `app/page.tsx`: protected docs page
- `app/login/page.tsx`: login route entry
- `components/redoc/redoc-viewer.tsx`: ReDoc initialization and theme options
- `app/api/spec/route.ts`: authenticated OpenAPI JSON delivery
- `app/api/auth/login/route.ts`: login proxy + cookie creation
- `app/api/auth/activity/route.ts`: activity keep-alive
- `app/api/auth/logout/route.ts`: logout + cookie clear
- `lib/auth/external-api.ts`: upstream auth API integration
- `lib/auth/session.ts`: encrypted cookie session helpers
