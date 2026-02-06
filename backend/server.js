const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const jobRoutes = require('./routes/jobs.routes');
const adminRoutes = require('./routes/admin.routes');
const publicRoutes = require('./routes/public.routes');
const chatRoutes = require('./routes/chat.routes');

dotenv.config({ path: path.join(__dirname, '.env') });


// Conectar a Base de Datos
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumentar límite para imágenes Base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log request size
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        const contentLength = req.headers['content-length'];
        console.log(`[Server] ${req.method} ${req.path} - Content-Length: ${contentLength}`);
    }
    next();
});

// Rutas
app.get('/', (req, res) => {
    res.send('API Profesional Cercano Corriendo...');
});

// Rutas de Autenticación
app.use('/api/auth', authRoutes);

// Rutas de Trabajos (Jobs)
app.use('/api/jobs', jobRoutes);

// Rutas Públicas
app.use('/api', publicRoutes);

// Rutas de Administración
app.use('/api/admin', adminRoutes);

// Rutas de Chat
app.use('/api/chats', chatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});