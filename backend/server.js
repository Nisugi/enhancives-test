const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
let supabase = null;
if (hasSupabase) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase connected');
} else {
    console.log('⚠️  Running in development mode without Supabase');
    console.log('   Create a .env file with SUPABASE_URL and SUPABASE_ANON_KEY for full functionality');
}

// In-memory storage for development mode
let devStorage = {
    users: [],
    items: [],
    marketplaceItems: []
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper function to handle database operations
async function dbOperation(operation) {
    if (hasSupabase) {
        return await operation(supabase);
    } else {
        // Development mode fallback
        return operation(devStorage);
    }
}

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const result = await dbOperation(async (db) => {
            if (hasSupabase) {
                // Supabase operations
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
            } else {
                // Development mode
                const existingUser = db.users.find(u => u.username === username);
                if (existingUser) {
                    throw new Error('Username already exists');
                }

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                
                const newUser = {
                    id: Date.now(),
                    username,
                    password_hash: hashedPassword
                };
                
                db.users.push(newUser);
                return newUser;
            }
        });

        res.json({ 
            success: true, 
            user: { id: result.id, username: result.username }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message || 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const result = await dbOperation(async (db) => {
            if (hasSupabase) {
                // Supabase operations
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
            } else {
                // Development mode
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

        res.json({ 
            success: true, 
            user: { id: result.id, username: result.username }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ error: error.message || 'Login failed' });
    }
});

// Items routes
app.get('/api/items/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const items = await dbOperation(async (db) => {
            if (hasSupabase) {
                const { data, error } = await db
                    .from('items')
                    .select('*')
                    .eq('user_id', userId);

                if (error) throw error;
                return data || [];
            } else {
                return db.items.filter(item => item.user_id == userId);
            }
        });

        res.json(items);
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

app.post('/api/items', async (req, res) => {
    try {
        const itemData = req.body;
        
        const savedItem = await dbOperation(async (db) => {
            if (hasSupabase) {
                const { data, error } = await db
                    .from('items')
                    .insert([itemData])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                const newItem = {
                    ...itemData,
                    id: Date.now(),
                    created_at: new Date().toISOString()
                };
                db.items.push(newItem);
                return newItem;
            }
        });

        res.json(savedItem);
    } catch (error) {
        console.error('Create item error:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

app.put('/api/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const itemData = req.body;
        
        const updatedItem = await dbOperation(async (db) => {
            if (hasSupabase) {
                const { data, error } = await db
                    .from('items')
                    .update(itemData)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                const index = db.items.findIndex(item => item.id == id);
                if (index === -1) {
                    throw new Error('Item not found');
                }
                
                db.items[index] = { ...db.items[index], ...itemData };
                return db.items[index];
            }
        });

        res.json(updatedItem);
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

app.delete('/api/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await dbOperation(async (db) => {
            if (hasSupabase) {
                const { error } = await db
                    .from('items')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            } else {
                const index = db.items.findIndex(item => item.id == id);
                if (index === -1) {
                    throw new Error('Item not found');
                }
                db.items.splice(index, 1);
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Marketplace routes
app.get('/api/marketplace/items', async (req, res) => {
    try {
        const items = await dbOperation(async (db) => {
            if (hasSupabase) {
                const { data, error } = await db
                    .from('marketplace_items')
                    .select(`
                        *,
                        users:user_id (username)
                    `)
                    .eq('available', true);

                if (error) throw error;
                return data || [];
            } else {
                return db.marketplaceItems.filter(item => item.available);
            }
        });

        res.json(items);
    } catch (error) {
        console.error('Get marketplace items error:', error);
        res.status(500).json({ error: 'Failed to fetch marketplace items' });
    }
});

app.post('/api/marketplace/sync', async (req, res) => {
    try {
        const { items } = req.body;
        
        await dbOperation(async (db) => {
            if (hasSupabase) {
                // Clear existing marketplace items for this user
                await db
                    .from('marketplace_items')
                    .delete()
                    .eq('user_id', items[0]?.user_id);

                // Insert new items
                if (items.length > 0) {
                    const { error } = await db
                        .from('marketplace_items')
                        .insert(items);

                    if (error) throw error;
                }
            } else {
                // Development mode
                if (items.length > 0) {
                    // Clear existing items for this user
                    db.marketplaceItems = db.marketplaceItems.filter(
                        item => item.user_id !== items[0].user_id
                    );
                    
                    // Add new items
                    db.marketplaceItems.push(...items);
                }
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Sync marketplace error:', error);
        res.status(500).json({ error: 'Failed to sync marketplace' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    
    if (!hasSupabase) {
        console.log('\n📝 To set up Supabase:');
        console.log('1. Create a .env file in the backend folder');
        console.log('2. Add your Supabase URL and anon key:');
        console.log('   SUPABASE_URL=https://your-project.supabase.co');
        console.log('   SUPABASE_ANON_KEY=your-anon-key');
        console.log('\n🔧 For now, running with in-memory storage (data will be lost on restart)');
    }
});