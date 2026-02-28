import React, { useEffect, useState } from "react";
import { getPendingUsers, activateDevice, fetchFireStations } from "../api";

export default function DeviceActivationPage() {
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deviceId, setDeviceId] = useState("");
  const [station, setStation] = useState("");
  const [plan, setPlan] = useState("");

  useEffect(() => {
    async function load() {
      setUsers(await getPendingUsers());
      setStations(await fetchFireStations());
    }
    load();
  }, []);

  async function handleActivate() {
    await activateDevice({
      user_id: selectedUser,
      device_id: deviceId,
      primary_station_id: station,
      plan: plan
    });
    alert("Device Activated");
  }

  // return (
  //   <div>
  //     <h2>Device Activation (Install Operator)</h2>

  //     <select onChange={e=>setSelectedUser(e.target.value)}>
  //       <option>Select User</option>
  //       {users.map(u=>(
  //         <option key={u.user_id} value={u.user_id}>
  //           {u.name} ({u.plan})
  //         </option>
  //       ))}
  //     </select>

  //     {selectedUser && (
  //       <>
  //         <input placeholder="Device ID" onChange={e=>setDeviceId(e.target.value)} />

  //         <select onChange={e=>setStation(e.target.value)}>
  //           {stations.map(s=>(
  //             <option key={s.station_id} value={s.station_id}>
  //               {s.name}
  //             </option>
  //           ))}
  //         </select>

  //         <select onChange={e=>setPlan(e.target.value)}>
  //           <option value="monthly">Monthly</option>
  //           <option value="quarterly">Quarterly</option>
  //           <option value="yearly">Yearly</option>
  //         </select>

  //         <button onClick={handleActivate}>Activate</button>
  //       </>
  //     )}
  //   </div>
  // );
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md text-white">

        <h2 className="text-2xl font-semibold mb-6 text-center">
          Device Activation (Install Operator)
        </h2>

        <select
          onChange={e => setSelectedUser(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-slate-700"
        >
          <option value="">Select User</option>
          {users.map(u => (
            <option key={u.user_id} value={u.user_id}>
              {u.name} ({u.plan})
            </option>
          ))}
        </select>

        {selectedUser && (
          <>
            <input
              placeholder="Device ID"
              onChange={e => setDeviceId(e.target.value)}
              className="w-full p-2 mb-4 rounded bg-slate-700"
            />

            <select
              onChange={e => setStation(e.target.value)}
              className="w-full p-2 mb-4 rounded bg-slate-700"
            >
              <option value="">Select Station</option>
              {stations.map(s => (
                <option key={s.station_id} value={s.station_id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              onChange={e => setPlan(e.target.value)}
              className="w-full p-2 mb-4 rounded bg-slate-700"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>

            <button
              onClick={handleActivate}
              className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded"
            >
              Activate
            </button>
          </>
        )}

      </div>
    </div>
  );

}
