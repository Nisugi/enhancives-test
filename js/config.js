// Configuration and constants
const CONFIG = {
    API_BASE_URL: '/api',
    STORAGE_KEY: 'enhanciveTrackerData',
    USER_KEY: 'enhanciveTrackerUser'
};

// Location options for items
const LOCATIONS = [
    'Select Location...',
    'Worn',
    'Private',
    'Bank',
    'Haversack',
    'Backpack',
    'Pouch',
    'Cloak',
    'Other'
];

// Permanent enhancement options
const PERMANENCE_OPTIONS = [
    'Permanent',
    'Temporary'
];

// Enhancement targets and their display names
const ENHANCEMENT_TARGETS = {
    // Stats
    'Strength Base': 'Strength Base',
    'Constitution Base': 'Constitution Base', 
    'Dexterity Base': 'Dexterity Base',
    'Agility Base': 'Agility Base',
    'Discipline Base': 'Discipline Base',
    'Logic Base': 'Logic Base',
    'Intuition Base': 'Intuition Base',
    'Wisdom Base': 'Wisdom Base',
    'Influence Base': 'Influence Base',
    'Aura Base': 'Aura Base',
    
    // Bonuses
    'Strength Bonus': 'Strength Bonus',
    'Constitution Bonus': 'Constitution Bonus',
    'Dexterity Bonus': 'Dexterity Bonus',
    'Agility Bonus': 'Agility Bonus',
    'Discipline Bonus': 'Discipline Bonus',
    'Logic Bonus': 'Logic Bonus',
    'Intuition Bonus': 'Intuition Bonus',
    'Wisdom Bonus': 'Wisdom Bonus',
    'Influence Bonus': 'Influence Bonus',
    'Aura Bonus': 'Aura Bonus',
    
    // Skills - Combat
    'Armor Use Bonus': 'Armor Use Bonus',
    'Shield Use Bonus': 'Shield Use Bonus',
    'Combat Maneuvers Bonus': 'Combat Maneuvers Bonus',
    'Edged Weapons Bonus': 'Edged Weapons Bonus',
    'Blunt Weapons Bonus': 'Blunt Weapons Bonus',
    'Two-Handed Weapons Bonus': 'Two-Handed Weapons Bonus',
    'Ranged Weapons Bonus': 'Ranged Weapons Bonus',
    'Thrown Weapons Bonus': 'Thrown Weapons Bonus',
    'Pole Arm Weapons Bonus': 'Pole Arm Weapons Bonus',
    'Brawling Bonus': 'Brawling Bonus',
    'Ambush Bonus': 'Ambush Bonus',
    'Multi Opponent Combat Bonus': 'Multi Opponent Combat Bonus',
    'Physical Fitness Bonus': 'Physical Fitness Bonus',
    'Dodging Bonus': 'Dodging Bonus',
    
    // Skills - Magic
    'Arcane Symbols Bonus': 'Arcane Symbols Bonus',
    'Magic Item Use Bonus': 'Magic Item Use Bonus',
    'Spell Aiming Bonus': 'Spell Aiming Bonus',
    'Harness Power Bonus': 'Harness Power Bonus',
    'Elemental Mana Control Bonus': 'Elemental Mana Control Bonus',
    'Mental Mana Control Bonus': 'Mental Mana Control Bonus',
    'Spirit Mana Control Bonus': 'Spirit Mana Control Bonus',
    'Spell Research Bonus': 'Spell Research Bonus',
    'Summoning Bonus': 'Summoning Bonus',
    
    // Skills - General
    'Climbing Bonus': 'Climbing Bonus',
    'Swimming Bonus': 'Swimming Bonus',
    'First Aid Bonus': 'First Aid Bonus',
    'Trading Bonus': 'Trading Bonus',
    'Perception Bonus': 'Perception Bonus',
    
    // Skills - Professional
    'Disarming Traps Bonus': 'Disarming Traps Bonus',
    'Picking Locks Bonus': 'Picking Locks Bonus',
    'Stalking and Hiding Bonus': 'Stalking and Hiding Bonus',
    
    // Ranks versions
    'Armor Use Ranks': 'Armor Use Ranks',
    'Shield Use Ranks': 'Shield Use Ranks',
    'Combat Maneuvers Ranks': 'Combat Maneuvers Ranks',
    'Edged Weapons Ranks': 'Edged Weapons Ranks',
    'Blunt Weapons Ranks': 'Blunt Weapons Ranks',
    'Two-Handed Weapons Ranks': 'Two-Handed Weapons Ranks',
    'Ranged Weapons Ranks': 'Ranged Weapons Ranks',
    'Thrown Weapons Ranks': 'Thrown Weapons Ranks',
    'Pole Arm Weapons Ranks': 'Pole Arm Weapons Ranks',
    'Brawling Ranks': 'Brawling Ranks',
    'Ambush Ranks': 'Ambush Ranks',
    'Multi Opponent Combat Ranks': 'Multi Opponent Combat Ranks',
    'Physical Fitness Ranks': 'Physical Fitness Ranks',
    'Dodging Ranks': 'Dodging Ranks',
    'Arcane Symbols Ranks': 'Arcane Symbols Ranks',
    'Magic Item Use Ranks': 'Magic Item Use Ranks',
    'Spell Aiming Ranks': 'Spell Aiming Ranks',
    'Harness Power Ranks': 'Harness Power Ranks',
    'Elemental Mana Control Ranks': 'Elemental Mana Control Ranks',
    'Mental Mana Control Ranks': 'Mental Mana Control Ranks',
    'Spirit Mana Control Ranks': 'Spirit Mana Control Ranks',
    'Spell Research Ranks': 'Spell Research Ranks',
    'Summoning Ranks': 'Summoning Ranks',
    'Climbing Ranks': 'Climbing Ranks',
    'Swimming Ranks': 'Swimming Ranks',
    'First Aid Ranks': 'First Aid Ranks',
    'Trading Ranks': 'Trading Ranks',
    'Perception Ranks': 'Perception Ranks',
    'Disarming Traps Ranks': 'Disarming Traps Ranks',
    'Picking Locks Ranks': 'Picking Locks Ranks',
    'Stalking and Hiding Ranks': 'Stalking and Hiding Ranks'
};

