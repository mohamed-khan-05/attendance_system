import React, { createContext, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// pages
import Admin from "./pages/Admin";

export const Context = createContext();

const App = () => {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" exact element={<Login />} /> */}
        <Route path="/admin" exact element={<Admin />} />
      </Routes>
    </Router>
  );
};

export default App;
