from flask import Blueprint, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
from typing import Any

import logging
import json

# Import the db for using
from db import *
from sqlalchemy import inspect, text

use_actual_ai_response = True

import os
load_dotenv()

api_key = os.getenv("GENAI_API_KEY")
if api_key is None:
    raise ValueError("GENAI_API_KEY cannot be found")

client = genai.Client(api_key=api_key)

api_bp = Blueprint("api", __name__)

# Enable CORS for all API routes
CORS(api_bp)

@api_bp.route('/generate-course-structure/', methods=['POST'])
def generate_course_structure():
    data = request.form
    
    if not data:
        return jsonify({"error": "No data was provided"}), 400
    
    try:
        teacherEmail = data['teacherEmail']
        courseCode = data['courseCode']
        courseName = data['courseName']
        content = data['content']
        objectives = data['objectives']
        prereq = data['prerequisites']
        duration = data['duration']
        sessions_per_week = data['sessionsPerWeek']
        homework = data['homework']

        # Assuming standard 5 ECTs course values if parsing fails
        duration = int(duration) if duration else 12
        sessions_per_week = int(sessions_per_week) if sessions_per_week else 2
        homework = int(homework) if homework else 6
        
        create_new_course(
            teacherEmail=teacherEmail,
            courseCode=courseCode,
            courseName=courseName,
            content=content,
            objectives=objectives,
            prerequisites=prereq,
            duration=duration,
            sessions_per_week=sessions_per_week,
            homework=homework
        )
        
        return jsonify({"status": f"New course created: {courseName}"}), 200
    except Exception as e:
        logging.exception("An error occurred during processing")
        return jsonify({"error": f"{e}"}), 400
    
def create_new_course(
    teacherEmail: str,
    courseCode: str,
    courseName: str,
    content: str | None,
    objectives: str,
    prerequisites: str,
    duration: int | None,
    sessions_per_week: int | None,
    homework: int | None,
) -> None:
    """
    Used for inserting a new course into the database
    """
    
    if not validate_email(teacherEmail):
        raise ValueError("Teacher Email is not in correct format: FirstName.LastName@metropolia.fi")
    
    print(f"Creating new course: {courseName}")
    duration = int(duration) if duration else 0
    
    
    prompt = None
    with open("prompt.txt", "r", encoding="utf-8") as file:
        prompt = file.read()
    if prompt is None:
        raise ValueError("In create_new_course: prompt is not found.")
    
    prompt += f"""
        Structure a syllabus for the course '{courseName}', that spans {duration} weeks, each week will have {sessions_per_week} lectures.
        You will create a weekly syllabus, that **ONLY** contains the topic and the summary of each week, starting from "week 1" to "week {duration}".
        The course aims for students that satisfies the following prerequisites:
            {prerequisites}
        And at the end of the course, the students will be expected to meet these objectives:
            {objectives}
        The given content of the class is as follows:
            {content}
        And each week, the students are expected to spend an average of {homework} hours on homework.
        
        You should structure the syllabus so that every week covers all topics that are relevant and / or covering all of the specified content.
        To repeat, you only create a weekly syllabus that **ONLY** contains the toipc and the content's summary of the week, not in detailed what each session / lecture would be like.
        
        RESPOND IN **JSON FORMAT** ONLY, Starting with {{ and ending in }}. Do not add other characters that will make json.loads() break
        Valid JSON format is as follows: {{
            "week 1": {{
                "topic": "Introduction to Machine Learning",
                "summary": "The students will learn about ML history, how the maths behind it came to life, and the basics of Linear Regression"
            }},
            ...
            "week {duration}": {{
                "topic": "Project demo",
                "summary": "The students will spend their last week completing their project on fine tuning a model to predict Lung Cancer"  
            }}
        }}
    
    """
    
    print("Prompt is structured. Sending prompt to GenAI...")
    res = None
    response = None
    if use_actual_ai_response:
        try:
            res = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1
                )
            )
        except Exception as e:
            raise TimeoutError(f"Error while getting data from GenAI: {e}")
        
        try:
            response = clean_json(res.text)
        except Exception as e:
            raise TypeError(f"AI failed to return valid JSON {e}")
    
    # Okay I am poor so I must use this to not exceed rate limites
    else :
        with open("weekly.json", "r", encoding='utf-8') as file:
            response = file.read()
        response = clean_json(response)
    # Please unpoor me
    
    
    print(f"AI response: ", response)
    
    
    teacher = db.session.execute(
        db.select(Teacher).where(Teacher.email == teacherEmail)
    ).scalar_one_or_none()
    
    if not teacher:
        print(f"Teacher {teacherEmail} not found. Creating new teacher.")
        new_handle = teacherEmail.split('@')[0]
        teacher = Teacher(email=teacherEmail, handle=new_handle)
        
        db.session.add(teacher)
        db.session.commit()
        
    teacher_id = teacher.id
    
    course = db.session.execute(
        db.select(Course).where(Course.code == courseCode)
    ).scalar_one_or_none()
    
    if not course:
        print(f"Course {courseCode} not found. Creating new course")
        
        meta_data = {
            "objectives": objectives,
            "prerequisites": prerequisites,
            "duration": duration,
            "sessions_per_week": sessions_per_week,
            "homework_hours": homework
        }
        
        course = Course(
            teacher_id=teacher_id,
            code=courseCode,
            name=courseName,
            content=content if content else "No description provided",
            meta_data=meta_data
        )
        
        db.session.add(course)
        db.session.commit() # To get course ID
        
        print(f"Generating {duration} weeks for Course ID {course.id}...")
        
        new_weeks = []
        
        for week_no in range(1, duration + 1):
            week_key = f"week {week_no}"
            week_data = response.get(week_key, {"topic": "WIP", "summary": "WIP"})
            
            new_week = Week(
                week_number = week_no,
                course_id = course.id,
                topic=week_data['topic'],
                summary=week_data['summary'],
                planned=False
            )
            new_weeks.append(new_week)
            
        db.session.add_all(new_weeks)
        db.session.commit()
    else:
        print(f"Course {courseCode} already exists. Skipping creation")
    
    return    

