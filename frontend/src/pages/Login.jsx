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

  // If already logged in, redirect to appropriate dashboard
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
    <div className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl mb-4">Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          className="mb-2 w-full p-2 border"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          className="mb-2 w-full p-2 border"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 w-full"
          type="submit"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
