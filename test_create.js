import sequelize from './src/config/database.js';
import { Producto, Categoria, Usuario } from './src/models/index.js';
import bcrypt from 'bcryptjs';

async function testCreate() {
    try {
        await sequelize.authenticate();
        console.log('--- TEST DE INTEGRACIÓN NUBLACK ---');
        console.log('Conexión a DB: OK');

        // Test Login Creds for Admin
        const admin = await Usuario.findOne({ where: { email: 'admin@nublack.com' } });
        if (admin) {
            console.log('Admin Hash en DB:', admin.password_hash);
            const isMatch = await bcrypt.compare('admin123', admin.password_hash);
            console.log('Validación admin@nublack.com / admin123:', isMatch ? 'EXITOSA (✓)' : 'FALLIDA (X)');
        } else {
            console.log('Error: Usuario admin no encontrado.');
        }

        // Test Create Product
        console.log('Intentando crear un producto de prueba...');
        const cat = await Categoria.findOne();
        if (!cat) {
            console.log('Error: No se encontró ninguna categoría en la base de datos.');
            process.exit(1);
        }

        console.log('Usando categoría:', cat.nombre, '(ID:', cat.id_categoria + ')');

        const payload = {
            nombre: "Producto Test Debug Final",
            precio: 150000.00,
            categoria_id: cat.id_categoria,
            descripcion: "Este es un producto generado por el script de diagnóstico final.",
            tallas: JSON.stringify([{ talla: "S", stock: 10 }, { talla: "M", stock: 15 }]), // Many DBs need strings if not handled by sequelize auto-convert
            genero: "Unisex",
            stock: 25,
            estado: 'activo'
        };

        const prod = await Producto.create(payload);
        console.log('CREACIÓN EXITOSA: ID del producto ->', prod.id_producto);

        process.exit(0);
    } catch (error) {
        console.error('--- ERROR CAPTURADO ---');
        console.error('Mensaje:', error.message);
        if (error.errors) {
            console.error('Detalles de Validation:', JSON.stringify(error.errors, null, 2));
        }
        console.error('Stack Trace:', error.stack);
        process.exit(1);
    }
}

testCreate();
