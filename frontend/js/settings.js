// Settings module
const SettingsModule = {
    preferences: {
        showNotifications: true,
        autoSave: true,
        compactView: false
    },
     
    init() {
        this.loadPreferences();
        console.log('Settings module initialized');
    },
    
    loadPreferences() {
        const saved = localStorage.getItem('enhanciveTrackerPrefs');
        if (saved) {
            try {
                this.preferences = JSON.parse(saved);
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
            showNotifications: true,
            compactView: false
        };
    },
    
    savePreferences() {
        localStorage.setItem('enhanciveTrackerPrefs', JSON.stringify(this.preferences));
    },
    
    refresh() {
        const container = document.getElementById('settingsTab');
        if (!container) return;
        
        container.innerHTML = `
            <div class="settings-container">
                <h2>Settings</h2>
                
                <div class="settings-section">
                    <h3>Account</h3>
                    <div class="user-info">
                        <p>Logged in as: <strong>${DataManager.currentUser ? DataManager.currentUser.username : 'Not logged in'}</strong></p>
                    </div>
                    <div class="settings-actions">
                        <button class="btn btn-danger" onclick="Auth.logout()">
                            🚪 Logout
                        </button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Data Management</h3>
                    <div class="settings-actions">
                        <button class="btn btn-primary" onclick="SettingsModule.exportData()">
                            💾 Export Data
                        </button>
                        <button class="btn btn-primary" onclick="SettingsModule.importData()">
                            📂 Import Data
                        </button>
                        <button class="btn btn-warning" onclick="SettingsModule.syncData()">
                            🔄 Sync with Server
                        </button>
                        <button class="btn btn-danger" onclick="SettingsModule.clearLocalData()">
                            🗑️ Clear Local Data
                        </button>
                    </div>
                    <p class="help-text">Export your data for backup or import data from a previous backup.</p>
                </div>
                
                <div class="settings-section">
                    <h3>Display Options</h3>
                    <div class="settings-options">
                        <label class="checkbox-label">
                            <input type="checkbox" ${this.preferences.showNotifications ? 'checked' : ''} 
                                   onchange="SettingsModule.togglePreference('showNotifications', this.checked)">
                            Show notifications
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" ${this.preferences.autoSave ? 'checked' : ''} 
                                   onchange="SettingsModule.togglePreference('autoSave', this.checked)">
                            Auto-save changes
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" ${this.preferences.compactView ? 'checked' : ''} 
                                   onchange="SettingsModule.togglePreference('compactView', this.checked)">
                            Compact view
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Statistics</h3>
                    <div class="stats-info">
                        <p>Total items tracked: <strong>${DataManager.items.length}</strong></p>
                        <p>Items equipped: <strong>${DataManager.getEquippedItems().length}</strong></p>
                        <p>Last sync: <strong>${this.getLastSyncTime()}</strong></p>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>About</h3>
                    <p>Enhancive Tracker v2.0</p>
                    <p>Track and manage your GemStone IV enhancive items.</p>
                    <p>Built with ❤️ for the GemStone IV community</p>
                    <div class="settings-actions">
                        <button class="btn btn-secondary" onclick="SettingsModule.showHelp()">
                            ❓ Help & Documentation
                        </button>
                    </div>
                </div>
            </div>
            
            <input type="file" id="importFile" accept=".json" style="display: none;" 
                   onchange="SettingsModule.handleImport(event)">
        `;
    },
    
    togglePreference(key, value) {
        this.preferences[key] = value;
        this.savePreferences();
        UI.showNotification(`${key} ${value ? 'enabled' : 'disabled'}`, 'success');
    },
    
    exportData() {
        const data = {
            items: DataManager.items,
            equipment: DataManager.equipment,
            preferences: this.preferences,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhancive-tracker-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        UI.showNotification('Data exported successfully', 'success');
    },
    
    importData() {
        document.getElementById('importFile').click();
    },
    
    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.items || !Array.isArray(data.items)) {
                    throw new Error('Invalid data format');
                }
                
                // Import the data
                DataManager.items = data.items;
                DataManager.equipment = data.equipment || {};
                
                if (data.preferences) {
                    this.preferences = data.preferences;
                    this.savePreferences();
                }
                
                // Save to server
                await DataManager.saveToServer();
                
                // Refresh UI
                App.refreshAll();
                UI.showNotification('Data imported successfully', 'success');
            } catch (error) {
                console.error('Import failed:', error);
                UI.showNotification('Failed to import data: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = '';
    },
    
    async syncData() {
        try {
            UI.showNotification('Syncing with server...', 'info');
            await DataManager.loadItems();
            App.refreshAll();
            UI.showNotification('Sync completed successfully', 'success');
        } catch (error) {
            UI.showNotification('Sync failed: ' + error.message, 'error');
        }
    },
    
    clearLocalData() {
        if (confirm('Are you sure you want to clear all local data? This will not affect server data.')) {
            localStorage.removeItem('enhanciveTrackerData');
            localStorage.removeItem('enhanciveTrackerPrefs');
            UI.showNotification('Local data cleared', 'info');
            location.reload();
        }
    }
};