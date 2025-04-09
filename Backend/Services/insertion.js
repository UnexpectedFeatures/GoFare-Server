import {
  insertUserData,
  insertWalletData,
} from "../Controllers/userInserter.js";

export default async function insertUserAndWalletData() {
  await insertUserData("RbwPIn5yxM024oxFZUa21h9bFZnH", {
    firstName: "Ayane",
    rfid: "aaa111",
    email: "ayane@sakura.com",
  });

  await insertWalletData("RbwPIn5yxM024oxFZUa21h9bFZnH", {
    balance: 1000,
    currency: "USD",
  });
}
