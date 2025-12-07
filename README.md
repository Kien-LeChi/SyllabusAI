# 📚 SyllabusAI

![Python Version](https://img.shields.io/badge/python-3.9%2B-blue)
![Flask Version](https://img.shields.io/badge/flask-2.0%2B-green)


**SyllabusAI** is a web application designed to streamline the workflow for educators. It allows teachers to create, format, and export standardized course syllabi in minutes, rather than hours.

## 🚀 Key Features

* **Dynamic Form Generation:** easy-to-use input fields for course goals, teaching hours,...
* **Calendar Integration:** Automatically generates a week-by-week schedule based on the semester start date and end date
* **Outcome Mapping:** Visual tools to map assignments to specific learning outcomes.

## 🛠 Tech Stack

* **Backend:** Python, Flask (Web Framework)
* **Database:** SQLite (Dev)
* **Frontend:** HTML5, Jinja2 Templates, CSS

## ⚙️ Installation & Setup

Follow these steps to get a local copy up and running.

### 1. Clone the repository
```bash
git clone [https://github.com/Kien-LeChi/SyllabusAI.git](https://github.com/Kien-LeChi/SyllabusAI.git)
cd SyllabusAI

# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```
### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Create .env manually with your keys
```bash
# .env
OPENAI_API_KEY="your_actual_key_here"
# If you are using Google GenAI:
GOOGLE_API_KEY="your_google_key_here"
```

### 4. Run the app
```bash
python -u app.py
```

## The app will be hosted on 127.0.0.1:5000/

