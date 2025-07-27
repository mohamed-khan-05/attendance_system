import React, { useState, useEffect } from "react";

const EditTime = ({ classData, onSave, onCancel }) => {
  const [time, setTime] = useState("");

  useEffect(() => {
    if (classData?.time) {
      const date = new Date(classData.time * 1000);
      const hh = date.getHours().toString().padStart(2, "0");
      const mm = date.getMinutes().toString().padStart(2, "0");
      setTime(`${hh}:${mm}`);
    }
  }, [classData]);

  const handleSave = () => {
    if (time) {
      onSave(time);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-80 max-w-full">
        <h3 className="text-lg font-semibold mb-4">
          Edit Time for {classData.module}
        </h3>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
            disabled={!time}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTime;
