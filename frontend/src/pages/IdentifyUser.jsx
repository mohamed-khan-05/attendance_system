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
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-2xl p-8 border border-blue-100">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          Attendance for <span className="underline">{classModule}</span>
        </h2>

        <div className="mb-6 text-center">
          <p className="text-md text-gray-600">
            <strong>Detected:</strong>{" "}
            <span className="text-blue-700 font-semibold">
              {identifiedName || "Scanning..."}
            </span>
          </p>
          {matchScore && identifiedName !== "Unknown Face" && (
            <p className="text-sm text-gray-500 mt-1">
              Confidence Score: {matchScore}
            </p>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-full max-w-md aspect-video rounded-lg overflow-hidden border border-blue-300 shadow-sm bg-black">
            <FaceCapture onFaceData={handleFaceCaptured} />
          </div>
        </div>

        {marked && (
          <div className="mt-4 text-center bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg font-medium transition-all">
            ✅ Attendance marked successfully
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentifyUser;
