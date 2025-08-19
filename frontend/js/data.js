// ==================== DATA MODULE ====================
const DataModule = (() => {
    // Private data
    let items = [];
    let equipment = {};
    let nextId = 1;
    
    // Initialize equipment slots from Constants
    const initializeEquipment = () => {
        for (const [location, count] of Object.entries(Constants.wearLocations)) {
            equipment[location] = Array(count).fill(null);
        }
    };

    // Load data from localStorage
    const loadData = () => {
        try {
            const savedItems = localStorage.getItem('enhanciveItems');
            const savedEquipment = localStorage.getItem('enhanciveEquipment');
            
            if (savedItems) {
                items = JSON.parse(savedItems);
                nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
            }
            
            if (savedEquipment) {
                const saved = JSON.parse(savedEquipment);
                // Merge with initialized structure to ensure all slots exist
                for (const [location, slots] of Object.entries(saved)) {
                    if (equipment[location]) {
                        equipment[location] = slots;
                    }
                }
            }
        } catch (error) {
            console.warn('LocalStorage not available or corrupted, using in-memory storage');
            items = [];
            nextId = 1;
            initializeEquipment();
        }
    };
    
    // Save data to localStorage
    const saveData = () => {
        try {
            localStorage.setItem('enhanciveItems', JSON.stringify(items));
            localStorage.setItem('enhanciveEquipment', JSON.stringify(equipment));
        } catch (error) {
            console.warn('Unable to save to localStorage:', error);
        }
    };
    
    // Public API
    return {
        init: () => {
            initializeEquipment();
            loadData();
        },
        
        getItems: () => [...items],
        getItem: (id) => items.find(i => i.id === id),
        getEquipment: () => ({...equipment}),
        getWearLocations: () => ({...Constants.wearLocations}),
        
        addItem: (itemData) => {
            const item = {
                id: nextId++,
                ...itemData,
                dateAdded: new Date().toISOString()
            };
            items.push(item);
            saveData();
            return item;
        },
        
        editItem: (id, updates) => {
            const itemIndex = items.findIndex(i => i.id === id);
            if (itemIndex !== -1) {
                items[itemIndex] = { 
                    ...items[itemIndex], 
                    ...updates,
                    dateModified: new Date().toISOString()
                };
                saveData();
                return items[itemIndex];
            }
            return null;
        },

        deleteItem: (id) => {
            // Remove from items
            items = items.filter(i => i.id !== id);
            
            // Remove from equipment
            for (const location in equipment) {
                equipment[location] = equipment[location].map(slot => 
                    slot === id ? null : slot
                );
            }
            
            saveData();
        },
        
        // Save entire items array (used by copies functionality)
        saveItems: (newItems) => {
            items = newItems;
            saveData();
        },
        
        // Save entire equipment object (used by cloud sync)
        saveEquipment: (newEquipment) => {
            equipment = newEquipment;
            saveData();
        },
        
        equipItem: (itemId, location, slotIndex) => {
            // Ensure equipment is initialized
            if (!equipment[location]) {
                equipment[location] = Array(Constants.wearLocations[location] || 1).fill(null);
            }
            
            // Unequip from any other slot first
            for (const loc in equipment) {
                if (equipment[loc]) {
                    equipment[loc] = equipment[loc].map(slot => 
                        slot === itemId ? null : slot
                    );
                }
            }
            
            // Equip in new slot
            if (itemId && location && slotIndex !== undefined) {
                equipment[location][slotIndex] = itemId;
            }
            
            saveData();
        },
        
        unequipItem: (location, slotIndex) => {
            equipment[location][slotIndex] = null;
            saveData();
        },

        getEquippedItems: () => {
            const equippedIds = new Set();
            for (const slots of Object.values(equipment)) {
                for (const itemId of slots) {
                    if (itemId) {
                        equippedIds.add(itemId);
                    }
                }
            }
            
            return items.filter(item => equippedIds.has(item.id));
        },

        calculateTotalEnhancements: () => {
            const totals = {};
            
            for (const slots of Object.values(equipment)) {
                for (const itemId of slots) {
                    if (itemId) {
                        const item = items.find(i => i.id === itemId);
                        if (item && item.targets) {
                            item.targets.forEach(t => {
                                let amount = t.amount;
                                
                                // For stats: Base = +1 per point, Bonus = +2 per point
                                if (Constants.stats.includes(t.target)) {
                                    if (t.type === 'Base') {
                                        amount = t.amount * 1;
                                    } else if (t.type === 'Bonus') {
                                        amount = t.amount * 2;
                                    }
                                } 
                                // For skills: Both Bonus and Ranks count as +1
                                else if (t.type === 'Ranks' || t.type === 'Bonus') {
                                    amount = t.amount * 1;
                                }
                                
                                totals[t.target] = (totals[t.target] || 0) + amount;
                            });
                        }
                    }
                }
            }
            
            return totals;
        },
        
        exportData: () => {
            const data = { 
                items, 
                equipment, 
                version: "1.0",
                exportDate: new Date().toISOString()
            };
            const dataStr = JSON.stringify(data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const filename = `enhancive_backup_${new Date().toISOString().split('T')[0]}.json`;
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', filename);
            link.click();
            
            UI.showNotification('Data exported successfully!');
        },
        
        importData: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = event => {
                    try {
                        const data = JSON.parse(event.target.result);
                        const importedItems = data.items || [];
                        
                        // Create a function to generate a unique key for deduplication
                        const createItemKey = (item) => {
                            const targetKey = item.targets ? 
                                item.targets.map(t => `${t.target}:${t.type}:${t.amount}`).sort().join('|') : 
                                '';
                            return `${item.name}::${targetKey}`;
                        };
                        
                        // Create a map of existing items for deduplication
                        const existingItemsMap = new Map();
                        items.forEach(item => {
                            existingItemsMap.set(createItemKey(item), item);
                        });
                        
                        // Merge imported items, deduplicating based on name + targets
                        let addedCount = 0;
                        let duplicateCount = 0;
                        
                        importedItems.forEach(importedItem => {
                            const itemKey = createItemKey(importedItem);
                            
                            if (!existingItemsMap.has(itemKey)) {
                                // New item - add it with a new ID
                                const newItem = {
                                    ...importedItem,
                                    id: nextId++,
                                    dateAdded: importedItem.dateAdded || new Date().toISOString()
                                };
                                items.push(newItem);
                                existingItemsMap.set(itemKey, newItem);
                                addedCount++;
                            } else {
                                duplicateCount++;
                            }
                        });
                        
                        // Update nextId to be safe
                        nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
                        
                        // Import equipment, merging with current structure
                        if (data.equipment) {
                            initializeEquipment(); // Reset first
                            for (const [location, slots] of Object.entries(data.equipment)) {
                                if (equipment[location]) {
                                    equipment[location] = slots;
                                }
                            }
                        }
                        
                        saveData();
                        
                        // Refresh all displays
                        ItemsModule.refresh();
                        EquipmentModule.refresh();
                        if (typeof StatsModule !== 'undefined') StatsModule.updateStats();
                        TotalsModule.refresh();
                        
                        // Show detailed import results
                        let message = `Import completed! Added ${addedCount} new items`;
                        if (duplicateCount > 0) {
                            message += `, skipped ${duplicateCount} duplicates`;
                        }
                        UI.showNotification(message, 'success');
                    } catch (error) {
                        UI.showNotification('Error importing data', 'error');
                        console.error('Import error:', error);
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        },

        clearAllData: () => {
            if (confirm('⚠️ WARNING: This will delete ALL your items and equipment data. This cannot be undone!\n\nAre you sure you want to continue?')) {
                if (confirm('This is your last chance! All data will be permanently deleted. Continue?')) {
                    items = [];
                    nextId = 1;
                    initializeEquipment();
                    saveData();
                    
                    // Refresh all displays
                    if (typeof ItemsModule !== 'undefined' && ItemsModule.refresh) ItemsModule.refresh();
                    if (typeof EquipmentModule !== 'undefined' && EquipmentModule.refresh) EquipmentModule.refresh();
                    if (typeof StatsModule !== 'undefined' && StatsModule.updateStats) StatsModule.updateStats();
                    if (typeof TotalsModule !== 'undefined' && TotalsModule.refresh) TotalsModule.refresh();
                    
                    UI.showNotification('All data cleared');
                }
            }
        }
    };
})();

// Legacy compatibility - expose DataModule as DataManager
const DataManager = DataModule;