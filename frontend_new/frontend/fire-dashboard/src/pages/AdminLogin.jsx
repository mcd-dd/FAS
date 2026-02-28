import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

const BASE = import.meta.env.VITE_API_BASE || "/api";

export default function AdminLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // localStorage.removeItem("auth_user");
  /* Navigate after login */
  useEffect(() => {
    if (!user) return;

    if (user.role === "INSTALL_OPERATOR") {
      navigate("/device-activation", { replace: true });
    } else if (user.role === "NFS") {
      navigate("/incidents", { replace: true });
    } else if (user.role === "STATION") {
      navigate("/incidents", { replace: true });
    } else if (user.role === "VEHICLE_OPERATOR") {
      navigate("/vehicle-dashboard", { replace: true });
    }
  }, [user, navigate]);

  async function handleLogin() {
    try {
      const res = await fetch(`${BASE}/v1/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!res.ok) {
        alert("Invalid username or password");
        return;
      }

      const data = await res.json();
      // localStorage.setItem("auth_user", JSON.stringify(data));
      login(data); // saves in context + localStorage

    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-6 rounded-lg w-80 shadow-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-white">
          Admin / Operator Login
        </h2>

        <label className="block text-sm text-slate-300 mb-1">
          Username
        </label>
        <input
          className="w-full p-2 rounded bg-slate-700 text-white mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label className="block text-sm text-slate-300 mb-1">
          Password
        </label>
        <input
          type="password"
          className="w-full p-2 rounded bg-slate-700 text-white mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
        >
          Login
        </button>
      </div>
    </div>
  );
}