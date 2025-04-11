import UserAccount from "../../Models/userAccountsModel.js";

const handleEdit = async (ws, msg) => {
  const payload = msg.replace("[Edit]", "").trim();
  try {
    const data = JSON.parse(payload);
    const { userId, ...updateData } = data;
    if (!userId) {
      ws.send("[EditResponse] Missing user id");
      return;
    }
    const updatedUser = await UserAccount.findOneAndUpdate({ userId }, updateData, { new: true });
    if (updatedUser) {
      ws.send("[EditResponse] User account updated successfully");
    } else {
      ws.send("[EditResponse] User account not found");
    }
  } catch (error) {
    console.error("Error in handleEdit:", error);
    ws.send("[EditResponse] 500 Internal server error");
  }
};

export default handleEdit;
