import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS === "" ? null : process.env.DB_PASS, // Handle empty password correctly
  {
    host: process.env.DB_HOST,
    dialect: "mariadb",
    logging: false,
  }
);

sequelize.authenticate()
  .then(() => console.log("✅ Database connected successfully!"))
  .catch(err => console.error("❌ Database connection error:", err));

export default sequelize;
