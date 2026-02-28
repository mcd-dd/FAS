// import React, { useEffect, useRef, useState } from "react";
// import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush } from "recharts";

// // import { ReconnectingWS } from "../ws";
// // import { fetchIncidents, fetchDevices, sendOperatorAction, registerDevice } from "../api";
// import { fetchIncidents, sendOperatorAction } from "../api";
// // import types.js removed; runtime JS doesn't use type declarations
// import { useAuth } from "../auth/AuthContext";
// import { fetchFireStations } from "../api";
// import { useMap } from "react-leaflet";
// import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
// import "leaflet-routing-machine";

// // Defaults & utils
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//   iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//   shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// });

// const severityColor = { confirmed: "#e53e3e", probable: "#dd6b20", low: "#f6e05e", unknown: "#3182ce" };

// // const stationIcon = (color) =>
// //   new L.Icon({
// //     iconUrl: `https://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=firehouse|${color}`,
// //     iconSize: [32, 32],
// //     iconAnchor: [16, 32],
// //     popupAnchor: [0, -32],
// //   });

// const fireTruckIcon = (color = "#ef4444") =>
//   new L.DivIcon({
//     html: `
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         width="28"
//         height="28"
//         viewBox="0 0 24 24"
//         fill="${color}"
//         stroke="white"
//         stroke-width="1.5"
//       >
//         <path d="M3 13V6a1 1 0 0 1 1-1h9v8h2l3 3v2h-2a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3z"/>
//         <circle cx="7" cy="18" r="2"/>
//         <circle cx="15" cy="18" r="2"/>
//       </svg>
//     `,
//     className: "",
//     iconSize: [28, 28],
//     iconAnchor: [14, 14],
//     popupAnchor: [0, -14],
//   });

// const truckIcon = new L.Icon({
//   iconUrl: "/fire_station_icon.png",
//   iconSize: [32, 32],
//   iconAnchor: [16, 16],
// });

// function RoadRoute({ from, to, color = "#f97316", weight = 4 }) {
//   const map = useMap();

//   useEffect(() => {
//     if (!map || !from || !to) return;

//     const control = L.Routing.control({
//       waypoints: [
//         L.latLng(from[0], from[1]),
//         L.latLng(to[0], to[1]),
//       ],
//       lineOptions: {
//         styles: [{ color, weight, opacity: 0.9 }],
//       },
//       addWaypoints: false,
//       draggableWaypoints: false,
//       fitSelectedRoutes: false,
//       show: false,
//       createMarker: () => null, // 🚫 no extra markers
//       router: L.Routing.osrmv1({
//         serviceUrl: "https://router.project-osrm.org/route/v1",
//       }),
//     }).addTo(map);

//     return () => map.removeControl(control);
//   }, [map, from, to, color, weight]);

//   return null;
// }

// function findNearestStation(stations, lat, lon) {
//   if (!stations.length) return null;

//   let min = Infinity;
//   let nearest = null;

//   for (const s of stations) {
//     const d =
//       Math.pow(s.lat - lat, 2) +
//       Math.pow(s.lon - lon, 2);

//     if (d < min) {
//       min = d;
//       nearest = s;
//     }
//   }
//   return nearest;
// }

// // const stationIcon = (color) =>
// //   new L.DivIcon({
// //     html: `
// //       <div style="
// //         width: 18px;
// //         height: 18px;
// //         background-color: ${color};
// //         border-radius: 50%;
// //         border: 3px solid #ffffff;
// //         box-shadow: 0 0 6px rgba(0,0,0,0.6);
// //       "></div>
// //     `,
// //     className: "station-marker",
// //     iconSize: [18, 18],
// //     iconAnchor: [9, 9],
// //     popupAnchor: [0, -9],
// //   });

// const stationIcon = (imageUrl) =>
//   new L.DivIcon({
//     html: `
//       <img
//         src="${imageUrl}"
//         style="
//           width: 50px;
//           height: 50px;
//           object-fit: contain;
//           filter: drop-shadow(0 0 4px rgba(0,0,0,0.6));
//         "
//       />
//     `,
//     className: "",
//     iconSize: [32, 32],
//     iconAnchor: [16, 16],
//     popupAnchor: [0, -16],
//   });

// function normalizeStation(station) {
//   if (!station) return null;

//   const lat = Number(station.lat);
//   const lon = Number(station.lon);

