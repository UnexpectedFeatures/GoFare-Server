import db from "../database.js";

export default async function fetchUser(ws, message) {
  try {
    const rfid = message.trim();

    if (!rfid) {
      throw new Error("RFID is missing");
    }

    const userRef = db.ref("userAccounts");

    const snapshot = await userRef
      .orderByChild("rfid")
      .equalTo(rfid) 
      .once("value");

    if (!snapshot.exists()) {
      console.log("No match for RFID:", rfid);
      return ws.send(
        JSON.stringify({
          type: "error",
          message: "No user found with this RFID",
        })
      );
    }

    let userData = null;

    snapshot.forEach((childSnapshot) => {
      if (!userData) {
        userData = childSnapshot.val();
      }
    });

    if (!userData || userData.firstName === "") {
      throw new Error("User account is not properly configured");
    }

    console.log("RFID matched, user data:", userData);
    ws.send(
      JSON.stringify({
        type: "success",
        message: "User found",
        data: userData,
      })
    );
  } catch (error) {
    console.error("Error processing message:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: error.message,
      })
    );
  }
}
