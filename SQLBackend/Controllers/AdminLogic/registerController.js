import AdminAccount from "../../Models/adminAccountsModel.js";
import bcrypt from "bcrypt";

const handleRegisterAdmin = async (ws, msg) => {
    try {
        const payload = msg.replace("[Register]", "").trim();
        const [
            email,
            firstName,
            middleName,
            lastName,
            rfid,
            password,
            age,
            contactNumber,
            gender,
            address
        ] = payload.split("|").map(item => item.trim());

        if (!email || !firstName || !password || !rfid) {
            return ws.send("[RegisterResponse] 400 Missing required fields");
        }

        const existingAdmin = await AdminAccount.findOne({ where: { email } });

        if (existingAdmin) {
            return ws.send("[RegisterResponse] 400 Admin already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await AdminAccount.create({
            email,
            firstName,
            middleName,
            lastName,
            rfid,
            password: hashedPassword,
            age,
            contactNumber,
            gender,
            address
        });

        ws.send("[RegisterResponse] 201 Admin registered successfully");
    } catch (error) {
        console.error("Error in handleRegisterAdmin:", error);
        ws.send("[RegisterResponse] 500 Internal server error");
    }
};

export default handleRegisterAdmin;
