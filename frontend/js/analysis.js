// Analysis module - provides insights and recommendations
const AnalysisModule = {
    init() {
        console.log('Analysis module initialized');
    },
    
    refresh() {
        const container = document.getElementById('analysisTab');
        if (!container) return;
        
        const analysis = this.analyzeEquipment();
        
        let html = `
            <div class="analysis-container">
                <h2>Equipment Analysis</h2>
                
                ${this.renderSummary(analysis)}
                ${this.renderRecommendations(analysis)}
                ${this.renderStatDistribution(analysis)}
                ${this.renderSlotEfficiency(analysis)}
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    analyzeEquipment() {
        const equipped = DataManager.getEquippedItems();
        const totals = DataManager.calculateTotalEnhancements();
        const emptySlots = EQUIPMENT_SLOTS.filter(slot => !DataManager.equipment[slot]);
        
        // Calculate various metrics
        const analysis = {
            totalItems: DataManager.items.length,
            equippedItems: equipped.length,
            emptySlots: emptySlots,
            totalEnhancements: Object.values(totals).reduce((sum, val) => sum + val, 0),
            cappedStats: Object.entries(totals).filter(([stat, val]) => 
                CONFIG.STAT_CAPS[stat] && val >= CONFIG.STAT_CAPS[stat]
            ),
            nearCappedStats: Object.entries(totals).filter(([stat, val]) => 
                CONFIG.STAT_CAPS[stat] && val >= CONFIG.STAT_CAPS[stat] * 0.8 && val < CONFIG.STAT_CAPS[stat]
            ),
            statDistribution: this.calculateStatDistribution(totals),
            slotEfficiency: this.calculateSlotEfficiency(equipped),
            recommendations: []
        };
        
        // Generate recommendations
        if (emptySlots.length > 0) {
            analysis.recommendations.push({
                type: 'warning',
                text: `You have ${emptySlots.length} empty equipment slot${emptySlots.length > 1 ? 's' : ''}: ${emptySlots.slice(0, 3).join(', ')}${emptySlots.length > 3 ? '...' : ''}`
            });
        }
        
        if (analysis.cappedStats.length > 0) {
            analysis.recommendations.push({
                type: 'success',
                text: `${analysis.cappedStats.length} stat${analysis.cappedStats.length > 1 ? 's are' : ' is'} capped: ${analysis.cappedStats.map(([s]) => s).join(', ')}`
            });
        }
        
        if (analysis.nearCappedStats.length > 0) {
            analysis.recommendations.push({
                type: 'info',
                text: `${analysis.nearCappedStats.length} stat${analysis.nearCappedStats.length > 1 ? 's are' : ' is'} near cap (80%+): ${analysis.nearCappedStats.map(([s]) => s).join(', ')}`
            });
        }
        
        // Check for underutilized items
        const storedItems = DataManager.items.filter(item => 
            item.location === 'Storage' && item.enhancives && item.enhancives.length > 0
        );
        if (storedItems.length > 5) {
            analysis.recommendations.push({
                type: 'info',
                text: `You have ${storedItems.length} enhanced items in storage that could be equipped or sold`
            });
        }
        
        return analysis;
    },
    
    calculateStatDistribution(totals) {
        const distribution = {
            physical: 0,  // STR, CON, DEX, AGI
            mental: 0,    // LOG, INT, WIS, DIS
            hybrid: 0,    // AUR, INF
            skills: 0
        };
        
        Object.entries(totals).forEach(([stat, value]) => {
            if (['Strength', 'Constitution', 'Dexterity', 'Agility'].includes(stat)) {
                distribution.physical += value;
            } else if (['Logic', 'Intuition', 'Wisdom', 'Discipline'].includes(stat)) {
                distribution.mental += value;
            } else if (['Aura', 'Influence'].includes(stat)) {
                distribution.hybrid += value;
            } else {
                distribution.skills += value;
            }
        });
        
        return distribution;
    },
    
    calculateSlotEfficiency(equipped) {
        return equipped.map(item => {
            const enhCount = item.enhancives ? item.enhancives.length : 0;
            const totalBonus = item.enhancives ? 
                item.enhancives.reduce((sum, enh) => sum + (parseInt(enh.amount) || 0), 0) : 0;
            
            return {
                item: item,
                efficiency: totalBonus,
                enhancementCount: enhCount
            };
        }).sort((a, b) => b.efficiency - a.efficiency);
    },
    
    renderSummary(analysis) {
        return `
            <div class="analysis-summary">
                <h3>Summary</h3>
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="summary-label">Total Items</span>
                        <span class="summary-value">${analysis.totalItems}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Equipped</span>
                        <span class="summary-value">${analysis.equippedItems}/${EQUIPMENT_SLOTS.length}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total Enhancements</span>
                        <span class="summary-value">+${analysis.totalEnhancements}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Capped Stats</span>
                        <span class="summary-value">${analysis.cappedStats.length}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderRecommendations(analysis) {
        if (analysis.recommendations.length === 0) {
            return '';
        }
        
        return `
            <div class="analysis-recommendations">
                <h3>Recommendations</h3>
                <div class="recommendations-list">
                    ${analysis.recommendations.map(rec => `
                        <div class="recommendation ${rec.type}">
                            <span class="recommendation-icon">${
                                rec.type === 'warning' ? '⚠️' : 
                                rec.type === 'success' ? '✅' : 'ℹ️'
                            }</span>
                            <span class="recommendation-text">${rec.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    renderStatDistribution(analysis) {
        const dist = analysis.statDistribution;
        const total = dist.physical + dist.mental + dist.hybrid + dist.skills;
        
        if (total === 0) return '';
        
        return `
            <div class="analysis-distribution">
                <h3>Enhancement Distribution</h3>
                <div class="distribution-bars">
                    <div class="dist-bar">
                        <span class="dist-label">Physical</span>
                        <div class="dist-bar-container">
                            <div class="dist-bar-fill physical" style="width: ${(dist.physical/total*100)}%"></div>
                        </div>
                        <span class="dist-value">+${dist.physical}</span>
                    </div>
                    <div class="dist-bar">
                        <span class="dist-label">Mental</span>
                        <div class="dist-bar-container">
                            <div class="dist-bar-fill mental" style="width: ${(dist.mental/total*100)}%"></div>
                        </div>
                        <span class="dist-value">+${dist.mental}</span>
                    </div>
                    <div class="dist-bar">
                        <span class="dist-label">Hybrid</span>
                        <div class="dist-bar-container">
                            <div class="dist-bar-fill hybrid" style="width: ${(dist.hybrid/total*100)}%"></div>
                        </div>
                        <span class="dist-value">+${dist.hybrid}</span>
                    </div>
                    <div class="dist-bar">
                        <span class="dist-label">Skills</span>
                        <div class="dist-bar-container">
                            <div class="dist-bar-fill skills" style="width: ${(dist.skills/total*100)}%"></div>
                        </div>
                        <span class="dist-value">+${dist.skills}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderSlotEfficiency(analysis) {
        const topItems = analysis.slotEfficiency.slice(0, 5);
        
        if (topItems.length === 0) return '';
        
        return `
            <div class="analysis-efficiency">
                <h3>Most Efficient Items</h3>
                <div class="efficiency-list">
                    ${topItems.map((data, index) => `
                        <div class="efficiency-item">
                            <span class="efficiency-rank">#${index + 1}</span>
                            <span class="efficiency-name">${data.item.name}</span>
                            <span class="efficiency-slot">(${data.item.slot})</span>
                            <span class="efficiency-value">+${data.efficiency} total</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};