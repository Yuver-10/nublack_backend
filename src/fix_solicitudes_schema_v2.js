
import sequelize from './config/database.js';

async function fixSchemaV2() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Get current columns
        const [results] = await sequelize.query("DESCRIBE solicitudes");
        const existingFields = results.map(r => r.Field);
        console.log('Current Columns:', existingFields);

        const columnsToAdd = [
            { name: 'idempotency_key', type: 'VARCHAR(100) UNIQUE' },
            { name: 'tiempo_estimado_entrega', type: 'VARCHAR(100)' },
            { name: 'prioridad', type: "ENUM('baja', 'normal', 'alta', 'urgente') DEFAULT 'normal'" },
            { name: 'notas_internas', type: 'TEXT' }
        ];

        for (const col of columnsToAdd) {
            if (!existingFields.includes(col.name)) {
                console.log(`Adding missing column: ${col.name}`);
                try {
                    await sequelize.query(`ALTER TABLE solicitudes ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`Added ${col.name}.`);
                } catch (e) {
                    console.error(`Failed to add ${col.name}: ${e.message}`);
                    // Continue trying others
                }
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }

        console.log('Schema V2 check complete.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

fixSchemaV2();
