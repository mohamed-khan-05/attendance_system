import React, { useEffect, useState } from "react";
import axios from "axios";

const CreateClassForm = ({ onClassCreated, onClose = () => {} }) => {
  const [formData, setFormData] = useState({
    moduleId: "", // changed from module
    startTime: "",
    endTime: "",
    location: "",
    lecturer: "",
    course: "",
    students: [],
  });

  const [modules, setModules] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [errors, setErrors] = useState({});

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modRes, lecRes, stuRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/modules`),
          axios.get(`${BACKEND_URL}/users/lecturers`),
          axios.get(`${BACKEND_URL}/users/students`),
        ]);
        // Filter out deleted modules
        setModules(modRes.data.filter((mod) => mod.status !== "deleted"));
        setLecturers(lecRes.data);
        setStudents(stuRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [BACKEND_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleModuleChange = (e) => {
    const selectedModuleId = e.target.value;
    const eligibleStudents = students.filter((s) =>
      (s.modules || []).includes(selectedModuleId)
    );
    setFilteredStudents(eligibleStudents);
    setFormData((prev) => ({
      ...prev,
      moduleId: selectedModuleId,
      students: [],
    }));
    setStudentSearch("");
    setErrors((prev) => ({ ...prev, moduleId: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.moduleId) newErrors.moduleId = "Please select a Module";
    if (!formData.startTime) newErrors.startTime = "Please select Start Time";
    if (!formData.endTime) newErrors.endTime = "Please select End Time";
    if (!formData.location.trim())
      newErrors.location = "Please fill in Location";
    if (!formData.lecturer) newErrors.lecturer = "Please select Lecturer";
    if (!formData.course.trim()) newErrors.course = "Please fill in Course";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/class`, formData);
      onClassCreated?.();
      setFormData({
        moduleId: "",
        startTime: "",
        endTime: "",
        location: "",
        lecturer: "",
        course: "",
        students: [],
      });
      setStudentSearch("");
      setFilteredStudents([]);
      setErrors({});
      onClose();
    } catch (err) {
      console.error("Failed to create class:", err);
    }
  };

  const ErrorText = ({ message }) => (
    <div className="text-red-600 text-sm mb-1">{message}</div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="relative bg-white p-6 rounded-xl shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {errors.moduleId && <ErrorText message={errors.moduleId} />}
        <select
          name="module"
          value={formData.module}
          onChange={handleModuleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
        >
          <option value="">Select Module</option>
          {modules
            .filter((mod) => mod.status === "active") // only show active modules
            .map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.name} ({mod.code})
              </option>
            ))}
        </select>

        {/* Start/End Time, Location, Lecturer, Course fields unchanged */}
        {errors.startTime && <ErrorText message={errors.startTime} />}
        <input
          type="time"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />

        {errors.endTime && <ErrorText message={errors.endTime} />}
        <input
          type="time"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />

        {errors.location && <ErrorText message={errors.location} />}
        <input
          type="text"
          name="location"
          placeholder="Class Location"
          value={formData.location}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />

        {errors.lecturer && <ErrorText message={errors.lecturer} />}
        <select
          name="lecturer"
          value={formData.lecturer}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
        >
          <option value="">Select Lecturer</option>
          {lecturers.map((lec) => (
            <option key={lec.id} value={lec.id}>
              {lec.name}
            </option>
          ))}
        </select>

        {errors.course && <ErrorText message={errors.course} />}
        <input
          type="text"
          name="course"
          placeholder="Course"
          value={formData.course}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />

        {/* Student selection */}
        <label className="block font-semibold">Select Students</label>
        <input
          type="text"
          placeholder="Search students..."
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
        />

        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
          {filteredStudents
            .filter((stu) =>
              `${stu.name} ${stu.studentNumber}`
                .toLowerCase()
                .includes(studentSearch.toLowerCase())
            )
            .map((stu) => (
              <label key={stu.id} className="block cursor-pointer select-none">
                <input
                  type="checkbox"
                  value={stu.id}
                  checked={formData.students.includes(stu.id)}
                  onChange={(e) => {
                    const selected = [...formData.students];
                    if (e.target.checked) selected.push(stu.id);
                    else selected.splice(selected.indexOf(stu.id), 1);
                    setFormData((prev) => ({ ...prev, students: selected }));
                  }}
                />
                <span className="ml-2">
                  {stu.name} ({stu.studentNumber})
                </span>
              </label>
            ))}
        </div>

        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-[#003366] hover:bg-[#002244] text-white rounded px-4 py-2 font-semibold transition"
          >
            Create Class
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-[#cc0000] hover:bg-[#990000] text-white rounded px-4 py-2 font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClassForm;
