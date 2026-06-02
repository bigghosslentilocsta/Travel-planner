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

## Deploy to Render

1. Ensure your repo is pushed to GitHub (Render pulls from your repo).

2. Add `render.yaml` (included) to the repo root — it defines two services: a Node web service (backend) and a Static site (frontend).

3. On Render dashboard, create a new Web Service and Static Site from the `render.yaml` or import the repo; set the following environment variables in the Render service settings (use the example files as reference):

- Backend: see `backend/.env.render.example` (MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN, FIREBASE_* etc.)
- Frontend: see `frontend/.env.production.example` for Vite `VITE_` vars.

4. After setting env vars, enable auto-deploy or trigger a manual deploy. The frontend static site will publish the `dist` folder; the backend will run `npm start` in the `backend` folder.

5. Once deployed, update the backend `CLIENT_ORIGIN` env to your frontend's Render URL to allow CORS and socket connections.

If you prefer Docker-based deployments, I can add Dockerfiles and a `docker-compose.yml` next.
