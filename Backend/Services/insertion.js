import {
  insertUserData,
  insertWalletData,
} from "../Controllers/userInserter.js";
import { insertAdminData } from "../Controllers/adminInserter.js";

export default async function insertUserAndWalletData() {
  await insertUserData("RbwPIn5yxM024oxFZUa21h9bFZnH", {
    firstName: "Ivan",
    rfid: "62c2125",
    email: "janivantot@gmail.com",
    password: "securePassword123",
  });

  await insertWalletData("RbwPIn5yxM024oxFZUa21h9bFZnH", {
    balance: 1000,
    currency: "USD",
  });

  await insertAdminData("Xy7nKq2LpVt91AeFbWm6RgZoUcHD", {
    firstName: "Ayane",
    rfid: "62c2125",
    email: "cakewithalie@gmail.com",
    password: "securePassword123",
  });
}
