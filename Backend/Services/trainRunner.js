import trainSimulator from "../Services/trainSimulator.js";

export default async function runSimulation() {
  try {
    console.log("🚂 Starting train simulation...");
    await trainSimulator.init("Route1");

    trainSimulator.start(1000);

    setTimeout(() => {
      trainSimulator.stop();
      console.log("🛑 Simulation stopped after 2 minutes");
    }, 120000);
  } catch (error) {
    console.error("❌ Simulation error:", error);
    setTimeout(runSimulation, 5000);
  }
}
