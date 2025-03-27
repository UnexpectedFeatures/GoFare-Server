import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../db.js";

const Event = sequelize.define("Event", {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4, // Automatically generate UUIDv4
    allowNull: false,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "inactive",
  },
  startTime: {
    type: DataTypes.DATE, // Use DATE for date and time
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE, // Use DATE for date and time
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default Event;
