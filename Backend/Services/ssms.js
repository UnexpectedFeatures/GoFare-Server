import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("..", ".env") });

const sequelize = new Sequelize(
  process.env.MSSQL_SERVER,
  process.env.MSSQL_USER,
  process.env.MSSQL_PASSWORD,
  {
    dialect: "mssql",
    host: "localhost",
    port: process.env.MSSQL_PORT,
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    },
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Connected to the database!");
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

testConnection();
