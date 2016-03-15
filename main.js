var httpRequest = new XMLHttpRequest()
httpRequest.addEventListener("load", transferComplete);
httpRequest.open('GET', "http://data.sfgov.org/api/views/pyih-qa8i/rows.json?accessType=DOWNLOAD");
httpRequest.send();

function transferComplete (evt) {
  var response_json = JSON.parse(this.responseText);
  get_location(response_json);
}

function get_location(response_json) {
  navigator.geolocation.getCurrentPosition(function (pos) {
		var coords = pos.coords;
    parse_data(coords.latitude, coords.longitude, response_json);
	},
	function (err) {
    console.log(err);
		parse_data(37.79227, -122.39941, response_json);
	});
}

function parse_data (lat, long, response_json) {
  alert("You are at " + lat + " by " + long);
  var restaurants_in_range = [];
  var len = response_json.data.length;
  console.log(response_json);
  for (var i = 0; i < len; i++) {
    if (getDistanceFromLatLonInKm(lat, long, response_json.data[i][14], response_json.data[i][15]) < 3) {
      restaurants_in_range.push(response_json.data[i]);
    }
  }

  var rangelen = restaurants_in_range.length;
  var high = 0;
  var med = 0;
  var low = 0;

  for (var i = 0; i < rangelen; i++) {
    if (restaurants_in_range[i][24] == "High Risk") {
      high++;
    } else if (restaurants_in_range[i][24] == "Moderate Risk") {
      med++;
    }
    else {
      low++;
    }
  }
  wassup(high, med, low);
}

function deg2rad(degrees) {
  return (degrees*(Math.PI/180));
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function sort_key(obj, obj2) {
  return (obj[1] - obj2[1]);
}
