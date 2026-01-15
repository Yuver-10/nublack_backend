import bcrypt from 'bcryptjs';
import sequelize from './src/config/database.js';
import { Usuario } from './src/models/index.js';

async function debugLogin() {
    try {
        // Conectar DB
        await sequelize.authenticate();
        console.log('✓ Conectado a la base de datos\n');

        // Buscar el admin demo
        const adminEmail = 'admin@demo.local.com';
        const adminPassword = 'admin1234';

        console.log('=== BÚSQUEDA DE USUARIO ===');
        console.log(`Email: ${adminEmail}`);
        
        const user = await Usuario.findOne({ where: { email: adminEmail } });
        
        if (!user) {
            console.log('❌ Usuario NO encontrado en BD');
            
            // Verificar si el documento ya existe
            const existingDoc = await Usuario.findOne({ where: { documento: '0000000000' } });
            if (existingDoc) {
                console.log(`⚠️  Documento '0000000000' ya existe para: ${existingDoc.email}`);
                console.log(`   Usaré un documento único...\n`);
            }
            
            const uniqueDoc = '9999999999';
            console.log('Creando admin demo...');
            
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(adminPassword, salt);
            
            const newUser = await Usuario.create({
                nombre: 'Admin',
                apellido: 'Demo',
                tipo_documento: 'Pasaporte',
                documento: uniqueDoc,
                telefono: '0000000000',
                email: adminEmail,
                password_hash: hash,
                password_salt: salt,
                rol: 'administrador',
                estado: 'activo'
            });
            
            console.log(`✓ Admin creado con ID: ${newUser.id_usuario}`);
            console.log(`✓ Password hash en BD: ${hash}\n`);
            
            // Ahora buscarlo de nuevo
            const createdUser = await Usuario.findOne({ where: { email: adminEmail } });
            debugCompare(createdUser, adminPassword);
            
        } else {
            console.log(`✓ Usuario encontrado: ID ${user.id_usuario}`);
            console.log(`  Nombre: ${user.nombre} ${user.apellido}`);
            console.log(`  Rol: ${user.rol}`);
            console.log(`  Estado: ${user.estado}`);
            console.log(`  Password Hash en BD: ${user.password_hash}\n`);
            
            debugCompare(user, adminPassword);
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
        process.exit(1);
    }
}

async function debugCompare(user, password) {
    console.log('=== COMPARACIÓN DE CONTRASEÑA ===');
    console.log(`Contraseña a probar: "${password}"`);
    console.log(`Contraseña con trim: "${password.trim()}"`);
    console.log(`Hash guardado en BD: ${user.password_hash}\n`);
    
    try {
        // Prueba 1: Comparación directa
        const match1 = await bcrypt.compare(password, user.password_hash);
        console.log(`Prueba 1 - bcrypt.compare(password, hash):`);
        console.log(`  Resultado: ${match1 ? '✓ COINCIDE' : '❌ NO COINCIDE'}\n`);
        
        // Prueba 2: Con trim
        const match2 = await bcrypt.compare(password.trim(), user.password_hash);
        console.log(`Prueba 2 - bcrypt.compare(password.trim(), hash):`);
        console.log(`  Resultado: ${match2 ? '✓ COINCIDE' : '❌ NO COINCIDE'}\n`);
        
        // Prueba 3: Bytes de la contraseña
        const buffer = Buffer.from(password);
        const bufferTrim = Buffer.from(password.trim());
        console.log(`Análisis de bytes:`);
        console.log(`  Sin trim: ${JSON.stringify(buffer.toJSON().data)}`);
        console.log(`  Con trim: ${JSON.stringify(bufferTrim.toJSON().data)}`);
        console.log(`  ¿Tienen espacios? ${password !== password.trim() ? '✓ SÍ' : '✗ NO'}\n`);
        
        if (match1 && match2) {
            console.log('✅ CONTRASEÑA CORRECTA - Todo funciona bien');
        } else {
            console.log('❌ CONTRASEÑA INCORRECTA - Hay un problema');
        }
        
    } catch (error) {
        console.error('❌ Error en comparación:', error.message);
    }
    
    // Cerrar conexión
    await sequelize.close();
}

debugLogin();
