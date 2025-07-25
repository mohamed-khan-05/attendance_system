import React, { useState } from "react";
import FaceCapture from "../FaceCapture"; // import FaceCapture component

const CreateStudentForm = ({ onSubmit, modules }) => {
  const [formData, setFormData] = useState({
    name: "",
    studentNumber: "",
    faceDescriptor: null, // changed from studentImage to faceDescriptor
    modules: [],
  });

  const handleSubmit = async () => {
    const studentData = {
      name: formData.name,
      studentNumber: formData.studentNumber,
      modules: formData.modules,
      faceDescriptor: formData.faceDescriptor,
      type: "student",
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create student");

      alert("Student created!");
      onSubmit(); // call optional refresh
    } catch (err) {
      alert(err.message);
    }
  };

  const handleModuleToggle = (mod) => {
    setFormData((prev) => {
      const exists = prev.modules.includes(mod.code);
      return {
        ...prev,
        modules: exists
          ? prev.modules.filter((m) => m !== mod.code)
          : [...prev.modules, mod.code],
      };
    });
  };

  const filteredModules = (query) => {
    return modules.filter(
      (mod) =>
        mod.name.toLowerCase().includes(query.toLowerCase()) ||
        mod.code.toLowerCase().includes(query.toLowerCase())
    );
  };

  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Full Name"
        className="input w-full"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="text"
        placeholder="Student Number"
        className="input w-full"
        value={formData.studentNumber}
        onChange={(e) =>
          setFormData({ ...formData, studentNumber: e.target.value })
        }
      />

      <FaceCapture
        onFaceData={(faceDescriptor) =>
          setFormData({ ...formData, faceDescriptor })
        }
      />
      {formData.faceDescriptor && (
        <p>Face data captured ({formData.faceDescriptor.length} floats)</p>
      )}

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search Modules"
          className="input w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-40 overflow-y-auto border p-2 rounded">
          {filteredModules(search).map((mod) => (
            <label
              key={mod.code}
              className="block hover:bg-gray-100 cursor-pointer px-2 py-1"
            >
              <input
                type="checkbox"
                checked={formData.modules.includes(mod.code)}
                onChange={() => handleModuleToggle(mod)}
              />{" "}
              {mod.name} ({mod.code})
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!formData.faceDescriptor}
        className="btn bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
      >
        Create Student
      </button>
    </div>
  );
};

export default CreateStudentForm;
