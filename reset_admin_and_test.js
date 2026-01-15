import bcrypt from 'bcryptjs';
import sequelize from './src/config/database.js';
import { Usuario } from './src/models/index.js';

async function resetAdminAndTest() {
    try {
        await sequelize.authenticate();
        console.log('✓ Conectado a BD\n');

        const adminEmail = 'admin@demo.local.com';
        const adminPassword = 'admin1234';

        // Buscar y eliminar admin existente
        console.log('Buscando admin existente...');
        const existing = await Usuario.findOne({ where: { email: adminEmail } });
        
        if (existing) {
            console.log(`✓ Encontrado: ${existing.email} (ID ${existing.id_usuario})`);
            console.log('  Eliminando...');
            await existing.destroy();
            console.log('  ✓ Eliminado\n');
        } else {
            console.log('✗ No existe\n');
        }

        // Crear admin NUEVO
        console.log('Creando nuevo admin...');
        const salt = await bcrypt.genSalt(10);
        const hashPassword = adminPassword.trim();
        const password_hash = await bcrypt.hash(hashPassword, salt);

        const newAdmin = await Usuario.create({
            nombre: 'Admin',
            apellido: 'Demo',
            tipo_documento: 'Pasaporte',
            documento: '9999999999',
            telefono: '0000000000',
            email: adminEmail,
            password_hash: password_hash,
            password_salt: salt,
            rol: 'administrador',
            estado: 'activo'
        });

        console.log(`✓ Admin creado: ID ${newAdmin.id_usuario}\n`);

        // PRUEBA DE LOGIN
        console.log('=== PRUEBA DE LOGIN ===\n');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: "${adminPassword}"\n`);

        // Simular lo que hace el controlador
        const user = await Usuario.findOne({ where: { email: adminEmail } });
        console.log(`✓ Usuario encontrado en BD`);
        console.log(`  Hash en BD: ${user.password_hash}\n`);

        // Esto es lo que faltaba - TRIM
        let passwordFromRequest = adminPassword;
        passwordFromRequest = passwordFromRequest.trim();

        const isMatch = await bcrypt.compare(passwordFromRequest, user.password_hash);

        console.log(`Comparación bcrypt.compare("${passwordFromRequest}", hash):`);
        console.log(`Resultado: ${isMatch ? '✅ COINCIDE - Login exitoso' : '❌ NO COINCIDE - Error de login'}\n`);

        if (isMatch) {
            console.log('🎉 EL ADMIN ESTÁ FUNCIONANDO CORRECTAMENTE');
        } else {
            console.log('⚠️  Hay un problema aún');
        }

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.errors) {
            error.errors.forEach(err => console.error(`  - ${err.message}`));
        }
        process.exit(1);
    }
}

resetAdminAndTest();
