import bcrypt from 'bcryptjs';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Cargar variables de entorno del archivo .env si existe
dotenv.config();

/**
 * Script para crear admin demo en BD remota
 * Usa las variables de entorno: DB_HOST, DB_USER, DB_PASS, DB_NAME
 */

async function createAdminInRemoteBD() {
    console.log('=== CREAR ADMIN EN BD REMOTA ===\n');

    // Conectar con variables de entorno (desde Render)
    const sequelize = new Sequelize(
        process.env.DB_NAME || 'nublack',
        process.env.DB_USER || 'root',
        process.env.DB_PASS || '',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            dialect: 'mysql',
            logging: false,
            timezone: '-05:00'
        }
    );

    try {
        await sequelize.authenticate();
        console.log('✓ Conectado a BD');
        console.log(`  Host: ${process.env.DB_HOST}`);
        console.log(`  Base: ${process.env.DB_NAME}\n`);

        // Definir modelo de Usuario correctamente
        const Usuario = sequelize.define('Usuario', {
            id_usuario: {
                type: sequelize.Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            nombre: sequelize.Sequelize.STRING,
            apellido: sequelize.Sequelize.STRING,
            email: sequelize.Sequelize.STRING,
            password_hash: sequelize.Sequelize.STRING,
            password_salt: sequelize.Sequelize.STRING,
            rol: sequelize.Sequelize.STRING,
            estado: sequelize.Sequelize.STRING,
            tipo_documento: sequelize.Sequelize.STRING,
            documento: sequelize.Sequelize.STRING,
            telefono: sequelize.Sequelize.STRING
        }, {
            tableName: 'usuarios',
            timestamps: false
        });

        const adminEmail = 'admin@demo.local.com';
        const adminPassword = 'admin1234';

        // Verificar si existe
        const existing = await Usuario.findOne({ where: { email: adminEmail } });

        if (existing) {
            console.log(`⚠️  Admin ya existe: ${adminEmail}`);
            console.log(`    ID: ${existing.id_usuario}`);
            console.log(`    Estado: ${existing.estado}`);
            console.log(`    Rol: ${existing.rol}`);
            console.log(`    Tiene password_hash: ${!!existing.password_hash}\n`);

            if (!existing.password_hash) {
                console.log('⚠️  PROBLEMA: No tiene password_hash!');
                console.log('Actualizando password...\n');

                const salt = await bcrypt.genSalt(10);
                const password_hash = await bcrypt.hash(adminPassword.trim(), salt);

                existing.password_hash = password_hash;
                existing.password_salt = salt;
                await existing.save();

                console.log('✓ Password actualizado\n');
            }
        } else {
            console.log(`Creando nuevo admin: ${adminEmail}\n`);

            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(adminPassword.trim(), salt);

            const newAdmin = await Usuario.create({
                nombre: 'Admin',
                apellido: 'Demo',
                tipo_documento: 'Pasaporte',
                documento: '9999999999',
                telefono: '0000000000',
                email: adminEmail,
                password_hash,
                password_salt: salt,
                rol: 'administrador',
                estado: 'activo'
            });

            console.log(`✓ Admin creado exitosamente`);
            console.log(`  ID: ${newAdmin.id_usuario}`);
            console.log(`  Email: ${newAdmin.email}\n`);
        }

        // Verificación final
        const finalUser = await Usuario.findOne({ where: { email: adminEmail } });
        console.log('=== VERIFICACIÓN FINAL ===');
        console.log(`Email: ${finalUser.email}`);
        console.log(`Rol: ${finalUser.rol}`);
        console.log(`Estado: ${finalUser.estado}`);
        console.log(`Tiene password_hash: ${!!finalUser.password_hash}`);
        console.log(`Hash (primeros 30 chars): ${finalUser.password_hash.substring(0, 30)}...\n`);

        // Test de comparación
        const isMatch = await bcrypt.compare(adminPassword.trim(), finalUser.password_hash);
        console.log(`Prueba bcrypt.compare("${adminPassword}", hash):`);
        console.log(`Resultado: ${isMatch ? '✅ COINCIDE' : '❌ NO COINCIDE'}\n`);

        if (isMatch) {
            console.log('🎉 ADMIN FUNCIONA CORRECTAMENTE - Puedes hacer login ahora');
        }

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nDetalles:', error);
        if (error.errors) {
            error.errors.forEach(err => console.error(`  - ${err.message}`));
        }
        process.exit(1);
    }
}

createAdminInRemoteBD();
