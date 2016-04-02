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
  var miles = $('#volume').val();
  //miles = miles || 2;
  var apiEndpoint = 'https://api.twitter.com/1.1/search/tweets.json?count=50&geocode=';
  apiEndpoint += lat + ',' + lon + ',' + miles + 'mi';
  console.log(miles + ' miles');
  twitterRequestor.get(apiEndpoint).done(function(data, media_url) {
    console.log(data);
    var $locatedTweets = $('#locatedTweets');
    for(var i = 0; i < data.statuses.length; i++) {
      var tweets = '<p>'+ urlify(data.statuses[i].text) + '</p>';
      var screenName = '<span class="user-name"><a href="'+ 'https://twitter.com/' + data.statuses[i].user.screen_name + '" ' + 'target="_blank"' + '>' + data.statuses[i].user.screen_name + '</a></span>';
      var profileImageUrl = '<img src = "' + data.statuses[i].user.profile_image_url + '" class = "profile-image">';
      //console.log(media_url);
      console.log(data.statuses[i].entities)

      if (data.statuses[i].entities.hasOwnProperty("media")){
        var tweetImage = '<img src = "' + data.statuses[i].entities.media[0].media_url + '">';
        var fullTweet = '<div class="tweet-container">' + profileImageUrl + screenName + tweets + tweetImage + '</div>';
      } else {
        var fullTweet = '<div class="tweet-container">' + profileImageUrl + screenName + tweets +'</div>';
      }


      $locatedTweets.append(fullTweet);
    }

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


function success(position) {  //position is automatically returned?
  var latitude  = position.coords.latitude;
  var longitude = position.coords.longitude;
  getTweetsByLocation(latitude, longitude);

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

function urlify(text) {
    var twitterUrlRegex = /(https?:\/+t.co\/[^\s]+)/g;
    return text.replace(twitterUrlRegex, function(url) {
        return '<a href="' + url + '" ' + 'target="_blank">' + url + '</a>';
    })
    // or alternatively
    // return text.replace(urlRegex, '<a href="$1">$1</a>')
}

// var text = "Find me at http://www.example.com and also at http://stackoverflow.com";
// var html = urlify(text);

// html now looks like:
// "Find me at <a href="http://www.example.com">http://www.example.com</a> and also at <a href="http://stackoverflow.com">http://stackoverflow.com</a>"



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
