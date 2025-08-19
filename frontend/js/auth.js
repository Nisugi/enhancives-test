// ==================== AUTH MODULE ====================
const AuthModule = (() => {
    let currentUser = null;
    let authToken = null;
    
    const init = () => {
        // Check for saved auth
        const savedAuth = localStorage.getItem('enhanciveAuth');
        if (savedAuth) {
            try {
                const auth = JSON.parse(savedAuth);
                currentUser = auth.user;
                authToken = auth.token;
                showAuthenticatedUI();
            } catch (e) {
                console.log('No valid auth found, running in local mode');
            }
        }
    };
    
    const showLoginModal = () => {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 15px; max-width: 400px; width: 90%;">
                    <h2 style="margin-bottom: 20px; color: var(--dark);">Login for Marketplace</h2>
                    <div style="margin-bottom: 15px;">
                        <input type="text" id="authUsername" placeholder="Username" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <input type="password" id="authPassword" placeholder="Password" style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 8px;">
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="AuthModule.doLogin()" class="btn btn-primary" style="flex: 1;">Login</button>
                        <button onclick="AuthModule.doRegister()" class="btn btn-success" style="flex: 1;">Register</button>
                        <button onclick="AuthModule.closeModal()" class="btn btn-secondary" style="flex: 1;">Cancel</button>
                    </div>
                    <p style="margin-top: 15px; color: var(--gray); font-size: 0.9em;">
                        Login to access the marketplace and share items with other players
                    </p>
                </div>
            </div>
        `;
        modal.id = 'authModal';
        document.body.appendChild(modal);
    };
    
    const closeModal = () => {
        const modal = document.getElementById('authModal');
        if (modal) modal.remove();
    };
    
    const doLogin = async () => {
        const username = document.getElementById('authUsername').value;
        const password = document.getElementById('authPassword').value;
        
        if (!username || !password) {
            UI.showNotification('Please enter username and password', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${Config.API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser = data.user;
                authToken = data.token;
                
                // Save auth
                localStorage.setItem('enhanciveAuth', JSON.stringify({
                    user: currentUser,
                    token: authToken
                }));
                
                closeModal();
                showAuthenticatedUI();
                UI.showNotification(`Welcome back, ${currentUser.username}!`, 'success');
                
                // Enable marketplace features
                if (typeof MarketplaceModule !== 'undefined') {
                    MarketplaceModule.enable();
                }
            } else {
                UI.showNotification(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            UI.showNotification('Unable to connect to server. You can still use local features.', 'warning');
        }
    };
    
    const doRegister = async () => {
        const username = document.getElementById('authUsername').value;
        const password = document.getElementById('authPassword').value;
        
        if (!username || !password) {
            UI.showNotification('Please enter username and password', 'error');
            return;
        }
        
        if (password.length < 6) {
            UI.showNotification('Password must be at least 6 characters', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${Config.API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                currentUser = data.user;
                authToken = data.token;
                
                // Save auth
                localStorage.setItem('enhanciveAuth', JSON.stringify({
                    user: currentUser,
                    token: authToken
                }));
                
                closeModal();
                showAuthenticatedUI();
                UI.showNotification(`Welcome, ${currentUser.username}! You can now use the marketplace.`, 'success');
                
                // Enable marketplace features
                if (typeof MarketplaceModule !== 'undefined') {
                    MarketplaceModule.enable();
                }
            } else {
                UI.showNotification(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            UI.showNotification('Unable to connect to server. You can still use local features.', 'warning');
        }
    };
    
    const logout = () => {
        currentUser = null;
        authToken = null;
        localStorage.removeItem('enhanciveAuth');
        
        hideAuthenticatedUI();
        UI.showNotification('Logged out successfully', 'success');
        
        // Disable marketplace features
        if (typeof MarketplaceModule !== 'undefined') {
            MarketplaceModule.disable();
        }
    };
    
    const showAuthenticatedUI = () => {
        // Show logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        
        // Show sync button
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) syncBtn.style.display = 'inline-block';
        
        // Hide login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.style.display = 'none';
        
        // Show marketplace tab
        const marketplaceTab = document.getElementById('marketplaceTab');
        if (marketplaceTab) marketplaceTab.style.display = 'inline-block';
        
        // Update user display
        const userDisplay = document.getElementById('currentUser');
        if (userDisplay) userDisplay.textContent = currentUser.username;
    };
    
    const hideAuthenticatedUI = () => {
        // Hide logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Hide sync button
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) syncBtn.style.display = 'none';
        
        // Show login button if it exists
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) loginBtn.style.display = 'inline-block';
        
        // Hide marketplace tab
        const marketplaceTab = document.getElementById('marketplaceTab');
        if (marketplaceTab) marketplaceTab.style.display = 'none';
    };
    
    const syncData = async () => {
        if (!isAuthenticated()) {
            UI.showNotification('Please login to sync data', 'warning');
            showLoginModal();
            return;
        }
        
        try {
            UI.showNotification('Syncing data...', 'info');
            
            // Get local items
            const items = DataModule.getItems();
            
            // Use marketplace sync instead since /items/sync doesn't exist
            if (typeof MarketplaceModule !== 'undefined') {
                await MarketplaceModule.updateMarketplace();
            } else {
                UI.showNotification('Marketplace not available', 'warning');
            }
        } catch (error) {
            console.error('Sync error:', error);
            UI.showNotification('Unable to sync. Check your connection.', 'error');
        }
    };
    
    const isAuthenticated = () => {
        return currentUser !== null && authToken !== null;
    };
    
    const getAuthHeaders = () => {
        if (!isAuthenticated()) return {};
        return { 'Authorization': `Bearer ${authToken}` };
    };
    
    return {
        init,
        showLoginModal,
        closeModal,
        doLogin,
        doRegister,
        logout,
        syncData,
        isAuthenticated,
        getAuthHeaders,
        getCurrentUser: () => currentUser,
        getToken: () => authToken
    };
})();

// Legacy compatibility
const Auth = AuthModule;