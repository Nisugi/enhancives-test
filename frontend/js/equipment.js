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
    
    return {
        init,
        refresh: renderEquipmentSlots,
        equipItem,
        unequipItem,
        toggleShowAll,
        toggleMarketplace,
        loadMarketplaceItems
    };
})();