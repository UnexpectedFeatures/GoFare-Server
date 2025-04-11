import { DataTypes, Model } from "sequelize";
import db from "../database.js";
import { UserAccount } from "./userAccountModel.js";

class bannedModel extends Model {}

const Banned = bannedModel.init(
  {
    Banned_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: UserAccount,
        key: "userId",
      },
    },
    Banned_Rfid: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize: db,
    modelName: "bannedModel",
    tableName: "Banned_Table",
    timestamps: true,
  }
);

export default Banned;
