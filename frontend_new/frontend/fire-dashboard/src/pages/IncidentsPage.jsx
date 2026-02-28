import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  fetchIncidents,
  fetchFireStations,
  fetchVehicles,
  sendOperatorAction
} from "../api";

import FireControlDashboard from "../components/FireControlDashboard";

export default function IncidentsPage() {
  const { user } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [stations, setStations] = useState([]);
  const [stationFilter, setStationFilter] = useState("ALL");
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState({});
  const [loadingRow, setLoadingRow] = useState(null);
  const [selectedTransferStation, setSelectedTransferStation] = useState({});
  const [selectedIncident, setSelectedIncident] = useState(null);
  /* 🔹 Load stations */
  useEffect(() => {
    if (user?.role === "NFS") {
      fetchFireStations().then(setStations);
    }
  }, [user]);

  /* 🔹 Load vehicles */
  useEffect(() => {
    if (user?.role === "STATION") {
      fetchVehicles().then(setVehicles);
    }
  }, [user]);

  /* 🔹 Load incidents */
  useEffect(() => {
    if (!user || user.role !== "STATION") return;
  
    async function load() {
      const data = await fetchIncidents({
        station_id: user.station_id
      });
  
      const alarmOnly = (data || []).filter(
        inc =>
          inc.alarm_type === "FIRE" ||
          inc.alarm_type === "TEMP"
      );
  
      setIncidents(alarmOnly);
    }
  
    load();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "NFS") return;
  
    async function load() {
      const data =
        stationFilter === "ALL"
          ? await fetchIncidents()
          : await fetchIncidents({ station_id: stationFilter });
  
      const alarmOnly = (data || []).filter(
        inc =>
          (inc.alarm_type === "FIRE" ||
            inc.alarm_type === "TEMP") &&
          inc.escalated_to_nfs === true
      );
  
      setIncidents(alarmOnly);
    }
  
    load();
  }, [user, stationFilter]);

  /* 🔹 One row per device (latest incident only) */
  const deviceRows = useMemo(() => {
    const map = {};

    incidents.forEach(inc => {
      if (!map[inc.device_id] || inc.id > map[inc.device_id].id) {
        map[inc.device_id] = inc;
      }
    });

    return Object.values(map);
  }, [incidents]);

  useEffect(() => {
    if (!selectedIncident && deviceRows.length > 0) {
      setSelectedIncident(deviceRows[0]);
    }
  }, [deviceRows]);

  /* 🔹 Handle action */
  const handleAction = async (incident, action) => {
    try {
      setLoadingRow(incident.id);

      await sendOperatorAction({
        incident_id: incident.id,
        action,
        station_id: user.station_id,
        vehicle_id: selectedVehicles[incident.device_id] || null,
        user: user.username
      });

    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingRow(null);
    }
  };

   /* 🔹 Handle Transfer */
   const handleTransfer = async (incident) => {
    const stationId = selectedTransferStation[incident.device_id];

    if (!stationId) {
      alert("Select station first");
      return;
    }

    try {
      setLoadingRow(incident.id);

      await sendOperatorAction({
        incident_id: incident.id,
        action: "TRANSFER",
        station_id: stationId,
        user: user.username
      });

    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingRow(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white">

      {/* LEFT SIDE */}
      <div className="w-[50%] flex flex-col border-r border-slate-700">
        <FireControlDashboard
          incident={selectedIncident}
          incidents={deviceRows}
          setSelectedIncident={setSelectedIncident}
          selectedVehicle={
            selectedIncident
              ? selectedVehicles[selectedIncident.device_id]
              : null
          }
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-[50%] p-6 overflow-y-auto">

        {/* TOP BAR */}
        {user?.role === "STATION" && (
        <div className="flex justify-between mb-6">
          <h1 className="text-xl font-semibold">Incident Console</h1>
        </div>
        )}

        {/* TABLE */}
        {user?.role === "STATION" && (
        <div className="overflow-auto rounded border border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3">Device ID</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {deviceRows.map(inc => (
                <tr key={inc.device_id} className="border-t border-slate-700" onClick={() => setSelectedIncident(inc)}>

                  {/* 1️⃣ Device ID */}
                  <td className="p-3 font-semibold">
                    {inc.device_id}
                  </td>

                  {/* 2️⃣ Vehicle */}
                  <td className="p-3">
                    {inc.vehicle_id ? (
                      <span>{inc.vehicle_id}</span>
                    ) : (
                      <select
                        value={selectedVehicles[inc.device_id] || ""}
                        onChange={(e) =>
                          setSelectedVehicles(prev => ({
                            ...prev,
                            [inc.device_id]: e.target.value
                          }))
                        }
                        className="bg-slate-700 p-2 rounded"
                      >
                        <option value="">Select vehicle</option>
                        {vehicles.map(v => (
                          <option key={v.vehicle_id} value={v.vehicle_id}>
                            {v.name} ({v.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* 3️⃣ Status */}
                  <td className="p-3">
                    {inc.status || "PENDING"}
                  </td>

                  {/* 4️⃣ Buttons */}
                  <td className="p-3 flex gap-2">

                    <button
                      disabled={loadingRow === inc.id || inc.status !== "new"}
                      onClick={() => handleAction(inc, "ACCEPT")}
                      className="bg-green-600 px-3 py-1 rounded"
                    >
                      Accept
                    </button>

                    <button
                      disabled={
                        loadingRow === inc.id ||
                        inc.status !== "ACCEPTED" ||
                        !selectedVehicles[inc.device_id]
                      }
                      onClick={() => handleAction(inc, "DESPATCH")}
                      className="bg-orange-500 px-3 py-1 rounded"
                    >
                      Dispatch
                    </button>

                    <button
                      disabled={loadingRow === inc.id || inc.status !== "new"}
                      onClick={() => handleAction(inc, "REJECT")}
                      className="bg-red-600 px-3 py-1 rounded"
                    >
                      Reject
                    </button>

                  </td>

                </tr>
              ))}

              {deviceRows.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-400">
                    No active alarms
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
        )}

        {user?.role === "NFS" && (
        <div className="flex justify-between mb-6">
          <h1 className="text-xl font-semibold mb-6">
              Escalated Incident Console (NFS)
          </h1>
          {(
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-slate-700 p-2 rounded"
            >
              <option value="ALL">All Stations</option>
              {stations.map(s => (
                <option key={s.station_id} value={s.station_id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
        )}

        {user?.role === "NFS" && (
        <div className="overflow-auto rounded border border-slate-700">
          <table className="w-full text-left">

            <thead className="bg-slate-800">
              <tr>
                <th className="p-3">Device ID</th>
                <th className="p-3">Rejected By Station</th>
                <th className="p-3">Status</th>
                <th className="p-3">Transfer To Station</th>
                <th className="p-3">Transfer</th>
              </tr>
            </thead>

            <tbody>
              {deviceRows.map(inc => (
                <tr key={inc.device_id} className="border-t border-slate-700">

                  {/* 1️⃣ Device ID */}
                  <td className="p-3 font-semibold">
                    {inc.device_id}
                  </td>

                  {/* 2️⃣ Rejected Station */}
                  <td className="p-3">
                    {inc.rejected_by_station || "-"}
                  </td>

                  {/* 3️⃣ Status */}
                  <td className="p-3">
                    {inc.status}
                  </td>

                  {/* 4️⃣ Transfer Station */}
                  <td className="p-3">
                    {inc.transferred_to_station ? (
                      <span className="text-green-400">
                        {inc.transferred_to_station}
                      </span>
                    ) : (
                      <select
                        value={selectedTransferStation[inc.device_id] || ""}
                        onChange={(e) =>
                          setSelectedTransferStation(prev => ({
                            ...prev,
                            [inc.device_id]: e.target.value
                          }))
                        }
                        className="bg-slate-700 p-2 rounded"
                      >
                        <option value="">Select station</option>
                        {stations
                          .filter(s => s.has_available_vehicle) // backend should provide this
                          .map(s => (
                            <option
                              key={s.station_id}
                              value={s.station_id}
                            >
                              {s.name}
                            </option>
                          ))}
                      </select>
                    )}
                  </td>

                  {/* 5️⃣ Transfer Button */}
                  <td className="p-3">
                    <button
                      disabled={
                        loadingRow === inc.id ||
                        inc.transferred_to_station ||
                        !selectedTransferStation[inc.device_id]
                      }
                      onClick={() => handleTransfer(inc)}
                      className="bg-blue-600 px-4 py-1 rounded disabled:opacity-40"
                    >
                      Transfer
                    </button>
                  </td>

                </tr>
              ))}

              {deviceRows.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400">
                    No escalated incidents
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
        )}

      </div>
    </div>
  );
}