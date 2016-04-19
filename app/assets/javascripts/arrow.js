var myLat;
var myLon;
var os;
var browser;
var d;
var distanceTimer;
var localTimer;
var myID;
var k;
var location_count;
var myAccuracy;
var myTime;

var opts = {
  lines: 11 // The number of lines to draw
, length: 10 // The length of each line
, width: 3 // The line thickness
, radius: 7 // The radius of the inner circle
, scale: 2.5 // Scales overall size of the spinner
, corners: 1 // Corner roundness (0..1)
, color: '#50D2C2' // #rgb or #rrggbb or array of colors
, opacity: 0 // Opacity of the lines
, rotate: 0 // The rotation offset
, direction: 1 // 1: clockwise, -1: counterclockwise
, speed: 1 // Rounds per second
, trail: 60 // Afterglow percentage
, fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
, zIndex: 2e9 // The z-index (defaults to 2000000000)
, className: 'spinner' // The CSS class to assign to the spinner
, top: '55%' // Top position relative to parent
, left: '50%' // Left position relative to parent
, shadow: false // Whether to render a shadow
, hwaccel: false // Whether to use hardware acceleration
, position: 'absolute' // Element positioning
};
var largest_div;
var http;

// *************** Index Methods *************

function initIndex(id, s, num_new, num_running, sponsored){
    k = s;
    if((parseInt(num_running) + parseInt(sponsored)) != 0) { load(); }
    else { $('#loading').remove(); }
    largest_div = parseInt(num_new) + parseInt(num_running) + parseInt(sponsored) - 1;
    myID = id;
    location_count = 0;
    var download_url = "/";
    if(os == "iOS"){ download_url = "http://www.archerapp.com"; }
    else if(os == "Android"){ download_url = "http://www.archerapp.com";}
    $('#download').attr('href', download_url);
    
    localTimer = window.setInterval(function(){
        navigator.geolocation.getCurrentPosition(updateLocal, function error(msg){}, {enableHighAccuracy: true});
    }, 3000); // update my location locally every 3 seconds
    
    distanceTimer = window.setInterval(function(){
        updateMyLocation();
    }, 30000); // update my location in db every 30 seconds
}

function isBetterLocation(best_lat, best_lon, best_accuracy, best_time, new_lat, new_lon, new_accuracy){
    if(best_lat == null){ return true; }
    
    // Check whether the new location fix is newer or older
    var TWO_MINUTES = 60000;
    var new_time = new Date();
    var timeDelta = new_time - best_time;
    var isSignificantlyNewer = timeDelta > TWO_MINUTES;
    var isSignificantlyOlder = timeDelta < -TWO_MINUTES;
    var isNewer = timeDelta > 0;
    
    // Check whether the new location fix is more or less accurate
    var accuracyDelta = new_accuracy - best_accuracy;
    var isLessAccurate = accuracyDelta > 0;
    var isMoreAccurate = accuracyDelta < 0;
    var isSignificantlyLessAccurate = accuracyDelta > 5;
    var isAccurate = location.getAccuracy() < 8;
    
    //if it's accurate and not old, use it
    if (isAccurate && !isSignificantlyOlder) return true;

    //if it's a lot newer, use it
    if (isSignificantlyNewer) return true;

    //if new reading is more accurate and isn't old, use it     ????
    if (isMoreAccurate && !isSignificantlyOlder) return true;

    if (isNewer && isAccurate) return true;

   // If the new location is older and less accurate, it must be worse
    if (isSignificantlyOlder && isSignificantlyLessAccurate) return false;

    // Determine location quality using a combination of timeliness and accuracy
    if (isNewer && !isLessAccurate)  return true;
    else if (isNewer && !isSignificantlyLessAccurate) return true;

    return false;
}

