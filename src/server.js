import app from './app.js';
import { validateEnv } from './config/env.js';
// Restart trigger
import sequelize from './config/database.js';
import ensureDemoAdmin from './utils/createDemoAdmin.js';

validateEnv();

const PORT = process.env.PORT || 3001;

// Function to start server
const startServer = async () => {
    try {
        // Authenticate DB
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Ensure demo administrator exists (creates if missing)
        try {
            await ensureDemoAdmin();
        } catch (err) {
            console.error('Failed to ensure demo admin:', err.message || err);
        }

        // Sync models - BE CAREFUL with force: true in production, it drops tables!
        // We rely on the SQL script provided by user for structure, so we might just want to sync/verify
        // Using { alter: false } just to ensure connection essentially, as user provided SQL script.
        // Ideally, we don't sync if the DB is already built by script.

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error.message);
        console.warn('⚠️ Starting server WITHOUT database connection. Fix connection and restart.');
        // Start server anyway so we can access health check endpoints
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} (DATABASE OFFLINE)`);
        });
    }
};

startServer();