import bcrypt from "bcrypt";

async function hashPassword() {
  const plainPassword = "rafhael123";
  const hashedPassword = await bcrypt.hash(plainPassword, 10); // 10 is the salt rounds
  console.log("Hashed Password:", hashedPassword);
}

hashPassword();
