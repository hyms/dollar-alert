# DollarAlert 🇧🇴

A full-stack automated system designed to monitor, store, and notify users about US Dollar (USD) exchange rate fluctuations in the Bolivian market.

## 📖 Project Overview
Due to the current economic context in Bolivia, tracking the exchange rate has become crucial. This project automates that process by scraping reliable sources, storing historical data, and sending real-time alerts via Telegram.

### Key Features
* **Automated Monitoring:** Periodic checks of official and parallel exchange rates.
* **Smart Notifications:** Instant Telegram alerts when a significant change is detected.
* **Interactive Dashboard:** Visual representation of trends and current status.
* **Scalable Architecture:** Fully containerized microservices-ready structure.

## 🏗️ Project Structure
The repository is divided into two main components:
* **/DollarBack:** Node.js (Fastify) API, Web Scraper, and Telegram Bot engine.
* **/DollarUi:** Vue.js 3 frontend with Vuetify 3 components.

## 🐳 Docker Execution
The entire stack is orchestrated using Docker Compose.

### Prerequisites
* Docker and Docker Compose
* A `.env` file in the root with your credentials (Supabase & Telegram)

### Running the Project
To lift both services in development mode:
```bash
docker-compose up
