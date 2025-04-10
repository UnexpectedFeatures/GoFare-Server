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
      address,
    ] = payload.split("|").map((item) => item.trim());

    // Basic required field check
    if (!email || !firstName || !password || !rfid) {
      return ws.send("[RegisterResponse] 400 Missing required fields");
    }

    // Check for existing admin
    const existingAdmin = await AdminAccount.findOne({ where: { email } });
    if (existingAdmin) {
      return ws.send("[RegisterResponse] 400 Admin already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await AdminAccount.create({
      firstName,
      middleName,
      lastName,
      age: age ? parseInt(age, 10) : null,
      email,
      contactNumber,
            address,
      rfid,
      gender,
      password: hashedPassword,
      
    
   

    });

    ws.send("[RegisterResponse] 201 Admin registered successfully");
  } catch (error) {
    console.error("Error in handleRegisterAdmin:", error.message);
    ws.send("[RegisterResponse] 500 Internal server error");
  }
};

export default handleRegisterAdmin;
