import { DataTypes, Sequelize } from "sequelize";
import sequelize from "../db.js";

const BanRequest = sequelize.define("BanRequest", {
    email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
        isEmail: true,
    },
    },
    message: {
    type: DataTypes.TEXT,
    allowNull: false, 
    },
    created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW, 
    },
});


export default BanRequest;
  