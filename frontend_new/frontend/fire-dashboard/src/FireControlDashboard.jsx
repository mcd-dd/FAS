import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Default marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Severity colors
const severityColor = {
  confirmed: "#e53e3e",
  probable: "#dd6b20",
  low: "#f6e05e",
};

// Example mock incident
const MOCK_INCIDENTS = [
  {
    id: "inc-1001",
    device_id: "dev-1001",
    lat: 12.9716,
    lon: 77.5946,
    first_seen: "2025-11-29T08:45:21Z",
    confidence: 0.92,
    severity: "confirmed",
    sensor_timeline: [
      { ts: "08:44:50", smoke: 45, temp: 30 },
      { ts: "08:45:00", smoke: 70, temp: 33 },
      { ts: "08:45:10", smoke: 120, temp: 36 },
      { ts: "08:45:21", smoke: 200, temp: 68 },
    ],
    user: { name: "Ravi", phone: "+91-98xxxxxxx" },
    status: "new",
    notes: [],
  },
  {
    id: "inc-1002",
    device_id: "dev-2001",
    lat: 12.975,
    lon: 77.599,
    first_seen: "2025-11-29T08:40:10Z",
    confidence: 0.45,
    severity: "low",
    sensor_timeline: [
      { ts: "08:39:30", smoke: 10, temp: 24 },
      { ts: "08:39:50", smoke: 28, temp: 24 },
      { ts: "08:40:10", smoke: 40, temp: 25 },
    ],
    user: { name: "Asha", phone: "+91-97xxxxxxx" },
    status: "new",
    notes: [],
  },
];

export default function FireControlDashboard() {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [selected, setSelected] = useState(incidents[0]?.id || null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  // WebSocket connect
  useEffect(() => {
    const url = window.__WS_URL__ || "ws://localhost:8080/ws/incidents";
    let ws;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      console.warn("WS init failed", e);
      ws = null;
    }

    if (!ws) return;
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = (err) => console.warn("WS error", err);

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "incident:new") {
          setIncidents((prev) => [msg.payload, ...prev]);
          setSelected(msg.payload.id);
        } else if (msg.type === "incident:update") {
          setIncidents((prev) =>
            prev.map((p) => (p.id === msg.payload.id ? msg.payload : p))
          );
        }
      } catch (e) {
        console.warn("parse error", e);
      }
    };

    return () => ws.close();
  }, []);

  const current = incidents.find((i) => i.id === selected) || incidents[0] || null;

  function pushOperatorAction(action, payload = {}) {
    const audit = {
      ts: new Date().toISOString(),
      user: "operator-1",
      action,
      payload,
    };

    setIncidents((prev) =>
      prev.map((i) =>
        i.id === selected
          ? { ...i, notes: [...i.notes, audit], status: action === "dispatch" ? "dispatched" : i.status }
          : i
      )
    );

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "operator:action",
          payload: { incident_id: selected, action, ...payload },
        })
      );
    }
  }

  function acceptIncident() { pushOperatorAction("accepted"); }
  function rejectIncident() { pushOperatorAction("rejected"); }
  function dispatchUnits() { pushOperatorAction("dispatch", { units: ["engine-5"] }); }
  function callUser() {
    pushOperatorAction("call");
    alert("Calling user...");
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-slate-800 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Fire Control — Operator Console</h1>
          <span className={`px-2 py-1 rounded text-sm ${connected ? "bg-green-600" : "bg-red-600"}`}>
            {connected ? "Realtime Connected" : "Offline (mock)"}
          </span>
        </div>
        <div className="text-sm">
          Operator: <strong>operator-1</strong>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* MAP SECTION */}
        <div className="w-2/3 relative">
          <MapContainer center={[12.9716, 77.5946]} zoom={14} className="h-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {incidents.map((inc) => (
              <Marker key={inc.id} position={[inc.lat, inc.lon]}>
                <Popup>
                  <div className="w-64">
                    <div className="font-semibold">Incident: {inc.id}</div>
                    <div>Device: {inc.device_id}</div>
                    <div>Confidence: {(inc.confidence * 100).toFixed(0)}%</div>
                    <div>Status: {inc.status}</div>
                    <button
                      className="px-2 py-1 mt-2 bg-blue-600 text-white rounded text-sm"
                      onClick={() => setSelected(inc.id)}
                    >
                      View
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

            {current && (
              <Circle
                center={[current.lat, current.lon]}
                radius={Math.max(50, current.confidence * 300)}
                pathOptions={{
                  color: severityColor[current.severity] || "#3182ce",
                  opacity: 0.4,
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* DETAILS PANEL */}
        <aside className="w-1/3 border-l p-4 overflow-auto">
          <h2 className="text-lg font-semibold">Incident Detail</h2>
          <div className="text-sm mb-4">
            Selected: {current?.id || "—"}
          </div>

          {!current ? (
            <div>No incident selected</div>
          ) : (
            <>
              <div className="mb-3">
                <div className="font-medium">{current.device_id}</div>
                <div className="text-sm">User: {current.user?.name}</div>
                <div className="text-sm">Phone: {current.user?.phone}</div>
                <div className="mt-1 text-sm">
                  First seen: {new Date(current.first_seen).toLocaleString()}
                </div>
              </div>

              {/* Chart */}
              <div className="h-40 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={current.sensor_timeline}>
                    <XAxis dataKey="ts" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="smoke" stroke="#e53e3e" dot={false} />
                    <Line type="monotone" dataKey="temp" stroke="#3182ce" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Controls */}
              <div className="flex gap-2 mb-3">
                <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={acceptIncident}>
                  Accept
                </button>
                <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={rejectIncident}>
                  Reject
                </button>
                <button className="px-3 py-2 bg-orange-600 text-white rounded" onClick={dispatchUnits}>
                  Dispatch
                </button>
                <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={callUser}>
                  Call
                </button>
              </div>

              {/* Notes */}
              <div className="mb-3">
                <div className="text-sm text-slate-600">Attach Note</div>
                <div className="flex gap-2 mt-2">
                  <input id="note" placeholder="Add a quick note" className="flex-1 border rounded p-2" />
                  <button
                    className="px-3 py-2 bg-slate-700 text-white rounded"
                    onClick={() => {
                      const el = document.getElementById("note");
                      if (el) {
                        pushOperatorAction("note", { text: el.value });
                        el.value = "";
                      }
                    }}
                  >
                    Attach
                  </button>
                </div>
              </div>

              {/* Audit trail */}
              <div>
                <div className="text-sm text-slate-600">Audit trail</div>
                <div className="mt-2 max-h-40 overflow-auto space-y-2">
                  {current.notes.length === 0 ? (
                    <div className="text-sm text-slate-400">No actions yet</div>
                  ) : (
                    current.notes.map((n, idx) => (
                      <div key={idx} className="text-xs border rounded p-2 bg-gray-50">
                        <div className="text-[11px] text-slate-500">
                          {new Date(n.ts).toLocaleString()} • {n.user}
                        </div>
                        <div className="text-sm">{n.action}</div>
                        {n.payload?.text && (
                          <div className="mt-1 text-sm">{n.payload.text}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      <footer className="p-2 text-sm text-center text-slate-600">
        Minimal GUI prototype — connect a server WebSocket to{" "}
        <code>ws://localhost:8080/ws/incidents</code>
      </footer>
    </div>
  );
}
