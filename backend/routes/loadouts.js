// routes/loadouts.js
const express = require('express');
const router = express.Router();
const { dbOperation } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// Get user's loadouts
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('=== GET LOADOUTS REQUEST RECEIVED ===');
        const { username } = req.user;
        console.log('Username:', username);

        const loadouts = await dbOperation(async (db) => {
            if (db.from) {
                // Supabase
                console.log('Using Supabase for loadouts');
                const { data, error } = await db
                    .from('loadouts')
                    .select('*')
                    .eq('username', username)
                    .order('dateAdded', { ascending: false });
                
                if (error) {
                    console.error('Supabase error:', error);
                    throw error;
                }
                
                console.log('Supabase loadouts data:', data);
                return data || [];
            } else {
                // Development mode
                console.log('Using devStorage for loadouts');
                const userLoadouts = db.loadouts.filter(loadout => loadout.username === username);
                console.log('Dev loadouts data:', userLoadouts);
                return userLoadouts;
            }
        });

        console.log('Final loadouts response:', loadouts);
        res.json(loadouts);
    } catch (error) {
        console.error('Error fetching loadouts:', error);
        res.status(500).json({ error: 'Failed to fetch loadouts' });
    }
});

// Save/update a loadout
router.post('/', authMiddleware, async (req, res) => {
    try {
        console.log('=== SAVE LOADOUT REQUEST RECEIVED ===');
        const { username } = req.user;
        const { name, equipment } = req.body;
        
        console.log('Username:', username);
        console.log('Loadout name:', name);
        console.log('Equipment data:', equipment);

        if (!name || !equipment) {
            return res.status(400).json({ error: 'Name and equipment are required' });
        }

        const result = await dbOperation(async (db) => {
            if (db.from) {
                // Supabase
                console.log('Using Supabase for saving loadout');
                
                // Check if loadout already exists
                const { data: existingLoadout } = await db
                    .from('loadouts')
                    .select('id')
                    .eq('username', username)
                    .eq('name', name)
                    .single();

                if (existingLoadout) {
                    // Update existing loadout
                    const { data, error } = await db
                        .from('loadouts')
                        .update({
                            equipment: equipment,
                            dateModified: new Date().toISOString()
                        })
                        .eq('id', existingLoadout.id)
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return data;
                } else {
                    // Create new loadout
                    const { data, error } = await db
                        .from('loadouts')
                        .insert({
                            username,
                            name,
                            equipment,
                            dateAdded: new Date().toISOString(),
                            dateModified: new Date().toISOString()
                        })
                        .select()
                        .single();
                    
                    if (error) throw error;
                    return data;
                }
            } else {
                // Development mode
                console.log('Using devStorage for saving loadout');
                
                // Check if loadout already exists
                const existingIndex = db.loadouts.findIndex(
                    loadout => loadout.username === username && loadout.name === name
                );

                const loadoutData = {
                    username,
                    name,
                    equipment,
                    dateAdded: new Date().toISOString(),
                    dateModified: new Date().toISOString()
                };

                if (existingIndex >= 0) {
                    // Update existing
                    loadoutData.id = db.loadouts[existingIndex].id;
                    loadoutData.dateAdded = db.loadouts[existingIndex].dateAdded;
                    db.loadouts[existingIndex] = loadoutData;
                } else {
                    // Create new
                    loadoutData.id = Date.now();
                    db.loadouts.push(loadoutData);
                }
                
                return loadoutData;
            }
        });

        console.log('Saved loadout result:', result);
        res.json(result);
    } catch (error) {
        console.error('Error saving loadout:', error);
        res.status(500).json({ error: 'Failed to save loadout' });
    }
});

// Delete a loadout
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        console.log('=== DELETE LOADOUT REQUEST RECEIVED ===');
        const { username } = req.user;
        const { id } = req.params;
        
        console.log('Username:', username);
        console.log('Loadout ID:', id);

        const result = await dbOperation(async (db) => {
            if (db.from) {
                // Supabase
                console.log('Using Supabase for deleting loadout');
                const { error } = await db
                    .from('loadouts')
                    .delete()
                    .eq('id', id)
                    .eq('username', username);
                
                if (error) throw error;
                return { success: true };
            } else {
                // Development mode
                console.log('Using devStorage for deleting loadout');
                const index = db.loadouts.findIndex(
                    loadout => loadout.id == id && loadout.username === username
                );
                
                if (index >= 0) {
                    db.loadouts.splice(index, 1);
                    return { success: true };
                } else {
                    throw new Error('Loadout not found');
                }
            }
        });

        console.log('Delete loadout result:', result);
        res.json(result);
    } catch (error) {
        console.error('Error deleting loadout:', error);
        res.status(500).json({ error: 'Failed to delete loadout' });
    }
});

module.exports = router;