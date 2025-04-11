import AdminAccount from "../../Models/adminAccountsModel.js";

const handleEdit = async (ws, msg) => {
  const payload = msg.replace("[Edit]", "").trim();
  try {
    const data = JSON.parse(payload);
    const { adminId, ...updateData } = data;
    if (!adminId) {
      ws.send("[EditResponse] Missing admin id");
      return;
    }
    const updatedAdmin = await AdminAccount.findOneAndUpdate({ adminId }, updateData, { new: true });
    if (updatedAdmin) {
      ws.send("[EditResponse] Admin account updated successfully");
    } else {
      ws.send("[EditResponse] Admin account not found");
    }
  } catch (error) {
    console.error("Error in handleEdit:", error);
    ws.send("[EditResponse] 500 Internal server error");
  }
};

export default handleEdit;
