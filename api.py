from flask import Blueprint, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

import os

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if api_key is None:
    raise ValueError("OPENAI_API_KEY cannot be found")
client = OpenAI(api_key=api_key)

api_bp = Blueprint("api", __name__)

# Enable CORS for all API routes
CORS(api_bp)

@api_bp.route('/create-new-syllabus/', methods=['POST'])
def create_new_syllabus():
    print("Test?")
    return jsonify({"status": "HOORAY"}), 200

@api_bp.route('/', methods=['POST', 'GET'])
def api_index():
    print("API IS UP")
    return jsonify({"status": "API IS ON"}), 200