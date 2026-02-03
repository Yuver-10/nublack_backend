import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
    'DB_NAME',
    'DB_USER',
    'DB_PASS',
    'DB_HOST'
];

export const validateEnv = () => {
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missing.length > 0) {
        console.error('❌ ERROR: Faltan variables de entorno críticas:');
        missing.forEach(m => console.error(`   - ${m}`));
        process.exit(1);
    }

    if (!process.env.JWT_SECRET) {
        console.warn('⚠️ WARNING: JWT_SECRET no está configurado. Usando valor por defecto (INSEGURO).');
    }

    console.log('✅ Variables de entorno validadas.');
};

export const config = {
    port: process.env.PORT || 3001,
    db: {
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306
    },
    jwtSecret: process.env.JWT_SECRET,
    isProduction: process.env.NODE_ENV === 'production'
};
