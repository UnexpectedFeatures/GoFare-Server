import { DataTypes, Model } from "sequelize";
import db from "../database.js";
import { UserAccount } from "./adminAccountModel.js";

class bannedModel extends Model { }

const Banned = bannedModel.init(
    {
        Banned_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        admin_id: {
            type: DataTypes.INTEGER,
            references: {
                model: UserAccount,
                key: "adminId",
            },
        },
        Banned_Rfid: {
            type: DataTypes.STRING,
        },
    },
    {
        sequelize: db,
        modelName: "bannedAdminModel",
        tableName: "Banned_Admin_Table",
        timestamps: true,
    }
);

export default Banned;
