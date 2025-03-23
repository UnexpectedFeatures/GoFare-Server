import { DataTypes } from "sequelize";
import sequelize from "../db.js"; // Ensure the correct path to your database connection file

const User = sequelize.define("User", {
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  username: { 
    type: DataTypes.STRING, 
    allowNull: false, 
  },
  email: { 
    type: DataTypes.STRING, 
    unique: true, 
    allowNull: false 
  },
  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  role: {
    type: DataTypes.STRING, 
    allowNull: true, 
    defaultValue: "User"
  },
  phone: {
    type: DataTypes.STRING,
    validate: {
      is: /^[0-9]{11}$/
    }
  }
  ,
  birthday: {
    type: DataTypes.DATE,  // Changed from STRING to DATE
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING, 
    allowNull: true, 
    defaultValue: "Gender"
  },
  home_address: {
    type: DataTypes.STRING, 
    allowNull: true, 
    defaultValue: "No Location"
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "active", 
    validate: {
      isIn: [["active", "banned", "suspended"]],
    },
  },
  last_login: { 
    type: DataTypes.DATE, 
    allowNull: true 
  },
}, {
  timestamps: true, 
});

export default User;
