const express = require("express");
const admin = require("firebase-admin"); // Needed for FieldPath.documentId()
const router = express.Router();
const dayjs = require("dayjs");

module.exports = (db) => {
  const attendanceCollection = db.collection("attendance");
  const classCollection = db.collection("class");

  // Mark attendance
  router.post("/mark", async (req, res) => {
    const { classId, studentId } = req.body;
    if (!classId || !studentId) {
      return res.status(400).json({ error: "Missing classId or studentId" });
    }
    const today = dayjs().format("YYYY-MM-DD");

    try {
      const snapshot = await attendanceCollection
        .where("classId", "==", classId)
        .where("date", "==", today)
        .limit(1)
        .get();

      if (snapshot.empty) {
        await attendanceCollection.add({
          classId,
          date: today,
          time: Math.floor(Date.now() / 1000),
          studentsPresent: [studentId],
          count: 1,
        });
        console.log("New attendance record created");
      } else {
        const doc = snapshot.docs[0];
        const data = doc.data();

        if (!data.studentsPresent.includes(studentId)) {
          const updatedList = [...data.studentsPresent, studentId];
          await doc.ref.update({
            studentsPresent: updatedList,
            count: updatedList.length,
          });
          console.log("Attendance updated");
        } else {
          console.log("Student already marked");
        }
      }
      return res.json({ success: true });
    } catch (err) {
      console.error("Error marking attendance:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  });

  // Get all attendance (no filter)
  router.get("/all", async (req, res) => {
    try {
      const snapshot = await attendanceCollection.get();
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json(data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  // Get attendance filtered by classIds and lecturerId
  // routes/attendanceRoute.js
  router.post("/by-class-ids", async (req, res) => {
    const { classIds } = req.body;

    if (!Array.isArray(classIds) || classIds.length === 0) {
      return res
        .status(400)
        .json({ error: "classIds must be a non-empty array" });
    }

    try {
      const results = [];
      for (let i = 0; i < classIds.length; i += 10) {
        const batch = classIds.slice(i, i + 10);
        const snapshot = await attendanceCollection
          .where("classId", "in", batch)
          .get();

        snapshot.forEach((doc) => results.push({ id: doc.id, ...doc.data() }));
      }

      return res.json(results);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      return res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  return router;
};
