import { Usuario } from './models/index.js';
import bcrypt from 'bcryptjs';
import sequelize from './config/database.js';

async function resetAdminPassword() {
    try {
        await sequelize.authenticate();
        console.log('Conexión a BD exitosa.');

        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const [updatedRows] = await Usuario.update(
            { password_hash: hashedPassword },
            { where: { email: 'admin@nublack.com' } }
        );

        if (updatedRows > 0) {
            console.log(`✅ Contraseña actualizada correctamente para admin@nublack.com`);
            console.log(`Nueva contraseña: ${newPassword}`);
        } else {
            console.error('❌ No se encontró el usuario admin@nublack.com');
            // Intentar crear si no existe (opcional, pero seguro)
            // Por ahora asumimos que existe por el dump
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error al resetear contraseña:', error);
        process.exit(1);
    }
}

resetAdminPassword();
