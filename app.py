from flask import Flask, render_template, jsonify, request
from flask_cors import CORS

from db import db, Teacher, Course, Session
from api import api_bp

import os
import sys

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

# Configure the database path to be in the same directory as app.py
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "syllabus_ai.db")

# Configure the SQLite database
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Connect the database to this specific App
db.init_app(app)

with app.app_context():
    db.create_all();
    print("Database tables created successfully")

"""
The app begins here
"""
@app.route('/')
def index():
    '''Landing page for the app'''
    try:
        return render_template('index.html')
    except Exception as e:
        return jsonify({"Error": str(e)}), 500
    
    
@app.route('/view-syllabus')
def view_syllabus():
    try:
        return render_template('view-syllabus.html')
    except Exception as e:
        return jsonify({"Error": str(e)}), 500

# Host every api endpoints at /api
app.register_blueprint(api_bp, url_prefix='/api')

if __name__ == '__main__':
    print("App is running")
    if len(sys.argv) > 1:
        port = int(sys.argv[1]) # Convert string to int
        print(f"Starting on port {port}")
    else:
        print("No port provided, using default.")
    app.run(debug=True, host='0.0.0.0', port=5000)