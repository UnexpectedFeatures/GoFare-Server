import db from "../database.js";

const trainSimulator = {
  currentState: {
    currentStopIndex: 0,
    direction: 1,
    isRunning: false,
    intervalId: null,
    currentRoute: null,
    wsClients: new Set(),
  },

  addWebSocketClient(ws) {
    this.currentState.wsClients.add(ws);
    ws.on("close", () => {
      this.currentState.wsClients.delete(ws);
    });
  },

  removeWebSocketClient(ws) {
    this.currentState.wsClients.delete(ws);
  },

  broadcast(message) {
    this.currentState.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  },

  async init(routeId) {
    try {
      const routeRef = db.ref(`trainStations/${routeId}`);
      const snapshot = await routeRef.once("value");
      const routeData = snapshot.val();

      if (!routeData) {
        throw new Error(`Route ${routeId} not found`);
      }

      const stops = [];
      Object.keys(routeData).forEach((key) => {
        if (key.startsWith("Stop")) {
          stops.push({
            id: key,
            ...routeData[key],
          });
        }
      });

      if (stops.length === 0) {
        throw new Error(`No stops found for route ${routeId}`);
      }

      this.currentState = {
        ...this.currentState,
        currentRoute: {
          id: routeId,
          stops,
          name: routeData.name || `Route ${routeId}`,
        },
        currentStopIndex: 0,
        direction: 1,
      };

      console.log(`Initialized route: ${this.currentState.currentRoute.name}`);
      console.log(`Total stops: ${stops.length}`);

      return this.currentState.currentRoute;
    } catch (error) {
      console.error("Initialization error:", error.message);
      throw error;
    }
  },

  start(interval = 5000) {
    if (this.currentState.isRunning) {
      console.log("Simulation is already running");
      return;
    }

    if (!this.currentState.currentRoute) {
      console.error("No route initialized. Call init() first.");
      return;
    }

    this.currentState.isRunning = true;
    console.log("Starting train simulation...");

    this.currentState.intervalId = setInterval(() => {
      this.moveToNextStop();
    }, interval);

    this.announceCurrentStop();
  },

  moveToNextStop() {
    const { stops } = this.currentState.currentRoute;
    const { currentStopIndex, direction } = this.currentState;

    if (direction === 1 && currentStopIndex === stops.length - 1) {
      this.currentState.direction = -1;
    } else if (direction === -1 && currentStopIndex === 0) {
      this.currentState.direction = 1;
    }

    this.currentState.currentStopIndex += this.currentState.direction;

    this.announceCurrentStop();
  },

  announceCurrentStop() {
    const { stops } = this.currentState.currentRoute;
    const { currentStopIndex } = this.currentState;
    const currentStop = stops[currentStopIndex];

    const arrivalMessage = JSON.stringify({
      type: "ARRIVAL",
      data: {
        stopName: currentStop.name,
        stopIndex: currentStopIndex,
        totalStops: stops.length,
        price: currentStop.price || null,
        timestamp: new Date().toLocaleString(),
      },
    });

    this.broadcast(arrivalMessage);

    console.log(`\nNow arriving at: ${currentStop.name}`);
    console.log(`Stop ${currentStopIndex + 1} of ${stops.length}`);
    if (currentStop.price) {
      console.log(`Ticket price from origin: ¥${currentStop.price}`);
    }

    this.updateTrainPosition();
  },

  async updateTrainPosition() {
    try {
      const { currentRoute, currentStopIndex } = this.currentState;
      const currentStop = currentRoute.stops[currentStopIndex];

      await db.ref(`trainSimulation/currentPosition`).set({
        routeId: currentRoute.id,
        routeName: currentRoute.name,
        stopId: currentStop.id,
        stopName: currentStop.name,
        stopIndex: currentStopIndex,
        timestamp: new Date().toLocaleString(),
        price: currentStop.price || null,
      });

      console.log(
        `Updated Firebase with current position at ${currentStop.name}`
      );
    } catch (error) {
      console.error("Error updating train position:", error.message);
    }
  },

  stop() {
    if (!this.currentState.isRunning) {
      console.log("Simulation is not running");
      return;
    }

    clearInterval(this.currentState.intervalId);
    this.currentState.isRunning = false;
    console.log("Train simulation stopped");
  },

  getStatus() {
    return {
      ...this.currentState,
      intervalId: undefined,
      wsClients: undefined,
    };
  },
};

export default trainSimulator;
