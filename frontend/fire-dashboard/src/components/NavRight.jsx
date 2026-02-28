import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function NavRight() {
  const { user, logout } = useAuth();
  const loc = useLocation();

  const linkClass = (path) =>
    `block p-2 rounded ${
      loc.pathname === path ? "bg-slate-700" : "hover:bg-slate-700"
    }`;

  return (
    <aside className="w-72 bg-gradient-to-t from-slate-900 to-slate-800 text-slate-100 p-4 border-l flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-slate-400">Operator Console</div>
          <div className="font-semibold">
            {user?.username || "Not signed in"}
          </div>
          {user?.role && (
            <div className="text-xs text-slate-400">{user.role}</div>
          )}
        </div>

        <div>
          {!user ? (
            <Link to="/login" className="text-blue-400">
              Sign in
            </Link>
          ) : (
            <button
              onClick={logout}
              className="px-2 py-1 bg-red-600 rounded text-sm"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* ROLE-BASED NAVIGATION */}
      <nav className="flex-1 flex flex-col gap-3 text-right">

        {/* NFS CORE + FIRE STATION */}
        {(user?.role === "NFS_CORE" || user?.role === "STATION") && (
          <Link to="/incidents" className={linkClass("/incidents")}>
            Incidents
          </Link>
        )}

        {/* NFS ADMIN ONLY */}
        {user?.role === "NFS_ADMIN" && (
          <Link to="/register" className={linkClass("/register")}>
            Register Device
          </Link>
        )}

      </nav>

      {/* FOOTER */}
      <div className="mt-6 text-xs text-slate-500">
        <div>Version: prototype</div>
        <div className="mt-2">Use the menu above to navigate</div>
      </div>
    </aside>
  );
}
