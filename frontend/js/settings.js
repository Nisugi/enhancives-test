// ==================== SETTINGS MODULE ====================
const SettingsModule = (() => {
    const refresh = () => {
        const container = document.getElementById('settingsContent');
        if (!container) return;
        
        const items = DataModule.getItems();
        const equippedItems = DataModule.getEquippedItems();
        
        container.innerHTML = `
            <div class="settings-sections">
                <div class="stat-group">
                    <div class="stat-group-title">Data Management</div>
                    
                    <div style="margin: 20px 0; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <button class="btn btn-primary" onclick="DataModule.exportData()">
                            📥 Export Data
                        </button>
                        <button class="btn btn-primary" onclick="DataModule.importData()">
                            📤 Import Data
                        </button>
                        <button class="btn btn-danger" onclick="DataModule.clearAllData()">
                            🗑️ Clear All Data
                        </button>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <h4 style="margin-bottom: 10px; color: var(--dark);">Statistics</h4>
                        <p style="margin: 5px 0; color: var(--gray);">Total items: <strong>${items.length}</strong></p>
                        <p style="margin: 5px 0; color: var(--gray);">Equipped items: <strong>${equippedItems.length}</strong></p>
                        <p style="margin: 5px 0; color: var(--gray);">Data stored locally in browser</p>
                    </div>
                </div>
                
                <div class="stat-group" style="margin-top: 30px;">
                    <div class="stat-group-title">About</div>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <h4 style="margin-bottom: 10px; color: var(--dark);">Enhancive Tracker Pro</h4>
                        <p style="margin: 5px 0; color: var(--gray);">Version 1.0</p>
                        <p style="margin: 5px 0; color: var(--gray);">Track and manage your GemStone IV enhancive items</p>
                        <p style="margin: 5px 0; color: var(--gray);">Built with ❤️ for the GemStone IV community</p>
                    </div>
                </div>
                
            </div>
        `;
    };
    
    return { 
        init: () => {},
        refresh 
    };
})();