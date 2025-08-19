// routes/items.js
const express = require('express');
const router = express.Router();
const { dbOperation } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Sync items - Load from cloud (MUST be before /:username route)
router.get('/sync', authenticateToken, async (req, res) => {
    console.log('=== SYNC LOAD REQUEST RECEIVED ===');
    console.log('Request headers:', req.headers);
    console.log('User from middleware:', req.user);
    
    try {
        const username = req.user?.username;
        
        console.log('Extracted username:', username);
        
        if (!username) {
            console.log('Authentication failed - no username');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const result = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                // Get all personal items for this user
                console.log('Looking for items for username:', username);
                
                // First, let's see ALL items for this user regardless of available status
                const { data: debugData, error: debugError } = await db
                    .from('items')
                    .select('*')
                    .eq('username', username);
                
                console.log('DEBUG - All items for user:', debugData?.length || 0);
                if (debugData) {
                    debugData.forEach(item => {
                        console.log(`- Item: ${item.name}, available: ${item.available}, slot: ${item.slot}`);
                    });
                }
                
                // Now filter for personal items (available = false)
                const { data: allData, error } = await db
                    .from('items')
                    .select('*')
                    .eq('username', username);
                
                console.log('Found personal items (available=false):', allData?.length || 0);
                
                if (error) throw error;
                
                if (allData && allData.length > 0) {
                    // Reconstruct equipment configuration from slot data
                    const equipment = {};
                    
                    // Clean up items and build equipment structure
                    const cleanItems = allData.map(item => {
                        // If item has slot info, add it to equipment
                        if (item.slot) {
                            const [location, slotIndex] = item.slot.split(':');
                            if (!equipment[location]) {
                                equipment[location] = [];
                            }
                            equipment[location][parseInt(slotIndex)] = item.id;
                        }
                        
                        // Return clean item without backend fields
                        const { username: itemUsername, available, created_at, slot, ...cleanItem } = item;
                        return cleanItem;
                    });
                    
                    console.log('Reconstructed equipment:', equipment);
                    
                    return { items: cleanItems, equipment };
                }
                return { items: [], equipment: {} };
            } else { // Development mode
                const userItems = db.items.filter(item => item.username == username && item.available === false);
                
                // Reconstruct equipment configuration from slot data
                const equipment = {};
                
                // Clean up items and build equipment structure
                const cleanItems = userItems.map(item => {
                    // If item has slot info, add it to equipment
                    if (item.slot) {
                        const [location, slotIndex] = item.slot.split(':');
                        if (!equipment[location]) {
                            equipment[location] = [];
                        }
                        equipment[location][parseInt(slotIndex)] = item.id;
                    }
                    
                    // Return clean item without backend fields
                    const { username: itemUsername, available, slot, ...cleanItem } = item;
                    return cleanItem;
                });
                
                return { items: cleanItems, equipment };
            }
        });
        
        console.log('Final result being sent:', result);
        res.json(result);
    } catch (error) {
        console.error('Sync load error:', error);
        res.status(500).json({ error: 'Failed to load from cloud' });
    }
});

// Get items for a user  
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const items = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                const { data, error } = await db
                    .from('items')
                    .select('*')
                    .eq('username', username);

                if (error) throw error;
                return data || [];
            } else { // Development mode
                return db.items.filter(item => item.username == username);
            }
        });

        res.json(items);
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Create new item
router.post('/', async (req, res) => {
    try {
        const itemData = req.body;
        
        const savedItem = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                const { data, error } = await db
                    .from('items')
                    .insert([itemData])
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else { // Development mode
                const newItem = {
                    ...itemData,
                    id: Date.now(),
                    dateAdded: new Date().toISOString()
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

// Update item
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const itemData = req.body;
        
        const updatedItem = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                const { data, error } = await db
                    .from('items')
                    .update(itemData)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else { // Development mode
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

// Delete item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await dbOperation(async (db) => {
            if (db.from) { // Supabase
                const { error } = await db
                    .from('items')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
            } else { // Development mode
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

// Sync items - Save to cloud
router.post('/sync', authenticateToken, async (req, res) => {
    try {
        const { items, equipment } = req.body;
        const username = req.user?.username;
        
        if (!username) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        await dbOperation(async (db) => {
            if (db.from) { // Supabase
                // Delete existing personal items for this user (not marketplace items)
                await db
                    .from('items')
                    .delete()
                    .eq('username', username)
                    .eq('available', false);
                
                // Insert items with slot information
                if (items && items.length > 0) {
                    const itemsWithUser = items.map(item => {
                        // Find which slot this item is equipped in
                        let slot = null;
                        if (equipment) {
                            for (const [location, slots] of Object.entries(equipment)) {
                                const slotIndex = slots.findIndex(slotItemId => slotItemId === item.id);
                                if (slotIndex !== -1) {
                                    slot = `${location}:${slotIndex}`;
                                    break;
                                }
                            }
                        }
                        
                        return {
                            name: item.name,
                            location: item.location,
                            permanence: item.permanence,
                            notes: item.notes || '',
                            targets: item.targets,
                            slot: slot, // Store equipment slot info here
                            username: username,
                            available: false // Personal items, not marketplace items
                        };
                    });
                    
                    console.log('Storing items with slots:', itemsWithUser.map(i => ({ name: i.name, slot: i.slot })));
                    
                    const { error } = await db
                        .from('items')
                        .insert(itemsWithUser);
                    
                    if (error) throw error;
                }
            } else { // Development mode
                // Remove old personal items for this user
                db.items = db.items.filter(item => item.username != username || item.available === true);
                
                // Add new items with slot info
                if (items && items.length > 0) {
                    const itemsWithUser = items.map(item => {
                        // Find which slot this item is equipped in
                        let slot = null;
                        if (equipment) {
                            for (const [location, slots] of Object.entries(equipment)) {
                                const slotIndex = slots.findIndex(slotItemId => slotItemId === item.id);
                                if (slotIndex !== -1) {
                                    slot = `${location}:${slotIndex}`;
                                    break;
                                }
                            }
                        }
                        
                        return {
                            ...item,
                            slot: slot,
                            username: username,
                            available: false
                        };
                    });
                    db.items.push(...itemsWithUser);
                }
            }
        });
        
        res.json({ success: true, count: items?.length || 0 });
    } catch (error) {
        console.error('Sync save error:', error);
        res.status(500).json({ error: 'Failed to save to cloud' });
    }
});

module.exports = router;
