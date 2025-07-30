import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.type === "admin") navigate("/admin");
    else if (user?.type === "lecturer") navigate("/lecturer");
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${BACKEND_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      const loggedInUser = res.data.user;
      setUser(loggedInUser);

      if (loggedInUser.type === "admin") navigate("/admin");
      else if (loggedInUser.type === "lecturer") navigate("/lecturer");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen bg-[#f5f7fa] pt-24 px-4">
      <div className="bg-white border border-[#d0d9e8] rounded-2xl shadow-lg px-12 py-14 w-full max-w-lg min-h-[32rem] flex flex-col justify-center">
        <h2 className="text-3xl font-bold text-[#003366] mb-10 text-center">
          DUT Attendance Login
        </h2>
        <form onSubmit={handleLogin} className="space-y-7">
          <div>
            <label className="block mb-2 font-semibold text-[#003366] tracking-wide">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border border-gray-300 rounded-lg px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#003366] shadow-sm transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-[#003366] tracking-wide">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-5 py-4 focus:outline-none focus:ring-2 focus:ring-[#003366] shadow-sm transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#003366] hover:bg-[#002244] text-white font-semibold py-3 rounded-lg transition duration-300 shadow cursor-pointer"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
