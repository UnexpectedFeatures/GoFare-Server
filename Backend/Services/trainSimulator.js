import db from "../database.js";
import { trainLogger } from "./logger.js";

class TrainSimulator {
  constructor() {
    this.currentState = {
      currentStopIndex: 0,
      direction: 1,
      isRunning: false,
      intervalId: null,
      currentRoute: null,
      wsClients: new Set(),
    };
  }

  addWebSocketClient(ws) {
    this.currentState.wsClients.add(ws);
    ws.on("close", () => this.currentState.wsClients.delete(ws));
  }

  removeWebSocketClient(ws) {
    this.currentState.wsClients.delete(ws);
  }

  broadcast(message) {
    this.currentState.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  async init(routeId = "Route1") {
    try {
      trainLogger.info(`🚂 Initializing route ${routeId}...`);

      const routeRef = db.collection("Route").doc(routeId);
      const doc = await routeRef.get();

      if (!doc.exists) {
        const collections = await db.listCollections();
        const collectionNames = collections.map((col) => col.id);

        throw new Error(
          `Document ${routeId} not found in 'Route' collection.\n` +
            `Existing collections: ${collectionNames.join(", ")}\n` +
            `Available documents in 'Route': ${await this.getRouteDocuments()}`
        );
      }

      const routeData = doc.data();

      const stops = [];
      let stopNumber = 1;

      while (routeData[`Stop${stopNumber}`]) {
        stops.push({
          id: `Stop${stopNumber}`,
          name: routeData[`Stop${stopNumber}`],
          sequence: stopNumber,
        });
        stopNumber++;
      }

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

      trainLogger.info(
        `✅ Successfully initialized route: ${this.currentState.currentRoute.name}`
      );
      trainLogger.info(`📍 Total stops: ${stops.length}`);

      await this.updateTrainPosition();

      return this.currentState.currentRoute;
    } catch (error) {
      trainLogger.error(`❌ Initialization error: ${error.message}`);
      trainLogger.warn("ℹ️ Verify your Firestore has:");
      trainLogger.warn("1. A 'Route' collection (singular)");
      trainLogger.warn("2. A document named 'Route1' (capital R)");
      trainLogger.warn("3. Fields named Stop1, Stop2 with station names");
      throw error;
    }
  }

  async getRouteDocuments() {
    try {
      const snapshot = await db.collection("Route").get();
      return snapshot.docs.map((doc) => doc.id).join(", ") || "None";
    } catch (error) {
      return "Error fetching documents";
    }
  }

  start(interval = 5000) {
    if (this.currentState.isRunning) {
      trainLogger.warn("⚠️ Simulation is already running");
      return;
    }

    if (!this.currentState.currentRoute) {
      trainLogger.error("❗ No route initialized. Call init() first.");
      return;
    }

    trainLogger.info("🚀 Starting train simulation...");
    this.currentState.isRunning = true;

    this.announceCurrentStop();

    this.currentState.intervalId = setInterval(
      () => this.moveToNextStop(),
      interval
    );
  }

  moveToNextStop() {
    const { stops } = this.currentState.currentRoute;
    const { currentStopIndex, direction } = this.currentState;

    if (direction === 1 && currentStopIndex === stops.length - 1) {
      this.currentState.direction = -1;
      trainLogger.info("🔄 Reversing direction (end of line)");
    } else if (direction === -1 && currentStopIndex === 0) {
      this.currentState.direction = 1;
      trainLogger.info("🔄 Reversing direction (start of line)");
    }

    this.currentState.currentStopIndex += this.currentState.direction;
    this.announceCurrentStop();
  }

  announceCurrentStop() {
    const { stops } = this.currentState.currentRoute;
    const { currentStopIndex, direction } = this.currentState;
    const currentStop = stops[currentStopIndex];
    const now = new Date();

    const arrivalMessage = {
      type: "ARRIVAL",
      data: {
        stopName: currentStop.name,
        stopId: currentStop.id,
        stopIndex: currentStopIndex,
        totalStops: stops.length,
        direction: direction > 0 ? "forward" : "backward",
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
      },
    };

    this.broadcast(arrivalMessage);

    trainLogger.info(`🚉 Now arriving at: ${currentStop.name}`);
    trainLogger.info(`📍 Stop ${currentStopIndex + 1} of ${stops.length}`);
    trainLogger.info(`🧭 Direction: ${direction > 0 ? "Forward" : "Backward"}`);

    this.updateTrainPosition();
  }

  async updateTrainPosition() {
    try {
      const { currentRoute, currentStopIndex } = this.currentState;
      const currentStop = currentRoute.stops[currentStopIndex];
      const now = new Date();

      await db.collection("TrainSimulation").doc("CurrentPosition").set({
        routeId: currentRoute.id,
        routeName: currentRoute.name,
        stopId: currentStop.id,
        stopName: currentStop.name,
        stopIndex: currentStopIndex,
        lastUpdated: now.toISOString(),
        displayTime: now.toLocaleTimeString(),
        displayDate: now.toLocaleDateString(),
        status: "in-service",
      });

      trainLogger.info(`📌 Updated Firestore position to ${currentStop.name}`);
    } catch (error) {
      trainLogger.error(`❌ Error updating position: ${error.message}`);
    }
  }

  stop() {
    if (!this.currentState.isRunning) {
      trainLogger.warn("⚠️ Simulation is not running");
      return;
    }

    clearInterval(this.currentState.intervalId);
    this.currentState.isRunning = false;

    db.collection("TrainSimulation").doc("CurrentPosition").update({
      status: "stopped",
      lastUpdated: new Date().toISOString(),
    });

    trainLogger.info("🛑 Simulation stopped");
  }

  getStatus() {
    return {
      isRunning: this.currentState.isRunning,
      currentStop: this.currentState.currentRoute
        ? this.currentState.currentRoute.stops[
            this.currentState.currentStopIndex
          ]
        : null,
      direction: this.currentState.direction > 0 ? "forward" : "backward",
      route: this.currentState.currentRoute,
    };
  }
}

const trainSimulator = new TrainSimulator();
export default trainSimulator;
