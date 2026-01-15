import bcrypt from 'bcryptjs';

// Test password hashing and comparison
async function testPassword() {
    console.log('=== PRUEBA DE CONTRASEÑA ===\n');

    const testPasswords = [
        'miContraseña123',
        '123456',
        'test',
        'Password123!',
        '  espacios  '
    ];

    for (const pwd of testPasswords) {
        console.log(`\nProbando: "${pwd}"`);
        
        try {
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(pwd, salt);
            console.log(`✓ Hash generado: ${hash.substring(0, 30)}...`);

            // Compare the original password
            const isMatch = await bcrypt.compare(pwd, hash);
            console.log(`✓ Comparación directa: ${isMatch ? 'COINCIDE' : 'NO COINCIDE'}`);

            // Compare with trimmed password (simulate what validator does)
            const trimmedPwd = pwd.trim();
            const isMatchTrimmed = await bcrypt.compare(trimmedPwd, hash);
            console.log(`✓ Comparación con trim(): ${isMatchTrimmed ? 'COINCIDE' : 'NO COINCIDE'}`);

            // Test wrong password
            const wrongMatch = await bcrypt.compare('wrongPassword', hash);
            console.log(`✓ Contraseña incorrecta: ${wrongMatch ? 'ERROR - Coincide!!' : 'OK - No coincide'}`);

        } catch (error) {
            console.error(`✗ Error: ${error.message}`);
        }
    }

    console.log('\n=== CONCLUSIÓN ===');
    console.log('Si la contraseña de login tiene espacios al inicio/final,');
    console.log('bcrypt.compare() FALLARÁ aunque sea la misma contraseña.');
    console.log('Solución: Agregar .trim() en el validador.');
}

testPassword().catch(console.error);
