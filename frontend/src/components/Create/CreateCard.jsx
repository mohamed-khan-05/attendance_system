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

  const handleSubmit = () => {
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
      <button className="btn" onClick={() => setShow(true)}>
        + Create {title}
      </button>

      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add {title}</h2>
            {fields.map((field) => (
              <div key={field.name} className="mb-2">
                {field.type === "select" ? (
                  <select
                    className="input"
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
                    className="input"
                    value={formData[field.name]}
                    onChange={(e) => handleChange(e, field)}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-between">
              <button
                className="btn bg-green-600 hover:bg-green-700"
                onClick={handleSubmit}
              >
                Submit
              </button>
              <button
                className="btn bg-red-600 hover:bg-red-700"
                onClick={() => setShow(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCard;
