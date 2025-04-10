import { UserAccount } from "../Models/userAccountModel.js";
import Wallet from "../Models/walletModel.js";
import TrainRoute from "../Models/trainRouteModel.js";
import db from "../database.js";
import fdb from "../fdatabase.js";
import Current from "../Models/currentModel.js";
import { clearInterval } from "timers";
import AdminAccount from "../Models/adminAccountsModel.js";
import chalk from "chalk";

let syncInterval;
let isSyncing = false;

let allSyncInterval;
let isAllSyncing = false;

async function syncCurrentLocationFromFirebase() {
  if (isSyncing) {
    console.log("Sync already in progress, skipping this interval");
    return;
  }

  isSyncing = true;
  const startTime = Date.now();

  try {
    console.log(chalk.blue("Starting location sync..."));
    const snapshot = await fdb
      .ref("trainSimulation/currentPosition")
      .once("value");
    const currentPosition = snapshot.val();

    if (!currentPosition) {
      console.warn(chalk.yellow("No current position data in Firebase"));
      return null;
    }

    const stopName = currentPosition.stopName;
    if (!stopName) {
      console.warn("Current position has no stopName");
      return null;
    }

    const [currentRecord] = await Current.upsert({
      Current_id: 1,
      Location_Now: stopName,
    });

    const duration = Date.now() - startTime;
    console.log(`Synced location (${duration}ms): ${stopName}`);
    return currentRecord;
  } catch (error) {
    console.error(chalk.red("Sync failed:", error));
    throw error;
  } finally {
    isSyncing = false;
  }
}

async function syncAllFirebaseUsersToSequelize() {
  try {
    await db.sync();

    const snapshot = await fdb.ref("ClientReference").once("value");
    const firebaseUsers = snapshot.val();

    if (!firebaseUsers) {
      console.log("No users found in Firebase");
      return [];
    }

    const results = [];

    for (const [userId, userData] of Object.entries(firebaseUsers)) {
      try {
        const result = await syncSingleUser(userData);
        results.push(result);
      } catch (error) {
        console.error(`Error syncing user ${userId}:`, error);
      }
    }

    console.log(chalk.green(`Successfully synced ${results.length} users`));
    return results;
  } catch (error) {
    console.error("Error in syncAllFirebaseUsersToSequelize:", error);
    throw error;
  }
}

async function syncSingleUser(firebaseData) {
  try {
    const userData = {
      email: firebaseData.email,
      firstName: firebaseData.firstName,
      middleName: firebaseData.middleName,
      lastName: firebaseData.lastName,
      rfid: firebaseData.rfid,
      password: generateSecurePassword(firebaseData.rfid),
      age: firebaseData.age,
      contactNumber: firebaseData.contactNumber,
      gender: firebaseData.gender,
      address: firebaseData.address,
    };

    const [user, userCreated] = await UserAccount.findOrCreate({
      where: { rfid: userData.rfid },
      defaults: userData,
    });

    if (!userCreated) {
      await user.update(userData);
    }

    const walletData = {
      balance: parseFloat(firebaseData.wallet.balance) || 0,
      currency: firebaseData.wallet.currency || "PHP",
      loanedAmount: parseFloat(firebaseData.wallet.loanedAmount) || 0,
      status: firebaseData.wallet.status || "default",
      Wallet_id: user.userId,
    };

    const [wallet, walletCreated] = await Wallet.findOrCreate({
      where: { Wallet_id: user.userId },
      defaults: walletData,
    });

    if (!walletCreated) {
      await wallet.update(walletData);
    }

    console.log(
      chalk.green(`Successfully synced data for user ${user.userId}`)
    );
    return { user, wallet, userCreated, walletCreated };
  } catch (error) {
    console.error("Error syncing user:", error);
    throw error;
  }
}

async function syncAdminAccountsFromFirebase() {
  try {
    await db.sync();

    const snapshot = await fdb.ref("adminAccounts").once("value");
    const firebaseAdmins = snapshot.val();

    if (!firebaseAdmins) {
      console.log("No admin accounts found in Firebase");
      return [];
    }

    const results = [];

    const adminsToProcess = Array.isArray(firebaseAdmins)
      ? firebaseAdmins.filter(Boolean)
      : Object.values(firebaseAdmins).filter(Boolean);

    for (const adminData of adminsToProcess) {
      try {
        const result = await syncSingleAdmin(adminData);
        results.push(result);
      } catch (error) {
        console.error(`Error syncing admin account:`, error);
      }
    }

    console.log(`Successfully synced ${results.length} admin accounts`);
    return results;
  } catch (error) {
    console.error("Error in syncAdminAccountsFromFirebase:", error);
    throw error;
  }
}

