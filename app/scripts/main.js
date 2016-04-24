
OAuth.initialize('7bIgDNbrQL4S2mH034k8dO4KxBE');
var twitterRequestor;
var currentUser;
var $outputLocationData = $("#output-location-data");
var $outputMap = $("#map");
var $locatedTweets = $('#locatedTweets');
var $savedTweets = $('#favorited-tweets');
var locationObj = {};
var locRef;
var twitterRef;
var locationRef;

//Create Firebase
var fireb = new Firebase('https://coralsilver.firebaseio.com/');

function login(){
  OAuth.popup('twitter', {cache: true}).done(function(result) {
    twitterRequestor = result;
    twitterRequestor.me().then(function(profile, lastChildKey, data){
      currentUser = profile;
      // retreiveSavedData('location');
      // retreiveSavedData('tweets');
      retreiveSavedLocationData();
      retreiveSavedTweetData();
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
  navigator.geolocation.getCurrentPosition(initMap, error);
}
// //function success(position)
// function initMap(position) {  //position is automatically returned?
//   // latitude  = position.coords.latitude.toFixed(5);
//   // longitude = position.coords.longitude.toFixed(5);
//   //console.log('initMap ' + latitude);
//   //buildResults(latitude, longitude);
//   //buildForm();
//
//   var map = new google.maps.Map(document.getElementById('map'), {
//     zoom: 8,
//     center: {lat: 40.731, lng: -73.997}
//   });
//   var geocoder = new google.maps.Geocoder;
//   var infowindow = new google.maps.InfoWindow;
//

// }

function initMap(position) {
  latitude  = position.coords.latitude.toFixed(5);
  longitude = position.coords.longitude.toFixed(5);
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: {lat: parseFloat(latitude), lng: parseFloat(longitude)}
  });
  var geocoder = new google.maps.Geocoder;
  var infowindow = new google.maps.InfoWindow;
  google.maps.event.trigger(map, 'resize');
  // document.getElementById('submit').addEventListener('click', function() {
  //   geocodeLatLng(geocoder, map, infowindow);
  // });

  $(document).on('click', '#show-tweets-button', function() {
   geocodeLatLng(geocoder, map, infowindow);
   buildResults(latitude, longitude);
  });
}

document.getElementById('logIn').addEventListener('click', function() {
      initMap();
});

function geocodeLatLng(geocoder, map, infowindow) {
  // var input = document.getElementById('latlng').value;
  // var latlngStr = input.split(',', 2);
  var latlng = {lat: parseFloat(latitude), lng: parseFloat(longitude)};
  geocoder.geocode({'location': latlng}, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      if (results[1]) {
        map.setZoom(15);
        var marker = new google.maps.Marker({
          position: latlng,
          map: map
        });
        infowindow.setContent(results[1].formatted_address);
        infowindow.open(map, marker);
        console.log(marker);
      } else {
        window.alert('No results found');
      }
    } else {
      window.alert('Geocoder failed due to: ' + status);
    }
  });
}

function buildResults(latitude, longitude){
  getTweetsByLocation(latitude, longitude);
  var zoom = 14;

  // $outputLocationData.html('<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>');
  //
  // var $img = new Image();
  // $img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=" + zoom + "&size=500x200&sensor=false";
  // $outputMap.html($img)
}

// $(document).on('click', '#show-tweets-button', function() {
//   geoFindMe();
// });

$(document).on('click', '#logIn', function() {
  geoFindMe();
});

