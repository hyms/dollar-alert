# DollarAlert 🇧🇴
# ================

A full-stack automated system designed to monitor, store, and notify users about US Dollar (USD) exchange rate fluctuations in the Bolivian market.

📖 Project Overview
-------------------

Due to the current economic context in Bolivia, tracking the exchange rate has become crucial. This project automates that process by scraping reliable sources, storing historical data, and sending real-time alerts via Telegram.

### Key Features

-   **Automated Monitoring:** Periodic checks of official and parallel exchange rates.

-   **Smart Notifications:** Instant Telegram alerts when a significant change is detected.

-   **Interactive Dashboard:** Visual representation of trends and current status.

-   **Scalable Architecture:** Fully containerized microservices-ready structure.

🏗️ Project Structure
---------------------

The repository is divided into two main components:

-   **/DollarBack:** Node.js (Fastify) API, Web Scraper, and Telegram Bot engine.

-   **/DollarUi:** Vue.js 3 frontend with Vuetify 3 components. **Frontend-only project** - does not contain backend logic.

### 🔒 Project Boundaries

**DollarUi (Frontend Only):**
- Visual dashboard for USD/BOB exchange rates
- Vue.js 3 + Vuetify 3 + Pinia architecture
- Supabase client for database connectivity
- No backend API, scraping, or Telegram bot logic
- Communicates with DollarBack via HTTP API

**DollarBack (Backend Only):**
- Data scraping and API endpoints
- Telegram bot automation
- Database operations and business logic
- No Vue.js or frontend components
- Provides REST API for DollarUi consumption

🐳 Docker Execution
-------------------

The entire stack is orchestrated using Docker Compose.

### Prerequisites

-   Docker and Docker Compose installed.

-   A `.env` file in the root with your credentials (Supabase & Telegram).

### Running the Project

To lift both services in development mode:

```bash
# Copy environment configuration
cp .env.example .env
# Edit .env with your credentials

# Start development environment
docker-compose up

# Or start services individually
docker-compose up frontend
docker-compose up backend
```

-   **Frontend:** [http://localhost:5173](http://localhost:5173)

-   **Backend API:** [http://localhost:3000](http://localhost:3000)

-   **Health Check:** [http://localhost:3000/health](http://localhost:3000/health)

### Development without Docker

```bash
# Backend
cd DollarBack
npm install
cp .env.example .env
npm run dev

# Frontend (in another terminal)
cd DollarUi
npm install
cp .env.example .env
npm run dev
```

🛠️ Deployment Workflow
-----------------------

1.  Clone the repository.

2.  Create your `.env` files based on the `.env.example` templates.

3.  Set up your Supabase database:
    - Create a new Supabase project
    - Run the SQL from `DollarUi/database/schema.sql` in the Supabase SQL editor
    - Update your `.env` file with the Supabase credentials

4.  Run `docker-compose up`.

5.  The database schema is shared between both projects in `DollarUi/database/schema.sql`.

### 🔒 Important Notes

**DollarUi is Frontend-Only:**
- This directory contains only Vue.js frontend code
- No server-side logic, database operations, or scraping
- All backend functionality is in `/DollarBack` directory
- Do not attempt to run backend commands from DollarUi

**Security Considerations:**
- Frontend only connects to Supabase via client-side SDK
- Database operations use Row Level Security policies
- No direct database access - all operations go through Supabase
- API calls only connect to DollarBack endpoints, not vice versa
