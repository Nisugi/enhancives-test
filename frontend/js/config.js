// Configuration
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://enhancives-tracker-api.onrender.com/api',
    AUTO_SAVE_INTERVAL: 30000,
    statCap: 40,
    skillCap: 50,
    resourceCaps: {
        "Max Health": 300,
        "Max Stamina": 300,
        "Max Mana": 600,
        "Max Spirit": 3,
        "Health Recovery": 50,
        "Mana Recovery": 50,
        "Spirit Recovery": 3,
        "Stamina Recovery": 50
    }
};

// Wear locations with slot counts (57 total slots)
const wearLocations = {
    "Pin": 8,
    "Head": 1,
    "Hair": 1,
    "Ear": 3,
    "Ears": 3,
    "Neck": 5,
    "Shoulder": 2,
    "Cloak": 1,
    "Front": 1,
    "Chest": 1,
    "Undershirt": 1,
    "Back": 1,
    "Arm": 1,
    "Wrist": 4,
    "Hands": 1,
    "Finger": 4,
    "Waist": 1,
    "Belt": 3,
    "Legs": 1,
    "Pants": 1,
    "Leggings": 1,
    "Ankle": 1,
    "Feet": 1,
    "Socks": 1,
    "Locus": 1,
    "Tattoo": 1,
    "Right Hand": 1,
    "Left Hand": 1
};

// All valid item locations
const locations = [
    "Pin", "Head", "Hair", "Ear", "Ears", "Neck", "Shoulder", "Cloak", 
    "Front", "Chest", "Undershirt", "Back", "Arm", "Wrist", "Hands", 
    "Finger", "Waist", "Belt", "Legs", "Pants", "Leggings", "Ankle", 
    "Feet", "Socks", "Locus", "Tattoo", "Weapon", "Shield", "Off-Hand"
];

// Resources
const resources = [
    "Max Health", "Max Mana", "Max Spirit", "Max Stamina",
    "Health Recovery", "Mana Recovery", "Spirit Recovery", "Stamina Recovery"
];

// Stats
const stats = [
    "Strength", "Constitution", "Dexterity", "Agility", "Discipline",
    "Aura", "Logic", "Intuition", "Wisdom", "Influence"
];

// Skills organized by category
const skills = {
    "Armor & Weapons": ["Armor Use", "Shield Use"],
    "Combat": [
        "Edged Weapons", "Blunt Weapons", "Two-Handed Weapons", "Ranged Weapons",
        "Thrown Weapons", "Polearm Weapons", "Brawling", "Ambush", 
        "Two Weapon Combat", "Combat Maneuvers", "Multi Opponent Combat",
        "Physical Fitness", "Dodging"
    ],
    "General": [
        "Survival", "Disarming Traps", "Picking Locks", "Stalking and Hiding",
        "Perception", "Climbing", "Swimming", "First Aid", "Trading", "Pickpocketing"
    ],
    "Magic": [
        "Arcane Symbols", "Magic Item Use", "Spell Aiming", "Harness Power",
        "Elemental Mana Control", "Mental Mana Control", "Spirit Mana Control", 
        "Spell Research"
    ],
    "Elemental Lore": [
        "Elemental Lore - Air", "Elemental Lore - Earth", 
        "Elemental Lore - Fire", "Elemental Lore - Water"
    ],
    "Spiritual Lore": [
        "Spiritual Lore - Blessings", "Spiritual Lore - Religion", 
        "Spiritual Lore - Summoning"
    ],
    "Sorcerous Lore": [
        "Sorcerous Lore - Demonology", "Sorcerous Lore - Necromancy"
    ],
    "Mental Lore": [
        "Mental Lore - Divination", "Mental Lore - Manipulation",
        "Mental Lore - Telepathy", "Mental Lore - Transference", 
        "Mental Lore - Transformation"
    ]
};

// Boost types
const boostTypes = ["Base", "Bonus", "Ranks", "Recovery"];

// Permanence types
const permanenceTypes = ["Permanent", "Crumbly"];

