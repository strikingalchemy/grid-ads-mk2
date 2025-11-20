
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Railway provides DATABASE_URL, prioritize it for production
const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

let sequelize: Sequelize;

if (databaseUrl) {
  // Use DATABASE_URL (Railway, Heroku, etc.)
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: isProduction ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  // Fall back to individual environment variables (local development)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'gridads',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'password',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

export default sequelize;
