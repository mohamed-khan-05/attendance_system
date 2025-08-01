import React, { createContext, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import axios from "axios";

// pages
import Admin from "./pages/Admin";
import IdentifyUser from "./pages/IdentifyUser.JSX";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PastClasses from "./pages/PastClasses";
import Mark from "./pages/Mark";

// Create and export context
export const UserContext = createContext();

const ProtectedRoute = ({ children }) => {
  const { user } = React.useContext(UserContext);
  return user ? children : <Navigate to="/" replace />;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [lastFetched, setLastFetched] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/auth/session`, {
          withCredentials: true,
        });
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const fetchAttendanceData = async (lecturerId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/mark/${lecturerId}`);
      setAttendanceData(res.data);
      setLastFetched(new Date());
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        attendanceData,
        setAttendanceData,
        lastFetched,
        fetchAttendanceData,
      }}
    >
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to={user.type === "admin" ? "/admin" : "/lecturer"} />
              ) : (
                <Login />
              )
            }
          />
          <Route path="/identify" element={<IdentifyUser />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lecturer"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pastclass"
            element={
              <ProtectedRoute>
                <PastClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mark"
            element={
              <ProtectedRoute>
                <Mark />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
};

export default App;
