import React, { useState, useEffect } from "react";

const EditTime = ({ classData, onSave, onCancel }) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (classData?.startTime) {
      const startDate = new Date(classData.startTime * 1000);
      setStartTime(
        `${startDate.getHours().toString().padStart(2, "0")}:${startDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
    }
    if (classData?.endTime) {
      const endDate = new Date(classData.endTime * 1000);
      setEndTime(
        `${endDate.getHours().toString().padStart(2, "0")}:${endDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
    }
  }, [classData]);

  const handleSave = () => {
    if (startTime && endTime) {
      onSave({ startTime, endTime }); // pass both times as an object
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-80 max-w-full">
        <h3 className="text-lg font-semibold mb-4">
          Edit Time for {classData.module}
        </h3>
        <label className="block mb-2 font-medium">Start Time</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <label className="block mb-2 font-medium">End Time</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
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
            disabled={!startTime || !endTime}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTime;
