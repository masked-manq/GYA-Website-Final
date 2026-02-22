/*---------------------------------UPPLANDS VÄSBY EVENTS--------------------------------*/
// upplands väsby events java file

// variables for upplands väsby
let vasbyEvents = [];
let vasbyMap;
let vasbyMarkers = [];

// initialize map for upplands väsby
function initVasbyMap() {
    vasbyMap = L.map('map').setView([59.5204, 17.9083], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(vasbyMap);
}

// start upplands väsby app
async function startVasbyApp() {
    initVasbyMap();
    await loadVasbyEvents();
    setupVasbyEventListeners();
}

// get upplands väsby events from api
async function loadVasbyEvents() {
    const responseData = await fetch('/api/events/vasby');
    vasbyEvents = await responseData.json();
    
    // add random going counts
    vasbyEvents.forEach(dayItem => {
        dayItem.events.forEach(eventItem => {
            eventItem.goingCount = Math.floor(Math.random() * 50) + 1;
            eventItem.userClicked = false;
        });
    });
    
    renderVasbyEvents();
    plotVasbyEventsOnMap();
}

// display upplands väsby events - FLAT LIST WITHOUT MONTH GROUPING
function renderVasbyEvents(filteredEvents = vasbyEvents) {
    const sidebar = document.getElementById('sidebar');
    
    if (!filteredEvents || filteredEvents.length === 0) {
        sidebar.innerHTML = '<div class="no-events">No Upplands Väsby events found</div>';
        return;
    }

    let htmlOutput = '';

    // FLAT LIST - no month grouping
    filteredEvents.forEach(day => {
        htmlOutput += `
            <div class="day-events">
                <h4 style="margin: 1rem 0 0.5rem 0; color: var(--accent);">${day.date}</h4>
                ${day.events.map(event => `
                    <div class="card" data-event-id="${event.id}" onclick="focusVasbyEvent('${event.id}')">
                        <h3>${event.title}</h3>
                        <p>📅 ${day.date} | 🕒 ${event.time || 'All day'}</p>
                        <p>📍 ${event.location}</p>
                        ${event.description ? `<p style="margin: 0.5rem 0; font-style: italic;">${event.description}</p>` : ''}
                        
                        <div class="going-counter" onclick="handleVasbyGoingClick('${event.id}', event)">
                            <span class="going-count">${event.goingCount}</span> people going
                        </div>

                        ${event.tag ? `<span class="tag">${event.tag}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    });

    sidebar.innerHTML = htmlOutput;
}

// handle going button click for upplands väsby
function handleVasbyGoingClick(eventId, clickEvent) {
    clickEvent.stopPropagation();
    
    // find event
    let targetEvent = null;
    vasbyEvents.forEach(day => {
        day.events.forEach(event => {
            if (event.id === eventId) {
                targetEvent = event;
            }
        });
    });
    
    if (targetEvent && !targetEvent.userClicked) {
        targetEvent.goingCount++;
        targetEvent.userClicked = true;
        
        // update display
        const counterElement = clickEvent.currentTarget;
        const countSpan = counterElement.querySelector('.going-count');
        countSpan.textContent = targetEvent.goingCount;
        
        // green effect
        counterElement.style.background = '#dcfce7';
        counterElement.style.borderColor = '#22c55e';
        
        setTimeout(() => {
            counterElement.style.background = '#f0f9ff';
            counterElement.style.borderColor = '#bae6fd';
        }, 1000);
    }
}

// put upplands väsby events on map
function plotVasbyEventsOnMap(filteredEvents = vasbyEvents) {
    // clear old markers
    vasbyMarkers.forEach(marker => vasbyMap.removeLayer(marker));
    vasbyMarkers = [];

    let hasEventsFlag = false;

    // add new markers
    filteredEvents.forEach(day => {
        day.events.forEach(event => {
            if (event.coordinates) {
                hasEventsFlag = true;
                
                const marker = L.marker([event.coordinates.lat, event.coordinates.lng])
                    .addTo(vasbyMap)
                    .bindPopup(`
                        <div style="min-width: 200px;">
                            <h3>${event.title}</h3>
                            <p><strong>Date:</strong> ${day.date}</p>
                            <p><strong>Time:</strong> ${event.time || 'All day'}</p>
                            <p><strong>Location:</strong> ${event.location}</p>
                            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
                            <p><strong>Going:</strong> ${event.goingCount} people</p>
                            ${event.tag ? `<p><strong>Type:</strong> ${event.tag}</p>` : ''}
                            ${event.link ? `<a href="${event.link}" target="_blank" style="color: #3b82f6;">More Info</a>` : ''}
                        </div>
                    `);
                
                marker.eventId = event.id;
                vasbyMarkers.push(marker);
            }
        });
    });

    // adjust map view
    if (hasEventsFlag && vasbyMarkers.length > 0) {
        const markerGroup = new L.featureGroup(vasbyMarkers);
        vasbyMap.fitBounds(markerGroup.getBounds().pad(0.1));
    }
}

// zoom to upplands väsby event
function focusVasbyEvent(eventId) {
    const marker = vasbyMarkers.find(m => m.eventId === eventId);
    
    if (marker) {
        vasbyMap.setView(marker.getLatLng(), 15);
        marker.openPopup();
    }
}

// filter upplands väsby events
function filterVasbyEvents() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    let filtered = vasbyEvents.filter(day => {
        // date filtering
        if (startDate && new Date(day.isoDate) < new Date(startDate)) return false;
        if (endDate && new Date(day.isoDate) > new Date(endDate)) return false;
        
        return day.events.length > 0;
    });

    renderVasbyEvents(filtered);
    plotVasbyEventsOnMap(filtered);
}

// event listeners for upplands väsby
function setupVasbyEventListeners() {
    document.getElementById('applyFilters').addEventListener('click', filterVasbyEvents);
    
    // enter key for date inputs
    ['startDate', 'endDate'].forEach(id => {
        document.getElementById(id).addEventListener('keypress', function(e) {
            if (e.key === 'Enter') filterVasbyEvents();
        });
    });
}

// start upplands väsby app when ready
document.addEventListener('DOMContentLoaded', startVasbyApp);

/*---------------------------------UPPLANDS VÄSBY EVENTS END--------------------------------*/