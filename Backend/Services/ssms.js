import { Sequelize } from "sequelize";

const sequelize = new Sequelize("GoFare_TM", "Montenegro", "Monte", {
  dialect: "mssql",
  host: "localhost",
  port: 1433,
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  },
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to the database!");
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testConnection();
