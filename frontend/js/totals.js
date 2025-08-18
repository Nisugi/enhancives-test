// Totals module - displays enhancement totals
const TotalsModule = {
    init() {
        console.log('Totals module initialized');
    },
    
    refresh() {
        const container = document.getElementById('totalsTab');
        if (!container) return;
        
        const totals = DataManager.calculateTotalEnhancements();
        const equipped = DataManager.getEquippedItems();
        
        let html = `
            <div class="totals-container">
                <h2>Enhancement Totals</h2>
                
                <div class="equipped-count">
                    <p>Items Equipped: <strong>${equipped.length}</strong> / ${EQUIPMENT_SLOTS.length} slots</p>
                </div>
                
                <div class="enhancement-grid">
        `;
        
        // Group enhancements by category
        const stats = {};
        const skills = {};
        const other = {};
        
        Object.entries(totals).forEach(([key, value]) => {
            if (CONFIG.STAT_CAPS[key]) {
                stats[key] = value;
            } else if (key.includes('Max') || key.includes('Recovery')) {
                other[key] = value;
            } else {
                skills[key] = value;
            }
        });
        
        // Display Stats
        if (Object.keys(stats).length > 0) {
            html += `
                <div class="enhancement-category">
                    <h3>Statistics</h3>
                    <div class="enhancement-list">
            `;
            
            Object.entries(stats).forEach(([stat, value]) => {
                const cap = CONFIG.STAT_CAPS[stat] || 50;
                const percentage = (value / cap) * 100;
                const isCapped = value >= cap;
                
                html += `
                    <div class="enhancement-item ${isCapped ? 'capped' : ''}">
                        <span class="enhancement-name">${stat}</span>
                        <span class="enhancement-value">+${value}</span>
                        <div class="enhancement-bar">
                            <div class="enhancement-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        ${isCapped ? '<span class="cap-indicator">CAPPED</span>' : ''}
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        // Display Skills
        if (Object.keys(skills).length > 0) {
            html += `
                <div class="enhancement-category">
                    <h3>Skills</h3>
                    <div class="enhancement-list">
            `;
            
            Object.entries(skills).forEach(([skill, value]) => {
                html += `
                    <div class="enhancement-item">
                        <span class="enhancement-name">${skill}</span>
                        <span class="enhancement-value">+${value}</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        // Display Other
        if (Object.keys(other).length > 0) {
            html += `
                <div class="enhancement-category">
                    <h3>Other</h3>
                    <div class="enhancement-list">
            `;
            
            Object.entries(other).forEach(([name, value]) => {
                html += `
                    <div class="enhancement-item">
                        <span class="enhancement-name">${name}</span>
                        <span class="enhancement-value">+${value}</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        if (Object.keys(totals).length === 0) {
            html += '<p class="no-data">No enhancements active. Equip items to see totals.</p>';
        }
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }
};