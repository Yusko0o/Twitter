const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return res.status(400).json({
        error: "Username must contain between 3 and 50 characters",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        error: "Password must contain at least 8 characters",
      });
    }

    if (await userModel.emailExists(cleanEmail)) {
      return res.status(409).json({ error: "Email already in use" });
    }

    if (await userModel.usernameExists(cleanUsername)) {
      return res.status(409).json({ error: "Username already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userModel.createUser(cleanUsername, cleanEmail, passwordHash);

    return res.status(201).json({
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === "23505") {
      return res.status(409).json({ error: "Email or username already in use" });
    }

    return res.status(500).json({ error: "Failed to create account" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await userModel.findUserByEmail(cleanEmail);

    if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        console.error("Session regeneration error:", regenerateError);
        return res.status(500).json({ error: "Failed to login" });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save error:", saveError);
          return res.status(500).json({ error: "Failed to login" });
        }

        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Failed to login" });
  }
}

async function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ error: "Failed to logout" });
    }

    res.clearCookie("social.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.json({ message: "Logged out successfully" });
  });
}

async function me(req, res) {
  try {
    const user = await userModel.findUserById(req.user.id);
    return res.json(user);
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Failed to get user" });
  }
}

async function updateProfile(req, res) {
  try {
    const { username, bio, avatar } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const cleanUsername = String(username).trim();
    const cleanBio = typeof bio === "string" ? bio.trim() : "";
    let cleanAvatar = null;

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return res.status(400).json({
        error: "Username must contain between 3 and 50 characters",
      });
    }

    if (cleanBio.length > 160) {
      return res.status(400).json({ error: "Bio cannot contain more than 160 characters" });
    }

    if (avatar !== undefined && avatar !== null && avatar !== "") {
      if (typeof avatar !== "string") {
        return res.status(400).json({ error: "Invalid profile picture" });
      }

      const avatarPattern = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i;
      if (!avatarPattern.test(avatar)) {
        return res.status(400).json({
          error: "Profile picture must be a PNG, JPG, WEBP or GIF image",
        });
      }

      if (avatar.length > 3_000_000) {
        return res.status(400).json({ error: "Profile picture is too large" });
      }

      cleanAvatar = avatar;
    }

    if (await userModel.usernameExistsForOtherUser(cleanUsername, req.user.id)) {
      return res.status(409).json({ error: "Username already in use" });
    }

    const user = await userModel.updateUser(req.user.id, cleanUsername, cleanBio, cleanAvatar);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.session.user.username = user.username;
    req.session.save(() => {});

    return res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}

module.exports = { register, login, logout, me, updateProfile };
