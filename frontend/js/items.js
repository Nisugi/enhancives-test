const ItemsModule = {
    // Initialize items tab
    init() {
        this.renderItemsTab();
        this.addInitialTargetRow();
        this.renderItemsList();
    },
    
    // Refresh just the items list
    refresh() {
        this.renderItemsList();
    },
    
    // Render the entire items tab structure
    renderItemsTab() {
        const container = document.getElementById('itemsTab');
        if (!container) return;
        
        container.innerHTML = `
            <div class="items-layout" style="display: grid; grid-template-columns: 400px 1fr; gap: 30px;">
                <div class="panel panel-sticky" style="background: white; border-radius: 15px; padding: 25px; height: fit-content; position: sticky; top: 20px;">
                    <h2 class="section-title" style="font-size: 1.5em; color: #2d3748; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">Add New Item</h2>
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
                            <label style="font-weight: 600; color: #2d3748; margin-bottom: 10px; display: block;">
                                Enhancive Targets (1-6)
                            </label>
                            <div id="targetsContainer"></div>
                            <button type="button" class="btn btn-add-target" style="background: #48bb78; color: white; margin-top: 10px;" onclick="ItemsModule.addTargetRow()">+ Add Target</button>
                        </div>
                        
                        <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="ItemsModule.saveItem()">Save Item</button>
                    </div>
                </div>
                
                <div class="panel" style="background: white; border-radius: 15px; padding: 25px;">
                    <h2 class="section-title" style="font-size: 1.5em; color: #2d3748; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">Your Items</h2>
                    <input type="text" class="search-bar" placeholder="🔍 Search items..." 
                           style="width: 100%; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; font-size: 1em;"
                           onkeyup="ItemsModule.searchItems(this.value)">
                    <div id="itemsList" class="items-grid" style="display: grid; gap: 15px;"></div>
                </div>
            </div>
        `;
    },
    
    // Add initial target row
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
        newRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 10px; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;';
        newRow.innerHTML = `
            <select class="target-select">
                ${UI.createTargetOptions()}
            </select>
            <select class="type-select">
                ${boostTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
            </select>
            <input type="number" class="amount-input" placeholder="Amount" min="1" max="50">
            <button class="remove-target-btn" style="background: #f56565; color: white; border: none; border-radius: 5px; padding: 8px; cursor: pointer;" onclick="ItemsModule.removeTarget(this)">✕</button>
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
    
    // Save item
    saveItem() {
        const name = document.getElementById('itemName').value.trim();
        const location = document.getElementById('itemLocation').value;
        const permanence = document.getElementById('itemPermanence').value;
        const notes = document.getElementById('itemNotes').value.trim();
        
        if (!name) {
            UI.showNotification('Please enter an item name', 'error');
            return;
        }
        
        if (!location) {
            UI.showNotification('Please select a location', 'error');
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
        
        DataManager.addItem({ name, location, permanence, notes, targets });
        this.clearForm();
        this.renderItemsList();
        App.updateStatistics();
        UI.showNotification(`${name} added successfully!`);
    },
    
    // Clear form
    clearForm() {
        document.getElementById('itemName').value = '';
        document.getElementById('itemLocation').value = '';
        document.getElementById('itemPermanence').value = 'Permanent';
        document.getElementById('itemNotes').value = '';
        document.getElementById('targetsContainer').innerHTML = '';
        this.addTargetRow();
    },
    
    // Render items list
    renderItemsList() {
        const items = DataManager.getItems();
        const container = document.getElementById('itemsList');
        if (!container) return;
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 60px 20px; color: #718096;">
                    <h3 style="font-size: 1.5em; margin-bottom: 10px;">No items yet</h3>
                    <p>Add your first enhancive item using the form on the left</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = items.map(item => this.createItemCard(item)).join('');
    },
    
    // Create item card HTML
    createItemCard(item) {
        const cardStyle = `
            padding: 20px;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            background: #f8f9fa;
            transition: all 0.3s;
        `;
        
        return `
            <div class="item-card" data-item-id="${item.id}" style="${cardStyle}">
                <div class="item-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <div class="item-name" style="font-size: 1.2em; font-weight: bold; color: #2d3748;">${item.name}</div>
                        <div style="color: #718096; font-size: 0.9em;">ID: ${item.id}</div>
                    </div>
                    <div class="item-location" style="display: inline-block; padding: 5px 10px; background: #667eea; color: white; border-radius: 5px; font-size: 0.85em; font-weight: 600;">${item.location}</div>
                </div>
                
                <div style="margin-bottom: 10px;">
                    <span class="permanence-badge ${item.permanence.toLowerCase()}" 
                          style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600; 
                                 background: ${item.permanence === 'Permanent' ? '#c6f6d5' : '#fed7d7'}; 
                                 color: ${item.permanence === 'Permanent' ? '#22543d' : '#742a2a'};">
                        ${item.permanence}
                    </span>
                </div>
                
                <div class="enhancive-list">
                    ${item.targets.map(t => 
                        `<span class="enhancive-item" style="display: inline-block; padding: 5px 10px; margin: 3px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 15px; font-size: 0.85em;">
                            ${t.target} +${t.amount} ${t.type}
                        </span>`
                    ).join('')}
                </div>
                
                ${item.notes ? `
                    <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 5px; color: #718096; font-size: 0.9em; font-style: italic;">
                        ${item.notes}
                    </div>
                ` : ''}

                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="ItemsModule.editItem(${item.id})" 
                            style="padding: 8px 16px; font-size: 0.9em;">Edit</button>
                    <button class="btn btn-danger" onclick="ItemsModule.deleteItem(${item.id})"
                            style="padding: 8px 16px; font-size: 0.9em; background: #f56565;">Delete</button>
                </div>
            </div>
        `;
    },
    
    // Edit item
    editItem(id) {
        const item = DataManager.getItem(id);
        if (!item) return;
        
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemLocation').value = item.location;
        document.getElementById('itemPermanence').value = item.permanence;
        document.getElementById('itemNotes').value = item.notes || '';
        
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
        
        const saveBtn = document.querySelector('.btn-primary[onclick*="saveItem"]');
        if (saveBtn) {
            saveBtn.textContent = 'Update Item';
            saveBtn.setAttribute('onclick', `ItemsModule.updateItem(${id})`);
        }
        
        document.getElementById('itemForm').scrollIntoView({ behavior: 'smooth' });
    },
    
    // Update item
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
        
        DataManager.editItem(id, { name, location, permanence, notes, targets });
        this.clearForm();
        
        const saveBtn = document.querySelector('.btn-primary[onclick*="updateItem"]');
        if (saveBtn) {
            saveBtn.textContent = 'Save Item';
            saveBtn.setAttribute('onclick', 'ItemsModule.saveItem()');
        }
        
        this.renderItemsList();
        EquipmentModule.refresh();
        App.updateStatistics();
        UI.showNotification('Item updated successfully!');
    },
    
    // Delete item
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

// ============= FIX 2: frontend/js/ui.js =============
// Replace the createTargetOptions function with this fixed version:

const UI = {
    currentTab: 'items',

    init() {
        console.log('UI module initialized');
    },
    
    // FIXED: Create target options for dropdowns
    createTargetOptions() {
        let options = '<option value="">Select Target...</option>';
        
        // Add stats
        options += '<optgroup label="Stats">';
        stats.forEach(stat => {
            options += `<option value="${stat}">${stat}</option>`;
        });
        options += '</optgroup>';
        
        // Add skills by category
        for (const [category, skillList] of Object.entries(skills)) {
            options += `<optgroup label="${category}">`;
            skillList.forEach(skill => {
                options += `<option value="${skill}">${skill}</option>`;
            });
            options += '</optgroup>';
        }

        // Add resources
        options += '<optgroup label="Resources">';
        resources.forEach(resource => {
            options += `<option value="${resource}">${resource}</option>`;
        });
        options += '</optgroup>';
        
        return options;
    },

    // Rest of UI module remains the same...
    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const tabContent = document.getElementById(tabName + 'Tab');
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        const navTab = document.querySelector(`[onclick="UI.switchTab('${tabName}')"]`);
        if (navTab) {
            navTab.classList.add('active');
        }
        
        this.currentTab = tabName;
        this.loadTabContent(tabName);
    },
    
    loadTabContent(tabName) {
        switch (tabName) {
            case 'items':
                ItemsModule.refresh();
                break;
            case 'equipment':
                EquipmentModule.refresh();
                break;
            case 'totals':
                TotalsModule.refresh();
                break;
            case 'analysis':
                AnalysisModule.refresh();
                break;
            case 'settings':
                SettingsModule.refresh();
                break;
        }
    },
    
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notifications');
        if (container) {
            container.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, duration);
        }
    }
};