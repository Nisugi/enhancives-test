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
        this.switchTab('items');
        
        // Update statistics
        this.updateStatistics();
        
        // Auto-save periodically
        setInterval(() => {
            DataManager.saveToStorage();
        }, 30000); // Save every 30 seconds
        
        console.log('Application initialized successfully');
    },
    
    // Switch between tabs
    switchTab(tabName) {
        this.currentTab = tabName;
        UI.switchTab(tabName);
        
        // Refresh the appropriate module
        switch(tabName) {
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
        
        this.updateStatistics();
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

// Settings module with localStorage preferences
const SettingsModule = {
    init() {
        // Load preferences from localStorage
        this.loadPreferences();
    },
    
    loadPreferences() {
        const prefs = localStorage.getItem('enhanciveTrackerPrefs');
        if (prefs) {
            try {
                this.preferences = JSON.parse(prefs);
            } catch (error) {
                this.preferences = this.getDefaultPreferences();
            }
        } else {
            this.preferences = this.getDefaultPreferences();
        }
    },
    
    getDefaultPreferences() {
        return {
            theme: 'light',
            autoSave: true,
            showNotifications: true
        };
    },
    
    savePreferences() {
        localStorage.setItem('enhanciveTrackerPrefs', JSON.stringify(this.preferences));
    },
    
    refresh() {
        const container = document.getElementById('settingsTab');
        if (!container) return;
        
        container.innerHTML = `
            <h2>Settings</h2>
            
            <div class="settings-section">
                <h3>Data Management</h3>
                <div class="settings-actions">
                    <button class="btn btn-primary" onclick="DataManager.exportData()">
                        💾 Export Data
                    </button>
                    <button class="btn btn-primary" onclick="DataManager.importData()">
                        📂 Import Data
                    </button>
                    <button class="btn btn-danger" onclick="DataManager.clearAllData()">
                        🗑️ Clear All Data
                    </button>
                </div>
                <p class="help-text">Export your data for backup or import data from a previous backup.</p>
            </div>
            
            <div class="settings-section">
                <h3>Display Options</h3>
                <label class="checkbox-label">
                    <input type="checkbox" ${this.preferences.showNotifications ? 'checked' : ''} 
                           onchange="SettingsModule.toggleNotifications(this.checked)">
                    Show notifications
                </label>
            </div>
            
            <div class="settings-section">
                <h3>About</h3>
                <p>Enhancive Tracker v2.0 (GitHub Pages Edition)</p>
                <p>Track and manage your GemStone IV enhancive items.</p>
                <p>All data is stored locally in your browser.</p>
            </div>
        `;
    },
    
    toggleNotifications(enabled) {
        this.preferences.showNotifications = enabled;
        this.savePreferences();
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