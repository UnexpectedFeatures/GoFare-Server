import { UserAccount } from "../Models/userAccountModel.js";
import Current from "../Models/currentModel.js";
import Passenger from "../Models/passengerModel.js";
import TrainRoute from "../Models/trainRouteModel.js";
import Transaction from "../Models/transactionModel.js";
import Wallet from "../Models/walletModel.js";
import fdb from "../fdatabase.js";

async function fetchUser(ws, rfidMessage) {
  try {
    const rfid = rfidMessage.trim();

    if (!rfid) {
      ws.send("ERROR: RFID number is required.");
      return;
    }

    const user = await UserAccount.findOne({
      where: { rfid },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      ws.send("NOT_FOUND: No user found with the provided RFID.");
      return;
    }

    const wallet = await Wallet.findOne({
      where: { Wallet_id: user.userId },
    });

    if (!wallet) {
      ws.send("ERROR: Wallet not found for this user.");
      return;
    }

    console.log(
      `Initial wallet balance: ₱${wallet.balance}, Status: ${wallet.status}`
    );

    const clientRef = fdb.ref("ClientReference");

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
        balance: wallet.balance,
        status: wallet.status,
        loanedAmount: wallet.loanedAmount,
        lastUpdated: new Date().toISOString(),
      });
      console.log(`Updated Firebase wallet for RFID ${rfid}`);
    } else {
      console.log(`RFID ${rfid} not found in ClientReference`);
      // const newRef = clientRef.push();
      // await newRef.set({
      //   rfid: rfid,
      //   wallet: {
      //     balance: wallet.balance,
      //     status: wallet.status,
      //     loanedAmount: wallet.loanedAmount,
      //     lastUpdated: new Date().toISOString()
      //   }
      // });
    }

    const currentLocation = await Current.findOne({
      order: [["createdAt", "DESC"]],
      limit: 1,
    });

    if (!currentLocation) {
      ws.send("ERROR: Current location not available.");
      return;
    }

    const currentLocationDetails = await TrainRoute.findOne({
      where: { TrainRoute_Location: currentLocation.Location_Now },
    });

    if (!currentLocationDetails) {
      ws.send("ERROR: Current location details not found.");
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
        ws.send("ERROR: Pickup location details not found.");
        return;
      }

      const fare =
        currentLocationDetails.Location_price +
        pickupLocationDetails.Location_price;
      console.log(`Processing payment - Fare: ₱${fare}`);

      await activeTrip.update({
        Drop_Off: currentLocation.Location_Now,
        Pick_Up_Amout: pickupLocationDetails.Location_price,
        Drop_Off_Amount: currentLocationDetails.Location_price,
        amount: fare,
      });

      const currentBalance = parseFloat(wallet.balance);
      const fareAmount = parseFloat(fare);
      const transactionNumber = `TRX-${Date.now()}-${user.userId}`;
      const newBalance = currentBalance - fareAmount;

      if (newBalance >= 0) {
        await wallet.update({
          balance: newBalance.toString(),
          status: "active",
          loanedAmount: "0",
        });

        if (firebaseUserPath) {
          await clientRef.child(`${firebaseUserPath}/wallet`).update({
            balance: newBalance.toString(),
            status: "active",
            loanedAmount: "0",
            lastUpdated: new Date().toISOString(),
          });
        }

        await Transaction.create({
          Transaction_Number: transactionNumber,
          User: user.userId,
          discount: "0",
          discount_Value: "0",
          total: fare.toString(),
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
          balance: newBalance.toString(),
          loanedAmount: loanAmount.toString(),
          status: "loaned",
        });

        if (firebaseUserPath) {
          await clientRef.child(`${firebaseUserPath}/wallet`).update({
            balance: newBalance.toString(),
            loanedAmount: loanAmount.toString(),
            status: "loaned",
            lastUpdated: new Date().toISOString(),
          });
        }

        await Transaction.create({
          Transaction_Number: transactionNumber,
          User: user.userId,
          discount: "0",
          discount_Value: "0",
          total: fare.toString(),
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

    ws.send(message);
    console.log(message);
  } catch (error) {
    console.error("Error processing user scan:", error);
    ws.send("ERROR: An error occurred while processing the scan.");
  }
}

export default fetchUser;
