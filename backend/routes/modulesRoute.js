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

  // Update a module by ID
  // Update a module by ID
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { code, name } = req.body;

    if (!code || !name) {
      return res
        .status(400)
        .json({ error: "Module code and name are required" });
    }

    try {
      const moduleRef = modulesCollection.doc(id);
      const moduleDoc = await moduleRef.get();

      if (!moduleDoc.exists) {
        return res.status(404).json({ error: "Module not found" });
      }

      const oldCode = moduleDoc.data().code;

      // Check for duplicate code in other modules
      const codeQuery = await modulesCollection.where("code", "==", code).get();
      const duplicate = codeQuery.docs.find((doc) => doc.id !== id);
      if (duplicate) {
        return res.status(400).json({ error: "Module code already exists" });
      }

      // Update the module document
      await moduleRef.update({ code, name });

      const usersRef = db.collection("users");
      const usersSnap = await usersRef
        .where("modules", "array-contains", oldCode)
        .get();

      const batch = db.batch();

      usersSnap.forEach((doc) => {
        const userData = doc.data();
        const docRef = usersRef.doc(doc.id);

        // Update `modules` array
        const modules = userData.modules || [];
        const updatedModules = modules.map((m) => (m === oldCode ? code : m));
        batch.update(docRef, { modules: updatedModules });

        // Update `marks` map (only if type === "student")
        if (
          userData.type === "student" &&
          userData.marks?.[oldCode] !== undefined
        ) {
          const updatedMarks = { ...userData.marks };
          updatedMarks[code] = updatedMarks[oldCode];
          delete updatedMarks[oldCode];
          batch.update(docRef, { marks: updatedMarks });
        }
      });

      // Update any class documents that reference the old module code
      const classRef = db.collection("class");
      const classSnap = await classRef.where("module", "==", oldCode).get();

      classSnap.forEach((doc) => {
        batch.update(classRef.doc(doc.id), { module: code });
      });

      await batch.commit();

      res.json({ message: "Module updated and all references synced." });
    } catch (err) {
      console.error("Error updating module:", err);
      res
        .status(500)
        .json({ error: "Failed to update module and references." });
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
