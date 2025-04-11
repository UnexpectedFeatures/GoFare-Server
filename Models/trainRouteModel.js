import { DataTypes, Model } from "sequelize";
import db from "../database.js";

class TrainRouteModel extends Model {}

const TrainRoute = TrainRouteModel.init(
  {
    TrainRoute_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    TrainRoute_Location: {
      type: DataTypes.STRING,
    },
    Location_price: {
      type: DataTypes.INTEGER,
    },
    Route_Number: {
      type: DataTypes.INTEGER,
    },
    Stop_Number: {
      type: DataTypes.INTEGER,
    },
  },
  {
    sequelize: db,
    modelName: "TrainRouteModel",
    tableName: "TrainRoute_Table",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["TrainRoute_Location"],
      },
    ],
  }
);

export default TrainRoute;
