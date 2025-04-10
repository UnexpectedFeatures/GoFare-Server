import { DataTypes, Model } from "sequelize";
import db from "../database.js";
import { UserAccount } from "./userAccountModel.js";
import "../Models/associations.js";
class TransactionModel extends Model {}

const Transaction = TransactionModel.init(
  {
    Transaction_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Transaction_Number: {
      type: DataTypes.STRING,
    },
    User: {
      type: DataTypes.INTEGER,
      references: {
        model: UserAccount,
        key: "userId",
      },
    },
    discount: {
      type: DataTypes.STRING,
    },
    discount_Value: {
      type: DataTypes.STRING,
    },
    total: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize: db,
    modelName: "TransactionModel",
    tableName: "Transaction_Table",
    timestamps: true,
  }
);

export default Transaction;
