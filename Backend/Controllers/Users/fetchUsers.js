import db from "../../database.js";

export const handleFetchUsers = async (ws, message) => {
  try {
    const usersSnapshot = await db.collection("Users").get();
    const users = [];

    const convertTimestamp = (field) => {
      if (field && field.toDate) return field.toDate().toISOString();
      return field;
    };

    usersSnapshot.forEach((doc) => {
      const d = doc.data();
      users.push({
        userId:       doc.id,
        firstName:    d.firstName,
        lastName:     d.lastName,
        middleName:   d.middleName,
        email:        d.email,
        address:      d.address,
        age:          d.age,
        contactNumber:d.contactNumber,
        gender:       d.gender,
        enabled:      d.enabled,
        creationDate: convertTimestamp(d.creationDate),
        updateDate:   convertTimestamp(d.updateDate),
        birthday:     d.birthday   
      });
    });

    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(users)); 
      console.log(JSON.stringify(users)); 
  }
  } catch (e) {
    if (ws.readyState === ws.OPEN) {
      ws.send(`[USERS_DATA] ${JSON.stringify([])}`); 
    }
  }
};
