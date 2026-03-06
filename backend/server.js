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

// Log request size and time
app.use((req, res, next) => {
    const start = Date.now();
    const { method, path } = req;

    // Log start
    try {
        const fs = require('fs');
        fs.appendFileSync('access.log', `[${new Date().toISOString()}] START ${method} ${path}\n`);
    } catch (e) { }

    res.on('finish', () => {
        const duration = Date.now() - start;
        const size = res.get('Content-Length') || 'unknown';
        const userInfo = req.user ? `[User: ${req.user._id} / ${req.user.email}]` : '[No User]';
        try {
            const fs = require('fs');
            fs.appendFileSync('access.log', `[${new Date().toISOString()}] END ${method} ${path} - Status: ${res.statusCode} (${duration}ms) Size: ${size} bytes ${userInfo}\n`);
        } catch (e) { }
    });
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

const messageRoutes = require('./routes/messages.routes');

// Rutas de Mensajes
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 5000;
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('✅ New client connected to Socket.io:', socket.id);

    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
        console.log(`💬 Socket ${socket.id} joined chat room: ${chatId}`);
    });

    socket.on('join_user_dates', (userId) => {
        if (!userId) return;
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined user room: user_${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('socketio', io);

server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});