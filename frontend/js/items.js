// ==================== ITEMS MODULE ====================
const ItemsModule = (() => {
    let targetCount = 1;
    
    const init = () => {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            renderForm();
            renderItemsList();
        }, 0);
    };
    
    const renderForm = () => {
        const formHtml = `
            <div class="form-group">
                <label>Item Name</label>
                <input type="text" id="itemName" placeholder="e.g., Dragon Scale Armor">
            </div>
            
            <div class="form-group">
                <label>Location</label>
                <select id="itemLocation">
                    <option value="">Select Location...</option>
                    ${Constants.locations.map(loc => `<option value="${loc}">${loc}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Permanence</label>
                <select id="itemPermanence">
                    ${Constants.permanenceTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Notes (Optional)</label>
                <textarea id="itemNotes" placeholder="Any additional notes..."></textarea>
            </div>
            
            <div class="enhancive-targets">
                <label style="font-weight: 600; color: var(--dark); margin-bottom: 10px; display: block;">
                    Enhancive Targets (1-6)
                </label>
                <div id="targetsContainer"></div>
                <button class="btn btn-add-target" onclick="ItemsModule.addTargetRow()">+ Add Target</button>
            </div>
            
            <button class="btn btn-primary" onclick="ItemsModule.saveItem()">Save Item</button>
        `;
        
        document.getElementById('itemForm').innerHTML = formHtml;
        
        // Add initial target row
        addTargetRow();
    };
    
    const addTargetRow = () => {
        const container = document.getElementById('targetsContainer');
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
                ${Constants.boostTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
            </select>
            <input type="number" class="amount-input" placeholder="Amount" min="1" max="50">
            <button class="remove-target-btn" onclick="ItemsModule.removeTarget(this)">✕</button>
        `;
        
        container.appendChild(newRow);
        updateRemoveButtons();
    };
    
    const removeTarget = (button) => {
        button.parentElement.remove();
        updateRemoveButtons();
    };
    
    const updateRemoveButtons = () => {
        const rows = document.querySelectorAll('.target-row');
        rows.forEach(row => {
            const removeBtn = row.querySelector('.remove-target-btn');
            removeBtn.style.display = rows.length > 1 ? 'flex' : 'none';
        });
    };
    
    const saveItem = () => {
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
        DataModule.addItem({ name, location, permanence, notes, targets });
        
        // Clear form
        clearForm();
        
        // Refresh displays
        renderItemsList();
        if (typeof StatsModule !== 'undefined') StatsModule.updateStats();
        
        UI.showNotification(`${name} added successfully!`);
    };
    
    const clearForm = () => {
        document.getElementById('itemName').value = '';
        document.getElementById('itemLocation').value = '';
        document.getElementById('itemPermanence').value = 'Permanent';
        document.getElementById('itemNotes').value = '';
        document.getElementById('targetsContainer').innerHTML = '';
        addTargetRow();
    };
    
    const renderItemsList = () => {
        const items = DataModule.getItems();
        const container = document.getElementById('itemsList');
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No items yet</h3>
                    <p>Add your first enhancive item using the form on the left</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = items.map(item => `
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
                
                ${item.notes ? `<div style="margin-top: 10px; padding: 10px; background: white; border-radius: 5px; color: var(--gray); font-size: 0.9em; font-style: italic;">
                    <span id="notes-${item.id}">${item.notes}</span>
                    <button onclick="ItemsModule.editNotes(${item.id})" style="float: right; background: none; border: none; color: var(--primary); cursor: pointer;">✏️</button>
                </div>` : ''}

                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn ${item.isListed ? 'btn-warning' : 'btn-success'}" 
                            onclick="ItemsModule.toggleListed(${item.id})" 
                            style="padding: 8px 16px; font-size: 0.9em;">
                        ${item.isListed ? '📤 Unlist' : '🏪 List'}
                    </button>
                    <button class="btn btn-danger" onclick="ItemsModule.deleteItem(${item.id})" style="padding: 8px 16px; font-size: 0.9em;">Delete</button>
                    <button class="btn btn-primary" onclick="ItemsModule.editItem(${item.id})" style="padding: 8px 16px; font-size: 0.9em;">Edit</button>
                </div>
            </div>
        `).join('');
    };
    
    const deleteItem = (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            DataModule.deleteItem(id);
            renderItemsList();
            if (typeof EquipmentModule !== 'undefined') EquipmentModule.refresh();
            if (typeof StatsModule !== 'undefined') StatsModule.updateStats();
            UI.showNotification('Item deleted');
        }
    };
    
    const searchItems = (query) => {
        const cards = document.querySelectorAll('.item-card');
        query = query.toLowerCase();
        
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? 'block' : 'none';
        });
    };

    const editItem = (id) => {
        const item = DataModule.getItem(id);
        if (!item) return;

        console.log('Editing item:', item);
        
        // Ensure form is rendered first
        if (!document.getElementById('itemName')) {
            renderForm();
        }
        
        // Populate form with item data
        const nameField = document.getElementById('itemName');
        const locationField = document.getElementById('itemLocation');
        const permanenceField = document.getElementById('itemPermanence');
        const notesField = document.getElementById('itemNotes');
        
        if (nameField) nameField.value = item.name;
        if (locationField) locationField.value = item.location;
        if (permanenceField) permanenceField.value = item.permanence;
        if (notesField) notesField.value = item.notes || '';
        
        // Clear and populate targets
        const container = document.getElementById('targetsContainer');
        container.innerHTML = '';
        
        item.targets.forEach(target => {
            addTargetRow();
            const rows = container.querySelectorAll('.target-row');
            const lastRow = rows[rows.length - 1];
            lastRow.querySelector('.target-select').value = target.target;
            lastRow.querySelector('.type-select').value = target.type;
            lastRow.querySelector('.amount-input').value = target.amount;
        });
        
        updateRemoveButtons();
        
        // Change save button to update
        const saveBtn = document.querySelector('.btn-primary[onclick*="saveItem"]');
        saveBtn.textContent = 'Update Item';
        saveBtn.setAttribute('onclick', `ItemsModule.updateItem(${id})`);
        
        // Scroll to form
        document.getElementById('itemForm').scrollIntoView({ behavior: 'smooth' });
    };

    const updateItem = (id) => {
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
        DataModule.editItem(id, { name, location, permanence, notes, targets });
        
        // Reset form
        clearForm();
        
        // Reset save button
        const saveBtn = document.querySelector('.btn-primary[onclick*="updateItem"]');
        saveBtn.textContent = 'Save Item';
        saveBtn.setAttribute('onclick', 'ItemsModule.saveItem()');
        
        // Refresh displays
        renderItemsList();
        if (typeof EquipmentModule !== 'undefined') EquipmentModule.refresh();
        if (typeof StatsModule !== 'undefined') StatsModule.updateStats();
        if (typeof TotalsModule !== 'undefined') TotalsModule.refresh();
        
        UI.showNotification('Item updated successfully!');
    };

    const editNotes = (id) => {
        const item = DataModule.getItem(id);
        const newNotes = prompt('Edit notes:', item.notes || '');
        if (newNotes !== null) {
            DataModule.editItem(id, { notes: newNotes });
            renderItemsList();
            UI.showNotification('Notes updated');
        }
    };
    
    const toggleListed = (id) => {
        const item = DataModule.getItem(id);
        if (item) {
            item.isListed = !item.isListed;
            DataModule.editItem(id, item);
            renderItemsList();
            
            if (item.isListed) {
                UI.showNotification(`${item.name} listed for marketplace`, 'success');
            } else {
                UI.showNotification(`${item.name} unlisted from marketplace`, 'info');
            }
            
            // Update marketplace listings if visible
            if (typeof MarketplaceModule !== 'undefined' && document.getElementById('userListings')) {
                MarketplaceModule.refresh();
            }
        }
    };
    
    return {
        init,
        refresh: () => {
            renderItemsList();
        },
        addTargetRow,
        removeTarget,
        saveItem,
        editItem,
        updateItem,
        editNotes,
        deleteItem,
        searchItems,
        toggleListed
    };
})();