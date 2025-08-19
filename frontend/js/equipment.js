// ==================== EQUIPMENT MODULE ====================
const EquipmentModule = (() => {
    const init = () => {
        renderEquipmentSlots();
    };
    
    const renderEquipmentSlots = () => {
        const container = document.getElementById('equipmentSlots');
        if (!container) return;
        
        const equipment = DataModule.getEquipment();
        const items = DataModule.getItems();
        let slotIndex = 0;
        
        container.innerHTML = Object.entries(Constants.wearLocations).map(([location, count]) => {
            return Array.from({length: count}, (_, i) => {
                const currentItem = equipment[location] && equipment[location][i];
                const item = currentItem ? items.find(item => item.id === currentItem) : null;
                
                return `
                    <div class="slot-row">
                        <div class="slot-location">${location}</div>
                        <div class="slot-number ${slotIndex >= 40 ? 'premium' : slotIndex >= 50 ? 'platinum' : ''}">${++slotIndex}</div>
                        <select class="slot-item-select ${item ? 'has-item' : ''}" 
                                onchange="EquipmentModule.equipItem('${location}', ${i}, this.value)">
                            <option value="">Empty</option>
                            ${items.map(item => `
                                <option value="${item.id}" ${currentItem === item.id ? 'selected' : ''}>
                                    ${item.name}
                                </option>
                            `).join('')}
                        </select>
                        <div class="slot-status ${item ? 'filled' : 'empty'}">${item ? 'Filled' : 'Empty'}</div>
                        <button class="unequip-btn ${item ? 'active' : ''}" 
                                onclick="EquipmentModule.unequipItem('${location}', ${i})">✕</button>
                    </div>
                `;
            }).join('');
        }).join('');
        
        updateEquippedSummary();
    };
    
    const equipItem = (location, slotIndex, itemId) => {
        DataModule.equipItem(parseInt(itemId) || null, location, slotIndex);
        renderEquipmentSlots();
        StatsModule.updateStats();
        if (typeof TotalsModule !== 'undefined') TotalsModule.refresh();
    };
    
    const unequipItem = (location, slotIndex) => {
        DataModule.unequipItem(location, slotIndex);
        renderEquipmentSlots();
        StatsModule.updateStats();
        if (typeof TotalsModule !== 'undefined') TotalsModule.refresh();
    };
    
    const updateEquippedSummary = () => {
        const container = document.getElementById('equippedSummary');
        if (!container) return;
        
        const totals = DataModule.calculateTotalEnhancements();
        
        if (Object.keys(totals).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No items equipped</h3>
                    <p>Equip items to see enhancement totals</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="summary-title">Active Enhancements</div>
            <div class="summary-grid">
                ${Object.entries(totals).map(([target, value]) => `
                    <div class="summary-item">
                        <span class="summary-target">${target}</span>
                        <span class="summary-value">+${value}</span>
                    </div>
                `).join('')}
            </div>
        `;
    };
    
    return {
        init,
        refresh: renderEquipmentSlots,
        equipItem,
        unequipItem
    };
})();