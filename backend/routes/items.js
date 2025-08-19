// routes/items.js
const express = require('express');
const router = express.Router();
const { dbOperation } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get items for a user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const items = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                const { data, error } = await db
                    .from('items')
                    .select('*')
                    .eq('user_id', userId);

                if (error) throw error;
                return data || [];
            } else { // Development mode
                return db.items.filter(item => item.user_id == userId);
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
                
                // Insert items using existing table structure (same as marketplace)
                if (items && items.length > 0) {
                    const itemsWithUser = items.map(item => ({
                        name: item.name,
                        location: item.location,
                        permanence: item.permanence,
                        notes: item.notes || '',
                        targets: item.targets,
                        username: username,
                        available: false // Personal items, not marketplace items
                    }));
                    
                    const { error } = await db
                        .from('items')
                        .insert(itemsWithUser);
                    
                    if (error) throw error;
                }
                
                // Store equipment data as a special item
                if (equipment && Object.keys(equipment).length > 0) {
                    const { error } = await db
                        .from('items')
                        .insert([{
                            name: '__EQUIPMENT_DATA__',
                            location: 'system',
                            permanence: 'Persists',
                            notes: JSON.stringify(equipment),
                            targets: [],
                            username: username,
                            available: false
                        }]);
                    
                    if (error) throw error;
                }
            } else { // Development mode
                // Remove old personal items for this user
                db.items = db.items.filter(item => item.username != username || item.available === true);
                
                // Add new items
                if (items && items.length > 0) {
                    const itemsWithUser = items.map(item => ({
                        ...item,
                        username: username,
                        available: false
                    }));
                    db.items.push(...itemsWithUser);
                }
                
                // Add equipment data
                if (equipment && Object.keys(equipment).length > 0) {
                    db.items.push({
                        name: '__EQUIPMENT_DATA__',
                        location: 'system',
                        permanence: 'Persists',
                        notes: JSON.stringify(equipment),
                        targets: [],
                        username: username,
                        available: false
                    });
                }
            }
        });
        
        res.json({ success: true, count: items?.length || 0 });
    } catch (error) {
        console.error('Sync save error:', error);
        res.status(500).json({ error: 'Failed to save to cloud' });
    }
});

// Sync items - Load from cloud
router.get('/sync', authenticateToken, async (req, res) => {
    try {
        const username = req.user?.username;
        
        if (!username) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const result = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                // Get all personal items for this user
                const { data: allData, error } = await db
                    .from('items')
                    .select('*')
                    .eq('username', username)
                    .eq('available', false);
                
                if (error) throw error;
                
                if (allData && allData.length > 0) {
                    // Separate equipment data from regular items
                    const equipmentItem = allData.find(item => item.name === '__EQUIPMENT_DATA__');
                    const regularItems = allData.filter(item => item.name !== '__EQUIPMENT_DATA__');
                    
                    // Parse equipment data
                    let equipment = {};
                    if (equipmentItem && equipmentItem.notes) {
                        try {
                            equipment = JSON.parse(equipmentItem.notes);
                        } catch (e) {
                            console.error('Failed to parse equipment data:', e);
                        }
                    }
                    
                    // Clean up items to remove backend-specific fields
                    const cleanItems = regularItems.map(item => {
                        const { username: itemUsername, available, created_at, ...cleanItem } = item;
                        return cleanItem;
                    });
                    
                    return { items: cleanItems, equipment };
                }
                return { items: [], equipment: {} };
            } else { // Development mode
                const userItems = db.items.filter(item => item.username == username && item.available === false);
                
                // Separate equipment data from regular items
                const equipmentItem = userItems.find(item => item.name === '__EQUIPMENT_DATA__');
                const regularItems = userItems.filter(item => item.name !== '__EQUIPMENT_DATA__');
                
                // Parse equipment data
                let equipment = {};
                if (equipmentItem && equipmentItem.notes) {
                    try {
                        equipment = JSON.parse(equipmentItem.notes);
                    } catch (e) {
                        console.error('Failed to parse equipment data:', e);
                    }
                }
                
                // Clean up items
                const cleanItems = regularItems.map(item => {
                    const { username: itemUsername, available, ...cleanItem } = item;
                    return cleanItem;
                });
                
                return { items: cleanItems, equipment };
            }
        });
        
        res.json(result);
    } catch (error) {
        console.error('Sync load error:', error);
        res.status(500).json({ error: 'Failed to load from cloud' });
    }
});

module.exports = router;