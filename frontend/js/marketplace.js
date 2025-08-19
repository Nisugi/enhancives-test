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
            <div class="marketplace-tabs">
                <div class="tab-navigation">
                    <button class="tab-btn active" onclick="MarketplaceModule.switchMarketplaceTab('listings')">
                        📋 My Listings
                    </button>
                    <button class="tab-btn" onclick="MarketplaceModule.switchMarketplaceTab('browse')">
                        🛒 Browse Items
                    </button>
                </div>
                
                <div id="marketplace-listings-tab" class="marketplace-tab-panel active">
                    <div class="panel">
                        <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: stretch;">
                            <button class="btn btn-success" onclick="MarketplaceModule.toggleListAllUnequipped()" style="flex: 1; height: 48px; min-height: 48px;" id="toggleListBtn">
                                📋 List All Unequipped
                            </button>
                            <button class="btn btn-primary" onclick="MarketplaceModule.updateMarketplace()" style="flex: 1; height: 48px; min-height: 48px;">
                                🔄 Update
                            </button>
                        </div>
                        <div id="userListings"></div>
                    </div>
                </div>
                
                <div id="marketplace-browse-tab" class="marketplace-tab-panel">
                    <div class="panel">
                        <div class="search-bar-container" style="margin-bottom: 20px;">
                            <div style="display: flex; gap: 10px; margin-bottom: 10px; align-items: stretch;">
                                <input type="text" class="search-bar" placeholder="🔍 Search marketplace..." 
                                       onkeyup="MarketplaceModule.searchMarketplace(this.value)" style="flex: 2; height: 40px;">
                                <select id="marketplaceSortSelect" onchange="MarketplaceModule.sortMarketplace()" style="flex: 1; height: 40px;">
                                    <option value="">Sort by...</option>
                                    <option value="name">Name</option>
                                    <option value="location">Location</option>
                                    <option value="targets">Enhancive Count</option>
                                    <option value="permanence">Permanence</option>
                                    <option value="total">Total Enhancement</option>
                                    <option value="username">Owner</option>
                                </select>
                                <label style="display: flex; align-items: center; gap: 5px; white-space: nowrap;">
                                    <input type="checkbox" id="marketplaceReverseSort" onchange="MarketplaceModule.sortMarketplace()">
                                    Reverse
                                </label>
                            </div>
                            <button class="btn btn-primary" onclick="MarketplaceModule.loadMarketplace()" style="width: 100%;">
                                🔄 Refresh
                            </button>
                        </div>
                        <div id="marketplaceItems"></div>
                    </div>
                </div>
            </div>
        `;
        
        renderUserListings();
        updateToggleButton();
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
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div class="item-location">${item.location}</div>
                        <span class="permanence-badge ${item.permanence.toLowerCase()}">
                            ${item.permanence}
                        </span>
                    </div>
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
    
    const sortMarketplace = () => {
        const sortBy = document.getElementById('marketplaceSortSelect')?.value;
        const reverse = document.getElementById('marketplaceReverseSort')?.checked || false;
        
        if (!sortBy) {
            renderMarketplaceItems(); // Reset to original order
            return;
        }
        
        let sortedItems = [...marketplaceItems];
        
        switch (sortBy) {
            case 'name':
                sortedItems.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'location':
                sortedItems.sort((a, b) => a.location.localeCompare(b.location));
                break;
            case 'targets':
                sortedItems.sort((a, b) => (b.targets?.length || 0) - (a.targets?.length || 0));
                break;
            case 'permanence':
                // Sort by permanence: Persists, Temporary
                const permOrder = { 'Persists': 0, 'Temporary': 1 };
                sortedItems.sort((a, b) => permOrder[a.permanence] - permOrder[b.permanence]);
                break;
            case 'total':
                // Sort by total enhancement value
                sortedItems.sort((a, b) => {
                    const totalA = a.targets?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
                    const totalB = b.targets?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
                    return totalB - totalA; // Descending order
                });
                break;
            case 'username':
                sortedItems.sort((a, b) => a.username.localeCompare(b.username));
                break;
        }
        
        // Apply reverse if checked
        if (reverse) {
            sortedItems.reverse();
        }
        
        renderSortedMarketplaceItems(sortedItems);
    };
    
    const renderSortedMarketplaceItems = (sortedItems) => {
        const container = document.getElementById('marketplaceItems');
        if (!container) return;
        
        if (sortedItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No marketplace items available</h3>
                    <p>Check back later for new listings</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = sortedItems.map(item => `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <div class="item-name">${item.name}</div>
                        <div style="color: var(--primary); font-size: 0.9em; font-weight: 600;">+${item.targets?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0} total enhancement</div>
                        <div style="color: var(--gray); font-size: 0.85em;">by ${item.username}</div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <div class="item-location">${item.location}</div>
                        <span class="permanence-badge ${item.permanence.toLowerCase()}">
                            ${item.permanence}
                        </span>
                    </div>
                </div>
                
                <div class="enhancive-list">
                    ${item.targets.map(t => 
                        `<span class="enhancive-item">${t.target} ${t.amount > 0 ? '+' : ''}${t.amount} ${t.type}</span>`
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
    
    const listAllUnequipped = () => {
        if (!AuthModule.isAuthenticated()) {
            UI.showNotification('Please login to list items', 'warning');
            AuthModule.showLoginModal();
            return;
        }
        
        const items = DataModule.getItems();
        const equippedItems = DataModule.getEquippedItems();
        const equippedItemIds = new Set(equippedItems.map(item => item.id));
        
        // Find all unequipped items
        const unequippedItems = items.filter(item => !equippedItemIds.has(item.id));
        
        if (unequippedItems.length === 0) {
            UI.showNotification('No unequipped items to list', 'info');
            return;
        }
        
        // Mark all unequipped items as listed
        let listedCount = 0;
        unequippedItems.forEach(item => {
            if (!item.isListed) {
                item.isListed = true;
                DataModule.editItem(item.id, item);
                listedCount++;
            }
        });
        
        if (listedCount === 0) {
            UI.showNotification('All unequipped items are already listed', 'info');
        } else {
            UI.showNotification(`${listedCount} unequipped items marked for listing`, 'success');
            renderUserListings();
            updateToggleButton();
            
            // Refresh items module if visible
            if (typeof ItemsModule !== 'undefined') {
                ItemsModule.refresh();
            }
        }
    };
    
    const unlistAll = () => {
        if (!AuthModule.isAuthenticated()) {
            UI.showNotification('Please login to manage listings', 'warning');
            AuthModule.showLoginModal();
            return;
        }
        
        const items = DataModule.getItems();
        const listedItems = items.filter(item => item.isListed);
        
        if (listedItems.length === 0) {
            UI.showNotification('No items are currently listed', 'info');
            return;
        }
        
        // Unlist all items
        listedItems.forEach(item => {
            item.isListed = false;
            DataModule.editItem(item.id, item);
        });
        
        UI.showNotification(`${listedItems.length} items unlisted from marketplace`, 'success');
        renderUserListings();
        updateToggleButton();
        
        // Refresh items module if visible
        if (typeof ItemsModule !== 'undefined') {
            ItemsModule.refresh();
        }
    };
    
    const toggleListAllUnequipped = () => {
        if (!AuthModule.isAuthenticated()) {
            UI.showNotification('Please login to manage listings', 'warning');
            AuthModule.showLoginModal();
            return;
        }
        
        const items = DataModule.getItems();
        const listedItems = items.filter(item => item.isListed);
        
        // If we have listed items, unlist all. Otherwise, list all unequipped
        if (listedItems.length > 0) {
            unlistAll();
        } else {
            listAllUnequipped();
        }
        
        updateToggleButton();
    };
    
    const updateToggleButton = () => {
        const btn = document.getElementById('toggleListBtn');
        if (!btn) return;
        
        const items = DataModule.getItems();
        const listedItems = items.filter(item => item.isListed);
        
        if (listedItems.length > 0) {
            btn.innerHTML = '📤 Unlist All';
            btn.className = 'btn btn-warning';
        } else {
            btn.innerHTML = '📋 List All Unequipped';
            btn.className = 'btn btn-success';
        }
    };
    
    const switchMarketplaceTab = (tabName) => {
        // Update tab buttons
        document.querySelectorAll('.marketplace-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="MarketplaceModule.switchMarketplaceTab('${tabName}')"]`).classList.add('active');
        
        // Update tab panels
        document.querySelectorAll('.marketplace-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        if (tabName === 'listings') {
            document.getElementById('marketplace-listings-tab').classList.add('active');
        } else if (tabName === 'browse') {
            document.getElementById('marketplace-browse-tab').classList.add('active');
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
        sortMarketplace,
        copyItem,
        unlistItem,
        listAllUnequipped,
        unlistAll,
        toggleListAllUnequipped,
        updateToggleButton,
        switchMarketplaceTab
    };
})();