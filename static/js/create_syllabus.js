/**
 * Create Syllabus Logic
 * Handles form submission, mocks the AI API call, and persists data to localStorage.
 */

const API_ENDPOINT = '/api/create-new-syllabus';

document.getElementById('syllabus-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Show Loader
    document.getElementById('loader').style.display = 'flex';

    // 1. Gather Data from DOM
    const formData = {
        name: document.getElementById('courseName').value,
        content: document.getElementById('courseContent').value,
        objectives: document.getElementById('courseObjectives').value,
        prerequisites: document.getElementById('prerequisites').value,
        duration: document.getElementById('duration').value,
        sessionsPerWeek: document.getElementById('sessions').value,
        homework: document.getElementById('homework').value
    };

    console.log(`[Mock API] Sending Data to ${API_ENDPOINT}`, formData);

    // 2. Simulate Flask API Latency (1.5 seconds)
    await new Promise(r => setTimeout(r, 1500));

    // 3. GENERATE MOCK DATA (Simulating Backend AI Response)
    // In a real Flask app, the server would return this object.
    const newCourse = generateMockAIResponse(formData);

    // 4. PERSIST DATA (Simulating Database)
    // We save to localStorage so the "View" page can see it.
    saveCourseToLocalDB(newCourse);

    // 5. REDIRECT to View Page
    window.location.href = 'view_syllabuses.html';
});

/**
 * Saves the course object to the browser's LocalStorage to mimic a DB save.
 * @param {Object} course 
 */
function saveCourseToLocalDB(course) {
    let courses = JSON.parse(localStorage.getItem('syllabus_courses') || '[]');
    courses.push(course);
    localStorage.setItem('syllabus_courses', JSON.stringify(courses));
}

/**
 * Generates a mock AI response structure based on the inputs.
 * @param {Object} data 
 * @returns {Object} Structured syllabus object
 */
function generateMockAIResponse(data) {
    const id = Date.now();
    const sessions = [];
    
    // Create 3 mock sessions
    for(let i=1; i<=3; i++) {
        sessions.push({
            id: `s_${id}_${i}`,
            title: `Week ${i}: ${data.content ? data.content.split(',')[0] : 'Core Concepts'} - Part ${i}`,
            strategy: "Use active recall techniques. Start with a quiz based on prerequisites.",
            points: ["Key concept definition", "Real-world application", "Group activity"],
            visuals: "Whiteboard diagram of flow."
        });
    }

    return {
        id: id,
        name: data.name,
        objectives: data.objectives,
        prerequisites: data.prerequisites,
        duration: data.duration,
        sessionsPerWeek: data.sessionsPerWeek,
        sessions: sessions
    };
}