import fdb from "../fdatabase.js";
import chalk from "chalk";

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
      const routeRef = fdb.ref(`trainStations/${routeId}`);
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
      console.error(chalk.red(`Initialization error: ${error.message}`));
      throw error;
    }
  },

  start(interval = 5000) {
    if (this.currentState.isRunning) {
      console.log(chalk.red("⚠️ Simulation is already running"));
      return;
    }

    if (!this.currentState.currentRoute) {
      console.error(chalk.red("❗ No route initialized. Call init() first."));
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
    const dateTime = new Date().toLocaleString();
    const [date, time] = dateTime.split(", ");

    const arrivalMessage = JSON.stringify({
      type: "ARRIVAL",
      data: {
        stopName: currentStop.name,
        stopIndex: currentStopIndex,
        totalStops: stops.length,
        price: currentStop.price || null,
        date: date,
        time: time,
      },
    });

    this.broadcast(arrivalMessage);

    // console.log(
    //   chalk.greenBright(
    //     `\n🚉 Now arriving at: ${chalk.yellow(currentStop.name)}`
    //   )
    // );
    // console.log(
    //   chalk.cyan(`📍 Stop ${currentStopIndex + 1} of ${stops.length}`)
    // );
    if (currentStop.price) {
      console.log(
        chalk.magenta(`🎟️ fdbTicket price from origin: ¥${currentStop.price}`)
      );
    }

    this.updateTrainPosition();
  },

  async updateTrainPosition() {
    try {
      const { currentRoute, currentStopIndex } = this.currentState;
      const currentStop = currentRoute.stops[currentStopIndex];
      const dateTime = new Date().toLocaleString();
      const [date, time] = dateTime.split(", ");

      await fdb.ref("trainSimulation/currentPosition").set({
        routeId: currentRoute.id,
        routeName: currentRoute.name,
        stopId: currentStop.id,
        stopName: currentStop.name,
        stopIndex: currentStopIndex,
        date: date,
        time: time,
        price: currentStop.price || null,
      });

      // console.log(
      //   chalk.blueBright(
      //     `✅ Updated Firebase with current position at ${chalk.yellow(
      //       currentStop.name
      //     )}\n`
      //   )
      // );
    } catch (error) {
      console.error(
        chalk.red(`Error updating train position: ${error.message}`)
      );
    }
  },

  stop() {
    if (!this.currentState.isRunning) {
      console.log(chalk.red("⚠️ Simulation is not running"));
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
