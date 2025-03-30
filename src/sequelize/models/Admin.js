import { DataTypes } from "sequelize";
import sequelize from "../db.js"; // Ensure correct path to DB connection

const Admin = sequelize.define("Admin", {
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
    allowNull: false, 
    defaultValue: "moderator"
  },
  phone: {
    type: DataTypes.STRING,
    validate: {
      is: /^[0-9]{11}$/,
    }
  },
  birthday: {
    type: DataTypes.DATE, 
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING, 
    allowNull: true, 
    defaultValue: "Not Specified"
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
  tableName: "admins", // Explicitly setting table name
  timestamps: true, 
});

export default Admin;
