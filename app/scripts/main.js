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
      // if (lastChildKey === 'location' ) {
      //   buildSavedLocations(data);
      // } else {
      //    parseTweetData(data, $savedTweets);
      // }
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
    } else {
       parseTweetData(data, $savedTweets); //appending to already added tweets on every value change
       $('#favorited-tweets .heart').addClass('heart-favorited'); //make this only happen once
    }
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

function buildSavedLocations(locations) {
  var savedLocationContainer = $('<div class="saved-location"></div>');

  for(var i=0; i<locations.length; i++) {
    var clearButton = '<button role="button" class="button-unstyled button-clear-icon"><i class="material-icons">clear</i></button>';
    var savedLocationName = '<h3>' + locations[i].name + '</h3>'
    var savedLat = locations[i].latitude;
    var savedLatElem = '<span>Latitude: ' + savedLat + '</span></br>';
    var savedLong = locations[i].longitude;
    var savedLongElem = '<span>Longitude: ' + savedLong + '</span></br>';
    var savedMiles = locations[i].miles;
    var savedMilesElem = '<span>Distance Range: ' + savedMiles + ' mi.</span></br>';
    var button = '<button type="button" class="button-small saved-search-button float-right">Search</button>';
    var innerContainer = $('<div class="saved-location-inner-container"></div>');
    innerContainer.attr({
      'data-lat': savedLat,
      'data-long': savedLong,
      'data-miles': savedMiles
    }).append(clearButton + savedLocationName + savedLatElem + savedLongElem + savedMilesElem + button);
    savedLocationContainer.append(innerContainer);
  }
  $('#savedSearches').html(savedLocationContainer);
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


function parseTweetData(data, divToAppend) {
  divToAppend.html('');

  for(var i = 0; i < data.length; i++) {
    var tweets = '<p>'+ urlify(data[i].text) + '</p>';
    var screenName = '<span class="user-name"><a href="'+ 'https://twitter.com/' + data[i].user.screen_name + '" ' + 'target="_blank"' + '>' + data[i].user.screen_name + '</a></span>';
    var createdDate = (new Date(data[i].created_at));
    //convert to relative time
    var relativeDate = moment(createdDate).fromNow();
    var dateElm = '<span class="date">'+ relativeDate +'</span>';
    screenName += dateElm;
    var profileImageUrl = '<img src = "' + data[i].user.profile_image_url + '" class = "profile-image">';

    if (data[i].entities.hasOwnProperty("media")){
      var tweetImage = '<img src = "' + data[i].entities.media[0].media_url + '" class="media-image">';
      var $fullTweet = $('<div class="tweet-container">' + profileImageUrl + screenName + tweets + tweetImage + '<i class="material-icons heart">favorite</i>' + '</div>');
    } else {
      var $fullTweet = $('<div class="tweet-container">' + profileImageUrl + screenName + tweets + '<i class="material-icons heart">favorite</i>' + '</div>');
    }

    $fullTweet.data('twitter-message-obj', data[i]);  //add Twitter object as data to be retreived later
    divToAppend.append($fullTweet);
  }
}

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

function urlify(text) {
  var twitterUrlRegex = /(https?:\/+t.co\/[^\s]+)/g;
  return text.replace(twitterUrlRegex, function(url) {
      return '<a href="' + url + '" ' + 'target="_blank">' + url + '</a>';
  })
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
      // console.log(message);
      //save the message

    } else {
      self.attr('data-favorited', 'false');
      //remove the message
    }
  });
}



$(document).on('click','.heart',function(){
  var theHeart = $(this);
  var tweetObj = theHeart.parent('.tweet-container').data('twitter-message-obj');
  theHeart.toggleClass('heart-favorited');
  console.log(tweetObj);
  if (theHeart.hasClass('heart-favorited') ) {
    //This saves thems by object id_string key so they can be referenced and removed
    //They are order in Firebase alphabetically by id_string not order of addition
    //When reassembling saved tweets should sort them by date?
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




// function getFanMessages() {
//   fireb.child('message').on('value', function(results){
//     $('#messages').empty();
//     var values = results.val();
//
//     for(var key in values) {  //gives us key name for every value in the object
//       var msg = values[key];
//       var upvote = $('<button>upvote</button>').data('id', key);
//
//       var container = $('<p>'+ msg.text + "," + msg.votes + '</p>');
//       container.append(upvote);
//
//       upvote.click(function() {
//         var msgID = $(this).data('id');
//
//         console.log('clicked' + msgID);
//
//         updateVotes(msgID, values[msgID].votes + 1 )
//       });
//
//       container.appendTo('#messages');
//     }
//   })
// }
// getFanMessages();
//
// function updateVotes(msgID, votes) {
//
//   var ref = fireb.child('message').child(msgID);
//   console.log(msgID);
//   ref.update({votes:votes})
//
//
// }



// //move this function outside of geoFindMe and just call here.
// function streamTweets() {
//  var apiEndpoint = 'https://stream.twitter.com/1.1/statuses/filter.json?delimited=length&track=locations=';
//  var cooridinates = longitute + "," + latitude;
//
//   OAuth.popup('twitter').done(function(result) {
//     console.log(result);
//     get(url, settings);// do some stuff with result
//   });
// }

// You can now make simple HTTP calls using these functions: get(url, settings), post(url, settings),
// put(url, settings), delete(url, settings), patch(url, settings)
// These methods take the same parameter than jQuery.ajax().
// It injects all authorization parameters (access token, signature, nonce, timestamp etc...) for you and proxy your API calls if needed.
