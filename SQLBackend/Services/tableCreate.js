import {
  UserAccount,
  SignInModel,
  userAccountUnhashed,
} from "../Models/userAccountModel.js";
import Banned from "../Models/bannedModel.js";
import Wallet from "../Models/walletModel.js";
import Passenger from "../Models/passengerModel.js";
import Transaction from "../Models/transactionModel.js";
import TrainRoute from "../Models/trainRouteModel.js";
import Current from "../Models/currentModel.js";
import "../Models/associations.js";

async function createTableUserAccounts() {
  try {
    await UserAccount.sync({ alter: false });
    console.log("User Account table is checked and updated if necessary");
  } catch (error) {
    console.error("Error checking/updating User Account table", error);
  }
}

async function createTableSignInAccounts() {
  try {
    await SignInModel.sync({ alter: false });
    console.log("Sign In table is checked and updated if necessary");
  } catch (error) {
    console.error("Error checking/updating Sign In Account table", error);
  }
}

async function createTableUserUnhasedAccounts() {
  try {
    await userAccountUnhashed.sync({ alter: false });
    console.log(
      "User Unhashed Account table is checked and updated if necessary"
    );
  } catch (error) {
    console.error("Error checking/updating User unhashed table", error);
  }
}

async function createTableUserBanned() {
  try {
    await Banned.sync({ alter: false });
    console.log("Banned table is checked and updated if necessary");
  } catch (error) {
    console.error("Error checking/updating Banned table", error);
  }
}

async function createTableWallet() {
  try {
    await Wallet.sync({ alter: false });
    console.log("Wallet table is checked and updated if necessary");
  } catch (error) {
    console.error("Error checking/updating Wallet table", error);
  }
}

async function createTablePassenger() {
  try {
    await Passenger.sync({ alter: false });
    console.log("Passenger table is checked and updated if necessary");
  } catch (error) {
    console.error("Error checking/updating Passenger table", error);
  }
}

async function createTableTransaction() {
  try {
    await Transaction.sync({ alter: false });
    console.log("Transaction table is checked and updated if necessary");
  } catch (error) {
    console.error("Error checking/updating Transaction table", error);
  }
}

async function createTableTrainRoute() {
  try {
    await TrainRoute.sync({ alter: false });
    console.log("Train Route table is checked and updated if necessary");
  } catch (error) {
    console.error("Error checking/updating Train Route table", error);
  }
}

async function createTableTrainCurrent() {
  try {
    await Current.sync({ alter: false });
    console.log("Current table is checked and updated if necessary");
  } catch (error) {
    console.error("Error checking/updating Current table", error);
  }
}

export {
  createTableUserAccounts,
  createTableSignInAccounts,
  createTableUserUnhasedAccounts,
  createTableUserBanned,
  createTableWallet,
  createTablePassenger,
  createTableTransaction,
  createTableTrainRoute,
  createTableTrainCurrent,
};
