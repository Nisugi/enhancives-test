# Enhancive Tracker Setup Instructions

## Quick Start (Development Mode)

The updated server now works without Supabase for development/testing:

1. **Start the server**:
   ```bash
   cd backend
   npm start
   ```

2. **Open your browser** to `http://localhost:3000`

3. **Test the application**:
   - Create a test account
   - Add some items
   - Data will be stored in memory (lost on restart)

## Full Setup with Supabase (Recommended)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for setup to complete
4. Go to Settings → API
5. Copy your:
   - Project URL
   - Anon (public) key

### 2. Create Database Tables

In your Supabase SQL editor, run:

```sql
-- Users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    slot TEXT,
    permanence TEXT NOT NULL,
    notes TEXT,
    enhancives JSONB DEFAULT '[]',
    available BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace items table
CREATE TABLE marketplace_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    slot TEXT,
    permanence TEXT NOT NULL,
    notes TEXT,
    enhancives JSONB DEFAULT '[]',
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_location ON items(location);
CREATE INDEX idx_marketplace_available ON marketplace_items(available);
CREATE INDEX idx_marketplace_user_id ON marketplace_items(user_id);

-- Row Level Security (optional but recommended)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
```

### 3. Configure Environment Variables

Create `.env` file in the `backend` folder:

```bash
# Copy from .env.example and fill in your values
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
```

### 4. Start with Supabase

```bash
cd backend
npm start
```

You should see:
```
✅ Supabase connected
🚀 Server running on http://localhost:3000
```

## Current Status

### ✅ Working Features
- User registration and login
- Add/edit/delete items
- Equipment management
- Basic statistics
- Data export/import
- Responsive design

### 🚧 In Development Mode
- In-memory storage (data lost on restart)
- Basic functionality for testing

### 🔄 With Supabase
- Persistent data storage
- Multi-user support
- Full marketplace features (when implemented)

## File Organization

```
enhancives/
├── backend/
│   ├── server.js          ← Updated with fallback
│   ├── .env               ← Create this file
│   ├── .env.example       ← Template provided
│   └── package.json
└── frontend/
    ├── index.html
    ├── styles.css
    └── js/
        ├── config.js
        ├── data.js
        ├── auth.js
        ├── ui.js
        ├── items.js
        ├── equipment.js
        └── app.js
```

## Troubleshooting

### Server won't start
- Check if you're in the `backend` folder
- Run `npm install` if dependencies are missing

### CSS not loading
- Make sure you're accessing `http://localhost:3000` (not opening the HTML file directly)
- Check that all files are in the correct folders

### Want to use Supabase later
- Just create the `.env` file with your credentials
- Restart the server
- Data will automatically switch to Supabase

The application now works immediately for testing and can be upgraded to full functionality when you're ready!