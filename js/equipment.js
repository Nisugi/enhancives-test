// Equipment management module
const EquipmentModule = {
    // Initialize equipment tab
    init() {
        this.refresh();
    },
    
    // Refresh equipment display
    refresh() {
        const container = document.getElementById('equipmentTab');
        if (!container) return;
        
        container.innerHTML = this.generateEquipmentHTML();
    },
    
    // Generate HTML for equipment tab
    generateEquipmentHTML() {
        return `
            <div class="equipment-header">
                <h2>Equipment Overview</h2>
                <div class="equipment-actions">
                    <button class="btn btn-secondary" onclick="EquipmentModule.unequipAll()">Unequip All</button>
                    <button class="btn btn-primary" onclick="EquipmentModule.showOptimizationModal()">Optimize Equipment</button>
                </div>
            </div>
            
            <div class="equipment-layout">
                <div class="equipment-slots">
                    ${this.generateEquipmentSlots()}
                </div>
                
                <div class="enhancement-summary">
                    <h3>Enhancement Summary</h3>
                    ${this.generateEnhancementSummary()}
                </div>
            </div>
            
            <div class="available-items">
                <h3>Available Items for Equipment</h3>
                ${this.generateAvailableItems()}
            </div>
        `;
    },
    
    // Generate equipment slots grid
    generateEquipmentSlots() {
        return `
            <div class="slots-grid">
                ${EQUIPMENT_SLOTS.map(slot => this.generateSlotCard(slot)).join('')}
            </div>
        `;
    },
    
    // Generate individual slot card
    generateSlotCard(slot) {
        const item = DataManager.equipment[slot];
        
        if (item) {
            const enhancivesList = item.enhancives && item.enhancives.length > 0 
                ? item.enhancives.map(enh => `<span class="enhancement-tag">${enh.target}: +${enh.amount}</span>`).join('')
                : '<span class="no-enhancives">No enhancives</span>';
            
            return `
                <div class="slot-card equipped" data-slot="${slot}">
                    <div class="slot-header">
                        <h4>${slot}</h4>
                        <button class="btn btn-danger btn-sm" onclick="EquipmentModule.unequipItem('${slot}')">Unequip</button>
                    </div>
                    <div class="equipped-item">
                        <div class="item-name">${item.name}</div>
                        <div class="item-type">${item.permanence}</div>
                        <div class="enhancives">
                            ${enhancivesList}
                        </div>
                        ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="slot-card empty" data-slot="${slot}">
                    <div class="slot-header">
                        <h4>${slot}</h4>
                    </div>
                    <div class="empty-slot">
                        <span>Empty</span>
                        <button class="btn btn-secondary btn-sm" onclick="EquipmentModule.showItemSelectionModal('${slot}')">Equip Item</button>
                    </div>
                </div>
            `;
        }
    },
    
    // Generate enhancement summary
    generateEnhancementSummary() {
        const totals = DataManager.calculateTotalEnhancements();
        
        if (Object.keys(totals).length === 0) {
            return '<p class="no-enhancements">No active enhancements</p>';
        }
        
        const grouped = this.groupEnhancementsByCategory(totals);
        
        return `
            <div class="enhancement-categories">
                ${Object.entries(grouped).map(([category, enhancements]) => `
                    <div class="category-section">
                        <h4>${category}</h4>
                        <div class="enhancement-grid">
                            ${Object.entries(enhancements).map(([target, amount]) => {
                                const cap = getEnhancementCap(target);
                                const percentage = Math.min((amount / cap) * 100, 100);
                                const isCapped = amount >= cap;
                                
                                return `
                                    <div class="enhancement-item ${isCapped ? 'capped' : ''}">
                                        <div class="enhancement-label">${ENHANCEMENT_TARGETS[target] || target}</div>
                                        <div class="enhancement-value">+${amount}${isCapped ? ' (CAP)' : ''}</div>
                                        <div class="enhancement-bar">
                                            <div class="enhancement-fill" style="width: ${percentage}%"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    // Group enhancements by category
    groupEnhancementsByCategory(totals) {
        const grouped = {};
        
        Object.entries(totals).forEach(([target, amount]) => {
            let category = 'Other';
            
            for (const [categoryName, targets] of Object.entries(ENHANCEMENT_CATEGORIES)) {
                if (targets.includes(target)) {
                    category = categoryName;
                    break;
                }
            }
            
            if (!grouped[category]) {
                grouped[category] = {};
            }
            grouped[category][target] = amount;
        });
        
        return grouped;
    },
    
    // Generate available items for equipment
    generateAvailableItems() {
        const availableItems = DataManager.items.filter(item => 
            item.location !== 'Worn' && 
            item.enhancives && 
            item.enhancives.length > 0
        );
        
        if (availableItems.length === 0) {
            return '<p>No available items with enhancives found.</p>';
        }
        
        return `
            <div class="available-items-grid">
                ${availableItems.map(item => this.generateAvailableItemCard(item)).join('')}
            </div>
        `;
    },
    
    // Generate available item card
    generateAvailableItemCard(item) {
        const enhancivesList = item.enhancives.map(enh => 
            `<span class="enhancement-tag">${enh.target}: +${enh.amount}</span>`
        ).join('');
        
        return `
            <div class="available-item-card">
                <div class="item-header">
                    <h4>${item.name}</h4>
                    <span class="item-location">${item.location}</span>
                </div>
                <div class="item-enhancives">
                    ${enhancivesList}
                </div>
                <div class="item-actions">
                    ${item.slot ? 
                        `<button class="btn btn-primary btn-sm" onclick="ItemsModule.equipItem('${item.id}')">Equip to ${item.slot}</button>` :
                        `<button class="btn btn-secondary btn-sm" onclick="EquipmentModule.showSlotSelectionForItem('${item.id}')">Select Slot & Equip</button>`
                    }
                </div>
            </div>
        `;
    },
    
    // Show item selection modal for empty slot
    showItemSelectionModal(slot) {
        const compatibleItems = DataManager.items.filter(item => 
            item.location !== 'Worn' && 
            (!item.slot || item.slot === slot)
        );
        
        if (compatibleItems.length === 0) {
            UI.showNotification('No compatible items found for this slot', 'error');
            return;
        }
        
        const formHTML = `
            <div class="item-selection">
                <p>Select an item to equip in the <strong>${slot}</strong> slot:</p>
                <div class="items-list">
                    ${compatibleItems.map(item => `
                        <div class="selectable-item" data-item-id="${item.id}">
                            <label>
                                <input type="radio" name="selectedItem" value="${item.id}">
                                <div class="item-info">
                                    <div class="item-name">${item.name}</div>
                                    <div class="item-location">${item.location}</div>
                                    <div class="item-enhancives">
                                        ${item.enhancives && item.enhancives.length > 0 ? 
                                            item.enhancives.map(enh => `${enh.target}: +${enh.amount}`).join(', ') :
                                            'No enhancives'
                                        }
                                    </div>
                                </div>
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        const actions = [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onclick: () => true
            },
            {
                text: 'Equip Item',
                className: 'btn-primary',
                onclick: () => this.equipSelectedItem(slot)
            }
        ];
        
        UI.createModal(`Equip Item - ${slot}`, formHTML, actions);
    },
    
    // Show slot selection for item
    showSlotSelectionForItem(itemId) {
        const item = DataManager.items.find(i => i.id.toString() === itemId.toString());
        if (!item) return;
        
        const formHTML = `
            <div class="slot-selection">
                <p>Select a slot for <strong>${item.name}</strong>:</p>
                <div class="slots-list">
                    ${EQUIPMENT_SLOTS.map(slot => {
                        const isOccupied = DataManager.equipment[slot] !== null;
                        return `
                            <div class="selectable-slot ${isOccupied ? 'occupied' : ''}">
                                <label>
                                    <input type="radio" name="selectedSlot" value="${slot}">
                                    <div class="slot-info">
                                        <div class="slot-name">${slot}</div>
                                        ${isOccupied ? 
                                            `<div class="current-item">Currently: ${DataManager.equipment[slot].name}</div>` :
                                            '<div class="empty-indicator">Empty</div>'
                                        }
                                    </div>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        const actions = [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onclick: () => true
            },
            {
                text: 'Equip Item',
                className: 'btn-primary',
                onclick: () => this.equipItemToSelectedSlot(itemId)
            }
        ];
        
        UI.createModal(`Select Slot - ${item.name}`, formHTML, actions);
    },
    
    // Equip selected item to slot
    async equipSelectedItem(slot) {
        const selectedItemId = document.querySelector('input[name="selectedItem"]:checked')?.value;
        if (!selectedItemId) {
            UI.showNotification('Please select an item', 'error');
            return false;
        }
        
        const item = DataManager.items.find(i => i.id.toString() === selectedItemId.toString());
        if (!item) return false;
        
        const existingItem = DataManager.equipment[slot];
        if (existingItem) {
            // Unequip existing item
            existingItem.location = 'Private';
            existingItem.slot = null;
            await DataManager.saveItem(existingItem);
        }
        
        // Equip new item
        item.location = 'Worn';
        item.slot = slot;
        const savedItem = await DataManager.saveItem(item);
        
        if (savedItem) {
            UI.showNotification(`${item.name} equipped to ${slot}`, 'success');
            this.refresh();
            ItemsModule.updateItemsList();
            StatsModule.updateStats();
            return true;
        }
        
        return false;
    },
    
    // Equip item to selected slot
    async equipItemToSelectedSlot(itemId) {
        const selectedSlot = document.querySelector('input[name="selectedSlot"]:checked')?.value;
        if (!selectedSlot) {
            UI.showNotification('Please select a slot', 'error');
            return false;
        }
        
        const item = DataManager.items.find(i => i.id.toString() === itemId.toString());
        if (!item) return false;
        
        const existingItem = DataManager.equipment[selectedSlot];
        if (existingItem) {
            const confirm = await new Promise(resolve => {
                UI.confirm(
                    `${selectedSlot} is occupied by "${existingItem.name}". Replace it?`,
                    () => resolve(true),
                    () => resolve(false)
                );
            });
            
            if (!confirm) return false;
            
            // Unequip existing item
            existingItem.location = 'Private';
            existingItem.slot = null;
            await DataManager.saveItem(existingItem);
        }
        
        // Equip new item
        item.location = 'Worn';
        item.slot = selectedSlot;
        const savedItem = await DataManager.saveItem(item);
        
        if (savedItem) {
            UI.showNotification(`${item.name} equipped to ${selectedSlot}`, 'success');
            this.refresh();
            ItemsModule.updateItemsList();
            StatsModule.updateStats();
            return true;
        }
        
        return false;
    },
    
    // Unequip item from slot
    async unequipItem(slot) {
        const item = DataManager.equipment[slot];
        if (!item) return;
        
        item.location = 'Private';
        item.slot = null;
        const savedItem = await DataManager.saveItem(item);
        
        if (savedItem) {
            UI.showNotification(`${item.name} unequipped`, 'success');
            this.refresh();
            ItemsModule.updateItemsList();
            StatsModule.updateStats();
        }
    },
    
    // Unequip all items
    async unequipAll() {
        const equippedItems = DataManager.getEquippedItems();
        if (equippedItems.length === 0) {
            UI.showNotification('No items are currently equipped', 'info');
            return;
        }
        
        UI.confirm(
            `Are you sure you want to unequip all ${equippedItems.length} items?`,
            async () => {
                for (const item of equippedItems) {
                    item.location = 'Private';
                    item.slot = null;
                    await DataManager.saveItem(item);
                }
                
                UI.showNotification('All items unequipped', 'success');
                this.refresh();
                ItemsModule.updateItemsList();
                StatsModule.updateStats();
            }
        );
    },
    
    // Show equipment optimization modal
    showOptimizationModal() {
        const formHTML = `
            <div class="optimization-options">
                <p>Select optimization criteria:</p>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="optimizeStats" checked>
                        Maximize stat bonuses
                    </label>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="optimizeSkills" checked>
                        Maximize skill bonuses
                    </label>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="avoidCaps">
                        Avoid exceeding caps
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="priorityTarget">Priority Enhancement:</label>
                    <select id="priorityTarget">
                        <option value="">No specific priority</option>
                        ${Object.entries(ENHANCEMENT_TARGETS).map(([key, label]) => 
                            `<option value="${key}">${label}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
        `;
        
        const actions = [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onclick: () => true
            },
            {
                text: 'Optimize',
                className: 'btn-primary',
                onclick: () => this.performOptimization()
            }
        ];
        
        UI.createModal('Optimize Equipment', formHTML, actions);
    },
    
    // Perform equipment optimization
    async performOptimization() {
        const options = {
            maximizeStats: document.getElementById('optimizeStats').checked,
            maximizeSkills: document.getElementById('optimizeSkills').checked,
            avoidCaps: document.getElementById('avoidCaps').checked,
            priority: document.getElementById('priorityTarget').value
        };
        
        // This is a simplified optimization algorithm
        // In a real implementation, this would be much more sophisticated
        
        UI.showNotification('Optimization feature coming soon!', 'info');
        return true;
    }
};