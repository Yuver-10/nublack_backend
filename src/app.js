import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import userRoutes from './routes/userRoutes.js';
import configRoutes from './routes/configRoutes.js';
import { securityLogger, logUnauthorizedAccess } from './middleware/securityLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Global Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toLocaleTimeString();

    // Log when request arrives
    console.log(`[${timestamp}] Incoming: ${req.method} ${req.url}`);

    // Log when response is sent
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${timestamp}] Finished: ${req.method} ${req.url} - Status: ${res.statusCode} (${duration}ms)`);
    });

    next();
});

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false // Permite cargar recursos (imágenes) desde otros orígenes
}));

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : [
            'https://nublack12.com',
            'https://www.nublack12.com'
        ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Security Logging
app.use(securityLogger);
app.use(logUnauthorizedAccess);

// Serve Static Files (Images)
// Assuming images are stored in a 'public' folder at the root of server
app.use('/images', express.static(path.join(process.cwd(), 'public/images')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/configs', configRoutes);

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    const isProduction = process.env.NODE_ENV === 'production';

    console.error('--- ERROR DETECTADO ---');
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (!isProduction) {
        console.error('Body:', JSON.stringify(req.body, null, 2));
        console.error('Stack:', err.stack);
    } else {
        console.error('Message:', err.message);
    }
    console.error('-----------------------');

    res.status(err.status || 500).json({
        success: false,
        message: isProduction ? 'Error interno del servidor' : err.message,
        ...(isProduction ? {} : { stack: err.stack, details: err.errors })
    });
});

export default app;
