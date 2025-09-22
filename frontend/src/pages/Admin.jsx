import React, { useState, useEffect, useContext, useRef } from "react";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import CreateCard from "../components/Create/CreateCard";
import CreateStudentForm from "../components/Create/CreateStudentForm";
import CreateClassForm from "../components/Create/CreateClassForm";

import EditLecturer from "../components/EditCards/EditLecturer";
import EditClass from "../components/EditCards/EditClass";
import EditModule from "../components/EditCards/EditModule";
import EditStudent from "../components/EditCards/EditStudent";

const Admin = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [activeTab, setActiveTab] = useState("modules");
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showClassForm, setShowClassForm] = useState(false);

  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [classes, setClasses] = useState([]);

  // Edit modal state
  const [editingModule, setEditingModule] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null);
  const [editingClass, setEditingClass] = useState(null);

  // Search
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fields for create cards
  const moduleFields = [
    { name: "code", placeholder: "Module Code", maxLength: 20 },
    { name: "name", placeholder: "Module Name", maxLength: 50 },
  ];

  const lecturerCreateFields = [
    { name: "name", placeholder: "Full Name", maxLength: 50 },
    { name: "email", placeholder: "Email", maxLength: 100 },
    {
      name: "password",
      inputType: "password",
      placeholder: "Password",
      maxLength: 50,
    },
  ];

  // Temporary caches to store original state
  // Cache for original data
  const originalCache = useRef({
    modules: [],
    students: [],
    lecturers: [],
    classes: [],
  });

  // Function to filter current tab
  const handleSearch = (query) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();

    switch (activeTab) {
      case "modules":
        if (!originalCache.current.modules.length) {
          originalCache.current.modules = [...modules];
        }
        setModules(
          originalCache.current.modules.filter(
            (m) =>
              m.name.toLowerCase().includes(lowerQuery) ||
              m.code.toLowerCase().includes(lowerQuery)
          )
        );
        break;

      case "students":
        if (!originalCache.current.students.length) {
          originalCache.current.students = [...students];
        }
        setStudents(
          originalCache.current.students.filter(
            (s) =>
              s.name.toLowerCase().includes(lowerQuery) ||
              s.studentNumber?.toLowerCase().includes(lowerQuery)
          )
        );
        break;

      case "lecturers":
        if (!originalCache.current.lecturers.length) {
          originalCache.current.lecturers = [...lecturers];
        }
        setLecturers(
          originalCache.current.lecturers.filter(
            (l) =>
              l.name.toLowerCase().includes(lowerQuery) ||
              l.email?.toLowerCase().includes(lowerQuery)
          )
        );
        break;

      case "class":
        if (!originalCache.current.classes.length) {
          originalCache.current.classes = [...classes];
        }
        setClasses(
          originalCache.current.classes.filter((c) => {
            const moduleName =
              modules.find((m) => m.id === c.moduleId)?.name || "";
            const lecturerName =
              lecturers.find((l) => l.id === c.lecturer)?.name || "";
            const studentNames = (c.students || [])
              .map((sid) => students.find((s) => s.id === sid)?.name || "")
              .join(" ");
            return (
              moduleName.toLowerCase().includes(lowerQuery) ||
              lecturerName.toLowerCase().includes(lowerQuery) ||
              studentNames.toLowerCase().includes(lowerQuery) ||
              c.location?.toLowerCase().includes(lowerQuery) ||
              c.course?.toLowerCase().includes(lowerQuery)
            );
          })
        );
        break;
    }

    // Reset to original state if query is empty
    if (!query) {
      switch (activeTab) {
        case "modules":
          setModules(originalCache.current.modules);
          break;
        case "students":
          setStudents(originalCache.current.students);
          break;
        case "lecturers":
          setLecturers(originalCache.current.lecturers);
          break;
        case "class":
          setClasses(originalCache.current.classes);
          break;
      }
    }
  };

  // When switching tabs, restore cached data
  useEffect(() => {
    setSearchQuery(""); // reset search input

    switch (activeTab) {
      case "modules":
        setModules(
          originalCache.current.modules.length
            ? originalCache.current.modules
            : modules
        );
        break;
      case "students":
        setStudents(
          originalCache.current.students.length
            ? originalCache.current.students
            : students
        );
        break;
      case "lecturers":
        setLecturers(
          originalCache.current.lecturers.length
            ? originalCache.current.lecturers
            : lecturers
        );
        break;
      case "class":
        setClasses(
          originalCache.current.classes.length
            ? originalCache.current.classes
            : classes
        );
        break;
    }
  }, [activeTab]);

  const deleteClass = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/class/${id}/delete`, {
        method: "PUT",
      });
      const result = await res.json();
      if (res.ok) {
        setClasses((prev) => prev.filter((cls) => cls.id !== id));
      } else {
        alert(result.error || "Failed to delete class");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // Fetch functions
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
      console.log(data);
    } catch (error) {
      console.error("Error fetching modules:", error);
    }
  };

  // Fetch classes with logs
  const fetchClasses = async () => {
    try {
      console.log("Fetching classes from backend...");
      const res = await fetch(`${BACKEND_URL}/class`);
      if (!res.ok) throw new Error("Failed to fetch classes");
      const data = await res.json();
      console.log("Raw classes data fetched:", data);
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
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

  // Create user helper
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

  // Delete module
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

  // Handler for clicking edit buttons
  const handleEditClick = (type, item) => {
    if (type === "student") {
      setEditingStudent({ ...item, modules: (item.modules || []).join(", ") });
    } else if (type === "module") {
      setEditingModule(item);
    } else if (type === "lecturer") {
      setEditingType(type);
      setEditingItem(item);
    }
  };

  // Logout
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

  // On class created callback
  const onClassCreated = () => {
    fetchClasses();
    setShowClassForm(false);
  };

  return (
    <div className="p-6 bg-white relative min-h-screen font-sans text-gray-900">
      <button
        onClick={handleLogout}
        className="absolute right-6 top-6 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md font-medium"
      >
        Logout
      </button>

      <div className="flex items-center mb-6 gap-6">
        {/* Tabs */}
        <div className="flex gap-2">
          {["modules", "students", "lecturers", "class"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-t-md font-semibold cursor-pointer capitalize transition ${
                activeTab === tab
                  ? "bg-blue-900 text-white shadow-md"
                  : "bg-gray-100 text-blue-900 hover:bg-blue-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Search bar */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition"
          />
        </div>
      </div>

      <div className="space-y-10">
        {/* Modules */}
        {activeTab === "modules" && (
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Modules</h2>

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

            <table className="w-full mt-6 table-auto border border-blue-900 rounded-md overflow-hidden">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="p-2 text-left">Code</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <tr key={mod.id} className="even:bg-gray-100">
                    <td className="border-t border-blue-900 p-2">{mod.code}</td>
                    <td className="border-t border-blue-900 p-2">{mod.name}</td>
                    <td className="border-t border-blue-900 p-2">
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2"
                        onClick={() => handleEditClick("module", mod)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-700 hover:underline"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete the module "${mod.name}"?`
                            )
                          ) {
                            deleteModule(mod.id);
                          }
                        }}
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
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Students</h2>

            <button
              className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded mb-4"
              onClick={() => setShowStudentForm((prev) => !prev)}
            >
              {showStudentForm ? "Cancel" : "Create Student"}
            </button>

            {showStudentForm && (
              <CreateStudentForm
                onSubmit={(data) => {
                  if (activeTab !== "students" && data.type !== "student") {
                    createUser(data);
                  }
                  setShowStudentForm(false);
                }}
                onClose={() => setShowStudentForm(false)}
                modules={modules}
              />
            )}

            <table className="w-full mt-6 table-auto border border-blue-900 rounded-md overflow-hidden">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Student Number</th>
                  <th className="p-2 text-left">Modules</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="even:bg-gray-100">
                    <td className="border-t border-blue-900 p-2">{s.name}</td>
                    <td className="border-t border-blue-900 p-2">
                      {s.studentNumber}
                    </td>
                    <td className="border-t border-blue-900 p-2">
                      {(s.modules || [])
                        .map((id) => {
                          const mod = modules.find((m) => m.id === id); // match by id instead of code
                          return mod ? mod.name : id;
                        })
                        .join(", ")}
                    </td>

                    <td className="border-t border-blue-900 p-2 space-x-2">
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        onClick={() => handleEditClick("student", s)}
                      >
                        Edit
                      </button>

                      <button
                        className="text-red-700 hover:underline"
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete the student "${s.name}"?`
                            )
                          ) {
                            try {
                              const res = await fetch(
                                `${BACKEND_URL}/users/${s.id}/delete`,
                                {
                                  method: "PUT",
                                }
                              );
                              if (!res.ok) throw new Error("Failed to delete");
                              // remove from state after delete
                              setStudents((prev) =>
                                prev.filter((stu) => stu.id !== s.id)
                              );
                            } catch (err) {
                              console.error(err);
                              alert("Error deleting student");
                            }
                          }
                        }}
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

        {/* Lecturers */}
        {activeTab === "lecturers" && (
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Lecturers</h2>

            <CreateCard
              title="Lecturer"
              fields={lecturerCreateFields}
              onSubmit={(data) => createUser({ ...data, type: "lecturer" })}
            />

            <table className="w-full mt-6 table-auto border border-blue-900 rounded-md overflow-hidden">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map((l) => (
                  <tr key={l.id} className="even:bg-gray-100">
                    <td className="border-t border-blue-900 p-2">{l.name}</td>
                    <td className="border-t border-blue-900 p-2">{l.email}</td>
                    <td className="border-t border-blue-900 p-2">
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2"
                        onClick={() => handleEditClick("lecturer", l)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-700 hover:underline"
                        onClick={async () => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete the lecturer "${l.name}"?`
                            )
                          ) {
                            try {
                              const res = await fetch(
                                `${BACKEND_URL}/users/${l.id}/delete`,
                                {
                                  method: "PUT",
                                }
                              );
                              if (!res.ok) throw new Error("Failed to delete");
                              // remove from lecturers state after delete
                              setLecturers((prev) =>
                                prev.filter((lec) => lec.id !== l.id)
                              );
                            } catch (err) {
                              console.error(err);
                              alert("Error deleting lecturer");
                            }
                          }
                        }}
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

        {/* Classes */}
        {activeTab === "class" && (
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Classes</h2>

            <button
              className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded mb-4"
              onClick={() => setShowClassForm((prev) => !prev)}
            >
              {showClassForm ? "Cancel" : "Create Class"}
            </button>

            {showClassForm && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                onClick={() => setShowClassForm(false)}
              >
                <div
                  className="bg-white p-6 rounded shadow-lg max-w-2xl w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CreateClassForm
                    onClassCreated={() => {
                      onClassCreated();
                      setShowClassForm(false);
                    }}
                    onClose={() => setShowClassForm(false)}
                  />
                </div>
              </div>
            )}

            <table className="w-full mt-6 table-auto border border-blue-900 rounded-md overflow-hidden">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="p-2 text-left">Module</th>
                  <th className="p-2 text-left">Time</th>
                  <th className="p-2 text-left">Location</th>
                  <th className="p-2 text-left">Lecturer</th>
                  <th className="p-2 text-left">Course</th>
                  <th className="p-2 text-left">Students</th>
                  <th className="p-2 text-left">Actions</th>
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
                  classes.map((cls) => {
                    const lecturerMap = Object.fromEntries(
                      lecturers.map((l) => [l.id, l.name])
                    );
                    const studentMap = Object.fromEntries(
                      students.map((s) => [s.id, s.name])
                    );

                    return (
                      <tr key={cls.id} className="even:bg-gray-100">
                        <td className="border-t border-blue-900 p-2">
                          {(() => {
                            if (!cls.moduleId) return "";
                            const moduleIds = [cls.moduleId]; // always wrap single string as array
                            const moduleNames = moduleIds.map((id) => {
                              const mod = modules.find((m) => m.id === id);
                              if (!mod) {
                                console.warn(
                                  `Module ID not found in modules list: ${id}`
                                );
                              }
                              return mod ? mod.name : id;
                            });
                            console.log(
                              `Class ID: ${cls.id}, Module ID: ${
                                cls.moduleId
                              }, Module Name: ${moduleNames.join(", ")}`
                            );
                            return moduleNames.join(", ");
                          })()}
                        </td>

                        <td className="border-t border-blue-900 p-2">
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
                        <td className="border-t border-blue-900 p-2">
                          {cls.location}
                        </td>
                        <td className="border-t border-blue-900 p-2">
                          {lecturerMap[cls.lecturer] || cls.lecturer}
                        </td>
                        <td className="border-t border-blue-900 p-2">
                          {cls.course}
                        </td>
                        <td className="border-t border-blue-900 p-2">
                          {(cls.students || [])
                            .map((sid) => studentMap[sid] || sid)
                            .join(", ")}
                        </td>
                        <td className="border-t border-blue-900 p-2">
                          <button
                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2"
                            onClick={() => setEditingClass(cls)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-700 hover:underline"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you sure you want to delete this class?`
                                )
                              ) {
                                deleteClass(cls.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT MODALS */}

      {/* Edit Module Modal */}
      {editingModule && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setEditingModule(null)}
        >
          <div
            className="bg-white p-6 rounded shadow-lg max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <EditModule
              moduleData={editingModule}
              onCancel={() => setEditingModule(null)}
              onSave={() => {
                fetchModules();
                setEditingModule(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setEditingStudent(null)}
        >
          <div
            className="bg-white p-6 rounded shadow-lg max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <EditStudent
              studentData={editingStudent}
              modules={modules}
              onCancel={() => setEditingStudent(null)}
              onSave={() => {
                fetchStudents();
                setEditingStudent(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => setEditingClass(null)}
        >
          <div
            className="bg-white p-6 rounded shadow-lg max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <EditClass
              classData={editingClass}
              onCancel={() => setEditingClass(null)}
              onSave={() => {
                fetchClasses();
                setEditingClass(null);
              }}
              modules={modules}
              students={students}
              lecturers={lecturers}
            />
          </div>
        </div>
      )}

      {/* Edit Lecturer Modal */}
      {editingItem && editingType === "lecturer" && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={() => {
            setEditingItem(null);
            setEditingType(null);
          }}
        >
          <div
            className="bg-white p-6 rounded shadow-lg max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
