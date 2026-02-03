
import sequelize from './config/database.js';

async function fixSchema() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Check columns
        const [results] = await sequelize.query("DESCRIBE solicitudes");
        console.log('Current Columns:', results.map(r => r.Field));

        const fieldsToCheck = ['envio', 'subtotal', 'total'];
        const existingFields = results.map(r => r.Field);

        for (const field of fieldsToCheck) {
            if (!existingFields.includes(field)) {
                console.log(`Adding missing column: ${field}`);
                await sequelize.query(`ALTER TABLE solicitudes ADD COLUMN ${field} DECIMAL(10, 2) DEFAULT 0`);
                console.log(`Added ${field}.`);
            }
        }

        console.log('Schema check complete.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

fixSchema();