function calculateIndexDistance(id, div_num, type){
    if(myLat == null){
        navigator.geolocation.getCurrentPosition(updateLocal, function error(msg){}, {enableHighAccuracy: true});
        if(location_count >= 14 && div_num == "1"){
            $('#loading').dialog('close');
            $('#loading-div').attr('class', 'container loading-div');
            $('#loading-div').append("Location error: please make sure location is enabled for this mobile browser and then refresh the page.");
        }
        else{
            if(div_num == "1"){ location_count += 1; }
            window.setTimeout(function(){
                calculateIndexDistance(id, div_num, type);
            }, 1000);
        }
    }
    else{
        $.getJSON("/api/" + type + "/getLocation/" + id + ".json?k=" + k,
            function(data, textStatus, jqXHR){
                var fLat = data.latitude;
                var fLon = data.longitude;
                
                var R = 6371000; // metres
                var myLatRad = Math.PI * myLat/180;
            	var friendLatRad = Math.PI * fLat/180;
            	var myLonRad = Math.PI * myLon/180;
            	var friendLonRad = Math.PI * fLon/180;
            	var deltaLat = friendLatRad - myLatRad;
            	var deltaLon = friendLonRad - myLonRad;
            	
            	var a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                    Math.cos(myLatRad) * Math.cos(friendLatRad) *
                    Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                d =  Math.round(R * c);
                $('#' + div_num + '-distance').empty();
                $('#' + div_num + '-distance').append("<img class='col-xs-offset-1' src='/images/distance_icon.png'>" + " " + parseFloat(d) + "m");
                if(parseInt(div_num) == largest_div){ // once last distance is loaded, stop loading circle
                    $('#loading').dialog('close'); 
                    $('#loading-div').removeAttr('class');
                } 
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log("AJAX error");
            });
    }
}

// *************** Show Methods *************

var friendID;
var friendLat;
var friendLon;
var map;
var myMarker;
var friendMarker;
var mapTimer;
var hourTimer;
var deathtime;

function initShow(fID, mID, s, dtime) {
    determineDevice();
    k = s;
    location_count = 0;
    navigator.geolocation.watchPosition(updateLocal, function error(msg){}, {enableHighAccuracy: true});
    load();
    friendID = fID;
    myID = mID;
    //deathtime = dtime;
    //updateHours();
    updateFriendLocation();
    window.addEventListener("deviceorientation", updateArrowAngle, true);
    distanceTimer = window.setInterval(function(){
        updateMyLocation();
        updateFriendLocation();
    }, 3000);
    
    hourTimer = window.setInterval(function(){
        //updateHours();
    }, 120000);
}

function load(){
    $('#loading').dialog({
        autoOpen: true, 
        width:  $(window).width(), height: $(window).height() * .1, position: {my: "top", at: "top"},
        dialogClass: 'no-title', modal: true
    });
    var target = document.getElementById('loading');
    var spinner = new Spinner(opts).spin(target);
}

function updateHours(){
    var hoursLeft = deathtimeToHours(deathtime);
    $('#hours').empty();
    document.getElementById('hours').innerHTML = "  " + hoursLeft;
}

function updateLocal(position) {
    var new_lat = position.coords.latitude; 
    var new_lon = position.coords.longitude;
    var new_time = new Date();
    var new_accuracy = position.coords.accuracy;
    if(isBetterLocation(myLat, myLon, myAccuracy, myTime, new_lat, new_lon, new_accuracy)){ // if the new location is better, update my lcoation locally
        myLat = new_lat; 
        myLon = new_lon;
        myTime = new_time;
        myAccuracy = new_accuracy;
    }
}

function updateMyLocation(){
    $.ajax({
        url: "/api/user/putLocation/" + myID + ".json",
        type: 'PUT',
        data: {latitude: myLat, longitude: myLon, k: k},
        error: function(result){
            console.log("AJAX error");
        }
    });
}

function updateFriendLocation(){
    $.getJSON("/api/user/getLocation/" + friendID + ".json?k=" + k,
        function(data, textStatus, jqXHR){
            friendLat = data.latitude;
            friendLon = data.longitude;
            calculateDistance();
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log("AJAX error");
        });
}

