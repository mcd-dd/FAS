export async function sendVehicleLocation(lat, lon) {
  const user = JSON.parse(localStorage.getItem("auth_user"));

  const res = await fetch(`${BASE}/api/v1/vehicle/location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      vehicle_id: user.vehicle_id,
      lat,
      lon
    })
  });

  return res.json();
}