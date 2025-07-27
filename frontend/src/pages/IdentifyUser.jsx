import React, { useState, useEffect } from "react";
import FaceCapture from "../FaceCapture";
import * as faceapi from "face-api.js";
import { useLocation } from "react-router-dom";

const IdentifyUser = () => {
  const [users, setUsers] = useState([]);
  const [identifiedName, setIdentifiedName] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [marked, setMarked] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const location = useLocation();

  const classStudents = location.state?.students || [];
  const classModule = location.state?.module || "Unknown Module";
  const classId = location.state?.classId;

  useEffect(() => {
    const fetchClassStudentDetails = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/users/students`);
        const data = await res.json();
        const filtered = data.filter(
          (u) => classStudents.includes(u.id) && u.faceDescriptor
        );
        setUsers(filtered);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      }
    };

    fetchClassStudentDetails();
  }, [classStudents]);

  const handleFaceCaptured = async (capturedDescriptor) => {
    if (!users.length || marked) return;

    let bestMatch = null;
    let lowestDistance = Infinity;

    users.forEach((user) => {
      const distance = faceapi.euclideanDistance(
        capturedDescriptor,
        user.faceDescriptor
      );
      if (distance < lowestDistance) {
        lowestDistance = distance;
        bestMatch = user;
      }
    });

    const threshold = 0.6;
    if (lowestDistance < threshold) {
      setIdentifiedName(bestMatch.name);
      setMatchScore(lowestDistance.toFixed(4));

      try {
        const res = await fetch(`${BACKEND_URL}/attendance/mark`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ classId, studentId: bestMatch.id }),
        });

        const result = await res.json();
        if (result.success) {
          setMarked(true);
          console.log("Attendance marked");
        } else {
          console.warn("Attendance marking failed:", result);
        }
      } catch (err) {
        console.error("Error marking attendance:", err);
      }
    } else {
      setIdentifiedName("Unknown Face");
      setMatchScore(null);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">
        Taking Attendance for {classModule}
      </h2>

      <div className="mb-4 text-lg">
        <strong>Detected:</strong>{" "}
        <span className="text-blue-600">{identifiedName || "Scanning..."}</span>
      </div>

      <FaceCapture onFaceData={handleFaceCaptured} />

      {matchScore && identifiedName !== "Unknown Face" && (
        <p className="text-sm text-gray-500 mt-2">
          Match confidence: {matchScore}
        </p>
      )}

      {marked && (
        <p className="text-green-600 font-medium mt-4">
          ✅ Attendance marked successfully.
        </p>
      )}
    </div>
  );
};

export default IdentifyUser;
