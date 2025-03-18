import { DataTypes } from "sequelize";
import sequelize from "../db.js"; // Ensure the correct path to your database connection file

const userNews = sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  
}, {
  timestamps: true,
});

export default userNews;
