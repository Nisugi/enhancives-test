// Configuration for production
const CONFIG = {
    // This will be your Render backend URL (we'll update after deployment)
    API_BASE_URL: 'https://enhancive-tracker-api.onrender.com/api',
    
    // Local storage keys
    USER_KEY: 'enhanciveTrackerUser',
    DATA_KEY: 'enhanciveTrackerData',
    
    // Application settings
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    MAX_ENHANCIVES_PER_ITEM: 10,
    
    // Equipment slots
    STAT_CAPS: {
        'Strength': 50,
        'Constitution': 50,
        'Dexterity': 50,
        'Agility': 50,
        'Discipline': 50,
        'Aura': 50,
        'Logic': 50,
        'Intuition': 50,
        'Wisdom': 50,
        'Influence': 50
    }
};

// Equipment slots configuration
const EQUIPMENT_SLOTS = [
    'Head',
    'Neck',
    'Chest',
    'Back',
    'Arms',
    'Hands',
    'Waist',
    'Legs',
    'Feet',
    'Finger (L)',
    'Finger (R)',
    'Wrist (L)',
    'Wrist (R)',
    'Ear (L)',
    'Ear (R)',
    'Weapon',
    'Shield',
    'Misc 1',
    'Misc 2',
    'Misc 3'
];

// Enhancive types
const ENHANCIVE_TYPES = [
    // Stats
    'Strength',
    'Constitution',
    'Dexterity',
    'Agility',
    'Discipline',
    'Aura',
    'Logic',
    'Intuition',
    'Wisdom',
    'Influence',
    
    // Skills
    'Physical Fitness',
    'Arcane Symbols',
    'Magic Item Use',
    'Spell Aiming',
    'Harness Power',
    'Elemental Mana Control',
    'Mental Mana Control',
    'Spirit Mana Control',
    'Sorcerous Lore',
    'Elemental Lore',
    'Spiritual Lore',
    'Mental Lore',
    'Survival',
    'Perception',
    'Climbing',
    'Swimming',
    'First Aid',
    'Trading',
    'Pickpocketing',
    
    // Combat
    'Armor Use',
    'Shield Use',
    'Combat Maneuvers',
    'Edged Weapons',
    'Blunt Weapons',
    'Two-Handed Weapons',
    'Ranged Weapons',
    'Thrown Weapons',
    'Polearm Weapons',
    'Brawling',
    'Ambush',
    'Two Weapon Combat',
    'Combat Focus',
    
    // Other
    'Max Health',
    'Max Mana',
    'Max Stamina',
    'Health Recovery',
    'Mana Recovery',
    'Stamina Recovery'
];