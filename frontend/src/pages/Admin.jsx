import React, { useState, useEffect } from "react";
import CreateCard from "../components/CreateCard";
import EditLecturer from "../components/EditCards/EditLecturer";
import CreateStudentForm from "../components/CreateStudentForm";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("modules");
  const [showStudentForm, setShowStudentForm] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [timetable, setTimetable] = useState([]);

  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null);

  const moduleFields = [
    { name: "code", placeholder: "Module Code" },
    { name: "name", placeholder: "Module Name" },
  ];

  const studentFields = [
    { name: "name", placeholder: "Full Name" },
    { name: "studentNumber", placeholder: "Student Number" },
    {
      name: "modules",
      type: "array",
      placeholder: "Module Codes (comma-separated)",
    },
    { name: "studentImage", placeholder: "Face Image Data" },
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
    const res = await fetch(`${BACKEND_URL}/users/students`);
    const data = await res.json();
    setStudents(data);
  };

  const fetchLecturers = async () => {
    const res = await fetch(`${BACKEND_URL}/users/lecturers`);
    const data = await res.json();
    setLecturers(data);
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/modules`);
      const data = await res.json();
      setModules(data);
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  };

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

  useEffect(() => {
    fetchStudents();
    fetchLecturers();
    fetchModules();
  }, [BACKEND_URL]);

  const tabs = ["modules", "students", "lecturers", "timetable"];

  return (
    <div className="p-6">
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
                  setShowStudentForm(false); // hide after submission if needed
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

        {activeTab === "timetable" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Timetable</h2>
            <CreateCard
              title="Timetable"
              fields={timetableFields}
              onSubmit={(data) => setTimetable([...timetable, data])}
            />
          </div>
        )}
      </div>

      {/* Render editing modal only for lecturers now */}
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
