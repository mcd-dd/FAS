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
import { getAuthHeaders } from "../api";

const BASE =
  import.meta.env.VITE_API_BASE || "/api";

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
        `${BASE}/v1/sensors?device_id=${user.device_id}&limit=100`,
        {
          headers: getAuthHeaders()
        }
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
        `${BASE}/v1/incidents?device_id=${user.device_id}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!res.ok) return;

      const json = await res.json();
      setIncidents(json);
    }

    loadIncidents();
  }, [user]);

  const chartData = useMemo(() => {
    // return sensorData.map(d => ({
    //   ...d,
    //   time: new Date(d.ts * 1000).toLocaleTimeString()
    // }));
    return sensorData.map(d => ({
      time: new Date(d.ts * 1000).toLocaleTimeString(),
      temp: Number(d.temp ?? d.temperature ?? 0),
      smoke: Number(d.smoke ?? 0),
    }));
  }, [sensorData]);

  const TEMP_THRESHOLD = 26;     // 50°C
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
  
  const incidentMarkers = useMemo(() => {
    return incidents.map(incident => {
      const incidentTime = new Date(incident.created_at).getTime();

      const closestSensor = sensorData.find(s =>
        Math.abs(s.ts * 1000 - incidentTime) < 10000
      );

      if (!closestSensor) return null;

      return {
        time: new Date(closestSensor.ts * 1000).toLocaleTimeString(),
        temp: closestSensor.temp,
        smoke: closestSensor.smoke
      };
    }).filter(Boolean);
  }, [incidents, sensorData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];

    return (
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "6px",
          padding: "8px",
          fontSize: "12px",
          color: "#e2e8f0",
          pointerEvents: "none"
        }}
      >
        <div><strong>Time:</strong> {label}</div>
        <div>
          <strong>{data.name}:</strong> {data.value}
          {data.name.includes("Temperature") ? " °C" : ""}
        </div>
      </div>
    );
  };
  
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
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  wrapperStyle={{ pointerEvents: "none" }}
                  allowEscapeViewBox={{ x: true, y: true }}
                />
                <Legend />   {/* ✅ SHOW LEGEND */}

                {/* Threshold Line */}
                <ReferenceLine
                  y={TEMP_THRESHOLD}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  label={{
                    value: "Threshold 26°C",
                    position: "right",
                    fill: "#ef4444",
                    fontSize: 12
                  }}
                />

                {/* Sensor Temperature Points */}
                {/* <Line
                  name="Sensor Temperature"
                  type="monotone"
                  dataKey="temp"
                  stroke="none"
                  dot={{ r: 4, fill: "#22c55e" }}
                /> */}
                <Line
                  name="Sensor Temperature"
                  type="monotone"
                  dataKey="temp"
                  stroke="transparent"
                  strokeWidth={1}
                  activeDot={false}
                  dot={(props) => {
                    const tempValue = Number(props.value);
                    const isAbove = tempValue > TEMP_THRESHOLD;

                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={2}
                        fill={isAbove ? "#ef4444" : "#22c55e"}
                        strokeWidth={2}
                      />
                    );
                  }}
                />

                {/* <Line
                  name="Sensor Temperature"
                  type="monotone"
                  dataKey="temp"
                  stroke="transparent"   // no line
                  strokeWidth={0}
                  dot={({ payload }) => {
                    const tempValue = Number(payload?.temp ?? 0);
                    const isAbove = tempValue > TEMP_THRESHOLD;

                    return (
                      <circle
                        r={5}
                        fill={isAbove ? "#ef4444" : "#22c55e"}
                        stroke={isAbove ? "#b91c1c" : "#22c55e"}
                        strokeWidth={2}
                      />
                    );
                  }}
                />
                */}
                {/* 🚨 Incident Markers */}
                {/* {incidents.map((incident, idx) => (
                  <ReferenceDot
                    key={idx}
                    x={new Date(incident.created_at).toLocaleTimeString()}
                    y={incident.payload?.temp || TEMP_THRESHOLD}
                    r={6}
                    fill="#ef4444" 
                    stroke="#b91c1c"                                                                    
                  />
                ))} */}

                {incidentMarkers.map((m, idx) => (
                  <ReferenceDot
                    key={idx}
                    x={m.time}
                    y={m.temp}
                    r={2}
                    fill="#ff0000"
                    stroke="#b91c1c"
                    strokeWidth={2}
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
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  wrapperStyle={{ pointerEvents: "none" }}
                  allowEscapeViewBox={{ x: true, y: true }}
                />
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
                  dot={{ r: 2, fill: "#22c55e" }}
                />

                {/* 🚨 Incident Markers */}
                {/* {incidents.map((incident, idx) => (
                  <ReferenceDot
                    key={idx}
                    x={new Date(incident.created_at).toLocaleTimeString()}
                    y={incident.payload?.smoke || SMOKE_THRESHOLD}
                    r={6}
                    fill="#ef4444" 
                    stroke="#b91c1c"  
                  />
                ))} */}
                {incidentMarkers.map((m, idx) => (
                  <ReferenceDot
                    key={idx}
                    x={m.time}
                    y={m.smoke}
                    r={2}
                    fill="#ff0000"
                    stroke="#b91c1c"
                    strokeWidth={2}
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
