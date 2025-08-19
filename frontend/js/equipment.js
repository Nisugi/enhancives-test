// ==================== EQUIPMENT MODULE ====================
const EquipmentModule = (() => {
    let showAllItems = {}; // Track which slots have "show all" enabled
    let showMarketplaceItems = {}; // Track which slots show marketplace items
    let marketplaceItems = []; // Cache marketplace items
    
    const init = async () => {
        await loadMarketplaceItems();
        renderEquipmentSlots();
    };
    
    const loadMarketplaceItems = async () => {
        if (!AuthModule.isAuthenticated()) {
            marketplaceItems = [];
            console.log('Not authenticated, clearing marketplace items');
            return;
        }
        
        try {
            console.log('Loading marketplace items...');
            const response = await fetch(`${Config.API_URL}/marketplace/items`, {
                headers: AuthModule.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('Raw marketplace data:', data);
                const currentUser = AuthModule.getCurrentUser();
                // Exclude user's own items
                marketplaceItems = (data || []).filter(item => item.username !== currentUser.username);
                console.log('Filtered marketplace items:', marketplaceItems);
            } else {
                console.error('Failed to fetch marketplace items:', response.status, response.statusText);
                marketplaceItems = [];
            }
        } catch (error) {
            console.error('Failed to load marketplace items:', error);
            marketplaceItems = [];
        }
    };
    
    const renderEquipmentSlots = () => {
        const container = document.getElementById('equipmentSlots');
        if (!container) return;
        
        const equipment = DataModule.getEquipment();
        const items = DataModule.getItems();
        
        // Define premium/platinum rules for each location
        const getSlotLabel = (location, slotIndex, totalSlots) => {
            if (totalSlots === 1) {
                return 'Single';
            }
            
            const slotNum = slotIndex + 1;
            let label = `Slot ${slotNum}`;
            
            // Apply premium/platinum rules based on location
            if (location === 'Pin') {
                // Pin: 1-8, no premium/platinum
                return label;
            } else if (location === 'Ear' || location === 'Ears') {
                // Ear/Ears: 1, 2 (Premium), 3 (Platinum)
                if (slotNum === 2) label += ' (Premium)';
                else if (slotNum === 3) label += ' (Platinum)';
            } else if (location === 'Neck') {
                // Neck: 1-3, 4 (Premium), 5 (Platinum)
                if (slotNum === 4) label += ' (Premium)';
                else if (slotNum === 5) label += ' (Platinum)';
            } else if (location === 'Wrist') {
                // Wrist: 1, 2, 3 (Premium), 4 (Platinum)
                if (slotNum === 3) label += ' (Premium)';
                else if (slotNum === 4) label += ' (Platinum)';
            } else if (location === 'Finger') {
                // Finger: 1, 2, 3 (Premium), 4 (Platinum)
                if (slotNum === 3) label += ' (Premium)';
                else if (slotNum === 4) label += ' (Platinum)';
            } else if (location === 'Belt') {
                // Belt: 1-3, no premium/platinum
                return label;
            } else if (location === 'Shoulder') {
                // Shoulder: 1-2, no premium/platinum
                return label;
            }
            
            return label;
        };
        
        container.innerHTML = Object.entries(Constants.wearLocations).map(([location, count]) => {
            return Array.from({length: count}, (_, i) => {
                const slotKey = `${location}_${i}`;
                const currentItem = equipment[location] && equipment[location][i];
                const item = currentItem ? items.find(item => item.id === currentItem) : null;
                
                // Determine which items to show based on checkboxes
                let availableItems;
                
                if (showMarketplaceItems[slotKey]) {
                    // Show marketplace items
                    console.log(`Showing marketplace items for ${slotKey}, total marketplace items:`, marketplaceItems.length);
                    availableItems = [...marketplaceItems];
                    
                    if (!showAllItems[slotKey]) {
                        // Filter marketplace items by location
                        if (location === 'Right Hand' || location === 'Left Hand') {
                            availableItems = availableItems.filter(item => 
                                item.location === 'Weapon' || 
                                item.location === 'Shield' || 
                                item.location === 'Off-Hand'
                            );
                        } else {
                            availableItems = availableItems.filter(item => item.location === location);
                        }
                        console.log(`Filtered marketplace items for ${location}:`, availableItems.length);
                    }
                } else {
                    // Show user's own items
                    availableItems = items;
                    if (!showAllItems[slotKey]) {
                        // Special handling for hand slots
                        if (location === 'Right Hand' || location === 'Left Hand') {
                            availableItems = items.filter(item => 
                                item.location === 'Weapon' || 
                                item.location === 'Shield' || 
                                item.location === 'Off-Hand'
                            );
                        } else {
                            availableItems = items.filter(item => item.location === location);
                        }
                    }
                }
                
                // Calculate total enhancive value and create summary for each item
                availableItems = availableItems.map(item => {
                    let totalValue = 0;
                    let summary = '';
                    
                    if (item.targets && item.targets.length > 0) {
                        const summaryParts = item.targets.map(target => {
                            let value = target.amount;
                            // Apply same calculation logic as DataModule
                            if (Constants.stats.includes(target.target)) {
                                if (target.type === 'Base') {
                                    value = target.amount * 1;
                                } else if (target.type === 'Bonus') {
                                    value = target.amount * 2;
                                }
                            }
                            totalValue += value;
                            return `${target.target} +${target.amount} ${target.type.toLowerCase()}`;
                        });
                        summary = summaryParts.join(', ');
                    }
                    
                    return {
                        ...item,
                        totalValue,
                        enhanciveSummary: summary,
                        isMarketplaceItem: showMarketplaceItems[slotKey] // Flag to identify marketplace items
                    };
                });
                
                // Sort by total enhancive value (descending)
                availableItems.sort((a, b) => b.totalValue - a.totalValue);
                
                const slotLabel = getSlotLabel(location, i, count);
                const slotType = slotLabel.includes('Premium') ? 'premium' : 
                               slotLabel.includes('Platinum') ? 'platinum' : '';
                
                return `
                    <div class="slot-row">
                        <div class="slot-location">${location}</div>
                        <div class="slot-number ${slotType}">
                            ${slotLabel}
                        </div>
                        <select class="slot-item-select ${item ? 'has-item' : ''}" 
                                onchange="EquipmentModule.equipItem('${location}', ${i}, this.value)">
                            <option value="">Empty</option>
                            ${availableItems.map(availItem => {
                                // Check if item is already equipped elsewhere
                                let isEquippedElsewhere = false;
                                for (const [loc, slots] of Object.entries(equipment)) {
                                    if (slots && slots.includes(availItem.id)) {
                                        if (!(loc === location && slots[i] === availItem.id)) {
                                            isEquippedElsewhere = true;
                                            break;
                                        }
                                    }
                                }
                                
                                // Create display text with total and summary
                                let displayText = availItem.name;
                                if (availItem.totalValue > 0) {
                                    displayText = `(${availItem.totalValue}) ${availItem.name}`;
                                    if (availItem.enhanciveSummary) {
                                        displayText += ` - ${availItem.enhanciveSummary}`;
                                    }
                                }
                                if (availItem.isMarketplaceItem) {
                                    displayText += ` [${availItem.username}]`;
                                } else if (isEquippedElsewhere) {
                                    displayText += ' (equipped)';
                                }
                                
                                return `
                                    <option value="${availItem.id}" 
                                            ${currentItem === availItem.id ? 'selected' : ''}
                                            ${isEquippedElsewhere ? 'disabled' : ''}
                                            title="${displayText}">
                                        ${displayText}
                                    </option>
                                `;
                            }).join('')}
                        </select>
                        <div style="display: flex; gap: 8px; margin-left: 2px;">
                            <label style="display: flex; align-items: center; gap: 2px; font-size: 0.9em;">
                                <input type="checkbox" 
                                       ${showAllItems[slotKey] ? 'checked' : ''}
                                       onchange="EquipmentModule.toggleShowAll('${slotKey}')">
                                All
                            </label>
                            <label style="display: flex; align-items: center; gap: 2px; font-size: 0.9em;">
                                <input type="checkbox" 
                                       ${showMarketplaceItems[slotKey] ? 'checked' : ''}
                                       onchange="EquipmentModule.toggleMarketplace('${slotKey}')"
                                       ${!AuthModule.isAuthenticated() ? 'disabled' : ''}>
                                Market
                            </label>
                        </div>
                        <div class="slot-status ${item ? 'filled' : 'empty'}">${item ? 'Filled' : 'Empty'}</div>
                        <button class="unequip-btn ${item ? 'active' : ''}" 
                                onclick="EquipmentModule.unequipItem('${location}', ${i})">✕</button>
                    </div>
                `;
            }).join('');
        }).join('');
        
        updateEquippedSummary();
    };
    
    const toggleShowAll = (slotKey) => {
        showAllItems[slotKey] = !showAllItems[slotKey];
        renderEquipmentSlots();
    };
    
    const toggleMarketplace = async (slotKey) => {
        showMarketplaceItems[slotKey] = !showMarketplaceItems[slotKey];
        
        // Reload marketplace items when enabling marketplace view
        if (showMarketplaceItems[slotKey]) {
            await loadMarketplaceItems();
        }
        
        renderEquipmentSlots();
    };
    
    const equipItem = (location, slotIndex, itemId) => {
        DataModule.equipItem(parseInt(itemId) || null, location, slotIndex);
        renderEquipmentSlots();
        if (typeof StatsModule !== 'undefined') StatsModule.updateStats();
        if (typeof TotalsModule !== 'undefined') TotalsModule.refresh();
    };
    
    const unequipItem = (location, slotIndex) => {
        DataModule.unequipItem(location, slotIndex);
        renderEquipmentSlots();
        if (typeof StatsModule !== 'undefined') StatsModule.updateStats();
        if (typeof TotalsModule !== 'undefined') TotalsModule.refresh();
    };
    
    const updateEquippedSummary = () => {
        const container = document.getElementById('equippedSummary');
        if (!container) return;
        
        const totals = DataModule.calculateTotalEnhancements();
        const equippedItems = DataModule.getEquippedItems();
        const equipment = DataModule.getEquipment();
        
        // Calculate equipment stats
        const equipmentStats = {
            totalEquipped: equippedItems.length,
            totalTargets: equippedItems.reduce((sum, item) => sum + (item.targets ? item.targets.length : 0), 0),
            filledSlots: Object.values(equipment).flat().filter(slot => slot !== null).length,
            totalEnhancement: Object.values(totals).reduce((sum, value) => sum + Math.abs(value), 0)
        };
        
        if (Object.keys(totals).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No items equipped</h3>
                    <p>Equip items to see enhancement totals</p>
                </div>
            `;
            return;
        }
        
        // Group by category
        const grouped = {
            stats: {},
            skills: {},
            resources: {}
        };
        
        Object.entries(totals).forEach(([target, value]) => {
            if (Constants.stats.includes(target)) {
                grouped.stats[target] = value;
            } else if (Constants.resources.includes(target)) {
                grouped.resources[target] = value;
            } else {
                grouped.skills[target] = value;
            }
        });
        
        container.innerHTML = `
            <div class="equipment-stats" style="background: var(--light); padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                <div style="font-size: 1em; color: var(--dark); font-weight: 600;">
                    ${equipmentStats.filledSlots}/57 slots • ${equipmentStats.totalTargets} targets
                </div>
                <div style="font-size: 1.1em; color: var(--primary); font-weight: bold; margin-top: 5px;">
                    +${equipmentStats.totalEnhancement} enhanced
                </div>
            </div>
            <div class="summary-grid">
                ${Object.keys(grouped.stats).length > 0 ? `
                    <div class="summary-section">
                        <h4 style="color: var(--primary); margin-bottom: 10px;">Stats</h4>
                        ${Object.entries(grouped.stats).map(([target, value]) => `
                            <div class="summary-item">
                                <span class="summary-target">${target}</span>
                                <span class="summary-value">+${value}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${Object.keys(grouped.skills).length > 0 ? `
                    <div class="summary-section">
                        <h4 style="color: var(--primary); margin-bottom: 10px;">Skills</h4>
                        ${Object.entries(grouped.skills).map(([target, value]) => `
                            <div class="summary-item">
                                <span class="summary-target">${target}</span>
                                <span class="summary-value">+${value}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${Object.keys(grouped.resources).length > 0 ? `
                    <div class="summary-section">
                        <h4 style="color: var(--primary); margin-bottom: 10px;">Resources</h4>
                        ${Object.entries(grouped.resources).map(([target, value]) => `
                            <div class="summary-item">
                                <span class="summary-target">${target}</span>
                                <span class="summary-value">+${value}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    };
    
    // ==================== LOADOUTS FUNCTIONALITY ====================
    const getLoadouts = () => {
        return JSON.parse(localStorage.getItem('equipmentLoadouts') || '{}');
    };
    
    const saveLoadouts = (loadouts) => {
        localStorage.setItem('equipmentLoadouts', JSON.stringify(loadouts));
    };
    
    const refreshLoadoutDropdown = () => {
        const select = document.getElementById('loadoutSelect');
        if (!select) return;
        
        const loadouts = getLoadouts();
        const loadoutNames = Object.keys(loadouts);
        
        select.innerHTML = `
            <option value="">Select Loadout...</option>
            ${loadoutNames.map(name => `<option value="${name}">${name}</option>`).join('')}
        `;
    };
    
    const saveLoadout = () => {
        const name = prompt('Enter a name for this loadout:');
        if (!name || name.trim() === '') {
            UI.showNotification('Loadout name cannot be empty', 'warning');
            return;
        }
        
        const trimmedName = name.trim();
        const equipment = DataModule.getEquipment();
        const loadouts = getLoadouts();
        
        // Check if loadout already exists
        if (loadouts[trimmedName]) {
            if (!confirm(`Loadout "${trimmedName}" already exists. Overwrite it?`)) {
                return;
            }
        }
        
        loadouts[trimmedName] = { ...equipment };
        saveLoadouts(loadouts);
        refreshLoadoutDropdown();
        
        UI.showNotification(`Loadout "${trimmedName}" saved!`, 'success');
    };
    
    const loadLoadout = () => {
        const select = document.getElementById('loadoutSelect');
        const loadoutName = select?.value;
        
        if (!loadoutName) {
            UI.showNotification('Please select a loadout to load', 'warning');
            return;
        }
        
        const loadouts = getLoadouts();
        const loadout = loadouts[loadoutName];
        
        if (!loadout) {
            UI.showNotification('Loadout not found', 'error');
            return;
        }
        
        if (!confirm(`Load loadout "${loadoutName}"? This will replace your current equipment.`)) {
            return;
        }
        
        DataModule.saveEquipment(loadout);
        renderEquipmentSlots();
        
        // Refresh related modules
        if (typeof TotalsModule !== 'undefined') TotalsModule.refresh();
        if (typeof StatsModule !== 'undefined') StatsModule.updateStats();
        
        UI.showNotification(`Loadout "${loadoutName}" loaded!`, 'success');
    };
    
    const deleteLoadout = () => {
        const select = document.getElementById('loadoutSelect');
        const loadoutName = select?.value;
        
        if (!loadoutName) {
            UI.showNotification('Please select a loadout to delete', 'warning');
            return;
        }
        
        if (!confirm(`Delete loadout "${loadoutName}"? This cannot be undone.`)) {
            return;
        }
        
        const loadouts = getLoadouts();
        delete loadouts[loadoutName];
        saveLoadouts(loadouts);
        refreshLoadoutDropdown();
        
        UI.showNotification(`Loadout "${loadoutName}" deleted!`, 'success');
    };
    
    const unequipAll = () => {
        if (!confirm('Unequip all items? This will clear all your equipment slots.')) {
            return;
        }
        
        // Create empty equipment structure
        const emptyEquipment = {};
        Constants.locations.forEach(location => {
            const slotCount = Constants.wearLocations[location] || 1;
            emptyEquipment[location] = new Array(slotCount).fill(null);
        });
        
        DataModule.saveEquipment(emptyEquipment);
        renderEquipmentSlots();
        
        // Refresh related modules
        if (typeof TotalsModule !== 'undefined') TotalsModule.refresh();
        if (typeof StatsModule !== 'undefined') StatsModule.updateStats();
        
        UI.showNotification('All items unequipped!', 'success');
    };
    
    return {
        init: async () => {
            await loadMarketplaceItems();
            renderEquipmentSlots();
            refreshLoadoutDropdown();
        },
        refresh: renderEquipmentSlots,
        equipItem,
        unequipItem,
        toggleShowAll,
        toggleMarketplace,
        loadMarketplaceItems,
        saveLoadout,
        loadLoadout,
        deleteLoadout,
        unequipAll,
        refreshLoadoutDropdown
    };
})();