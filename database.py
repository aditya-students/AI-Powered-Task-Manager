from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

# In production, Render sets DATABASE_URL automatically for linked PostgreSQL.
# For local development, falls back to SQLite.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///todos.db")

# Render's PostgreSQL URL starts with "postgres://" but SQLAlchemy requires
# "postgresql://" — fix it automatically
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite only: ensure parent directory exists
if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

engine = create_engine(DATABASE_URL)
LocalSession = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass

class Todo(Base):
    __tablename__ = "todos"
    
    id = Column(Integer,primary_key=True,autoincrement=True)
    title = Column(String(200),nullable=False)
    description = Column(String(500),default="")
    status = Column(String(20),default="pending")
    priority = Column(String(20),default="medium")
    due_date = Column(String(20),default="")
    created_at = Column(String(20),nullable=False)
    
    def to_dict(self) -> dict:
        return {
            "id":self.id,
            "title":self.title,
            "description":self.description,
            "status":self.status,
            "priority":self.priority,
            "due_date":self.due_date,
            "created_at":self.created_at
        }
        
    
def init_db():
    Base.metadata.create_all(engine)