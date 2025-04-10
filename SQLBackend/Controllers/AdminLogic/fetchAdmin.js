const fetchAdmins = async (ws, msg) => {
    try {
        const payload = msg.replace("[FetchAdmins]", "").trim();
        const [adminId] = payload.split("|").map(item => item.trim());

        if (!adminId) {
            return ws.send("[FetchAdminsResponse] 400 Missing required fields");
        }

        const admin = await AdminAccount.findOne({ where: { adminId } });

        if (!admin) {
            return ws.send("[FetchAdminsResponse] 404 Admin not found");
        }

        ws.send(`[FetchAdminsResponse] 200 ${JSON.stringify(admin)}`);
    } catch (error) {
        console.error("Error in fetchAdmins:", error);
        ws.send("[FetchAdminsResponse] 500 Internal server error");
    }
};
