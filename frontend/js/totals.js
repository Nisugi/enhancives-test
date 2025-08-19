// ==================== TOTALS MODULE ====================
const TotalsModule = (() => {
    const refresh = () => {
        const container = document.getElementById('totalsContent');
        const capContainer = document.getElementById('capAnalysis');
        
        const totals = DataModule.calculateTotalEnhancements();
        
        if (Object.keys(totals).length === 0) {
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No active enhancements</h3>
                        <p>Equip items to see enhancement totals and progress</p>
                    </div>
                `;
            }
            if (capContainer) {
                capContainer.innerHTML = `
                    <div class="empty-state">
                        <h3>No cap analysis</h3>
                        <p>Equip items to see cap analysis</p>
                    </div>
                `;
            }
            return;
        }
        
        // Update Enhancement Totals - grouped by category
        if (container) {
            const groupedTotals = groupTotalsByCategory(totals);
            
            container.innerHTML = `
                ${groupedTotals.stats.length > 0 ? `
                    <div class="stat-group">
                        <div class="stat-group-title">Stats</div>
                        ${groupedTotals.stats.map(([target, value]) => {
                            const cap = Constants.statCap;
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
                ` : ''}
                
                ${groupedTotals.resources.length > 0 ? `
                    <div class="stat-group">
                        <div class="stat-group-title">Resources</div>
                        ${groupedTotals.resources.map(([target, value]) => {
                            const cap = Constants.resourceCaps[target] || 50;
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
                ` : ''}
                
                ${groupedTotals.skills.length > 0 ? `
                    <div class="stat-group">
                        <div class="stat-group-title">Skills</div>
                        ${groupedTotals.skills.map(([target, value]) => {
                            const cap = Constants.skillCap;
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
                ` : ''}
            `;
        }
        
        // Update Cap Analysis
        if (capContainer) {
            const analysisData = analyzeCapProgress(totals);
            capContainer.innerHTML = `
                <div class="stat-group">
                    <div class="stat-group-title">Cap Status Overview</div>
                    <div style="margin-bottom: 20px;">
                        <div class="summary-item">
                            <span class="summary-target">Fully Capped</span>
                            <span class="summary-value" style="color: var(--success);">${analysisData.fullyCapped}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-target">Near Cap (80%+)</span>
                            <span class="summary-value" style="color: var(--warning);">${analysisData.nearCap}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-target">Under Cap</span>
                            <span class="summary-value" style="color: var(--info);">${analysisData.underCap}</span>
                        </div>
                    </div>
                </div>
                
                <div class="stat-group">
                    <div class="stat-group-title">Recommendations</div>
                    ${analysisData.recommendations.length > 0 ? 
                        analysisData.recommendations.map(rec => `
                            <div style="padding: 10px; background: var(--light); border-radius: 6px; margin-bottom: 8px; font-size: 0.9em;">
                                ${rec}
                            </div>
                        `).join('') : 
                        '<div style="color: var(--gray); font-style: italic;">No specific recommendations at this time.</div>'
                    }
                </div>
                
                <div class="stat-group">
                    <div class="stat-group-title">Cap Gaps</div>
                    ${analysisData.gaps.map(gap => `
                        <div class="summary-item">
                            <span class="summary-target">${gap.target}</span>
                            <span class="summary-value" style="color: var(--gray);">Need +${gap.needed}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    };
    
    const groupTotalsByCategory = (totals) => {
        const stats = [];
        const skills = [];
        const resources = [];
        
        Object.entries(totals).forEach(([target, value]) => {
            if (Constants.stats.includes(target)) {
                stats.push([target, value]);
            } else if (Constants.resources.includes(target)) {
                resources.push([target, value]);
            } else {
                skills.push([target, value]);
            }
        });
        
        // Sort each group alphabetically
        stats.sort((a, b) => a[0].localeCompare(b[0]));
        resources.sort((a, b) => a[0].localeCompare(b[0]));
        skills.sort((a, b) => a[0].localeCompare(b[0]));
        
        return { stats, skills, resources };
    };
    
    const analyzeCapProgress = (totals) => {
        let fullyCapped = 0;
        let nearCap = 0;
        let underCap = 0;
        const recommendations = [];
        const gaps = [];
        
        Object.entries(totals).forEach(([target, value]) => {
            const cap = Constants.stats.includes(target) ? Constants.statCap : 
                      Constants.resources.includes(target) ? (Constants.resourceCaps[target] || 50) : 
                      Constants.skillCap;
            
            const percentage = (value / cap) * 100;
            const needed = cap - value;
            
            if (value >= cap) {
                fullyCapped++;
                if (value > cap) {
                    recommendations.push(`⚠️ ${target} is overcapped by +${value - cap}. Consider reallocating enhancements.`);
                }
            } else if (percentage >= 80) {
                nearCap++;
                recommendations.push(`🎯 ${target} is near cap. Need +${needed} more to reach cap.`);
                gaps.push({ target, needed });
            } else {
                underCap++;
                gaps.push({ target, needed });
            }
        });
        
        // General recommendations
        if (fullyCapped === 0) {
            recommendations.push('💡 Focus on getting your most important stats to cap first.');
        }
        
        if (underCap > nearCap + fullyCapped) {
            recommendations.push('📈 Consider focusing on fewer stats to reach caps more efficiently.');
        }
        
        return {
            fullyCapped,
            nearCap,
            underCap,
            recommendations,
            gaps: gaps.sort((a, b) => a.needed - b.needed) // Sort by how close to cap
        };
    };
    
    return { 
        init: () => {},
        refresh 
    };
})();