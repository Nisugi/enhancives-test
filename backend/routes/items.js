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
        const userId = req.user?.id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        await dbOperation(async (db) => {
            if (db.from) { // Supabase
                // Delete existing items for this user
                await db
                    .from('items')
                    .delete()
                    .eq('user_id', userId);
                
                // Insert new items with user_id and equipment data
                if (items && items.length > 0) {
                    const itemsWithUser = items.map(item => ({
                        ...item,
                        user_id: userId,
                        equipment_data: equipment,
                        synced_at: new Date().toISOString()
                    }));
                    
                    const { error } = await db
                        .from('items')
                        .insert(itemsWithUser);
                    
                    if (error) throw error;
                }
            } else { // Development mode
                // Remove old items for this user
                db.items = db.items.filter(item => item.user_id != userId);
                
                // Add new items
                if (items && items.length > 0) {
                    const itemsWithUser = items.map(item => ({
                        ...item,
                        user_id: userId,
                        equipment_data: equipment,
                        synced_at: new Date().toISOString()
                    }));
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

// Sync items - Load from cloud
router.get('/sync', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id; // Get from auth middleware
        
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        const result = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                const { data, error } = await db
                    .from('items')
                    .select('*')
                    .eq('user_id', userId)
                    .order('synced_at', { ascending: false })
                    .limit(1);
                
                if (error) throw error;
                
                if (data && data.length > 0) {
                    // Get the most recent sync
                    const latestSync = data[0];
                    const equipment = latestSync.equipment_data || {};
                    
                    // Get all items from this sync session
                    const { data: allItems, error: itemsError } = await db
                        .from('items')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('synced_at', latestSync.synced_at);
                    
                    if (itemsError) throw itemsError;
                    
                    // Clean up items to remove backend-specific fields
                    const cleanItems = allItems.map(item => {
                        const { user_id, equipment_data, synced_at, ...cleanItem } = item;
                        return cleanItem;
                    });
                    
                    return { items: cleanItems, equipment };
                }
                return { items: [], equipment: {} };
            } else { // Development mode
                const userItems = db.items.filter(item => item.user_id == userId);
                if (userItems.length > 0) {
                    const equipment = userItems[0].equipment_data || {};
                    const cleanItems = userItems.map(item => {
                        const { user_id, equipment_data, synced_at, ...cleanItem } = item;
                        return cleanItem;
                    });
                    return { items: cleanItems, equipment };
                }
                return { items: [], equipment: {} };
            }
        });
        
        res.json(result);
    } catch (error) {
        console.error('Sync load error:', error);
        res.status(500).json({ error: 'Failed to load from cloud' });
    }
});

module.exports = router;