import trainSimulator from "../Services/trainSimulator.js";

export default async function runSimulation() {
  try {
    await trainSimulator.init("route1");

    trainSimulator.start(10000);

    setTimeout(() => {
      trainSimulator.stop();
    }, 120000);
  } catch (error) {
    console.error("Simulation error:", error);
  }
}
