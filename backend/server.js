const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Import route modules
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const marketplaceRoutes = require('./routes/marketplace');

// Database initialization
const { initDatabase, getDb } = require('./config/database');
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// Catch-all route for SPA - Fixed for Express 5
// This serves index.html for any non-API routes
app.get('/*', (req, res) => {
    // Only serve index.html if the request is not for an API route
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    
    const db = getDb();
    if (!db.hasSupabase) {
        console.log('\n📝 To set up Supabase:');
        console.log('1. Create a .env file in the backend folder');
        console.log('2. Add your Supabase URL and anon key:');
        console.log('   SUPABASE_URL=https://your-project.supabase.co');
        console.log('   SUPABASE_ANON_KEY=your-anon-key');
        console.log('\n🔧 For now, running with in-memory storage (data will be lost on restart)');
    }
});