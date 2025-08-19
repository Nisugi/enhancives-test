const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

// Import route modules
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const marketplaceRoutes = require('./routes/marketplace');

// Database initialization
const { initDatabase, getDb } = require('./config/database');
initDatabase();

// CORS configuration for production
const corsOptions = {
    origin: [
        'https://nisugi.github.io',
        'http://localhost:3000', // For local testing if needed
        'http://127.0.0.1:5500', // For VS Code Live Server if needed
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' })); // Increase limit for marketplace data

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
    
    const db = getDb();
    if (db.hasSupabase) {
        console.log('✅ Connected to Supabase');
    } else {
        console.log('⚠️ Running without database connection');
    }
});