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
            const aStart = new Date(a.startTime * 1000);
            const bStart = new Date(b.startTime * 1000);
            return aStart - bStart;
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
    const now = new Date();
    const nowSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const classStart = new Date(cls.startTime * 1000);
    const classEnd = new Date(cls.endTime * 1000);

    const startSeconds =
      classStart.getHours() * 3600 +
      classStart.getMinutes() * 60 +
      classStart.getSeconds();
    const endSeconds =
      classEnd.getHours() * 3600 +
      classEnd.getMinutes() * 60 +
      classEnd.getSeconds();

    return nowSeconds >= startSeconds && nowSeconds <= endSeconds;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#003366]">
          Welcome, {user?.name}
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {user?.type === "lecturer" && (
        <>
          <h2 className="text-xl font-semibold text-[#003366] tracking-wide">
            Your Assigned Classes
          </h2>

          <div className="flex gap-4 flex-wrap mb-4">
            <button
              onClick={() => navigate("/pastclass")}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              View Past Classes
            </button>
            <button
              onClick={() => navigate("/mark", { state: { user } })}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Student Attendance
            </button>
          </div>

          {assignedClasses.length === 0 ? (
            <p className="text-gray-600">No assigned classes.</p>
          ) : (
            <ul className="space-y-4">
              {assignedClasses.map((cls) => (
                <li
                  key={cls.id}
                  className="border rounded p-4 shadow-sm bg-[#f0f4f8] flex justify-between items-center"
                >
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-semibold text-[#003366]">
                        {cls.module}
                      </span>
                    </p>
                    <p>
                      Time:{" "}
                      {cls.startTime && cls.endTime
                        ? `${new Date(cls.startTime * 1000).toLocaleTimeString(
                            [],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )} - ${new Date(
                            cls.endTime * 1000
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "N/A"}
                    </p>
                    <p>Location: {cls.location}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap items-center">
                    <button
                      className={`px-3 py-1 rounded text-sm ${
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
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
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
