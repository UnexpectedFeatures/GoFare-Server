import { UserAccount } from "../Models/userAccountModel.js";
import Current from "../Models/currentModel.js";
import Passenger from "../Models/passengerModel.js";
import TrainRoute from "../Models/trainRouteModel.js";
import Transaction from "../Models/transactionModel.js";
import Wallet from "../Models/walletModel.js";
import fdb from "../fdatabase.js";

async function fetchUser(initiatingWs, rfidMessage, allClients) {
  try {
    const rfid = rfidMessage.trim();

    if (!rfid) {
      broadcastToAll(null, "ERROR: RFID number is required.", allClients);
      return;
    }

    const user = await UserAccount.findOne({
      where: { rfid },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      broadcastToAll(
        null,
        "NOT_FOUND: No user found with the provided RFID.",
        allClients
      );
      return;
    }

    const wallet = await Wallet.findOne({
      where: { Wallet_id: user.userId },
    });

    if (!wallet) {
      broadcastToAll(
        null,
        "ERROR: Wallet not found for this user.",
        allClients
      );
      return;
    }

    console.log(
      `Initial wallet balance: ₱${wallet.balance}, Status: ${wallet.status}`
    );

    const clientRef = fdb.ref("ClientReference");
    const transactionsRef = fdb.ref("Transactions");

    const snapshot = await clientRef
      .orderByChild("rfid")
      .equalTo(rfid)
      .once("value");
    let firebaseUserPath = null;

    snapshot.forEach((childSnapshot) => {
      firebaseUserPath = childSnapshot.key;
    });

    if (firebaseUserPath) {
      await clientRef.child(`${firebaseUserPath}/wallet`).update({
        balance: Number(wallet.balance),
        status: wallet.status,
        loanedAmount: wallet.loanedAmount,
        lastUpdated: new Date().toISOString(),
      });
      console.log(`Updated Firebase wallet for RFID ${rfid}`);
    } else {
      console.log(`RFID ${rfid} not found in ClientReference`);
    }

    const currentLocation = await Current.findOne({
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    if (!currentLocation) {
      broadcastToAll(
        null,
        "ERROR: Current location not available.",
        allClients
      );
      return;
    }

    const currentLocationDetails = await TrainRoute.findOne({
      where: { TrainRoute_Location: currentLocation.Location_Now },
    });

    if (!currentLocationDetails) {
      broadcastToAll(
        null,
        "ERROR: Current location details not found.",
        allClients
      );
      return;
    }

    const activeTrip = await Passenger.findOne({
      where: {
        User: user.userId,
        Drop_Off: null,
      },
    });

    let message;
    if (activeTrip) {
      const pickupLocationDetails = await TrainRoute.findOne({
        where: { TrainRoute_Location: activeTrip.PickUp },
      });

      if (!pickupLocationDetails) {
        broadcastToAll(
          null,
          "ERROR: Pickup location details not found.",
          allClients
        );
        return;
      }

      const routeSegmentPrices = await TrainRoute.findAll({
        where: {
          Route_Number: pickupLocationDetails.Route_Number,
        },
        order: [["Stop_Number", "ASC"]],
      });

      const pickupStopIndex = routeSegmentPrices.findIndex(
        (route) => route.TrainRoute_Location === activeTrip.PickUp
      );
      const dropOffStopIndex = routeSegmentPrices.findIndex(
        (route) => route.TrainRoute_Location === currentLocation.Location_Now
      );

      let fare = 0;
      for (let i = pickupStopIndex; i <= dropOffStopIndex; i++) {
        fare += routeSegmentPrices[i].Location_price;
      }

      console.log(`Processing payment - Fare: ₱${fare}`);

      const transactionNumber = `TRX-${Date.now()}-${user.userId}`;
      const currentBalance = parseFloat(wallet.balance);
      const fareAmount = parseFloat(fare);
      const newBalance = currentBalance - fareAmount;

      const transaction = await Transaction.create({
        Transaction_Number: transactionNumber,
        User: user.userId,
        Rfid: user.rfid,
        discount: "0",
        discount_Value: "0",
        total: fare,
      });

      await activeTrip.update({
        Drop_Off: currentLocation.Location_Now,
        Pick_Up_Amout: pickupLocationDetails.Location_price,
        Drop_Off_Amount: currentLocationDetails.Location_price,
        amount: fare,
        transaction_number: transactionNumber,
      });

      if (newBalance >= 0) {
        await wallet.update({
          balance: newBalance,
          status: "active",
          loanedAmount: 0,
        });

        if (firebaseUserPath) {
          await clientRef.child(`${firebaseUserPath}/wallet`).update({
            balance: newBalance,
            status: "active",
            loanedAmount: 0,
            lastUpdated: new Date().toISOString(),
          });
        }

        const userTransactionsRef = transactionsRef.child(rfid);
        const transactionCountSnapshot = await userTransactionsRef.once(
          "value"
        );
        const transactionCount = transactionCountSnapshot.numChildren();
        const newTransactionKey = `transaction${transactionCount + 1}`;

        await userTransactionsRef.child(newTransactionKey).set({
          transactionNumber: transactionNumber,
          balance: currentBalance,
          date: new Date().toLocaleDateString("en-US"),
          discount: false,
          dropoff: currentLocation.Location_Now,
          loaned: false,
          pickup: activeTrip.PickUp,
          remainingBalance: newBalance,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
          total: fare,
        });

        console.log(`Payment successful. New balance: ₱${newBalance}`);
        message = `
  TRIP_COMPLETED:
  ID: ${user.userId}
  Name: ${user.firstName} ${user.middleName || ""} ${user.lastName}
  PickUp: ${activeTrip.PickUp} (₱${pickupLocationDetails.Location_price})
  DropOff: ${currentLocation.Location_Now} (₱${
          currentLocationDetails.Location_price
        })
  Fare: ₱${fare}
  Payment: Deducted from wallet
  New Balance: ₱${newBalance}
        `.trim();
      } else {
        const loanAmount = Math.abs(newBalance);
        await wallet.update({
          balance: newBalance,
          loanedAmount: loanAmount,
          status: "loaned",
        });

        if (firebaseUserPath) {
          await clientRef.child(`${firebaseUserPath}/wallet`).update({
            balance: newBalance,
            loanedAmount: loanAmount,
            status: "loaned",
            lastUpdated: new Date().toISOString(),
          });
        }

        const userTransactionsRef = transactionsRef.child(rfid);
        const transactionCountSnapshot = await userTransactionsRef.once(
          "value"
        );
        const transactionCount = transactionCountSnapshot.numChildren();
        const newTransactionKey = `transaction${transactionCount + 1}`;

        await userTransactionsRef.child(newTransactionKey).set({
          balance: currentBalance,
          date: new Date().toLocaleDateString("en-US"),
          discount: false,
          dropoff: currentLocation.Location_Now,
          loaned: true,
          pickup: activeTrip.PickUp,
          remainingBalance: newBalance,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
          total: fare,
        });

        console.log(
          `Insufficient funds. New balance: ₱${newBalance}, Loan: ₱${loanAmount}`
        );
        message = `
  TRIP_COMPLETED:
  ID: ${user.userId}
  Name: ${user.firstName} ${user.middleName || ""} ${user.lastName}
  PickUp: ${activeTrip.PickUp} (₱${pickupLocationDetails.Location_price})
  DropOff: ${currentLocation.Location_Now} (₱${
          currentLocationDetails.Location_price
        })
  Fare: ₱${fare}
  Payment: Insufficient funds - New balance: ₱${newBalance}
  Loan Amount: ₱${loanAmount}
  Wallet Status: Loaned
        `.trim();
      }
    } else {
      if (wallet.status === "loaned") {
        message = `
  ACCESS_DENIED:
  ID: ${user.userId}
  Name: ${user.firstName} ${user.middleName || ""} ${user.lastName}
  Reason: Wallet has outstanding loan (₱${wallet.loanedAmount})
  Please settle your loan before starting a new trip.
        `.trim();
      } else {
        await Passenger.create({
          User: user.userId,
          Rfid: user.rfid,
          PickUp: currentLocation.Location_Now,
          Pick_Up_Amout: currentLocationDetails.Location_price,
          Drop_Off: null,
          Drop_Off_Amount: null,
          amount: null,
        });

        message = `
  TRIP_STARTED:
  ID: ${user.userId}
  Name: ${user.firstName} ${user.middleName || ""} ${user.lastName}
  PickUp: ${currentLocation.Location_Now} (₱${
          currentLocationDetails.Location_price
        })
  DropOff: Pending
        `.trim();
      }
    }

    broadcastToAll(null, message, allClients);
    console.log(message);
  } catch (error) {
    console.error("Error processing user scan:", error);
    broadcastToAll(
      null,
      "ERROR: An error occurred while processing the scan.",
      allClients
    );
  }
}

function broadcastToAll(senderWs, message, clientsSet) {
  clientsSet.forEach((client) => {
    if (
      (!senderWs || client !== senderWs) &&
      client.readyState === WebSocket.OPEN
    ) {
      client.send(message);
    }
  });
}

export default fetchUser;
