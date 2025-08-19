// ==================== TOTALS MODULE ====================
const TotalsModule = (() => {
    const refresh = () => {
        const container = document.getElementById('totalsContent');
        if (!container) return;
        
        const totals = DataModule.calculateTotalEnhancements();
        
        if (Object.keys(totals).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No active enhancements</h3>
                    <p>Equip items to see enhancement totals and progress</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="stat-group">
                <div class="stat-group-title">Enhancement Totals</div>
                ${Object.entries(totals).map(([target, value]) => {
                    const cap = Constants.stats.includes(target) ? Constants.statCap : 
                              Constants.resources.includes(target) ? (Constants.resourceCaps[target] || 50) : 
                              Constants.skillCap;
                    const percentage = Math.min((value / cap) * 100, 100);
                    const status = value >= cap ? 'capped' : value >= cap * 0.8 ? 'warning' : 'normal';
                    
                    return `
                        <div class="stat-row">
                            <div class="stat-name">${target}</div>
                            <div class="stat-value ${status}">+${value}</div>
                            <div class="progress-bar">
                                <div class="progress-fill ${status}" style="width: ${percentage}%">
                                    ${percentage.toFixed(0)}%
                                </div>
                            </div>
                            <div class="stat-cap">/ ${cap}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    };
    
    return { 
        init: () => {},
        refresh 
    };
})();