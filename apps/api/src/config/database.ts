
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Railway provides DATABASE_URL or individual PG* variables
const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

// Railway's native Postgres variables
const pgHost = process.env.PGHOST;
const pgPort = process.env.PGPORT;
const pgUser = process.env.PGUSER;
const pgPassword = process.env.PGPASSWORD;
const pgDatabase = process.env.PGDATABASE;

let sequelize: Sequelize;

const dialectOptions = isProduction ? {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
} : {};

if (databaseUrl) {
  console.log('Using DATABASE_URL for database connection');
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
    dialectOptions
  });
} else if (pgHost && pgUser && pgPassword && pgDatabase) {
  console.log('Using Railway PG* variables for database connection');
  // Use Railway's individual Postgres variables
  sequelize = new Sequelize(pgDatabase, pgUser, pgPassword, {
    host: pgHost,
    port: pgPort ? parseInt(pgPort) : 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions
  });
} else {
  console.log('Using local environment variables for database connection');
  // Fall back to custom environment variables (local development)
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
      },
      dialectOptions
    }
  );
}

export default sequelize;
