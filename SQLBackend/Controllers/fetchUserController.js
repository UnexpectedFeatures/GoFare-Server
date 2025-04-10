import { UserAccount } from "../Models/userAccountModel.js";
import Current from "../Models/currentModel.js";
import Passenger from "../Models/passengerModel.js";
import TrainRoute from "../Models/trainRouteModel.js";

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

      await activeTrip.update({
        Drop_Off: currentLocation.Location_Now,
        Pick_Up_Amout: pickupLocationDetails.Location_price,
        Drop_Off_Amount: currentLocationDetails.Location_price,
        amount: fare,
      });

      message = `
  TRIP_COMPLETED:
  ID: ${user.userId}
  Name: ${user.firstName} ${user.middleName || ""} ${user.lastName}
  PickUp: ${activeTrip.PickUp} (₱${pickupLocationDetails.Location_price})
  DropOff: ${currentLocation.Location_Now} (₱${
        currentLocationDetails.Location_price
      })
  Fare: ₱${fare}
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

    ws.send(message);
    console.log(message);
  } catch (error) {
    console.error("Error processing user scan:", error);
    ws.send("ERROR: An error occurred while processing the scan.");
  }
}

export default fetchUser;
