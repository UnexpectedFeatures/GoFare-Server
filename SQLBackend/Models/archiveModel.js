import db from "../database.js";
import { Sequelize, DataTypes, Model } from "sequelize";
import dotenv from "dotenv";
import { UserAccount } from "./userAccountModel.js";

dotenv.config();

class ArchiveAccountModel extends Model {}

const ArchiveAccount = ArchiveAccountModel.init(
  {
    archiveId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: UserAccount,
        key: "userId",
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    middleName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rfid: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
    },
  },
  {
    sequelize: db,
    modelName: "ArchiveAccount",
    tableName: "ArchiveAccounts",
    timestamps: false,
  }
);

export default ArchiveAccount;
