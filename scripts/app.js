
(function() {

  // Strict mode helps out in a couple ways:
  // 1. It catches some common coding bloopers, throwing exceptions.
  // 2. It prevents, or throws errors, when relatively "unsafe" actions are taken 
  // (such as gaining access to the global object).  
  'use strict';

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedCities: [], 
    // querySelector(), on highest level, returns all the HTML code content defined for class 
    // 'loader' in index.html webpage (document) file & assigns it to the Spinner sub-variable.
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };


  /*****************************************************************************
   * Event listeners for UI elements
   ****************************************************************************/

  /* Event listener for refresh button */
  document.getElementById('butRefresh').addEventListener('click', function() {
    // Refresh all of the forecasts
    app.updateForecasts();
  });

  /* Event listener for add new city button */
  document.getElementById('butAdd').addEventListener('click', function() {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);
  });

  /* Event listener for add city button in add city dialog */
  document.getElementById('butAddCity').addEventListener('click', function() {
    // Add the newly selected city
    var select = document.getElementById('selectCityToAdd');
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    var label = selected.textContent;
    // TODO init the app.selectedCities array here
    app.getForecast(key, label);
    // TODO push the selected city to the array and save here
    //app.selectedCities.push({key: key, label: label});
    app.toggleAddDialog(false);
  });

  /* Event listener for cancel button in add city dialog */
  document.getElementById('butAddCancel').addEventListener('click', function() {
    // Close the add new city dialog
    app.toggleAddDialog(false);
  });


  /*****************************************************************************
   * Methods to update/refresh the UI
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      // The classList property in this case is useful to add, remove and 'toggle' 
      // CSS classes in the HTML code class list defined inside <div class="dialog-container"> 
      // tag in index.html . Here the addition of dialog-container--visible class indirectly 
      // applies its related CSS properties which makes the addDialog (having class 
      // "dialog-container") visible & gives the'+'(AddCity) button the sense to respond 
      // to the the touch events.    
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  // 'data', is the API response.  
  app.updateForecastCard = function(data) { 
    // Here, dataLastUpdated is used to track the time when the data was last created 
    // for a particular city on the API cloud from where responses are fetched.  

    // TODO: To find in how much time, data in cloud gets created by Yahoo Weather.  
    
    // Date() converts the API response into desired format.
    var dataLastUpdated = new Date(data.created);
    var sunrise = data.channel.astronomy.sunrise;
    var sunset = data.channel.astronomy.sunset;
    var current = data.channel.item.condition;
    var humidity = data.channel.atmosphere.humidity;
    var wind = data.channel.wind;
    // if card already exists, then all HTML code structure along with prev values for a key
    // key in visibleCards with name same as data.key ie particluar location will be loaded 
    // into the card variable.  
    var card = app.visibleCards[data.key];

    if (!card) {
      // cloneNode creates a copy of node from HTML Structure of app.cardTemplate 
      // and returns the clone.
      card = app.cardTemplate.cloneNode(true);
      // Removed, as cardTemplate is no longer required in classList of HTML code of Card Element 
      card.classList.remove('cardTemplate');
      card.querySelector('.location').textContent = data.label;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.key] = card;
      // example of visibleCards variable after the above line is executed below- 
      // {austin: div.card.weather-forecast, boston: div.card.weather-forecast}
      // data.key defines the 'key' by which 'value'(ie HTML Code of Card) should be 
      // stored inside variable visibleCards.
    }

    /**
     * Verifies the data provide is newer than what's already visible
     * on the card and then update the card accordingly.
     **/
    var cardLastUpdatedElem = card.querySelector('.card-last-updated');
    // will be null, during first time, the card is added into the list of forecast cards.  
    // will hold a value, the next time onwards the card is refreshed to fetch new updates.  
    var cardLastUpdated = cardLastUpdatedElem.textContent;
    if (cardLastUpdated) {
      cardLastUpdated = new Date(cardLastUpdated);
      // Do Nothing, if the card has more recent data then the data that was last fetched
      // from Yahoo Weather Cloud.
      if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
        return;
      }
    }    
    cardLastUpdatedElem.textContent = data.created;
    // Alternative for above statement: card.querySelector('.card-last-updated').textContent = data.created;

    // Setting the values for textContent in card by fetching respective values 
    // from server response.  
    card.querySelector('.description').textContent = current.text;
    card.querySelector('.date').textContent = current.date;
    // appending the required CSS class to include the icon of current weather condition.
    // current.code contains the code value response sent by API for each weather type 
    // and getIconClass() (user defined fucntion) returns the equivalent weather type 
    // for a code passed to it which inturn acts as the CSS class for that weather type too.
    // eg : card.querySelector('.current .icon').classList.add("windy"); where 
    // app.getIconClass returns 'windy' for that respective current.code       
    card.querySelector('.current .icon').classList.add(app.getIconClass(current.code));    
    card.querySelector('.current .temperature .value').textContent =
      Math.round(current.temp);
    card.querySelector('.current .sunrise').textContent = sunrise;
    card.querySelector('.current .sunset').textContent = sunset;
    card.querySelector('.current .humidity').textContent =
      Math.round(humidity) + '%';
    card.querySelector('.current .wind .value').textContent =
      Math.round(wind.speed);
    card.querySelector('.current .wind .direction').textContent = wind.direction;      
    var nextDays = card.querySelectorAll('.future .oneday');
    var today = new Date();
    // returns a numeric value for day of week starting from Sunday as 0 & so on.
    today = today.getDay();
    // Displaying weather details for next 7 days.
    for (var i = 0; i < 7; i++) {
      // Injecting the HTML code for a displaying a particular day into nextDay variable.
      var nextDay = nextDays[i];
      // Fetching Daily weather details for each of next day in each iteration.
      var daily = data.channel.item.forecast[i];
      // if both fields are non-empty, then write the weather details.
      if (daily && nextDay) {
        // Displaying the Next Day label with respective Day.
        nextDay.querySelector('.date').textContent =
          app.daysOfWeek[(i + today) % 7];
        // The below statement add a class to the classList to make a corresponding 
        // CSS Class. eg: .icon + (daily.icon : say rain), makes the CSS class .icon.rain
        // which then displays the required image as mentioned in CSS code.
        nextDay.querySelector('.icon').classList.add(app.getIconClass(daily.code));      
        nextDay.querySelector('.temp-high .value').textContent =
          Math.round(daily.high);
        nextDay.querySelector('.temp-low .value').textContent =
          Math.round(daily.low);
      };
    }
    // Hide the Loading spinner when the first forecast card ever, is done loading with details.
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };

  /*****************************************************************************
   * Methods for dealing with the model
   ****************************************************************************/

  /*
   * Gets a forecast for a specific city and updates the card with the data.
   * getForecast() first checks if the weather data is in the cache. If so,
   * then it gets that data and populates the card with the cached data.
   * Then, getForecast() goes to the network for fresh data. If the network
   * request goes through, then the card gets updated a second time with the
   * freshest data.
   */
  
  app.getForecast = function(key, label) {
    // Details: https://developer.yahoo.com/weather/ 
    //var statement = "select * from weather.forecast where woeid=" + key ;
    var statement = "select * from weather.forecast where woeid in" + 
                    "(select woeid from geo.places(1) where text='" + key + "') and u='c'";
    var url = 'https://query.yahooapis.com/v1/public/yql?format=json&q=' + statement;

    // TODO add cache logic here

    // Fetch the latest data.
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.open('GET', url);
    request.send();
    // Proceed when any changes takes place in state of client while comunicating with server.
    // May be called multiple times.
    request.onreadystatechange = function() {
      // "===" means equality in both value and datatype of value.
      // eg: 1=="1" returns true, due to auto type conversion (typecasting).
      // 1==="1" returns false, because they are of a different type before typecasting.
      // XMLHttpRequest.DONE means that opeartion of downloading data from server is complete.
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          // Without the below 2 lines, the response does not includes the info about 
          // key and label of location whose data is fetched, only coordinates are present. 
          // Hence, Injecting the key and label values into the response received so as to 
          // make it convenient for cards to take key and label values from response itself.  
          // Note: We can define any new field to response eg: response.example = "PWA";    
          console.log(response);
          var results = response.query.results;
          console.log(results);
          results.key = key;
          results.label = label;
          results.created = response.query.created;
          app.updateForecastCard(results);
        }
      } else {
        // Return the initial weather forecast since no data is available.
        app.updateForecastCard(initialWeatherForecast);
       }
    };    
  };

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateForecasts = function() {
    // Object.keys() returns an array of key of each element associated 
    // with the object passed as argument ie app.visibleCards to it. 
    // Eg: Contents of key array would be [ 'City1', 'City2'....] 
    var keys = Object.keys(app.visibleCards);     
    keys.forEach(function(key) {
      // As passing all the arguments to a function in javascript is optional
      // hence, the function getForecast() works here, even without supplying 
      // label parameter to it. The value of argument not passed is set to undefined.
      app.getForecast(key);
    });
  };

  // TODO add saveSelectedCities function here

  app.getIconClass = function(weatherCode) {
    // Weather codes: https://developer.yahoo.com/weather/documentation.html#codes
    weatherCode = parseInt(weatherCode);
    switch (weatherCode) {
      case 25: // cold;
      case 32: // sunny
      case 33: // fair (night)
      case 34: // fair (day)
      case 36: // hot
      case 3200: // not available
        return 'clear-day';
      case 0: // tornado
      case 1: // tropical storm
      case 2: // hurricane
      case 6: // mixed rain and sleet
      case 8: // freezing drizzle
      case 9: // drizzle
      case 10: // freezing rain
      case 11: // showers
      case 12: // showers
      case 17: // hail
      case 35: // mixed rain and hail
      case 40: // scattered showers
        return 'rain';
      case 3: // severe thunderstorms
      case 4: // thunderstorms
      case 37: // isolated thunderstorms
      case 38: // scattered thunderstorms
      case 39: // scattered thunderstorms (not a typo)
      case 45: // thundershowers
      case 47: // isolated thundershowers
        return 'thunderstorms';
      case 5: // mixed rain and snow
      case 7: // mixed snow and sleet
      case 13: // snow flurries
      case 14: // light snow showers
      case 16: // snow
      case 18: // sleet
      case 41: // heavy snow
      case 42: // scattered snow showers
      case 43: // heavy snow
      case 46: // snow showers
        return 'snow';
      case 15: // blowing snow
      case 19: // dust
      case 20: // foggy
      case 21: // haze
      case 22: // smoky
        return 'fog';
      case 24: // windy
      case 23: // blustery
        return 'windy';
      case 26: // cloudy
      case 27: // mostly cloudy (night)
      case 28: // mostly cloudy (day)
      case 31: // clear (night)
        return 'cloudy';
      case 29: // partly cloudy (night)
      case 30: // partly cloudy (day)
      case 44: // partly cloudy
        return 'partly-cloudy-day';
    }
  };

  /*
   * Fake weather data that is presented when the user first uses the app,
   * or when the user has not saved any cities.
   */
  var initialWeatherForecast = {
    key: '2459115',
    label: 'New York, NY',
    created: '2016-07-22T01:00:00Z',
    channel: {
      astronomy: {
        sunrise: "5:43 am",
        sunset: "8:21 pm"
      },
      item: {
        condition: {
          text: "Windy",
          date: "Thu, 21 Jul 2016 09:00 PM EDT",
          temp: 56,
          code: 24
        },
        forecast: [
          {code: 44, high: 86, low: 70},
          {code: 44, high: 94, low: 73},
          {code: 4, high: 95, low: 78},
          {code: 24, high: 75, low: 89},
          {code: 24, high: 89, low: 77},
          {code: 44, high: 92, low: 79},
          {code: 44, high: 89, low: 77}
        ]
      },
      atmosphere: {
        humidity: 56
      },
      wind: {
        speed: 25,
        direction: 195
      }
    }
  };
  // TODO uncomment line below to test app with fake data
  //app.updateForecastCard(initialWeatherForecast);

  // TODO add startup code here

  // TODO add service worker code here
})();
