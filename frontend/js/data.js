// Data management for GitHub Pages version (localStorage only)
const DataManager = {
    items: [],
    equipment: {},
    
    // Initialize data from localStorage
    init() {
        this.loadFromStorage();
        this.initializeEquipmentSlots();
    },
    
    // Load data from localStorage
    loadFromStorage() {
        const savedData = localStorage.getItem('enhanciveTrackerData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.items = data.items || [];
                this.equipment = data.equipment || {};
            } catch (error) {
                console.error('Failed to load saved data:', error);
                this.items = [];
                this.equipment = {};
            }
        }
    },
    
    // Save data to localStorage
    saveToStorage() {
        const data = {
            items: this.items,
            equipment: this.equipment,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('enhanciveTrackerData', JSON.stringify(data));
    },
    
    // Initialize equipment slots
    initializeEquipmentSlots() {
        EQUIPMENT_SLOTS.forEach(slot => {
            if (!this.equipment[slot]) {
                this.equipment[slot] = null;
            }
        });
    },
    
    // Add new item
    addItem(item) {
        const newItem = {
            ...item,
            id: Date.now() + Math.random(), // Generate unique ID
            created_at: new Date().toISOString()
        };
        this.items.push(newItem);
        this.saveToStorage();
        this.updateEquipmentFromItems();
        return newItem;
    },
    
    // Update item
    updateItem(itemId, updates) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index >= 0) {
            this.items[index] = { ...this.items[index], ...updates };
            this.saveToStorage();
            this.updateEquipmentFromItems();
            return this.items[index];
        }
        return null;
    },
    
    // Delete item
    deleteItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index >= 0) {
            this.items.splice(index, 1);
            this.saveToStorage();
            this.updateEquipmentFromItems();
            return true;
        }
        return false;
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
        return Object.values(this.equipment).filter(item => item !== null);
    },
    
    // Calculate total enhancements
    calculateTotalEnhancements() {
        const totals = {};
        
        this.getEquippedItems().forEach(item => {
            if (item.enhancives && Array.isArray(item.enhancives)) {
                item.enhancives.forEach(enh => {
                    if (enh.target && enh.amount) {
                        if (!totals[enh.target]) {
                            totals[enh.target] = 0;
                        }
                        totals[enh.target] += parseInt(enh.amount) || 0;
                    }
                });
            }
        });
        
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
    
    // Import data from file
    importData() {
        document.getElementById('importFile').click();
    },
    
    // Handle file import
    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!data.items || !Array.isArray(data.items)) {
                    throw new Error('Invalid data format');
                }
                
                // Import the data
                this.items = data.items;
                this.equipment = data.equipment || {};
                this.saveToStorage();
                
                // Refresh the UI
                App.refreshAll();
                UI.showNotification('Data imported successfully', 'success');
            } catch (error) {
                console.error('Import failed:', error);
                UI.showNotification('Failed to import data: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Clear the input
    },
    
    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
            this.items = [];
            this.equipment = {};
            this.initializeEquipmentSlots();
            this.saveToStorage();
            App.refreshAll();
            UI.showNotification('All data cleared', 'info');
        }
    }
};