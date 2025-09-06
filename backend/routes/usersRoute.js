const express = require("express");
const bcrypt = require("bcryptjs");

module.exports = (db) => {
  const router = express.Router();
  const usersCollection = db.collection("users");

  // Helper to validate numeric student number
  const isNumeric = (value) => /^[0-9]+$/.test(value);

  // Get all students
  router.get("/students", async (req, res) => {
    try {
      const snapshot = await usersCollection
        .where("type", "==", "student")
        .get();
      const students = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(students);
    } catch (err) {
      console.error("Error fetching students:", err);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // Get all lecturers
  router.get("/lecturers", async (req, res) => {
    try {
      const snapshot = await usersCollection
        .where("type", "==", "lecturer")
        .get();
      const lecturers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(lecturers);
    } catch (err) {
      console.error("Error fetching lecturers:", err);
      res.status(500).json({ error: "Failed to fetch lecturers" });
    }
  });

  // Create new user (student or lecturer)
  router.post("/", async (req, res) => {
    const {
      name,
      email,
      password,
      studentNumber,
      modules,
      faceDescriptor,
      type,
    } = req.body;

    try {
      if (type === "lecturer") {
        if (!name || !email || !password) {
          return res
            .status(400)
            .json({ error: "Missing required lecturer fields" });
        }

        const emailCheck = await usersCollection
          .where("email", "==", email)
          .get();
        if (!emailCheck.empty) {
          return res.status(400).json({ error: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await usersCollection.add({
          name,
          email,
          password: hashedPassword,
          type: "lecturer",
        });
        return res
          .status(201)
          .json({ message: "Lecturer created successfully" });
      }

      if (type === "student") {
        if (!name || !studentNumber) {
          return res
            .status(400)
            .json({ error: "Missing required student fields" });
        }

        if (!isNumeric(studentNumber)) {
          return res
            .status(400)
            .json({ error: "Student number must contain only numbers" });
        }

        const studentCheck = await usersCollection
          .where("studentNumber", "==", studentNumber)
          .get();
        if (!studentCheck.empty) {
          return res
            .status(400)
            .json({ error: "Student number already exists" });
        }

        await usersCollection.add({
          name,
          studentNumber,
          modules: Array.isArray(modules) ? modules : [],
          faceDescriptor: faceDescriptor || null,
          type: "student",
        });
        return res
          .status(201)
          .json({ message: "Student created successfully" });
      }

      return res.status(400).json({ error: "Invalid user type" });
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Update lecturer info
  router.put("/lecturers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, oldPassword, newPassword } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    try {
      const userDoc = await usersCollection.doc(id).get();
      if (!userDoc.exists)
        return res.status(404).json({ error: "Lecturer not found" });
      if (userDoc.data().type !== "lecturer")
        return res.status(400).json({ error: "User is not a lecturer" });

      const user = userDoc.data();
      const updateData = { name };

      if (email && email !== user.email) {
        const emailCheck = await usersCollection
          .where("email", "==", email)
          .get();
        if (!emailCheck.empty && emailCheck.docs[0].id !== id) {
          return res.status(400).json({ error: "Email already in use" });
        }
        updateData.email = email;
      }

      if ((oldPassword && !newPassword) || (!oldPassword && newPassword)) {
        return res
          .status(400)
          .json({
            error:
              "Both old and new password must be provided to change password",
          });
      }

      if (oldPassword && newPassword) {
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid)
          return res.status(401).json({ error: "Incorrect old password" });
        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      await usersCollection.doc(id).update(updateData);
      res.json({ message: "Lecturer updated successfully" });
    } catch (err) {
      console.error("Error updating lecturer:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Update student info
  router.put("/students/:id", async (req, res) => {
    const { id } = req.params;
    const { name, studentNumber, modules } = req.body;

    if (!name || !studentNumber)
      return res
        .status(400)
        .json({ error: "Name and student number are required" });

    if (!isNumeric(studentNumber)) {
      return res
        .status(400)
        .json({ error: "Student number must contain only numbers" });
    }

    try {
      const userDoc = await usersCollection.doc(id).get();
      if (!userDoc.exists)
        return res.status(404).json({ error: "Student not found" });
      if (userDoc.data().type !== "student")
        return res.status(400).json({ error: "User is not a student" });

      const snCheck = await usersCollection
        .where("studentNumber", "==", studentNumber)
        .get();
      if (!snCheck.empty && snCheck.docs[0].id !== id) {
        return res.status(400).json({ error: "Student number already exists" });
      }

      const updateData = {
        name,
        studentNumber,
        modules: Array.isArray(modules) ? modules : [],
      };

      await usersCollection.doc(id).update(updateData);
      res.json({ message: "Student updated successfully" });
    } catch (err) {
      console.error("Error updating student:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
};
