from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
app = Flask(__name__)
# Enable CORS for all routes
CORS(app)


@app.route('/')
def index():
    '''Landing page for the app'''
    try:
        return render_template('index.html')
    except Exception as e:
        return jsonify({"Error": str(e)}), 500
if __name__ == '__main__':
    print("App is running")
    app.run(debug=True, host='0.0.0.0', port=5000)