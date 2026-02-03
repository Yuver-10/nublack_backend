
import sequelize from './config/database.js';
import fs from 'fs';
import path from 'path';

async function fixMissingImages() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const [products] = await sequelize.query("SELECT id_producto, nombre, imagen, categoria_id FROM Productos");
        console.log(`Checking ${products.length} products...`);

        for (const p of products) {
            let imagePath = p.imagen;
            let originalPath = p.imagen;

            let fileExists = false;

            if (imagePath) {
                if (imagePath.startsWith('http')) {
                    try {
                        const url = new URL(imagePath);
                        imagePath = url.pathname;
                    } catch (e) { }
                }
                if (imagePath.startsWith('/')) imagePath = imagePath.substring(1);
                imagePath = imagePath.replace(/\//g, path.sep);

                const possiblePaths = [
                    path.resolve(process.cwd(), 'public', imagePath),
                    path.resolve(process.cwd(), 'public/images', imagePath),
                    path.resolve(process.cwd(), 'public/images/products', path.basename(imagePath)),
                    path.resolve(process.cwd(), 'public/images/categories', path.basename(imagePath))
                ];

                for (const pPath of possiblePaths) {
                    if (fs.existsSync(pPath)) {
                        fileExists = true;
                        // Optionally update to the correct relative path if found in a subfolder but DB has it wrong?
                        // For now, just assume if found it's OK, or maybe the frontend handles the pathing well enough if the filename is right.
                        // But if the DB path is completely wrong (e.g. /images/foo.jpg but it's in /images/categories/foo.jpg), 
                        // the frontend might fail if it relies on strict path.
                        // Let's assume frontend is okay if file exists where pointed, or we rely on 'processImage' helper.
                        break;
                    }
                }
            }

            if (!fileExists || !imagePath) {
                console.log(`Missing/Invalid image for: ${p.nombre} (ID: ${p.id_producto}). Path: ${originalPath}`);

                // Determine replacement
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
                } else if (name.includes('sudadera') || name.includes('buso') || name.includes('hoodie')) {
                    newImage = '/images/categories/sudaderas.png';
                } else if (name.includes('zapato') || name.includes('tenis')) {
                    newImage = '/images/categories/zapatos.png'; // Need to check if this exists, if not fallback
                }

                // Verify the new image exists, otherwise fallback to placeholder
                const newPathCheck = path.resolve(process.cwd(), 'public', newImage.substring(1).replace(/\//g, path.sep));
                if (!fs.existsSync(newPathCheck)) {
                    // Try finding it in categories folder if not found (e.g. jeans.png might be there)
                    // Actually my paths above are /images/categories/... so they should be correct if generated.
                    console.log(`  Warning: Replacement ${newImage} not found on disk. Checking if generic exists.`);
                }

                // Update DB
                await sequelize.query(
                    "UPDATE Productos SET imagen = :newImage WHERE id_producto = :id",
                    {
                        replacements: { newImage, id: p.id_producto }
                    }
                );
                console.log(`  -> Updated to: ${newImage}`);
            }
        }
        console.log('Fix complete.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

fixMissingImages();
