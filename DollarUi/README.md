DollarUi
========

📝 Description
--------------

The visual layer of the DollarAlert ecosystem. It provides a real-time dashboard for users to visualize currency exchange rate trends in the Bolivian market and manage their notification preferences. Built to be professional, fast, and administrative-ready.

🎯 Purpose
----------

In the current economic context of Bolivia, tracking exchange rates is essential. DollarUi provides:

-   **Real-time Visualization**: Clean dashboard displaying current official and parallel exchange rates using Material Design.

-   **Trend Analysis**: Interactive charts showing historical data and market fluctuations.

-   **Multi-Currency Support**: Focus on USD/BOB by default, with an interface to add and monitor other currency pairs.

-   **User Subscription**: Interface for registering Telegram IDs to receive automated alerts.

-   **Administrative Control**: Secure area to manage site-wide configurations.

🚀 Tech Stack & Libraries
-------------------------

-   **Framework**: Vue.js 3 (Composition API)

-   **UI Library**: [Vuetify 3](https://vuetifyjs.com/ "null") (Material Design Framework)

-   **State Management**: Pinia (Modules: `exchangeRates`, `auth`, `config`)

-   **HTTP Client**: Axios

-   **Charts**: Chart.js with Vue Chart.js integration

-   **Database & Auth**: Supabase (Postgres + GoTrue for Auth)

-   **Icons**: Material Design Icons (MDI)

-   **Build Tool**: Vite

-   **TypeScript**: Full type safety for exchange rate interfaces.

🛠️ How to Run
--------------

### Development (Docker)

```
# From project root
docker-compose up frontend

```

The frontend will be available at `http://localhost:5173`

### Development (Local)

```
cd DollarUi
npm install
npm run dev

```

📱 Features & Views
-------------------

### 🏛️ 1. Exchange Rate Dashboard (`/`)

-   **Live Cards**: Real-time tracking of official (BCB) and parallel rates.

-   **Currency Toggle**: Focus on USD by default, with a "Add/Switch Currency" selector.

-   **Quick Stats**: Buy/Sell spread calculations and last update timestamp.

### 📈 2. Historical Trends (`/history`)

-   **Time Range Selector**: 7d, 30d, 90d, and 1y filters.

-   **Comparison Mode**: Compare the parallel rate growth against official inflation or other currencies.

-   **Export Data**: Option to download history in CSV/JSON.

### 🔔 3. Telegram Alerts (`/notifications`)

-   **Subscription Form**: Link Telegram Chat ID with specific currency pairs.

-   **Threshold Settings**: Visual sliders to set alert triggers.

### 🔐 4. Admin Portal (`/admin`)

-   **Auth Gateway**: Login screen requiring credentials (managed via Supabase Auth).

-   **Site Configuration Form**:

    -   **Global Settings**: Site title, maintenance mode toggle.

    -   **Scraper Config**: Frequency of updates and data source URLs.

    -   **Notification Rules**: Global thresholds for "Extreme Volatility" alerts.

    -   **Currency Management**: CRUD for available currency pairs (EUR, CLP, BRL, etc.).

🗂️ Project Structure (OpenCode.ai Base)
----------------------------------------

```
DollarUi/
├── src/
│   ├── api/              # Axios instances and endpoint definitions
│   │   ├── index.ts      # Base API configuration
│   │   ├── services.ts   # API service methods
│   │   └── supabase.ts  # Supabase client setup
│   ├── assets/           # Global styles and branding images
│   ├── components/
│   │   ├── admin/        # ConfigForm.vue, AuthGuard.vue
│   │   ├── dashboard/    # RateCard.vue, CurrencySelector.vue
│   │   └── shared/       # AppToolbar.vue, Footer.vue, TrendChart.vue
│   ├── layouts/          # DefaultLayout.vue, AdminLayout.vue
│   ├── plugins/          # vuetify.ts, pinia.ts
│   ├── router/           # index.ts (Guarded /admin routes)
│   ├── stores/           # auth.ts, exchangeRates.ts, settings.ts
│   ├── types/            # index.d.ts (Interfaces for Rates, Users, Config)
│   ├── views/
│   │   ├── AdminView.vue    # Settings and Administration
│   │   ├── DashboardView.vue # Main User Dashboard
│   │   ├── HistoryView.vue  # Historical data view
│   │   ├── SettingsView.vue # User preferences
│   │   └── NotFoundView.vue # 404 page
│   ├── App.vue           # Main entry point
│   └── main.ts           # Global setup
├── database/
│   └── schema.sql        # Shared database schema (migrated from DollarBack)
├── .env.example          # Environment variables template
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration

```

🔌 Environment Variables
------------------------

Create a `.env` file based on `.env.example`:

```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_ADMIN_URL_PATH=/admin # Customizable admin path

```

🗄️ Database Schema
-----------------

The database schema is shared with DollarBack and can be found in `database/schema.sql`. 

**Tables included:**
- `admin_configs` - System configuration and scraping sources
- `exchange_rates` - Current exchange rates
- `exchange_rates_history` - Historical rate data
- `notification_subscribers` - User notification preferences
- `alert_notifications` - Alert history and management

**To set up the database:**
1. Create a new Supabase project
2. Run the SQL from `database/schema.sql` in the Supabase SQL editor
3. Configure your `.env` file with the Supabase credentials

📝 License
----------

This project is licensed under the ISC License.
