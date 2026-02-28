const WebSocket = require("ws");

const wss = new WebSocket.Server({
  port: 8080,
  path: "/ws/incidents"
});

console.log("Mock WebSocket running at ws://localhost:8080/ws/incidents");

wss.on("connection", (ws) => {
  console.log("Client connected");

  setInterval(() => {
    const demoIncident = {
      type: "incident:new",
      payload: {
        id: "inc-" + Math.floor(Math.random() * 9999),
        device_id: "dev-" + Math.floor(Math.random() * 9999),
        lat: 12.97 + Math.random() * 0.01,
        lon: 77.59 + Math.random() * 0.01,
        first_seen: new Date().toISOString(),
        severity: "confirmed",
        confidence: 0.85,
        sensor_timeline: [
          { ts: "t-3", smoke: 20, temp: 30 },
          { ts: "t-2", smoke: 60, temp: 35 },
          { ts: "t-1", smoke: 150, temp: 70 }
        ],
        user: { name: "Test User", phone: "+91-9000000000" },
        notes: [],
        status: "new"
      }
    };
    ws.send(JSON.stringify(demoIncident));
  }, 10000);
});
