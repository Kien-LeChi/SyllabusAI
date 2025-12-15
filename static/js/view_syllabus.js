/**
 * View Syllabuses Logic
 * Fetches real data from Flask/SQLAlchemy and renders the sidebar/content.
 */

const CONSTANTS = {
    API_GET_COURSES: '/api/get-all-courses',
    API_UPDATE_AI: '/api/update-syllabus',
    API_GET_SESSIONS: '/api/get-week-sessions',
    API_GENERATE_SESSIONS: '/api/generate-week-sessions', // New Endpoint
    // ### NEW CODE ###
    API_REGENERATE_SESSION: '/api/regenerate-week-sessions' // New Endpoint for regeneration
    // ### NEW CODE ###
};
// State management
let coursesData = [];
let activeCourseId = null;

/**
 * Initialization: Fetches data from the server.
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchCourses();
});

/**
 * Fetches the hierarchical course data from the Flask API.
 */
async function fetchCourses() {
    try {
        const response = await fetch(CONSTANTS.API_GET_COURSES);
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status} ${response.statusText}`);
        }
        
        coursesData = await response.json();
        
        if (coursesData.length > 0) {
            renderSidebar();
            // Automatically open the first course for better UX
            toggleCourseDropdown(coursesData[0].id);
            renderContent(coursesData[0].id, 'intro');
        } else {
            renderEmptyState();
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        document.getElementById('course-list-container').innerHTML = 
            `<li style="color:red; padding:1rem; list-style:none;">
                <strong>Error loading data.</strong><br>
                <small>${error.message}</small>
            </li>`;
    }
}

/**
 * Renders a message if the database is empty.
 */
function renderEmptyState() {
    document.getElementById('course-list-container').innerHTML = 
        '<li style="color:var(--text-muted); font-style:italic; padding:1rem; list-style:none;">No courses found in database.</li>';
}

/**
 * Renders the Sidebar Navigation (Courses -> Weeks)
 */
function renderSidebar() {
    const container = document.getElementById('course-list-container');
    container.innerHTML = '';

    coursesData.forEach(course => {
        const li = document.createElement('li');
        li.className = 'course-item';

        // 1. Course Header (Click to toggle)
        const header = document.createElement('div');
        header.className = `course-header ${activeCourseId === course.id ? 'active' : ''}`;
        // Using course.code and course.name from DB
        header.innerHTML = `<span>${course.code || ''} ${course.name}</span> <span>▼</span>`;
        header.onclick = () => toggleCourseDropdown(course.id);

        // 2. Dropdown List (Container for Intro + Weeks)
        const dropdownUl = document.createElement('ul');
        dropdownUl.className = `session-list ${activeCourseId === course.id ? 'open' : ''}`;
        dropdownUl.id = `weeks-list-${course.id}`;

        // A. Static 'Introduction' Item
        const introLi = document.createElement('li');
        introLi.className = 'session-item';
        introLi.innerText = 'Course Introduction';
        introLi.onclick = (e) => {
            e.stopPropagation(); // Prevent triggering the header click
            renderContent(course.id, 'intro');
        };
        dropdownUl.appendChild(introLi);

        // B. Dynamic Week Items from Database
        if (course.weeks && course.weeks.length > 0) {
            course.weeks.forEach(week => {
                const weekLi = document.createElement('li');
                weekLi.className = 'session-item';
                // Display "Week X: Topic Name"
                weekLi.innerText = `Week ${week.week_number}: ${week.topic}`;
                weekLi.onclick = (e) => {
                    e.stopPropagation();
                    renderContent(course.id, 'week', week.id);
                };
                dropdownUl.appendChild(weekLi);
            });
        } else {
            // Fallback if no weeks exist yet
            const emptyLi = document.createElement('li');
            emptyLi.style.padding = '8px 15px';
            emptyLi.style.fontSize = '0.85em';
            emptyLi.style.color = '#888';
            emptyLi.innerText = '(No weeks generated)';
            dropdownUl.appendChild(emptyLi);
        }

        li.appendChild(header);
        li.appendChild(dropdownUl);
        container.appendChild(li);
    });
}

/**
 * Toggles the sidebar dropdown open/close state.
 */
function toggleCourseDropdown(courseId) {
    // If clicking the already open course, close it. Otherwise, open the new one.
    activeCourseId = (activeCourseId === courseId) ? null : courseId;
    renderSidebar(); // Re-render to apply CSS classes
}

/**
 * Renders the Main Content Area
 * @param {number} courseId - ID of the course
 * @param {string} type - 'intro' or 'week'
 * @param {number} [weekId] - Optional, required if type is 'week'
 */
function renderContent(courseId, type, weekId = null) {
    const course = coursesData.find(c => c.id === courseId);
    const main = document.getElementById('main-content');
    
    if (!course) return;

    if (type === 'intro') {
        // --- VIEW 1: Course Metadata ---
        main.innerHTML = `
            <div class="syllabus-meta-header">
                <h2>${course.name} <span style="font-size:0.6em; color:#666">(${course.code || 'No Code'})</span></h2>
                <p>
                    <strong>Duration:</strong> ${course.duration || '?'} Weeks | 
                    <strong>Sessions:</strong> ${course.sessionsPerWeek || '?'} per week
                </p>
                <hr style="margin: 1rem 0; border:0; border-top:1px solid #ddd;">
                
                <div class="meta-block">
                    <h4>🎯 Content</h4>
                    <p>${course.content || 'No objectives defined.'}</p>
                </div>

                <div class="meta-block">
                    <h4>🎯 Course Objectives</h4>
                    <p>${course.objectives || 'No objectives defined.'}</p>
                </div>
                <br>
                <div class="meta-block">
                    <h4>📚 Prerequisites</h4>
                    <p>${course.prerequisites || 'None.'}</p>
                </div>
            </div>
            
            <div style="margin-top: 2rem; color: #334155; padding: 1rem; background-color: #f8fafc; border-radius: 6px;">
                <h3>Ready to teach?</h3>
                <p>Select a specific <strong>Week</strong> from the sidebar to view the topic summary and detailed session plans.</p>
            </div>
        `;
    } 
    else if (type === 'week') {
        // --- VIEW 2: Week Details ---
        const week = course.weeks.find(w => w.id === weekId);
        if (!week) return;

        renderWeekView(week, courseId);
    }
}

/**
 * Renders the Week View using HTML Templates
 */
function renderWeekView(week, courseId) {
    const main = document.getElementById('main-content');

    // 1. Basic Week Structure
    main.innerHTML = `
        <div class="session-card">
            <h2 style="color:#2563eb">Week ${week.week_number}: ${week.topic}</h2>
            <div class="instruction-block">
                <h4>📅 Weekly Summary</h4>
                <p style="white-space: pre-wrap;">${week.summary}</p>
            </div>
            <div id="session-details-container" class="instruction-block"></div>
            <div id="session-regeneration-container" class="instruction-block" style="margin-top: 2rem;"></div>
            </div>
    `;

    const container = document.getElementById('session-details-container');
    // ### NEW CODE ###
    const regenContainer = document.getElementById('session-regeneration-container');
    // ### NEW CODE ###

    // 2. Logic: Show Details or Show Generate Button
    if (week.planned) {
        // If planned, fetch and show details
        container.innerHTML = '<p>Loading details...</p>';
        loadSessionDetails(week.id);
        
        // ### NEW CODE ###
        // If planned, show the regeneration prompt/button
        const template = document.getElementById('regenerate-sessions-template');
        if (template) {
            const clone = template.content.cloneNode(true);
            
            // Add Event Listener to the cloned button
            const btn = clone.querySelector('.regenerate-btn');
            // The prompt input field
            const promptInput = clone.querySelector('.regeneration-prompt-input');
            
            btn.onclick = () => handleRegenerateClick(week.id, courseId, promptInput.value);
            
            regenContainer.appendChild(clone);
        }
        // ### NEW CODE ###
    } else {
        // If NOT planned, Clone the Template from HTML
        const template = document.getElementById('generate-minutes-template');
        if (template) {
            const clone = template.content.cloneNode(true);
            
            // Add Event Listener to the cloned button
            const btn = clone.querySelector('.generate-btn');
            btn.onclick = () => handleGenerateClick(week.id, courseId);
            
            container.appendChild(clone);
        }
    }
}

/**
 * Toggles the sidebar dropdown open/close state.
 */
function toggleCourseDropdown(courseId) {
    // If clicking the already open course, close it. Otherwise, open the new one.
    activeCourseId = (activeCourseId === courseId) ? null : courseId;
    renderSidebar(); // Re-render to apply CSS classes
}

/**
 * HANDLER: Trigger AI Generation for a specific week
 */
async function handleGenerateClick(weekId, courseId) {
    const container = document.getElementById('session-details-container');
    
    // 1. Update UI to Loading State
    updateLoadingState(container, 'AI is generating minute-by-minute plans...');

    try {
        // 2. Call the API
        const response = await fetch(CONSTANTS.API_GENERATE_SESSIONS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week_id: weekId })
        });

        await handleGenerationResponse(response, courseId, weekId);
        
    } catch (error) {
        console.error('Generation error:', error);
        container.innerHTML = `<p style="color:red">Error while generating sessions: ${error.message || 'Server connection failed'}</p>`;
    }
}

// ### NEW CODE ###
/**
 * HANDLER: Trigger AI Regeneration for a specific week with a prompt
 */
async function handleRegenerateClick(weekId, courseId, prompt) {
    // We update the regeneration container to show loading
    const container = document.getElementById('session-regeneration-container');
    
    // 1. Update UI to Loading State
    updateLoadingState(container, 'AI is regenerating sessions based on your prompt...');

    try {
        // 2. Call the API
        const response = await fetch(CONSTANTS.API_REGENERATE_SESSION, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                week_id: weekId,
                prompt: prompt // Include the user's prompt
            })
        });

        // 3. Handle response, but we don't need to update `planned` state since it was already planned
        if (response.ok) {
            // Find week to refresh the view
            const course = coursesData.find(c => c.id === courseId);
            const week = course.weeks.find(w => w.id === weekId);
            
            // The content container needs a loading update before the fetch to show regeneration is working
            const detailsContainer = document.getElementById('session-details-container');
            detailsContainer.innerHTML = '<p>Refreshing session details...</p>';
            
            // Refresh View
            renderWeekView(week, courseId);
        } else {
            const errorData = await response.json();
            container.innerHTML = `<p style="color:red">Regeneration Failed: ${errorData.error || 'Unknown error'}</p>`;
        }
    } catch (error) {
        console.error('Regeneration error:', error);
        container.innerHTML = `<p style="color:red">Error while regenerating sessions: ${error.message || 'Server connection failed'}</p>`;
    }
}

/**
 * Helper to update the UI to a loading/spinner state.
 */
function updateLoadingState(element, message) {
    element.innerHTML = `
        <div style="text-align:center; padding: 2rem;">
            <div class="spinner" style="margin: 0 auto 1rem auto; width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="color: #64748b">${message}</p>
        </div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;
}

