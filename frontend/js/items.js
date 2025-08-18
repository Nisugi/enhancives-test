// Items management module
const ItemsModule = {
    targetCount: 1,
    
    // Initialize items tab
    init() {
        this.renderForm();
        this.refresh();
    },
    
    // Render the add item form
    renderForm() {
        const container = document.getElementById('itemsTab');
        if (!container) return;
        
        const formHtml = `
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
                            <textarea id="itemNotes" placeholder="Any additional notes..."></textarea>
                        </div>
                        
                        <div class="enhancive-targets">
                            <label style="font-weight: 600;">Enhancive Targets (1-6)</label>
                            <div id="targetsContainer"></div>
                            <button class="btn btn-add-target" onclick="ItemsModule.addTargetRow()"> Add Target</button>
                        </div>
                        
                        <button class="btn btn-primary" onclick="ItemsModule.saveItem()">Save Item</button>
                    </div>
                </div>
                <div class="panel">
                    <h2 class="section-title">Your Items</h2>
                    <input type="text" class="search-bar" placeholder="🔍 Search items..." onkeyup="ItemsModule.searchItems(this.value)">
                    <div id="itemsList" class="items-grid"></div>
                </div>
            </div>
        `;
        
        container.innerHTML = formHtml;
        this.addTargetRow();
    },

    // Refresh items display
    refresh() {
        const container = document.getElementById('itemsTab');
        if (!container) return;
        
        container.innerHTML = this.generateItemsHTML();
        this.attachEventListeners();
    },
    
    // Generate HTML for items tab
    generateItemsHTML() {
        return `
            <div class="items-header">
                <h2>Item Management</h2>
                <button class="btn btn-primary" onclick="ItemsModule.showAddItemModal()">Add New Item</button>
            </div>
            
            <div class="items-controls">
                <div class="search-filters">
                    <div class="form-group">
                        <input type="text" id="itemSearch" placeholder="Search items..." 
                               value="${this.searchQuery}" onkeyup="ItemsModule.handleSearch(event)">
                    </div>
                    <div class="form-group">
                        <select id="locationFilter" onchange="ItemsModule.handleFilterChange()">
                            <option value="All">All Locations</option>
                            ${LOCATIONS.slice(1).map(loc => 
                                `<option value="${loc}" ${this.filters.location === loc ? 'selected' : ''}>${loc}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <select id="permanenceFilter" onchange="ItemsModule.handleFilterChange()">
                            <option value="All">All Types</option>
                            ${PERMANENCE_OPTIONS.map(perm => 
                                `<option value="${perm}" ${this.filters.permanence === perm ? 'selected' : ''}>${perm}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="enhancivesFilter" 
                                   ${this.filters.hasEnhancives ? 'checked' : ''} 
                                   onchange="ItemsModule.handleFilterChange()">
                            Has Enhancives Only
                        </label>
                    </div>
                </div>
            </div>
            
            <div id="itemsList">
                ${this.generateItemsList()}
            </div>
        `;
    },
    
    // Generate items list
    generateItemsList() {
        let items = DataManager.searchItems(this.searchQuery);
        items = DataManager.filterItems(this.filters);
        
        if (items.length === 0) {
            return '<div class="text-center mt-3"><p>No items found.</p></div>';
        }
        
        return `
            <div class="items-grid">
                ${items.map(item => this.generateItemCard(item)).join('')}
            </div>
        `;
    },
    
    // Generate individual item card
    generateItemCard(item) {
        const enhancivesList = item.enhancives && item.enhancives.length > 0 
            ? item.enhancives.map(enh => `<li>${enh.target}: ${enh.amount}</li>`).join('')
            : '<li>None</li>';
        
        return `
            <div class="item-card" data-item-id="${item.id}">
                <div class="item-header">
                    <h3>${item.name}</h3>
                    <div class="item-actions">
                        <button class="btn btn-secondary" onclick="ItemsModule.editItem('${item.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="ItemsModule.deleteItem('${item.id}')">Delete</button>
                    </div>
                </div>
                
                <div class="item-details">
                    <div class="detail-row">
                        <strong>Location:</strong> ${item.location}
                        ${item.slot ? `<strong>Slot:</strong> ${item.slot}` : ''}
                    </div>
                    <div class="detail-row">
                        <strong>Type:</strong> ${item.permanence}
                        ${item.available !== undefined ? 
                            `<strong>Available:</strong> ${item.available ? 'Yes' : 'No'}` : ''
                        }
                    </div>
                    
                    ${item.notes ? `
                        <div class="detail-row">
                            <strong>Notes:</strong> ${item.notes}
                        </div>
                    ` : ''}
                    
                    <div class="enhancives-section">
                        <strong>Enhancives:</strong>
                        <ul class="enhancive-list">
                            ${enhancivesList}
                        </ul>
                    </div>
                    
                    ${item.location === 'Worn' ? '' : `
                        <div class="item-actions-bottom">
                            <button class="btn btn-success" onclick="ItemsModule.equipItem('${item.id}')">Equip</button>
                            <button class="btn btn-secondary" onclick="ItemsModule.toggleAvailability('${item.id}')">
                                ${item.available ? 'Mark Unavailable' : 'Mark Available'}
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    },
    
    // Handle search input
    handleSearch(event) {
        this.searchQuery = event.target.value;
        this.updateItemsList();
    },
    
    // Handle filter changes
    handleFilterChange() {
        this.filters.location = document.getElementById('locationFilter').value;
        this.filters.permanence = document.getElementById('permanenceFilter').value;
        this.filters.hasEnhancives = document.getElementById('enhancivesFilter').checked;
        
        this.updateItemsList();
    },
    
    // Update items list without full refresh
    updateItemsList() {
        const container = document.getElementById('itemsList');
        if (container) {
            container.innerHTML = this.generateItemsList();
        }
    },
    
    // Show add item modal
    showAddItemModal() {
        this.showItemModal();
    },
    
    // Show edit item modal
    editItem(itemId) {
        const item = DataManager.items.find(i => i.id.toString() === itemId.toString());
        if (item) {
            this.showItemModal(item);
        }
    },
    
    // Show item modal (add/edit)
    showItemModal(item = null) {
        const isEdit = item !== null;
        const modalTitle = isEdit ? 'Edit Item' : 'Add New Item';
        
        const formHTML = `
            <form id="itemForm">
                <div class="form-group">
                    <label for="itemName">Item Name</label>
                    <input type="text" id="itemName" value="${item?.name || ''}" required>
                </div>
                
                <div class="form-group">
                    <label for="itemLocation">Location</label>
                    <select id="itemLocation" onchange="ItemsModule.handleLocationChange()">
                        ${LOCATIONS.map(loc => 
                            `<option value="${loc}" ${item?.location === loc ? 'selected' : ''}>${loc}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group" id="slotGroup" style="display: ${item?.location === 'Worn' ? 'block' : 'none'}">
                    <label for="itemSlot">Equipment Slot</label>
                    <select id="itemSlot">
                        <option value="">Select Slot...</option>
                        ${EQUIPMENT_SLOTS.map(slot => 
                            `<option value="${slot}" ${item?.slot === slot ? 'selected' : ''}>${slot}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="itemPermanence">Type</label>
                    <select id="itemPermanence">
                        ${PERMANENCE_OPTIONS.map(perm => 
                            `<option value="${perm}" ${item?.permanence === perm ? 'selected' : ''}>${perm}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="itemNotes">Notes (Optional)</label>
                    <textarea id="itemNotes" rows="3">${item?.notes || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label>Enhancives (1-6)</label>
                    <div id="enhancivesList">
                        ${this.generateEnhancivesInputs(item?.enhancives || [])}
                    </div>
                    <button type="button" class="btn btn-secondary" onclick="ItemsModule.addEnhanciveInput()">Add Enhancement</button>
                </div>
            </form>
        `;
        
        const actions = [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onclick: () => true
            },
            {
                text: isEdit ? 'Update Item' : 'Add Item',
                className: 'btn-primary',
                onclick: () => this.saveItem(item)
            }
        ];
        
        UI.createModal(modalTitle, formHTML, actions);
    },
    
    // Handle location change in modal
    handleLocationChange() {
        const location = document.getElementById('itemLocation').value;
        const slotGroup = document.getElementById('slotGroup');
        
        if (slotGroup) {
            slotGroup.style.display = location === 'Worn' ? 'block' : 'none';
        }
    },
    
    // Generate enhancives inputs
    generateEnhancivesInputs(enhancives) {
        if (enhancives.length === 0) {
            return '<div class="enhancive-input">' + this.createEnhanciveInputHTML() + '</div>';
        }
        
        return enhancives.map(enh => 
            '<div class="enhancive-input">' + this.createEnhanciveInputHTML(enh) + '</div>'
        ).join('');
    },
    
    // Create enhancive input HTML
    createEnhanciveInputHTML(enhancement = {}) {
        return `
            <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: center;">
                <select class="enh-target" style="flex: 2;">
                    <option value="">Select Enhancement...</option>
                    ${Object.entries(ENHANCEMENT_TARGETS).map(([key, label]) => 
                        `<option value="${key}" ${enhancement.target === key ? 'selected' : ''}>${label}</option>`
                    ).join('')}
                </select>
                <input type="number" class="enh-amount" placeholder="Amount" min="1" max="50" 
                       value="${enhancement.amount || ''}" style="flex: 1;">
                <button type="button" class="btn btn-danger" onclick="this.parentElement.parentElement.remove()" 
                        style="padding: 5px 10px;">×</button>
            </div>
        `;
    },
    
    // Add enhancive input
    addEnhanciveInput() {
        const container = document.getElementById('enhancivesList');
        if (container && container.children.length < 6) {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'enhancive-input';
            inputDiv.innerHTML = this.createEnhanciveInputHTML();
            container.appendChild(inputDiv);
        }
    },
    
    // Save item (add or update)
    async saveItem(existingItem) {
        const form = document.getElementById('itemForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }
        
        const itemData = {
            id: existingItem?.id || Utils.generateId(),
            name: document.getElementById('itemName').value.trim(),
            location: document.getElementById('itemLocation').value,
            slot: document.getElementById('itemSlot').value || null,
            permanence: document.getElementById('itemPermanence').value,
            notes: document.getElementById('itemNotes').value.trim() || null,
            enhancives: this.getEnhancivesFromForm(),
            available: existingItem?.available || false
        };
        
        // Validation
        if (!itemData.name) {
            UI.showNotification('Item name is required', 'error');
            return false;
        }
        
        if (itemData.location === 'Worn' && !itemData.slot) {
            UI.showNotification('Equipment slot is required for worn items', 'error');
            return false;
        }
        
        if (itemData.enhancives.length > 6) {
            UI.showNotification('Maximum 6 enhancives allowed', 'error');
            return false;
        }
        
        try {
            const savedItem = await DataManager.saveItem(itemData);
            if (savedItem) {
                UI.showNotification(
                    existingItem ? 'Item updated successfully' : 'Item added successfully', 
                    'success'
                );
                
                this.updateItemsList();
                StatsModule.updateStats();
                
                if (itemData.location === 'Worn') {
                    EquipmentModule.refresh();
                }
                
                return true;
            }
        } catch (error) {
            console.error('Save item error:', error);
            UI.showNotification('Failed to save item', 'error');
        }
        
        return false;
    },
    
    // Get enhancives from form
    getEnhancivesFromForm() {
        const enhancives = [];
        const inputs = document.querySelectorAll('.enhancive-input');
        
        inputs.forEach(input => {
            const target = input.querySelector('.enh-target').value;
            const amount = parseInt(input.querySelector('.enh-amount').value);
            
            if (target && amount > 0) {
                enhancives.push({ target, amount });
            }
        });
        
        return enhancives;
    },
    
    // Delete item
    async deleteItem(itemId) {
        UI.confirm(
            'Are you sure you want to delete this item? This action cannot be undone.',
            async () => {
                const success = await DataManager.deleteItem(itemId);
                if (success) {
                    this.updateItemsList();
                    StatsModule.updateStats();
                    EquipmentModule.refresh();
                }
            }
        );
    },
    
    // Equip item
    async equipItem(itemId) {
        const item = DataManager.items.find(i => i.id.toString() === itemId.toString());
        if (!item) return;
        
        // Show slot selection if not set
        if (!item.slot) {
            this.showSlotSelectionModal(item);
            return;
        }
        
        // Check if slot is already occupied
        const existingItem = DataManager.equipment[item.slot];
        if (existingItem) {
            UI.confirm(
                `${item.slot} slot is already occupied by "${existingItem.name}". Replace it?`,
                async () => {
                    await this.performEquip(item, existingItem);
                }
            );
        } else {
            await this.performEquip(item);
        }
    },
    
    // Show slot selection modal
    showSlotSelectionModal(item) {
        const formHTML = `
            <div class="form-group">
                <label>Select equipment slot:</label>
                <select id="equipSlot">
                    ${EQUIPMENT_SLOTS.map(slot => 
                        `<option value="${slot}">${slot}</option>`
                    ).join('')}
                </select>
            </div>
        `;
        
        const actions = [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onclick: () => true
            },
            {
                text: 'Equip',
                className: 'btn-primary',
                onclick: async () => {
                    const slot = document.getElementById('equipSlot').value;
                    item.slot = slot;
                    
                    const existingItem = DataManager.equipment[slot];
                    if (existingItem) {
                        UI.confirm(
                            `${slot} slot is already occupied. Replace it?`,
                            async () => {
                                await this.performEquip(item, existingItem);
                            }
                        );
                        return false; // Keep modal open
                    } else {
                        await this.performEquip(item);
                        return true;
                    }
                }
            }
        ];
        
        UI.createModal('Select Equipment Slot', formHTML, actions);
    },
    
    // Perform equip action
    async performEquip(item, existingItem = null) {
        // Unequip existing item if present
        if (existingItem) {
            existingItem.location = 'Private';
            existingItem.slot = null;
            await DataManager.saveItem(existingItem);
        }
        
        // Equip new item
        item.location = 'Worn';
        const savedItem = await DataManager.saveItem(item);
        
        if (savedItem) {
            UI.showNotification(`${item.name} equipped successfully`, 'success');
            this.updateItemsList();
            EquipmentModule.refresh();
            StatsModule.updateStats();
        }
    },
    
    // Toggle item availability
    async toggleAvailability(itemId) {
        const item = DataManager.items.find(i => i.id.toString() === itemId.toString());
        if (!item) return;
        
        item.available = !item.available;
        const savedItem = await DataManager.saveItem(item);
        
        if (savedItem) {
            UI.showNotification(
                `${item.name} marked as ${item.available ? 'available' : 'unavailable'}`, 
                'success'
            );
            this.updateItemsList();
        }
    },
    
    // Attach event listeners
    attachEventListeners() {
        // Search input debouncing
        const searchInput = document.getElementById('itemSearch');
        if (searchInput) {
            searchInput.removeEventListener('keyup', this.debouncedSearch);
            this.debouncedSearch = Utils.debounce((e) => this.handleSearch(e), 300);
            searchInput.addEventListener('keyup', this.debouncedSearch);
        }
    }
};