def validate_email(email: str) -> bool:
    parts = email.split('@')
    return parts[1] == "metropolia.fi"

def clean_json(ai_text: str) -> dict[str, Any]:
    """
    Parses JSON output from AI, handling raw JSON and markdown'ed JSON
    """
    text = ai_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
        
    if text.endswith("```"):
        text = text[:-3]
    
    text = text.strip()
    
    return json.loads(text)

# TODO: Separate get-all-course-names and get-all-course-info
#       Since we don't want to send all backend data to the user at once

@api_bp.route('/get-all-courses', methods=['GET', 'POST'])
def get_all_courses():
    try:
        courses = db.session.execute(db.select(Course)).scalars().all()
        
        output = []
        for course in courses:
            sorted_weeks = sorted(course.weeks, key=lambda w: w.week_number)
            
            course_data = {
                "id": course.id,
                "name": course.name,
                "code": course.code,
                "content": course.content,
                "duration": course.meta_data.get('duration'),
                "sessionsPerWeek": course.meta_data.get('sessions_per_week'),
                "objectives": course.meta_data.get('objectives'),
                "prerequisites": course.meta_data.get("prerequisites"),
                "weeks": [
                    {
                        "id": w.id,
                        "week_number": w.week_number,
                        "topic": w.topic,
                        "summary": w.summary,
                        "planned": w.planned
                    } for w in sorted_weeks
                ] 
            }
            output.append(course_data)
        
        return jsonify(output)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@api_bp.route('/get-week-sessions', methods=['GET', 'POST'])