//   if (Number.isNaN(lat) || Number.isNaN(lon)) {
//     console.warn("⚠️ Invalid station coords:", station);
//     return null;
//   }

//   return {
//     id: station.station_id,
//     ...station,
//     lat,
//     lon,
//     status: String(station.status || "")
//       .trim()
//       .toUpperCase(),   // ✅ NORMALIZE HERE
//   };
// }


// // function normalizeIncident(raw) {
// //   if (!raw) return null;
// //   // derive lat/lon if present in payload otherwise random nearby for demo
// //   // const defaultPos = [12.9716, 77.5946];
// //   // const lat = (raw.payload && raw.payload.lat) ? raw.payload.lat : defaultPos[0] + ((Math.random()-0.5) * 0.02);
// //   // const lon = (raw.payload && raw.payload.lon) ? raw.payload.lon : defaultPos[1] + ((Math.random()-0.5) * 0.02);
// //   const defaultPos = [12.9716, 77.5946];

// //   const lat =
// //     typeof raw.lat === "number"
// //       ? raw.lat
// //       : defaultPos[0];

// //   const lon =
// //     typeof raw.lon === "number"
// //       ? raw.lon
// //       : defaultPos[1];

// //   // build timeline: if payload has samples array, use it
// //   let sensor_timeline = [];
// //   if (raw.payload && Array.isArray(raw.payload.samples)) {
// //     sensor_timeline = raw.payload.samples.map((s) => ({
// //       ts: s.ts ? (new Date(s.ts * 1000)).toLocaleTimeString() : String(s.ts || ""),
// //       smoke: Number(s.smoke ?? 0),
// //       temp: Number(s.temp ?? 0)
// //     }));
// //   } else {
// //     sensor_timeline = [{
// //       ts: raw.created_at ? new Date(raw.created_at).toLocaleTimeString() : (raw.payload && raw.payload.ts ? new Date(raw.payload.ts*1000).toLocaleTimeString() : new Date().toLocaleTimeString()),
// //       smoke: Number((raw.payload && (raw.payload.smoke || raw.payload.smoke_ppm)) ?? 0),
// //       temp: Number((raw.payload && (raw.payload.temp || raw.payload.temp_c)) ?? 0)
// //     }];
// //   }

// //   const sev = (raw.alarm_type === "FIRE" || raw.alarm_type === "fire") ? "confirmed"
// //     : (raw.confidence && raw.confidence > 0.75) ? "probable" : "low";

// //   return {
// //     id: raw.id,
// //     device_id: raw.device_id,
// //     alarm_type: raw.alarm_type,
// //     confidence: raw.confidence ?? 0,
// //     created_at: raw.created_at,
// //     payload: raw.payload ?? {},
// //     lat,
// //     lon,
// //     sensor_timeline,
// //     severity: sev,
// //     user: (raw.payload && raw.payload.user) ? raw.payload.user : { name: "unknown", phone: "" },
// //     status: (raw.payload && raw.payload.status) ? raw.payload.status : "new",
// //     notes: (raw.payload && raw.payload.notes) ? raw.payload.notes : []
// //   };
// // }

// function normalizeIncident(raw) {
//   if (!raw) return null;

//   // --------------------------------------------------
//   // LOCATION (FROM DEVICE, NOT PAYLOAD)
//   // --------------------------------------------------
//   const defaultPos = [12.9716, 77.5946];

//   const jitter = (str) => {
//     let h = 0;
//     for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
//     return (h % 1000) / 100000;
//   };

//   const device = {
//     lat: raw.lat,
//     lon: raw.lon,
//     id: raw.device_id,
//   };

//   const lat =
//     typeof device.lat === "number"
//       ? device.lat
//       : defaultPos[0] + jitter(device.id || raw.device_id || "x");

//   const lon =
//     typeof device.lon === "number"
//       ? device.lon
//       : defaultPos[1] + jitter((device.id || raw.device_id || "x") + "y");

//   // --------------------------------------------------
//   // SENSOR TIMELINE
//   // --------------------------------------------------
//   let sensor_timeline = [];

