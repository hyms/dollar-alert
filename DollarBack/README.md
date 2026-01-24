DollarBack
==========

📝 Description
--------------

The core engine of the DollarAlert ecosystem. This service is responsible for data acquisition through dynamic web scraping, storage in Supabase, and dispatching multi-channel notifications. It is built using **Clean Architecture** principles to ensure maintainability and scalability.

🎯 Core Responsibilities
------------------------

-   **Dynamic Web Scraping**: Fetches exchange rates from multiple sources defined in the database configuration.

-   **Multi-Channel Notifications**: Integrated with Telegram and Web Push notifications.

-   **Data Persistence**: Manages historical and real-time data using Supabase (PostgreSQL).

-   **Admin API**: Secure endpoints for the administrative portal to manage scrapers and system settings.

🚀 Tech Stack & Libraries
-------------------------

-   **Runtime**: Node.js (v20+)

-   **Framework**: [Fastify](https://www.fastify.io/ "null") (Plugin-based architecture)

-   **Language**: TypeScript

-   **Database Client**: `@supabase/supabase-js`

-   **Bot Engine**: `telegraf` (Telegram API)

-   **Push Engine**: `web-push`

-   **Scraping**: `cheerio` & `puppeteer-core`

-   **Task Scheduling**: `@fastify/schedule`

🏗️ Clean Architecture Structure
--------------------------------

```
DollarBack/
├── src/
│   ├── domain/               # Enterprise Logic
│   │   ├── entities/         # Currency, Rate, Subscriber, Config
│   │   └── repositories/     # Interface definitions
│   ├── application/          # Business Rules
│   │   ├── use-cases/        # ScrapingProcess, NotifyUsers
│   │   └── services/         # ScraperEngine, NotificationManager
│   ├── infrastructure/       # External Tools
│   │   ├── database/         # Supabase repositories
│   │   ├── external-api/     # Scrapers logic
│   │   ├── delivery/         # Fastify Routes
│   │   └── messaging/        # Telegram & WebPush
│   └── main/                 # Entry point & Wiring
├── migrations/               # SQL Migration files
└── .env.example

```

🗄️ Database Schema (Migrations)
--------------------------------

These are the base tables required for the system to function. You can find the full SQL in `DollarUi/database/schema.sql`.

### 1\. `admin_configs`

Stores system settings, admin credentials, and dynamic scraping targets.

-   **Fields**: `admin_username`, `admin_password_hash`, `scraping_sources` (JSONB), `maintenance_mode`.

### 2\. `exchange_rates_history`

Stores the time-series data for historical analysis.

-   **Fields**: `currency_code`, `official_buy`, `official_sell`, `parallel_buy`, `parallel_sell`, `captured_at`.

### 3\. `notification_subscribers`

Registry for all devices and accounts receiving alerts.

-   **Fields**: `user_identifier` (Telegram ID / UUID), `platform` (telegram/web_push), `push_subscription_data` (JSONB).

🔄 Database Migrations (Supabase)
---------------------------------

1.  **Local Development**: Create a new `.sql` file in `/migrations`.

2.  **Deployment**: Use the Supabase CLI:

    ```
    supabase db push --linked

    ```

🕷️ Dynamic Web Scraping
------------------------

The `ScraperEngine` fetches targets from the `admin_configs` table. Each source in the `scraping_sources` JSONB array must define:

-   `url`: Target website.

-   `selector`: CSS selector for the rate.

-   `currency`: Currency code (default: USD).

-   `frequency`: Cron-style or preset interval.

🛠️ How to Run
--------------

### Development (Docker)

```
# From project root
docker-compose up backend

```

🔌 Environment Variables
------------------------

```
PORT=3000
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_service_role_key
TELEGRAM_TOKEN=your_bot_token
VAPID_PUBLIC_KEY=for_web_push
VAPID_PRIVATE_KEY=for_web_push

```

📝 License
----------

This project is licensed under the ISC License.