// using formula here: http://www.movable-type.co.uk/scripts/latlong.html
function calculateDistance(){
   var dist;
    if(myLat == null){
        if(location_count >= 14){
            $('#loading').dialog('close');
            $('#loading-div').attr('class', 'container loading-div');
            $('#loading-div').append("Location error: please make sure location is enabled for this mobile browser and then refresh the page.");
        }
        else{
            location_count += 1;
            window.setTimeout(function(){
                calculateIndexDistance();
            }, 1000);
        }
    }
    else{
        var R = 6371000; // metres
        var myLatRad = Math.PI * myLat/180;
    	var friendLatRad = Math.PI * friendLat/180;
    	var myLonRad = Math.PI * myLon/180;
    	var friendLonRad = Math.PI * friendLon/180;
    	var deltaLat = friendLatRad - myLatRad;
    	var deltaLon = friendLonRad - myLonRad;
    	
    	var a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(myLatRad) * Math.cos(friendLatRad) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        dist = R * c;
        if(document.getElementById('distance').innerHTML == ""){
            window.setTimeout(function(){
                $('#loading').dialog('close'); 
                $('#loading-div').removeAttr('class');
            }, 1000);
        }
        document.getElementById('distance').innerHTML = " " + Math.round(dist) + " m";
    }
    return dist;
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
	var deltaLon = (friendLon - myLon) * Math.PI/180;
	
    var y = Math.sin(deltaLon) * Math.cos(friendLatRad);
    var x = (Math.cos(myLatRad)*Math.sin(friendLatRad)) -
        (Math.sin(myLatRad) * Math.cos(friendLatRad) * Math.cos(deltaLon));
        
    var bearing = Math.atan2(y, x) * 180/Math.PI;
    var orientation = normaliseOrientation(event);
    
    var newArrowAngle = (360 - orientation) + bearing;
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
            /*alpha -= 90;
            if(alpha < 0){ alpha += 360; } */
        }
        else if(browser == "Stock"){
            alpha = 360 - alpha;
            alpha -= 90;
            if(alpha < 0){ alpha += 360; }
        }
    }
    return alpha;
}

function toMap(){
    mixpanel.track(
        "SWITCH MODE",
        {"Device Type": "Web", "Mode" : "Map"}
    );
    $('#right-footer-image').attr('src', '/images/arrow_icon.png');
    $('#arrow').remove();
    $('#arrow-div').append("<div id='map' class='map'></div>");
    window.removeEventListener('deviceorientation');
    initMap();
    $('#right-footer').attr('onclick', 'toArrow()');
}

function toArrow(){
    mixpanel.track(
        "SWITCH MODE",
        {"Device Type": "Web", "Mode" : "Arrow"}
    );
    window.clearInterval(mapTimer);
    map = null;
    myMarker = null;
    friendMarker = null;
    $('#map').remove();
    $('#right-footer-image').attr('src', '/images/globe.png');
    $('#arrow-div').append("<img id='arrow' src='/images/UP_ARROW_half.png'>");
    window.addEventListener("deviceorientation", updateArrowAngle, true);
    $('#right-footer').attr('onclick', 'toMap()');
}

function initMap(){
    var bound = new google.maps.LatLngBounds();
    bound.extend( new google.maps.LatLng(myLat, myLon));
    bound.extend( new google.maps.LatLng(parseFloat(friendLat), parseFloat(friendLon)));
    map = new google.maps.Map(document.getElementById('map'), {
        center: bound.getCenter(),
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        scrollwheel: true,
        tilt: 0
      });
    map.fitBounds(bound);
    
     friendMarker = new google.maps.Marker({
        map: map,
        position: {lat: parseFloat(friendLat), lng: parseFloat(friendLon)},
        icon: '/images/map_pin.png'
    });
    
     myMarker = new google.maps.Marker({
        map: map,
        position: {lat: myLat, lng: myLon},
        icon: '/images/map_pin_you.png'
    });
    
    mapTimer = window.setInterval(function(){
        myMarker.setPosition({lat: myLat, lng: myLon});
        friendMarker.setPosition({lat: parseFloat(friendLat), lng: parseFloat(friendLon)});
    }, 1000);
}

