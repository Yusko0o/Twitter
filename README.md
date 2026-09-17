# Social Network

A full-stack social networking application inspired by modern social media platforms.

This project was built primarily to explore backend development, REST API design, authentication, relational databases, session management and the architecture of a complete web application.

The application allows users to create an account, authenticate securely, manage their profile, publish posts and interact with other users through social features.

> This repository is a portfolio project and is intended to be run locally. It is not currently operated as a public social networking service.

---

## Features

### Authentication

* User registration
* Login and logout
* Password hashing using bcrypt
* Persistent session-based authentication
* HTTP-only session cookies
* Protected API routes
* User session validation

### Profiles

* User profiles
* Custom usernames
* Profile pictures
* Biography
* Profile statistics
* Profile editing

### Posts

* Create posts
* Delete owned posts
* Text posts
* Image support
* Video support
* Chronological feed

### Social interactions

* Likes
* Comments
* Bookmarks
* Follow relationships
* Post sharing
* Feed search

---

## Tech Stack

### Backend

* Node.js
* Express.js
* PostgreSQL
* `pg`
* `express-session`
* bcrypt
* dotenv
* CORS

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* Fetch API

### Database

PostgreSQL is used for persistent application data, including:

* users
* posts
* likes
* comments
* bookmarks
* follows
* sessions

---

## Architecture

The backend follows a layered architecture:

```text
Client
   │
   │ HTTP / REST
   ▼
Express Router
   │
   ▼
Controllers
   │
   ▼
Models
   │
   ▼
PostgreSQL
```

The project separates HTTP routing, application logic and database access.

```text
backend/
├── controllers/
│   ├── authController.js
│   └── postController.js
│
├── middleware/
│   └── authMiddleware.js
│
├── models/
│   ├── userModel.js
│   └── postModel.js
│
├── routes/
│   ├── authRoutes.js
│   └── postRoutes.js
│
├── db/
│   └── init.js
│
├── database.js
├── sessionStore.js
└── server.js
```

---

## Authentication Flow

The application uses server-side sessions instead of storing authentication credentials in frontend JavaScript.

```text
Login
  │
  ▼
POST /api/auth/login
  │
  ▼
Password verification with bcrypt
  │
  ▼
Session created
  │
  ▼
Session stored server-side
  │
  ▼
HTTP-only cookie returned to browser
  │
  ▼
Browser automatically sends cookie
  │
  ▼
Authentication middleware
  │
  ▼
Protected resource
```

Passwords are never stored in plaintext.

The browser receives only a session identifier through an HTTP-only cookie.

---

## Security

Several security practices are implemented in the project:

* Password hashing with bcrypt
* Parameterized PostgreSQL queries
* HTTP-only authentication cookies
* Server-side session management
* Authentication middleware
* Ownership checks for protected resources
* Environment variables for sensitive configuration
* Input validation
* Generic authentication errors

Parameterized queries are used throughout the database layer to reduce SQL injection risks.

Example:

```sql
SELECT id, username
FROM users
WHERE email = $1
LIMIT 1;
```

User-controlled values are passed separately from the SQL query.

---

## Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE

SESSION_SECRET=replace_with_a_long_random_secret
```

Never commit the real `.env` file.

An `.env.example` file is provided to document the required configuration.

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd Twitter/backend
```

Install dependencies:

```bash
npm install
```

Configure the environment variables:

```bash
cp .env.example .env
```

Then configure your PostgreSQL connection and session secret.

Start the development server:

```bash
npm run dev
```

Or run the application normally:

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

---

## API Overview

Some of the main API routes include:

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/auth/me
PUT    /api/auth/me

GET    /api/posts
POST   /api/posts
DELETE /api/posts/:id
```

Additional endpoints handle likes, comments, bookmarks and other social interactions.

Detailed API documentation can be maintained inside:

```text
docs/API.md
```

---

## Database Design

The database uses relational relationships between users and social content.

```text
users
  │
  ├──────── posts
  │            │
  │            ├── likes
  │            └── comments
  │
  ├──────── follows
  │
  └──────── bookmarks
```

Foreign keys associate posts and interactions with their owners.

PostgreSQL constraints are used where appropriate to preserve data integrity.

---

## Project Goals

The main objective of this project is to demonstrate practical backend engineering skills, including:

* REST API development
* Authentication
* Session management
* SQL and relational database design
* Backend architecture
* Security fundamentals
* Client/server communication
* Asynchronous JavaScript
* Error handling

The frontend provides an interface for interacting with and demonstrating the backend functionality.

---

## Planned Improvements

Future improvements may include:

* Cursor-based feed pagination
* Automated backend tests
* Rate limiting
* Structured request validation
* Object storage for uploaded media
* Real-time notifications with WebSockets
* Docker support
* Improved logging
* API documentation

---

## Running Locally

This project is intentionally provided primarily as a local development demonstration rather than a publicly operated social network.

This keeps the repository focused on its technical purpose: demonstrating the architecture and implementation of a full-stack social networking application.

---

## Author

**Kilian**

Backend / Software Development Portfolio Project
