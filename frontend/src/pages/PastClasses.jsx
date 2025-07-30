import React, { useEffect, useState, useContext } from "react";
import { UserContext } from "../App";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const PastClasses = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attended, setAttended] = useState([]);
  const [filter, setFilter] = useState("attended");
  const [classMap, setClassMap] = useState({});
  const [moduleFilter, setModuleFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");

  const { user } = useContext(UserContext);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const handleBack = () => navigate("/lecturer");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lecturerId = user.id;
        if (!lecturerId) return;

        const { data: classes } = await axios.get(
          `${BACKEND_URL}/class/lecturer/${lecturerId}`
        );

        if (!classes || classes.length === 0) {
          setAttendanceRecords([]);
          setClassMap({});
          return;
        }

        const map = Object.fromEntries(classes.map((c) => [c.id, c]));
        setClassMap(map);

        const classIds = classes.map((c) => c.id);
        const { data: rawRecords } = await axios.post(
          `${BACKEND_URL}/attendance/by-class-ids`,
          { classIds, lecturerId }
        );

        const now = dayjs();
        const todayStr = now.format("YYYY-MM-DD");

        const filtered = rawRecords.filter((rec) => {
          const cls = map[rec.classId];
          if (!cls) return false;

          const isToday = rec.date === todayStr;
          if (isToday) {
            const nowUnix = now.unix();
            if (nowUnix >= cls.startTime && nowUnix <= cls.endTime) {
              return false;
            }
          }
          return true;
        });

        setAttendanceRecords(filtered);
      } catch (err) {
        console.error("Failed to fetch attendance", err);
      }
    };

    fetchData();
  }, []);

  const viewAttendance = async (rec) => {
    const cls = classMap[rec.classId];
    if (!cls) return;

    const dateFormatted = dayjs(rec.date).format("DD MMM YYYY");
    setSelectedClass({ ...rec, ...cls, date: dateFormatted });

    try {
      const { data } = await axios.get(`${BACKEND_URL}/users/students`);
      setStudents(data);
      setAttended(rec.studentsPresent || []);
      setFilter("attended");
      setStudentSearch("");
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  const filteredStudents = () => {
    let filtered = [];
    if (filter === "attended") {
      filtered = students.filter((s) => attended.includes(s.id));
    } else if (filter === "notAttended") {
      filtered = students.filter((s) => !attended.includes(s.id));
    } else {
      filtered = students;
    }

    if (studentSearch.trim() === "") return filtered;

    const searchLower = studentSearch.toLowerCase();
    return filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.studentNumber.toLowerCase().includes(searchLower)
    );
  };

  const grouped = {};
  attendanceRecords.forEach((rec) => {
    const cls = classMap[rec.classId];
    if (!cls) return;
    if (moduleFilter !== "all" && cls.module !== moduleFilter) return;

    if (!grouped[cls.module]) grouped[cls.module] = [];
    grouped[cls.module].push({ ...rec, ...cls });
  });

  const uniqueModules = Array.from(
    new Set(
      attendanceRecords.map((r) => classMap[r.classId]?.module).filter(Boolean)
    )
  );

  const closeModal = () => setSelectedClass(null);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-6 relative">
      <button id="back-button" onClick={handleBack}>
        ← Back to Dashboard
      </button>

      <h2 className="text-2xl font-bold text-center text-[#003366]">
        Past Classes Attendance
      </h2>

      <div className="mb-4">
        <label className="mr-2 font-medium">Filter by Module:</label>
        <select
          className="border px-2 py-1 rounded"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
        >
          <option value="all">All</option>
          {uniqueModules.map((mod) => (
            <option key={mod} value={mod}>
              {mod}
            </option>
          ))}
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-600">No past classes found.</p>
      ) : (
        Object.entries(grouped).map(([mod, records]) => (
          <div key={mod} className="mb-6">
            <h3 className="text-lg font-semibold border-b pb-1 text-[#003366]">
              {mod}
            </h3>
            <ul className="mt-2 space-y-2">
              {records.map((rec) => (
                <li
                  key={`${rec.classId}-${rec.date}`}
                  className="border p-3 rounded shadow-sm flex justify-between items-center bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-lg">
                      {dayjs(rec.date).format("DD MMM YYYY")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {dayjs.unix(rec.startTime).format("HH:mm")} -{" "}
                      {dayjs.unix(rec.endTime).format("HH:mm")} |{" "}
                      {rec.count ?? 0} attended
                    </div>
                  </div>
                  <button
                    onClick={() => viewAttendance(rec)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    View Attendance
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-5 relative shadow-lg">
            <button
              onClick={closeModal}
              className="absolute top-2 right-3 text-gray-600 hover:text-black text-xl font-bold"
            >
              ×
            </button>

            <h3 className="text-lg font-semibold mb-3 text-[#003366]">
              Attendance for: {selectedClass.module} on {selectedClass.date}
            </h3>

            <div className="flex gap-3 mb-3">
              {["all", "attended", "notAttended"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 rounded ${
                    filter === type
                      ? type === "attended"
                        ? "bg-green-600 text-white"
                        : type === "notAttended"
                        ? "bg-red-600 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {type === "all"
                    ? "All Students"
                    : type === "attended"
                    ? "Attended"
                    : "Not Attended"}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search students by name or number..."
              className="border px-3 py-2 mb-3 w-full rounded"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
            />

            {filteredStudents().length === 0 ? (
              <p className="text-gray-600">No students to display.</p>
            ) : (
              <ul className="space-y-1 max-h-64 overflow-auto">
                {filteredStudents().map((s) => (
                  <li key={s.id} className="border p-2 rounded bg-white">
                    {s.name} ({s.studentNumber})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PastClasses;
