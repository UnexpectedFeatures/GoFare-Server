import { DataTypes, Model } from "sequelize";
import db from "../database.js";
import TrainRoute from "./trainRouteModel.js";

class CurrentModel extends Model {}

const Current = CurrentModel.init(
  {
    Current_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Location_Now: {
      type: DataTypes.STRING,
      references: {
        model: TrainRoute,
        key: "TrainRoute_Location",
      },
    },
  },
  {
    sequelize: db,
    modelName: "CurrentModel",
    tableName: "Current_Table",
    timestamps: true,
  }
);

export default Current;
