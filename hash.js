import bcrypt from "bcryptjs";

const password = "rafhael123"; // Replace with your actual password

async function hashPassword() {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("🔹 Hashed Password:", hashedPassword);
}

hashPassword();
