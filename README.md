# AI-First CRM – HCP Interaction Logger

A full-stack application for logging and managing Healthcare Professional (HCP) interactions, powered by an AI agent built with LangGraph and Groq.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Redux Toolkit + Tailwind CSS v3 |
| Backend | Python 3.11+ / FastAPI |
| Database | MySQL 8+ (via SQLAlchemy + PyMySQL) |
| AI Agent | LangGraph + LangChain + Groq (`gemma2-9b-it`) |

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- **MySQL 8+** running locally (e.g. via MySQL Workbench)
- **Groq API Key** from [console.groq.com](https://console.groq.com)

---

## Setup

### 1. Create the MySQL Database

Open MySQL Workbench (or the CLI) and run:

```sql
CREATE DATABASE IF NOT EXISTS hcp_crm;
```

Tables are auto-created on first backend startup.

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
GROQ_API_KEY=gsk_your_key_here
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=hcp_crm
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to `http://localhost:8000`.

---

## Usage

### Manual Logging (Left Panel)
Fill in the structured form with HCP details, interaction type, topics, materials, sentiment, and outcomes. Click **Log Interaction** to save directly to MySQL.

### AI Assistant (Right Panel)
Type natural-language descriptions into the chat, for example:
- *"Log a meeting with Dr. Patel about the new diabetes drug on July 10th"*
- *"Show me all interactions with Dr. Smith"*
- *"Search for materials on OncoBoost"*
- *"Suggest follow-ups for my last cardiology meeting"*
- *"Edit interaction 3 to change sentiment to positive"*

The AI agent parses your input and automatically routes to the correct tool.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/chat` | Send a message to the AI agent |
| `POST` | `/api/log` | Manually log a structured interaction |
| `GET` | `/api/interactions` | Retrieve all logged interactions |

---

## Project Structure

```
hcp-crm-agent/
├── .gitignore
├── README.md
├── backend/
│   ├── .env                  # Your environment variables (not committed)
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── database.py       # SQLAlchemy models & connection
│       ├── tools.py          # 5 LangGraph tools
│       ├── agent.py          # LangGraph StateGraph agent
│       └── main.py           # FastAPI application
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── index.css
        ├── main.jsx
        ├── store.js
        └── App.jsx
```

## License

MIT
