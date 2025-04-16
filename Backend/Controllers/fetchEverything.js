import db from "../database.js";

export const handleFetchAllUserData = async (ws) => {
  try {
    console.log("Fetching complete user data with RFID, Wallet, and PIN...");

    const usersSnapshot = await db.collection("Users").get();
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const [rfidSnapshot, walletSnapshot, pinSnapshot] = await Promise.all([
      db.collection("UserRFID").get(),
      db.collection("UserWallet").get(),
      db.collection("UserPin").get(),
    ]);

    const rfidDataMap = new Map(
      rfidSnapshot.docs.map((doc) => [doc.id, doc.data()])
    );
    const walletDataMap = new Map(
      walletSnapshot.docs.map((doc) => [doc.id, doc.data()])
    );
    const pinDataMap = new Map(
      pinSnapshot.docs.map((doc) => [doc.id, doc.data()])
    );

    const completeUserData = users.map((user) => {
      const userRfid = rfidDataMap.get(user.id) || null;
      const walletKey = userRfid?.rfid || user.id;

      return {
        ...user,
        rfidData: userRfid,
        walletData: walletDataMap.get(walletKey) || null,
        pinData: pinDataMap.get(user.id) || null,
      };
    });

    const response = {
      type: "COMPLETE_USER_DATA",
      data: completeUserData,
      count: completeUserData.length,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(response));
    } else {
      console.error("WebSocket not open, data not sent");
    }
  } catch (error) {
    console.error("Data fetch error:", error);

    const errorResponse = {
      type: "FETCH_ERROR",
      message: "Failed to retrieve user data",
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
