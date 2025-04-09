export default async function startStationCycle(ws) {
  const stationNames = [
    "Station Alpha",
    "Station Bravo",
    "Station Charlie",
    "Station Delta",
    "Station Echo",
    "Station Foxtrot",
    "Station Golf",
  ];

  while (ws.readyState === ws.OPEN) {
    for (const station of stationNames) {
      if (ws.readyState !== ws.OPEN) break;

      const message = {
        type: "stationChange",
        station: station,
      };

      ws.send(JSON.stringify(message));
      console.log(`Switched to ${station}`);

      // Wait 5 seconds before switching to the next
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.warn("WebSocket closed. Stopping station cycle.");
}