//   if (raw.payload && Array.isArray(raw.payload.samples)) {
//     sensor_timeline = raw.payload.samples.map((s) => ({
//       ts: s.ts
//         ? new Date(s.ts * 1000).toLocaleTimeString()
//         : String(s.ts || ""),
//       smoke: Number(s.smoke ?? 0),
//       temp: Number(s.temp ?? 0),
//     }));
//   } else {
//     sensor_timeline = [{
//       ts: raw.created_at
//         ? new Date(raw.created_at).toLocaleTimeString()
//         : new Date().toLocaleTimeString(),
//       smoke: Number(raw.payload?.smoke ?? raw.payload?.smoke_ppm ?? 0),
//       temp: Number(raw.payload?.temp ?? raw.payload?.temp_c ?? 0),
//     }];
//   }

//   // --------------------------------------------------
//   // SEVERITY
//   // --------------------------------------------------
//   const alarmType = raw.alarm_type || raw.payload?.alarm_type || "UNKNOWN";

//   const sev =
//     alarmType.toUpperCase() === "FIRE"
//       ? "confirmed"
//       : raw.confidence && raw.confidence > 0.75
//         ? "probable"
//         : "low";

//   // --------------------------------------------------
//   // NORMALIZED OBJECT
//   // --------------------------------------------------
//   return {
//     id: raw.id,
//     // device_id: raw.device_id,
//     device_id: raw.device?.id || raw.device_id,
//     assigned_station_id: raw.assigned_station_id,
//     alarm_type: alarmType,
//     confidence: raw.confidence ?? 0,
//     created_at: raw.created_at,
//     payload: raw.payload ?? {},
//     lat,
//     lon,
//     sensor_timeline,
//     severity: sev,
//     // user: raw.payload?.user ?? { name: "unknown", phone: "" },
//     user: raw.user ?? raw.payload?.user ?? { name: "unknown", phone: "" },
//     status: raw.status ?? "new",
//     notes: raw.payload?.notes ?? [],
//   };
// }

// export default function FireControlDashboard({incidents}) {
//   const normalizedIncidents = incidents
//   .map(normalizeIncident)
//   .filter(Boolean);
//   const { user } = useAuth();   // ✅ REQUIRED
//   // const [incidents, setIncidents] = useState([]);
//   // const [devices, setDevices] = useState([]);
//   const [selected, setSelected] = useState(null);
//   const [selectedDevice, setSelectedDevice] = useState(null);
//   const [connected, setConnected] = useState(false);
//   const wsRef = useRef(null);
//   const pendingActions = useRef([]); // offline action queue
//   // const [showRegister, setShowRegister] = useState(false);
//   // const [newDeviceId, setNewDeviceId] = useState("");
//   const [manualSelection, setManualSelection] = useState(false);
//   const [stations, setStations] = useState([]);
//   // const deviceIncidents = selectedDevice
//   //   ? normalizedIncidents
//   //       .filter(i => i.device_id === selectedDevice)
//   //       // .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
//   //   : [];

//   // const deviceTimeline = deviceIncidents.flatMap(inc =>
//   //   inc.sensor_timeline.map(pt => ({
//   //     ...pt,
//   //     ts: pt.ts,
//   //   }))
//   // );

//   const currentIncident = normalizedIncidents.find(i => i.id === selected);
//   // const assignedStation = React.useMemo(() => {
//   //   if (!currentIncident) return null;

//   //   return stations
//   //     .map(normalizeStation)
//   //     .find(s => s.id === currentIncident.assigned_station_id);
//   // }, [stations, currentIncident]);
//   const assignedStation = React.useMemo(() => {
//     if (!currentIncident) return null;

//     const validStations = stations
//       .map(normalizeStation)
//       .filter(Boolean);

//     // 1️⃣ Prefer explicitly assigned station
//     if (currentIncident.assigned_station_id) {
//       const exact = validStations.find(
//         s => s.id === currentIncident.assigned_station_id
//       );
//       if (exact) return exact;
//     }

//     // 2️⃣ Fallback → nearest station
//     return findNearestStation(
//       validStations,
//       currentIncident.lat,
//       currentIncident.lon
//     );
//   }, [stations, currentIncident]);
//   // const deviceTimeline = currentIncident
//   //   ? currentIncident.sensor_timeline
//   //   : [];
//   const deviceTimeline = React.useMemo(() => {
//     // 🔹 No manual selection → show ALL incidents
//     const source = selectedDevice
//       ? normalizedIncidents.filter(i => i.device_id === selectedDevice)
//       : normalizedIncidents;

//     return source
//       .flatMap(i =>
//         i.sensor_timeline.map(pt => ({
//           ...pt,
//           ts_raw: new Date(pt.ts).getTime(),
//         }))
//       )
//       .sort((a, b) => a.ts_raw - b.ts_raw);
//   }, [normalizedIncidents, selectedDevice]);

