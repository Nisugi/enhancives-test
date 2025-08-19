// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { dbOperation } = require('../config/database');

// Register route
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const result = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                const { data: existingUser } = await db
                    .from('users')
                    .select('id')
                    .eq('username', username)
                    .single();

                if (existingUser) {
                    throw new Error('Username already exists');
                }

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                const { data, error } = await db
                    .from('users')
                    .insert([{ username, password_hash: hashedPassword }])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else { // Development mode
                const existingUser = db.users.find(u => u.username === username);
                if (existingUser) {
                    throw new Error('Username already exists');
                }

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                const newUser = {
                    id: Date.now(),
                    username,
                    password_hash: hashedPassword,
                    dateAdded: new Date().toISOString()
                };

                db.users.push(newUser);
                return newUser;
            }
        });

        // Generate a simple token containing user ID
        const token = Buffer.from(JSON.stringify({ userId: result.id })).toString('base64');
        
        res.json({ 
            success: true, 
            user: { id: result.id, username: result.username },
            token: token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message || 'Registration failed' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const result = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                const { data: user, error } = await db
                    .from('users')
                    .select('*')
                    .eq('username', username)
                    .single();

                if (error || !user) {
                    throw new Error('Invalid credentials');
                }

                const passwordMatch = await bcrypt.compare(password, user.password_hash);
                if (!passwordMatch) {
                    throw new Error('Invalid credentials');
                }

                return user;
            } else { // Development mode
                const user = db.users.find(u => u.username === username);
                if (!user) {
                    throw new Error('Invalid credentials');
                }

                const passwordMatch = await bcrypt.compare(password, user.password_hash);
                if (!passwordMatch) {
                    throw new Error('Invalid credentials');
                }

                return user;
            }
        });

        // Generate a simple token containing user ID
        const token = Buffer.from(JSON.stringify({ userId: result.id })).toString('base64');
        
        res.json({ 
            success: true, 
            user: { id: result.id, username: result.username },
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message || 'Login failed' });
    }
});

module.exports = router;