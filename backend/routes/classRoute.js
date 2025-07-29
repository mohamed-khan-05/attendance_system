const express = require("express");
const admin = require("firebase-admin");

module.exports = (db) => {
  const router = express.Router();
  const classCollection = db.collection("class");

  // Get all classes
  router.get("/", async (req, res) => {
    try {
      const snapshot = await classCollection.get();
      const classes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(classes);
    } catch (err) {
      console.error("Error fetching classes:", err);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  // Create a new class
  // Create a new class
  router.post("/", async (req, res) => {
    const {
      module,
      startTime,
      endTime,
      location,
      lecturer,
      course,
      students = [],
    } = req.body;

    if (
      !module ||
      !startTime ||
      !endTime ||
      !location ||
      !lecturer ||
      !course
    ) {
      return res.status(400).json({ error: "Missing required class fields" });
    }

    try {
      const parseTimeToUnix = (timeStr) => {
        const [hour, minute] = timeStr.split(":").map(Number);
        const now = new Date();
        now.setHours(hour || 0, minute || 0, 0, 0);
        return Math.floor(now.getTime() / 1000);
      };

      const newClass = {
        module,
        startTime: parseTimeToUnix(startTime),
        endTime: parseTimeToUnix(endTime),
        location,
        lecturer,
        course,
        students,
        studentsCount: students.length || 0,
      };

      const docRef = await classCollection.add(newClass);
      res
        .status(201)
        .json({ message: "Class created successfully", id: docRef.id });
    } catch (err) {
      console.error("Error creating class:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Update class (lecturer assignment or time update)
  // Update class
  router.put("/:classId", async (req, res) => {
    const { classId } = req.params;
    const { startTime, endTime, location, lecturer, course, students } =
      req.body;

    try {
      const classRef = classCollection.doc(classId);
      const doc = await classRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Class not found" });
      }

      const classData = doc.data();
      const updateData = {};

      if (req.body.module && req.body.module !== classData.module) {
        return res.status(400).json({ error: "Module cannot be changed" });
      }

      const parseTimeToUnix = (timeStr) => {
        const [hour, minute] = timeStr.split(":").map(Number);
        const now = new Date();
        now.setHours(hour || 0, minute || 0, 0, 0);
        return Math.floor(now.getTime() / 1000);
      };

      if (startTime) updateData.startTime = parseTimeToUnix(startTime);
      if (endTime) updateData.endTime = parseTimeToUnix(endTime);
      if (location) updateData.location = location;
      if (lecturer) updateData.lecturer = lecturer;
      if (course) updateData.course = course;
      if (students) {
        updateData.students = students;
        updateData.studentsCount = students.length; // <== update count here
      }

      await classRef.update(updateData);
      res.json({ message: "Class updated successfully" });
    } catch (err) {
      console.error("Error updating class:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get attendance by class ID
  router.get("/class/:classId", async (req, res) => {
    try {
      const snapshot = await db
        .collection("attendance")
        .where("classId", "==", req.params.classId)
        .limit(1)
        .get();

      const attendance = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json(attendance);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  // Get classes assigned to a specific lecturer
  router.get("/lecturer/:lecturerId", async (req, res) => {
    try {
      const snapshot = await classCollection
        .where("lecturer", "==", req.params.lecturerId)
        .get();

      const classes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json(classes);
    } catch (err) {
      console.error("Error fetching lecturer's classes:", err);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  return router;
};
