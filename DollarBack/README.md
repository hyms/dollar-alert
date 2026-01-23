# DollarBack

## 📝 Description
The core engine of the system. It handles the intelligence behind data gathering, database persistence, and the communication bridge with Telegram.

## 🚀 Tech Stack & Libraries
* **Runtime:** Node.js (v20+)
* **Framework:** [Fastify](https://www.fastify.io/) (High-performance API)
* **Database Client:** @supabase/supabase-js
* **Bot Engine:** Telegraf (Telegram Bot API)
* **Scraping:** Cheerio / Axios
* **Task Scheduling:** @fastify/schedule

## 🛠️ How to Run
### Development (Docker)
```bash
docker-compose up backend
