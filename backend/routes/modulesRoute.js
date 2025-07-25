const express = require("express");

module.exports = (db) => {
  const router = express.Router();
  const modulesCollection = db.collection("modules");

  // Get all modules
  router.get("/", async (req, res) => {
    try {
      const snapshot = await modulesCollection.get();
      const modules = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((mod) => mod.status !== "deleted"); // 👈 Exclude deleted ones
      res.json(modules);
    } catch (err) {
      console.error("Error fetching modules:", err);
      res.status(500).json({ error: "Failed to fetch modules" });
    }
  });

  // Create a new module
  router.post("/", async (req, res) => {
    const { code, name } = req.body;

    if (!code || !name) {
      return res
        .status(400)
        .json({ error: "Module code and name are required" });
    }

    try {
      // Prevent duplicate module codes
      const existing = await modulesCollection.where("code", "==", code).get();

      if (!existing.empty) {
        return res.status(400).json({ error: "Module code already exists" });
      }

      const docRef = await modulesCollection.add({
        code,
        name,
        status: "active",
      }); // <-- add status here
      res.status(201).json({ id: docRef.id, code, name, status: "active" });
    } catch (err) {
      console.error("Error creating module:", err);
      res.status(500).json({ error: "Failed to create module" });
    }
  });

  // Optional: Delete a module
  router.put("/:id/delete", async (req, res) => {
    const { id } = req.params;
    try {
      await modulesCollection.doc(id).update({ status: "deleted" });
      res.json({ message: "Module marked as deleted" });
    } catch (err) {
      console.error("Error updating module status:", err);
      res.status(500).json({ error: "Failed to update module status" });
    }
  });

  return router;
};
