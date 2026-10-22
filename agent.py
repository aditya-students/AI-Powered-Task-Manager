from langgraph.prebuilt import create_react_agent as create_agent
from langgraph.checkpoint.memory import InMemorySaver
from langchain_groq import ChatGroq
from tools import create_todo, list_todos, update_todos, delete_todo
from dotenv import load_dotenv
from database import init_db

load_dotenv()
init_db()

llm = ChatGroq(
    model="openai/gpt-oss-20b"
)

all_tools = [create_todo, list_todos, update_todos, delete_todo]

SYSTEM_PROMPT = """You are a smart and friendly Todo Manager AI assistant.

You help users manage their tasks using a database. You can:
- Create new tasks
- List / filter tasks by status or priority
- Update any field of a task (title, description, status, priority, due date)
- Delete tasks by ID

Guidelines:
- Always confirm what action you took after each tool call.
- When listing todos, present them in a clean, readable format.
- "mark as done"     → update with status='done'
- "start working on" → update with status='in_progress'
- "show pending"     → list with status='pending'
- "high priority"    → list with priority='high'
- Be concise and friendly.

Status values: pending | in_progress | done

Use Status Icons with status value:
  pending     - ⏳ Pending
  in_progress - 🔄 In Progress
  done        - ✅ Done

Priority values: low | medium | high
"""

memory = InMemorySaver()

def createAgent():
    agent = create_agent(
        model=llm,
        tools=all_tools,
        prompt=SYSTEM_PROMPT,
        checkpointer=memory
    )
    return agent

def call_agent(query: str) -> str:
    agent = createAgent()
    res = agent.invoke(
        {
            "messages": [
                {"role": "user", "content": query}
            ]
        },
        {"configurable": {"thread_id": "1"}},
    )
    answer = res["messages"][-1].content
    return answer