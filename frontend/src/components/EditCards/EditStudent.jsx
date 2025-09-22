import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const EditStudent = ({ studentData, modules, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    studentNumber: "",
    modules: [], // Firestore module IDs
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Initialize form data from studentData
  useEffect(() => {
    if (studentData) {
      // Normalize modules: array of strings
      let studentModules = [];
      if (Array.isArray(studentData.modules)) {
        studentModules = studentData.modules.map(String);
      } else if (studentData.modules) {
        // Split comma-separated string into array
        studentModules = studentData.modules.split(",").map((id) => id.trim());
      }

      setFormData({
        name: studentData.name || "",
        studentNumber: studentData.studentNumber || "",
        modules: studentModules,
      });
    }
  }, [studentData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const toggleModule = (moduleId) => {
    setFormData((prev) => {
      const modulesSet = new Set(prev.modules.map(String));
      const idStr = String(moduleId);
      if (modulesSet.has(idStr)) {
        modulesSet.delete(idStr);
      } else {
        modulesSet.add(idStr);
      }
      const newModules = Array.from(modulesSet);

      return { ...prev, modules: newModules };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.studentNumber.trim()) {
      alert("Name and student number are required");
      return;
    }

    try {
      await axios.put(`${BACKEND_URL}/users/students/${studentData.id}`, {
        name: formData.name,
        studentNumber: formData.studentNumber,
        modules: formData.modules,
      });

      onSave();
    } catch (error) {
      console.error("Error updating student:", error.response || error);
      alert(error.response?.data?.error || "Failed to update student");
    }
  };
  const studentModuleIds = new Set(formData.modules.map(String));

  const sortedModules = [...modules]
    .filter((mod) => mod.status !== "deleted")
    .sort((a, b) => {
      const aSelected = studentModuleIds.has(String(a.id)) ? 0 : 1;
      const bSelected = studentModuleIds.has(String(b.id)) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;
      return a.name.localeCompare(b.name);
    });
  const selectedModulesText =
    formData.modules
      .map((id) => modules.find((mod) => mod.id === id))
      .filter(Boolean)
      .map((mod) => `${mod.name} (${mod.code})`)
      .join(", ") || "Select modules...";

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Edit Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Full Name</label>
          <input
            name="name"
            maxLength={50}
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Student Number</label>
          <input
            name="studentNumber"
            maxLength={10}
            value={formData.studentNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <label className="block font-medium mb-1 cursor-pointer">
            Modules
          </label>
          <div
            className="border rounded p-2 cursor-pointer"
            onClick={() => setDropdownOpen((open) => !open)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setDropdownOpen((open) => !open);
              }
            }}
          >
            {selectedModulesText}
          </div>

          {dropdownOpen && (
            <div
              className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border bg-white shadow-lg"
              role="listbox"
            >
              {sortedModules.length === 0 && (
                <div className="p-2 text-gray-500">No modules available</div>
              )}
              {sortedModules.map((mod) => {
                const checked = studentModuleIds.has(String(mod.id));
                return (
                  <label
                    key={mod.id}
                    className="flex items-center px-3 py-1 cursor-pointer hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModule(mod.id)}
                      className="mr-2"
                    />
                    <span>
                      {mod.name} ({mod.code})
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditStudent;
