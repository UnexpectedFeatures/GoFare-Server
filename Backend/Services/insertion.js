import {
  insertUserData,
  insertWalletData,
} from "../Controllers/userInserter.js";

export default async function insertUserAndWalletData() {
  await insertUserData("ian", {
    firstName: "Ayane",
    rfid: "aaa111",
    email: "ayane@example.com",
  });

  await insertWalletData("ian", {
    balance: 1000,
    currency: "USD",
  });
}
