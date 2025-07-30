import React, { useState } from "react";

const CreateCard = ({ title, fields, onSubmit }) => {
  const [formData, setFormData] = useState(
    Object.fromEntries(fields.map((field) => [field.name, field.default || ""]))
  );
  const [show, setShow] = useState(false);

  const handleChange = (e, field) => {
    const value =
      field.type === "array" ? e.target.value.split(",") : e.target.value;
    setFormData({ ...formData, [field.name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(
      Object.fromEntries(
        fields.map((field) => [field.name, field.default || ""])
      )
    );
    setShow(false);
  };

  return (
    <div>
      <button
        className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded mb-4"
        onClick={() => setShow(true)}
      >
        Create {title}
      </button>

      {show && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShow(false)}
        >
          <form
            onSubmit={handleSubmit}
            className="relative bg-white p-6 rounded-xl shadow-md w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-[#003366] mb-2">
              Add {title}
            </h2>

            {fields.map((field) => (
              <div key={field.name}>
                {field.type === "select" ? (
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
                    value={formData[field.name]}
                    onChange={(e) => handleChange(e, field)}
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.inputType || "text"}
                    placeholder={field.placeholder || field.name}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#003366]"
                    value={formData[field.name]}
                    onChange={(e) => handleChange(e, field)}
                  />
                )}
              </div>
            ))}

            <div className="flex justify-between pt-2">
              <button
                type="submit"
                className="bg-[#003366] hover:bg-[#002244] text-white rounded px-4 py-2 font-semibold transition"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="bg-[#cc0000] hover:bg-[#990000] text-white rounded px-4 py-2 font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateCard;
