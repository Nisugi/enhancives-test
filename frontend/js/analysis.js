// ==================== ANALYSIS MODULE ====================
const AnalysisModule = (() => {
    const refresh = () => {
        const container = document.getElementById('analysisContent');
        if (!container) return;
        
        const items = DataModule.getItems();
        const totals = DataModule.calculateTotalEnhancements();
        const equippedItems = DataModule.getEquippedItems();
        
        const analysis = {
            totalItems: items.length,
            equippedItems: equippedItems.length,
            totalEnhancives: items.reduce((sum, item) => sum + (item.targets ? item.targets.length : 0), 0),
            cappedStats: Object.entries(totals).filter(([target, value]) => {
                if (Constants.stats.includes(target)) {
                    return value >= Constants.statCap;
                } else if (Constants.resources.includes(target)) {
                    return value >= (Constants.resourceCaps[target] || 50);
                } else {
                    return value >= Constants.skillCap;
                }
            }).length
        };
        
        container.innerHTML = `
            <div class="analysis-summary">
                <div class="stat-group">
                    <div class="stat-group-title">Equipment Analysis</div>
                    
                    <div class="stat-row">
                        <div class="stat-name">Total Items</div>
                        <div class="stat-value">${analysis.totalItems}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 100%">Complete</div>
                        </div>
                    </div>
                    
                    <div class="stat-row">
                        <div class="stat-name">Equipped Items</div>
                        <div class="stat-value">${analysis.equippedItems}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(analysis.equippedItems / 57) * 100}%">
                                ${Math.round((analysis.equippedItems / 57) * 100)}%
                            </div>
                        </div>
                    </div>
                    
                    <div class="stat-row">
                        <div class="stat-name">Total Enhancives</div>
                        <div class="stat-value">${analysis.totalEnhancives}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 100%">Active</div>
                        </div>
                    </div>
                    
                    <div class="stat-row">
                        <div class="stat-name">Capped Stats</div>
                        <div class="stat-value capped">${analysis.cappedStats}</div>
                        <div class="progress-bar">
                            <div class="progress-fill capped" style="width: 100%">Optimized</div>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-recommendations">
                    <h3 style="color: var(--dark); margin: 20px 0 10px 0;">Recommendations</h3>
                    ${generateRecommendations(analysis, totals)}
                </div>
            </div>
        `;
    };
    
    const generateRecommendations = (analysis, totals) => {
        const recommendations = [];
        
        if (analysis.equippedItems < 20) {
            recommendations.push("🎯 Consider equipping more items to maximize your enhancement potential");
        }
        
        if (analysis.cappedStats > 0) {
            recommendations.push("✅ Great job! You have capped stats - consider optimizing other areas");
        }
        
        if (Object.keys(totals).length === 0) {
            recommendations.push("📦 Add some items with enhancive targets to get started");
        }
        
        const highValueTargets = Object.entries(totals)
            .filter(([target, value]) => value >= 30)
            .map(([target]) => target);
            
        if (highValueTargets.length > 0) {
            recommendations.push(`🔥 Strong focus areas: ${highValueTargets.slice(0, 3).join(', ')}`);
        }
        
        if (recommendations.length === 0) {
            recommendations.push("📈 Your enhancement setup is looking good! Keep optimizing.");
        }
        
        return recommendations.map(rec => `
            <div style="padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 6px; color: var(--dark);">
                ${rec}
            </div>
        `).join('');
    };
    
    return { 
        init: () => {},
        refresh 
    };
})();