import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { fetchFireStations } from "../api";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("NFS_CORE");
  const [stationId, setStationId] = useState("");
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);

  useEffect(() => {
    if (role !== "STATION") return;

    setLoadingStations(true);
    fetchFireStations()
      .then(setStations)
      .finally(() => setLoadingStations(false));
  }, [role]);

  // ✅ NAVIGATE ONLY AFTER USER EXISTS
  useEffect(() => {
    if (!user) return;

    if (user.role === "NFS_ADMIN") {
      navigate("/register", { replace: true });
    } else {
      navigate("/incidents", { replace: true });
    }
  }, [user, navigate]);

  function handleLogin() {
    if (role === "STATION" && !stationId) {
      alert("Please select a fire station");
      return;
    }

    login({
      name: "demo-user",
      role,
      station_id: role === "STATION" ? stationId : null,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-6 rounded-lg w-80 shadow-lg">
        <h2 className="text-xl font-semibold text-center mb-4 text-white">
          Login
        </h2>

        <label className="block text-sm text-slate-300 mb-1">Role</label>
        <select
          className="w-full p-2 rounded bg-slate-700 text-white mb-4"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setStationId("");
          }}
        >
          <option value="NFS_ADMIN">NFS Admin</option>
          <option value="NFS_CORE">NFS Core</option>
          <option value="STATION">Fire Station</option>
        </select>

        {role === "STATION" && (
          <>
            <label className="block text-sm text-slate-300 mb-1">
              Fire Station
            </label>
            <select
              className="w-full p-2 rounded bg-slate-700 text-white mb-4"
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              disabled={loadingStations}
            >
              <option value="">
                {loadingStations ? "Loading stations..." : "Select station"}
              </option>
              {stations.map(s => (
                <option key={s.station_id} value={s.station_id}>{s.name}</option>
              ))}
            </select>
          </>
        )}

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
