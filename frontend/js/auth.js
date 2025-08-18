// Authentication module
const Auth = {
    // Show login form
    showLogin() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        this.clearMessage();
    },
    
    // Show register form
    showRegister() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        this.clearMessage();
    },
    
    // Clear login message
    clearMessage() {
        const messageEl = document.getElementById('loginMessage');
        messageEl.innerHTML = '';
        messageEl.className = '';
    },
    
    // Show login message
    showMessage(message, type = 'error') {
        const messageEl = document.getElementById('loginMessage');
        messageEl.innerHTML = message;
        messageEl.className = type;
    },
    
    // Validate login form
    validateLoginForm() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!username) {
            this.showMessage('Username is required');
            return false;
        }
        
        if (!password) {
            this.showMessage('Password is required');
            return false;
        }
        
        return { username, password };
    },
    
    // Validate registration form
    validateRegisterForm() {
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerPasswordConfirm').value;
        
        if (!username) {
            this.showMessage('Username is required');
            return false;
        }
        
        if (username.length < 3) {
            this.showMessage('Username must be at least 3 characters long');
            return false;
        }
        
        if (!password) {
            this.showMessage('Password is required');
            return false;
        }
        
        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters long');
            return false;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match');
            return false;
        }
        
        return { username, password };
    },
    
    // Login function
    async login() {
        const credentials = this.validateLoginForm();
        if (!credentials) return;
        
        try {
            this.showMessage('Logging in...', 'info');
            
            const response = await DataManager.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            if (response.success) {
                DataManager.saveUser(response.user);
                this.showMessage('Login successful!', 'success');
                
                // Load user data and show main app
                await DataManager.loadItems();
                this.showMainApp();
            } else {
                this.showMessage(response.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage(error.message || 'Login failed');
        }
    },
    
    // Register function
    async register() {
        const userData = this.validateRegisterForm();
        if (!userData) return;
        
        try {
            this.showMessage('Creating account...', 'info');
            
            const response = await DataManager.makeRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            if (response.success) {
                DataManager.saveUser(response.user);
                this.showMessage('Account created successfully!', 'success');
                
                // Load user data and show main app
                await DataManager.loadItems();
                this.showMainApp();
            } else {
                this.showMessage(response.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage(error.message || 'Registration failed');
        }
    },
    
    // Logout function
    logout() {
        DataManager.clearUser();
        DataManager.items = [];
        DataManager.equipment = {};
        
        this.showLoginScreen();
        UI.showNotification('Logged out successfully', 'success');
    },
    
    // Show main application
    showMainApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Update current user display
        const currentUserEl = document.getElementById('currentUser');
        if (currentUserEl && DataManager.currentUser) {
            currentUserEl.textContent = DataManager.currentUser.username;
        }
        
        // Initialize modules
        StatsModule.updateStats();
        ItemsModule.refresh();
        EquipmentModule.refresh();
        
        // Clear login form
        this.clearLoginForm();
    },
    
    // Show login screen
    showLoginScreen() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        
        this.showLogin();
        this.clearLoginForm();
    },
    
    // Clear login form
    clearLoginForm() {
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerPasswordConfirm').value = '';
        this.clearMessage();
    },
    
    // Check if user is logged in
    isLoggedIn() {
        return DataManager.currentUser !== null;
    },
    
    // Initialize authentication
    init() {
        DataManager.loadUser();
        
        if (this.isLoggedIn()) {
            // Auto-load user data and show main app
            DataManager.loadItems().then(() => {
                this.showMainApp();
            });
        } else {
            this.showLoginScreen();
        }
        
        // Add enter key listeners
        this.addKeyListeners();
    },
    
    // Add keyboard event listeners
    addKeyListeners() {
        // Login form enter key
        const loginFields = ['loginUsername', 'loginPassword'];
        loginFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.login();
                    }
                });
            }
        });
        
        // Register form enter key
        const registerFields = ['registerUsername', 'registerPassword', 'registerPasswordConfirm'];
        registerFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.register();
                    }
                });
            }
        });
    }
};