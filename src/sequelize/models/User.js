import { DataTypes } from "sequelize";
import sequelize from "../db.js"; // Ensure the correct path to your database connection file

const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: {type: DataTypes.STRING, allowNull: true, defaultValue: "User"},
  last_login: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true, // This will add createdAt and updatedAt
});

export default User;
