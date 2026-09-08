const bcrypt = require("bcrypt");

const userModel = require("../models/userModel");

async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return res.status(400).json({
        error: "Username must contain between 3 and 50 characters",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must contain at least 8 characters",
      });
    }

    const emailAlreadyExists = await userModel.emailExists(cleanEmail);

    if (emailAlreadyExists) {
      return res.status(409).json({
        error: "Email already in use",
      });
    }

    const usernameAlreadyExists = await userModel.usernameExists(cleanUsername);

    if (usernameAlreadyExists) {
      return res.status(409).json({
        error: "Username already in use",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await userModel.createUser(
      cleanUsername,
      cleanEmail,
      passwordHash,
    );

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    return res.status(201).json({
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      error: "Failed to create account",
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await userModel.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

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
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Failed to login",
    });
  }
}

async function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.status(500).json({
        error: "Failed to logout",
      });
    }

    res.clearCookie("connect.sid");

    return res.json({
      message: "Logged out successfully",
    });
  });
}

async function me(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    const user = await userModel.findUserById(req.session.user.id);

    if (!user) {
      req.session.destroy(() => {});

      return res.status(401).json({
        error: "User not found",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error("Me error:", error);

    return res.status(500).json({
      error: "Failed to get user",
    });
  }
}

async function updateProfile(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: "Not authenticated",
      });
    }

    const { username, bio } = req.body;

    if (!username) {
      return res.status(400).json({
        error: "Username is required",
      });
    }

    const cleanUsername = username.trim();
    const cleanBio = typeof bio === "string" ? bio.trim() : "";

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      return res.status(400).json({
        error: "Username must contain between 3 and 50 characters",
      });
    }

    if (cleanBio.length > 160) {
      return res.status(400).json({
        error: "Bio cannot contain more than 160 characters",
      });
    }

    const usernameAlreadyExists = await userModel.usernameExistsForOtherUser(
      cleanUsername,
      req.session.user.id,
    );

    if (usernameAlreadyExists) {
      return res.status(409).json({
        error: "Username already in use",
      });
    }

    const user = await userModel.updateUser(
      req.session.user.id,
      cleanUsername,
      cleanBio,
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    req.session.user.username = user.username;

    return res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
};