async function syncSingleAdmin(firebaseData) {
  try {
    if (!firebaseData.email && !firebaseData.rfid) {
      console.warn(
        chalk.yellow("Skipping admin sync - missing both email and rfid")
      );
      return null;
    }

    const adminData = {
      email: firebaseData.email,
      firstName: firebaseData.firstName,
      middleName: firebaseData.middleName,
      lastName: firebaseData.lastName,
      rfid: firebaseData.rfid,
      password:
        firebaseData.password ||
        generateSecurePassword(
          firebaseData.rfid || Math.random().toString(36).slice(-8)
        ),
      age: firebaseData.age,
      contactNumber: firebaseData.contactNumber,
      gender: firebaseData.gender,
      address: firebaseData.address,
    };

    if (adminData.email) {
      const existingByEmail = await AdminAccount.findOne({
        where: { email: adminData.email },
      });

      if (existingByEmail) {
        console.log(
          `Admin with email ${adminData.email} already exists (ID: ${existingByEmail.adminId})`
        );

        if (!adminData.rfid || existingByEmail.rfid === adminData.rfid) {
          await existingByEmail.update(adminData);
          return { admin: existingByEmail, adminCreated: false };
        }
        return null;
      }
    }

    if (adminData.rfid) {
      const [admin, adminCreated] = await AdminAccount.findOrCreate({
        where: { rfid: adminData.rfid },
        defaults: adminData,
      });

      if (!adminCreated) {
        await admin.update(adminData);
      }

      console.log(
        `Successfully ${adminCreated ? "created" : "updated"} admin account ${
          admin.adminId
        }`
      );
      return { admin, adminCreated };
    }

    if (adminData.email) {
      const [admin, adminCreated] = await AdminAccount.findOrCreate({
        where: { email: adminData.email },
        defaults: adminData,
      });

      if (!adminCreated) {
        await admin.update(adminData);
      }

      console.log(
        `Successfully ${adminCreated ? "created" : "updated"} admin account ${
          admin.adminId
        }`
      );
      return { admin, adminCreated };
    }

    console.warn("Skipping admin sync - insufficient identifying information");
    return null;
  } catch (error) {
    console.error("Error syncing admin account:", error);
    throw error;
  }
}
async function syncAllTrainRoutes() {
  try {
    await TrainRoute.sync({ alter: true });

    const snapshot = await fdb.ref("trainStations").once("value");
    const firebaseRoutes = snapshot.val();

    if (!firebaseRoutes) {
      console.log("No train routes found in Firebase");
      return [];
    }

    const results = [];

    for (const [routeKey, routeStops] of Object.entries(firebaseRoutes)) {
      try {
        const routeNumber = parseInt(routeKey.replace("route", ""));

        for (const [stopKey, stopData] of Object.entries(routeStops)) {
          try {
            const stopNumber = parseInt(stopKey.replace("Stop ", ""));

            const [routeStop, created] = await TrainRoute.upsert({
              TrainRoute_Location: stopData.name,
              Location_price: parseInt(stopData.price),
              Route_Number: routeNumber,
              Stop_Number: stopNumber,
            });

            results.push({
              route: routeNumber,
              stop: stopNumber,
              location: stopData.name,
              created,
              id: routeStop.TrainRoute_id,
            });
          } catch (error) {
            console.error(
              `Error syncing stop ${stopKey} in route ${routeKey}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(`Error processing route ${routeKey}:`, error);
      }
    }

    console.log(
      chalk.green(`Successfully synced ${results.length} train route stops`)
    );
    return results;
  } catch (error) {
    console.error("Error in syncAllTrainRoutes:", error);
    throw error;
  }
}

async function allSync() {
  console.log("Starting full sync...");

  try {
    const [users, routes, location, admins] = await Promise.all([
      syncAllFirebaseUsersToSequelize(),
      syncAllTrainRoutes(),
      syncCurrentLocationFromFirebase(),
      syncAdminAccountsFromFirebase(),
    ]);

    console.log(`→ Users synced: ${users.length}`);
    console.log(`→ Train routes synced: ${routes.length}`);
    console.log(
      chalk.cyan(
        `→ Current location: ${location?.Location_Now || "Not available"}`
      )
    );
    return { users, routes, location, admins };
  } catch (error) {
    console.error("Error during full sync:", error);
    throw error;
  }
}

function startAllSync(interval = 1000) {
  stopAllSync();

  allSync().catch((e) => console.error("Initial allSync error:", e));

  allSyncInterval = setInterval(async () => {
    if (isAllSyncing) {
      console.log("AllSync already in progress, skipping this interval");
      return;
    }

    isAllSyncing = true;
    try {
      await allSync();
    } catch (error) {
      console.error("Periodic allSync error:", error);
    } finally {
      isAllSyncing = false;
    }
  }, interval);

  console.log(`Started all syncing every ${interval / 1000} seconds`);
}

function stopAllSync() {
  if (allSyncInterval) {
    clearInterval(allSyncInterval);
    allSyncInterval = null;
    console.log("Stopped all syncing");
  }
}

function generateSecurePassword(rfid) {
  return `${rfid}_${Math.random().toString(36).slice(-8)}`;
}

export {
  syncAllFirebaseUsersToSequelize,
  syncSingleUser,
  syncAllTrainRoutes,
  syncCurrentLocationFromFirebase,
  allSync,
  startAllSync,
  stopAllSync,
  syncAdminAccountsFromFirebase,
  syncSingleAdmin,
};

startAllSync();
