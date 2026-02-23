const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { Server } = require('socket.io');
const http = require('http');
const authRoutes = require('./routes/authRoutes');
const areaRoutes = require('./routes/areaRoutes');
const { getAreas } = require('./controllers/areaController');
const { protect } = require('./middleware/authMiddleware');
const complaintRoutes = require('./routes/complaintRoutes');
const pickupRequestRoutes = require('./routes/pickupRequestRoutes');
const workerRoutes = require('./routes/workerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const problemRoutes = require('./routes/problemRoutes');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.get('/api/areas', protect, getAreas);
app.use('/api', areaRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/pickup-requests', pickupRequestRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/otp', require('./routes/otp.routes'));

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Frontend URL
        methods: ["GET", "POST"]
    }
});

const onlineDrivers = new Map(); // userId -> Set(socketId)
const socketToUserId = new Map(); // socketId -> userId

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinPresence', (userId, role) => {
        if (!onlineDrivers.has(userId)) {
            onlineDrivers.set(userId, new Set());
            // Emit online status for this specific driver
            io.emit('driverStatusChanged', { driverId: userId, status: 'online' });
            console.log(`User ${userId} is now ONLINE`);
        }
        onlineDrivers.get(userId).add(socket.id);
        socketToUserId.set(socket.id, userId);
        socket.join(userId);
        if (role) {
            socket.join(role);
        }

        // Sync initial state
        socket.emit('updatePresence', Array.from(onlineDrivers.keys()));
    });

    socket.on('requestPresenceSync', () => {
        socket.emit('updatePresence', Array.from(onlineDrivers.keys()));
    });

    socket.on('disconnect', () => {
        const userId = socketToUserId.get(socket.id);
        if (userId) {
            const sessions = onlineDrivers.get(userId);
            if (sessions) {
                sessions.delete(socket.id);

                // Use a small delay before declaring offline to handle page refreshes
                setTimeout(() => {
                    const currentSessions = onlineDrivers.get(userId);
                    if (!currentSessions || currentSessions.size === 0) {
                        onlineDrivers.delete(userId);
                        io.emit('driverStatusChanged', { driverId: userId, status: 'offline' });
                        console.log(`User ${userId} is now OFFLINE`);
                    }
                }, 2000); // 2 second grace period
            }
            socketToUserId.delete(socket.id);
        }
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible in routes
app.set('socketio', io);

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT} `);
});
