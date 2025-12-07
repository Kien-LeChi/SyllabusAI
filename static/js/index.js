/* =========================================
    SYLLABUS AI - CLIENT SCRIPT
    Refactored for Flask Backend Integration
    ========================================= */

// Configuration Constants
const API_ENDPOINTS = {
    GENERATE_STRUCTURE: '/api/generate-course-structure/',
    GENERATE_WEEK_CONTENT: '/api/generate-week-contents/'
};

// The URL to redirect to after successful generation.
// In Flask, this matches the route for the view_syllabus function.
const VIEW_SYLLABUS_URL = '/view-syllabus'; 

/**
 * Initialization
 * Waits for the DOM to be fully loaded before attaching listeners.
 * This replaces the app.init() pattern.
 */
document.addEventListener('DOMContentLoaded', () => {
    const syllabusForm = document.getElementById('syllabus-form');
    
    if (syllabusForm) {
        syllabusForm.addEventListener('submit', handleCourseGeneration);
    }
});

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
        // 1. Construct FormData manually to ensure keys match your API requirements.
        // We use manual ID selection because the HTML inputs might lack 'name' attributes.
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

        console.log(formData);

        // 2. Send Data to Flask Backend
        const response = await fetch(API_ENDPOINTS.GENERATE_STRUCTURE, {
            method: 'POST',
            body: formData 
            // Note: Content-Type header is not set manually here. 
            // The browser automatically sets it to multipart/form-data with the boundary when using FormData.
        });

        // 3. Handle Response
        if (response.ok) {
            // Option A: The server returns the redirect URL in JSON
            // const data = await response.json();
            // window.location.href = data.redirect_url;

            // Option B: We hardcode the view URL as requested
            console.log("Course generated successfully. Redirecting...");
            window.location.href = VIEW_SYLLABUS_URL;
        } else {
            const errorData = await response.json();
            console.error('Server Error:', errorData);
            alert(`Error: ${errorData.message || 'Failed to generate syllabus'}`);
            toggleLoader(false);
        }

    } catch (error) {
        console.error('Error:', error);
        toggleLoader(false);
    }
}

/**
 * Generate Week Contents
 * This function is prepared for the detailed view logic.
 * It calls the second API endpoint you described.
 * * @param {string} courseCode - The identifier for the course.
 * @param {number} weekNumber - The specific week to generate.
 */
async function generateWeekContent(courseCode, weekNumber) {
    toggleLoader(true);

    const payload = {
        courseCode: courseCode,
        weekNumber: weekNumber
    };

    try {
        const response = await fetch(API_ENDPOINTS.GENERATE_WEEK_CONTENT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const detailedSessionData = await response.json();
            console.log("Detailed Session Data Received:", detailedSessionData);
            
            // Logic to render this JSON into the UI would go here
            // e.g., renderSessionDetails(detailedSessionData);
            
            return detailedSessionData;
        } else {
            console.error("Failed to fetch week details");
        }
    } catch (error) {
        console.error("Error fetching week details:", error);
    } finally {
        toggleLoader(false);
    }
}