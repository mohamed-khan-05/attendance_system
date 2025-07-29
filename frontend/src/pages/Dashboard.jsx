import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EditTime from "../components/EditCards/EditTime";

const Dashboard = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const [assignedClasses, setAssignedClasses] = useState([]);
  const [editingClass, setEditingClass] = useState(null);

  useEffect(() => {
    if (!user) {
      axios
        .get(`${BACKEND_URL}/users/session`, { withCredentials: true })
        .then((res) => setUser(res.data))
        .catch(() => navigate("/"));
    }
  }, [user, setUser, navigate]);

  useEffect(() => {
    if (user?.type === "lecturer") {
      axios
        .get(`${BACKEND_URL}/class/lecturer/${user.id}`)
        .then((res) => {
          const now = Math.floor(Date.now() / 1000);
          const sorted = res.data.sort((a, b) => {
            const aActive = now >= a.startTime && now <= a.endTime;
            const bActive = now >= b.startTime && now <= b.endTime;

            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;

            const aPast = now > a.endTime;
            const bPast = now > b.endTime;

            if (!aPast && bPast) return -1;
            if (aPast && !bPast) return 1;

            return a.startTime - b.startTime;
          });

          setAssignedClasses(sorted);
        })
        .catch((err) => console.error("Failed to fetch classes", err));
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed");
    }
  };

  const openEditTimeCard = (cls) => setEditingClass(cls);
  const closeEditTimeCard = () => setEditingClass(null);

  const saveNewTime = async ({ startTime, endTime }) => {
    try {
      await axios.put(`${BACKEND_URL}/class/${editingClass.id}`, {
        startTime,
        endTime,
      });
      const updated = await axios.get(
        `${BACKEND_URL}/class/lecturer/${user.id}`
      );
      setAssignedClasses(updated.data);
      closeEditTimeCard();
    } catch (err) {
      console.error("Failed to update time", err);
      alert("Failed to update time");
    }
  };

  const isClassActive = (cls) => {
    const now = Math.floor(Date.now() / 1000);
    return now >= cls.startTime && now <= cls.endTime;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.name}</h1>

      <button
        onClick={handleLogout}
        className="mb-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Logout
      </button>

      {user?.type === "lecturer" && (
        <>
          <h2 className="text-xl font-semibold mb-2">Your Assigned Classes</h2>
          <button
            onClick={() => navigate("/pastclass")}
            className="mb-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            View Past Classes
          </button>
          {assignedClasses.length === 0 ? (
            <p>No assigned classes.</p>
          ) : (
            <ul className="space-y-3">
              {assignedClasses.map((cls) => (
                <li
                  key={cls.id}
                  className="border p-3 rounded flex justify-between items-center bg-gray-50"
                >
                  <div>
                    <strong>{cls.module}</strong> | Time:{" "}
                    {cls.startTime && cls.endTime
                      ? `${new Date(cls.startTime * 1000).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )} - ${new Date(cls.endTime * 1000).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}`
                      : "N/A"}{" "}
                    | Location: {cls.location}
                  </div>
                  <div className="flex gap-2 items-center">
                    <button
                      className={`px-3 py-1 rounded ${
                        isClassActive(cls)
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-400 text-white cursor-not-allowed"
                      }`}
                      disabled={!isClassActive(cls)}
                      onClick={() =>
                        navigate("/identify", {
                          state: {
                            students: cls.students,
                            classId: cls.id,
                            module: cls.module,
                          },
                        })
                      }
                    >
                      Take Attendance
                    </button>
                    <button
                      className="px-3 py-1 border rounded hover:bg-gray-200"
                      onClick={() => openEditTimeCard(cls)}
                    >
                      Edit Time
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {editingClass && (
        <EditTime
          classData={editingClass}
          onSave={saveNewTime}
          onCancel={closeEditTimeCard}
        />
      )}
    </div>
  );
};

export default Dashboard;
