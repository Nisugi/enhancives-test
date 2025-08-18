// UI management module
const UI = {
    currentTab: 'items',
    
    // Switch between tabs
    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const tabContent = document.getElementById(tabName + 'Tab');
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Add active class to selected nav tab
        const navTab = document.querySelector(`[onclick="UI.switchTab('${tabName}')"]`);
        if (navTab) {
            navTab.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // Load tab content
        this.loadTabContent(tabName);
    },
    
    // Load content for specific tab
    loadTabContent(tabName) {
        switch (tabName) {
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
            case 'marketplace':
                MarketplaceModule.refresh();
                break;
        }
    },
    
    // Show notification
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notifications');
        container.appendChild(notification);
        
        // Auto-remove notification
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    },
    
    // Create form group
    createFormGroup(label, input) {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        
        group.appendChild(labelEl);
        group.appendChild(input);
        
        return group;
    },
    
    // Create input element
    createInput(type, value = '', placeholder = '') {
        const input = document.createElement('input');
        input.type = type;
        input.value = value;
        input.placeholder = placeholder;
        return input;
    },
    
    // Create select element
    createSelect(options, selectedValue = '') {
        const select = document.createElement('select');
        
        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option;
            optionEl.textContent = option;
            if (option === selectedValue) {
                optionEl.selected = true;
            }
            select.appendChild(optionEl);
        });
        
        return select;
    },
    
    // Create button
    createButton(text, className = 'btn-primary', onclick = null) {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `btn ${className}`;
        if (onclick) {
            button.onclick = onclick;
        }
        return button;
    },
    
    // Create table
    createTable(headers, data, actions = []) {
        const table = document.createElement('table');
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        if (actions.length > 0) {
            const th = document.createElement('th');
            th.textContent = 'Actions';
            headerRow.appendChild(th);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        data.forEach(row => {
            const tr = document.createElement('tr');
            
            Object.values(row).forEach(cell => {
                const td = document.createElement('td');
                if (typeof cell === 'object' && cell !== null) {
                    td.appendChild(cell);
                } else {
                    td.textContent = cell || '';
                }
                tr.appendChild(td);
            });
            
            // Add action buttons
            if (actions.length > 0) {
                const td = document.createElement('td');
                actions.forEach(action => {
                    const button = this.createButton(action.text, action.className || 'btn-secondary');
                    button.onclick = () => action.onclick(row);
                    td.appendChild(button);
                });
                tr.appendChild(td);
            }
            
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        return table;
    },
    
    // Create modal dialog
    createModal(title, content, actions = []) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 90%;
            max-height: 90%;
            overflow-y: auto;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        `;
        
        // Modal header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e9ecef;
        `;
        
        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.margin = '0';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = () => document.body.removeChild(overlay);
        
        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        
        // Modal body
        const body = document.createElement('div');
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else {
            body.appendChild(content);
        }
        
        // Modal footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e9ecef;
        `;
        
        actions.forEach(action => {
            const button = this.createButton(action.text, action.className || 'btn-primary');
            button.onclick = () => {
                const result = action.onclick();
                if (result !== false) {
                    document.body.removeChild(overlay);
                }
            };
            footer.appendChild(button);
        });
        
        // Add default close button if no actions provided
        if (actions.length === 0) {
            const closeButton = this.createButton('Close', 'btn-secondary');
            closeButton.onclick = () => document.body.removeChild(overlay);
            footer.appendChild(closeButton);
        }
        
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };
        
        document.body.appendChild(overlay);
        return overlay;
    },
    
    // Confirm dialog
    confirm(message, onConfirm, onCancel = null) {
        const actions = [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onclick: () => {
                    if (onCancel) onCancel();
                    return true;
                }
            },
            {
                text: 'Confirm',
                className: 'btn-primary',
                onclick: () => {
                    onConfirm();
                    return true;
                }
            }
        ];
        
        this.createModal('Confirm', message, actions);
    },
    
    // Create loading spinner
    createLoadingSpinner() {
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        `;
        
        // Add CSS animation if not already added
        if (!document.querySelector('#spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        return spinner;
    },
    
    // Format enhancement list for display
    formatEnhancementList(enhancives) {
        if (!enhancives || enhancives.length === 0) {
            return 'None';
        }
        
        return enhancives.map(enh => 
            `${enh.target}: +${enh.amount}`
        ).join(', ');
    },
    
    // Create enhancement input
    createEnhancementInput(enhancement = {}) {
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: center;';
        
        const targetSelect = this.createSelect(Object.keys(ENHANCEMENT_TARGETS), enhancement.target || '');
        targetSelect.style.flex = '2';
        
        const amountInput = this.createInput('number', enhancement.amount || '', 'Amount');
        amountInput.style.flex = '1';
        amountInput.min = '1';
        amountInput.max = '50';
        
        const removeBtn = this.createButton('×', 'btn-danger');
        removeBtn.style.padding = '5px 10px';
        removeBtn.onclick = () => container.remove();
        
        container.appendChild(targetSelect);
        container.appendChild(amountInput);
        container.appendChild(removeBtn);
        
        return {
            container,
            getValues: () => ({
                target: targetSelect.value,
                amount: parseInt(amountInput.value) || 0
            })
        };
    },
    
    // Toggle element visibility
    toggle(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    },
    
    // Show/hide element
    show(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
        }
    },
    
    hide(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    },
    
    // Clear element content
    clearContent(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '';
        }
    },
    
    // Set element content
    setContent(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else {
                element.innerHTML = '';
                element.appendChild(content);
            }
        }
    }
};