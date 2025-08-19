// ==================== ITEMS MODULE ====================
const ItemsModule = (() => {
    let targetCount = 1;
    
    const init = () => {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            renderForm();
            renderItemsList();
        }, 100);
    };
    
    const renderForm = () => {
        const formContainer = document.getElementById('itemForm');
        if (!formContainer) {
            console.warn('itemForm container not found');
            return;
        }
        
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
                <div style="display: flex; gap: 10px; margin-top: 10px; align-items: stretch;">
                    <button class="btn btn-add-target" onclick="ItemsModule.addTargetRow()" style="flex: 1; height: 48px; min-height: 48px;">+ Add Target</button>
                    <button class="btn btn-primary" onclick="ItemsModule.saveItem()" style="flex: 1; height: 48px; min-height: 48px;">Save Item</button>
                </div>
            </div>
        `;
        
        formContainer.innerHTML = formHtml;
        
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
            <input type="number" class="amount-input" placeholder="" min="-50" max="50">
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
        document.getElementById('itemPermanence').value = 'Persists';
        document.getElementById('itemNotes').value = '';
        document.getElementById('targetsContainer').innerHTML = '';
        addTargetRow();
    };
    
    const renderItemsList = () => {
        const items = DataModule.getItems();
        const container = document.getElementById('itemsList');
        
        // Update total items count
        const countElement = document.getElementById('totalItemsCount');
        if (countElement) {
            countElement.textContent = `${items.length} items`;
        }
        
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
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div class="item-location">${item.location}</div>
                        <span class="permanence-badge ${item.permanence.toLowerCase()}">
                            ${item.permanence}
                        </span>
                    </div>
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

                <div style="margin-top: 15px; display: flex; gap: 10px;">
                    <button class="btn ${item.isListed ? 'btn-warning' : 'btn-success'}" 
                            onclick="ItemsModule.toggleListed(${item.id})" 
                            style="flex: 1; padding: 8px 16px; font-size: 0.9em;">
                        ${item.isListed ? '📤 Unlist' : '🏪 List'}
                    </button>
                    <button class="btn btn-secondary" onclick="ItemsModule.makeCopy(${item.id})" style="flex: 1; padding: 8px 16px; font-size: 0.9em;">📋 Copy</button>
                    <button class="btn btn-danger" onclick="ItemsModule.deleteItem(${item.id})" style="flex: 1; padding: 8px 16px; font-size: 0.9em;">Delete</button>
                    <button class="btn btn-primary" onclick="ItemsModule.editItem(${item.id})" style="flex: 1; padding: 8px 16px; font-size: 0.9em;">Edit</button>
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
    
    const makeCopy = (itemId) => {
        const items = DataModule.getItems();
        const originalItem = items.find(item => item.id === itemId);
        
        if (!originalItem) return;
        
        // Create a deep copy of the item
        const copy = JSON.parse(JSON.stringify(originalItem));
        
        // Generate new ID and update name
        copy.id = Date.now() + Math.floor(Math.random() * 1000);
        copy.name = originalItem.name.includes('(Copy)') ? 
                    originalItem.name : 
                    `${originalItem.name} (Copy)`;
        copy.isListed = false; // Copies should not be listed initially
        
        // Add the copy to items
        items.push(copy);
        DataModule.saveItems(items);
        
        renderItemsList();
        UI.showNotification('Copy created! Visit the Copies tab to modify swap targets.', 'success');
    };
    
    const sortItems = (sortBy) => {
        if (!sortBy) {
            renderItemsList(); // Reset to original order
            return;
        }
        
        const items = DataModule.getItems();
        let sortedItems = [...items];
        
        switch (sortBy) {
            case 'name':
                sortedItems.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'location':
                sortedItems.sort((a, b) => a.location.localeCompare(b.location));
                break;
            case 'targets':
                sortedItems.sort((a, b) => (b.targets?.length || 0) - (a.targets?.length || 0));
                break;
            case 'permanence':
                // Sort by permanence: Persists, Temporary
                const permOrder = { 'Persists': 0, 'Temporary': 1 };
                sortedItems.sort((a, b) => permOrder[a.permanence] - permOrder[b.permanence]);
                break;
            case 'total':
                // Sort by total enhancement value
                sortedItems.sort((a, b) => {
                    const totalA = a.targets?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
                    const totalB = b.targets?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
                    return totalB - totalA; // Descending order
                });
                break;
        }
        
        renderSortedItemsList(sortedItems);
    };
    
    const renderSortedItemsList = (sortedItems) => {
        const container = document.getElementById('itemsList');
        
        // Update total items count
        const countElement = document.getElementById('totalItemsCount');
        if (countElement) {
            countElement.textContent = `${sortedItems.length} items`;
        }
        
        if (sortedItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No items yet</h3>
                    <p>Add your first enhancive item using the form on the left</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = sortedItems.map(item => `
            <div class="item-card" data-item-id="${item.id}">
                <div class="item-header">
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div style="color: var(--gray); font-size: 0.9em;">ID: ${item.id}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div class="item-location">${item.location}</div>
                        <span class="permanence-badge ${item.permanence.toLowerCase()}">
                            ${item.permanence}
                        </span>
                    </div>
                </div>
                
                <div class="enhancive-list">
                    ${item.targets.map(t => 
                        `<span class="enhancive-item">${t.target} ${t.amount > 0 ? '+' : ''}${t.amount} ${t.type}</span>`
                    ).join('')}
                </div>
                
                ${item.notes ? `
                    <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 5px; color: var(--gray); font-size: 0.9em; font-style: italic;">
                        ${item.notes}
                    </div>
                ` : ''}
                
                <div class="item-actions">
                    <button class="btn ${item.isListed ? 'btn-warning' : 'btn-success'}" 
                            onclick="ItemsModule.toggleListed(${item.id})" 
                            style="flex: 1; padding: 8px 16px; font-size: 0.9em;">
                        ${item.isListed ? '📤 Unlist' : '🏪 List'}
                    </button>
                    <button class="btn btn-secondary" onclick="ItemsModule.makeCopy(${item.id})" style="flex: 1; padding: 8px 16px; font-size: 0.9em;">📋 Copy</button>
                    <button class="btn btn-danger" onclick="ItemsModule.deleteItem(${item.id})" style="flex: 1; padding: 8px 16px; font-size: 0.9em;">Delete</button>
                    <button class="btn btn-primary" onclick="ItemsModule.editItem(${item.id})" style="flex: 1; padding: 8px 16px; font-size: 0.9em;">Edit</button>
                </div>
            </div>
        `).join('');
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
        sortItems,
        toggleListed,
        makeCopy
    };
})();