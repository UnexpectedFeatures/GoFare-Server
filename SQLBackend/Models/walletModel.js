import { DataTypes, Model } from "sequelize";
import db from "../database.js";
import { UserAccount } from "./userAccountModel.js";

class WalletModel extends Model {}

const Wallet = WalletModel.init(
  {
    Wallet_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      references: {
        model: UserAccount,
        key: "userId",
      },
    },
    balance: {
      type: DataTypes.STRING,
    },
    currency: {
      type: DataTypes.STRING,
    },
    loanedAmount: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize: db,
    modelName: "WalletModel",
    tableName: "Wallet_Table",
    timestamps: true,
  }
);

export default Wallet;
