import AdminAccount from "../../Models/adminAccountsModel.js";
import bcrypt from "bcrypt";
import fdb from "../../fdatabase.js";

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

    if (!email || !firstName || !password || !rfid) {
      return ws.send("[RegisterResponse] 400 Missing required fields");
    }

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

    const reference = fdb.ref("adminAccounts");

    const snapshot = await reference
      .orderByChild("email")
      .equalTo(email)
      .once("value");
    let firebaseUserPath = null;

    snapshot.forEach((childSnapshot) => {
      firebaseUserPath = childSnapshot.key;
    });

    if (firebaseUserPath) {
      await reference.child(firebaseUserPath).update({
        firstName,
        middleName,
      });
      console.log(`Updated Firebase Admin Account`);
    } else {
      const newRef = reference.push();
      await newRef.set({
        email,
        firstName,
        middleName,
        lastName,
        age: age ? parseInt(age, 10) : null,
        contactNumber,
        address,
        rfid,
        gender,
      });
      console.log(`Created new Firebase Admin Account`);
    }
    end("[RegisterResponse] 201 Admin registered successfully");
  } catch (error) {
    console.error("Error in handleRegisterAdmin:", error.message);
    ws.send("[RegisterResponse] 500 Internal server error");
  }
};

export default handleRegisterAdmin;
