import db from "../database.js";

export async function createStationModelIfNotExist() {
  const ref = db.ref("trainStations");
  const snapshot = await ref.once("value");

  if (!snapshot.exists()) {
    const defaultData = {};

    await ref.set(defaultData);
    console.log("Station model created in Firebase Realtime Database.");
  } else {
    console.log("Station model already exists.");
  }
}

export async function createRoute1StationIfNotExist() {
  const stationNames = ["Stop 1", "Stop 2", "Stop 3", "Stop 4", "Stop 5"];

  const defaultDataList = [
    {
      name: "Tokyo",
      price: "1000",
    },
    {
      name: "osaka",
      price: "1000",
    },
    {
      name: "kyoto",
      price: "1000",
    },
    {
      name: "nagoya",
      price: "1000",
    },
    {
      name: "sapporo",
      price: "1000",
    },
  ];

  for (let i = 0; i < stationNames.length; i++) {
    const stationName = stationNames[i];
    const stationRef = db.ref(`trainStations/route1/${stationName}`);
    const snapshot = await stationRef.once("value");

    if (!snapshot.exists()) {
      await stationRef.set(defaultDataList[i]);
      console.log(`Route 1 ${stationName}: Train Stations values created.`);
    } else {
      console.log(
        `Route 1 ${stationName}: Train Stations values already exists.`
      );
    }
  }
}

export async function createRoute2StationIfNotExist() {
  const stationNames = ["Stop 1", "Stop 2", "Stop 3", "Stop 4", "Stop 5"];

  const defaultDataList = [
    {
      name: "North Avenue",
      price: "1000",
    },
    {
      name: "Shaw Boulevard",
      price: "1000",
    },
    {
      name: "Ortigas",
      price: "1000",
    },
    {
      name: "Guadalupe",
      price: "1000",
    },
    {
      name: "Buendia",
      price: "1000",
    },
  ];

  for (let i = 0; i < stationNames.length; i++) {
    const stationName = stationNames[i];
    const stationRef = db.ref(`trainStations/route2/${stationName}`);
    const snapshot = await stationRef.once("value");

    if (!snapshot.exists()) {
      await stationRef.set(defaultDataList[i]);
      console.log(`Route 2 ${stationName}: Train Stations values created.`);
    } else {
      console.log(
        `Route 2 ${stationName}: Train Stations values already exists.`
      );
    }
  }
}
