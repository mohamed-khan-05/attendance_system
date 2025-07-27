import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import CreateCard from "../components/CreateCard";
import EditLecturer from "../components/EditCards/EditLecturer";
import CreateStudentForm from "../components/CreateStudentForm";
import CreateClassForm from "../components/Create/CreateClassForm";
import EditClass from "../components/EditCards/EditClass";

const Admin = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("modules");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [timetable, setTimetable] = useState([]);

  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  const moduleFields = [
    { name: "code", placeholder: "Module Code" },
    { name: "name", placeholder: "Module Name" },
  ];

  const lecturerCreateFields = [
    { name: "name", placeholder: "Full Name" },
    { name: "email", placeholder: "Email" },
    { name: "password", inputType: "password", placeholder: "Password" },
  ];

  const timetableFields = [
    { name: "id", placeholder: "Timetable ID" },
    {
      name: "startTime",
      inputType: "datetime-local",
      placeholder: "Start Time",
    },
    { name: "endTime", inputType: "datetime-local", placeholder: "End Time" },
    { name: "status", placeholder: "Status" },
    { name: "lecturer", placeholder: "Lecturer Name or ID" },
    { name: "moduleCode", placeholder: "Module Code" },
  ];

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/users/students`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchLecturers = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/users/lecturers`);
      if (!res.ok) throw new Error("Failed to fetch lecturers");
      const data = await res.json();
      setLecturers(data);
    } catch (error) {
      console.error("Error fetching lecturers:", error);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/modules`);
      if (!res.ok) throw new Error("Failed to fetch modules");
      const data = await res.json();
      setModules(data);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/class`);
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const onClassCreated = () => {
    fetchClasses();
    setShowClassForm(false);
  };

  useEffect(() => {
    fetchStudents();
    fetchLecturers();
    fetchModules();
  }, [BACKEND_URL]);

  useEffect(() => {
    if (activeTab === "class") {
      fetchClasses();
    }
  }, [activeTab]);

  const deleteModule = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/modules/${id}/delete`, {
        method: "PUT",
      });
      if (res.ok) {
        setModules((prev) => prev.filter((m) => m.id !== id));
      } else {
        const result = await res.json();
        alert(result.error || "Failed to delete module");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Server error");
    }
  };

  const createUser = async (data) => {
    try {
      const res = await fetch(`${BACKEND_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        if (data.type === "student") fetchStudents();
        else if (data.type === "lecturer") fetchLecturers();
      } else {
        alert(result.error || "Failed to create user");
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  const handleEditClick = (type, item) => {
    setEditingType(type);
    if (type === "student") {
      setEditingItem({ ...item, modules: (item.modules || []).join(", ") });
    } else {
      setEditingItem(item);
    }
  };

  const formatTime = (time) => {
    if (!time) return "";
    if (typeof time === "number") {
      return new Date(time * 1000).toLocaleString();
    }
    const parsed = new Date(time);
    return isNaN(parsed.getTime()) ? "Invalid Date" : parsed.toLocaleString();
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed");
    }
  };

  const tabs = ["modules", "students", "lecturers", "class", "timetable"];

  return (
    <div className="p-6">
      <button onClick={handleLogout}>Logout</button>
      <div className="flex gap-4 mb-6 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-md font-semibold capitalize ${
              activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {/* Modules */}
        {activeTab === "modules" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Modules</h2>
            <CreateCard
              title="Module"
              fields={moduleFields}
              onSubmit={async (data) => {
                try {
                  const res = await fetch(`${BACKEND_URL}/modules`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                  });
                  const result = await res.json();
                  if (res.ok) {
                    setModules((prev) => [...prev, result]);
                  } else {
                    alert(result.error || "Failed to create module");
                  }
                } catch (err) {
                  console.error("Error:", err);
                  alert("Server error");
                }
              }}
            />
            <table className="w-full mt-6 table-auto border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Code</th>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod.id}>
                    <td className="border p-2">{mod.code}</td>
                    <td className="border p-2">{mod.name}</td>
                    <td className="border p-2">
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => deleteModule(mod.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Students */}
        {activeTab === "students" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Students</h2>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
              onClick={() => setShowStudentForm((prev) => !prev)}
            >
              {showStudentForm ? "Cancel" : "Create Student"}
            </button>
            {showStudentForm && (
              <CreateStudentForm
                onSubmit={(data) => {
                  createUser({ ...data, type: "student" });
                  setShowStudentForm(false);
                }}
                modules={modules}
              />
            )}
            <table className="w-full mt-6 table-auto border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Student Number</th>
                  <th className="border p-2">Modules</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="border p-2">{s.name}</td>
                    <td className="border p-2">{s.studentNumber}</td>
                    <td className="border p-2">
                      {(s.modules || []).join(", ")}
                    </td>
                    <td className="border p-2">
                      <button
                        className="btn bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        onClick={() => handleEditClick("student", s)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lecturers */}
        {activeTab === "lecturers" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Lecturers</h2>
            <CreateCard
              title="Lecturer"
              fields={lecturerCreateFields}
              onSubmit={(data) => createUser({ ...data, type: "lecturer" })}
            />
            <table className="w-full mt-6 table-auto border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map((l) => (
                  <tr key={l.id}>
                    <td className="border p-2">{l.name}</td>
                    <td className="border p-2">{l.email}</td>
                    <td className="border p-2">
                      <button
                        className="btn bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        onClick={() => handleEditClick("lecturer", l)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Class */}
        {activeTab === "class" &&
          (() => {
            const lecturerMap = Object.fromEntries(
              lecturers.map((l) => [l.id, l.name])
            );
            const studentMap = Object.fromEntries(
              students.map((s) => [s.id, s.name])
            );

            return (
              <div>
                <h2 className="text-xl font-bold mb-4">Classes</h2>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
                  onClick={() => setShowClassForm((prev) => !prev)}
                >
                  {showClassForm ? "Cancel" : "Add Class"}
                </button>
                {showClassForm && (
                  <CreateClassForm onClassCreated={onClassCreated} />
                )}
                <table className="w-full mt-6 table-auto border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Module</th>
                      <th className="border p-2">Time</th>
                      <th className="border p-2">Location</th>
                      <th className="border p-2">Lecturer</th>
                      <th className="border p-2">Course</th>
                      <th className="border p-2">Students</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-4">
                          No classes found.
                        </td>
                      </tr>
                    ) : (
                      classes.map((cls) => (
                        <tr key={cls.id}>
                          <td className="border p-2">{cls.module}</td>
                          <td className="border p-2">
                            {cls.startTime && cls.endTime
                              ? `${new Date(
                                  cls.startTime * 1000
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })} - ${new Date(
                                  cls.endTime * 1000
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : ""}
                          </td>

                          <td className="border p-2">{cls.location}</td>
                          <td className="border p-2">
                            {lecturerMap[cls.lecturer] || cls.lecturer}
                          </td>
                          <td className="border p-2">{cls.course}</td>
                          <td className="border p-2">
                            {(cls.students || [])
                              .map((sid) => studentMap[sid] || sid)
                              .join(", ")}
                          </td>
                          <td className="border p-2">
                            <button
                              className="btn bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                              onClick={() => setEditingClass(cls)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}
      </div>

      {/* Modals */}
      {editingClass && (
        <EditClass
          classData={editingClass}
          onCancel={() => setEditingClass(null)}
          onSave={() => {
            fetchClasses();
            setEditingClass(null);
          }}
          students={students}
          lecturers={lecturers}
        />
      )}

      {editingItem && editingType === "lecturer" && (
        <EditLecturer
          lecturer={editingItem}
          onCancel={() => {
            setEditingItem(null);
            setEditingType(null);
          }}
          onSave={async () => {
            await fetchLecturers();
            setEditingItem(null);
            setEditingType(null);
          }}
        />
      )}
    </div>
  );
};

export default Admin;
