import { getAuthHeaders } from "../api";

const BASE =
  import.meta.env.VITE_API_BASE || "/api";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceDot,
  ReferenceLine,
  Legend
} from "recharts";
import { fetchSensorData } from "../api";

import { useAuth } from "../auth/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ReconnectingWS } from "../ws";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useMap } from "react-leaflet";
import { fetchFireStations } from "../api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const vehicleIcon = new L.DivIcon({
  html: `
    <div style="
      width: 18px;
      height: 18px;
      background-color: #2563eb;
      border-radius: 50%;
      border: 2px solid white;
    "></div>
  `,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/* 👇 INSERT HERE (outside main component) */
function VehicleRoute({ from, to }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !from || !to) return;

    const control = L.Routing.control({
      waypoints: [
        L.latLng(from[0], from[1]),
        L.latLng(to[0], to[1]),
      ],
      lineOptions: {
        styles: [{ color: "#2563eb", weight: 5 }],
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      show: false,
      createMarker: () => null,
    }).addTo(map);

    return () => map.removeControl(control);
  }, [map, from, to]);

  return null;
}

export default function FireControlDashboard({ incident, incidents, setSelectedIncident, selectedVehicle }) {
//   const [loadingAction, setLoadingAction] = useState(false);  /* Add this */
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState([]);
  const wsRef = useRef(null);

  const [vehicles, setVehicles] = useState({});
  const [stations, setStations] = useState([]);
  const TEMP_THRESHOLD = 26;
  const SMOKE_THRESHOLD = 300;
  // 🔹 Initial load from REST
  // useEffect(() => {
  //   if (!incident?.id) return;

  //   fetchSensorData({
  //     incident_id: incident.id,
  //     limit: 100,
  //   }).then((data) => {
  //     setSensorData(data || []);
  //   });
  // }, [incident]);

  useEffect(() => {
    async function loadStations() {
      const data = await fetchFireStations();
      setStations(data || []);
    }
    loadStations();
  }, []);

  // useEffect(() => {
  //   // if (!incident?.id) return;
  //   const targetDeviceId = incident?.device_id;

  //   if (!targetDeviceId) return;

  //   async function load() {
  //     if (incident?.id) {
  //       const data = await fetchSensorData({
  //         incident_id: incident.id,
  //         limit: 100,
  //       });
  //       setSensorData(data || []);
  //     } else if (targetDeviceId) {
  //       const res = await fetch(
  //         `${BASE}/api/v1/sensors?device_id=${targetDeviceId}&limit=100`,
  //         { headers: getAuthHeaders() }
  //       );
  //       const json = await res.json();
  //       setSensorData(json || []);
  //     }
  //   } 

  //   load();

  //   const interval = setInterval(load, 5000);

  //   return () => clearInterval(interval);
  // }, [incident]);

  // useEffect(() => {
  //   if (!incident || !user) return;

  //   async function load() {
  //     let url;

  //     if (user.role === "STATION") {
  //       // Backend scopes automatically
  //       url = `${BASE}/api/v1/sensors?limit=100`;
  //     }

  //     if (user.role === "NFS") {
  //       if (incident.station_id) {
  //         url = `${BASE}/api/v1/sensors?station_id=${incident.station_id}&limit=100`;
  //       } else {
  //         url = `${BASE}/api/v1/sensors?limit=100`;
  //       }
  //     }

  //     const res = await fetch(url, {
  //       headers: getAuthHeaders()
  //     });

  //     const json = await res.json();
  //     setSensorData(json || []);
  //   }

  //   load();
  //   const interval = setInterval(load, 5000);
  //   return () => clearInterval(interval);

  // }, [incident, user]);

  // useEffect(() => {
  //   if (!incident || !user) return;

  //   async function load() {
  //     const data = await fetchSensorData({
  //       incident_id: incident.id,
  //       limit: 100
  //     });

  //     setSensorData(data || []);
  //   }

  //   load();
  //   const interval = setInterval(load, 5000);
  //   return () => clearInterval(interval);

  // }, [incident, user]);

  // useEffect(() => {
  //   if (!incident) return;

  //   async function load() {
  //     const data = await fetchSensorData({
  //       incident_id: incident.id,
  //       limit: 1   // 🔥 only 1 record
  //     });

  //     if (data && data.length > 0) {
  //       setSensorData(data);
  //     } else {
  //       setSensorData([]);
  //     }
  //   }

  //   load();
  // }, [incident]);

  // useEffect(() => {
  //   if (!incidents || incidents.length === 0) return;

  //   async function loadAll() {
  //     try {
  //       let allSensorData = [];

  //       for (const inc of incidents) {
  //         const data = await fetchSensorData({
  //           incident_id: inc.id,
  //           limit: 100
  //         });

  //         if (data && data.length > 0) {
  //           allSensorData = [...allSensorData, ...data];
  //         }
  //       }

  //       // sort by timestamp
  //       allSensorData.sort((a, b) => Number(a.ts) - Number(b.ts));

  //       setSensorData(allSensorData);

  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }

  //   loadAll();
  // }, [incidents]);

  useEffect(() => {
    if (!incident?.id) return;

    async function load() {
      const data = await fetchSensorData({
        incident_id: incident.id,
        limit: 100
      });

      setSensorData(data || []);
    }

    load();
  }, [incident]);


  // 🔴 LIVE SENSOR UPDATES (WebSocket)
  useEffect(() => {
    if (!incident?.device_id) return;

    const authUser = JSON.parse(localStorage.getItem("auth_user"));

    if (!authUser?.session_id) {
      console.warn("No session_id found. WS not connected.");
      return;
    }

    const wsUrl = `ws://localhost:8000/ws?session_id=${authUser.session_id}`;

    const ws = new ReconnectingWS(wsUrl, (msg) => {
      if (!msg) return;

      if (msg.type === "sensor:update") {
        const { device_id, ts, temp, smoke } = msg.payload;

        if (device_id !== incident.device_id) return;

        const newPoint = {
          ts,
          temp: Number(temp),
          smoke: Number(smoke),
        };

        setSensorData((prev) =>
          [...prev, newPoint].slice(-100)
        );
      }

      /* 🚒 VEHICLE LOCATION UPDATE */
      if (msg.type === "vehicle:update") {
        const { vehicle_id, lat, lon } = msg.payload;

        // // Optional: Only show vehicle assigned to this incident
        // if (vehicle_id !== incident.vehicle_id) return;

        // setVehicleLocation({ lat, lon });

        setVehicles(prev => ({
          ...prev,
          [msg.payload.vehicle_id]: {
            lat: msg.payload.lat,
            lon: msg.payload.lon
          }
        }));
      }

    });

    wsRef.current = ws;

    return () => ws.close();
  }, [incident]);

  // 📊 Format chart data
  const prevchartData = useMemo(() => {
    return sensorData.map((d) => {
      let tsNumber = Number(d.ts);

      // If already milliseconds (13 digits), don't multiply
      if (tsNumber > 1e12) {
        // already ms
      } else {
        tsNumber = tsNumber * 1000; // seconds → ms
      }

      return {
        ...d,
        time: new Date(tsNumber).toLocaleTimeString(),
      };
    });
  }, [sensorData]);

  const chartData = useMemo(() => {
    if (!sensorData.length) return [];

    return sensorData.map(d => {
      const ts = Number(d.ts);
      const tsMs = ts > 1e12 ? ts : ts * 1000;

      return {
        time: new Date(tsMs).toLocaleTimeString(),
        temp: Number(d.temp),
        smoke: Number(d.smoke),
        device_id: d.device_id
      };
    });
  }, [sensorData]);

  const latestTemp =
    sensorData.length > 0
      ? Number(sensorData[sensorData.length - 1].temp)
      : 0;

  const isHighTemp = latestTemp > 26;

  const incidentIcon = new L.DivIcon({
    html: `
      <div style="
        width: 22px;
        height: 22px;
        background-color: ${isHighTemp ? "#ef4444" : "#facc15"};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 10px ${isHighTemp ? "#ef4444" : "#facc15"};
      "></div>
    `,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  // if (!incident) {
  //   return (
  //     <div className="flex items-center justify-center w-full">
  //       No incident selected
  //     </div>
  //   );
  // }

  const lat = incident?.lat || 12.9716;
  const lon = incident?.lon || 77.5946;

  // const maxTemp = Math.max(
  //   TEMP_THRESHOLD + 10,
  //   ...chartData.map(d => d.temp || 0)
  // );
  const maxTemp = Math.max(
    TEMP_THRESHOLD + 10,
    incident?.temp || 0
  );

  // const maxSmoke = Math.max(
  //   SMOKE_THRESHOLD + 50,
  //   ...chartData.map(d => d.smoke || 0)
  // );
  const maxSmoke = Math.max(
    SMOKE_THRESHOLD + 50,
    incident?.smoke || 0
  );

  // Match incident to closest sensor reading
  const incidentMarkers = useMemo(() => {
    if (!incident) return [];

    const incidentTime = new Date(incident.created_at).getTime();

    const closest = sensorData.find(s =>
      Math.abs(Number(s.ts) * 1000 - incidentTime) < 10000
    );

    if (!closest) return [];

    return [{
      time: new Date(Number(closest.ts) * 1000).toLocaleTimeString(),
      temp: Number(closest.temp),
      smoke: Number(closest.smoke)
    }];
  }, [incident, sensorData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div
        style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "6px",
          padding: "8px",
          fontSize: "12px",
          color: "#e2e8f0"
        }}
      >
        <div><strong>Time:</strong> {label}</div>
        <div><strong>Device:</strong> {data.device_id}</div>

        {data.temp !== undefined && (
          <div>
            <strong>Temp:</strong> {data.temp} °C
          </div>
        )}

        {data.smoke !== undefined && (
          <div>
            <strong>Smoke:</strong> {data.smoke}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">

      {/* 🔥 MAP (Top Half) */}
      <div className="flex-1 p-4">
        <div className="h-full rounded overflow-hidden">
          <MapContainer
            // key={incident?.id}
            center={[lat, lon]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* {incident && (
              <Marker position={[lat, lon]} icon={incidentIcon}>
                <Popup>
                  <div>
                    <div className="font-semibold">
                      Incident {incident.id}
                    </div>
                    <div>Device: {incident.device_id}</div>
                    <div>
                      Confidence: {(incident.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </Popup>
              </Marker>
            )} */}
            {incidents.map((inc) => (
            <Marker
              key={inc.id}
              position={[inc.lat, inc.lon]}
              icon={
                new L.DivIcon({
                  html: `
                    <div style="
                      width: 18px;
                      height: 18px;
                      background-color: ${
                        inc.alarm_type === "FIRE"
                          ? "#ef4444"
                          : "#facc15"
                      };
                      border-radius: 50%;
                      border: 2px solid white;
                    "></div>
                  `,
                  className: "",
                  iconSize: [18, 18],
                  iconAnchor: [9, 9],
                })
              }
              eventHandlers={{
                click: () => setSelectedIncident(inc)
              }}
            >
              <Popup>
                <div>
                  <div className="font-semibold">
                    Incident {inc.id}
                  </div>
                  <div>Device: {inc.device_id}</div>
                </div>
              </Popup>
            </Marker>
          ))}

            {stations.map(station => (
              <Marker
                key={station.station_id}
                position={[station.lat, station.lon]}
              >
                <Popup>{station.name}</Popup>
              </Marker>
            ))}

            {Object.entries(vehicles).map(([id, loc]) => (
              <React.Fragment key={id}>
                <Marker
                  position={[loc.lat, loc.lon]}
                  icon={vehicleIcon}
                >
                  <Popup>🚒 Vehicle {id}</Popup>
                </Marker>

                <VehicleRoute
                  from={[loc.lat, loc.lon]}
                  to={[lat, lon]}
                />
              </React.Fragment>
            ))}

          </MapContainer>
        </div>
      </div>

      {/* 📊 PLOT + ACTIONS (Bottom Half) */}
      {/* <div className="flex-1 bg-slate-800 p-4 rounded overflow-hidden"> */}
      <div className="flex-1 p-4 pt-0 flex flex-col">

        {/* 📈 Plot */}
        {/* 🌡 TEMPERATURE */}
        <div className="flex-1 bg-slate-800 p-4 rounded">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} isAnimationActive={false}>
              <XAxis dataKey="time" />
              <YAxis domain={[0, maxTemp]} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                wrapperStyle={{ pointerEvents: "none" }}
                allowEscapeViewBox={{ x: true, y: true }}
              />
              <Legend />

              <ReferenceLine
                y={TEMP_THRESHOLD}
                stroke="#ef4444"
                strokeDasharray="6 6"
                label={{
                  value: "Threshold 26°C",
                  position: "right",
                  fill: "#ef4444",
                  fontSize: 12
                }}
              />

              <Line
                name="Temperature"
                type="monotone"
                dataKey="temp"
                stroke="transparent"
                dot={(props) => {
                  const isAbove = Number(props.value) > TEMP_THRESHOLD;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill={isAbove ? "#ef4444" : "#22c55e"}
                    />
                  );
                }}
              />

              {incidentMarkers.map((m, idx) => (
                <ReferenceDot
                  key={idx}
                  x={m.time}
                  y={m.temp}
                  r={7}
                  fill="#ff0000"
                  stroke="#b91c1c"
                  strokeWidth={2}
                />
              ))}

              <Brush dataKey="time" height={20} stroke="#64748b" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 💨 SMOKE */}
        <div className="flex-1 bg-slate-800 p-4 rounded mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} isAnimationActive={false}>
              <XAxis dataKey="time" />
              <YAxis domain={[0, maxSmoke]} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                wrapperStyle={{ pointerEvents: "none" }}
                allowEscapeViewBox={{ x: true, y: true }}
              />
              <Legend />

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

              {/* <Line
                name="Smoke"
                type="monotone"
                dataKey="smoke"
                stroke="#3b82f6"
                dot={{ r: 2 }}
              /> */}
              <Line
                name="Smoke"
                type="monotone"
                dataKey="smoke"
                stroke="transparent"
                dot={(props) => {
                  const isAbove = Number(props.value) > SMOKE_THRESHOLD;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill={isAbove ? "#ef4444" : "#3b82f6"}
                    />
                  );
                }}
              />

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

        {/* 🚨 Operator Action Buttons */}
        {/* {incident && user?.role === "STATION" && (
          <div className="mt-4 flex gap-4">

            <button
              disabled={loadingAction}
              onClick={async () => {
                try {
                  setLoadingAction(true);
                  await sendOperatorAction({
                    incident_id: incident.id,
                    action: "ACCEPT",
                    station_id: user.station_id,
                    user: user.username
                  });
                } catch (e) {
                  alert(e.message);
                } finally {
                  setLoadingAction(false);
                }
              }}
              className="bg-green-600 px-4 py-2 rounded disabled:opacity-50"
            >
              Accept
            </button>

            <button
              disabled={loadingAction || !selectedVehicle}
              onClick={async () => {
                if (!selectedVehicle) {
                  alert("Select a vehicle first");
                  return;
                }

                try {
                  setLoadingAction(true);

                  await sendOperatorAction({
                    incident_id: incident.id,
                    action: "DESPATCH",
                    station_id: user.station_id,
                    user: user.username
                  });

                } catch (e) {
                  alert(e.message);
                } finally {
                  setLoadingAction(false);
                }
              }}
              className="bg-orange-500 px-4 py-2 rounded disabled:opacity-50"
            >
              Dispatch
            </button>

            <button
              disabled={loadingAction}
              onClick={async () => {
                try {
                  setLoadingAction(true);
                  await sendOperatorAction({
                    incident_id: incident.id,
                    action: "REJECT",
                    station_id: user.station_id,
                    user: user.username
                  });
                } catch (e) {
                  alert(e.message);
                } finally {
                  setLoadingAction(false);
                }
              }}
              className="bg-red-600 px-4 py-2 rounded disabled:opacity-50"
            >
              Reject
            </button>

          </div>
        )} */}

      </div>
    </div>
  );
}