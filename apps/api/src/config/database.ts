
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

console.log('Database Configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DATABASE_URL exists:', !!databaseUrl);
console.log('- PGHOST exists:', !!pgHost);
console.log('- Using SSL:', isProduction);

let sequelize: Sequelize;

if (databaseUrl) {
  // Use DATABASE_URL (Railway, Heroku, etc.)
  console.log('Connecting with DATABASE_URL...');
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
} else if (pgHost && pgUser && pgPassword && pgDatabase) {
  // Use Railway's individual Postgres variables
  console.log('Connecting with Railway PGHOST variables...');
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
    dialectOptions: {
      ssl: isProduction ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  });
} else {
  // Fall back to custom environment variables (local development)
  console.log('Connecting with custom env vars...');
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
