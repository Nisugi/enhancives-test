// routes/marketplace.js
const express = require('express');
const router = express.Router();
const { dbOperation } = require('../config/database');

// Get marketplace items
router.get('/items', async (req, res) => {
    try {
        const items = await dbOperation(async (db) => {
            if (db.from) { // Supabase
                const { data, error } = await db
                    .from('marketplace_items')
                    .select(`
                        *,
                        users:username (username)
                    `)
                    .eq('available', true);

                if (error) throw error;
                return data || [];
            } else { // Development mode
                return db.marketplaceItems.filter(item => item.available);
            }
        });

        res.json(items);
    } catch (error) {
        console.error('Get marketplace items error:', error);
        res.status(500).json({ error: 'Failed to fetch marketplace items' });
    }
});

// Sync marketplace items
router.post('/sync', async (req, res) => {
    try {
        const { items } = req.body;
        
        await dbOperation(async (db) => {
            if (db.from) { // Supabase
                // Clear existing marketplace items for this user
                if (items.length > 0) {
                    await db
                        .from('marketplace_items')
                        .delete()
                        .eq('username', items[0]?.username);

                    // Insert new items
                    const { error } = await db
                        .from('marketplace_items')
                        .insert(items);

                    if (error) throw error;
                }
            } else { // Development mode
                if (items.length > 0) {
                    // Clear existing items for this user
                    db.marketplaceItems = db.marketplaceItems.filter(
                        item => item.username !== items[0].username
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

module.exports = router;