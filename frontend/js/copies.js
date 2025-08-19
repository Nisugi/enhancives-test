// ==================== COPIES MODULE ====================
const CopiesModule = {
    editingCopyId: null,
    
    init() {
        this.render();
    },
    
    render() {
        const container = document.getElementById('copiesContent');
        if (!container) return;
        
        const items = DataModule.getItems();
        const copies = items.filter(item => item.name && item.name.includes('(Copy)'));
        
        container.innerHTML = `
            <div class="copies-container">
                ${copies.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: var(--gray);">
                        <p style="font-size: 1.2em; margin-bottom: 10px;">No copies found</p>
                        <p>Copies from the marketplace will appear here for modification</p>
                    </div>
                ` : `
                    <div class="copies-list">
                        ${copies.map(copy => this.renderCopyCard(copy)).join('')}
                    </div>
                `}
            </div>
        `;
    },
    
    renderCopyCard(copy) {
        const isEditing = this.editingCopyId === copy.id;
        
        if (isEditing) {
            return this.renderEditMode(copy);
        }
        
        return `
            <div class="copy-card" data-copy-id="${copy.id}">
                <div class="item-header">
                    <div>
                        <div class="item-name">${copy.name}</div>
                        <div style="color: var(--gray); font-size: 0.9em;">ID: ${copy.id}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div class="item-location">${copy.location}</div>
                        <span class="permanence-badge ${copy.permanence.toLowerCase()}">
                            ${copy.permanence}
                        </span>
                    </div>
                </div>
                
                <div class="enhancive-list">
                    ${copy.targets.map(t => 
                        `<span class="enhancive-item">${t.target} +${t.amount} ${t.type}</span>`
                    ).join('')}
                </div>
                
                <div class="button-group" style="margin-top: 10px;">
                    <button class="btn btn-primary" onclick="CopiesModule.startEdit(${copy.id})">
                        Edit Swaps
                    </button>
                    <button class="btn btn-danger" onclick="CopiesModule.deleteCopy(${copy.id})">
                        Delete Copy
                    </button>
                </div>
            </div>
        `;
    },
    
    renderEditMode(copy) {
        return `
            <div class="copy-card editing" data-copy-id="${copy.id}">
                <div class="item-header">
                    <div>
                        <div class="item-name">${copy.name}</div>
                        <div style="color: var(--gray); font-size: 0.9em;">ID: ${copy.id}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div class="item-location">${copy.location}</div>
                        <span class="permanence-badge ${copy.permanence.toLowerCase()}">
                            ${copy.permanence}
                        </span>
                    </div>
                </div>
                
                <div class="swap-editor">
                    <h4 style="margin: 15px 0 10px 0;">Modify Enhancive Targets:</h4>
                    ${copy.targets.map((target, index) => this.renderSwapRow(target, index, copy.id)).join('')}
                </div>
                
                <div class="button-group" style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="CopiesModule.saveSwaps(${copy.id})">
                        Save Changes
                    </button>
                    <button class="btn btn-secondary" onclick="CopiesModule.cancelEdit()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    },
    
    renderSwapRow(target, index, copyId) {
        const swappableTargets = this.getSwappableTargets(target.target);
        const canSwap = swappableTargets.length > 0;
        
        return `
            <div class="swap-row" data-index="${index}" style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                <div style="display: grid; grid-template-columns: 2fr 2fr 80px 65px; gap: 8px; align-items: center;">
                    <div style="font-weight: 500;">${target.target}</div>
                    
                    ${canSwap ? `
                        <select class="swap-select" data-index="${index}" onchange="CopiesModule.updateAmount(${copyId}, ${index})">
                            <option value="${target.target}" selected>${target.target}</option>
                            ${swappableTargets.map(t => 
                                `<option value="${t}">${t}</option>`
                            ).join('')}
                        </select>
                    ` : `
                        <div style="color: var(--gray); font-style: italic;">No swaps available</div>
                    `}
                    
                    <input type="number" 
                           class="swap-amount" 
                           data-index="${index}"
                           value="${target.amount}" 
                           min="-50" 
                           max="50" 
                           style="width: 100%; padding: 4px;">
                    
                    <div style="color: var(--gray); font-size: 0.9em;">${target.type}</div>
                </div>
                
                <div class="swap-warning" id="warning-${copyId}-${index}" style="color: #e53e3e; font-size: 0.85em; margin-top: 5px; display: none;">
                    ⚠️ Health to Mana/Stamina conversions are halved
                </div>
            </div>
        `;
    },
    
    getSwappableTargets(target) {
        for (const group of Constants.swapGroups) {
            if (group.includes(target)) {
                return group.filter(t => t !== target);
            }
        }
        return [];
    },
    
    updateAmount(copyId, targetIndex) {
        const selectElement = document.querySelector(`.swap-select[data-index="${targetIndex}"]`);
        const amountElement = document.querySelector(`.swap-amount[data-index="${targetIndex}"]`);
        const warningElement = document.getElementById(`warning-${copyId}-${targetIndex}`);
        
        if (!selectElement || !amountElement) return;
        
        const items = DataModule.getItems();
        const copy = items.find(item => item.id === copyId);
        if (!copy) return;
        
        const originalTarget = copy.targets[targetIndex].target;
        const newTarget = selectElement.value;
        const originalAmount = parseInt(copy.targets[targetIndex].amount);
        
        // Check if we need to halve the value
        let shouldHalve = false;
        for (const conversion of Constants.halfValueConversions) {
            if (conversion.from === originalTarget && conversion.to.includes(newTarget)) {
                shouldHalve = true;
                break;
            }
        }
        
        if (shouldHalve) {
            amountElement.value = Math.floor(originalAmount / 2);
            warningElement.style.display = 'block';
        } else {
            amountElement.value = originalAmount;
            warningElement.style.display = 'none';
        }
    },
    
    startEdit(copyId) {
        this.editingCopyId = copyId;
        this.render();
    },
    
    cancelEdit() {
        this.editingCopyId = null;
        this.render();
    },
    
    saveSwaps(copyId) {
        const items = DataModule.getItems();
        const copyIndex = items.findIndex(item => item.id === copyId);
        if (copyIndex === -1) return;
        
        const copy = { ...items[copyIndex] };
        const swapRows = document.querySelectorAll('.swap-row');
        
        swapRows.forEach((row, index) => {
            const selectElement = row.querySelector('.swap-select');
            const amountElement = row.querySelector('.swap-amount');
            
            if (selectElement) {
                copy.targets[index].target = selectElement.value;
            }
            if (amountElement) {
                copy.targets[index].amount = parseInt(amountElement.value);
            }
        });
        
        // Update the item in the data
        items[copyIndex] = copy;
        DataModule.saveItems(items);
        
        this.editingCopyId = null;
        this.render();
        UI.showNotification('Copy updated successfully!', 'success');
    },
    
    deleteCopy(copyId) {
        if (confirm('Are you sure you want to delete this copy?')) {
            const items = DataModule.getItems();
            const filteredItems = items.filter(item => item.id !== copyId);
            DataModule.saveItems(filteredItems);
            
            this.render();
            UI.showNotification('Copy deleted', 'success');
        }
    }
};

// Export for global access
window.CopiesModule = CopiesModule;