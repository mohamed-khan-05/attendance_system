import React, { useEffect, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";

const PastClasses = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attended, setAttended] = useState([]);
  const [filter, setFilter] = useState("all");
  const [classMap, setClassMap] = useState({});
  const [moduleFilter, setModuleFilter] = useState("all");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchPastAttendance = async () => {
      try {
        const classRes = await axios.get(`${BACKEND_URL}/class`);
        const now = dayjs();

        const classes = {};
        const pastClassIds = [];

        classRes.data.forEach((cls) => {
          const endTime = dayjs.unix(cls.endTime);
          const startTime = dayjs.unix(cls.startTime);
          if (endTime.isBefore(now)) {
            classes[cls.id] = cls;
            pastClassIds.push(cls.id);
          }
        });

        setClassMap(classes);

        if (pastClassIds.length === 0) {
          setAttendanceRecords([]);
          return;
        }

        const attendanceRes = await axios.post(
          `${BACKEND_URL}/attendance/by-class-ids`,
          { classIds: pastClassIds }
        );

        setAttendanceRecords(attendanceRes.data);
      } catch (err) {
        console.error("Failed to fetch past attendance", err);
      }
    };

    fetchPastAttendance();
  }, []);

  const viewAttendance = async (record) => {
    const classData = classMap[record.classId];
    setSelectedClass({ ...record, ...classData });

    try {
      const studentsRes = await axios.get(`${BACKEND_URL}/users/students`);
      setStudents(studentsRes.data);
      setAttended(record.studentsPresent || []);
    } catch (err) {
      console.error("Error loading attendance", err);
    }
  };

  const filteredStudents = () => {
    if (filter === "attended") {
      return students.filter((s) => attended.includes(s.id));
    } else if (filter === "notAttended") {
      return students.filter((s) => !attended.includes(s.id));
    }
    return students;
  };

  const groupedByModule = {};
  attendanceRecords.forEach((record) => {
    const cls = classMap[record.classId];
    if (!cls) return;
    if (moduleFilter !== "all" && cls.module !== moduleFilter) return;

    if (!groupedByModule[cls.module]) {
      groupedByModule[cls.module] = [];
    }
    groupedByModule[cls.module].push({ ...record, ...cls });
  });

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

      {Object.keys(groupedByModule).length === 0 ? (
        <p>No past classes found.</p>
      ) : (
        Object.entries(groupedByModule).map(([moduleCode, records]) => (
          <div key={moduleCode} className="mb-6">
            <h3 className="text-lg font-semibold border-b pb-1">
              {moduleCode}
            </h3>
            <ul className="mt-2 space-y-2">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="border p-3 rounded shadow-sm flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">
                      {dayjs.unix(record.startTime).format("DD MMM YYYY")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {dayjs.unix(record.startTime).format("HH:mm")} -{" "}
                      {dayjs.unix(record.endTime).format("HH:mm")} |{" "}
                      {record.count} attended
                    </div>
                  </div>
                  <button
                    onClick={() => viewAttendance(record)}
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

          {filteredStudents().length === 0 ? (
            <p className="text-gray-600">No students to display.</p>
          ) : (
            <ul className="space-y-1">
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
