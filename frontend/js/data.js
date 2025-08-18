// Data management for GitHub Pages version (localStorage only)
const DataManager = {
    items: [],
    equipment: {},
    currentUser: null,
    nextId: 1,
    
    // Initialize data manager
    init() {
        this.initializeEquipmentSlots();
        this.loadFromStorage();
        console.log('Data manager initialized');
    },

    // Initialize equipment with proper slot structure
    initializeEquipmentSlots() {
        for (const [location, count] of Object.entries(wearLocations)) {
            this.equipment[location] = Array(count).fill(null);
        }
    },

    // Load data from local storage
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem('enhanciveTrackerData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.items = data.items || [];
                // Set nextId based on existing items
                if (this.items.length > 0) {
                    this.nextId = Math.max(...this.items.map(i => i.id)) + 1;
                }
                // Merge saved equipment with initialized structure
                if (data.equipment) {
                    for (const [location, slots] of Object.entries(data.equipment)) {
                        if (this.equipment[location]) {
                            this.equipment[location] = slots;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.items = [];
            this.nextId = 1;
            this.initializeEquipmentSlots();
        }
    },
    
    // Save data to localStorage
    saveToStorage() {
        try {
            const data = {
                items: this.items,
                equipment: this.equipment,
                version: '2.0'
            };
            localStorage.setItem('enhanciveTrackerData', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    },
    
    // Add new item
    addItem(itemData) {
        const item = {
            id: this.nextId++,
            ...itemData,
            dateAdded: new Date().toISOString()
        };
        this.items.push(item);
        this.saveToStorage();
        return item;
    },
    
    // Edit existing item
    editItem(id, updates) {
        const itemIndex = this.items.findIndex(i => i.id === parseInt(id));
        if (itemIndex !== -1) {
            this.items[itemIndex] = { 
                ...this.items[itemIndex], 
                ...updates,
                dateModified: new Date().toISOString()
            };
            this.saveToStorage();
            return this.items[itemIndex];
        }
        return null;
    },
    
    // Delete item
    deleteItem(id) {
        const itemId = parseInt(id);
        // Remove from items array
        this.items = this.items.filter(i => i.id !== itemId);
        
        // Remove from all equipment slots
        for (const location in this.equipment) {
            this.equipment[location] = this.equipment[location].map(slot => 
                slot === itemId ? null : slot
            );
        }
        
        this.saveToStorage();
        return true;
    },
    
    // Update equipment slots based on worn items
    updateEquipmentFromItems() {
        // Reset all slots
        EQUIPMENT_SLOTS.forEach(slot => {
            this.equipment[slot] = null;
        });
        
        // Fill slots with worn items
        this.items.filter(item => item.location === 'Worn').forEach(item => {
            if (item.slot && EQUIPMENT_SLOTS.includes(item.slot)) {
                this.equipment[item.slot] = item;
            }
        });
        
        this.saveToStorage();
    },
    
    // Get equipped items
    getEquippedItems() {
        const equippedIds = new Set();
        for (const slots of Object.values(this.equipment)) {
            for (const itemId of slots) {
                if (itemId) {
                    equippedIds.add(itemId);
                }
            }
        }
        
        return this.items.filter(item => equippedIds.has(item.id));
    },
    
    // Calculate total enhancements
    calculateTotalEnhancements() {
        const totals = {};
        
        for (const slots of Object.values(this.equipment)) {
            for (const itemId of slots) {
                if (itemId) {
                    const item = this.items.find(i => i.id === itemId);
                    if (item && item.targets) {
                        item.targets.forEach(t => {
                            let amount = t.amount;
                            
                            // For stats: Base = +1 per point, Bonus = +2 per point
                            if (stats.includes(t.target)) {
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
    
    // Export data to JSON file
    exportData() {
        const data = {
            items: this.items,
            equipment: this.equipment,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhancive-tracker-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        UI.showNotification('Data exported successfully', 'success');
    },
    
    // Handle file import
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Validate data structure
                    if (!data.items || !Array.isArray(data.items)) {
                        throw new Error('Invalid data format');
                    }
                    
                    // Import the data
                    this.items = data.items;
                    
                    // Update nextId
                    if (this.items.length > 0) {
                        this.nextId = Math.max(...this.items.map(i => i.id)) + 1;
                    } else {
                        this.nextId = 1;
                    }
                    
                    // Import equipment
                    if (data.equipment) {
                        // Reset equipment first
                        this.initializeEquipmentSlots();
                        // Then apply imported data
                        for (const [location, slots] of Object.entries(data.equipment)) {
                            if (this.equipment[location]) {
                                this.equipment[location] = slots;
                            }
                        }
                    }
                    
                    this.saveToStorage();
                    
                    // Refresh all displays
                    if (ItemsModule.refresh) ItemsModule.refresh();
                    if (EquipmentModule.refresh) EquipmentModule.refresh();
                    if (App.updateStatistics) App.updateStatistics();
                    if (TotalsModule.refresh) TotalsModule.refresh();
                    
                    UI.showNotification('Data imported successfully', 'success');
                } catch (error) {
                    console.error('Import failed:', error);
                    UI.showNotification('Failed to import data: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    },
    
    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
            this.items = [];
            this.nextId = 1;
            this.initializeEquipmentSlots();
            this.saveToStorage();
            
            if (ItemsModule.refresh) ItemsModule.refresh();
            if (EquipmentModule.refresh) EquipmentModule.refresh();
            if (App.updateStatistics) App.updateStatistics();
            
            UI.showNotification('All data cleared', 'info');
        }
    }
};