const express = require("express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");

const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  console.error("ERROR: SESSION_SECRET is missing from .env");
  process.exit(1);
}

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

app.use(express.static(path.join(__dirname, "../frontend")));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
