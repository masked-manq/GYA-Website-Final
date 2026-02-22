/*---------------------------------TÄBY EVENTS--------------------------------*/
// täby events javascript file

// variables for täby
let täbyEvents = [];
let täbyMap;
let täbyMarkers = [];

// initialize map for täby
function initTäbyMap() 
{
    täbyMap = L.map('map').setView([59.4439, 18.0687], 13);
    
    L.tileLayer
    ('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
        {
            attribution: '© OpenStreetMap'
        }
    ).addTo(täbyMap);
}





// start täby app
async function startTäbyApp() 
{
    initTäbyMap();
    await loadTäbyEvents();
    setupTäbyEventListeners();
}




// get täby events from api
async function loadTäbyEvents() 
{
    const responseData = await fetch('/api/events/taby');
    täbyEvents = await responseData.json();


    
    // add random going counts
    täbyEvents.forEach
    (dayItem => 
        {
            dayItem.events.forEach
            (eventItem => 
                {
                    eventItem.goingCount = Math.floor(Math.random() * 50) + 1;
                    eventItem.userClicked = false;
                }
            );
        }
    );



    
    renderTäbyEvents();
    plotTäbyEventsOnMap();
}








// display täby events
function renderTäbyEvents(filteredEvents = täbyEvents) 
{
    const sidebar = document.getElementById('sidebar');
    
    if (!filteredEvents || filteredEvents.length === 0) 
    {
        sidebar.innerHTML = '<div class="no-events">No Täby events found</div>';
        return;
    }


    // group by month
    const monthGroups = {};
    filteredEvents.forEach
    (day => 
        {
            const dateObj = new Date(day.isoDate);
            const monthKey = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });


            if (!monthGroups[monthKey]) 
            {
                monthGroups[monthKey] = [];
            }
            monthGroups[monthKey].push(day); // This is some bullshit 
        }
    );






    let htmlOutput = '';
    for (const [month, days] of Object.entries(monthGroups)) 
    {
        const totalCount = days.reduce((sum, day) => sum + day.events.length, 0);


        htmlOutput += `
            <button class="collapsible">${month} (${totalCount} events)</button>

            <div class="content">
                ${days.map(day => 
                    `
                        <div class="day-events">

                        
                            <h4 style="margin: 1rem 0 0.5rem 0; color: var(--accent);">${day.date}</h4>

                            ${day.events.map(event => 
                                `
                                    <div class="card" data-event-id="${event.id}" onclick="focusTäbyEvent('${event.id}')">
                                        <h3>${event.title}</h3>
                                        <p>📅 ${day.date} | 🕒 ${event.time || 'All day'}</p>
                                        <p>📍 ${event.location}</p>


                                        <div class="going-counter" onclick="handleTäbyGoingClick('${event.id}', event)">
                                            <span class="going-count">${event.goingCount}</span> people going
                                        </div>


                                        ${event.tag ? `<span class="tag">${event.tag}</span>` : ''}
                                    </div>
                                `).join('')
                            }
                        </div>
                    `).join('')
                }
            </div>
        `;
    }



    sidebar.innerHTML = htmlOutput;
    setupTäbyCollapsibles();
}







// handle going button click for täby
function handleTäbyGoingClick(eventId, clickEvent) 
{
    clickEvent.stopPropagation();
    // find event
    let targetEvent = null;


    täbyEvents.forEach(day => 
    {
        day.events.forEach(event => 
        {
            if (event.id === eventId) 
            {
                targetEvent = event;
            }
        });
    });




    
    if (targetEvent && !targetEvent.userClicked) 
    {
        targetEvent.goingCount++;
        targetEvent.userClicked = true;

        
        // update display
        const counterElement = clickEvent.currentTarget;
        const countSpan = counterElement.querySelector('.going-count');
        countSpan.textContent = targetEvent.goingCount;
        
        // green effect
        counterElement.style.background = '#dcfce7';
        counterElement.style.borderColor = '#22c55e';



        setTimeout(() => 
            {
                counterElement.style.background = '#f0f9ff';
                counterElement.style.borderColor = '#bae6fd';
            }, 1000
        );
    }
}










// put täby events on map
function plotTäbyEventsOnMap(filteredEvents = täbyEvents) 
{
    // clear old markers
    täbyMarkers.forEach(marker => täbyMap.removeLayer(marker));
    täbyMarkers = [];


    let hasEventsFlag = false;


    // add new markers
    filteredEvents.forEach(day => 
    {
        day.events.forEach(event => 
        {
            if (event.coordinates) 
            {
                hasEventsFlag = true;

                const marker = L.marker([event.coordinates.lat, event.coordinates.lng])
                    .addTo(täbyMap)


                    .bindPopup(
                    `   
                        <div style="min-width: 200px;">

                            <h3>${event.title}</h3>

                            <p><strong>Date:</strong> ${day.date}</p>
                            <p><strong>Time:</strong> ${event.time || 'All day'}</p>
                            <p><strong>Location:</strong> ${event.location}</p>
                            <p><strong>Going:</strong> ${event.goingCount} people</p>


                            ${event.tag ? `<p><strong>Type:</strong> ${event.tag}</p>` : ''}
                            ${event.link ? `<a href="${event.link}" target="_blank" style="color: #3b82f6;">More Info</a>` : ''}
                        </div>
                    `);


                
                marker.eventId = event.id;
                täbyMarkers.push(marker);
            }
        });
    });





    // adjust map view
    if (hasEventsFlag && täbyMarkers.length > 0) 
    {
        const markerGroup = new L.featureGroup(täbyMarkers);
        täbyMap.fitBounds(markerGroup.getBounds().pad(0.1));
    }
}




// zoom to täby event
function focusTäbyEvent(eventId) 
{
    const marker = täbyMarkers.find(m => m.eventId === eventId);


    if (marker) 
    {
        täbyMap.setView(marker.getLatLng(), 15);
        marker.openPopup();
    }
}

// filter täby events
function filterTäbyEvents() 
{
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;


    let filtered = täbyEvents.filter(day => 
    {
        // date filtering
        if (startDate && new Date(day.isoDate) < new Date(startDate)) 
        return false;


        if (endDate && new Date(day.isoDate) > new Date(endDate)) 
        {
            return false;

        }
            return day.events.length > 0;    //???????????
    });






    renderTäbyEvents(filtered);
    plotTäbyEventsOnMap(filtered);
}

// collapsible sections for täby
function setupTäbyCollapsibles() 
{
    const collapsibleElements = document.querySelectorAll('.collapsible');
    collapsibleElements.forEach(element => 
    {

        element.addEventListener('click', function() 
        {
            this.classList.toggle('active');

            const content = this.nextElementSibling;
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        });
    });


    // open first section
    if (collapsibleElements.length > 0) 
    {
        collapsibleElements[0].click();
    }
}

// event listeners for täby
function setupTäbyEventListeners() 
{
    document.getElementById('applyFilters').addEventListener('click', filterTäbyEvents);
    
    // enter key for date inputs
    ['startDate', 'endDate'].forEach(id => 
    {
        document.getElementById(id).addEventListener('keypress', function(e) 
        {
            if (e.key === 'Enter') filterTäbyEvents();
        });
    });
}

// start täby app when ready
document.addEventListener('DOMContentLoaded', startTäbyApp);

/*---------------------------------TÄBY EVENTS END--------------------------------*/