//   // useEffect(() => {
//   //   // if (normalizedIncidents.length === 0) return;
//   //   if (!selectedDevice && normalizedIncidents.length > 0) {


//   //   // always follow latest incident
//   //   const latest = normalizedIncidents[0];

//   //   setSelected(latest.id);
//   //   setSelectedDevice(latest.device_id);
//   // }, [normalizedIncidents]);

//   useEffect(() => {
//     async function loadStations() {
//       try {
//         const data = await fetchFireStations();
//         setStations(data || []);
//       } catch (e) {
//         console.error("Failed to load fire stations", e);
//       }
//     }

//     loadStations();
//   }, []);

//   useEffect(() => {
//     if (!selectedDevice && normalizedIncidents.length > 0) {
//       const latest = normalizedIncidents[0];
//       setSelected(latest.id);
//       setSelectedDevice(latest.device_id);
//     }
//   }, [normalizedIncidents, selectedDevice]);
  
//   // useEffect(() => {
//   //   // initial load
//   //   (async () => {
//   //     try {
//         // const rows = await fetchIncidents();
//         // const normalized = (rows || []).map((r) => normalizeIncident(r));
//         // setIncidents(normalized);
//         // if (normalized.length) setSelected(normalized[0].id);

//         // const devs = await fetchDevices();
//         // setDevices(devs || []);
//     //   } catch (e) {
//     //     console.error("Initial load error", e);
//     //   }
//     // })();

//     // connect WS
//     // const url = (window.__WS_URL__ || (location.protocol === "https:" ? "wss://" : "ws://") + location.host + "/ws");
//   //   const url = window.__WS_URL__ || "ws://localhost:8000/ws";

//   //   const ws = new ReconnectingWS(url, (msg) => {
//   //     // messages from backend: { type: "incident:new" | "incident:update", payload: RawIncident }
//   //     if (!msg) return;
//   //     if (msg.type === "incident:new") {
//   //       // const norm = normalizeIncident(msg.payload);
//   //       const norm = msg.payload;
//   //       if (!norm) return;
//   //       setIncidents(prev => [norm, ...prev].slice(0, 500)); // cap
//   //       setSelected(norm.id);
//   //     } else if (msg.type === "incident:update") {
//   //         // const norm = normalizeIncident(msg.payload);
//   //         const norm = msg.payload;

//   //         setIncidents(prev => {
//   //           const idx = prev.findIndex(i => i.id === norm.id);

//   //           // new incident
//   //           if (idx === -1) {
//   //             return [norm, ...prev].slice(0, 500);
//   //           }

//   //           // update existing
//   //           const copy = [...prev];
//   //           copy[idx] = {
//   //             ...copy[idx],
//   //             ...norm,
//   //             sensor_timeline: [
//   //               ...copy[idx].sensor_timeline,
//   //               ...norm.sensor_timeline
//   //             ].slice(-50),
//   //           };
//   //           return copy;
//   //         });
//   //       // const norm = normalizeIncident(msg.payload);
//   //       // setIncidents(prev => prev.map(i => i.id === norm.id ? { ...i, ...norm, sensor_timeline: [...i.sensor_timeline, ...norm.sensor_timeline].slice(-50) } : i));
//   //     } else if (msg.type === "rssi:update") {
//   //       // optional: track rssi in device list
//   //     }
//   //   });
//   //   wsRef.current = ws;

//   //   // cleanup on unmount
//   //   return () => ws.close();
//   // }, []);

//   // flush pending operator actions when connected
//   useEffect(() => {
//     if (!connected && wsRef.current) setConnected(true);
//     const flush = async () => {
//       if (wsRef.current) {
//         while (pendingActions.current.length) {
//           const a = pendingActions.current.shift();
//           try {
//             await sendOperatorAction(a);
//           } catch (e) {
//             // push back and stop
//             pendingActions.current.unshift(a);
//             break;
//           }
//         }
//       }
//     };
//     flush();
//   }, [connected]);

//   function onWSActionSend(actionPayload) {
//     const ws = wsRef.current;
//     const sent = ws?.send({ type: "operator:action", payload: actionPayload });
//     if (!sent) {
//       // fallback REST and offline queue
//       pendingActions.current.push(actionPayload);
//       sendOperatorAction(actionPayload).catch(() => {});
//     }
//   }

