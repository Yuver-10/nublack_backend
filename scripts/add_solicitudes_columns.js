import sequelize from '../src/config/database.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos.');

    const [envResult] = await sequelize.query("SHOW COLUMNS FROM solicitudes LIKE 'envio';");
    if (!envResult || envResult.length === 0) {
      await sequelize.query("ALTER TABLE solicitudes ADD COLUMN envio DECIMAL(10,2) DEFAULT 0;");
      console.log('✅ Columna envio añadida.');
    } else {
      console.log('ℹ️ Columna envio ya existe.');
    }

    const [idempRes] = await sequelize.query("SHOW COLUMNS FROM solicitudes LIKE 'idempotency_key';");
    if (!idempRes || idempRes.length === 0) {
      await sequelize.query("ALTER TABLE solicitudes ADD COLUMN idempotency_key VARCHAR(100) NULL;");
      console.log('✅ Columna idempotency_key añadida.');
    } else {
      console.log('ℹ️ Columna idempotency_key ya existe.');
    }

    // Try to create a unique index for idempotency_key (ignore if already exists)
    try {
      await sequelize.query("CREATE UNIQUE INDEX idx_solicitudes_idempotency ON solicitudes (idempotency_key);");
      console.log('✅ Índice único idempotency_key creado.');
    } catch (e) {
      console.log('⚠️ Índice único idempotency_key posiblemente ya existe o no pudo crearse:', e.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error al actualizar esquema:', error.message);
    process.exit(1);
  }
}

run();
