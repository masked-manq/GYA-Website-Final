/*----------------------------------------SOLLENTUNA EVENTS--------------------------------*/
// this file does the frontend stuff for sollentuna

// global variables because why not
let allTheEvents = [];
let mapObject;
let mapMarkers = [];
let eventCounter = {}; // counts events i guess




// function to make the map work
function initializeMap() 
{
    mapObject = L.map('map').setView([59.428, 17.950], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
        {
            attribution: '© OpenStreetMap'
        }
    )
    
    .addTo(mapObject);
}



// start everything
async function startApp() 
{
    initializeMap();
    await getEventsData();
    setupClickHandlers();
}




// get events from api
async function getEventsData() 
{
    const apiResponse = await fetch('/api/events');
    allTheEvents = await apiResponse.json();


    
    // add random numbers for people going to events
    allTheEvents.forEach(dayItem => 
        {
            dayItem.events.forEach(eventItem => 
                {
                    eventItem.goingCount = Math.floor(Math.random() * 50) + 1;
                    eventItem.userClicked = false;
                }
            );
        }
    );


    
    displayEvents();
    updateFilterOptions();
    putEventsOnMap();
}






// show events in sidebar
function displayEvents(eventsToShow = allTheEvents) 
{
    const sidebarElement = document.getElementById('sidebar');
    
    if (!eventsToShow || eventsToShow.length === 0) 
    {
        sidebarElement.innerHTML = '<div class="no-events">No events found bruh</div>';
        return;
    }

    // group by month because thats what masa want
    const monthsObject = {};

    eventsToShow.forEach(dayObj => 
        {
            const dateObj = new Date(dayObj.isoDate);
            const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!monthsObject[monthName]) 
            {
                monthsObject[monthName] = [];
            }
            monthsObject[monthName].push(dayObj);  // <-- Always push the dayObj!
        }
    );


    let htmlString = '';
    for (const [monthName, daysArray] of Object.entries(monthsObject)) 
    {
        const totalEventsCount = daysArray.reduce((total, day) => total + day.events.length, 0);


        htmlString += `
            <button class="collapsible">${monthName} (${totalEventsCount} events)</button>


            <div class="content">
                ${daysArray.map(day => 
                    `
                        <div class="day-events">


                            <h4 style="margin: 1rem 0 0.5rem 0; color: var(--accent);">${day.date}</h4>


                            ${day.events.map(event => 
                                `
                                    <div class="card" data-event-id="${event.id}" onclick="focusOnMapMarker('${event.id}')">
                                        <h3>${event.title}</h3>
                                        <p>📅 ${day.date} | 🕒 ${event.time || 'All day'}</p>
                                        <p>📍 ${event.location}</p>


                                        <div class="going-counter" onclick="handleGoingClick('${event.id}', event)">
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





    sidebarElement.innerHTML = htmlString;
    setupCollapsibleSections();
}









// when someone clicks the going button
function handleGoingClick(eventId, clickEvent) 
{
    clickEvent.stopPropagation();
    
    // find the event in our data
    let targetEventObject = null;
    allTheEvents.forEach(day => 
        {
            day.events.forEach(event => 
                {
                    if (event.id === eventId) 
                    {
                        targetEventObject = event;
                    }
                }
            );
        }
    );
    
    // if found and not clicked before count
    if (targetEventObject && !targetEventObject.userClicked) 
    {
        targetEventObject.goingCount++;
        targetEventObject.userClicked = true;
        
        // update the display
        const goingButton = clickEvent.currentTarget;
        const countSpan = goingButton.querySelector('.going-count');
        countSpan.textContent = targetEventObject.goingCount;
        
        // make it green for a bit
        goingButton.style.background = '#dcfce7';
        goingButton.style.borderColor = '#22c55e';
        setTimeout(() => 
            {
                goingButton.style.background = '#f0f9ff';
                goingButton.style.borderColor = '#bae6fd';
            }, 1000
        );
    }
}

// put events on the map
function putEventsOnMap(eventsForMap = allTheEvents) 
{
    // remove old markers first
    mapMarkers.forEach(marker => mapObject.removeLayer(marker));
    mapMarkers = [];



    let foundEvents = false;




    // add new markers
    eventsForMap.forEach(day => 
        {
            day.events.forEach(event => 
                {
                    if (event.coordinates) 
                    {
                        foundEvents = true;
                        const newMarker = L.marker([event.coordinates.lat, event.coordinates.lng])
                            .addTo(mapObject)


                            .bindPopup(`
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
                        
                        newMarker.eventId = event.id;
                        mapMarkers.push(newMarker);
                    }
                }
            );
        }
    );



    // adjust map view
    if (foundEvents && mapMarkers.length > 0) 
    {
        const markerGroup = new L.featureGroup(mapMarkers);
        mapObject.fitBounds(markerGroup.getBounds().pad(0.1));
    }
}

