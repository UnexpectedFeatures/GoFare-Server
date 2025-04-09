import db from "../database.js";

export async function createModeUserAccountslIfNotExist() {
  const ref = db.ref("userAccounts/userTemplate");
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
    console.log("UserAccount model created in Firebase Realtime Database.");
  } else {
    console.log("UserAccount model already exists.");
  }
}

export async function createModeWalletslIfNotExist() {
    const ref = db.ref("userAccounts/userTemplate/wallets");
    const snapshot = await ref.once("value");
  
    if (!snapshot.exists()) {
      const defaultData = {
        balance: "-",
        currency: "-",
        loanedAmount: "-",
        status: "-",
      };
  
      await ref.set(defaultData);
      console.log("Wallets model created in Firebase Realtime Database.");
    } else {
      console.log("Wallets model already exists.");
    }
  }
  
