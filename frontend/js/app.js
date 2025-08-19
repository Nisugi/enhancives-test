// ==================== MAIN APPLICATION CONTROLLER ====================
const App = (() => {
    let currentTab = 'items';
    
    const init = () => {
        console.log('🚀 Initializing Enhancive Tracker Pro...');
        
        // Initialize core modules
        DataModule.init();
        
        // Initialize feature modules
        ItemsModule.init();
        
        // Initialize statistics
        StatsModule.updateStats();
        
        // Auto-save every 30 seconds
        setInterval(() => {
            // Auto-save happens in DataModule
        }, 30000);
        
        console.log('✅ Application initialized successfully');
    };
    
    const switchTab = (tabName) => {
        currentTab = tabName;
        UI.switchTab(tabName);
    };
    
    return {
        init,
        switchTab,
        getCurrentTab: () => currentTab
    };
})();

// ==================== STATS MODULE ====================
const StatsModule = (() => {
    const updateStats = () => {
        const items = DataModule.getItems();
        const equipment = DataModule.getEquipment();
        const totals = DataModule.calculateTotalEnhancements();
        
        // Calculate statistics
        const stats = {
            totalItems: items.length,
            totalEquipped: DataModule.getEquippedItems().length,
            filledSlots: Object.values(equipment).flat().filter(slot => slot !== null).length,
            totalEnhancives: items.reduce((sum, item) => sum + (item.targets ? item.targets.length : 0), 0),
            cappedStats: Object.entries(totals).filter(([target, value]) => {
                if (Constants.stats.includes(target)) {
                    return value >= Constants.statCap;
                } else if (Constants.resources.includes(target)) {
                    return value >= (Constants.resourceCaps[target] || 50);
                } else {
                    return value >= Constants.skillCap;
                }
            }).length
        };
        
        // Update DOM
        const elements = {
            'totalItems': stats.totalItems,
            'totalEquipped': stats.totalEquipped,
            'filledSlots': stats.filledSlots,
            'totalEnhancives': stats.totalEnhancives,
            'cappedStats': stats.cappedStats
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    };
    
    return {
        updateStats
    };
})();

// ==================== EQUIPMENT MODULE (STUB) ====================
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

// ==================== TOTALS MODULE (STUB) ====================
const TotalsModule = (() => {
    const refresh = () => {
        const container = document.getElementById('totalsContent');
        if (!container) return;
        
        const totals = DataModule.calculateTotalEnhancements();
        
        container.innerHTML = `
            <div class="stat-group">
                <div class="stat-group-title">Enhancement Totals</div>
                ${Object.entries(totals).map(([target, value]) => {
                    const cap = Constants.stats.includes(target) ? Constants.statCap : 
                              Constants.resources.includes(target) ? (Constants.resourceCaps[target] || 50) : 
                              Constants.skillCap;
                    const percentage = Math.min((value / cap) * 100, 100);
                    const status = value >= cap ? 'capped' : value >= cap * 0.8 ? 'warning' : 'normal';
                    
                    return `
                        <div class="stat-row">
                            <div class="stat-name">${target}</div>
                            <div class="stat-value ${status}">+${value}</div>
                            <div class="progress-bar">
                                <div class="progress-fill ${status}" style="width: ${percentage}%">
                                    ${percentage.toFixed(0)}%
                                </div>
                            </div>
                            <div class="stat-cap">/ ${cap}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    };
    
    return { refresh };
})();

// ==================== ANALYSIS MODULE (STUB) ====================
const AnalysisModule = (() => {
    const refresh = () => {
        const container = document.getElementById('analysisContent');
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <h3>Analysis Coming Soon</h3>
                <p>Advanced analysis and optimization features will be available here</p>
            </div>
        `;
    };
    
    return { refresh };
})();

// ==================== SETTINGS MODULE (STUB) ====================
const SettingsModule = (() => {
    const refresh = () => {
        const container = document.getElementById('settingsContent');
        if (!container) return;
        
        container.innerHTML = `
            <div class="form-group">
                <h3>Data Management</h3>
                <button class="btn btn-primary" onclick="DataModule.exportData()">📥 Export Data</button>
                <button class="btn btn-primary" onclick="DataModule.importData()">📤 Import Data</button>
                <button class="btn btn-danger" onclick="DataModule.clearAllData()">🗑️ Clear All Data</button>
            </div>
        `;
    };
    
    return { refresh };
})();

// ==================== AUTH MODULE (STUB) ====================
const AuthModule = (() => {
    const syncData = () => {
        UI.showNotification('Sync functionality coming soon!', 'info');
    };
    
    const logout = () => {
        UI.showNotification('Logout functionality coming soon!', 'info');
    };
    
    return { syncData, logout };
})();

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle page unload - data is auto-saved
window.addEventListener('beforeunload', () => {
    console.log('💾 Saving data before page unload...');
});