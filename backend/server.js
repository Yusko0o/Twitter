const express = require("express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");

const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const initDatabase = require("./db/init");
const PostgresSessionStore = require("./sessionStore");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET) {
  console.error("ERROR: SESSION_SECRET is missing from .env");
  process.exit(1);
}

if (isProduction) {
  app.set("trust proxy", 1);
}

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false, limit: "5mb" }));

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 24 * 30,
};

app.use(
  session({
    name: "social.sid",
    store: new PostgresSessionStore(),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: cookieOptions,
  }),
);

app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/template/index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/template/login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/template/register.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/template/profile.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    return next(error);
  }
  return res.status(500).json({ error: "Internal server error" });
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
