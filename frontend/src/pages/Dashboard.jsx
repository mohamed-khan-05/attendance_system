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
  const [editingClass, setEditingClass] = useState(null); // object with class info or null

  // Fetch user session
  useEffect(() => {
    if (!user) {
      axios
        .get(`${BACKEND_URL}/users/session`, { withCredentials: true })
        .then((res) => setUser(res.data))
        .catch(() => navigate("/"));
    }
  }, [user, setUser, navigate]);

  // Fetch lecturer's assigned classes
  useEffect(() => {
    if (user?.type === "lecturer") {
      axios
        .get(`${BACKEND_URL}/class/lecturer/${user.id}`)
        .then((res) => setAssignedClasses(res.data))
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

  // Open EditTime card with class info
  const openEditTimeCard = (cls) => {
    setEditingClass(cls);
  };

  // Close EditTime card
  const closeEditTimeCard = () => {
    setEditingClass(null);
  };

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
          {assignedClasses.length === 0 ? (
            <p>No assigned classes.</p>
          ) : (
            <ul className="space-y-3">
              {assignedClasses.map((cls) => (
                <li key={cls.id}>
                  <strong>{cls.module}</strong> | Time:{" "}
                  {cls.startTime && cls.endTime
                    ? `${new Date(cls.startTime * 1000).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} - ${new Date(cls.endTime * 1000).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}`
                    : "N/A"}{" "}
                  | Location: {cls.location}
                  <button
                    onClick={() => openEditTimeCard(cls)}
                    style={{ marginLeft: "10px" }}
                  >
                    Edit Time
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Render EditTime card popup if editingClass is set */}
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
