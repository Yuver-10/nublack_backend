import sequelize from './config/database.js';

async function alter() {
  try {
    await sequelize.authenticate();
    await sequelize.query('ALTER TABLE productos MODIFY imagen TEXT;');
    console.log('✅ Column imagen altered to TEXT');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

alter();