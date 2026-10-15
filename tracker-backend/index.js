const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('This origin is not allowed by CORS.'));
    },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectDB = require('./connection/connectionDB');

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/income', require('./routes/incomeRoutes'));
app.use('/api/expense', require('./routes/expenseRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

const PORT = process.env.PORT || 5000;
app.get('/api/health', (_req, res) => res.status(200).json({ success: true, status: 'ok' }));

async function start() {
    if (!(process.env.SEC_KEY || process.env.JWT_SECRET)) {
        throw new Error('Set SEC_KEY (or JWT_SECRET) in tracker-backend/.env before starting the API.');
    }
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

start().catch((error) => {
    console.error('Backend startup failed:', error.message);
    process.exitCode = 1;
});