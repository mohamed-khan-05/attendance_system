import React, { useState, useEffect } from "react";
import axios from "axios";

const EditClass = ({
  classData,
  lecturers = [],
  students = [],
  modules = [],
  onCancel,
  onSave,
}) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // Convert UNIX timestamp to HH:MM string
  const toTimeString = (unix) =>
    new Date(unix * 1000).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  // Initialize formData safely
  const [formData, setFormData] = useState({
    ...classData,
    startTime: classData.startTime ? toTimeString(classData.startTime) : "",
    endTime: classData.endTime ? toTimeString(classData.endTime) : "",
    students: Array.isArray(classData.students)
      ? classData.students
      : classData.students
      ? [classData.students]
      : [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [moduleInfo, setModuleInfo] = useState(null);

  // Update moduleInfo when modules array arrives or moduleId changes
  useEffect(() => {
    if (modules && modules.length > 0) {
      const found = modules.find((mod) => mod.id === classData.moduleId);
      if (found) {
        setModuleInfo(found);
      } else {
        console.warn(
          `Module ID not found in modules list: ${classData.moduleId}`,
          modules
        );
        setModuleInfo(null);
      }
    } else {
      console.warn("Modules array is empty or undefined");
      setModuleInfo(null);
    }
  }, [modules, classData.moduleId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStudentToggle = (id) => {
    setFormData((prev) => {
      const isSelected = prev.students.includes(id);
      return {
        ...prev,
        students: isSelected
          ? prev.students.filter((s) => s !== id)
          : [...prev.students, id],
      };
    });
  };

  const convertToUnix = (timeStr, referenceUnix) => {
    if (!timeStr) return referenceUnix || Math.floor(Date.now() / 1000);
    const [hours, minutes] = timeStr.split(":");
    const date = new Date(referenceUnix * 1000);
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return Math.floor(date.getTime() / 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      startTime: convertToUnix(formData.startTime, classData.startTime),
      endTime: convertToUnix(formData.endTime, classData.endTime),
    };

    try {
      await axios.put(`${BACKEND_URL}/class/${classData.id}`, payload);

      onSave();
    } catch (error) {
      console.error("Error updating class:", error.response || error);
      alert("Failed to update class");
    }
  };

  const sortedStudents = [
    ...students.filter((s) => formData.students.includes(s.id)),
    ...students.filter((s) => !formData.students.includes(s.id)),
  ];

  const filteredStudents = sortedStudents.filter((stud) =>
    stud.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Edit Class</h2>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[75vh] overflow-y-auto"
      >
        {/* Module name display */}
        <div>
          <label className="block font-medium">Module (locked)</label>
          <input
            type="text"
            value={moduleInfo ? `${moduleInfo.name} (${moduleInfo.code})` : ""}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        {/* Start and End Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block font-medium">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block font-medium">Location</label>
          <input
            type="text"
            name="location"
            maxLength={50}
            value={formData.location || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Lecturer */}
        <div>
          <label className="block font-medium">Lecturer</label>
          <select
            name="lecturer"
            value={formData.lecturer || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Lecturer</option>
            {lecturers.map((lect) => (
              <option key={lect.id} value={lect.id}>
                {lect.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course */}
        <div>
          <label className="block font-medium">Course</label>
          <input
            type="text"
            maxLength={50}
            name="course"
            value={formData.course || ""}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Students */}
        <div>
          <label className="block font-medium mb-1">Students</label>
          <input
            type="text"
            maxLength={50}
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
          />
          <div className="flex flex-col gap-2 max-h-52 overflow-y-auto border p-2 rounded">
            {filteredStudents.length === 0 ? (
              <p className="text-gray-500 text-center">No students found.</p>
            ) : (
              filteredStudents.map((stud) => (
                <label key={stud.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.students.includes(stud.id)}
                    onChange={() => handleStudentToggle(stud.id)}
                  />
                  {stud.name}
                </label>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
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

export default EditClass;
