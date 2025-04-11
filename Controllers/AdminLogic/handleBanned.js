import AdminAccount from "../../Models/bannedAdminModel.js";
import Admin from "../../Models/adminAccountModel.js";

const handleBanned = async (ws, msg) => {
    try {
        const payload = msg.replace("[Suspend]", "").trim();
        const [adminId, rfid] = payload.split("|").map(item => item.trim());

        if (!adminId || !rfid) {
            return ws.send("[SuspendResponse] 400 Missing required fields (adminId, rfid)");
        }

        const checkIfExist = await AdminAccount.findOne({ where: { adminId } });
        if (checkIfExist) {
            return ws.send("[SuspendResponse] 404 Admin is already suspended");
        }

        const admin = await Admin.findOne({ where: { adminId } });
        if (!admin) {
            return ws.send("[SuspendResponse] 404 Admin not found");
        }

        await AdminAccount.create({
            admin_id: admin.adminId,
            Banned_Rfid: rfid,
        });

        ws.send("[SuspendResponse] 200 Admin banned successfully");
    } catch (error) {
        console.error("Error banning admin:", error);
        ws.send("[SuspendResponse] 500 Internal server error");
    }
};

export default handleBanned;