function approve(div_num, mid, aid, sender_mid, sender_name, deathtime){
    mixpanel.track(
        "ACCEPT",
        {"Device Type": "Web"}
    );
    $.ajax({
        url: "/api/arrow/accept.json" ,
        type: 'POST',
        data: {aid: aid, sender_mid: sender_mid, k: k},
        success: function(result) {
            var num = div_num;
            div_num = '#' + div_num;
            $(div_num + '-approve').remove();
            $(div_num).attr('class', 'running-req');
            $(div_num + '-deny').removeAttr('onclick');
            $(div_num + '-deny').attr('src', '/images/delete_smaller.png');
            $(div_num + '-deny').attr('class', 'col-xs-offset-5');
            var html = $(div_num + '-outer').html();
            $(div_num + '-outer').remove();
            $('#running-req').prepend(html);
            $(div_num).attr('onclick', 'showArrow("' + mid + '", "' + sender_name + '", "' + sender_mid + '", "' + deathtime + '")');
            $(div_num + '-inner').append("<br><div><h11><div id='" + num + "-distance' class='col-xs-6'></div><div id='" + num + "-hours'></div></h11></div>");
            calculateHoursLeft(deathtime, num);
            calculateIndexDistance(sender_mid, num, "user");
            //Divs.push(num);
            initializeDivs();
        },
        error: function(result){
            window.alert("Sorry, something went wrong please try again. If this continues please report the issue.");

            
        }
    });
    
}

function deny(div_num, aid, sender_mid){
    mixpanel.track(
        "DENY",
        {"Device Type": "Web"}
    );
    $.ajax({
        url: "/api/arrow/deny.json",
        type: 'POST',
        data: {aid: aid, sender_mid: sender_mid, k: k},
        success: function(result) {
            div_num = '#' + div_num;
            $(div_num + '-outer').remove();
            initializeDivs();
        },
        error: function(result){
            window.alert("Sorry, something went wrong please try again. If this continues please report the issue.");
        }
    });
}

function initializeDivs(){
    // if the new-req section is empty, remove the 'NEW REQUESTS' title
    if ($('#new-req').children().length == 0){
        $('#new-req-title').empty();
        $('#new-req-title').removeAttr('class');
    }
    
    else if($('#new-req-title').is(':empty')){
        $('#new-req-title').attr('class', 'req-title');
        $('#new-req-title').append("<div class='req-inner'><h10 class='col-xs-offset-1'>NEW REQUESTS</h10></div>");
    }
    
    
    if ($('#running-req').children().length == 0) {
        $('#running-req').append("<div id='no-arrows' class='running-req'><div class= 'req-inner req-name'><div class='col-xs-offset-1'><h9>No arrows here yet!</h9></div><div class='col-xs-offset-1'><h11>Accept a request above.</h11></div></div></div>");
    }
    
    else if ($('#no-arrows')){
        $('#no-arrows').remove();
    }
    
    if ($('#sponsored-req').children().length == 0){
        $('#sponsored-req-title').empty();
        $('#sponsored-req-title').removeAttr('class');
    }
    
    else if($('#sponsored-req-title').is(':empty')){
        $('#sponsored-req-title').attr('class', 'req-title');
        $('#sponsored-req-title').append("<div class='req-inner'><h10 class='col-xs-offset-1'>SUGGESTED</h10></div>");
    }
}

function deleteArrow(div_num, aid){
    var choice = confirm("Are you sure you want to delete this arrow forever?");
    var num = div_num;
    if( choice == true ){
        mixpanel.track(
            "DELETE",
            {"Device Type": "Web"}
        );
       $.ajax({
            url: "/api/arrow/" + aid + ".json?k=" + k,
            type: 'DELETE',
            success: function(result) {
                div_num = '#' + div_num;
                $(div_num).remove();
                //Divs.splice((Divs.indexOf(num)), 1);
            },
            error: function(result){
                window.alert("Sorry, something went wrong please try again. If this continues please report the issue.");
            }
        });
    }
}

