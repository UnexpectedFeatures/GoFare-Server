import AdminAccount from "../../Models/adminAccountsModel.js";

const handleDelete = async (ws, msg) => {
    try {
        const payload = msg.replace("[Delete]", "").trim();
        const [adminId] = payload.split("|").map(item => item.trim());

        if (!adminId) {
            return ws.send("[DeleteResponse] 400 Missing required fields");
        }

        const existingAdmin = await AdminAccount.findOne({ where: { adminId } });

        if (!existingAdmin) {
            return ws.send("[DeleteResponse] 404 Admin not found");
        }

        await AdminAccount.destroy({ where: { adminId } });

        ws.send("[DeleteResponse] 200 Admin deleted successfully");
    } catch (error) {
        console.error("Error in handleDelete:", error);
        ws.send("[DeleteResponse] 500 Internal server error");
    }
};

export default handleDelete;