//   function pushOperatorAction(action, extra = {}) {
//     const payload = {
//       incident_id: selected,
//       action,
//       user: { name: "operator-1" },
//       ts: new Date().toISOString(),
//       ...extra
//     };
//     // optimistic UI update
//     // setIncidents(prev => prev.map(inc => inc.id === selected ? { ...inc, notes: [...inc.notes, { ts: payload.ts, user: payload.user.name, action }], status: action === "dispatch" ? "dispatched" : inc.status } : inc));
//     onWSActionSend(payload);
//   }

//   function acceptIncident(){ pushOperatorAction("accepted"); }
//   function rejectIncident(){ pushOperatorAction("rejected"); }
//   function dispatchUnits(){ pushOperatorAction("dispatch", { units: ["engine-5"] }); }
//   function callUser(){ pushOperatorAction("call"); alert(`Calling ${ (normalizedIncidents.find(i=>i.id===selected) || {}).user?.phone || 'n/a'} (sim)`); }

//   // async function registerNewDevice() {
//   //   try {
//   //     await registerDevice({ device_id: newDeviceId });
//   //     setShowRegister(false);
//   //     const devs = await fetchDevices();
//   //     setDevices(devs);
//   //   } catch (e) {
//   //     alert("Register failed: " + e);
//   //   }
//   // }

//   const current = currentIncident || null;
//   // const current = incidents.find(i => i.id === selected) || null;
//   // const current =
//   // deviceIncidents.length > 0
//   //   ? deviceIncidents[deviceIncidents.length - 1]
//   //   : null;
//   const currentDevice = selectedDevice;

//   return (
//     <div className="h-full flex" style={{height: "100vh"}}>
//       <div className="w-2/3 relative">
//         <MapContainer className="h-full" center={[12.9716, 77.5946]} zoom={13}>
//           <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//           {/* 🔥 FIRE STATIONS */}
//           {stations
//           .map(normalizeStation)
//           .filter(Boolean)
//           .map(station => {
//             const isBusy = station.status === "BUSY";

//             return (
//               <Marker
//                 key={station.id}
//                 position={[station.lat, station.lon]}
//                 // icon={stationIcon(isBusy ? "#ef4444" : "#22c55e")}
//                 icon={stationIcon(isBusy ? "/fire_station.png" : "/fire_station_icon.png")}
//               >
//                 <Popup>
//                   <div style={{ width: 200 }}>
//                     <div style={{ fontWeight: 600 }}>{station.name}</div>
//                     <div style={{ fontSize: 12 }}>
//                       Status:{" "}
//                       <span style={{ color: isBusy ? "#ef4444" : "#22c55e" }}>
//                         {station.status}
//                       </span>
//                     </div>
//                   </div>
//                 </Popup>
//               </Marker>
//             );
//           })}
//           {/* 🚑 ROUTE: STATION → INCIDENT */}
//           {/* {assignedStation && current && (
//             <Polyline
//               positions={[
//                 [assignedStation.lat, assignedStation.lon],
//                 [current.lat, current.lon],
//               ]}
//               pathOptions={{
//                 color: "#f97316",   // orange
//                 weight: 4,
//                 dashArray: "6,8",
//                 opacity: 0.9,
//               }}
//             />
//           )} */}
//           {current &&
//           stations
//             .map(normalizeStation)
//             .filter(Boolean)
//             .map(station => (
//               // <Polyline
//               //   key={station.id}
//               //   positions={[
//               //     [station.lat, station.lon],
//               //     [current.lat, current.lon],
//               //   ]}
//               //   pathOptions={{
//               //     color:
//               //       station.id === assignedStation?.id
//               //         ? "#f97316" // 🟠 assigned / nearest
//               //         : "#64748b", // ⚪ others
//               //     weight: station.id === assignedStation?.id ? 4 : 2,
//               //     dashArray: "6,8",
//               //     opacity: 0.6,
//               //   }}
//               // />
//               <RoadRoute
//                 key={`${assignedStation.id}-${current.id}`}
//                 from={[assignedStation.lat, assignedStation.lon]}
//                 to={[current.lat, current.lon]}
//                 color="#f97316"
//                 weight={4}
//               />
//             ))}
//           {normalizedIncidents.map(inc => (
//             <Marker key={inc.id} position={[inc.lat, inc.lon]}>
//               <Popup>
//                 <div style={{width: 220}}>
//                   <div style={{fontWeight: 600}}>Incident: {inc.id}</div>
//                   <div style={{fontSize: 12}}>Confidence: {(inc.confidence*100).toFixed(0)}%</div>
//                   <div style={{marginTop: 8}}>
//                     {/* <button onClick={() => setSelectedDevice(inc.device_id)}> */}
//                     <button onClick={() => {
//                         setManualSelection(true);
//                         setSelectedDevice(inc.device_id);
//                         setSelected(inc.id);
//                       }}>
//                       View Device
//                     </button>
//                   </div>
//                 </div>
//               </Popup>
//             </Marker>
//           ))}
//           {/* {current && (
//             <Circle center={[current.lat, current.lon]} radius={50 + current.confidence * 300} pathOptions={{ color: severityColor[current.severity || "unknown"], opacity: 0.4 }} />
//           )} */}
//           {current && (
//             <Marker
//               position={[current.lat, current.lon]}
//               icon={fireTruckIcon(
//                 current.severity === "confirmed"
//                   ? "#ef4444"
//                   : current.severity === "probable"
//                   ? "#f97316"
//                   : "#22c55e"
//               )}
//             >
//               <Popup>
//                 <div style={{ fontWeight: 600 }}>🚒 Active Incident</div>
//                 <div style={{ fontSize: 12 }}>
//                   Severity: {current.severity}
//                 </div>
//               </Popup>
//             </Marker>
//           )}
//         </MapContainer>
//       </div>

