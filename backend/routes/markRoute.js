const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  // POST /mark/student/:studentId
  // Body: { moduleCode: string, mark: number (0-100) }
  router.post("/student/:studentId", async (req, res) => {
    const { studentId } = req.params;
    const { moduleCode, mark } = req.body;

    if (!moduleCode || typeof mark !== "number") {
      return res
        .status(400)
        .json({ error: "moduleCode and mark are required" });
    }

    try {
      const userRef = db.collection("users").doc(studentId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "Student not found" });
      }

      const userData = userDoc.data();
      const marks = userData.marks || {}; // marks stored as { moduleCode: mark }

      // Update or add the mark for this module
      marks[moduleCode] = mark;

      await userRef.update({ marks });

      res.json({ message: "Mark updated successfully", marks });
    } catch (error) {
      console.error("Error updating student mark:", error);
      res.status(500).json({ error: "Failed to update mark" });
    }
  });

  // GET /mark/:lecturerId
  router.get("/:lecturerId", async (req, res) => {
    const { lecturerId } = req.params;

    try {
      // Fetch classes for this lecturer
      const classSnapshot = await db
        .collection("class")
        .where("lecturer", "==", lecturerId)
        .get();

      const classDocs = classSnapshot.docs;

      const results = await Promise.all(
        classDocs.map(async (classDoc) => {
          const classData = classDoc.data();
          const classId = classDoc.id;

          const moduleCode = classData.module; // moduleCode stored in class doc

          if (!moduleCode) {
            console.warn(`Class ${classId} has no module code`);
            return null;
          }

          // Query module document by 'code' field
          const moduleQuery = await db
            .collection("modules")
            .where("code", "==", moduleCode)
            .limit(1)
            .get();

          if (moduleQuery.empty) {
            console.warn(
              `Module with code ${moduleCode} not found for class ${classId}`
            );
            return null;
          }

          const moduleDoc = moduleQuery.docs[0];
          const moduleData = moduleDoc.data();

          if (moduleData.status === "deleted") {
            console.warn(`Module ${moduleCode} is marked as deleted`);
            return null;
          }

          // Fetch attendance records for this class
          const attendanceSnapshot = await db
            .collection("attendance")
            .where("classId", "==", classId)
            .get();
          const attendanceData = attendanceSnapshot.docs.map((d) => d.data());

          // Fetch student user docs
          const studentIds = classData.students || [];
          const studentDocs = await Promise.all(
            studentIds.map((sid) => db.collection("users").doc(sid).get())
          );

          // Build student attendance list, now including marks
          const studentsList = studentDocs.map((doc) => {
            const userData = doc.exists ? doc.data() : {};
            const attendanceRecord = attendanceData.map((record) => ({
              date: record.date,
              present: record.studentsPresent.includes(doc.id),
            }));

            return {
              id: doc.id,
              name: userData.name || "Unknown",
              studentNumber: userData.studentNumber || "",
              attendance: attendanceRecord,
              marks: userData.marks || {}, // <--- This line added here
            };
          });

          return {
            classId,
            moduleCode: moduleData.code || "(No code)",
            moduleName: moduleData.name || "(No name)",
            startTime: classData.startTime,
            students: studentsList,
          };
        })
      );

      // Remove any nulls (classes missing modules, deleted, etc)
      const filteredResults = results.filter(Boolean);

      res.json(filteredResults);
    } catch (err) {
      console.error("Error fetching lecturer attendance data:", err);
      res.status(500).json({ error: "Failed to fetch attendance data" });
    }
  });

  return router;
};
