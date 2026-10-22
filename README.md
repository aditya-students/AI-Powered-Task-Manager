# 🤖 AI-Powered Task Manager

An intelligent task management web app powered by a **LangGraph ReAct AI agent** and a **FastAPI** backend. Chat naturally with the AI to create, update, filter, and delete your tasks — no forms required.

---

## ✨ Features

- 💬 **AI Chat Interface** — Talk to the AI to manage tasks in natural language
- ✅ **Full Task CRUD** — Create, read, update, and delete todos via REST API
- 🔍 **Filter & Search** — Filter tasks by status (`pending`, `in_progress`, `done`) or priority (`low`, `medium`, `high`)
- 📊 **Task Statistics** — Live dashboard stats for total, pending, in-progress, and done tasks
- 🧠 **Persistent Memory** — AI agent remembers context across the conversation
- ⚡ **Hot Reload** — Development server auto-restarts on file changes

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| **Backend** | FastAPI + Uvicorn                   |
| **AI Agent**| LangGraph ReAct + LangChain         |
| **LLM**     | Groq (via `langchain-groq`)         |
| **Database**| SQLite + SQLAlchemy ORM             |
| **Frontend**| HTML, CSS, Vanilla JavaScript       |

---

## 📁 Project Structure

```
AI-powered task management/
│
├── app.py           # FastAPI app — routes & endpoints
├── agent.py         # LangGraph ReAct agent setup
├── tools.py         # LangChain tools (create, list, update, delete todos)
├── database.py      # SQLAlchemy models & DB init
├── requirements.txt # Python dependencies
│
└── static/
    ├── index.html   # Frontend UI
    ├── style.css    # Styling
    └── app.js       # Frontend JavaScript logic
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/aditya-students/AI-Powered-Task-Manager.git
cd AI-Powered-Task-Manager
```

### 2. Create a virtual environment

```bash
python -m venv env

# Windows
env\Scripts\activate

# macOS / Linux
source env/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

> Get your free API key at [console.groq.com](https://console.groq.com)

### 5. Run the app

```bash
python app.py
```

Open your browser at **[http://localhost:8000](http://localhost:8000)**

---

## 🔌 API Endpoints

| Method   | Endpoint              | Description                         |
|----------|-----------------------|-------------------------------------|
| `GET`    | `/`                   | Serve the frontend                  |
| `POST`   | `/api/chat`           | Send a message to the AI agent      |
| `GET`    | `/api/todos`          | List all todos (supports filters)   |
| `POST`   | `/api/todos`          | Create a new todo                   |
| `PUT`    | `/api/todos/{id}`     | Update a todo by ID                 |
| `DELETE` | `/api/todos/{id}`     | Delete a todo by ID                 |
| `GET`    | `/api/stats`          | Get task statistics                 |

### Query Parameters for `GET /api/todos`

| Param      | Values                              |
|------------|-------------------------------------|
| `status`   | `all`, `pending`, `in_progress`, `done` |
| `priority` | `all`, `low`, `medium`, `high`      |

---

## 🤖 AI Agent Capabilities

You can chat with the AI using natural language. Examples:

| You say...                              | Agent does...                        |
|-----------------------------------------|--------------------------------------|
| `"Add a task to review the PR"`         | Creates a new todo                   |
| `"Show all high priority tasks"`        | Lists todos filtered by priority     |
| `"Mark task 3 as done"`                 | Updates status to `done`             |
| `"Start working on task 5"`             | Updates status to `in_progress`      |
| `"Delete the task about the PR review"` | Deletes the matching todo            |
| `"Show me all pending tasks"`           | Lists todos filtered by `pending`    |

---

## 📋 Todo Model

| Field         | Type     | Description                          |
|---------------|----------|--------------------------------------|
| `id`          | Integer  | Auto-incremented primary key         |
| `title`       | String   | Short task title (required)          |
| `description` | String   | Optional detailed notes              |
| `status`      | String   | `pending` / `in_progress` / `done`   |
| `priority`    | String   | `low` / `medium` / `high`            |
| `due_date`    | String   | Optional due date (e.g. `25-03-2026`)|
| `created_at`  | String   | Auto-set on creation                 |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