//function to retrieve saved locations and tweets to be called once on login
function retreiveSavedData(objectType) {
  var locRef = fireb.child('users').child(currentUser.id).child(objectType);

  locRef.once('value', function(snapshot) {
    var snapshot = snapshot.val();
    var data = Object.keys(snapshot).map(function(key){
      return snapshot[key]
    });

    if (objectType === 'location' ) {
      data.forEach(function(location){
        // buildSavedLocations(location);
        console.log('location + ' + location);
      })
    } else {
       $('#favorited-tweets').html('');
       //parseTweetData(data, $savedTweets); //appending to already added tweets on every value change
       $('#favorited-tweets .heart').addClass('heart-favorited'); //make this only happen once
    }

  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

//function to retrieve tweets
function retreiveSavedTweetData() {
  var twitterRef = fireb.child('users').child(currentUser.id).child('tweets');
  twitterRef.on("child_added", function(childSnapshot) {
    var snapshot = childSnapshot.val();

    /*
      parseTweetData should take a third parameter indicating whether or not the
      heart class should be active
    */
    parseTweetData(snapshot, $savedTweets);
    $('#favorited-tweets .heart').addClass('heart-favorited'); //this is adding it everytime to all favorited
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

//function to retrieve locations
function retreiveSavedLocationData() {
  var locationRef = fireb.child('users').child(currentUser.id).child('location');

  locationRef.on("child_added", function(childSnapshot) {
    var snapshot = childSnapshot.val();
    buildSavedLocations(snapshot);
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
    data.statuses.forEach(function(status){
      parseTweetData(status, $locatedTweets);
    })

    console.log('tweet', data.statuses);
  }).fail(function(err) {
    console.warn(err);
  });
}

//create Handlebars template for tweets
function parseTweetData (data, divToAppend) {
  var twitterTemplate = Handlebars.compile($('#parsedTweetContainers').html());
  var result = $(twitterTemplate(data)).data('json', data);
  divToAppend.prepend(result);
}

//Handlebars helper function
Handlebars.registerHelper('urlify', function(text) {
  var twitterUrlRegex = /(https?:\/+t.co\/[^\s]+)/g;
  return text.replace(twitterUrlRegex, function(url) {
      return new Handlebars.SafeString('<a href="' + url + '" ' + 'target="_blank">' + url + '</a>');
  })
});

//Handlebars helper function to parse date
Handlebars.registerHelper('relativeDate', function(date) {
  var createdDate = (new Date(date));
  var relativeDate = moment(createdDate).fromNow();
    return new Handlebars.SafeString('<span class="date">'+ relativeDate +'</span>');
});

(function removeFavoritedTweet() {
  $(document).on('click', '#saved-tweets .heart-favorited', function() {
    $(this).parent('div').fadeOut('slow').detach();
  });
})();

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

(function saveSearchLocation() {
  $(document).on('click','#save-location',function(e){
    e.preventDefault();
    var locationInput = $('#location-input');
    var locationName = locationInput.val();
    var locationAddress = $('.gm-style-iw').text();
    locationObj.name = locationName;
    locationObj.address = locationAddress;
    //.child(locationName) sets locations alphabetically, not in order they are added
    fireb.child('users').child(currentUser.id).child('location').child(locationName).set(locationObj);
    locationInput.val('');
    $('.save-location-form').addClass('hidden');
  })
}) ();

(function showLocationForm() {
  $(document).on('click','.add-location',function(){
    $('.save-location-form').removeClass('hidden');
  });
})();

(function deleteSavedLocations() {
  $(document).on('click', '.button-clear-icon', function() {
    var locationContainer =  $(this).parent('div');
    var locationName = locationContainer.find('#location-name').text();
    fireb.child('users').child(currentUser.id).child('location').child(locationName).remove();
    locationContainer.fadeOut('slow').remove();
  });
}) ();

//create Handlebars template for saved locations
function buildSavedLocations(locations) {
  var locationTemplate = Handlebars.compile($('#savedLocations').html());
  var result = locationTemplate(locations);
  $('#savedSearches').append(result);
}

// function favorite() {
//   $(document).on('click','.heart',function(){
//     $(this).toggleClass('heart-favorited');
//     var self = $(this);
//     if ($(this).hasClass('heart-favorited')) {
//       var message = self.data('twitter-message-obj');
//       console.log(message);
//       //save the message
//     } else {
//       self.attr('data-favorited', 'false');
//       //remove the message
//     }
//   });
// }

$(document).on('click','.heart',function(){
  var theHeart = $(this);
  var tweetObj = theHeart.parent('.tweet-container').data('json');
  theHeart.toggleClass('heart-favorited');
  console.log('this is the tweet obj' + tweetObj.id_str);


  var $eachLocatedTweet = $locatedTweets.find('.tweet-container');
   for(var i=0; i< $eachLocatedTweet.length; i++) {
     var tweetData = $eachLocatedTweet.data('json');
     var tweetID = tweetData.id_str;
     console.log('tweetID ' + tweetData);
   }
  var $tweetData = $eachLocatedTweet.data();
  var idString = $tweetData.id_str;
  if (tweetObj.id_str === idString) {
    console.log('match');
  }

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

(function expandSection() {
  $('.expander-trigger').click(function(){
    var self = $(this);
    self.toggleClass("expander-hidden");
    if (self.children('i').text() === 'add') {
      //alert('add');
    } else {
      //alert('remove');
    }
  });
}) ();

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
