
import sequelize from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkImages() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Query for Pantalon products
        const [products] = await sequelize.query("SELECT id_producto, nombre, imagen FROM Productos WHERE nombre LIKE '%Pantalon%' OR nombre LIKE '%Short%' OR nombre LIKE '%Falda%'");

        console.log(`Found ${products.length} products.`);

        for (const p of products) {
            console.log(`\nProduct: ${p.nombre} (ID: ${p.id_producto})`);
            console.log(`  Imagen (DB): ${p.imagen}`);

            let imagePath = p.imagen;
            if (imagePath) {
                if (imagePath.startsWith('http')) {
                    // If it's a full URL, strip the domain to find local file
                    try {
                        const url = new URL(imagePath);
                        // url.pathname will be /images/products/foo.jpg or similar
                        imagePath = url.pathname;
                    } catch (e) {
                        console.log('  [WARN] Invalid URL format');
                    }
                }

                // Remove leading slash if present for path.join
                if (imagePath.startsWith('/')) imagePath = imagePath.substring(1);

                // Paths to check
                const possiblePaths = [
                    path.resolve(process.cwd(), 'public', imagePath),
                    path.resolve(process.cwd(), 'public/images', imagePath),
                    path.resolve(process.cwd(), 'public/images/products', path.basename(imagePath)),
                    path.resolve(process.cwd(), 'public/images/categories', path.basename(imagePath))
                ];

                let found = false;
                for (const pPath of possiblePaths) {
                    if (fs.existsSync(pPath)) {
                        console.log(`  [OK] File exists at: ${pPath}`);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    console.log(`  [MISSING] File NOT found.`);
                    possiblePaths.forEach(pp => console.log(`    checked: ${pp}`));
                }
            } else {
                console.log('  [NULL] No image set.');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // await sequelize.close(); // closing might hang if pool is active, but process.exit handles it
        process.exit(0);
    }
}

checkImages();
