import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const createDatabaseIfNotExists = async () => {
  try {
    const tempDb = new Sequelize(
      '', 
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
      }
    );

    await tempDb.authenticate();
    console.log('MySQL connection successful!');

    await tempDb.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database ${process.env.DB_NAME} is ready!`);

    await tempDb.close();
  } catch (error) {
    console.error('Error during database setup:', error);
    throw error;
  }
};

export default createDatabaseIfNotExists;
