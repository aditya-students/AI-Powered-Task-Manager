from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from agent import call_agent, createAgent
from database import LocalSession, Todo, init_db
from datetime import datetime

init_db()

app = FastAPI(title="AI Task Manager", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str

class CreateTodoRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    due_date: Optional[str] = ""

class UpdateTodoRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None


# ─── Pages ────────────────────────────────────────────────────────────────────

@app.get("/")
async def serve_index():
    return FileResponse("static/index.html")


# ─── AI Chat Endpoint ─────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Send a message to the AI agent and get a response."""
    try:
        response = call_agent(request.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Todo CRUD Endpoints ──────────────────────────────────────────────────────

@app.get("/api/todos")
async def get_todos(status: str = "all", priority: str = "all"):
    """Get all todos, optionally filtered by status or priority."""
    with LocalSession() as session:
        query = session.query(Todo)
        if status != "all":
            query = query.filter(Todo.status == status)
        if priority != "all":
            query = query.filter(Todo.priority == priority)
        todos = query.order_by(Todo.id).all()
        return [todo.to_dict() for todo in todos]


@app.post("/api/todos")
async def create_todo(request: CreateTodoRequest):
    """Create a new todo task."""
    priority = request.priority if request.priority in ["low", "medium", "high"] else "medium"
    with LocalSession() as session:
        todo = Todo(
            title=request.title,
            description=request.description or "",
            priority=priority,
            due_date=request.due_date or "",
            created_at=datetime.now().strftime("%d-%m-%Y %H:%M"),
        )
        session.add(todo)
        session.commit()
        session.refresh(todo)
        return todo.to_dict()


@app.put("/api/todos/{todo_id}")
async def update_todo(todo_id: int, request: UpdateTodoRequest):
    """Update an existing todo by ID."""
    with LocalSession() as session:
        todo = session.get(Todo, todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail=f"Todo {todo_id} not found")
        if request.title is not None:
            todo.title = request.title
        if request.description is not None:
            todo.description = request.description
        if request.status is not None:
            todo.status = request.status
        if request.priority is not None:
            todo.priority = request.priority
        if request.due_date is not None:
            todo.due_date = request.due_date
        session.commit()
        session.refresh(todo)
        return todo.to_dict()


@app.delete("/api/todos/{todo_id}")
async def delete_todo(todo_id: int):
    """Delete a todo by ID."""
    with LocalSession() as session:
        todo = session.get(Todo, todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail=f"Todo {todo_id} not found")
        title = todo.title
        session.delete(todo)
        session.commit()
        return {"message": f"Todo '{title}' deleted successfully"}


@app.get("/api/stats")
async def get_stats():
    """Get task statistics."""
    with LocalSession() as session:
        total = session.query(Todo).count()
        pending = session.query(Todo).filter(Todo.status == "pending").count()
        in_progress = session.query(Todo).filter(Todo.status == "in_progress").count()
        done = session.query(Todo).filter(Todo.status == "done").count()
        high = session.query(Todo).filter(Todo.priority == "high").count()
        medium = session.query(Todo).filter(Todo.priority == "medium").count()
        low = session.query(Todo).filter(Todo.priority == "low").count()
        return {
            "total": total,
            "pending": pending,
            "in_progress": in_progress,
            "done": done,
            "high": high,
            "medium": medium,
            "low": low,
        }


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
