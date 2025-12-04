/**
 * View Syllabuses Logic
 * Handles loading data from localStorage, rendering the sidebar,
 * and displaying the selected course content.
 */

// State management
let courses = [];
let activeCourseId = null;

// Mock API endpoint constant (used for console logging)
const API_UPDATE_ENDPOINT = '/api/update-syllabus';

/**
 * Initialization function called when the script loads.
 */
function init() {
    // 1. Retrieve data from LocalStorage (mimicking a GET /api/courses request)
    const stored = localStorage.getItem('syllabus_courses');
    
    if (stored) {
        courses = JSON.parse(stored);
        renderSidebar();
        
        // If courses exist, automatically open the most recent one for better UX
        if(courses.length > 0) {
            const latest = courses[courses.length - 1];
            toggleCourseDropdown(latest.id);
            renderCourseContent(latest.id, 'intro');
        }
    } else {
        renderEmptySidebar();
    }
}

/**
 * Renders a message if no courses exist in the "Database".
 */
function renderEmptySidebar() {
    document.getElementById('course-list-container').innerHTML = 
        '<li style="color:var(--text-muted); font-style:italic;">No courses found.</li>';
}

/**
 * Renders the list of courses into the sidebar.
 */
function renderSidebar() {
    const container = document.getElementById('course-list-container');
    container.innerHTML = '';

    courses.forEach(course => {
        const li = document.createElement('li');
        li.className = 'course-item';

        // Course Header (Accordion Toggle)
        const header = document.createElement('div');
        header.className = `course-header ${activeCourseId === course.id ? 'active' : ''}`;
        header.innerHTML = `<span>${course.name}</span> <span>▼</span>`;
        header.onclick = () => toggleCourseDropdown(course.id);

        // Sessions List (Hidden by default, shown if active)
        const sessionUl = document.createElement('ul');
        sessionUl.className = `session-list ${activeCourseId === course.id ? 'open' : ''}`;
        sessionUl.id = `sessions-${course.id}`;

        // "Intro" Item
        const introLi = document.createElement('li');
        introLi.className = 'session-item';
        introLi.innerText = 'Course Introduction';
        introLi.onclick = (e) => {
            e.stopPropagation();
            renderCourseContent(course.id, 'intro');
        };
        sessionUl.appendChild(introLi);

        // Individual Session Items
        course.sessions.forEach(session => {
            const sessLi = document.createElement('li');
            sessLi.className = 'session-item';
            sessLi.innerText = session.title;
            sessLi.onclick = (e) => {
                e.stopPropagation();
                renderCourseContent(course.id, session.id);
            };
            sessionUl.appendChild(sessLi);
        });

        li.appendChild(header);
        li.appendChild(sessionUl);
        container.appendChild(li);
    });
}

/**
 * Toggles the accordion logic for the sidebar.
 * @param {string|number} courseId 
 */
function toggleCourseDropdown(courseId) {
    activeCourseId = courseId;
    renderSidebar(); // Re-render to update CSS classes (open/closed/active)
}

/**
 * Renders the main content area based on the selected course and session.
 * @param {string|number} courseId 
 * @param {string|number} sessionId 
 */
function renderCourseContent(courseId, sessionId) {
    const course = courses.find(c => c.id === courseId);
    const main = document.getElementById('main-content');
    
    // Highlight active session (Visual only for this demo)
    // In a real DOM manipulation, we might add .active class to specific element IDs here.

    if (sessionId === 'intro') {
        main.innerHTML = `
            <div class="syllabus-meta-header">
                <h2>${course.name}</h2>
                <p><strong>Duration:</strong> ${course.duration} Weeks | <strong>Sessions:</strong> ${course.sessionsPerWeek}/week</p>
                <hr style="margin: 1rem 0; border:0; border-top:1px solid #ddd;">
                <p><strong>Objectives:</strong><br>${course.objectives}</p>
                <br>
                <p><strong>Prerequisites:</strong><br>${course.prerequisites}</p>
            </div>
            <div style="color: #334155">
                <h3>Course Overview</h3>
                <p>Select a specific week from the sidebar to view teaching strategies and content.</p>
            </div>
        `;
    } else {
        const session = course.sessions.find(s => s.id === sessionId);
        main.innerHTML = `
            <div class="session-card">
                <h2 style="color:var(--primary-color)">${session.title}</h2>
                <div class="instruction-block">
                    <h4>👨‍🏫 Teaching Strategy</h4>
                    <p>${session.strategy}</p>
                </div>
                <div class="instruction-block">
                    <h4>🗣️ Key Talking Points</h4>
                    <ul>${session.points.map(p => `<li>${p}</li>`).join('')}</ul>
                </div>
                <div class="instruction-block">
                    <h4>💻 Visuals / Demonstrations</h4>
                    <p>${session.visuals}</p>
                </div>
            </div>
            
            <div class="ai-prompt-container">
                <label><strong>Refine this session with AI</strong></label>
                <textarea rows="2" id="ai-refine-prompt" placeholder="e.g., Add a group activity for 15 minutes..."></textarea>
                <button class="ai-send-btn" onclick="handleAIUpdate()">Update</button>
            </div>
        `;
    }
}

/**
 * Handles the "Update" button click in the view page.
 */
function handleAIUpdate() {
    const prompt = document.getElementById('ai-refine-prompt').value;
    if(!prompt) {
        alert("Please enter a prompt first.");
        return;
    }
    console.log(`[Mock API] Sending refinement to ${API_UPDATE_ENDPOINT}: ${prompt}`);
    alert("Request sent to AI! (Check console for mock API call)");
}

// Boot the application
init();