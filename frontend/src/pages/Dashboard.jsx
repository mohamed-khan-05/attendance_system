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
          const sorted = res.data.sort(
            (a, b) =>
              new Date(a.startTime * 1000) - new Date(b.startTime * 1000)
          );
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
    <div className="max-w-5xl mx-auto p-10 bg-white rounded-2xl shadow-xl space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#003366]">
          Welcome, {user?.name}
        </h1>
        <button
          onClick={handleLogout}
          className="px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 shadow-md"
        >
          Logout
        </button>
      </div>

      {user?.type === "lecturer" && (
        <>
          <h2 className="text-2xl font-semibold text-[#003366] tracking-wide">
            Your Assigned Classes
          </h2>

          <div className="flex gap-5 flex-wrap mb-6">
            <button
              onClick={() => navigate("/pastclass")}
              className="px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-300 shadow-md"
            >
              View Past Classes
            </button>
            <button
              onClick={() => navigate("/mark", { state: { user } })}
              className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 shadow-md"
            >
              View Student Attendance
            </button>
          </div>

          {assignedClasses.length === 0 ? (
            <p className="text-gray-600 text-lg">No assigned classes.</p>
          ) : (
            <ul className="space-y-5">
              {assignedClasses.map((cls) => (
                <li
                  key={cls.id}
                  className="bg-[#eef3fa] border border-[#d0d9e8] rounded-2xl p-6 shadow-md flex justify-between items-center"
                >
                  <div className="space-y-2 text-base text-[#003366]">
                    <p className="font-semibold text-lg">{cls.module}</p>
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

                  <div className="flex gap-3 items-center flex-wrap">
                    <button
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
                      className={`px-4 py-2 rounded-lg text-white font-semibold transition duration-300 ${
                        isClassActive(cls)
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Take Attendance
                    </button>
                    <button
                      onClick={() => openEditTimeCard(cls)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-200 transition duration-300"
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