// Equipment slots
const EQUIPMENT_SLOTS = [
    'Head',
    'Neck',
    'Chest',
    'Back',
    'Arms',
    'Wrists',
    'Hands',
    'Right Ring',
    'Left Ring',
    'Waist',
    'Legs',
    'Feet',
    'Right Hand',
    'Left Hand',
    'Ranged'
];

// Enhancement categories for analysis
const ENHANCEMENT_CATEGORIES = {
    'Base Stats': [
        'Strength Base', 'Constitution Base', 'Dexterity Base', 'Agility Base',
        'Discipline Base', 'Logic Base', 'Intuition Base', 'Wisdom Base',
        'Influence Base', 'Aura Base'
    ],
    'Stat Bonuses': [
        'Strength Bonus', 'Constitution Bonus', 'Dexterity Bonus', 'Agility Bonus',
        'Discipline Bonus', 'Logic Bonus', 'Intuition Bonus', 'Wisdom Bonus',
        'Influence Bonus', 'Aura Bonus'
    ],
    'Combat Skills': [
        'Armor Use Bonus', 'Shield Use Bonus', 'Combat Maneuvers Bonus',
        'Edged Weapons Bonus', 'Blunt Weapons Bonus', 'Two-Handed Weapons Bonus',
        'Ranged Weapons Bonus', 'Thrown Weapons Bonus', 'Pole Arm Weapons Bonus',
        'Brawling Bonus', 'Ambush Bonus', 'Multi Opponent Combat Bonus',
        'Physical Fitness Bonus', 'Dodging Bonus'
    ],
    'Magic Skills': [
        'Arcane Symbols Bonus', 'Magic Item Use Bonus', 'Spell Aiming Bonus',
        'Harness Power Bonus', 'Elemental Mana Control Bonus', 'Mental Mana Control Bonus',
        'Spirit Mana Control Bonus', 'Spell Research Bonus', 'Summoning Bonus'
    ],
    'Utility Skills': [
        'Climbing Bonus', 'Swimming Bonus', 'First Aid Bonus', 'Trading Bonus',
        'Perception Bonus', 'Disarming Traps Bonus', 'Picking Locks Bonus',
        'Stalking and Hiding Bonus'
    ]
};

// Enhancement caps
const ENHANCEMENT_CAPS = {
    // Base stats have different caps
    'Strength Base': 5,
    'Constitution Base': 5,
    'Dexterity Base': 5,
    'Agility Base': 5,
    'Discipline Base': 5,
    'Logic Base': 5,
    'Intuition Base': 5,
    'Wisdom Base': 5,
    'Influence Base': 5,
    'Aura Base': 5,
    
    // Bonuses typically cap at 25
    'default_bonus': 25,
    
    // Some skills may have different caps
    'default_ranks': 10
};

// Get enhancement cap for a specific target
function getEnhancementCap(target) {
    if (ENHANCEMENT_CAPS[target]) {
        return ENHANCEMENT_CAPS[target];
    } else if (target.includes('Base')) {
        return 5;
    } else if (target.includes('Bonus')) {
        return ENHANCEMENT_CAPS.default_bonus;
    } else if (target.includes('Ranks')) {
        return ENHANCEMENT_CAPS.default_ranks;
    }
    return 25; // Default cap
}

// Utility functions
const Utils = {
    // Generate unique ID
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    
    // Format numbers
    formatNumber: (num) => num.toLocaleString(),
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Deep clone object
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    
    // Sort items by property
    sortBy: (array, property, direction = 'asc') => {
        return array.sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            if (direction === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    }
};