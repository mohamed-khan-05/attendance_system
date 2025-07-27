import React, { createContext, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// pages
import Admin from "./pages/Admin";
import IdentifyUser from "./pages/IdentifyUser.JSX";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Create and export context
export const UserContext = createContext();

const App = () => {
  const [user, setUser] = useState(null); // global user state

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/lecturer" element={<Dashboard />} />
          <Route path="/check" element={<IdentifyUser />} />
        </Routes>
      </Router>
    </UserContext.Provider>
  );
};

export default App;
