import sequelize from './src/config/database.js';
import { Usuario, Producto } from './src/models/index.js';

async function diagnose() {
    try {
        await sequelize.authenticate();
        console.log('--- DIAGNÓSTICO NUBLACK ---');
        console.log('Conexión a DB: OK');

        const userCount = await Usuario.count();
        console.log('Total Usuarios:', userCount);

        const admin = await Usuario.findOne({ where: { rol: 'administrador' } });
        if (admin) {
            console.log('Admin Encontrado:', admin.email);
            console.log('Estado Admin:', admin.estado);
        } else {
            console.log('ADVERTENCIA: No se encontró usuario administrador.');
        }

        const productCount = await Producto.count();
        console.log('Total Productos:', productCount);

        process.exit(0);
    } catch (error) {
        console.error('ERROR EN DIAGNÓSTICO:', error);
        process.exit(1);
    }
}

diagnose();
