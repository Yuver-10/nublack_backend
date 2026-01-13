import app from './app.js';
// Restart trigger
import sequelize from './config/database.js';

const PORT = process.env.PORT || 3001;

// Function to start server
const startServer = async () => {
    try {
        // Authenticate DB
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Sync models - BE CAREFUL with force: true in production, it drops tables!
        // We rely on the SQL script provided by user for structure, so we might just want to sync/verify
        // Using { alter: false } just to ensure connection essentially, as user provided SQL script.
        // Ideally, we don't sync if the DB is already built by script.

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();