function showArrow(current_user_id, friend_name, friend_id, deathtime){
    mixpanel.track(
        "OPEN",
        {"Device Type": "Web", "Type" : "Person"}
    );
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "/arrow/showArrow");
    
    var hiddenFieldfID = document.createElement("input");
    hiddenFieldfID.setAttribute("type", "hidden");
    hiddenFieldfID.setAttribute("name", "friend_id");
    hiddenFieldfID.setAttribute("value", friend_id);
    form.appendChild(hiddenFieldfID);
    
    var hiddenFieldcID = document.createElement("input");
    hiddenFieldcID.setAttribute("type", "hidden");
    hiddenFieldcID.setAttribute("name", "current_user_id");
    hiddenFieldcID.setAttribute("value", current_user_id);
    form.appendChild(hiddenFieldcID);
    
    var hiddenFieldName = document.createElement("input");
    hiddenFieldName.setAttribute("type", "hidden");
    hiddenFieldName.setAttribute("name", "friend_name");
    hiddenFieldName.setAttribute("value", friend_name);
    form.appendChild(hiddenFieldName);
    
    var hiddenFieldHours = document.createElement("input");
    hiddenFieldHours.setAttribute("type", "hidden");
    hiddenFieldHours.setAttribute("name", "deathtime");
    hiddenFieldHours.setAttribute("value", deathtime);
    form.appendChild(hiddenFieldHours);
    
    document.body.appendChild(form);
    form.submit();
}

function calculateHoursLeft(deathtime, div_num){
    var hoursLeft = deathtimeToHours(deathtime);
    $('#' + div_num.toString() + '-hours').empty();
    $('#' + div_num.toString() + '-hours').append("<img class='col-xs-offset-1' src='/images/time_icon.png'> " + hoursLeft);
    
}

function deathtimeToHours(deathtime){
    var dtime = new Date(deathtime);
    var now = new Date();
    var hoursLeft = Math.round((dtime - now) / 36e5); // calculates difference in hours
    if(hoursLeft < 0){hoursLeft = "(expired)";}
    else {hoursLeft = hoursLeft.toString() + ' hours';}
    return hoursLeft;
}

function refresh(){
    var i  = 0;
    for(i; i < Divs.length; i += 1){
        $('#top-div').append("SUCCESS");
        calculateIndexDistance($('#' + Divs[i] + '-m').val(), Divs[i]);
        calculateHoursLeft($('#' + Divs[i] + '-deathtime').val(), Divs[i]);
    }
}

// ******************** PLACE METHODS *********************** \\

function initPlaceShow(location, dtime) {
    determineDevice();
    location_count = 0;
    navigator.geolocation.watchPosition(updateLocal, function error(msg){}, {enableHighAccuracy: true});
    load();
    deathtime = dtime;
    updateHours();
    var locationString = location.replace("(", "").replace(")", ""); // remove parenthesis
    var latlon = locationString.split(",");
    friendLat = parseFloat(latlon[0]);
    friendLon = parseFloat(latlon[1]);
    calculateDistance();
    
    window.setTimeout(function(){
        if(myLat == null){
            $('#loading').dialog('close'); 
            $('#location-error').attr('class', 'container location-error');
            $('#location-error').append("Location error: please make sure your phone has location enabled and then refresh the page.");
        }
    }, 7000);
    window.addEventListener("deviceorientation", updateArrowAngle, true);
    distanceTimer = window.setInterval(function(){
        calculateDistance();
    }, 3000);
    hourTimer = window.setInterval(function(){
        updateHours();
    }, 120000);
}

function showPlace(pid, user){
    mixpanel.track(
        "OPEN",
        {"Device Type": "Web", "Type" : "Sponsored"}
    );
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "/place/showArrow");
    
    var hiddenFieldpid = document.createElement("input");
    hiddenFieldpid.setAttribute("type", "hidden");
    hiddenFieldpid.setAttribute("name", "pid");
    hiddenFieldpid.setAttribute("value", pid);
    form.appendChild(hiddenFieldpid);
    
    var hiddenFielduser = document.createElement("input");
    hiddenFielduser.setAttribute("type", "hidden");
    hiddenFielduser.setAttribute("name", "user");
    hiddenFielduser.setAttribute("value", user);
    form.appendChild(hiddenFielduser);
    
    document.body.appendChild(form);
    form.submit();
}

// ******************* Welcome Functions **************************
var CLIENT_ID;
var scriptId;

function initWelcome(client_id, script_id){
    //determineDevice();
    
}