def get_week_sessions():
    data = request.get_json()
    week_id = data.get('week_id')
    
    if not week_id:
        return jsonify({'error': "Week ID is required"}), 400
    
    try:
        week = db.session.execute(
            db.select(Week).where(Week.id == week_id)
        ).scalar_one_or_none()
        
        if not week:
            return jsonify({"error": "Week not found"}), 404
        
        sessions = db.session.execute(
            db.select(Session).where(Session.week_id == week_id).order_by(Session.id)
        ).scalars().all()
        
        sessions_list = []
        for session in sessions:
            sessions_list.append({
                "id": session.id,
                "minutes_data": session.data
            })
            
        return jsonify({
            "status": "success",
            "week_topic": week.topic,
            "week_summary": week.summary,
            "sessions": sessions_list
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/generate-week-sessions', methods=['GET', 'POST'])
def create_week_sessions():
    
    # ONGOING: Get week's ID
    # TODO: Add the Update With AI feature
    try:
        req_data = request.get_json()
        week_id = req_data.get('week_id')
        
        if not week_id:
            return jsonify({"error": "Needed weekId"}), 400
        
        week = db.session.get(Week, week_id)
        if not week:
            return jsonify({"error": "Week not found"}), 404
        
        if week.planned:
            return jsonify({"error": "Week is planned"}), 400
        
        course = week.course
        week_no = week.week_number
        
        sessions_count = int(course.meta_data.get('sessionsPerWeek', 2))
        hours_per_session = int(course.meta_data.get('hours_per_session', 2))


        # TODO: Implement AI response
        context_json = {
            "name": course.name,
            "content": course.content,
            "objectives": course.meta_data.get('objectives'),
            "week_topic": week.topic,
            "week_summary": week.summary,
            "sessions_count": sessions_count,
            "duration_minutes": hours_per_session * 60
        }
        
        prompt = None
        with open('prompt.txt', 'r', encoding='utf-8') as file:
            prompt = file.read()
        if not prompt:
            raise ImportError("Prompt cannot be found") 
        
        
        # Will think of some way to encapsulate the context of the whole course in the prompt later
        #   Embeddings?
        prompt += f"""
            Generate {sessions_count} sessions' minutes for week {week_no} of this following course.
            {json.dumps(context_json, indent=2, ensure_ascii=False)}.
            Make sure that the content of each lectures satisfy the week's topic and summary, and overall fits
            into the syllabus and fulfilling the content's of the course.
            The response format should be a **Valid JSON** containing the minutes of {sessions_count} sessions, each wrapped in its "session i" key.
            e.g. {{
              "session 1": {{
                  "Minute 0-15": "Introduction"
              }}  
            }}
        """   
        
        print("Prompt is structured. Sending prompt to GenAI...")
        res = None
        response = None
        if use_actual_ai_response:
            try:
                res = client.models.generate_content(
                    model="gemini-2.5-flash-lite",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.1
                    )
                )
            except Exception as e:
                raise TimeoutError(f"Error while getting data from GenAI: {e}")
            
            try:
                response = clean_json(res.text)
            except Exception as e:
                raise TypeError(f"AI failed to return valid JSON {e}")
        
        # Okay I am poor so I must use this to not exceed rate limites
        else :
            with open('session.json', 'r', encoding="utf-8") as file:
                response = file.read()
            response = clean_json(response)
            print("Got response")
        
        created_sessions = []
        
        for i in range(1, sessions_count + 1):
            session_key = f"session {i}"
            minutes_data = response.get(session_key)
            
            if minutes_data:
                new_session = Session(
                    week_id = week_id,
                    session_no = 1,
                    data = minutes_data
                )
                db.session.add(new_session)
                created_sessions.append(new_session)
                
        
        week.planned = True
        db.session.commit()
        
        return jsonify({
            "message": "Sessions generated successfully",
            "week_id": week.id,
            "sessions": [
                {
                    "id": s.id,
                    "session_no": s.session_no,
                    "minutes_data": s.data
                } for s in created_sessions
            ]
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Exception met while trying to generate sessions: {str(e)}"}), 500

@api_bp.route('/', methods=['POST', 'GET'])
def api_index():
    print("API IS UP")
    return jsonify({"status": "API IS ON"}), 200


@api_bp.route('/db-dump', methods=['GET'])
def debug_database_dump():
    """
    Returns a JSON representation of the entire database.
    Useful for debugging.
    """
    db_content = {}
    
    try:
        # 1. Inspect table names
        inspector = inspect(db.engine)
        table_names = inspector.get_table_names()
        
        if not table_names:
            return jsonify({"status": "Database is empty", "tables": []}), 200

        # 2. Loop through each table
        for table in table_names:
            # Safe SQL execution
            sql_query = text(f"SELECT * FROM {table}")
            result = db.session.execute(sql_query)
            
            # Get column names
            columns = list(result.keys())
            
            # Fetch all rows and convert to list of dicts
            rows_data = []
            for row in result.fetchall():
                # zip() combines column names with row values
                # e.g. {'id': 1, 'email': 'john@test.com'}
                row_dict = dict(zip(columns, row))
                rows_data.append(row_dict)
            
            # Add to main dictionary
            db_content[table] = rows_data

        return jsonify({
            "status": "success",
            "database_content": db_content
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500