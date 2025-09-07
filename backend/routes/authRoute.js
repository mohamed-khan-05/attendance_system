const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = (db) => {
  const router = express.Router();
  const usersCollection = db.collection("users");
  const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

  // Login route
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const snapshot = await usersCollection.where("email", "==", email).get();

      if (snapshot.empty)
        return res.status(400).json({ error: "Invalid credentials" });

      const userDoc = snapshot.docs[0];
      const user = userDoc.data();

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(400).json({ error: "Invalid credentials" });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: userDoc.id,
          name: user.name,
          email: user.email,
          type: user.type,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Send JWT as httpOnly cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60, // 1 hour
      });

      res.json({
        message: "Login successful",
        user: {
          id: userDoc.id,
          name: user.name,
          email: user.email,
          type: user.type,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Middleware to verify JWT
  const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };

  // Get session info
  router.get("/session", verifyToken, (req, res) => {
    res.json(req.user);
  });

  // Logout route
  router.post("/logout", (req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({ message: "Logged out" });
  });

  return router;
};
