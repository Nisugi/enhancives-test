// ==================== UI MODULE ====================
const UI = (() => {
    const switchTab = (tabName) => {
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Refresh content if needed
        if (tabName === 'equipment') {
            EquipmentModule.refresh();
        } else if (tabName === 'totals') {
            TotalsModule.refresh();
        } else if (tabName === 'analysis') {
            AnalysisModule.refresh();
        } else if (tabName === 'settings') {
            SettingsModule.refresh();
        } else if (tabName === 'items') {
            ItemsModule.refresh();
        }
    };
    
    const showNotification = (message, type = 'success') => {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = 'notification show';
        
        const colors = {
            success: 'var(--success)',
            error: 'var(--danger)',
            warning: 'var(--warning)',
            info: 'var(--info)'
        };
        
        notification.style.background = colors[type] || colors.success;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    };
    
    const createTargetOptions = () => {
        let options = '<option value="">Select Target...</option>';
        
        // Add stats
        options += '<optgroup label="Stats">';
        Constants.stats.forEach(stat => {
            options += `<option value="${stat}">${stat}</option>`;
        });
        options += '</optgroup>';
        
        // Add skills by category
        for (const [category, skills] of Object.entries(Constants.skills)) {
            options += `<optgroup label="${category}">`;
            skills.forEach(skill => {
                options += `<option value="${skill}">${skill}</option>`;
            });
            options += '</optgroup>';
        }

        options += '<optgroup label="Resources">';
        Constants.resources.forEach(resource => {
            options += `<option value="${resource}">${resource}</option>`;
        });
        options += '</optgroup>';
        
        return options;
    };

    const createFormGroup = (label, input, required = false) => {
        const group = document.createElement('div');
        group.className = 'form-group';
        
        const labelEl = document.createElement('label');
        labelEl.textContent = label + (required ? ' *' : '');
        
        group.appendChild(labelEl);
        group.appendChild(input);
        
        return group;
    };

    const createInput = (type, value = '', placeholder = '', attributes = {}) => {
        const input = document.createElement('input');
        input.type = type;
        input.value = value;
        input.placeholder = placeholder;
        
        Object.entries(attributes).forEach(([key, val]) => {
            input.setAttribute(key, val);
        });
        
        return input;
    };

    const createSelect = (options, selectedValue = '', attributes = {}) => {
        const select = document.createElement('select');
        
        if (typeof options === 'string') {
            select.innerHTML = options;
        } else {
            options.forEach(option => {
                const optionEl = document.createElement('option');
                if (typeof option === 'object') {
                    optionEl.value = option.value;
                    optionEl.textContent = option.text;
                } else {
                    optionEl.value = option;
                    optionEl.textContent = option;
                }
                
                if (option.value === selectedValue || option === selectedValue) {
                    optionEl.selected = true;
                }
                select.appendChild(optionEl);
            });
        }
        
        Object.entries(attributes).forEach(([key, val]) => {
            select.setAttribute(key, val);
        });
        
        return select;
    };

    const createButton = (text, className = 'btn-primary', onclick = null, attributes = {}) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = `btn ${className}`;
        if (onclick) {
            button.onclick = onclick;
        }
        
        Object.entries(attributes).forEach(([key, val]) => {
            button.setAttribute(key, val);
        });
        
        return button;
    };

    const createTextarea = (value = '', placeholder = '', attributes = {}) => {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.placeholder = placeholder;
        
        Object.entries(attributes).forEach(([key, val]) => {
            textarea.setAttribute(key, val);
        });
        
        return textarea;
    };

    const createElement = (tag, className = '', content = '', attributes = {}) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (content) {
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else {
                element.appendChild(content);
            }
        }
        
        Object.entries(attributes).forEach(([key, val]) => {
            element.setAttribute(key, val);
        });
        
        return element;
    };

    const modal = {
        show: (title, content, actions = []) => {
            const overlay = createElement('div', 'modal-overlay', '', {
                style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2000; display: flex; align-items: center; justify-content: center;'
            });
            
            const modal = createElement('div', 'modal-content', '', {
                style: 'background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;'
            });
            
            const header = createElement('div', 'modal-header', `
                <span>${title}</span>
                <span class="modal-close" style="float: right; font-size: 1.5em; cursor: pointer; color: var(--gray);">&times;</span>
            `);
            
            const body = createElement('div', 'modal-body');
            if (typeof content === 'string') {
                body.innerHTML = content;
            } else {
                body.appendChild(content);
            }
            
            const footer = createElement('div', 'modal-footer', '', {
                style: 'margin-top: 20px; text-align: right;'
            });
            
            actions.forEach(action => {
                const btn = createButton(action.text, action.className || 'btn-primary', action.onclick);
                btn.style.marginLeft = '10px';
                footer.appendChild(btn);
            });
            
            modal.appendChild(header);
            modal.appendChild(body);
            modal.appendChild(footer);
            overlay.appendChild(modal);
            
            // Close handlers
            const closeModal = () => document.body.removeChild(overlay);
            header.querySelector('.modal-close').onclick = closeModal;
            overlay.onclick = (e) => {
                if (e.target === overlay) closeModal();
            };
            
            document.body.appendChild(overlay);
            return overlay;
        },
        
        confirm: (message, onConfirm, onCancel = null) => {
            return UI.modal.show('Confirm', message, [
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
            ]);
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat().format(num);
    };

    const formatPercent = (num, decimals = 1) => {
        return (num * 100).toFixed(decimals) + '%';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString();
    };

    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const throttle = (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showNotification('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            showNotification('Failed to copy to clipboard', 'error');
        }
    };

    const downloadFile = (content, filename, type = 'text/plain') => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        switchTab,
        showNotification,
        createTargetOptions,
        createFormGroup,
        createInput,
        createSelect,
        createButton,
        createTextarea,
        createElement,
        modal,
        formatNumber,
        formatPercent,
        formatDate,
        debounce,
        throttle,
        copyToClipboard,
        downloadFile
    };
})();