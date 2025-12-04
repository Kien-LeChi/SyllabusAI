from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from api import api_bp

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def index():
    '''Landing page for the app'''
    try:
        return render_template('index.html')
    except Exception as e:
        return jsonify({"Error": str(e)}), 500

@app.route('/syllabus-panel/')
def syllabus_panel():
    try:
        return render_template('syllabus-panel.html')
    except Exception as e:
        return jsonify({"Error": str(e)}), 500
    
@app.route('/create-syllabus')
def create_syllabus():
    try:
        return render_template('create-syllabus.html')
    except Exception as e:
        return jsonify({"Error": str(e)}), 500
    
@app.route('/view-syllabus')
def view_syllabus():
    try:
        return render_template('view-syllabus.html')
    except Exception as e:
        return jsonify({"Error": str(e)}), 500


if __name__ == '__main__':
    print("App is running")
    app.run(debug=True, host='0.0.0.0', port=5000)