import React, { useState } from "react";
import { registerDevice } from "../api";
import { fetchFireStations } from "../api";
import { useEffect } from "react";

export default function RegistrationPage() {
  const [deviceId, setDeviceId] = useState("");
  const [userName, setUserName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  // 🔥 NEW
  const [stations, setStations] = useState([]);
  const [station, setStation] = useState("");
  const [photo, setPhoto] = useState("");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    async function loadStations() {
      try {
        const data = await fetchFireStations();
        setStations(data);

        // auto-select first station
        if (data.length) {
          setStation(data[0].station_id);
        }
      } catch (e) {
        console.error("Failed to load stations", e);
      }
    }

    loadStations();
  }, []);

  // async function handleRegister() {
  //   if (!deviceId) {
  //     alert("Device ID required");
  //     return;
  //   }

  //   try {
  //     const result = await registerDevice({
  //       device_id: deviceId,
  //       name: userName,
  //       lat: 12.9716,   // ✅ ADD DEFAULT LOCATION
  //       lon: 77.5946
  //     });

  //     setStatus(result.status);

  //     if (result.status === "registered") {
  //       alert("Device registered successfully!");
  //     } else if (result.status === "already_registered") {
  //       alert("Device already exists");
  //     }
  //   } catch (e) {
  //     console.error(e);
  //     alert("Registration failed.");
  //   }
  // }

  async function handleRegister() {
    if (!deviceId || !userName || !phone) {
      alert("Missing required fields");
      return;
    }

    try {
      const result = await registerDevice({
        device_id: deviceId,
        lat: 12.9716,
        lon: 77.5946,

        primary_station_id: station,

        user: {
          name: userName,
          phone: phone,
          address: address,
          photo: photo, // path or filename
        },
      });

      setStatus(result.status);

      if (result.status === "registered") {
        alert("Device registered successfully");
      }
    } catch (e) {
      alert("Registration failed");
    }
  }

  const inputClass = "w-full p-2 rounded border border-slate-700 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600";

  return (
    <div className="p-6 text-white">
      <h2 className="text-xl font-semibold mb-4">Register Device</h2>

      <div className="grid gap-4 max-w-md">

        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="User Name"
          className={inputClass}
        />

        <input
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="Device ID (e.g., dev-001)"
          className={inputClass}
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className={inputClass}
        />

        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          className={inputClass}
        />

        {/* <input
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
          placeholder="Photo path (e.g. users/u1.jpg)"
          className={inputClass}
        /> */}

        {/* <select value={station} onChange={(e) => setStation(e.target.value)} className={inputClass}>
          <option value="StationA">Station A</option>
          <option value="StationB">Station B</option>
          <option value="StationC">Station C</option>
        </select> */}

        <select
          value={station}
          onChange={(e) => setStation(e.target.value)}
          className={inputClass}
        >
          {stations.map((s) => (
            <option key={s.station_id} value={s.station_id}>
              {s.name} ({s.status})
            </option>
          ))}
        </select>
        <button
          onClick={handleRegister}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Register
        </button>

        {status && (
          <div className="mt-2 text-sm">
            Status: <span className="text-green-400">{status}</span>
          </div>
        )}
      </div>
    </div>
  );
}
