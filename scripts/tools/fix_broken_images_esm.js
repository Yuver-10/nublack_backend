
import sequelize from './config/database.js';
import { Producto } from './models/index.js'; // Assuming models export Producto
import { Op } from 'sequelize';

async function fixImages() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Find products with long image strings (likely base64 or garbage)
        // MySQL text columns can be long.
        const products = await sequelize.query(
            "SELECT id_producto, nombre, imagen FROM Productos WHERE LENGTH(imagen) > 255 OR imagen LIKE 'data:image%'",
            { type: sequelize.QueryTypes.SELECT }
        );

        console.log(`Found ${products.length} products with invalid/long images.`);

        for (const p of products) {
            console.log(`Fixing Product: ${p.nombre} (ID: ${p.id_producto})`);

            let newImage = '/images/placeholder.png'; // Default

            const name = p.nombre.toLowerCase();
            if (name.includes('jean') || name.includes('pantalon')) {
                newImage = '/images/categories/jeans_placeholder.png'; // Using the one we generated earlier? Or just jeans.png
                // I previously created public/images/categories/jeans.png. 
                // Let's check if we should point to that.
                newImage = '/images/categories/jeans.png';
            } else if (name.includes('falda')) {
                newImage = '/images/categories/faldas.png';
            } else if (name.includes('short')) {
                newImage = '/images/categories/shorts.png';
            } else if (name.includes('leg')) {
                newImage = '/images/categories/leggis.png';
            } else if (name.includes('chaqueta')) {
                newImage = '/images/categories/chaquetas.png';
            } else if (name.includes('sudadera')) {
                newImage = '/images/categories/sudaderas.png';
            }

            // Update raw query to avoid model validation issues potentially
            await sequelize.query(
                "UPDATE Productos SET imagen = :newImage WHERE id_producto = :id",
                {
                    replacements: { newImage, id: p.id_producto }
                }
            );
            console.log(`  -> Set image to: ${newImage}`);
        }

        // Also check for nulls or emptiness
        const emptyProducts = await sequelize.query(
            "SELECT id_producto, nombre FROM Productos WHERE imagen IS NULL OR imagen = ''",
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log(`Found ${emptyProducts.length} products with empty images.`);
        for (const p of emptyProducts) {
            // Apply same logic
            let newImage = '/images/placeholder.png';
            const name = p.nombre.toLowerCase();
            if (name.includes('jean') || name.includes('pantalon')) {
                newImage = '/images/categories/jeans.png';
            } else if (name.includes('falda')) {
                newImage = '/images/categories/faldas.png';
            } else if (name.includes('short')) {
                newImage = '/images/categories/shorts.png';
            } else if (name.includes('leg')) {
                newImage = '/images/categories/leggis.png';
            } else if (name.includes('chaqueta')) {
                newImage = '/images/categories/chaquetas.png';
            } else if (name.includes('sudadera')) {
                newImage = '/images/categories/sudaderas.png';
            }
            await sequelize.query(
                "UPDATE Productos SET imagen = :newImage WHERE id_producto = :id",
                {
                    replacements: { newImage, id: p.id_producto }
                }
            );
            console.log(`  -> Set empty image for ${p.nombre} to: ${newImage}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

fixImages();
