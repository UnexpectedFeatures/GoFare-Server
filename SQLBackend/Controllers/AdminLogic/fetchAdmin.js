import AdminAccount from "../../Models/adminAccountsModel.js";

const fetchAdmins = async (ws, msg) => {
  try {
    // Retrieve admin data from the database, excluding the password field.
    const admins = await AdminAccount.findAll({
      attributes: { exclude: ["password"] }
    });
    
    console.log("Retrieved admins:", admins); // Log the retrieved data

    const responseMessage = `[FetchAdminsResponse] 200 ${JSON.stringify(admins)}`;
    console.log("Sending response:", responseMessage); // Log the response message
    ws.send(responseMessage); 
  } catch (error) {
    console.error("Error in fetchAdmins:", error.message);
    ws.send("[FetchAdminsResponse] 500 Internal server error");
  }
};

export default fetchAdmins;
