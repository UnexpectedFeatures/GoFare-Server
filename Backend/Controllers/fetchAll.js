import db from "../database.js";

const fetchUsers = async () => {
  try {
    const snapshot = await db.ref("users").once("value");

    if (!snapshot.exists()) {
      console.log("No users found.");
      return;
    }

    console.log("Users in Realtime Database:");
    console.log(snapshot.val());
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

export default fetchUsers;
