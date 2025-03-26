import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const Event = sequelize.define("Event", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type:DataTypes.STRING,
        defaultValue: "inactive",
    },
    image: {  // ✅ Ensure this exists
        type: DataTypes.STRING,
        allowNull: true,
    }
});

export default Event;
