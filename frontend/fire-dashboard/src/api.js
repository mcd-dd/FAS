// Minimal client-side REST API wrapper used by the dashboard.
// Adjust endpoints if your backend uses different paths.

// const BASE = window.__API_BASE__ || "";
const BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

// export async function fetchIncidents(limit = 200) {
//   try {
//     const res = await fetch(`${BASE}/api/incidents?limit=${limit}`);
//     if (!res.ok) throw new Error("fetchIncidents failed");
//     return await res.json();
//   } catch (e) {
//     console.warn("fetchIncidents error", e);
//     return [];
//   }
// }
// export async function fetchIncidents(params = {}) {
//   const qs = new URLSearchParams();

//   if (params.limit) qs.set("limit", params.limit);
//   if (params.station_id) qs.set("station_id", params.station_id);

//   const query = qs.toString();
//   const url = query ? `/api/incidents?${query}` : `/api/incidents`;

//   const res = await api.get(url);
//   return res;
// }
export async function fetchIncidents(params = {}) {
  const qs = new URLSearchParams();

  if (params.limit) qs.append("limit", params.limit);
  if (params.station_id) qs.append("station_id", params.station_id);

  const url =
    qs.toString().length > 0
      ? `${BASE}/api/incidents?${qs.toString()}`
      : `${BASE}/api/incidents`;

  console.log("📡 fetchIncidents URL:", url);

  const res = await fetch(url);
  if (!res.ok) {
    console.error("❌ fetchIncidents failed:", res.status);
    throw new Error("Failed to fetch incidents");
  }

  const data = await res.json();
  console.log("✅ fetchIncidents data:", data);
  return data;
}

export async function fetchDevices() {
  try {
    const res = await fetch(`${BASE}/api/devices`);
    if (!res.ok) throw new Error("fetchDevices failed");
    return await res.json();
  } catch (e) {
    console.warn("fetchDevices error", e);
    return [];
  }
}

export async function sendOperatorAction(payload) {
  // payload should contain incident_id, action, user, ts, ...
  try {
    const res = await fetch(`${BASE}/api/operator/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("sendOperatorAction failed");
    return await res.json();
  } catch (e) {
    console.warn("sendOperatorAction error", e);
    throw e;
  }
}

export async function registerDevice(device) {
  try {
    const res = await fetch(`${BASE}/api/devices/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
    });
    if (!res.ok) throw new Error("registerDevice failed");
    return await res.json();
  } catch (e) {
    console.warn("registerDevice error", e);
    throw e;
  }
}

export async function fetchFireStations() {
  // const res = await fetch("http://localhost:8000/api/fire-stations");
  // if (!res.ok) {
  //   throw new Error("Failed to fetch fire stations");
  // }
  // return res.json();

  try {
    const res = await fetch(`${BASE}/api/fire-stations`);
    if (!res.ok) throw new Error("fetchFireStation failed");
    return await res.json();
  } catch (e) {
    console.warn("fetchFireStation error", e);
    return [];
  }
}

export async function fetchSensorData(params = {}) {
  const qs = new URLSearchParams();

  if (params.device_id) qs.append("device_id", params.device_id);
  if (params.incident_id) qs.append("incident_id", params.incident_id);
  if (params.limit) qs.append("limit", params.limit);

  const url =
    qs.toString().length > 0
      ? `${BASE}/api/sensors?${qs.toString()}`
      : `${BASE}/api/sensors`;

  console.log("📡 fetchSensorData URL:", url);

  const res = await fetch(url);
  if (!res.ok) {
    console.error("❌ fetchSensorData failed:", res.status);
    throw new Error("Failed to fetch sensor data");
  }

  return await res.json();
}

export async function registerUser(data) {
  const res = await fetch(`${BASE}/api/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("User registration failed");
  }

  return res.json();
}

export async function getPendingUsers() {
  const res = await fetch(`${BASE}/api/users/pending`);
  if (!res.ok) return [];
  return await res.json();
}

export async function activateDevice(payload) {
  const res = await fetch(`${BASE}/api/devices/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Activation failed");
  return await res.json();
}