// zoom to event when clicked
function focusOnMapMarker(eventId) 
{
    const marker = mapMarkers.find(m => m.eventId === eventId);
    if (marker) 
    {
        mapObject.setView(marker.getLatLng(), 15);
        marker.openPopup();
    }
}



// update filter dropdown
function updateFilterOptions() 
{
    const filterSelect = document.getElementById('typeFilter');
    const typeSet = new Set();

    
    allTheEvents.forEach(day => 
        {
            day.events.forEach(event => 
                {
                    if (event.tag) typeSet.add(event.tag);
                }
            );
        }
    );





    filterSelect.innerHTML = '<option value="all">All Events</option>';

    typeSet.forEach(type => 
        {
            const optionElement = document.createElement('option');
            optionElement.value = type;
            optionElement.textContent = type;

            filterSelect.appendChild(optionElement);
        }
    );
}



// filter events based on selection
function applyEventFilters() 
{
    const selectedType = document.getElementById('typeFilter').value;
    const startDateValue = document.getElementById('startDate').value;
    const endDateValue = document.getElementById('endDate').value;




    let filteredEvents = allTheEvents.filter(day => 
        {
            // date filtering
            if (startDateValue && new Date(day.isoDate) < new Date(startDateValue)) 
            return false;


            if (endDateValue && new Date(day.isoDate) > new Date(endDateValue)) 
            return false;



            // type filtering
            if (selectedType !== 'all') 
            {
                day.events = day.events.filter(event => event.tag === selectedType);
            }

            return day.events.length > 0;
        }
    );

    displayEvents(filteredEvents);
    putEventsOnMap(filteredEvents);
}



// make collapsible sections work
function setupCollapsibleSections() 
{
    const collapsibleButtons = document.querySelectorAll('.collapsible');

    collapsibleButtons.forEach(button => 
        {
            button.addEventListener('click', function() 
                {
                    this.classList.toggle('active');
                    const contentDiv = this.nextElementSibling;

                    contentDiv.style.display = contentDiv.style.display === 'block' ? 'none' : 'block';
                }
            );
        }
    );

    // open first section by default
    if (collapsibleButtons.length > 0) 
    {
        collapsibleButtons[0].click();
    }
}

// setup event listeners
function setupClickHandlers() 
{
    document.getElementById('applyFilters').addEventListener('click', applyEventFilters);
    
    // enter key for date inputs
    ['startDate', 'endDate'].forEach(id => 
        {
            document.getElementById(id).addEventListener('keypress', function(e) 
                {
                    if (e.key === 'Enter') 
                        applyEventFilters();


                }
            );
        }
    );
}

// start when page loads
document.addEventListener('DOMContentLoaded', startApp);

/*----------------------------------------SOLLENTUNA EVENTS END--------------------------------*/

/*----------------------------------------CONTACT FORM STUFF-------------------------------*/

document.addEventListener('DOMContentLoaded', function() {
    const contactFormElement = document.getElementById('contactForm');
    const successMsgElement = document.getElementById('successMessage');


    contactFormElement.addEventListener('submit', function(e) 
    {
        e.preventDefault();
        
        // check if form is filled
        const nameValue = document.getElementById('name').value;
        const emailValue = document.getElementById('email').value;
        const messageValue = document.getElementById('message').value;
        
        if (nameValue && emailValue && messageValue) 
        {
            // show success message
            successMsgElement.classList.add('show');
            
            // clear form
            contactFormElement.reset();
            
            // hide message after 5 seconds
            setTimeout(() => {
                successMsgElement.classList.remove('show');
            }, 5000);
        }
    });



    // make input borders change color
    const formInputs = contactFormElement.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', function() 
        {
            if (this.value.trim() === '') 
            {
                this.style.borderColor = '#ef4444';
            } 
            
            else 
            {
                this.style.borderColor = '#10b981';
            }
        });
        
        input.addEventListener('focus', function() 
        {
            this.style.borderColor = "var(--accent)";
        });
    });
});

/*----------------------------------------CONTACT FORM STUFF END-------------------------------*/