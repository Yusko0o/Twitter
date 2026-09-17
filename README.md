# Social / Twitter-like app

A full-stack social network portfolio project built with Node.js, Express, PostgreSQL and vanilla HTML/CSS/JavaScript.

## Features

- Account registration, login and logout
- Persistent server-side sessions stored in PostgreSQL
- Password hashing with bcrypt
- User profile, bio and avatar editing
- Create and delete posts
- Image/video attachments for small demo files
- Likes, comments and bookmarks
- Search/filter in the home feed
- PostgreSQL schema initialization on server startup

## Run locally

1. Create a PostgreSQL database (Neon works).
2. Copy `backend/.env.example` to `backend/.env` and fill in your values.
3. Install and start the backend:

```bash
cd backend
npm install
npm run dev
```

4. Open `http://localhost:3000`.

The server automatically serves the frontend and creates the additional tables/indexes it needs.

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: long random secret used to sign the session cookie
- `PORT`: server port, default `3000`
- `NODE_ENV`: use `production` when deployed behind HTTPS
- `FRONTEND_URL`: comma-separated allowed CORS origins

## Important deployment note

In production, HTTPS is required because the session cookie is configured as `secure` when `NODE_ENV=production`.
