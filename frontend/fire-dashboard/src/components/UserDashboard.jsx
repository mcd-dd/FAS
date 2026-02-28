// import React, { useEffect, useState, useMemo } from "react";
// import { useAuth } from "../auth/AuthContext";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   Brush,
//   ReferenceDot
// } from "recharts";

// const BASE =
//   import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

// export default function UserDashboard() {
//   const { user } = useAuth();

//   const [sensorData, setSensorData] = useState([]);
//   const [incidents, setIncidents] = useState([]);
//   const [range, setRange] = useState("live");

//   // 🔥 Load Sensor Data
//   useEffect(() => {
//     if (!user?.device_id) return;

//     async function loadSensors() {
//       const res = await fetch(
//         `${BASE}/api/sensors?device_id=${user.device_id}&limit=100`
//       );
//       const json = await res.json();
//       setSensorData(json);
//     }

//     loadSensors();

//     if (range === "live") {
//       const interval = setInterval(loadSensors, 5000);
//       return () => clearInterval(interval);
//     }
//   }, [user, range]);

//   // 🚨 Load Incidents for this device
//   useEffect(() => {
//     if (!user?.device_id) return;

//     async function loadIncidents() {
//       const res = await fetch(
//         `${BASE}/api/incidents?device_id=${user.device_id}`
//       );
//       const json = await res.json();
//       setIncidents(json);
//     }

//     loadIncidents();
//   }, [user]);

//   // 📊 Prepare chart data
//   const chartData = useMemo(() => {
//     return sensorData.map(d => ({
//       ...d,
//       time: new Date(d.ts * 1000).toLocaleTimeString()
//     }));
//   }, [sensorData]);

//   return (
//     <div className="flex flex-1 bg-slate-900 text-white p-6">
//       <div className="flex-1">

//         <h2 className="text-2xl mb-4">Live Sensor Monitoring</h2>

//         {/* RANGE SELECT */}
//         <div className="mb-4">
//           <select
//             value={range}
//             onChange={(e) => setRange(e.target.value)}
//             className="bg-slate-700 p-2 rounded"
//           >
//             <option value="live">Live</option>
//             <option value="historical">Last 100</option>
//           </select>
//         </div>

//         {/* 📈 SENSOR CHART */}
//         <div className="bg-slate-800 p-4 rounded h-96">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={chartData}>
//               <XAxis dataKey="time" />
//               <YAxis />
//               <Tooltip />

//               {/* Smoke Line */}
//               <Line
//                 type="monotone"
//                 dataKey="smoke"
//                 stroke="#ef4444"
//                 strokeWidth={2}
//                 dot={false}
//               />

//               {/* Temp Line */}
//               <Line
//                 type="monotone"
//                 dataKey="temp"
//                 stroke="#3b82f6"
//                 strokeWidth={2}
//                 dot={false}
//               />

//               {/* 🚨 INCIDENT MARKERS */}
//               {incidents.map((incident, idx) => (
//                 <ReferenceDot
//                   key={idx}
//                   x={new Date(incident.created_at).toLocaleTimeString()}
//                   y={incident.smoke || 0}
//                   r={6}
//                   fill="yellow"
//                   stroke="red"
//                 />
//               ))}

//               <Brush dataKey="time" height={20} stroke="#64748b" />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>

//         {/* 🚨 CALL BUTTON */}
//         <div className="mt-6">
//           <button
//             onClick={() => alert("Nearest Fire Station Alerted")}
//             className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded text-lg"
//           >
//             🚨 Call Nearest Fire Station
//           </button>
//         </div>

//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceDot,
  ReferenceLine,   // ✅ add this
  Legend
} from "recharts";

const BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function UserDashboard() {
  const { user } = useAuth();

  const [sensorData, setSensorData] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [range, setRange] = useState("live");

  // 🔥 Load Sensor Data
  useEffect(() => {
    if (!user?.device_id) return;

    async function loadSensors() {
      const res = await fetch(
        `${BASE}/api/sensors?device_id=${user.device_id}&limit=100`
      );
      const json = await res.json();
      setSensorData(json);
    }

    loadSensors();

    if (range === "live") {
      const interval = setInterval(loadSensors, 5000);
      return () => clearInterval(interval);
    }
  }, [user, range]);

  // 🚨 Load Incidents
  useEffect(() => {
    if (!user?.device_id) return;

    async function loadIncidents() {
      const res = await fetch(
        `${BASE}/api/incidents?device_id=${user.device_id}`
      );
      const json = await res.json();
      setIncidents(json);
    }

    loadIncidents();
  }, [user]);

  const chartData = useMemo(() => {
    return sensorData.map(d => ({
      ...d,
      time: new Date(d.ts * 1000).toLocaleTimeString()
    }));
  }, [sensorData]);

  const TEMP_THRESHOLD = 50;     // 50°C
  const SMOKE_THRESHOLD = 300;   // change as needed

  // Dynamic Y ranges
  const maxTemp = Math.max(
    TEMP_THRESHOLD + 10,
    ...chartData.map(d => d.temp || 0)
  );

  const maxSmoke = Math.max(
    SMOKE_THRESHOLD + 50,
    ...chartData.map(d => d.smoke || 0)
  );
  
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* 🔷 NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-500">HiGrid</h1>
        {/* <div className="space-x-6 text-sm text-slate-300">
          <Link to="/" className="hover:text-white">Home</Link>
          <Link to="/user-dashboard" className="hover:text-white">Dashboard</Link>
          <Link to="/logout" className="hover:text-white">Logout</Link>
        </div> */}
      </nav>

      {/* 🔷 HERO SECTION */}
      <section className="text-center py-16 px-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Live Monitoring Dashboard
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Real-time fire detection and environmental monitoring for your device.
        </p>
      </section>

      {/* 🔷 DASHBOARD CARD */}
      <section className="py-12 px-6 bg-slate-950">
        <div className="max-w-5xl mx-auto bg-slate-900 p-10 rounded-xl shadow-xl">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold">
              Device: {user?.device_id}
            </h3>

            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="bg-slate-800 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="live">Live</option>
              <option value="historical">Last 100</option>
            </select>
          </div>
          
          {/* 🌡️ Temperature Chart */}
          <div className="h-72 mb-12">
            <h4 className="text-lg mb-2 text-blue-400">
              Temperature (°C)
            </h4>

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" />
                <YAxis domain={[0, maxTemp]} />
                <Tooltip />
                <Legend />   {/* ✅ SHOW LEGEND */}

                {/* Threshold Line */}
                <ReferenceLine
                  y={TEMP_THRESHOLD}
                  stroke="#3b82f6"
                  strokeDasharray="6 6"
                  label={{
                    value: "Threshold 50°C",
                    position: "right",
                    fill: "#3b82f6",
                    fontSize: 12
                  }}
                />

                {/* Sensor Temperature Points */}
                <Line
                  name="Sensor Temperature"
                  type="monotone"
                  dataKey="temp"
                  stroke="none"
                  dot={{ r: 4, fill: "#22c55e" }}
                />

                {/* 🚨 Incident Markers */}
                {incidents.map((incident, idx) => (
                  <ReferenceDot
                    key={idx}
                    x={new Date(incident.created_at).toLocaleTimeString()}
                    y={incident.payload?.temp || TEMP_THRESHOLD}
                    r={6}
                    fill="#ef4444" 
                    stroke="#b91c1c"                                                                    
                  />
                ))}

                <Brush dataKey="time" height={20} stroke="#64748b" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 💨 Smoke Chart */}
          <div className="h-72">
            <h4 className="text-lg mb-2 text-red-400">
              Smoke Level
            </h4>

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" />
                <YAxis domain={[0, maxSmoke]} />
                <Tooltip />
                <Legend />   {/* ✅ SHOW LEGEND */}

                {/* Threshold Line */}
                <ReferenceLine
                  y={SMOKE_THRESHOLD}
                  stroke="#ef4444"
                  strokeDasharray="6 6"
                  label={{
                    value: "Smoke Threshold",
                    position: "right",
                    fill: "#ef4444",
                    fontSize: 12
                  }}
                />

                {/* Sensor Smoke Points */}
                <Line
                  name="Sensor Smoke"
                  type="monotone"
                  dataKey="smoke"
                  stroke="none"
                  dot={{ r: 4, fill: "#22c55e" }}
                />

                {/* 🚨 Incident Markers */}
                {incidents.map((incident, idx) => (
                  <ReferenceDot
                    key={idx}
                    x={new Date(incident.created_at).toLocaleTimeString()}
                    y={incident.payload?.smoke || SMOKE_THRESHOLD}
                    r={6}
                    fill="#ef4444" 
                    stroke="#b91c1c"  
                  />
                ))}

                <Brush dataKey="time" height={20} stroke="#64748b" />
              </LineChart>
            </ResponsiveContainer>
          </div>


          {/* 🚨 Alert Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => alert("Nearest Fire Station Alerted")}
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg text-lg font-medium transition"
            >
              🚨 Call Nearest Fire Station
            </button>
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
