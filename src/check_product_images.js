
import { Producto } from './models/index.js';
import sequelize from './config/database.js';

async function checkProductImages() {
    try {
        await sequelize.authenticate();
        const products = await Producto.findAll({
            attributes: ['id_producto', 'nombre', 'imagen', 'imagenes'],
            limit: 5
        });

        console.log('--- Muestra de Productos y sus Imágenes ---');
        products.forEach(p => {
            console.log(`ID: ${p.id_producto}, Nombre: ${p.nombre}`);
            console.log(`   Imagen Principal: ${p.imagen}`);
            console.log(`   Imágenes Array: ${JSON.stringify(p.imagenes)}`);
            console.log('-------------------------------------------');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProductImages();
