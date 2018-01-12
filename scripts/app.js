
(function() {

  // Strict mode helps out in a couple ways:
  // 1. It catches some common coding bloopers, throwing exceptions.
  // 2. It prevents, or throws errors, when relatively "unsafe" actions are taken 
  // (such as gaining access to the global object).  
  'use strict';

  var weatherAPIUrlBase = 'https://publicdata-weather.firebaseio.com/';

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
    app.updateForecasts();
  });

  /* Event listener for add new city button */
  document.getElementById('butAdd').addEventListener('click', function() {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);
  });

  /* Event listener for add city button in add city dialog */
  document.getElementById('butAddCity').addEventListener('click', function() {
    var select = document.getElementById('selectCityToAdd');
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    var label = selected.textContent;
    app.getForecast(key, label);
    app.selectedCities.push({key: key, label: label});
    app.toggleAddDialog(false);
  });

  /* Event listener for cancel button in add city dialog */
  document.getElementById('butAddCancel').addEventListener('click', function() {
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
  app.updateForecastCard = function(data) {
    // if card already exists, then all HTML code structure along with prev values for a key
    // key in visibleCards with name same as data.key ie particluar location will be loaded 
    //into the card variable.  
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
      // example of visibleCards variable after the above line is executed - 
      // {austin: div.card.weather-forecast, boston: div.card.weather-forecast}
      // data.key defines the 'key' by which 'value'(ie HTML Code of Card) should be 
      // stored inside variable visibleCards.
    }
    // Setting the values for textContent in card by fetching respective values 
    // from server response.  
    card.querySelector('.description').textContent = data.currently.summary;
    // Multiplying by 1000 as Date needs parameters in millisec to calculate dates &
    // the response included time in seconds. ( 1 sec = 1000 millisec) 
    card.querySelector('.date').textContent = new Date(data.currently.time * 1000);  
    card.querySelector('.current .icon').classList.add(data.currently.icon);
    card.querySelector('.current .temperature .value').textContent =
      Math.round(data.currently.temperature);
    card.querySelector('.current .feels-like .value').textContent =
      Math.round(data.currently.apparentTemperature);
    card.querySelector('.current .precip').textContent =
      Math.round(data.currently.precipProbability * 100) + '%';
    card.querySelector('.current .humidity').textContent =
      Math.round(data.currently.humidity * 100) + '%';
    card.querySelector('.current .wind .value').textContent =
      Math.round(data.currently.windSpeed);
    card.querySelector('.current .wind .direction').textContent =
      data.currently.windBearing;
    var nextDays = card.querySelectorAll('.future .oneday');
    var today = new Date();
    // returns a numeric value for day of week starting from Sunday as 0 & so on.
    today = today.getDay();
    // Displaying weather details for next 7 days.
    for (var i = 0; i < 7; i++) {
      // Injecting the HTML code for a displaying a particular day into nextDay variable.
      var nextDay = nextDays[i];
      // Fetching Daily weather details for each of next day in each iteration.
      var daily = data.daily.data[i];
      // if both fields are non-empty, then write the weather details.
      if (daily && nextDay) {
        // Displaying the Next Day label with respective Day.
        nextDay.querySelector('.date').textContent =
          app.daysOfWeek[(i + today) % 7];
        // The below statement add a class to the classList to make a corresponding 
        // CSS Class. eg: .icon + (daily.icon : say rain), makes the CSS class .icon.rain
        // which then displays the required image as mentioned in CSS code.
        nextDay.querySelector('.icon').classList.add(daily.icon);
        nextDay.querySelector('.temp-high .value').textContent =
          Math.round(daily.temperatureMax);
        nextDay.querySelector('.temp-low .value').textContent =
          Math.round(daily.temperatureMin);
      };
    }
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };


  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  // Gets a forecast for a specific city and update the card with the data
  app.getForecast = function(key, label) {
    var url = weatherAPIUrlBase + key + '.json';
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
          response.key = key;
          response.label = label;
          app.updateForecastCard(response);
        }
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

})();
