// ==================== MAIN APPLICATION CONTROLLER ====================
const App = (() => {
    let currentTab = 'items';
    
    const init = () => {
        console.log('🚀 Initializing Enhancive Tracker Pro...');
        
        // Initialize core modules
        DataModule.init();
        
        // Initialize auth (check for saved credentials)
        AuthModule.init();
        
        // Initialize feature modules
        ItemsModule.init();
        EquipmentModule.init();
        
        // Initialize marketplace if authenticated
        if (AuthModule.isAuthenticated()) {
            MarketplaceModule.init();
        }
        
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


// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle page unload - data is auto-saved
window.addEventListener('beforeunload', () => {
    console.log('💾 Saving data before page unload...');
});