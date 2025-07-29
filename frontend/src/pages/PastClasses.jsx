import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

const PastClasses = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attended, setAttended] = useState([]);
  const [filter, setFilter] = useState("attended"); // default filter to 'attended'
  const [classMap, setClassMap] = useState({});
  const [moduleFilter, setModuleFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState(""); // NEW: search text

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = dayjs();
        const todayStr = now.format("YYYY-MM-DD");

        // Fetch all classes
        const { data: classes } = await axios.get(`${BACKEND_URL}/class`);
        const map = Object.fromEntries(classes.map((c) => [c.id, c]));
        setClassMap(map);

        const classIds = Object.keys(map);
        if (classIds.length === 0) return;

        // Fetch attendance records by class IDs
        const { data: rawRecords } = await axios.post(
          `${BACKEND_URL}/attendance/by-class-ids`,
          { classIds }
        );

        // Filter out today's ongoing attendance
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
      setFilter("attended"); // Reset filter on new attendance view
      setStudentSearch(""); // Reset search input when new attendance loaded
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

  // Group attendance records by module for display
  const grouped = {};
  attendanceRecords.forEach((rec) => {
    const cls = classMap[rec.classId];
    if (!cls) return;
    if (moduleFilter !== "all" && cls.module !== moduleFilter) return;

    if (!grouped[cls.module]) grouped[cls.module] = [];
    grouped[cls.module].push({ ...rec, ...cls });
  });

  // Get unique modules for module filter dropdown
  const uniqueModules = Array.from(
    new Set(
      attendanceRecords.map((r) => classMap[r.classId]?.module).filter(Boolean)
    )
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Past Classes</h2>

      <div className="mb-4">
        <label className="mr-2 font-medium">Filter by Module:</label>
        <select
          className="border px-2 py-1"
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
        <p>No past classes found.</p>
      ) : (
        Object.entries(grouped).map(([mod, records]) => (
          <div key={mod} className="mb-6">
            <h3 className="text-lg font-semibold border-b pb-1">{mod}</h3>
            <ul className="mt-2 space-y-2">
              {records.map((rec) => (
                <li
                  key={`${rec.classId}-${rec.date}`}
                  className="border p-3 rounded shadow-sm flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">
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
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">
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

          {/* Search input above students list */}
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
            <ul className="space-y-1 max-h-96 overflow-auto">
              {filteredStudents().map((s) => (
                <li key={s.id} className="border p-2 rounded">
                  {s.name} ({s.studentNumber})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default PastClasses;
// works
