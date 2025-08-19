# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Enhancive Tracker application for GemStone IV, designed to help players track and manage their enhancive items. The application can run in two modes:
- **Development mode**: Uses in-memory storage for testing
- **Production mode**: Uses Supabase for persistent data storage

## Commands

### Backend Development
```bash
cd backend
npm install    # Install dependencies
npm start      # Start the backend server on port 3000 (or PORT env var)
```

### Frontend
The frontend is a static HTML/CSS/JS application served by the backend at `http://localhost:3000`. No separate build process is needed.

### Testing the Application
1. Start the backend server: `cd backend && npm start`
2. Open browser to `http://localhost:3000`
3. Create a test account and add items
4. Data persists in memory (development mode) or Supabase (production mode)

## Architecture

### Backend Structure
- **Express.js** server with CORS enabled for GitHub Pages hosting
- **Modular route structure**: `/routes/auth.js`, `/routes/items.js`, `/routes/marketplace.js`
- **Database abstraction**: `config/database.js` handles both Supabase and in-memory storage
- **Flexible configuration**: Falls back to development mode if Supabase credentials are missing

### Frontend Structure
- **Single-page application** with tab-based navigation
- **Modular JavaScript**: Each feature (items, equipment, totals, analysis, settings) is handled by separate modules
- **Data management**: `DataManager` handles local storage and server sync
- **Responsive design** with gradient styling

### Key Frontend Modules
- `App` - Main application controller and initialization
- `DataManager` - Handles data persistence and synchronization
- `UI` - User interface utilities and notifications
- `ItemsModule`, `EquipmentModule`, `TotalsModule`, `AnalysisModule`, `SettingsModule` - Feature-specific logic

### Database Design
The application uses three main tables:
- `users` - User authentication and profiles
- `items` - User's enhancive items with location tracking
- `marketplace_items` - Items available for trading

### Configuration
- **Environment variables**: Uses `.env` file for Supabase credentials
- **CORS configuration**: Allows GitHub Pages (`nisugi.github.io`) and localhost
- **API endpoints**: All routes prefixed with `/api/`

### Deployment
- **Backend**: Deployed on Render.com with health check endpoint
- **Frontend**: Hosted on GitHub Pages
- **Database**: Supabase PostgreSQL with Row Level Security

## Important Notes

- The application gracefully degrades when Supabase is unavailable
- All data operations go through the `dbOperation` helper in `database.js`
- Frontend uses localStorage for offline capability
- Authentication is JWT-based when using Supabase
- The app supports data export/import functionality for backup and migration