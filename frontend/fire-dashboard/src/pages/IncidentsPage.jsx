// import React, { useEffect, useState } from "react";
// import FireControlDashboard from "../components/FireControlDashboard";
// import StationSelector from "../components/StationSelector";
// import { useAuth } from "../auth/AuthContext";
// import { fetchIncidents, fetchSensorData } from "../api";
// import { ReconnectingWS } from "../ws";
// // import { fetchSensorData } from "../api";

// console.log("🚀 IncidentsPage module loaded");

// export default function IncidentsPage() {
//   console.log("🧠 IncidentsPage render");
//   const { user } = useAuth();
//   const [incidents, setIncidents] = useState([]);
//   const [stationFilter, setStationFilter] = useState("ALL"); // ✅ NEW
//   const selectedIncident = incidents[0]; // or via selection state
//   const visibleIncidents = React.useMemo(() => {
//     if (!user) return [];

//     if (user.role === "STATION") {
//       return incidents.filter(
//         i => i.assigned_station_id === user.station_id
//       );
//     }

//     // NFS CORE
//     return incidents;
//   }, [incidents, user]);
  
//   // ✅ ADD THIS BLOCK (DEBUG)
//   useEffect(() => {
//     console.log("🔥 [IncidentsPage] incidents state updated:", incidents);
//   }, [incidents]);

//   useEffect(() => {
//     setIncidents([]);   // clear old data immediately
//   }, [stationFilter]);

//     useEffect(() => {
    
//     if (!selectedIncident) return;

//     fetchSensorData({
//       incident_id: selectedIncident.id,
//       limit: 50,
//     }).then(samples => {
//       setIncidents(prev =>
//         prev.map(inc =>
//           inc.id === selectedIncident.id
//             ? { ...inc, sensor_timeline: samples }
//             : inc
//         )
//       );
//     });
//   }, [selectedIncident?.id]);

//   useEffect(() => {
//     if (!user) return;

//     async function load() {
//       try {
//         // 🔒 STATION USER → fixed station
//         if (user.role === "STATION") {
//           const data = await fetchIncidents({
//             station_id: user.station_id,
//           });
//           setIncidents(data);
//         }

//         // 🌍 NFS CORE → dropdown controlled
//         if (user.role === "NFS") {
//           const data =
//             stationFilter === "ALL"
//               ? await fetchIncidents()
//               : await fetchIncidents({ station_id: stationFilter });

//           setIncidents(data);
//         }
//       } catch (err) {
//           console.error("Failed to load incidents", err);
//       }
//     }

//     load();
//   }, [user, stationFilter]); // ✅ re-fetch on dropdown change

//   // 🔁 AUTO REFRESH after 1 second
//   useEffect(() => {
//     if (!user) return;

//     const timer = setTimeout(async () => {
//       try {
//         if (user.role === "STATION") {
//           const data = await fetchIncidents({
//             station_id: user.station_id,
//           });
//           setIncidents(data);
//         }

//         if (user.role === "NFS") {
//           const data =
//             stationFilter === "ALL"
//               ? await fetchIncidents()
//               : await fetchIncidents({ station_id: stationFilter });

//           setIncidents(data);
//         }
//       } catch (err) {
//         console.error("Auto-refresh failed", err);
//       }
//     }, 1000);

//     return () => clearTimeout(timer);
//   }, [user, stationFilter]);



//   // useEffect(() => {
//   //   const ws = new ReconnectingWS("ws://localhost:8000/ws", (msg) => {
//   //     console.log("📡 WS message received:", msg); // ✅ DEBUG

//   //     if (!msg) return;

//   //     if (msg.type === "incident:new") {
//   //       // STATION user → only own station
//   //       if (user.role === "STATION") {
//   //         if (msg.payload.assigned_station_id !== user.station_id) return;
//   //       }

//   //       // NFS CORE → respect dropdown filter
//   //       if (user.role === "NFS_CORE" && stationFilter !== "ALL") {
//   //         if (msg.payload.assigned_station_id !== stationFilter) return;
//   //       }

//   //       setIncidents(prev => [msg.payload, ...prev]);
//   //     }

//   //     if (msg.type === "incident:update") {
//   //       setIncidents(prev => {
//   //         const idx = prev.findIndex(i => i.id === msg.payload.id);
//   //         if (idx === -1) return prev;

//   //         const copy = [...prev];
//   //         copy[idx] = { ...copy[idx], ...msg.payload };
//   //         return copy;
//   //       });
//   //     }
//   //   });

//   //   return () => ws.close();
//   // }, []);

