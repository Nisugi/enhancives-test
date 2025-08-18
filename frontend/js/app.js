// Main application controller for GitHub Pages version
const App = {
    currentTab: 'items',
    
    // Initialize the application
    init() {
        console.log('Initializing Enhancive Tracker...');
        
        // Initialize data manager
        DataManager.init();
        
        // Initialize UI
        UI.init();
        
        // Initialize modules
        ItemsModule.init();
        EquipmentModule.init();
        TotalsModule.init();
        AnalysisModule.init();
        SettingsModule.init();
        
        // Load initial tab
        UI.switchTab('items');
        
        // Update statistics
        this.updateStatistics();
        
        // Auto-save periodically
        setInterval(() => {
            DataManager.saveToStorage();
        }, 30000); // Save every 30 seconds
        
        console.log('Application initialized successfully');
    },
    
    // Update statistics bar
    updateStatistics() {
        const stats = {
            totalItems: DataManager.items.length,
            totalEquipped: DataManager.items.filter(item => item.location === 'Worn').length,
            slotsFiltered: Object.values(DataManager.equipment).filter(item => item !== null).length,
            activeEnhancives: 0,
            cappedStats: 0
        };
        
        // Count active enhancives
        DataManager.getEquippedItems().forEach(item => {
            if (item.enhancives && Array.isArray(item.enhancives)) {
                stats.activeEnhancives += item.enhancives.length;
            }
        });
        
        // Count capped stats (assuming 50 is the cap)
        const totals = DataManager.calculateTotalEnhancements();
        Object.values(totals).forEach(value => {
            if (value >= 50) {
                stats.cappedStats++;
            }
        });
        
        // Update UI
        document.getElementById('totalItems').textContent = stats.totalItems;
        document.getElementById('totalEquipped').textContent = stats.totalEquipped;
        document.getElementById('slotsFiltered').textContent = stats.slotsFiltered;
        document.getElementById('activeEnhancives').textContent = stats.activeEnhancives;
        document.getElementById('cappedStats').textContent = stats.cappedStats;
    },
    
    // Refresh all modules
    refreshAll() {
        this.updateStatistics();
        
        // Refresh current tab
        switch(this.currentTab) {
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
    
    // Handle errors
    handleError(error, context) {
        console.error(`Error in ${context}:`, error);
        UI.showNotification(`Error: ${error.message || 'An unexpected error occurred'}`, 'error');
    }
};

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle page unload - save data
window.addEventListener('beforeunload', () => {
    DataManager.saveToStorage();
});