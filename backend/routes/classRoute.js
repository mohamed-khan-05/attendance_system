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
  router.post("/", async (req, res) => {
    const {
      moduleId,
      startTime,
      endTime,
      location,
      lecturer,
      course,
      students = [],
    } = req.body;

    if (
      !moduleId ||
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
        moduleId,
        startTime: parseTimeToUnix(startTime),
        endTime: parseTimeToUnix(endTime),
        location,
        lecturer,
        course,
        students,
        studentsCount: students.length,
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

  // Update class (lecturer assignment, time, students)
  router.put("/:classId", async (req, res) => {
    const { classId } = req.params;
    const {
      moduleId,
      startTime,
      endTime,
      location,
      lecturer,
      course,
      students,
    } = req.body;

    try {
      const classRef = classCollection.doc(classId);
      const doc = await classRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Class not found" });

      const updateData = {};
      if (moduleId) updateData.moduleId = moduleId;
      if (typeof startTime === "number") updateData.startTime = startTime;
      if (typeof endTime === "number") updateData.endTime = endTime;
      if (location) updateData.location = location;
      if (lecturer) updateData.lecturer = lecturer;
      if (course) updateData.course = course;
      if (Array.isArray(students)) {
        updateData.students = students;
        updateData.studentsCount = students.length;
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

  // Get classes assigned to a lecturer (with non-deleted modules)
  router.get("/lecturer/:lecturerId", async (req, res) => {
    try {
      const lecturerId = req.params.lecturerId;
      const snapshot = await classCollection
        .where("lecturer", "==", lecturerId)
        .get();
      const classDocs = snapshot.docs;

      const classesWithModules = await Promise.all(
        classDocs.map(async (doc) => {
          const classData = doc.data();
          const moduleId = classData.moduleId;
          if (!moduleId) return null;

          const moduleDoc = await db.collection("modules").doc(moduleId).get();
          if (!moduleDoc.exists || moduleDoc.data().status === "deleted")
            return null;

          const moduleData = moduleDoc.data();
          return {
            id: doc.id,
            ...classData,
            moduleName: moduleData.name || "(No name)",
            moduleCode: moduleData.code || "(No code)",
          };
        })
      );

      res.json(classesWithModules.filter(Boolean));
    } catch (err) {
      console.error("Error fetching lecturer's classes:", err);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  // Mark class as deleted
  router.put("/:id/delete", async (req, res) => {
    const { id } = req.params;
    try {
      await classCollection.doc(id).update({ status: "deleted" });
      res.json({ message: "Class marked as deleted" });
    } catch (err) {
      console.error("Error deleting class:", err);
      res.status(500).json({ error: "Failed to delete class" });
    }
  });

  return router;
};
