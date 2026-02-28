import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function UserNavRight() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  const linkClass = (path) =>
    `block p-3 rounded text-right ${
      loc.pathname === path
        ? "bg-slate-700"
        : "hover:bg-slate-700"
    }`;

  return (
    <aside className="w-72 bg-gradient-to-t from-slate-900 to-slate-800 text-slate-100 p-4 border-l flex flex-col">

      {/* HEADER */}
      <div className="mb-6 text-right">
        <div className="text-sm text-slate-400">Customer Console</div>
        <div className="font-semibold">{user?.username}</div>
        <div className="text-xs text-slate-400">{user?.role}</div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 flex flex-col gap-3">
        <Link to="/user-dashboard" className={linkClass("/user-dashboard")}>
          Sensor Data
        </Link>

        <Link to="/recharge-plan" className={linkClass("/recharge-plan")}>
          Recharge Plan
        </Link>

        <Link to="/view-profile" className={linkClass("/view-profile")}>
          View Profile
        </Link>

        <button
          onClick={logout}
          className="block p-3 bg-red-600 rounded text-right"
        >
          Logout
        </button>
      </nav>

      <div className="mt-6 text-xs text-slate-500 text-right">
        Version: prototype
      </div>
    </aside>
  );
}
