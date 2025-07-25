// IdentifyUser.jsx
import React, { useState, useEffect } from "react";
import FaceCapture from "../FaceCapture"; // Adjust path as needed
import * as faceapi from "face-api.js";

const IdentifyUser = () => {
  const [users, setUsers] = useState([]);
  const [identifiedName, setIdentifiedName] = useState(null);
  const [matchScore, setMatchScore] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Load all students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/users/students`);
        const data = await res.json();
        setUsers(data.filter((u) => u.faceDescriptor)); // Only those with face data
      } catch (err) {
        console.error("Failed to fetch students:", err);
      }
    };

    fetchStudents();
  }, []);

  // Compare face descriptor with saved users
  const handleFaceCaptured = (capturedDescriptor) => {
    if (!users.length) return;

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

    const threshold = 0.6; // Typical threshold for face-api.js
    if (lowestDistance < threshold) {
      setIdentifiedName(bestMatch.name);
      setMatchScore(lowestDistance.toFixed(4));
    } else {
      setIdentifiedName("Unknown Face");
      setMatchScore(null);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Identify User</h2>
      <FaceCapture onFaceData={handleFaceCaptured} />

      {identifiedName && (
        <div className="mt-4">
          <p className="text-lg">
            <strong>Identified as:</strong>{" "}
            <span className="text-blue-600">{identifiedName}</span>
          </p>
          {matchScore && (
            <p className="text-sm text-gray-500">
              Match confidence: {matchScore}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default IdentifyUser;
