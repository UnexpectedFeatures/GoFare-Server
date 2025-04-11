import { DataTypes, Model } from "sequelize";
import db from "../database.js";
import { UserAccount } from "./userAccountModel.js";
import TrainRoute from "./trainRouteModel.js";
import Transaction from "./transactionModel.js";

class PassengerModel extends Model {}

const Passenger = PassengerModel.init(
  {
    Passenger_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    User: {
      type: DataTypes.INTEGER,
      references: {
        model: UserAccount,
        key: "userId",
      },
    },
    Rfid: {
      type: DataTypes.STRING,
      references: {
        model: UserAccount,
        key: "rfid",
      },
    },
    PickUp: {
      type: DataTypes.STRING,
      references: {
        model: TrainRoute,
        key: "TrainRoute_Location",
      },
    },
    Pick_Up_Amout: {
      type: DataTypes.INTEGER,
    },
    Drop_Off: {
      type: DataTypes.STRING,
      references: {
        model: TrainRoute,
        key: "TrainRoute_Location",
      },
    },
    Drop_Off_Amount: {
      type: DataTypes.INTEGER,
    },
    amount: {
      type: DataTypes.INTEGER,
    },
    transaction_number: {
      type: DataTypes.STRING,
      references: {
        model: Transaction,
        key: "Transaction_Number",
      },
    },
  },
  {
    sequelize: db,
    modelName: "PassengerModel",
    tableName: "Passenger_Table",
    timestamps: true,
  }
);

export default Passenger;
