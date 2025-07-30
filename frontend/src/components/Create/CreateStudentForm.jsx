import React, { useState } from "react";
import FaceCapture from "../../FaceCapture";

const CreateStudentForm = ({ onSubmit, onClose, modules }) => {
  const [formData, setFormData] = useState({
    name: "",
    studentNumber: "",
    faceDescriptor: null,
    modules: [],
  });

  const [search, setSearch] = useState("");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create student");

      alert("Student created!");
      onSubmit(); // refresh list
      onClose(); // close overlay
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

  const filteredModules = (query) =>
    modules.filter(
      (mod) =>
        mod.name.toLowerCase().includes(query.toLowerCase()) ||
        mod.code.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} // Close on overlay click
    >
      <div
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing on inside click
      >
        <h2 className="text-xl font-bold mb-4">Create New Student</h2>

        <input
          type="text"
          placeholder="Full Name"
          className="input w-full mb-3"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <input
          type="text"
          placeholder="Student Number"
          className="input w-full mb-3"
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
          <p className="text-sm text-green-600 mb-3">
            Face data captured ({formData.faceDescriptor.length} floats)
          </p>
        )}

        <input
          type="text"
          placeholder="Search Modules"
          className="input w-full mb-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="max-h-40 overflow-y-auto border p-2 rounded mb-4">
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

        <div className="flex justify-between">
          <button
            onClick={handleSubmit}
            disabled={!formData.faceDescriptor}
            className="btn bg-green-600 hover:bg-green-700"
          >
            Create Student
          </button>
          <button onClick={onClose} className="btn bg-red-600 hover:bg-red-700">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStudentForm;
