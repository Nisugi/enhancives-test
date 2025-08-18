// Items management module - COMPLETE REPLACEMENT for frontend/js/items.js
const ItemsModule = {
    // Initialize items tab
    init() {
        this.renderItemsTab();
        this.addInitialTargetRow();
        this.renderItemsList();
    },
    
    // Refresh the items display
    refresh() {
        this.renderItemsList();
    },
    
    // Render the entire items tab structure
    renderItemsTab() {
        const container = document.getElementById('itemsTab');
        if (!container) return;
        
        container.innerHTML = `
            <div class="items-layout">
                <div class="panel panel-sticky">
                    <h2 class="section-title">Add New Item</h2>
                    <div id="itemForm">
                        <div class="form-group">
                            <label>Item Name</label>
                            <input type="text" id="itemName" placeholder="e.g., Dragon Scale Armor">
                        </div>
                        
                        <div class="form-group">
                            <label>Location</label>
                            <select id="itemLocation">
                                <option value="">Select Location...</option>
                                ${locations.map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Permanence</label>
                            <select id="itemPermanence">
                                ${permanenceTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Notes (Optional)</label>
                            <textarea id="itemNotes" placeholder="Any additional notes..." rows="3"></textarea>
                        </div>
                        
                        <div class="enhancive-targets">
                            <label style="font-weight: 600; color: var(--dark); margin-bottom: 10px; display: block;">
                                Enhancive Targets (1-6)
                            </label>
                            <div id="targetsContainer"></div>
                            <button type="button" class="btn btn-add-target" onclick="ItemsModule.addTargetRow()">+ Add Target</button>
                        </div>
                        
                        <button class="btn btn-primary" onclick="ItemsModule.saveItem()">Save Item</button>
                    </div>
                </div>
                
                <div class="panel">
                    <h2 class="section-title">Your Items</h2>
                    <input type="text" class="search-bar" placeholder="🔍 Search items..." 
                           onkeyup="ItemsModule.searchItems(this.value)">
                    <div id="itemsList" class="items-grid"></div>
                </div>
            </div>
        `;
    },
    
    // Add initial target row when form loads
    addInitialTargetRow() {
        const container = document.getElementById('targetsContainer');
        if (container && container.children.length === 0) {
            this.addTargetRow();
        }
    },
    
    // Add a new target row
    addTargetRow() {
        const container = document.getElementById('targetsContainer');
        if (!container) return;
        
        const rows = container.querySelectorAll('.target-row');
        
        if (rows.length >= 6) {
            UI.showNotification('Maximum 6 targets per item', 'warning');
            return;
        }
        
        const newRow = document.createElement('div');
        newRow.className = 'target-row';
        newRow.innerHTML = `
            <select class="target-select">
                ${UI.createTargetOptions()}
            </select>
            <select class="type-select">
                ${boostTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
            </select>
            <input type="number" class="amount-input" placeholder="Amount" min="1" max="50">
            <button class="remove-target-btn" onclick="ItemsModule.removeTarget(this)">✕</button>
        `;
        
        container.appendChild(newRow);
        this.updateRemoveButtons();
    },
    
    // Remove a target row
    removeTarget(button) {
        button.parentElement.remove();
        this.updateRemoveButtons();
    },
    
    // Update visibility of remove buttons
    updateRemoveButtons() {
        const rows = document.querySelectorAll('.target-row');
        rows.forEach(row => {
            const removeBtn = row.querySelector('.remove-target-btn');
            if (removeBtn) {
                removeBtn.style.display = rows.length > 1 ? 'flex' : 'none';
            }
        });
    },
    
    // Save item (add new)
    saveItem() {
        const name = document.getElementById('itemName').value.trim();
        const location = document.getElementById('itemLocation').value;
        const permanence = document.getElementById('itemPermanence').value;
        const notes = document.getElementById('itemNotes').value.trim();
        
        // Validation
        if (!name) {
            UI.showNotification('Please enter an item name', 'error');
            return;
        }
        
        if (!location) {
            UI.showNotification('Please select a location', 'error');
            return;
        }
        
        // Collect targets
        const targets = [];
        document.querySelectorAll('.target-row').forEach(row => {
            const target = row.querySelector('.target-select').value;
            const type = row.querySelector('.type-select').value;
            const amount = parseInt(row.querySelector('.amount-input').value);
            
            if (target && amount) {
                targets.push({ target, type, amount });
            }
        });
        
        if (targets.length === 0) {
            UI.showNotification('Please add at least one enhancive target', 'error');
            return;
        }
        
        // Add item
        const newItem = DataManager.addItem({ 
            name, 
            location, 
            permanence, 
            notes, 
            targets 
        });
        
        // Clear form
        this.clearForm();
        
        // Refresh displays
        this.renderItemsList();
        App.updateStatistics();
        
        UI.showNotification(`${name} added successfully!`);
    },
    
    // Clear the form
    clearForm() {
        document.getElementById('itemName').value = '';
        document.getElementById('itemLocation').value = '';
        document.getElementById('itemPermanence').value = 'Permanent';
        document.getElementById('itemNotes').value = '';
        document.getElementById('targetsContainer').innerHTML = '';
        this.addTargetRow();
    },
    
    // Render the items list
    renderItemsList() {
        const items = DataManager.getItems();
        const container = document.getElementById('itemsList');
        if (!container) return;
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No items yet</h3>
                    <p>Add your first enhancive item using the form on the left</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = items.map(item => this.createItemCard(item)).join('');
    },
    
    // Create HTML for an item card
    createItemCard(item) {
        return `
            <div class="item-card" data-item-id="${item.id}">
                <div class="item-header">
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div style="color: var(--gray); font-size: 0.9em;">ID: ${item.id}</div>
                    </div>
                    <div class="item-location">${item.location}</div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <span class="permanence-badge ${item.permanence.toLowerCase()}">
                        ${item.permanence}
                    </span>
                </div>
                
                <div class="enhancive-list">
                    ${item.targets.map(t => 
                        `<span class="enhancive-item">${t.target} +${t.amount} ${t.type}</span>`
                    ).join('')}
                </div>
                
                ${item.notes ? `
                    <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 5px; 
                              color: var(--gray); font-size: 0.9em; font-style: italic;">
                        ${item.notes}
                    </div>
                ` : ''}

                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="ItemsModule.editItem(${item.id})" 
                            style="padding: 8px 16px; font-size: 0.9em;">Edit</button>
                    <button class="btn btn-danger" onclick="ItemsModule.deleteItem(${item.id})"
                            style="padding: 8px 16px; font-size: 0.9em;">Delete</button>
                </div>
            </div>
        `;
    },
    
    // Edit an item
    editItem(id) {
        const item = DataManager.getItem(id);
        if (!item) return;
        
        // Populate form with item data
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemLocation').value = item.location;
        document.getElementById('itemPermanence').value = item.permanence;
        document.getElementById('itemNotes').value = item.notes || '';
        
        // Clear and populate targets
        const container = document.getElementById('targetsContainer');
        container.innerHTML = '';
        
        item.targets.forEach(target => {
            this.addTargetRow();
            const rows = container.querySelectorAll('.target-row');
            const lastRow = rows[rows.length - 1];
            lastRow.querySelector('.target-select').value = target.target;
            lastRow.querySelector('.type-select').value = target.type;
            lastRow.querySelector('.amount-input').value = target.amount;
        });
        
        this.updateRemoveButtons();
        
        // Change save button to update
        const saveBtn = document.querySelector('.btn-primary[onclick*="saveItem"]');
        if (saveBtn) {
            saveBtn.textContent = 'Update Item';
            saveBtn.setAttribute('onclick', `ItemsModule.updateItem(${id})`);
        }
        
        // Scroll to form
        document.getElementById('itemForm').scrollIntoView({ behavior: 'smooth' });
    },
    
    // Update an existing item
    updateItem(id) {
        const name = document.getElementById('itemName').value.trim();
        const location = document.getElementById('itemLocation').value;
        const permanence = document.getElementById('itemPermanence').value;
        const notes = document.getElementById('itemNotes').value.trim();
        
        if (!name || !location) {
            UI.showNotification('Please enter item name and location', 'error');
            return;
        }
        
        const targets = [];
        document.querySelectorAll('.target-row').forEach(row => {
            const target = row.querySelector('.target-select').value;
            const type = row.querySelector('.type-select').value;
            const amount = parseInt(row.querySelector('.amount-input').value);
            
            if (target && amount) {
                targets.push({ target, type, amount });
            }
        });
        
        if (targets.length === 0) {
            UI.showNotification('Please add at least one enhancive target', 'error');
            return;
        }
        
        // Update item
        DataManager.editItem(id, { name, location, permanence, notes, targets });
        
        // Reset form
        this.clearForm();
        
        // Reset save button
        const saveBtn = document.querySelector('.btn-primary[onclick*="updateItem"]');
        if (saveBtn) {
            saveBtn.textContent = 'Save Item';
            saveBtn.setAttribute('onclick', 'ItemsModule.saveItem()');
        }
        
        // Refresh displays
        this.renderItemsList();
        EquipmentModule.refresh();
        App.updateStatistics();
        if (TotalsModule.refresh) TotalsModule.refresh();
        
        UI.showNotification('Item updated successfully!');
    },
    
    // Delete an item
    deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            DataManager.deleteItem(id);
            this.renderItemsList();
            EquipmentModule.refresh();
            App.updateStatistics();
            UI.showNotification('Item deleted');
        }
    },
    
    // Search items
    searchItems(query) {
        const cards = document.querySelectorAll('.item-card');
        query = query.toLowerCase();
        
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? 'block' : 'none';
        });
    }
};