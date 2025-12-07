/* =========================================
    SYLLABUS AI - CLIENT SCRIPT
    Refactored for Flask Backend Integration
    ========================================= */

// Configuration Constants
const API_ENDPOINTS = {
    GENERATE_STRUCTURE: '/api/generate-course-structure/',
    GENERATE_WEEK_CONTENT: '/api/generate-week-contents/',
    GET_ALL_COURSES: '/api/get-all-courses' // Added endpoint for sidebar
};

// The URL to redirect to after successful generation or clicking a course.
const VIEW_SYLLABUS_URL = '/view-syllabus'; 

/**
 * Initialization
 * Waits for the DOM to be fully loaded before attaching listeners.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Attach Form Listeners
    const syllabusForm = document.getElementById('syllabus-form');
    if (syllabusForm) {
        syllabusForm.addEventListener('submit', handleCourseGeneration);
    }

    // 2. Fetch and Render Sidebar Courses
    fetchCourses();
});

/**
 * Fetch Courses for Sidebar
 * Retrieves all courses to display in the "My Courses" list.
 */
async function fetchCourses() {
    try {
        const response = await fetch(API_ENDPOINTS.GET_ALL_COURSES);
        if (response.ok) {
            const courses = await response.json();
            renderSidebar(courses);
        } else {
            console.error("Failed to fetch courses for sidebar.");
        }
    } catch (error) {
        console.error("Error loading sidebar courses:", error);
    }
}

/**
 * Render Sidebar
 * Populates the course list in the sidebar.
 * Clicking a course redirects to the view-syllabus page.
 */
function renderSidebar(courses) {
    const container = document.getElementById('course-list-container');
    if (!container) return;

    container.innerHTML = ''; // Clear existing content

    if (courses.length === 0) {
        container.innerHTML = '<li style="padding:1rem; font-style:italic; color:#888;">No courses found.</li>';
        return;
    }

    courses.forEach(course => {
        const li = document.createElement('li');
        li.className = 'course-item';
        
        // Simple list item for the index page (no dropdown needed here)
        li.innerHTML = `
            <div class="course-header" style="cursor: pointer; padding: 10px; border-bottom: 1px solid #eee;">
                <span>${course.code} ${course.name}</span>
                <span>→</span>
            </div>
        `;

        // Redirect to the View Syllabus page when clicked
        // We pass the course_id as a hash or query param if your view logic supported it,
        // but for now, we simply redirect to the main view.
        li.onclick = () => {
            window.location.href = VIEW_SYLLABUS_URL; 
        };

        container.appendChild(li);
    });
}

/**
 * Toggle Loader
 * Controls the visibility of the loading overlay.
 * @param {boolean} show - True to show, false to hide.
 */
function toggleLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Handle Course Generation
 * 1. Prevents default form submission.
 * 2. Scrapes data from DOM based on IDs.
 * 3. Sends POST request to Flask API.
 * 4. Redirects to the syllabus view on success.
 */
async function handleCourseGeneration(event) {
    event.preventDefault(); // Stop standard HTML form submission
    toggleLoader(true);

    try {
        const formData = new FormData();
        
        formData.append('teacherEmail', document.getElementById('teacherEmail').value)
        formData.append('courseCode', document.getElementById('courseCode').value)
        formData.append('courseName', document.getElementById('courseName').value);
        formData.append('content', document.getElementById('courseContent').value);
        formData.append('objectives', document.getElementById('courseObjectives').value);
        formData.append('prerequisites', document.getElementById('prerequisites').value);
        formData.append('duration', document.getElementById('duration').value);
        formData.append('sessionsPerWeek', document.getElementById('sessions').value);
        formData.append('homework', document.getElementById('homework').value);

        const response = await fetch(API_ENDPOINTS.GENERATE_STRUCTURE, {
            method: 'POST',
            body: formData 
        });

        if (response.ok) {
            console.log("Course generated successfully. Redirecting...");
            window.location.href = VIEW_SYLLABUS_URL;
        } else {
            const errorData = await response.json();
            console.error('Server Error:', errorData);
            alert(`Error: ${errorData.message || 'Failed to generate syllabus'}`);
        }

    } catch (error) {
        console.error('Error:', error);
        alert("An unexpected error occurred.");
    } finally {
        toggleLoader(false);
    }
}