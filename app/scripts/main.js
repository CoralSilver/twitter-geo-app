OAuth.initialize('7bIgDNbrQL4S2mH034k8dO4KxBE');
var twitterRequestor;
var currentUser;
var $outputLocationData = $("#output-location-data");
var $outputMap = $("#output-map");
var $locatedTweets = $('#locatedTweets');
var $savedTweets = $('#favorited-tweets');
var locationObj = {};


//Create Firebase
var fireb = new Firebase('https://coralsilver.firebaseio.com/');

function login(){
  OAuth.popup('twitter', {cache: true}).done(function(result) {
    twitterRequestor = result;
    twitterRequestor.me().then(function(profile, lastChildKey, data){
      currentUser = profile;
      retreiveSavedData('location');
      retreiveSavedData('tweets');
    })
    loggedIn();
  }).fail(function (err) {
    console.warn('ERROR', err);
  });
}

function loggedIn() {
  $('#appLoggedIn, header').removeClass('hidden');
  $('.login-container ').addClass('hidden');
}

function geoFindMe() {
  if (!navigator.geolocation){
    $outputLocationData.html("<p>Geolocation is not supported by your browser</p>");
    return;
  }

  $outputLocationData.html('<div class="loading"><img src="../images/arrow.png" class="loading-icon"></div>');
  navigator.geolocation.getCurrentPosition(success, error);
}

function success(position) {  //position is automatically returned?
  latitude  = position.coords.latitude.toFixed(5);
  longitude = position.coords.longitude.toFixed(5);
  buildResults(latitude, longitude);
  buildForm();
}

function buildResults(latitude, longitude){
  getTweetsByLocation(latitude, longitude);
  var zoom = 14;

  $outputLocationData.html('<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>');

  var $img = new Image();
  $img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=" + zoom + "&size=500x200&sensor=false";
  $outputMap.html($img)
}

$(document).on('click', '#show-tweets-button', function() {
  geoFindMe();
});

function logout(){
  OAuth.clearCache('twitter');
  locationObj = {};
  currentUser = {};
  $('.header, #appLoggedIn').addClass('hidden')
  var $loggedInContainer = $('#appLoggedIn')
  $loggedInContainer.find('#out').html('');
  $loggedInContainer.find('#locatedTweets').html('');
  $('#savedSearches').html('');
  $('.login-container').removeClass('hidden');
}

//function to retrieve saved locations and tweets
function retreiveSavedData(lastChildKey) {
  var locRef = fireb.child('users').child(currentUser.id).child(lastChildKey);
  locRef.on("value", function(snapshot) {
    var snapshot = snapshot.val();
    var data = Object.keys(snapshot).map(function(key){
      return snapshot[key]
    });

    if (lastChildKey === 'location' ) {
      buildSavedLocations(data);
      console.log('location + ' + data);
    } else {
       $('#favorited-tweets').html('');
       parseTweetData(data, $savedTweets); //appending to already added tweets on every value change
       $('#favorited-tweets .heart').addClass('heart-favorited'); //make this only happen once
    }
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

function getTweetsByLocation(lat, lon, miles){
  miles = $('#volume').val();
  var apiEndpoint = 'https://api.twitter.com/1.1/search/tweets.json?count=50&geocode=';
  apiEndpoint += lat + ',' + lon + ',' + miles + 'mi';
  locationObj = {
  latitude: lat,
  longitude: lon,
  miles:miles
  };

  twitterRequestor.get(apiEndpoint).done(function(data, media_url) {
    parseTweetData(data.statuses, $locatedTweets);
    console.log('tweet', data.statuses);
  }).fail(function(err) {
    console.warn(err);
  });
}

//create Handlebars template for tweets
function parseTweetData (data, divToAppend) {
  var source = $('#parsedTweetContainers').html();
  var template = Handlebars.compile(source);
  var result = template(data);
  //divToAppend.html('');
  divToAppend.append(result);
}

//Handlebars helper functions

Handlebars.registerHelper('json', JSON.stringify);

Handlebars.registerHelper('urlify', function(text) {
  var twitterUrlRegex = /(https?:\/+t.co\/[^\s]+)/g;
  return text.replace(twitterUrlRegex, function(url) {
      return new Handlebars.SafeString('<a href="' + url + '" ' + 'target="_blank">' + url + '</a>');
  })
});

//create Handlebars template for saved locations
function buildSavedLocations(locations) {
  var source = $('#savedLocations').html();
  var template = Handlebars.compile(source);
  var result = template(locations);
  $('#savedSearches').append(result);
}

//Handlebars helper function to parse date
Handlebars.registerHelper('relativeDate', function(date) {
  var createdDate = (new Date(date));
  var relativeDate = moment(createdDate).fromNow();
    return new Handlebars.SafeString('<span class="date">'+ relativeDate +'</span>');
});

$(document).on('click', '#saved-tweets .heart-favorited, .button-clear-icon', function() {
  $(this).parent('div').fadeOut('slow').detach();
});

$(document).on('click', '.saved-search-button', function() {
  var lat = $(this).parent('div').data('lat');
  var lon = $(this).parent('div').data('long');
  var miles = $(this).parent('div').data('miles');
  console.log(lat, lon, miles);
  getTweetsByLocation(lat, lon, miles);
});

function buildForm() {
  var $form = $('<form></form>');
  var $input = '<input id="location-input" type="text" placeholder="Name this location">';
  var $button =  '<button id="saveSearch" class="btn float-right">Save search location</button>';

  var $assembledForm = $form.append($input + $button);
  $outputLocationData.append($assembledForm);
}

function error() {
  $outputLocationData.html("Unable to retrieve your location");
}

function outputUpdate(vol) {
	$('#volume').val(vol);
}

function saveSearchLocation() {
  $(document).on('click','#saveSearch',function(e){
    e.preventDefault();
    var locationInput = $('#location-input');
    var locationName = locationInput.val();
    locationObj.name = locationName;
    //.child(locationName) sets locations alphabetically, not in order they are added
    fireb.child('users').child(currentUser.id).child('location').child(locationName).set(locationObj);
    locationInput.val('');
  })
}

saveSearchLocation();

function favorite() {
  $(document).on('click','.heart',function(){
    $(this).toggleClass('heart-favorited');
    var self = $(this);
    if ($(this).hasClass('heart-favorited')) {
      var message = self.data('twitter-message-obj');
      console.log(message);
      //save the message
    } else {
      self.attr('data-favorited', 'false');
      //remove the message
    }
  });
}

$(document).on('click','.heart',function(){
  var theHeart = $(this);
  var tweetObj = theHeart.parent('.tweet-container').data('json');
  theHeart.toggleClass('heart-favorited');
  console.log('this is the tweet obj' + tweetObj);
  if (theHeart.hasClass('heart-favorited') ) {
    //This saves them by object id_string key so they can be referenced and removed
    //They are order in Firebase alphabetically by id_string not order of addition
    //When reassembling saved tweets should sort them by date?
    console.log('favorited added to DB');
    fireb.child('users').child(currentUser.id).child('tweets').child(tweetObj.id_str).set(tweetObj);

  } else {
    console.log('unfavorited');
    fireb.child('users').child(currentUser.id).child('tweets').child(tweetObj.id_str).remove();
  }
});

function expandSection() {
  $('.expander-trigger').click(function(){
    var self = $(this);
    self.toggleClass("expander-hidden");
    if (self.children('i').text() === 'add') {
      //alert('add');
    } else {
      //alert('remove');
    }
  });
}

expandSection();
