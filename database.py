from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os

# Use DB_PATH env var in production (e.g., Render persistent disk at /data)
# Falls back to local todos.db for development
DB_PATH = os.getenv("DB_PATH", "todos.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Ensure the parent directory exists (fixes Render e3q8 error when /data dir
# doesn't exist yet on first boot or when no disk is attached)
db_dir = os.path.dirname(DB_PATH)
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