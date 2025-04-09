import trainSimulator from "../Controllers/trainController.js";

export default async function runSimulation() {
  try {
    await trainSimulator.init("route1");

    trainSimulator.start(5000);

    setTimeout(() => {
      trainSimulator.stop();
    }, 60000);
  } catch (error) {
    console.error("Simulation error:", error);
  }
}
