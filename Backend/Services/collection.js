import db from "../database.js";

export async function createModedevTemplatelIfNotExist() {
  const ref = db.ref("devTemplate/userTemplate");
  const snapshot = await ref.once("value");

  if (!snapshot.exists()) {
    const defaultData = {
      accountStatus: "-",
      address: "-",
      age: "-",
      gender: "-",
      contactNumber: "-",
      email: "--",
      firstName: "-",
      middleName: "-",
      lastName: "-",
      rfid: "-",
    };

    await ref.set(defaultData);
    console.log("Developer model created in Firebase Realtime Database.");
  } else {
    console.log("Developer model already exists.");
  }
}

export async function createModeWalletslIfNotExist() {
  const ref = db.ref("devTemplate/userTemplate/wallets");
  const snapshot = await ref.once("value");

  if (!snapshot.exists()) {
    const defaultData = {
      balance: "-",
      currency: "-",
      loanedAmount: "-",
      status: "-",
    };

    await ref.set(defaultData);
    console.log(
      "Template Wallets model created in Firebase Realtime Database."
    );
  } else {
    console.log("Template Wallets model already exists.");
  }
}
