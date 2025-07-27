const express = require("express");
const bcrypt = require("bcryptjs");

module.exports = (db) => {
  const router = express.Router();
  const usersCollection = db.collection("users");

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

      // Set session
      req.session.user = {
        id: userDoc.id,
        name: user.name,
        type: user.type,
        email: user.email,
      };

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

  // Get session info
  router.get("/session", (req, res) => {
    if (req.session.user) {
      return res.json(req.session.user);
    } else {
      return res.status(401).json({ error: "Not logged in" });
    }
  });

  // Logout route
  router.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  return router;
};
