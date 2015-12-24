var myLat;
var myLon;
var friendID;
var friendLat;
var friendLon;
var timer;
var os;
var browser;
var map;
var marker;

function init(ID) {
    determineDevice();
    friendID = ID;
    
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateMyLocation);
    }
    
    updateFriendLocation();
    calculateDistance();
    window.addEventListener("deviceorientation", updateArrowAngle, true);
    timer = window.setInterval(function(){
        updateFriendLocation();
        calculateDistance();
    }, 3000);
}

function updateMyLocation(position) {
    myLat = position.coords.latitude; 
    myLon = position.coords.longitude;
}

function updateFriendLocation(){
    $.getJSON("http://pointme-hogueyy.c9users.io/api/user/getLocation/" + friendID,
        function(data, textStatus, jqXHR){
            friendLat = data.latitude;
            friendLon = data.longitude;
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log("AJAX error");
        });
}

// using formula here: http://www.movable-type.co.uk/scripts/latlong.html
function calculateDistance(){
    var R = 6371000; // metres
    var myLatRad = Math.PI * myLat/180;
	var friendLatRad = Math.PI * friendLat/180;
	var myLonRad = Math.PI * myLat/180;
	var friendLonRad = Math.PI * friendLat/180;
	var deltaLat = friendLatRad - myLatRad;
	var deltaLon = friendLonRad - myLonRad;
	
	var a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
        Math.cos(myLatRad) * Math.cos(friendLatRad) *
        Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var dist = R * c;
    document.getElementById('distance').innerHTML = Math.round(dist) + " m";
}

// taken from: https://github.com/ajfisher/deviceapi-normaliser/blob/master/deviceapi-normaliser.js
function determineDevice(){
    var orientation = false;
    var motion = false;
    var ua = navigator.userAgent;

    if (window.DeviceOrientationEvent) {
        orientation = true;
    }

    if (window.DeviceMotionEvent) {
        motion = true;
    }

    if (orientation && motion) {
        // Could be iOS, Android Stock or FF or blackberry
        if (ua.match(/Firefox/i) && ua.match(/Android/i)) {
            // this is definitive
            os = "Android";
            browser = "Firefox";
        } else if (ua.match(/Android/i)){
            // Stock Android
            os = "Android";
            browser = "Stock";
        } else if (ua.match(/Blackberry|RIM/i)){
            //blackberry
            os = "Blackberry";
            browser = "Stock";
        } else {
            os = "iOS";
            browser = "webkit";
        }
    } else if (orientation && !motion) {
        // It's chrome but is it desktop or mobile?
        browser = "Chrome";
        if (ua.match(/Android/i)){
            os = "Android";
        } else {
            os = "Desktop";
        }
    } else if (!orientation) {

        // this is something very odd
        browser = "Unknown";
        os = "Unknown";
    }
}

// using formula here: http://www.movable-type.co.uk/scripts/latlong.html
function updateArrowAngle(event){
    var myLatRad = Math.PI * myLat/180;
	var friendLatRad = Math.PI * friendLat/180;
	var myLonRad = Math.PI * myLat/180;
	var friendLonRad = Math.PI * friendLat/180;
	
    var y = Math.sin(friendLonRad - myLonRad) * Math.cos(friendLatRad);
    var x = Math.cos(myLatRad)*Math.sin(friendLatRad) -
        Math.sin(myLatRad) * Math.cos(friendLatRad) * Math.cos(friendLonRad - myLonRad);
        
    var bearing = Math.atan2(y, x) * 180/Math.PI;
    var orientation = normaliseOrientation(event);
    
    var newArrowAngle = bearing - orientation;
    if(newArrowAngle < 0){ newArrowAngle += 360; }
    $("#arrow").rotate(newArrowAngle);
}

// based on browser orientation quirks described here: https://gist.github.com/mattdsteele/5615925
function normaliseOrientation(event){
    var alpha = event.alpha;
    if(os == "iOS"){
        alpha = event.webkitCompassHeading;
    }
    else if(os == "Android"){
        if(browser == "Chrome"){
            alpha = 360 - alpha;
        }
        else if(browser == "Stock"){
            alpha = 360 - alpha;
            alpha -= 90;
            if(alpha < 0){ alpha += 360; }
        }
    }
    return alpha;
}

function exit(ID){
    window.location = "http://pointme-hogueyy.c9users.io/arrow/index/" + ID;
}

function toMap(){
    $('#right-footer-image').attr('src', '/assets/arrow_icon.png');
    window.removeEventListener("deviceorientation", updateArrowAngle);
    $('#arrow').remove();
    $('#arrow-div').append("<div id='map' class='map'></div>");
    initMap();
    $('#right-footer').attr('onclick', 'toArrow()');
}

function toArrow(){
    map = null;
    marker = null;
    $('#map').remove();
    $('#arrow-div').append("<img id='arrow' src='/assets/UP_ARROW_half.png'>");
    window.addEventListener("deviceorientation", updateArrowAngle, true)
    $('#right-footer').attr('onclick', 'toMap()');
}

function initMap(){
    map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: myLat, lng: myLon},
    // Set mapTypeId to google.maps.MapTypeId.SATELLITE in order
    // to activate satellite imagery.
    mapTypeId: google.maps.MapTypeId.SATELLITE,
    scrollwheel: true,
    zoom: 20
  });
  
  marker = new google.maps.Marker({
    map: map,
    position: {lat: myLat, lng: myLon},
    title: 'You'
  });
}

// .00045 (about 50 meters)