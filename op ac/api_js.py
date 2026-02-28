export async function fetchVehicles() {
    const res = await fetch(`${BASE}/api/v1/vehicles`, {
      headers: { ...getAuthHeaders() }
    });
    return res.json();
  }
  
  export async function createVehicle(data) {
    const res = await fetch(`${BASE}/api/v1/vehicles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
  
  export async function updateVehicle(vehicle_id, data) {
    const res = await fetch(`${BASE}/api/v1/vehicles/${vehicle_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  export async function sendOperatorAction(payload) {
    try {
      const res = await fetch(`${BASE}/api/v1/operator/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()   // 🔥 IMPORTANT (session header)
        },
        body: JSON.stringify({
          ...payload,
          ts: new Date().toISOString()
        }),
      });
  
      // 🔐 Handle expired session
      if (res.status === 401) {
        handleUnauthorized();
        return null;
      }
  
      if (!res.ok) {
        const err = await res.text();
        console.error("❌ Operator action failed:", err);
        throw new Error(err || "Operator action failed");
      }
  
      const data = await res.json();
      console.log("✅ Operator action success:", data);
      return data;
  
    } catch (e) {
      console.error("sendOperatorAction error:", e);
      throw e;
    }
  }