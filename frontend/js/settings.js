// ==================== SETTINGS MODULE ====================
const SettingsModule = (() => {
    const refresh = () => {
        const container = document.getElementById('settingsContent');
        if (!container) return;
        
        try {
            const items = DataModule.getItems();
            const equippedItems = DataModule.getEquippedItems();
            const isLoggedIn = typeof AuthModule !== 'undefined' ? AuthModule.isAuthenticated() : false;
            
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
                    
                    ${isLoggedIn ? `
                    <div style="background: #e6fffa; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #00b5d8;">
                        <h4 style="margin-bottom: 10px; color: var(--dark);">☁️ Cloud Sync</h4>
                        <p style="margin: 5px 0 15px 0; color: var(--gray); font-size: 0.9em;">
                            Save your items to the cloud to access them from any device
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <button class="btn btn-primary" onclick="SettingsModule.syncToCloud()">
                                ⬆️ Save to Cloud
                            </button>
                            <button class="btn btn-primary" onclick="SettingsModule.syncFromCloud()">
                                ⬇️ Load from Cloud
                            </button>
                        </div>
                        <div id="syncStatus" style="margin-top: 10px; font-size: 0.85em; color: var(--gray);"></div>
                    </div>
                    ` : `
                    <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fc8181;">
                        <h4 style="margin-bottom: 10px; color: var(--dark);">☁️ Cloud Sync</h4>
                        <p style="margin: 5px 0; color: var(--gray); font-size: 0.9em;">
                            Login to enable cloud sync and access your items from any device
                        </p>
                    </div>
                    `}
                    
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
        } catch (error) {
            console.error('Settings render error:', error);
            container.innerHTML = `
                <div style="color: red; padding: 20px;">
                    Error loading settings: ${error.message}
                </div>
            `;
        }
    };
    
    const syncToCloud = async () => {
        const statusEl = document.getElementById('syncStatus');
        if (statusEl) statusEl.innerHTML = '⏳ Saving to cloud...';
        
        try {
            const items = DataModule.getItems();
            const equipment = DataModule.getEquipment();
            const token = AuthModule.getToken();
            
            console.log('Sync token being sent:', token);
            console.log('Token type:', typeof token);
            console.log('Token length:', token?.length);
            
            const response = await fetch(`${Config.API_URL}/items/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items, equipment })
            });
            
            if (!response.ok) throw new Error('Failed to sync');
            
            const result = await response.json();
            
            if (statusEl) {
                statusEl.innerHTML = `✅ Saved to cloud! ${items.length} items synced at ${new Date().toLocaleTimeString()}`;
            }
            UI.showNotification('Data saved to cloud successfully!', 'success');
        } catch (error) {
            console.error('Sync error:', error);
            if (statusEl) statusEl.innerHTML = '❌ Failed to save to cloud';
            UI.showNotification('Failed to save to cloud', 'error');
        }
    };
    
    const syncFromCloud = async () => {
        const statusEl = document.getElementById('syncStatus');
        
        if (!confirm('This will replace your local data with data from the cloud. Continue?')) {
            return;
        }
        
        if (statusEl) statusEl.innerHTML = '⏳ Loading from cloud...';
        
        try {
            const token = AuthModule.getToken();
            
            console.log('=== FRONTEND SYNC LOAD ===');
            console.log('Token:', token);
            console.log('API URL:', `${Config.API_URL}/items/sync`);
            
            const response = await fetch(`${Config.API_URL}/items/sync`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', response.status, errorText);
                throw new Error(`Failed to sync: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.items && data.items.length > 0) {
                // Save the cloud data locally
                DataModule.saveItems(data.items);
                
                if (data.equipment) {
                    DataModule.saveEquipment(data.equipment);
                }
                
                // Refresh all modules
                if (typeof ItemsModule !== 'undefined') ItemsModule.refresh();
                if (typeof EquipmentModule !== 'undefined') EquipmentModule.refresh();
                if (typeof TotalsModule !== 'undefined') TotalsModule.refresh();
                if (typeof CopiesModule !== 'undefined') CopiesModule.init();
                
                if (statusEl) {
                    statusEl.innerHTML = `✅ Loaded from cloud! ${data.items.length} items restored at ${new Date().toLocaleTimeString()}`;
                }
                UI.showNotification(`Loaded ${data.items.length} items from cloud!`, 'success');
            } else {
                if (statusEl) statusEl.innerHTML = '⚠️ No data found in cloud';
                UI.showNotification('No data found in cloud', 'warning');
            }
        } catch (error) {
            console.error('Sync error:', error);
            if (statusEl) statusEl.innerHTML = '❌ Failed to load from cloud';
            UI.showNotification('Failed to load from cloud', 'error');
        }
    };
    
    return { 
        init: () => {},
        refresh,
        syncToCloud,
        syncFromCloud
    };
})();