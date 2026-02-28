import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { user } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    email: user?.email || "",
  });

  function handleSave() {
    alert("Profile updated successfully!");
    setEditMode(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* 🔷 NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-500">HiGrid</h1>
        <div className="space-x-6 text-sm text-slate-300">
          <Link to="/user-dashboard" className="hover:text-white">Dashboard</Link>
          <Link to="/recharge" className="hover:text-white">Recharge</Link>
        </div>
      </nav>

      {/* 🔷 HERO */}
      <section className="text-center py-16 bg-gradient-to-b from-slate-900 to-slate-950">
        <h2 className="text-4xl font-bold mb-4">
          Your Profile
        </h2>
        <p className="text-slate-400">
          Manage your account information.
        </p>
      </section>

      {/* 🔷 PROFILE CARD */}
      <section className="py-12 px-6">
        <div className="max-w-xl mx-auto bg-slate-900 p-10 rounded-xl shadow-xl">

          <div className="space-y-6">

            <input
              disabled={!editMode}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Full Name"
            />

            <input
              disabled={!editMode}
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Phone"
            />

            <input
              disabled={!editMode}
              value={profile.email}
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Email"
            />

            <input
              disabled={!editMode}
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Address"
            />

          </div>

          <div className="flex gap-4 mt-8">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded"
                >
                  Cancel
                </button>
              </>
            )}
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
