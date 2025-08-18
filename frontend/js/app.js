// Main application controller
const App = {
    // Initialize the application
    async init() {
        console.log('Initializing Enhancive Tracker...');
        
        try {
            // Initialize data manager
            DataManager.init();
            
            // Initialize authentication
            Auth.init();
            
            // Initialize stats module (always available)
            StatsModule.init();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            UI.showNotification('Failed to initialize application', 'error');
        }
    },
    
    // Handle global errors
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        let message = 'An unexpected error occurred';
        if (error.message) {
            message = error.message;
        }
        
        UI.showNotification(message, 'error');
    },
    
    // Check for updates or sync data
    async checkForUpdates() {
        try {
            // This could check for application updates or sync data
            console.log('Checking for updates...');
            
            // For now, just refresh data if user is logged in
            if (Auth.isLoggedIn()) {
                await DataManager.loadItems();
                StatsModule.updateStats();
                
                // Refresh current tab
                UI.loadTabContent(UI.currentTab);
            }
        } catch (error) {
            this.handleError(error, 'Update check');
        }
    },
    
    // Save all data
    async saveAll() {
        if (!Auth.isLoggedIn()) {
            UI.showNotification('Please log in to save data', 'error');
            return;
        }
        
        try {
            UI.showNotification('Saving data...', 'info');
            
            // Save any pending changes
            // This is handled automatically by individual save operations
            
            UI.showNotification('Data saved successfully', 'success');
        } catch (error) {
            this.handleError(error, 'Save operation');
        }
    }
};

// Stats module for updating statistics
const StatsModule = {
    init() {
        this.updateStats();
    },
    
    updateStats() {
        if (!Auth.isLoggedIn()) {
            this.clearStats();
            return;
        }
        
        const stats = DataManager.getStats();
        
        this.updateStatValue('totalItems', stats.totalItems);
        this.updateStatValue('totalEquipped', stats.totalEquipped);
        this.updateStatValue('slotsFiltered', stats.slotsFiltered);
        this.updateStatValue('activeEnhancives', stats.activeEnhancives);
        this.updateStatValue('cappedStats', stats.cappedStats);
    },
    
    updateStatValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = Utils.formatNumber(value);
        }
    },
    
    clearStats() {
        const statIds = ['totalItems', 'totalEquipped', 'slotsFiltered', 'activeEnhancives', 'cappedStats'];
        statIds.forEach(id => this.updateStatValue(id, 0));
    }
};

// Simplified modules for tabs that don't exist yet
const TotalsModule = {
    init() {},
    refresh() {
        const container = document.getElementById('totalsTab');
        if (!container) return;
        
        const totals = DataManager.calculateTotalEnhancements();
        
        let content = '<h2>Enhancement Totals</h2>';
        
        if (Object.keys(totals).length === 0) {
            content += '<p>No active enhancements</p>';
        } else {
            content += '<div class="totals-grid">';
            Object.entries(totals).forEach(([target, amount]) => {
                const cap = getEnhancementCap(target);
                const isCapped = amount >= cap;
                content += `
                    <div class="total-item ${isCapped ? 'capped' : ''}">
                        <div class="total-name">${ENHANCEMENT_TARGETS[target] || target}</div>
                        <div class="total-value">+${amount}${isCapped ? ' (CAP)' : ''}</div>
                    </div>
                `;
            });
            content += '</div>';
        }
        
        container.innerHTML = content;
    }
};

const AnalysisModule = {
    init() {},
    refresh() {
        const container = document.getElementById('analysisTab');
        if (!container) return;
        
        container.innerHTML = `
            <h2>Enhancement Analysis</h2>
            <p>Analysis features coming soon!</p>
            <ul>
                <li>Enhancement efficiency analysis</li>
                <li>Gap analysis for missing enhancements</li>
                <li>Optimization recommendations</li>
                <li>Enhancement value calculations</li>
            </ul>
        `;
    }
};

const SettingsModule = {
    init() {},
    refresh() {
        const container = document.getElementById('settingsTab');
        if (!container) return;
        
        container.innerHTML = `
            <h2>Settings & Data Management</h2>
            
            <div class="settings-section">
                <h3>Data Management</h3>
                <div class="settings-actions">
                    <button class="btn btn-primary" onclick="DataManager.exportData()">Export Data</button>
                    <button class="btn btn-secondary" onclick="DataManager.importData()">Import Data</button>
                </div>
                <p class="help-text">Export your data for backup or import data from a previous backup.</p>
            </div>
            
            <div class="settings-section">
                <h3>Account</h3>
                <div class="settings-actions">
                    <button class="btn btn-danger" onclick="Auth.logout()">Logout</button>
                </div>
                <p class="help-text">Logout of your current session.</p>
            </div>
            
            <div class="settings-section">
                <h3>About</h3>
                <p>Enhancive Tracker v1.0</p>
                <p>Track and manage your GemStone IV enhancive items.</p>
            </div>
        `;
    }
};

const MarketplaceModule = {
    init() {},
    refresh() {
        const container = document.getElementById('marketplaceTab');
        if (!container) return;
        
        container.innerHTML = `
            <h2>Marketplace</h2>
            <p>Marketplace features coming soon!</p>
            <ul>
                <li>Share available items with other players</li>
                <li>Browse items available from other players</li>
                <li>Set up trade notifications</li>
                <li>Price tracking and recommendations</li>
            </ul>
        `;
    }
};

// Global error handling
window.addEventListener('error', (event) => {
    App.handleError(event.error, 'Global error handler');
});

window.addEventListener('unhandledrejection', (event) => {
    App.handleError(event.reason, 'Unhandled promise rejection');
});

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl+S to save
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        App.saveAll();
    }
    
    // Ctrl+R to refresh (allow default but also update data)
    if (event.ctrlKey && event.key === 'r') {
        App.checkForUpdates();
    }
    
    // Tab navigation with numbers
    if (event.ctrlKey && event.key >= '1' && event.key <= '6') {
        event.preventDefault();
        const tabs = ['items', 'equipment', 'totals', 'analysis', 'settings', 'marketplace'];
        const tabIndex = parseInt(event.key) - 1;
        if (tabs[tabIndex]) {
            UI.switchTab(tabs[tabIndex]);
        }
    }
});

// Auto-save and sync
setInterval(() => {
    if (Auth.isLoggedIn()) {
        // Auto-save any pending changes
        // This is mainly handled by individual operations
        
        // Optionally sync with server periodically
        // App.checkForUpdates();
    }
}, 300000); // Every 5 minutes

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});