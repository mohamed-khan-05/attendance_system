import React, { useState } from "react";
import axios from "axios";

const EditClass = ({
  classData,
  modules,
  lecturers,
  students,
  onCancel,
  onSave,
}) => {
  // Convert UNIX timestamp to HH:MM
  const toTimeString = (unix) =>
    new Date(unix * 1000).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const [formData, setFormData] = useState({
    ...classData,
    startTime: toTimeString(classData.startTime),
    endTime: toTimeString(classData.endTime),
    students: classData.students || [],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.put(`${BACKEND_URL}/class/${classData.id}`, {
        ...formData,
      });
      onSave();
    } catch (error) {
      console.error("Error updating class:", error);
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
    <div className="p-4 border rounded shadow-md bg-white">
      <h2 className="text-lg font-semibold mb-4">Edit Class</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Module (locked)</label>
          <input
            type="text"
            value={formData.module}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

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

        <div>
          <label className="block font-medium">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Lecturer</label>
          <select
            name="lecturer"
            value={formData.lecturer}
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

        <div>
          <label className="block font-medium">Course</label>
          <input
            type="text"
            name="course"
            value={formData.course}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Students</label>
          <input
            type="text"
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
