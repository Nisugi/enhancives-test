// routes/items.js
const express = require('express');
const router = express.Router();
const { dbOperation } = require('../config/database');

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

module.exports = router;