//       <aside className="w-1/3 border-l p-4 overflow-auto" style={{background: "#0f1724", color:"#e6eef8"}}>
//         {!current ? <div>No incident selected</div> : (
//           <>
//             <div style={{fontSize: 12, color: "#9aa4b2"}}>Device: {currentDevice}</div>
//             {/* <div style={{fontSize: 14, marginTop: 4}}>User: {current.user?.name}</div> */}
//             <div style={{ fontSize: 14, marginTop: 4 }}>
//               User: {current.user?.name}
//             </div>

//             {/* ADDRESS */}
//             <div style={{ marginTop: 8 }}>
//               <div style={{ fontSize: 12, color: "#9aa4b2" }}>Address</div>
//               <div style={{ fontSize: 13 }}>
//                 {current.user?.address || "Address not available"}
//               </div>
//             </div>

//             {/* DIRECTIONS */}
//             {/* {current.assigned_station_id &&
//               STATION_COORDS[current.assigned_station_id] && (
//                 <a
//                   href={googleDirections(
//                     STATION_COORDS[current.assigned_station_id].lat,
//                     STATION_COORDS[current.assigned_station_id].lon,
//                     current.lat,
//                     current.lon
//                   )}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   style={{
//                     display: "inline-block",
//                     marginTop: 8,
//                     fontSize: 13,
//                     color: "#38bdf8",
//                     textDecoration: "none",
//                   }}
//                 >
//                   📍 Directions from {current.assigned_station_id}
//                 </a>
//             )} */}


//             <div style={{height: 200, marginTop: 12}}>
//               <ResponsiveContainer width="100%" height="100%">
//                 {/* <LineChart key={deviceTimeline.length} data={deviceTimeline}> */}
//                 {/* <LineChart data={deviceTimeline}> */}
//                 <LineChart
//                   key={`${current?.id}-${deviceTimeline.length}`}
//                   data={deviceTimeline}>
//                   <XAxis dataKey="ts" />
//                   <YAxis />
//                   <Tooltip />
//                   <Line dataKey="smoke" stroke="#e53e3e" dot />
//                   <Line dataKey="temp" stroke="#3182ce" dot />
//                   <Brush
//                     dataKey="ts"
//                     height={20}
//                     stroke="#64748b"
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             {/* <div style={{display: "flex", gap: 8, marginTop: 12}}>
//               <button onClick={() => pushOperatorAction("accepted")} style={{background: "#16a34a", color: "#fff", padding: "8px 12px", borderRadius: 6}}>Accept</button>
//               <button onClick={() => pushOperatorAction("rejected")} style={{background: "#dc2626", color: "#fff", padding: "8px 12px", borderRadius: 6}}>Reject</button>
//               <button onClick={() => pushOperatorAction("dispatch", { units: ["engine-5"] })} style={{background: "#f97316", color: "#fff", padding: "8px 12px", borderRadius: 6}}>Dispatch</button>
//               <button onClick={() => { pushOperatorAction("call"); alert(`Calling ${current.user?.phone || 'n/a'} (sim)`); }} style={{background: "#2563eb", color: "#fff", padding: "8px 12px", borderRadius: 6}}>Call</button>
//             </div> */}
//             <div style={{ display: "flex", gap: 8, marginTop: 12 }}>

