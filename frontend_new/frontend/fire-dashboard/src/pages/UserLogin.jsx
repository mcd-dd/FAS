import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const BASE = 
  import.meta.env.VITE_API_BASE || "/api";

export default function UserLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const res = await fetch(`${BASE}/v1/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        alert("Invalid credentials");
        return;
      }

      const data = await res.json();

      // 🔥 STORE SESSION IN LOCALSTORAGE
      localStorage.setItem("auth_user", JSON.stringify(data));

      login(data);
      navigate("/user-dashboard");
    } catch (err) {
      alert("Login failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* 🔷 NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-500">HiGrid</h1>
        <div className="space-x-6 text-sm text-slate-300">
          <Link to="/" className="hover:text-white">Home</Link>
          <Link to="/signup" className="hover:text-white">Signup</Link>
          <a href="#" className="hover:text-white">Contact</a>
        </div>
      </nav>

      {/* 🔷 HERO SECTION */}
      <section className="text-center py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Welcome Back to HiGrid
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Access your real-time fire monitoring dashboard and stay protected
          with smart detection technology.
        </p>
      </section>

      {/* 🔷 LOGIN FORM */}
      <section className="py-20 px-6 bg-slate-950">
        <div className="max-w-md mx-auto bg-slate-900 p-10 rounded-xl shadow-xl">

          <h3 className="text-2xl font-semibold mb-8 text-center">
            Customer Login
          </h3>

          <div className="space-y-4">

            <input
              className="w-full p-3 rounded bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />

            <input
              type="password"
              className="w-full p-3 rounded bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-medium mt-6 transition"
            >
              Login
            </button>

            <div className="text-center text-sm text-slate-400 mt-4">
              Don’t have an account?{" "}
              <Link to="/signup" className="text-blue-400 hover:text-blue-300">
                Register here
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 🔷 FOOTER */}
      <footer className="text-center py-6 border-t border-slate-800 text-slate-500 text-sm">
        © 2026 HiGrid Technologies. All rights reserved.
      </footer>

    </div>
  );
}
