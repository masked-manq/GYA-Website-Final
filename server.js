// server.js - this shit scrapes events n stuff
import express from "express";
import puppeteer from "puppeteer";

const app = express();

//----------------------SOLLENTUNA SHIT---------------------//

// get events 
app.get
("/api/events", async (req, res) => 
  {
    let browserThing;
    try 
    {
      // start the browser thingy
      browserThing = await puppeteer.launch
      ({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const pageThing = await browserThing.newPage();




      // go to that website with events n stuff
      await pageThing.goto
      (
        "https://www.sollentuna.se/aktuell-kalender/?months=September%202025;Oktober%202025;November%202025;December%202025",
        { 
          waitUntil: "networkidle2", timeout: 30000 
        }
      );
      // wait for the events to show up hopefully
      await pageThing.waitForSelector(".c-events__item", { timeout: 10000 });

      // this part gets all the event data i think
      const eventsData = await pageThing.evaluate
      (() => 
        {
          const eventGroups = document.querySelectorAll("li.c-events__item");
          
          // make array from node list thingy
          const eventsArray = Array.from(eventGroups);
          
          let finalEvents = [];
          
          // loop through each group thing
          for (let i = 0; i < eventsArray.length; i++) 
          {
            const group = eventsArray[i];
            const dateElement = group.querySelector(":scope > time");
            const dateString = dateElement?.getAttribute("datetime") || "";
            const readableDate = dateElement?.innerText.trim() || "";

            if (!dateString) 
              continue; // skip if no date
            const eventsInGroup = group.querySelectorAll("ul.c-events__list > li.c-events__item");
            
            
            let eventsForThisDay = [];
            
            // loop through events in this group
            for (let j = 0; j < eventsInGroup.length; j++) 
            {
              const event = eventsInGroup[j];
              const titleElement = event.querySelector(".c-events__subheading a span");
              const titleText = titleElement?.innerText.trim() || "No title lol";
              const linkElement = event.querySelector(".c-events__subheading a");
              const linkUrl = linkElement?.href || "";
              const locationElement = event.querySelector(".c-events__location");
              const locationText = locationElement?.innerText.trim() || "Somewhere idk";
              
              // get time stuff
              const timeElements = event.querySelectorAll(".c-events__time time");
              let timeString = "";


              
              if (timeElements.length >= 2) 
              {
                timeString = `${timeElements[0].innerText.trim()} — ${timeElements[1].innerText.trim()}`;
              } 

              else if (timeElements.length === 1) 
              {
                timeString = timeElements[0].innerText.trim();
              }
              

              const tagElement = event.querySelector(".c-events__tag");
              const tagText = tagElement?.innerText.trim() || "";

              // make some fake id
              const eventId = `event-${dateString.replace(/[^a-zA-Z0-9]/g, '-')}-${j}`;
              
              // fake coordinates because i dont have real ones
              const fakeCoords = 
              {
                lat: 59.428 + (Math.random() - 0.5) * 0.01,
                lng: 17.950 + (Math.random() - 0.5) * 0.01
              };



              eventsForThisDay.push
              (
                { 
                  id: eventId,
                  title: titleText, 
                  link: linkUrl, 
                  time: timeString, 
                  location: locationText, 
                  tag: tagText,
                  coordinates: fakeCoords
                }
              );
            }
            



            finalEvents.push
            (
              { 
                date: readableDate,
                isoDate: dateString,
                events: eventsForThisDay
              }
            );
          }
          
          return finalEvents.filter(item => item !== null);
        }
      );

      await browserThing.close();
      res.json(eventsData);
    } 
    
    catch (error) 
    {
      if (browserThing) await browserThing.close();
      
      // if scraping fails just give up
      console.log("shit broke, using", error);
    }
  }
);

//----------------------SOLLENTUNA SHIT END---------------------//

















//---------------------TÄBY STUFF---------------------//

// täby events route
app.get
("/api/events/taby", async (req, res) => 
  {
    let browserInstance;


    try 
    {
      browserInstance = await puppeteer.launch
      (
        { 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      );
      const pageObject = await browserInstance.newPage();





      // go to täby website
      await pageObject.goto
      (
        "https://www.taby.se/evenemang/?ac=Fritid%20%26%20kultur",
        { waitUntil: "networkidle2", timeout: 30000 }
      );



      await pageObject.waitForSelector("li.item", { timeout: 10000 });

      const täbyEvents = await pageObject.evaluate
      (() => 
        {
          const eventItems = document.querySelectorAll("li.item");
          const eventsGroupedByDate = {};


          // loop through all the items
          Array.from(eventItems).forEach((item, index) => 
          {
            // get date info
            const timeElem = item.querySelector("time[datetime]");

            const isoDateStr = timeElem?.getAttribute("datetime") || "";

            const dayNameStr = timeElem?.querySelector("div:first-child")?.innerText.trim() || "";

            const dateTextStr = timeElem?.querySelector(".date")?.innerText.trim() || "";



            
            if (!isoDateStr)
              return;

            // get event details
            const titleElem = item.querySelector(".item-heading");
            const titleText = titleElem?.innerText.trim() || "No title";
            const locationElem = item.querySelector('[itemprop="location"]');
            let locationText = locationElem?.innerText.replace(/📍|📌/g, '').trim() || "Unknown place";
            const timeText = item.querySelector(".list-facts em")?.innerText.trim() || "";
            const linkUrl = item.querySelector(".item-link")?.href || "";
            
            // more fake coordinates
            const fakeTäbyCoords = 
            {
              lat: 59.4439 + (Math.random() - 0.5) * 0.02,
              lng: 18.0687 + (Math.random() - 0.5) * 0.02
            };



            const eventObj = 
            {
              id: `taby-event-${isoDateStr}-${index}`,
              title: titleText,
              location: locationText,
              time: timeText,
              link: linkUrl,
              tag: "Täby Event",
              coordinates: fakeTäbyCoords
            };

            // group by date
            if (!eventsGroupedByDate[isoDateStr]) 
            {
              eventsGroupedByDate[isoDateStr] = {
                date: `${dayNameStr}, ${dateTextStr}`,
                isoDate: isoDateStr,
                events: []
              };
            }
            eventsGroupedByDate[isoDateStr].events.push(eventObj);
          });



          return Object.values(eventsGroupedByDate);
        }

      );

      await browserInstance.close();
      res.json(täbyEvents);
    } 
    
    catch (err) 
    {
      if (browserInstance) 
      await browserInstance.close();
      
      // shit out of luck täby data
      console.log("täby scraping failed");
    }
  }
);

// serve static files
app.use(express.static("public"));

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

//---------------------TÄBY STUFF END---------------------//







//----------------------UPPLANDS VÄSBY STUFF---------------------//

// upplands väsby events route
app.get("/api/events/vasby", async (req, res) => {
    let browserInstance;
    
    try {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const pageObject = await browserInstance.newPage();

        // go to upplands väsby website
        await pageObject.goto(
            "https://www.upplandsvasby.se/uppleva-och-gora/evenemangskalender",
            { waitUntil: "networkidle2", timeout: 30000 }
        );

        await pageObject.waitForSelector("article[data-v-88632682]", { timeout: 10000 });

        const vasbyEvents = await pageObject.evaluate(() => {
            const eventArticles = document.querySelectorAll("article[data-v-88632682]");
            const eventsGroupedByDate = {};

            // loop through all the articles
            Array.from(eventArticles).forEach((article, index) => {
                // get event details from the new structure
                const titleElem = article.querySelector("h3 a");
                const titleText = titleElem?.innerText.trim() || "No title";
                const linkUrl = titleElem?.href || "";
                
                const descriptionElem = article.querySelector("p");
                const descriptionText = descriptionElem?.innerText.trim() || "";
                
                const dateElem = article.querySelector(".information .date");
                const dateText = dateElem?.innerText.trim() || "";
                
                const locationElem = article.querySelector(".information .location");
                let locationText = locationElem?.innerText.replace(/📍|📌||/g, '').trim() || "Unknown place";
                
                const freeTagElem = article.querySelector(".is-free");
                const isFree = freeTagElem ? "Gratis" : "";
                
                // Improved date parsing for Swedish date formats
                let isoDate = "";
                let readableDate = dateText;
                try {
                    const currentYear = new Date().getFullYear();
                    
                    // Extract day and month from the date string
                    const dateMatch = dateText.match(/(\d{1,2})\s+(\w+)/);
                    if (dateMatch) {
                        const day = dateMatch[1].padStart(2, '0');
                        const monthSwedish = dateMatch[2].toLowerCase();
                        
                        const monthMap = {
                            'januari': '01', 'februari': '02', 'mars': '03', 'april': '04',
                            'maj': '05', 'juni': '06', 'juli': '07', 'augusti': '08',
                            'september': '09', 'oktober': '10', 'november': '11', 'december': '12'
                        };
                        
                        const monthNum = monthMap[monthSwedish];
                        if (monthNum) {
                            // Use current year, but if the month has already passed, use next year
                            let year = currentYear;
                            const currentMonth = new Date().getMonth() + 1; // 1-12
                            if (parseInt(monthNum) < currentMonth) {
                                year = currentYear + 1;
                            }
                            
                            isoDate = `${year}-${monthNum}-${day}`;
                        } else {
                            // Fallback if month not found
                            isoDate = new Date().toISOString().split('T')[0];
                        }
                    } else {
                        // Fallback if no date match
                        isoDate = new Date().toISOString().split('T')[0];
                    }
                } catch (e) {
                    isoDate = new Date().toISOString().split('T')[0];
                }

                // fake coordinates for upplands väsby
                const fakeVasbyCoords = {
                    lat: 59.5204 + (Math.random() - 0.5) * 0.02,
                    lng: 17.9083 + (Math.random() - 0.5) * 0.02
                };

                const eventObj = {
                    id: `vasby-event-${isoDate}-${index}`,
                    title: titleText,
                    location: locationText,
                    time: dateText.includes('klockan') ? dateText.split('klockan')[1]?.trim() : '',
                    description: descriptionText,
                    link: linkUrl,
                    tag: isFree || "Upplands Väsby Event",
                    coordinates: fakeVasbyCoords
                };

                // group by date
                if (!eventsGroupedByDate[isoDate]) {
                    eventsGroupedByDate[isoDate] = {
                        date: readableDate,
                        isoDate: isoDate,
                        events: []
                    };
                }
                eventsGroupedByDate[isoDate].events.push(eventObj);
            });

            return Object.values(eventsGroupedByDate);
        });

        await browserInstance.close();
        res.json(vasbyEvents);
    } catch (err) {
        if (browserInstance) await browserInstance.close();
        console.log("upplands väsby scraping failed", err);
        res.json([]);
    }
});

//----------------------UPPLANDS VÄSBY STUFF END---------------------//