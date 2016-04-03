OAuth.initialize('7bIgDNbrQL4S2mH034k8dO4KxBE');
var twitterRequestor;
var currentUser;
var $output = $("#out");
var locationObj = {};

//Create Firebase
var fireb = new Firebase('https://coralsilver.firebaseio.com/');

function login(){
  OAuth.popup('twitter', {cache: true}).done(function(result) {
    twitterRequestor = result;
    twitterRequestor.me().then(function(profile){
      currentUser = profile;
      retreiveSavedLocations();
    })
    loggedIn();
  }).fail(function (err) {
    console.warn('ERROR', err);
  });
}

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

function retreiveSavedLocations() {
  var locRef = fireb.child('users').child(currentUser.id).child('location');
  locRef.on("value", function(snapshot) {
    var snapshot = snapshot.val();
    var locations = Object.keys(snapshot).map(function(key){
      return snapshot[key]
    });
    console.log(locations);
    buildSavedLocations(locations);
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });

}

function buildSavedLocations(locations) {
  var savedLocationContainer = $('<div class="saved-location"></div>');
  for(var i=0; i<locations.length; i++) {
    var savedLocationName = '<h3>' + locations[i].name + '</h3>'
    var savedLat = '<p>Latitude: ' + locations[i].longitude + '</p>'
    var savedLong = '<p>Longitude: ' + locations[i].latitude + '</p>'
    var savedMiles = '<p>Distance Range: ' + locations[i].miles + '</p>'
    savedLocationContainer.append(savedLocationName + savedLat + savedLong + savedMiles);

  }
  $('#savedSearches').html(savedLocationContainer);
}

function getTweetsByLocation(lat, lon, miles){
  miles = $('#volume').val();
  //miles = miles || 2;
  var apiEndpoint = 'https://api.twitter.com/1.1/search/tweets.json?count=50&geocode=';
  apiEndpoint += lat + ',' + lon + ',' + miles + 'mi';
  locationObj = {
    latitude: lat,
    longitude: lon,
    miles:miles
  };
  console.log(apiEndpoint);
  //console.log(miles + ' miles');
  twitterRequestor.get(apiEndpoint).done(function(data, media_url) {
    //console.log(data);
    var $locatedTweets = $('#locatedTweets');
    for(var i = 0; i < data.statuses.length; i++) {
      var tweets = '<p>'+ urlify(data.statuses[i].text) + '</p>';
      var screenName = '<span class="user-name"><a href="'+ 'https://twitter.com/' + data.statuses[i].user.screen_name + '" ' + 'target="_blank"' + '>' + data.statuses[i].user.screen_name + '</a></span>';
      var createdDate = (new Date(data.statuses[i].created_at));
      //convert to relative time
      var relativeDate = moment(createdDate).fromNow();
      var dateElm = '<span>'+ relativeDate +'</span>';
      screenName += dateElm;
      var profileImageUrl = '<img src = "' + data.statuses[i].user.profile_image_url + '" class = "profile-image">';
      //console.log(media_url);
      console.log(data);

      if (data.statuses[i].entities.hasOwnProperty("media")){
        var tweetImage = '<img src = "' + data.statuses[i].entities.media[0].media_url + '" class="media-image">';
        var $fullTweet = $('<div class="tweet-container">' + profileImageUrl + screenName + tweets + tweetImage + '<i class="material-icons heart">favorite</i>' + '</div>');
      } else {
        var $fullTweet = $('<div class="tweet-container">' + profileImageUrl + screenName + tweets + '<i class="material-icons heart">favorite</i>' + '</div>');
      }

      $fullTweet.data('twitter-message-obj', data.statuses[i]);
      //console.log(data.statuses[i])
      $locatedTweets.append($fullTweet);
    }

  }).fail(function(err) {
    console.warn(err);
  });
}

function loggedIn() {
  $('#appLoggedIn, header').removeClass('hidden');
  $('.login-container ').addClass('hidden');
}

function geoFindMe() {
  if (!navigator.geolocation){
    $output.html("<p>Geolocation is not supported by your browser</p>");
    return;
  }

  $output.html('<img src="../images/arrow.png" class="loading-icon">');
  navigator.geolocation.getCurrentPosition(success, error);
}

function success(position) {  //position is automatically returned?
  latitude  = position.coords.latitude;
  longitude = position.coords.longitude;
  buildResults(latitude, longitude);
}

function buildResults(latitude, longitude){
  getTweetsByLocation(latitude, longitude);
  var range = 14;

  $output.html('<p>Latitude is ' + latitude + '° <br>Longitude is ' + longitude + '°</p>');

  var $img = new Image();
  $img.src = "https://maps.googleapis.com/maps/api/staticmap?center=" + latitude + "," + longitude + "&zoom=" + range + "&size=300x300&sensor=false";


  var $button =  $('<button id="saveSearch" class="btn">Save search location</button>');

  $output.append($img).append($button);
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
}

function saveSearchLocation() {
  $(document).on('click','#saveSearch',function(){
    var locationName = prompt('What would you like to name this location?');
    locationObj.name = locationName;
    fireb.child('users').child(currentUser.id).child('location').child(locationName).set(locationObj);
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
    //save
    fireb.child('users').child(currentUser.id).child('tweets').child(tweetObj.id_str).set(tweetObj);

    // // Retrieve new posts as they are added to our database
    // fireb.on("child_added", function(snapshot, prevKey) {
    //   var newPost = snapshot.val();
    //   console.log(newPost);
    //   console.log(prevKey.val());
    //   // console.log("URL: " + newPost.profileImgURL);
    //   // console.log("Text: " + newPost.tweetText);
    //   // console.log("Previous Post ID: " + prevChildKey);
    // });

  } else {
    console.log('unfavorited');
    fireb.child('users').child(currentUser.id).child('tweets').child(tweetObj.id_str).remove();
  }
// } else if ($(this).data( "favorited" ) === false){
//       console.log('unfavorited');
//       fireb.child('users').child('user_id').child('tweets').child(tweetObj.id_str).remove();
//   }

});



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