/**
 * Helper to handle the common response logic for generation/regeneration.
 */
async function handleGenerationResponse(response, courseId, weekId) {
    const container = document.getElementById('session-details-container');
    
    if (response.ok) {
        // 3. Update Local Data State
        const course = coursesData.find(c => c.id === courseId);
        const week = course.weeks.find(w => w.id === weekId);
        // Ensure planned status is set
        if (week) {
            week.planned = true;
        }

        // 4. Refresh View
        renderWeekView(week, courseId);
    } else {
        const errorData = await response.json();
        container.innerHTML = `<p style="color:red">Generation Failed: ${errorData.error || 'Unknown error'}</p>`;
    }
}
// ### NEW CODE ###

async function loadSessionDetails(weekId) {
    const container = document.getElementById('session-details-container');

    try {
        const response = await fetch('/api/get-week-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ week_id: weekId })
        });

        const data = await response.json();

        if (response.ok) {
            // Clear the "Loading..." text
            container.innerHTML = '<h4>📚 Detailed Session Plan</h4>';

            // Loop through each session found
            data.sessions.forEach((session, index) => {
                const minutesData = session.minutes_data;
                
                // Create a wrapper for this session
                let sessionHtml = `<div class="session-item" style="margin-bottom: 20px; border-left: 3px solid var(--secondary-color); padding-left: 15px;">`;
                sessionHtml += `<h5>Session ${index + 1}</h5>`;

                // Loop through the minutes keys (e.g., "Minutes 00-15")
                // Object.entries converts {"key": val} into [["key", val], ...]
                for (const [timeRange, contentObj] of Object.entries(minutesData)) {
                    sessionHtml += `
                        <div style="background: #f8f9fa; padding: 10px; margin-bottom: 8px; border-radius: 6px;">
                            <strong style="color: #4b5563;">⏱️ ${timeRange}: ${contentObj.topic}</strong>
                            <p style="margin-top: 5px; font-size: 0.95em; color: #374151;">${contentObj.content}</p>
                        </div>
                    `;
                }
                
                sessionHtml += `</div>`;
                container.innerHTML += sessionHtml;
            });

        } else {
            container.innerHTML = `<p style="color:red">Error loading sessions: ${data.error}</p>`;
        }
    } catch (error) {
        console.error("Fetch error:", error);
        container.innerHTML = `<p style="color:red">Failed to connect to server.</p>`;
    }
}