import db from "../../database.js";

export const handleLoginAdmin = async (ws, message) => {
  try {
    const payload = JSON.parse(message.replace("[Login_Admin]", "").trim());
    const { email, password } = payload;

    console.log("Attempting login for:", email);

    const snapshot = await db.collection("Admins")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      ws.send("[Login_Admin_Response] Not_Found");
      return;
    }

    const adminDoc = snapshot.docs[0];
    const adminData = adminDoc.data();

    // Check if account is disabled/suspended
    if (adminData.enabled === false) {
      console.log("Account suspended for:", email);
      ws.send("[Login_Admin_Response] Account_Suspended");
      return;
    }

    if (adminData.password !== password) {
      ws.send("[Login_Admin_Response] Invalid_Password");
      return;
    }

    // Optional: Exclude sensitive data in success response
    const { password: _, ...safeAdminData } = adminData;

    console.log("✅ Login success for:", email);

    ws.send(`[Login_Admin_Response] ${JSON.stringify({
      status: "Success",
      id: adminData.id,
      adminLevel: adminData.adminLevel,
      email: adminData.email,
    })}`);
    console.log(adminData.email);
    // OR: send profile data:
    // ws.send(`[Login_Admin_Response] ${JSON.stringify(safeAdminData)}`);
    
  } catch (error) {
    console.error("❌ Login Error:", error);

    const errorResponse = {
      type: "ERROR",
      message: "Login failed",
      error: error.message,
    };

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(errorResponse));
    }
  }
};