//   useEffect(() => {
//     const ws = new ReconnectingWS("ws://localhost:8000/ws", (msg) => {
//       console.log("📡 WS message received:", msg);

//       if (!msg) return;

//       // if (msg.type === "incident:new") {
//       //   setIncidents(prev => {
//       //     // prevent duplicates
//       //     if (prev.some(i => i.id === msg.payload.id)) {
//       //       return prev;
//       //     }
//       //     return [msg.payload, ...prev];
//       //   });
//       // }
//       if (msg.type === "incident:new") {
//         // 🔒 STATION USER → ignore other stations
//         if (
//           user?.role === "STATION" &&
//           msg.payload.assigned_station_id !== user.station_id
//         ) {
//           return;
//         }

//         // 🌍 NFS CORE dropdown filter
//         if (
//           user?.role === "NFS" &&
//           stationFilter !== "ALL" &&
//           msg.payload.assigned_station_id !== stationFilter
//         ) {
//           return;
//         }

//         setIncidents(prev => {
//           if (prev.some(i => i.id === msg.payload.id)) //{
//             // return prev;
//           // }
//           return [msg.payload, ...prev];
//         });
//       }

//       // if (msg.type === "incident:update") {
//       //   setIncidents(prev =>
//       //     prev.map(i =>
//       //       i.id === msg.payload.id ? { ...i, ...msg.payload } : i
//       //     )
//       //   );
//       // }

//       if (msg.type === "incident:update") {
//         // 🔒 Same station guard
//         // if (
//         //   user?.role === "STATION" &&
//         //   msg.payload.assigned_station_id !== user.station_id
//         // ) {
//         //   return;
//         // }

//         setIncidents(prev =>
//           prev.map(i =>
//             i.id === msg.payload.id ? { ...i, ...msg.payload } : i
//           )
//         );
//       }

//       if (msg.type === "sensor:update") {
//         const { device_id, ts, temp, smoke } = msg.payload;

//         setIncidents(prev =>
//           prev.map(inc => {
//             if (inc.device_id !== device_id) return inc;

//             return {
//               ...inc,
//               sensor_timeline: [
//                 ...(inc.sensor_timeline || []),
//                 {
//                   ts: new Date(ts).toLocaleTimeString(),
//                   temp,
//                   smoke,
//                 },
//               ].slice(-50), // cap history
//             };
//           })
//         );
//       }
      
//     });

//     return () => ws.close();
//   }, [user, stationFilter]);

//   return (
//     <div className="flex flex-col h-screen">
//       {/* HEADER */}
//       <div className="p-4 border-b border-slate-800 flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-semibold">Incidents</h1>
//           <div className="text-sm text-slate-400">
//             Live incidents & operator console
//           </div>
//         </div>

//         {/* ✅ ONLY NFS CORE sees dropdown */}
//         {user?.role === "NFS" && (
//           <StationSelector
//             value={stationFilter}
//             onChange={setStationFilter}
//           />
//         )}
//       </div>

//       {/* DASHBOARD */}
//       <div className="flex-1">
//         <FireControlDashboard incidents={visibleIncidents} />
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchIncidents, fetchFireStations } from "../api";
import FireControlDashboard from "../components/FireControlDashboard";

export default function IncidentsPage() {
  const { user } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [stations, setStations] = useState([]);
  const [stationFilter, setStationFilter] = useState("ALL");

  // 🔥 Load stations (NFS only)
  useEffect(() => {
    if (user?.role !== "NFS") return;

    fetchFireStations().then(setStations);
  }, [user]);

  // 🔥 Load incidents
  useEffect(() => {
    if (!user) return;

    async function load() {
      let data;

      if (user.role === "STATION") {
        data = await fetchIncidents({ station_id: user.station_id });
      } else if (user.role === "NFS") {
        data =
          stationFilter === "ALL"
            ? await fetchIncidents()
            : await fetchIncidents({ station_id: stationFilter });
      }

      setIncidents(data || []);
      if (data?.length) setSelectedIncident(data[0]);
    }

    load();
  }, [user, stationFilter]);

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">

      {/* 🔷 TOP BAR */}
      <div className="p-4 border-b border-slate-800 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Incident Console</h1>

        {/* ✅ Dropdown only for NFS */}
        {user?.role === "NFS" && (
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="bg-slate-700 p-2 rounded"
          >
            <option value="ALL">All Stations</option>
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 🔷 MAIN DASHBOARD */}
      <div className="flex flex-1 overflow-hidden">
        <FireControlDashboard incident={selectedIncident} />
      </div>
    </div>
  );
}

