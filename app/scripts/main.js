OAuth.initialize('7bIgDNbrQL4S2mH034k8dO4KxBE');
var twitterRequestor;
var $output = $("#out");


function login(){
  OAuth.popup('twitter', {cache: true}).done(function(result) {
    twitterRequestor = result;
    loggedIn();
  }).fail(function (err) {
    console.warn('ERROR', err);
  });
}

function logout(){
  var user = User.getIdentity();
  user.logout().done(function() {
    OAuth.clearCache('twitter');
  });
}

function getTweetsByLocation(lat, lon, miles){
  miles = miles || 5;

  var apiEndpoint = 'https://api.twitter.com/1.1/search/tweets.json?count=50&geocode=';
  apiEndpoint += lat + ',' + lon + ',' + miles + 'mi';

  twitterRequestor.get(apiEndpoint).done(function(data) {
    console.info(data);
  }).fail(function(err) {
    console.warn(err);
  });
}

function loggedIn() {
  $('#appLoggedIn').removeClass('hidden');
  $('#logIn').addClass('hidden');
}

function geoFindMe() {
  if (!navigator.geolocation){
    $output.html("<p>Geolocation is not supported by your browser</p>");
    return;
  }

  $output.html("<p>Locating…</p>");
  navigator.geolocation.getCurrentPosition(success, error);
}


function success(position) {
  var latitude  = position.coords.latitude;
  var longitude = position.coords.longitude;
  getTweetsByLocation(latitude, longitude, outputUpdate());

  $output.html('<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>');

  var $img = new Image();
  $img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=13&size=300x300&sensor=false";

  $output.append($img);
}

function error() {
  $output.html("Unable to retrieve your location");
}


function outputUpdate(vol) {
	$('#volume').val(vol);
}



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
