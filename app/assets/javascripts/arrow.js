var myLat;
var myLon;
var d;
var distanceTimer;
var localTimer;
var myID;
var k;
var Divs = [];

// *************** Index Methods *************

function initIndex(id, s, num_new, num_running){
    k = s;
    $.ui.dialog.prototype._makeDraggable = function() { 
        this.uiDialog.draggable({
            containment: false
        });
    };
     $('#dialog').dialog({
        autoOpen: false, position: { my: "bottom", at: "bottom+25%"},
        width: $(window).width(), height: $(window).height() * 0.55,
        drag: function( event, ui ) {
            if(ui.position.left > 100){
                $('#dialog').dialog('close');
            }
        }
    });
    window.setTimeout(function(){
        $('#dialog').dialog( "open" );

    }, 3000);
    myID = id;
    localTimer = window.setInterval(function(){
        navigator.geolocation.getCurrentPosition(updateLocal);
    }, 3000); // update my location locally every 3 seconds
    
    distanceTimer = window.setInterval(function(){
        updateMyLocation();
    }, 30000); // update my location in db every 30 seconds
    
    var i;
    $('#top-div').append("SUCCESS");
    for(i = parseInt(num_new); i < (parseInt(num_running) + parseInt(num_new)); i += 1){ Divs.push(i); } // fill divs with the div number of each currently running request
}

function calculateIndexDistance(sender_mid, div_num){
    $.getJSON("http://pointme-hogueyy.c9users.io/api/user/getLocation/" + sender_mid + ".json?k=" + k,
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
            $('#' + div_num + '-distance').append("<img class='col-xs-offset-1' src='/assets/distance_icon.png'>" + " " + parseFloat(d) + "m");
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log("AJAX error");
        });
}

// *************** Show Methods *************

var friendID;
var friendLat;
var friendLon;
var os;
var browser;
var map;
var myMarker;
var friendMarker;
var mapTimer;
var hourTimer;
var deathtime;

function initShow(fID, mID, s, dtime) {
    k = s;
    determineDevice();
    friendID = fID;
    myID = mID;
    
    navigator.geolocation.watchPosition(updateLocal);
    deathtime = dtime;
    updateHours();
    updateFriendLocation();
    calculateDistance();
    
    window.addEventListener("deviceorientation", updateArrowAngle, true);
    distanceTimer = window.setInterval(function(){
        updateFriendLocation();
        updateMyLocation();
        calculateDistance();
    }, 3000);
    
    hourTimer = window.setInterval(function(){
        updateHours();
    }, 120000);
    
    updateFriendLocation();
    // if dist is greater than 1 mile, alert the user. CURRENTLY NOT WORKING
    var dist = calculateDistance();
    if(dist > 1600){
        window.alert("PointMe works best when your friend is nearby. For the best experience, please check back when your friend is closer.");
    }
}

function updateHours(){
    var hoursLeft = deathtimeToHours(deathtime);
    $('#hours').empty();
    $('#hours').append(hoursLeft);
}

function updateLocal(position) {
    myLat = position.coords.latitude; 
    myLon = position.coords.longitude;
}

function updateMyLocation(){
    $.ajax({
        url: "http://pointme-hogueyy.c9users.io/api/user/putLocation/" + myID + ".json",
        type: 'PUT',
        data: {latitude: myLat, longitude: myLon, k: k},
        error: function(result){
            console.log("AJAX error");
        }
    });
}

function updateFriendLocation(){
    $.getJSON("http://pointme-hogueyy.c9users.io/api/user/getLocation/" + friendID + ".json?k=" + k,
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
	var myLonRad = Math.PI * myLon/180;
	var friendLonRad = Math.PI * friendLon/180;
	var deltaLat = friendLatRad - myLatRad;
	var deltaLon = friendLonRad - myLonRad;
	
	var a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
        Math.cos(myLatRad) * Math.cos(friendLatRad) *
        Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var dist = R * c;
    document.getElementById('distance').innerHTML = Math.round(dist) + " m";
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

function redirect(url){
    window.location = "http://pointme-hogueyy.c9users.io/" + url;
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
    window.clearInterval(mapTimer);
    map = null;
    myMarker = null;
    friendMarker = null;
    $('#map').remove();
    $('#right-footer-image').attr('src', '/assets/globe.png');
    $('#arrow-div').append("<img id='arrow' src='/assets/UP_ARROW_half.png'>");
    window.addEventListener("deviceorientation", updateArrowAngle, true)
    $('#right-footer').attr('onclick', 'toMap()');
}

function initMap(){
    var bound = new google.maps.LatLngBounds();
    bound.extend( new google.maps.LatLng(myLat, myLon));
    bound.extend( new google.maps.LatLng(parseFloat(friendLat), parseFloat(friendLon)));
    map = new google.maps.Map(document.getElementById('map'), {
        center: bound.getCenter(),
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        scrollwheel: true
      });
    map.fitBounds(bound);
  
    myMarker = new google.maps.Marker({
        map: map,
        position: {lat: myLat, lng: myLon}
    });
    
     friendMarker = new google.maps.Marker({
        map: map,
        position: {lat: parseFloat(friendLat), lng: parseFloat(friendLon)}
    });
    
    mapTimer = window.setInterval(function(){
        myMarker.setPosition({lat: myLat, lng: myLon});
        friendMarker.setPosition({lat: parseFloat(friendLat), lng: parseFloat(friendLon)});
    }, 3000);
}

function approve(div_num, mid, aid, sender_mid, sender_name, deathtime){
    $.ajax({
        url: "http://pointme-hogueyy.c9users.io/api/arrow/accept/" + aid + ".json?k=" + k,
        type: 'GET',
        success: function(result) {
            var num = div_num;
            div_num = '#' + div_num;
            $(div_num + '-approve').remove();
            $(div_num).attr('class', 'running-req');
            $(div_num + '-deny').removeAttr('onclick');
            $(div_num + '-deny').attr('src', '/assets/delete_smaller.png');
            $(div_num + '-deny').attr('class', 'col-xs-offset-5');
            var html = $(div_num + '-outer').html();
            $(div_num + '-outer').remove();
            $('#running-req').prepend(html);
            $(div_num).attr('onclick', 'showArrow("' + mid + '", "' + sender_name + '", "' + sender_mid + '", "' + deathtime + '")');
            $(div_num + '-inner').append("<br><div><h11><div id='" + num + "-distance' class='col-xs-6'></div><div id='" + num + "-hours'></div></h11></div>");
            calculateHoursLeft(deathtime, num);
            calculateIndexDistance(sender_mid, num);
            //Divs.push(num);
            initializeDivs();
        },
        error: function(result){
            window.alert("Sorry, something went wrong please try again. If this continues please report the issue.");
        }
    });
    
}

function deny(div_num, aid){
    $.ajax({
        url: "http://pointme-hogueyy.c9users.io/api/arrow/deny/" + aid + ".json?k=" + k,
        type: 'GET',
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
}

function deleteArrow(div_num, aid){
    var choice = confirm("Are you sure you want to delete this arrow forever?");
    var num = div_num;
    if( choice == true ){
       $.ajax({
            url: "http://pointme-hogueyy.c9users.io/api/arrow/" + aid + ".json?k=" + k,
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
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", "http://pointme-hogueyy.c9users.io/arrow/showArrow");
    
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
    $('#' + div_num.toString() + '-hours').append("<img class='col-xs-offset-1' src='/assets/time_icon.png'> " + hoursLeft);
    
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
