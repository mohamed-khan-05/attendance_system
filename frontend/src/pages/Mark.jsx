import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";

const Mark = () => {
  const {
    user,
    attendanceData,
    setAttendanceData,
    lastFetched,
    fetchAttendanceData,
  } = useContext(UserContext);

  const navigate = useNavigate();
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [markInputs, setMarkInputs] = useState({});
  const [markLoading, setMarkLoading] = useState({});
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const now = new Date();
    if (!lastFetched || now - new Date(lastFetched) > 1000 * 60 * 2) {
      setLoading(true);
      fetchAttendanceData(user?.id).finally(() => setLoading(false));
    }
  }, [user]);

  if (!user?.id) return <div>Invalid user session.</div>;
  if (loading) return <div>Loading attendance data...</div>;

  const studentMap = {};
  attendanceData.forEach((classItem) => {
    classItem.students.forEach((student) => {
      if (!studentMap[student.id]) {
        studentMap[student.id] = {
          ...student,
          modules: [],
        };
      }

      const attended = student.attendance.filter((a) => a.present).length;
      const total = student.attendance.length;

      studentMap[student.id].modules.push({
        moduleCode: classItem.moduleCode,
        moduleName: classItem.moduleName,
        classId: classItem.classId,
        attendance: student.attendance,
        summary: `${attended}/${total}`,
        mark: student.marks?.[classItem.moduleCode] ?? null,
      });
    });
  });

  const students = Object.values(studentMap).filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(term) ||
      student.studentNumber.toLowerCase().includes(term)
    );
  });

  const handleMarkChange = (studentId, moduleCode, value) => {
    setMarkInputs((prev) => ({
      ...prev,
      [`${studentId}_${moduleCode}`]: value,
    }));
  };

  const submitMark = async (studentId, moduleCode) => {
    const key = `${studentId}_${moduleCode}`;
    const markValue = markInputs[key];

    if (markValue === undefined || markValue === "") {
      alert("Please enter a mark percentage (0-100).");
      return;
    }

    const markNumber = Number(markValue);
    if (isNaN(markNumber) || markNumber < 0 || markNumber > 100) {
      alert("Mark must be a number between 0 and 100.");
      return;
    }

    setMarkLoading((prev) => ({ ...prev, [key]: true }));

    try {
      await axios.post(`${BACKEND_URL}/mark/student/${studentId}`, {
        moduleCode,
        mark: markNumber,
      });

      // Local update to avoid refetch
      setAttendanceData((prevData) =>
        prevData.map((classItem) => {
          if (
            classItem.moduleCode === moduleCode &&
            classItem.students.some((s) => s.id === studentId)
          ) {
            return {
              ...classItem,
              students: classItem.students.map((s) =>
                s.id === studentId
                  ? {
                      ...s,
                      marks: { ...s.marks, [moduleCode]: markNumber },
                    }
                  : s
              ),
            };
          }
          return classItem;
        })
      );

      alert("Mark updated successfully");
    } catch (error) {
      console.error("Failed to update mark:", error);
      alert("Failed to update mark.");
    } finally {
      setMarkLoading((prev) => ({ ...prev, [key]: false }));
      setMarkInputs((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleBack = () => {
    navigate("/lecturer");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-6 font-sans">
      <button id="back-button" onClick={handleBack}>
        ← Back to Dashboard
      </button>

      <h2 className="text-2xl font-bold text-center text-[#003366] tracking-wide">
        Student Attendance & Marks Overview
      </h2>

      <input
        type="text"
        placeholder="Search by name or student number"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border p-2 rounded w-full mb-4"
      />

      {students.map((student) => (
        <div
          key={student.id}
          className="border rounded p-4 shadow-sm bg-[#f0f4f8]"
        >
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() =>
              setExpandedStudent(
                expandedStudent === student.id ? null : student.id
              )
            }
          >
            <div>
              <p className="font-semibold text-lg">{student.name}</p>
              <p className="text-sm text-gray-500">{student.studentNumber}</p>
            </div>
            <span className="text-blue-700 text-sm">
              {expandedStudent === student.id ? "Hide" : "View"} Attendance
            </span>
          </div>

          {expandedStudent === student.id && (
            <div className="mt-4 space-y-4">
              {student.modules.map((mod, idx) => {
                const attended = mod.attendance.filter((a) => a.present);
                const notAttended = mod.attendance.filter((a) => !a.present);
                const markKey = `${student.id}_${mod.moduleCode}`;
                const existingMark = student.marks?.[mod.moduleCode] ?? null;

                return (
                  <div key={idx} className="rounded p-4 bg-white border">
                    <h3 className="font-semibold mb-1 text-[#003366]">
                      {mod.moduleCode} - {mod.moduleName}
                    </h3>

                    <p className="text-sm text-gray-600 mb-3">
                      Attendance:{" "}
                      <span className="font-medium">{mod.summary}</span>
                    </p>

                    <div className="flex gap-4 items-center mb-3">
                      <label className="font-semibold">Mark:</label>
                      <span className="text-blue-700 font-semibold mr-2">
                        {existingMark !== null ? `${existingMark}%` : "N/A"}
                      </span>

                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Enter mark %"
                        value={markInputs[markKey] || ""}
                        onChange={(e) =>
                          handleMarkChange(
                            student.id,
                            mod.moduleCode,
                            e.target.value
                          )
                        }
                        className="border rounded p-1 w-20"
                      />

                      <button
                        disabled={markLoading[markKey]}
                        onClick={() => submitMark(student.id, mod.moduleCode)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {markLoading[markKey] ? "Saving..." : "Mark"}
                      </button>
                    </div>

                    <div className="flex justify-between gap-8">
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-700 mb-1">
                          Attended
                        </h4>
                        {attended.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm text-green-800 space-y-1">
                            {attended.map((a, i) => (
                              <li key={i}>{a.date}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">None</p>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-700 mb-1">
                          Not Attended
                        </h4>
                        {notAttended.length > 0 ? (
                          <ul className="list-disc pl-5 text-sm text-red-800 space-y-1">
                            {notAttended.map((a, i) => (
                              <li key={i}>{a.date}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">None</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Mark;
