Date.prototype.withoutTime = function () {
    var d = new Date(this);
    d.setHours(0, 0, 0, 0, 0);
    return d
}

var httpRequest = new XMLHttpRequest()
httpRequest.addEventListener("load", transferComplete);
httpRequest.open('GET', "http://data.sfgov.org/api/views/pyih-qa8i/rows.json?accessType=DOWNLOAD");
httpRequest.send();

function transferComplete(evt) {
  var response_json = JSON.parse(this.responseText);
  get_location(response_json);
}

function get_location(response_json) {
  navigator.geolocation.getCurrentPosition(function(pos) {
      var coords = pos.coords;
      parse_data(coords.latitude, coords.longitude, response_json);
    },
    function(err) {
      console.log(err);
      var spinner = document.getElementById("spinner");
      spinner.style.display="none";
      var locationinfo = document.getElementById("location-info");
      locationinfo.innerHTML="<p>There was an error getting your location data. You might need to give the site permission in your browser settings.</p>";
    });
}

function parse_data(lat, long, response_json) {
  var businesses = getBusinesses(lat, long, response_json);

  var spinner = document.getElementById("spinner");
  spinner.style.display="none";
  var locationinfo = document.getElementById("location-info");
  locationinfo.style.display="none";
  for (var i = 0; i < 32; i++) {
    addItemToDOM(businesses[i]);
  }
}

function getBusinesses(lat, long, response_json) {
  var len = response_json.data.length;
  var unique_businesses = []

  for (var i = 0; i < len; i++) {
    var id = response_json.data[i][8];
    var name = response_json.data[i][9];
    var addr = response_json.data[i][10];
    var blat = response_json.data[i][14];
    var blong = response_json.data[i][15];
    var dist = getDistanceFromLatLonInKm(lat, long, blat, blong);
    if (indexInUB(id, unique_businesses) == -1) {
      unique_businesses.push({
        "id": id,
        "name": name,
        "addr": addr,
        "distance": dist,
        "violations": [response_json.data[i]]
      });
    } else {
      unique_businesses[indexInUB(id, unique_businesses)].violations.push(response_json.data[i]);
    }
  }

  unique_businesses.sort(UBProximity)
  return (unique_businesses);
}

function UBProximity(a, b) {
  return (a.distance - b.distance);
}

function indexInUB(id, unique_businesses) {
  for (var i = 0; i < unique_businesses.length; i++) {
    if (unique_businesses[i].id == id) {
      return (i);
    }
  }
  return (-1);
}

function deg2rad(degrees) {
  return (degrees * (Math.PI / 180));
}

function dist() {

}

//TODO: this function does not get the right distance.
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(Math.abs(lat2) - Math.abs(lat1));
  var dLon = deg2rad(Math.abs(lon2) - Math.abs(lon1));
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function sort_key(obj, obj2) {
  return (obj[1] - obj2[1]);
}

function addItemToDOM(restaurant) {
  var main = document.getElementById("main");
  var cell = document.createElement("div");
  cell.className = "col-xs-12 col-sm-12 col-md-6 col-lg-6";
  var panel = document.createElement("div");
  panel.className = "panel panel-info restaurant";
  var panelheading = document.createElement("div");
  panelheading.className = "panel-heading restaurant-head";
  var heading = document.createElement("h2");
  heading.innerHTML = restaurant.name;
  var address = document.createElement("p");
  address.className = "small";
  address.innerHTML = restaurant.addr;
  var panelbody = document.createElement("div");
  panelbody.className = "panel-body";
  var datarow = document.createElement("div");
  datarow.className = "row";
  var scorewrapper = document.createElement("div");
  scorewrapper.className = "main-info col-xs-6 col-sm-6 col-md-6 col-lg-6";
  var score = document.createElement("h1");
  score.innerHTML = getScore(restaurant);
  var distancewrapper = document.createElement("div");
  distancewrapper.className = "main-info col-xs-6 col-sm-6 col-md-6 col-lg-6";
  var distance = document.createElement("h1");
  distance.innerHTML = Math.round(restaurant.distance * 100) / 100 + " km";
  var button = document.createElement("button");
  button.className = "btn btn-lg btn-primary";
  button.type = "button";
  button.addEventListener("click", function() {
    showmodal(restaurant);
  });
  button.innerHTML = "Violations &#187;";

  main.appendChild(cell);
  cell.appendChild(panel);
  panel.appendChild(panelheading);
  panelheading.appendChild(heading);
  panelheading.appendChild(address);
  panel.appendChild(panelbody);
  panelbody.appendChild(datarow);
  datarow.appendChild(scorewrapper);
  scorewrapper.appendChild(score);
  datarow.appendChild(distancewrapper);
  distancewrapper.appendChild(distance);
  panelbody.appendChild(document.createElement("br"));
  panelbody.appendChild(document.createElement("br"));
  panelbody.appendChild(button);
}

//TODO make this
function getScore(restaurant) {
  restaurant.violations.sort(function(a, b) {
    var datea = new Date(a[19]);
    var dateb = new Date(b[19]);
    return dateb.withoutTime() - datea.withoutTime();
  });

  var i;
  for (i = 0 ; restaurant.violations[i][20] == null; i++) {
  }

  return (restaurant.violations[i][20]);
}

function showmodal(restaurant) {
  var modaltitle = document.getElementById("modaltitle");
  modaltitle.innerHTML = restaurant.name;
  var highrisk = document.getElementById("high");
  var medrisk = document.getElementById("med");
  var lowrisk = document.getElementById("low");
  highrisk.innerHTML="";
  medrisk.innerHTML="";
  lowrisk.innerHTML="";

  var violations = getMostRecentViolations(restaurant);

  for (var i = 0; i < violations.length; i++) {
    var violation = violations[i];
    if (violation[24] == "High Risk") {

      var line = document.createElement("p");
      line.innerHTML = violation[23];
      highrisk.appendChild(line);

    } else if (violation[24] == "Moderate Risk") {
      var line = document.createElement("p");
      line.innerHTML = violation[23];
      medrisk.appendChild(line);

    } else if (violation[24] == "Low Risk") {
      var line = document.createElement("p");
      line.innerHTML = violation[23];
      lowrisk.appendChild(line);
    }
  }
  $("#myModal").modal('show');
}

function getMostRecentViolations(restaurant) {
  var violations = [];
  restaurant.violations.sort(function(a, b) {
    var datea = new Date(a[19]);
    var dateb = new Date(b[19]);
    return dateb.withoutTime() - datea.withoutTime();
  });
  var insp;
  for (insp = 0 ; restaurant.violations[insp][20] == null; insp++) {
  }
  var date = new Date(restaurant.violations[insp][19]);

  for (var i = 0; i<restaurant.violations.length; i++) {
    var inspectionDate = new Date(restaurant.violations[i][19])
    if (inspectionDate.withoutTime() - date.withoutTime() == 0) {
      violations.push(restaurant.violations[i]);
    }
  }
  return (violations);
}
