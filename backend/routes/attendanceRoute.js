// routes/attendanceRoute.js
const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");

module.exports = (db) => {
  const attendanceCollection = db.collection("attendance");

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
        // No record today → create new
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

  return router;
};
