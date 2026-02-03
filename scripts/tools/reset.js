import { Usuario } from './models/index.js';
import bcrypt from 'bcryptjs';
import sequelize from './config/database.js';

async function reset() {
    try {
        await sequelize.authenticate();
        const hash = await bcrypt.hash('admin123', 10);

        await Usuario.update(
            { password_hash: hash },
            { where: { email: 'admin@nublack.com' } }
        );

        console.log('✅ Hash actualizado correctamente para admin@nublack.com');
        console.log('Nueva contraseña: admin123');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

reset();
