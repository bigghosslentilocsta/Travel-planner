# Collaborative Group Travel Itinerary Planner

Decoupled MERN + Socket.io app scaffold with a modular backend and a Vite + React TypeScript frontend.

## Directory Structure

```text
Travel planner/
  backend/
    src/
      config/
        db.js
      controllers/
        auth.controller.js
        expense.controller.js
        itinerary.controller.js
        trip.controller.js
      middleware/
        auth.js
        errorHandler.js
      models/
        User.js
        Trip.js
        Itinerary.js
        Expense.js
      routes/
        auth.routes.js
        trip.routes.js
        itinerary.routes.js
        expense.routes.js
      socket/
        index.js
      utils/
        calculateSettlements.js
      server.js
    package.json
    .env.example

  frontend/
    src/
      api/
        client.ts
      components/
        dashboard/
          TripGrid.tsx
          ItineraryBoard.tsx
          ExpensePanel.tsx
        layout/
          Sidebar.tsx
      hooks/
        useSocket.ts
      pages/
        TripDashboardPage.tsx
      store/
        usePlannerStore.ts
      types/
        index.ts
      App.tsx
      main.tsx
      index.css
    package.json
    tailwind.config.js
    postcss.config.js
    vite.config.ts
    index.html
```

## Quick Start

1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

2. Frontend

```bash
cd frontend
npm install
npm run dev
```

3. Auth Flow
- Call `POST /api/auth/signup` or `POST /api/auth/login`
- Paste the JWT token into the frontend prompt to enter the dashboard.

## Real-Time Events
- `trip:join`, `trip:leave`
- Server broadcasts: `itinerary:updated`, `expense:updated`

## Notes
- This scaffold is intentionally modular to allow adding role-based permissions, email invite workflows, and richer drag-and-drop libraries (e.g. dnd-kit) without refactors.
