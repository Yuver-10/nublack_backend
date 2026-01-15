import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false, // Set to console.log to see SQL queries
        timezone: '-05:00', // Adjust to your timezone
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        dialectOptions: {
            connectTimeout: 60000,
            enableKeepAlive: true
        },
        define: {
            timestamps: false, // We handle timestamps manually via DB defaults/triggers usually, or let sequelize handle if configured
            underscored: true
        }
    }
);

export default sequelize;
