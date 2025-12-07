from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, Text, ForeignKey, Boolean, JSON, UniqueConstraint

# 1. Define the Base class (standard for modern SQLAlchemy)
class Base(DeclarativeBase):
    pass

# 2. Instantiate SQLAlchemy, but DO NOT pass 'app' to it yet.
# This creates an unbound database instance.
db = SQLAlchemy(model_class=Base)

# 3. Define your Models (The Schema)
# ---------------------------------------------------------
# 1. TEACHERS
# ---------------------------------------------------------
class Teacher(db.Model):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True)
    handle: Mapped[str] = mapped_column(String(80))

    # Relationships
    courses: Mapped[list["Course"]] = relationship(back_populates="teacher", cascade="all, delete-orphan")

# ---------------------------------------------------------
# 2. COURSES
# ---------------------------------------------------------
class Course(db.Model):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Foreign Key pointing to Teacher
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"))
    
    code: Mapped[str] = mapped_column(String(20), nullable=False)  # e.g. "CS101"
    name: Mapped[str] = mapped_column(String(200), nullable=False) # e.g. "Intro to CS"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    meta_data: Mapped[dict] = mapped_column(JSON, nullable=False) # Stores JSON data

    # Relationships
    teacher: Mapped["Teacher"] = relationship(back_populates="courses")
    weeks: Mapped[list["Week"]] = relationship(back_populates="course", cascade="all, delete-orphan")

# ---------------------------------------------------------
# 3. WEEKS
# ---------------------------------------------------------
class Week(db.Model):
    __tablename__ = "weeks"
    
    # Ensure a course cannot have two "Week 1"s
    __table_args__ = (
        UniqueConstraint('course_id', 'week_number', name='unique_course_week'),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    topic: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    planned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="weeks")
    sessions: Mapped[list["Session"]] = relationship(back_populates="week", cascade="all, delete-orphan")

# ---------------------------------------------------------
# 4. SESSIONS
# ---------------------------------------------------------
class Session(db.Model):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    week_id: Mapped[int] = mapped_column(ForeignKey("weeks.id"))
    session_no: Mapped[int] = mapped_column(Integer, nullable=False)
    data: Mapped[dict | None] = mapped_column(JSON) # Session-specific JSON

    # Relationships
    week: Mapped["Week"] = relationship(back_populates="sessions")
    
    # Optional: A shortcut to get the Course directly from a Session
    # This reads through the relationships without storing the ID in this table
    @property
    def course(self):
        return self.week.course
    
  