//               {/* FIRE STATION: CAN ACT */}
//               {user?.role === "STATION" && (
//                 <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
//                   Read-only (National View)
//                 </div>
//               )}

//               {/* NFS CORE: READ ONLY */}
//               {user?.role === "NFS" && (
//                 <>
//                   <button
//                     onClick={acceptIncident}
//                     style={{ background: "#16a34a", color: "#fff", padding: "8px 12px", borderRadius: 6 }}
//                   >
//                     Accept
//                   </button>

//                   <button
//                     onClick={dispatchUnits}
//                     style={{ background: "#f97316", color: "#fff", padding: "8px 12px", borderRadius: 6 }}
//                   >
//                     Dispatch
//                   </button>

//                   <button
//                     onClick={callUser}
//                     style={{ background: "#2563eb", color: "#fff", padding: "8px 12px", borderRadius: 6 }}
//                   >
//                     Call
//                   </button>
//                 </>
//               )}

//             </div>


//             <div style={{marginTop: 12}}>
//               <div style={{fontSize: 12, color: "#9aa4b2"}}>Audit trail</div>
//               <div style={{marginTop: 8}}>
//                 {current.notes.length === 0 ? <div style={{color:"#94a3b8"}}>No actions yet</div> : current.notes.map((n, idx) => (
//                   <div key={idx} style={{fontSize: 12, background: "#102231", padding: 8, borderRadius: 6, marginBottom: 8}}>
//                     <div style={{fontSize: 11, color: "#94a3b8"}}>{new Date(n.ts).toLocaleString()} • {n.user}</div>
//                     <div>{n.action}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </>
//         )}

//         {/* <div style={{marginTop: 18}}>
//           <button onClick={() => setShowRegister(true)} style={{padding: "8px 12px", borderRadius: 6}}>Register Device</button>
//           {showRegister && (
//             <div style={{marginTop: 8}}>
//               <input value={newDeviceId} onChange={(e) => setNewDeviceId(e.target.value)} placeholder="device id" />
//               <button onClick={registerNewDevice}>Create</button>
//               <button onClick={() => setShowRegister(false)}>Cancel</button>
//             </div>
//           )}
//         </div> */}
//       </aside>
//     </div>
//   );
// }

// import React, { useEffect, useState, useMemo } from "react";
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
// import { fetchSensorData } from "../api";
// import { useAuth } from "../auth/AuthContext";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import L from "leaflet";

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
//   iconUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
//   shadowUrl:
//     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
// });

// export default function FireControlDashboard({ incident }) {
//   const { user } = useAuth();
//   const [sensorData, setSensorData] = useState([]);

//   useEffect(() => {
//     if (!incident?.id) return;

//     fetchSensorData({
//       incident_id: incident.id,
//       limit: 100,
//     }).then(setSensorData);
//   }, [incident]);

//   const chartData = useMemo(() => {
//     return sensorData.map((d) => ({
//       ...d,
//       time: new Date(d.ts * 1000).toLocaleTimeString(),
//     }));
//   }, [sensorData]);

//   if (!incident) {
//     return (
//       <div className="flex items-center justify-center w-full">
//         No incident selected
//       </div>
//     );
//   }

//   const lat = incident.lat || 12.9716;
//   const lon = incident.lon || 77.5946;

//   return (
//     <div className="flex flex-1">

//       {/* 🔥 LEFT — MAP */}
//       <div className="w-1/2 h-full p-4">
//         <div className="h-full rounded overflow-hidden">
//           <MapContainer
//             center={[lat, lon]}
//             zoom={14}
//             style={{ height: "100%", width: "100%" }}
//           >
//             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//             <Marker position={[lat, lon]}>
//               <Popup>
//                 <div>
//                   <div className="font-semibold">
//                     Incident {incident.id}
//                   </div>
//                   <div>Device: {incident.device_id}</div>
//                   <div>
//                     Confidence: {(incident.confidence * 100).toFixed(0)}%
//                   </div>
//                 </div>
//               </Popup>
//             </Marker>
//           </MapContainer>
//         </div>
//       </div>

