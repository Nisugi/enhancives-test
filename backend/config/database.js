// config/database.js
const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
let supabase = null;
let devStorage = {
    users: [],
    items: [],
    marketplaceItems: []
};

function initDatabase() {
    if (hasSupabase) {
        const { createClient } = require('@supabase/supabase-js');
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        console.log('✅ Supabase connected');
    } else {
        console.log('⚠️  Running in development mode without Supabase');
        console.log('   Create a .env file with SUPABASE_URL and SUPABASE_ANON_KEY for full functionality');
    }
}

// Helper function to handle database operations
async function dbOperation(operation) {
    if (hasSupabase) {
        return await operation(supabase);
    } else {
        return operation(devStorage);
    }
}

function getDb() {
    return {
        hasSupabase,
        supabase,
        devStorage
    };
}

module.exports = {
    initDatabase,
    dbOperation,
    getDb
};