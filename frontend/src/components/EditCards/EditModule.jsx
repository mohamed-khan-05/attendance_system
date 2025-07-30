import React, { useState } from "react";
import axios from "axios";

const EditModule = ({ moduleData, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    code: moduleData.code || "",
    name: moduleData.name || "",
  });

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      alert("Both code and name are required");
      return;
    }

    try {
      await axios.put(`${BACKEND_URL}/modules/${moduleData.id}`, formData);
      onSave();
    } catch (error) {
      console.error("Error updating module:", error);
      alert("Failed to update module");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Edit Module</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Module Code</label>
          <input
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Module Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
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

export default EditModule;
