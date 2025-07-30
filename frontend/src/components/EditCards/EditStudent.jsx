import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const EditStudent = ({ studentData, modules, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    studentNumber: "",
    modules: [], // array of selected module codes
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (studentData) {
      const studentModules = Array.isArray(studentData.modules)
        ? studentData.modules
        : typeof studentData.modules === "string"
        ? studentData.modules
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean)
        : [];

      setFormData({
        name: studentData.name || "",
        studentNumber: studentData.studentNumber || "",
        modules: studentModules,
      });
    }
  }, [studentData]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const toggleModule = (moduleCode) => {
    setFormData((prev) => {
      const modulesSet = new Set(prev.modules);
      if (modulesSet.has(moduleCode)) {
        modulesSet.delete(moduleCode);
      } else {
        modulesSet.add(moduleCode);
      }
      return { ...prev, modules: Array.from(modulesSet) };
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
      alert("Failed to update student");
    }
  };

  // Sort modules: selected first, then the rest
  const sortedModules = [...modules].sort((a, b) => {
    const aSelected = formData.modules.includes(a.code) ? 0 : 1;
    const bSelected = formData.modules.includes(b.code) ? 0 : 1;
    return aSelected - bSelected;
  });

  return (
    <div className="p-4 max-w-md">
      <h2 className="text-lg font-semibold mb-4">Edit Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Full Name</label>
          <input
            name="name"
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
            {formData.modules.length > 0
              ? formData.modules.join(", ")
              : "Select modules..."}
          </div>
          {dropdownOpen && (
            <div
              className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded border bg-white shadow-lg"
              role="listbox"
            >
              {sortedModules.length === 0 && (
                <div className="p-2 text-gray-500">No modules available</div>
              )}
              {sortedModules.map((module) => {
                const checked = formData.modules.includes(module.code);
                return (
                  <label
                    key={module.code}
                    className="flex items-center px-3 py-1 cursor-pointer hover:bg-gray-100"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModule(module.code)}
                      className="mr-2"
                    />
                    <span>
                      {module.name} ({module.code})
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
