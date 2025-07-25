import React, { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const EditLecturer = ({ lecturer, onCancel, onSave }) => {
  const [formData, setFormData] = useState({
    name: lecturer.name || "",
    email: lecturer.email || "",
    oldPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (
      (formData.oldPassword && !formData.newPassword) ||
      (!formData.oldPassword && formData.newPassword)
    ) {
      alert("Please fill both old and new password to change password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/users/${lecturer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, type: "lecturer" }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update lecturer");
        setLoading(false);
        return;
      }

      alert("Lecturer updated successfully");
      onSave();
    } catch {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Lecturer</h2>

        <label className="block mb-2">
          Name
          <br />
          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="input"
            disabled={loading}
          />
        </label>

        <label className="block mb-2">
          Email
          <br />
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="input"
            disabled={loading}
          />
        </label>

        <label className="block mb-2">
          Old Password (leave blank if not changing)
          <br />
          <input
            name="oldPassword"
            type="password"
            value={formData.oldPassword}
            onChange={handleChange}
            className="input"
            disabled={loading}
          />
        </label>

        <label className="block mb-4">
          New Password (leave blank if not changing)
          <br />
          <input
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            className="input"
            disabled={loading}
          />
        </label>

        <div className="flex justify-between">
          <button
            className="btn bg-red-600 hover:bg-red-700"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn bg-green-600 hover:bg-green-700"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLecturer;