//       {/* 📊 RIGHT — PLOT */}
//       <div className="w-1/2 h-full p-4">
//         <div className="bg-slate-800 p-4 rounded h-full">

//           <ResponsiveContainer width="100%" height="85%">
//             <LineChart data={chartData}>
//               <XAxis dataKey="time" />
//               <YAxis />
//               <Tooltip />

//               <Line
//                 type="monotone"
//                 dataKey="smoke"
//                 stroke="#ef4444"
//                 strokeWidth={2}
//                 dot={false}
//               />

//               <Line
//                 type="monotone"
//                 dataKey="temp"
//                 stroke="#3b82f6"
//                 strokeWidth={2}
//                 dot={false}
//               />

//               {/* 🚨 Incident Marker */}
//               <ReferenceDot
//                 x={new Date(incident.created_at).toLocaleTimeString()}
//                 y={incident.payload?.smoke || 0}
//                 r={6}
//                 fill="yellow"
//                 stroke="red"
//               />

//               <Brush dataKey="time" height={20} stroke="#64748b" />
//             </LineChart>
//           </ResponsiveContainer>

//           {/* ACTION BUTTONS */}
//           <div className="flex gap-4 mt-4">
//             {user?.role === "NFS" && (
//               <>
//                 <button className="bg-green-600 px-4 py-2 rounded">
//                   Accept
//                 </button>
//                 <button className="bg-orange-500 px-4 py-2 rounded">
//                   Dispatch
//                 </button>
//                 <button className="bg-blue-600 px-4 py-2 rounded">
//                   Call
//                 </button>
//               </>
//             )}

//             {user?.role === "STATION" && (
//               <div className="text-slate-400">
//                 Station View (Read Only)
//               </div>
//             )}
//           </div>

//         </div>
//       </div>

//     </div>
//   );
// }

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceDot
} from "recharts";
import { fetchSensorData } from "../api";
import { useAuth } from "../auth/AuthContext";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ReconnectingWS } from "../ws";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function FireControlDashboard({ incident }) {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState([]);
  const wsRef = useRef(null);

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
    if (!incident?.id) return;

    async function load() {
      const data = await fetchSensorData({
        incident_id: incident.id,
        limit: 100,
      });
      setSensorData(data || []);
    }

    load();

    const interval = setInterval(load, 5000);

    return () => clearInterval(interval);
  }, [incident]);


  // 🔴 LIVE SENSOR UPDATES (WebSocket)
  useEffect(() => {
    if (!incident?.device_id) return;

    const ws = new ReconnectingWS("ws://localhost:8000/ws", (msg) => {
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
    });

    wsRef.current = ws;

    return () => ws.close();
  }, [incident]);

  // 📊 Format chart data
  const chartData = useMemo(() => {
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

  if (!incident) {
    return (
      <div className="flex items-center justify-center w-full">
        No incident selected
      </div>
    );
  }

  const lat = incident.lat || 12.9716;
  const lon = incident.lon || 77.5946;

  return (
    <div className="flex flex-1">

      {/* 🔥 LEFT — MAP */}
      <div className="w-1/2 h-full p-4">
        <div className="h-full rounded overflow-hidden">
          <MapContainer
            center={[lat, lon]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

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
          </MapContainer>
        </div>
      </div>

      {/* 📊 RIGHT — LIVE PLOT */}
      <div className="w-1/2 h-full p-4">
        <div className="bg-slate-800 p-4 rounded h-full">

          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="smoke"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="temp"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />

              {/* 🚨 Incident marker */}
              <ReferenceDot
                x={new Date(incident.created_at).toLocaleTimeString()}
                y={incident.payload?.smoke || 0}
                r={6}
                fill="yellow"
                stroke="red"
              />

              <Brush dataKey="time" height={20} stroke="#64748b" travellerWidth={10}/>
            </LineChart>
          </ResponsiveContainer>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 mt-4">
            {user?.role === "NFS" && (
              <>
                <button className="bg-green-600 px-4 py-2 rounded">
                  Accept
                </button>
                <button className="bg-orange-500 px-4 py-2 rounded">
                  Dispatch
                </button>
                <button className="bg-blue-600 px-4 py-2 rounded">
                  Call
                </button>
              </>
            )}

            {user?.role === "STATION" && (
              <div className="text-slate-400">
                Station View (Read Only)
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
