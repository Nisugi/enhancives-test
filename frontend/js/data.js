// Data management module
const DataManager = {
    currentUser: null,
    items: [],
    equipment: {},
    
    // Initialize data
    init() {
        this.loadUser();
        this.initializeEquipmentSlots();
    },
    
    // User management
    loadUser() {
        const userData = localStorage.getItem(CONFIG.USER_KEY);
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    },
    
    saveUser(user) {
        this.currentUser = user;
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    },
    
    clearUser() {
        this.currentUser = null;
        localStorage.removeItem(CONFIG.USER_KEY);
    },
    
    // Initialize equipment slots
    initializeEquipmentSlots() {
        EQUIPMENT_SLOTS.forEach(slot => {
            if (!this.equipment[slot]) {
                this.equipment[slot] = null;
            }
        });
    },
    
    // API calls
    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    // Load items from server
    async loadItems() {
        if (!this.currentUser) return;
        
        try {
            this.items = await this.makeRequest(`/items/${this.currentUser.id}`);
            this.updateEquipmentFromItems();
            return this.items;
        } catch (error) {
            console.error('Failed to load items:', error);
            UI.showNotification('Failed to load items', 'error');
            return [];
        }
    },
    
    // Save item to server
    async saveItem(item) {
        if (!this.currentUser) return null;
        
        try {
            const itemData = {
                ...item,
                user_id: this.currentUser.id
            };
            
            let savedItem;
            if (item.id && item.id.toString().length > 10) {
                // Update existing item
                savedItem = await this.makeRequest(`/items/${item.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(itemData)
                });
            } else {
                // Create new item
                delete itemData.id; // Remove client-side ID
                savedItem = await this.makeRequest('/items', {
                    method: 'POST',
                    body: JSON.stringify(itemData)
                });
            }
            
            // Update local items array
            const index = this.items.findIndex(i => i.id === item.id);
            if (index >= 0) {
                this.items[index] = savedItem;
            } else {
                this.items.push(savedItem);
            }
            
            this.updateEquipmentFromItems();
            return savedItem;
        } catch (error) {
            console.error('Failed to save item:', error);
            UI.showNotification('Failed to save item', 'error');
            return null;
        }
    },
    
    // Delete item from server
    async deleteItem(itemId) {
        try {
            await this.makeRequest(`/items/${itemId}`, {
                method: 'DELETE'
            });
            
            // Remove from local array
            this.items = this.items.filter(item => item.id !== itemId);
            this.updateEquipmentFromItems();
            
            UI.showNotification('Item deleted successfully', 'success');
            return true;
        } catch (error) {
            console.error('Failed to delete item:', error);
            UI.showNotification('Failed to delete item', 'error');
            return false;
        }
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
    
    // Export data
    exportData() {
        const data = {
            items: this.items,
            equipment: this.equipment,
            exportDate: new Date().toISOString(),
            version: '1.0'
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
    
    // Import data
    async importData() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    resolve(false);
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        if (data.items && Array.isArray(data.items)) {
                            // Save each item to server
                            for (const item of data.items) {
                                delete item.id; // Remove old ID to create new
                                await this.saveItem(item);
                            }
                            
                            UI.showNotification('Data imported successfully', 'success');
                            
                            // Refresh displays
                            await this.loadItems();
                            ItemsModule.refresh();
                            EquipmentModule.refresh();
                            StatsModule.updateStats();
                            
                            resolve(true);
                        } else {
                            throw new Error('Invalid file format');
                        }
                    } catch (error) {
                        console.error('Import error:', error);
                        UI.showNotification('Failed to import data: ' + error.message, 'error');
                        resolve(false);
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        });
    },
    
    // Get statistics
    getStats() {
        const equippedItems = this.getEquippedItems();
        const totals = this.calculateTotalEnhancements();
        
        return {
            totalItems: this.items.length,
            totalEquipped: equippedItems.length,
            slotsFiltered: Object.values(this.equipment).filter(item => item !== null).length,
            activeEnhancives: Object.keys(totals).length,
            cappedStats: Object.entries(totals).filter(([target, value]) => 
                value >= getEnhancementCap(target)
            ).length
        };
    },
    
    // Search items
    searchItems(query) {
        if (!query) return this.items;
        
        const searchTerm = query.toLowerCase();
        return this.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.location.toLowerCase().includes(searchTerm) ||
            (item.notes && item.notes.toLowerCase().includes(searchTerm)) ||
            (item.enhancives && item.enhancives.some(enh => 
                enh.target.toLowerCase().includes(searchTerm)
            ))
        );
    },
    
    // Filter items
    filterItems(filters) {
        let filtered = [...this.items];
        
        if (filters.location && filters.location !== 'All') {
            filtered = filtered.filter(item => item.location === filters.location);
        }
        
        if (filters.permanence && filters.permanence !== 'All') {
            filtered = filtered.filter(item => item.permanence === filters.permanence);
        }
        
        if (filters.hasEnhancives) {
            filtered = filtered.filter(item => 
                item.enhancives && item.enhancives.length > 0
            );
        }
        
        if (filters.available !== undefined) {
            filtered = filtered.filter(item => item.available === filters.available);
        }
        
        return filtered;
    }
};