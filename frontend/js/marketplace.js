// ==================== MARKETPLACE MODULE ====================
const MarketplaceModule = (() => {
    let enabled = false;
    let marketplaceItems = [];
    
    const init = () => {
        // Check if user is authenticated
        if (AuthModule.isAuthenticated()) {
            enable();
        }
    };
    
    const enable = () => {
        enabled = true;
        // Show marketplace tab
        const tab = document.getElementById('marketplaceTab');
        if (tab) tab.style.display = 'inline-block';
    };
    
    const disable = () => {
        enabled = false;
        // Hide marketplace tab
        const tab = document.getElementById('marketplaceTab');
        if (tab) tab.style.display = 'none';
    };
    
    const refresh = async () => {
        const container = document.getElementById('marketplaceContent');
        if (!container) return;
        
        if (!AuthModule.isAuthenticated()) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Login Required</h3>
                    <p>Please login to access the marketplace</p>
                    <button class="btn btn-primary" onclick="AuthModule.showLoginModal()">Login</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="marketplace-layout">
                <div class="panel">
                    <h2 class="section-title">Your Listed Items</h2>
                    <div id="userListings"></div>
                    <button class="btn btn-primary" onclick="MarketplaceModule.updateMarketplace()" style="margin-top: 20px;">
                        🔄 Update Marketplace
                    </button>
                </div>
                
                <div class="panel">
                    <h2 class="section-title">Available Items</h2>
                    <div class="search-bar-container">
                        <input type="text" class="search-bar" placeholder="🔍 Search marketplace..." 
                               onkeyup="MarketplaceModule.searchMarketplace(this.value)">
                        <button class="btn btn-primary" onclick="MarketplaceModule.loadMarketplace()">
                            🔄 Refresh
                        </button>
                    </div>
                    <div id="marketplaceItems"></div>
                </div>
            </div>
        `;
        
        renderUserListings();
        await loadMarketplace();
    };
    
    const renderUserListings = () => {
        const container = document.getElementById('userListings');
        if (!container) return;
        
        const items = DataModule.getItems();
        const listedItems = items.filter(item => item.isListed);
        
        if (listedItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No items listed for marketplace</p>
                    <p style="font-size: 0.9em; color: var(--gray);">
                        Mark items as "Available" in the Items tab to list them
                    </p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = listedItems.map(item => `
            <div class="item-card">
                <div class="item-header">
                    <div class="item-name">${item.name}</div>
                    <button class="btn btn-danger btn-sm" onclick="MarketplaceModule.unlistItem(${item.id})">
                        Unlist
                    </button>
                </div>
                <div class="enhancive-list">
                    ${item.targets.map(t => 
                        `<span class="enhancive-item">${t.target} +${t.amount} ${t.type}</span>`
                    ).join('')}
                </div>
            </div>
        `).join('');
    };
    
    const loadMarketplace = async () => {
        const container = document.getElementById('marketplaceItems');
        if (!container) {
            return;
        }
        
        container.innerHTML = '<div class="loading">Loading marketplace...</div>';
        
        try {
            const response = await fetch(`${Config.API_URL}/marketplace/items`, {
                headers: AuthModule.getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                marketplaceItems = data || [];
                renderMarketplaceItems();
            } else {
                const errorData = await response.json().catch(() => ({}));
                container.innerHTML = `
                    <div class="empty-state">
                        <p>Failed to load marketplace</p>
                        <p style="color: var(--danger);">${errorData.error || 'Server error'}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Marketplace load error:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <p>Unable to connect to marketplace</p>
                    <p style="color: var(--gray);">Check your connection and try again</p>
                </div>
            `;
        }
    };
    
    const renderMarketplaceItems = (searchQuery = '') => {
        const container = document.getElementById('marketplaceItems');
        if (!container) return;
        
        let items = marketplaceItems;
        
        // Filter by search query
        if (searchQuery) {
            items = items.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.targets.some(t => t.target.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No items found</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = items.map(item => `
            <div class="item-card marketplace-item">
                <div class="item-header">
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div style="color: var(--gray); font-size: 0.85em;">
                            Listed by: ${item.username}
                        </div>
                    </div>
                    <div class="item-location">${item.location}</div>
                </div>
                
                <div style="margin: 10px 0;">
                    <span class="permanence-badge ${item.permanence.toLowerCase()}">
                        ${item.permanence}
                    </span>
                </div>
                
                <div class="enhancive-list">
                    ${item.targets.map(t => 
                        `<span class="enhancive-item">${t.target} +${t.amount} ${t.type}</span>`
                    ).join('')}
                </div>
                
                ${item.notes ? `
                    <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 5px; color: var(--gray); font-size: 0.9em; font-style: italic;">
                        ${item.notes}
                    </div>
                ` : ''}
                
                <div style="margin-top: 15px;">
                    <button class="btn btn-primary" onclick="MarketplaceModule.copyItem(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                        📋 Copy to My Items
                    </button>
                </div>
            </div>
        `).join('');
    };
    
    const searchMarketplace = (query) => {
        renderMarketplaceItems(query);
    };
    
    const updateMarketplace = async () => {
        if (!AuthModule.isAuthenticated()) {
            UI.showNotification('Please login to update marketplace', 'warning');
            AuthModule.showLoginModal();
            return;
        }
        
        const items = DataModule.getItems();
        const listedItems = items.filter(item => item.isListed);
        
        // Always proceed with sync to clear unlisted items from database
        const currentUser = AuthModule.getCurrentUser();
        
        try {
            UI.showNotification('Updating marketplace...', 'info');
            
            // Add user info to items for backend - only send essential fields
            const itemsWithUser = listedItems.map(item => ({
                id: item.id,
                name: item.name,
                location: item.location,
                permanence: item.permanence,
                notes: item.notes ? item.notes.substring(0, 500) : '', // Limit notes to 500 chars
                targets: item.targets,
                username: currentUser.username,
                available: true,
                dateAdded: item.dateAdded || new Date().toISOString()
            }));
            
            const response = await fetch(`${Config.API_URL}/marketplace/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...AuthModule.getAuthHeaders()
                },
                body: JSON.stringify({ 
                    items: itemsWithUser,
                    username: currentUser.username // Always send username for deletion
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (listedItems.length === 0) {
                    UI.showNotification('All items removed from marketplace!', 'success');
                } else {
                    UI.showNotification(`${listedItems.length} items updated in marketplace!`, 'success');
                }
                await loadMarketplace(); // Refresh marketplace to show updated state
                renderUserListings(); // Refresh user listings
            } else {
                UI.showNotification('Update failed: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Marketplace update error:', error);
            UI.showNotification('Unable to update marketplace', 'error');
        }
    };
    
    const copyItem = (marketplaceItem) => {
        // Create a new item based on marketplace item
        const newItem = {
            name: marketplaceItem.name + ' (Copy)',
            location: marketplaceItem.location,
            permanence: marketplaceItem.permanence,
            notes: `Copied from ${marketplaceItem.username}'s listing`,
            targets: marketplaceItem.targets,
            isListed: false
        };
        
        DataModule.addItem(newItem);
        UI.showNotification(`${marketplaceItem.name} copied to your items!`, 'success');
        
        // Switch to items tab
        UI.switchTab('items');
    };
    
    const unlistItem = (itemId) => {
        const item = DataModule.getItem(itemId);
        if (item) {
            item.isListed = false;
            DataModule.editItem(itemId, item);
            renderUserListings();
            UI.showNotification(`${item.name} unlisted from marketplace`, 'success');
        }
    };
    
    return {
        init,
        enable,
        disable,
        refresh,
        loadMarketplace,
        updateMarketplace,
        searchMarketplace,
        copyItem,
        unlistItem
    };
})();