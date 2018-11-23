"use strict";

var markers = [];
var routeCoords = [];
var map;
var data;

function timeFormat (t)
{
	let h = Math.floor(t);
	let m = Math.floor(((t * 60) % 60));

	let formattedTime = "";
	
	formattedTime += h;

	if (m < 10)
	{
		formattedTime += ":0" + m;
	}
	else
	{
		formattedTime += ":" + m;
	}
	
	return formattedTime;
}

function attachMessage (marker, message)
{
	var infoWindow = new google.maps.InfoWindow({content: message});
	
	marker.addListener ("click", function () {infoWindow.open(map, marker);});
}

//
// Iterate across the array of points of interest and drop markers on the map.
//
function setPointsOfInterest()
{
	if (map && markers.length > 0)
	{
		var markerContextMenu = new ContextMenu ([
			{title:"Remove Point of Interest", func:removePointOfInterest},
			{title:"Edit Point of Interest", func:editPointOfInterest},
		]);
		
		for (let m in markers)
		{
			if (markers[m].label == "R")
			{
				markers[m].marker = new google.maps.Marker({
					position: markers[m],
					map: map,
					//label:markers[m].label,
					icon: {
						url: "http://maps.google.com/mapfiles/ms/micons/blue.png"
					},
				});
				
				markers[m].marker.addListener ("rightclick", function (event) {markerContextMenu.open (map, event, m); });
				attachMessage(markers[m].marker, "Resupply");
			}
			else if (markers[m].label == "C")
			{
				markers[m].marker = new google.maps.Marker({
					position: markers[m],
					map: map,
					//label:markers[m].label,
					icon: {
						url: "http://maps.google.com/mapfiles/ms/micons/campground.png"
					},
				});
				
				attachMessage(markers[m].marker, "<div>Day " + markers[m].day
						+ "</div><div>Mile: " + metersToMiles(data[markers[m].day].meters)
						+ "</div><div>Elevation: " + metersToFeet(data[markers[m].day].ele) + "\'</div>");
			}
		}
	}
}

function removePointOfInterest (marker)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
		}
	}
	
	xmlhttp.open("POST", "removePOI.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("poiId=" + markers[marker].poiId);
}

function editPointOfInterest (marker)
{
	$("#myModal").modal ('show');
}

function addPointOfInterest (position)
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
		}
	}

	xmlhttp.open("POST", "addPOI.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("userHikeId=" + userHikeId + "\&location=" + JSON.stringify(position.toJSON()));
}

function initializeContextMenu ()
{
	ContextMenu.prototype = new google.maps.OverlayView ();

	ContextMenu.prototype.open = function (map, event, marker)
	{
		this.set('position', event.latLng);
		this.set('marker', marker);
		
		this.setMap(map);
		this.draw ();
	};

	ContextMenu.prototype.draw = function()
	{
		var position = this.get('position');
		var projection = this.getProjection();

		if (position && projection)
		{
			var point = projection.fromLatLngToDivPixel(position);
			this.div_.style.top = point.y + 'px';
			this.div_.style.left = point.x + 'px';
		}
	};

	ContextMenu.prototype.onAdd = function ()
	{
		var contextMenu = this;
		var map = this.getMap ();
		
		this.getPanes().floatPane.appendChild(this.div_);
		
		// mousedown anywhere on the map except on the menu div will close the
		// menu.
		this.divListener_ = google.maps.event.addDomListener(map.getDiv(), 'mousedown', function(event)
		{
			// If the thing that was clicked was not a child of the context menu div
			// then close the context menu.
			if (event.target.parentElement != contextMenu.div_)
			{
				contextMenu.close();
			}
		}, true);
	};
			
	ContextMenu.prototype.onRemove = function ()
	{
		google.maps.event.removeListener(this.divListener_);
		this.div_.parentNode.removeChild(this.div_);
		
		// clean up
		this.set('position');
	};

	ContextMenu.prototype.close = function ()
	{
		this.setMap(null);
	};

	ContextMenu.prototype.itemClicked = function (itemFunction)
	{
		// If the context menu was for a marker then execute the method
		// using the marker index as the parameter. Otherwise, use the
		// location information as the parameter
		var marker = this.get('marker');

		if (marker)
		{
			itemFunction(marker);
		}
		else
		{
			var position = this.get('position');

			itemFunction(position);
		}

		this.close ();
	};
}

//
// Create the context menu using the array of items to create sub-divs
// as children of the context menu div.
//
function ContextMenu (items)
{
	this.div_ = document.createElement ('div');
	this.div_.className = 'context-menu';

	var menu = this;
	
	for (let i in items)
	{
		var menuItem = document.createElement('div');
		menuItem.innerHTML = items[i].title;
		menuItem.className = 'context-menu-item';
		this.div_.appendChild(menuItem);

		google.maps.event.addDomListener(menuItem, 'click', function()
		{
			menu.itemClicked (items[i].func);
		});
	}
}


//
// Position the map so that the two endpoints (today's and tomorrow's) are visible.
// todo: take into account the area the whole path uses. Some paths go out of window 
// even though the two endpoints are within the window.
//
function positionMapToDay (d)
{
	var bounds = {};

	if (data[d].lng < data[d + 1].lng)
	{
		bounds.east = data[d + 1].lng;
		bounds.west = data[d].lng;
	}
	else
	{
		bounds.east = data[d].lng;
		bounds.west = data[d + 1].lng;
	}

	if (data[d].lat < data[d + 1].lat)
	{
		bounds.north = data[d + 1].lat;
		bounds.south = data[d].lat;
	}
	else
	{
		bounds.north = data[d].lat;
		bounds.south = data[d + 1].lat;
	}

	map.fitBounds(bounds);
}

function drawRoute ()
{
	if (map && routeCoords.length > 0)
	{
		var bounds = {};
		
		//
		// Traverse route coords and find the bounds
		// todo: this should be part of the file retrieved
		for (let r in routeCoords)
		{
			if (r == 0)
			{
				bounds.east = routeCoords[r].lng;
				bounds.west = routeCoords[r].lng;
				bounds.north = routeCoords[r].lat;
				bounds.south = routeCoords[r].lat;
			}
			else
			{
				if (routeCoords[r].lng > bounds.east)
				{
					bounds.east = routeCoords[r].lng;
				}

				if (routeCoords[r].lng < bounds.west)
				{
					bounds.west = routeCoords[r].lng;
				}
				
				if (routeCoords[r].lat > bounds.north)
				{
					bounds.north = routeCoords[r].lat;
				}

				if (routeCoords[r].lat < bounds.south)
				{
					bounds.south = routeCoords[r].lat;
				}
			}
		}

		map.fitBounds(bounds);
		
		var route = new google.maps.Polyline({
			path: routeCoords,
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 1.0,
			strokeWeight: 4});

		route.setMap(map);

		initializeContextMenu ();

		var routeContextMenu = new ContextMenu ([{title:"Add Point of Interest", func:addPointOfInterest}, {title:"Add Note"}]);
		
		route.addListener ("rightclick", function (event) {routeContextMenu.open (map, event); });
	}
}

function myMap()
{
	var mapProp =
	{
		center:new google.maps.LatLng(31.4971635304391,-108.210319317877),
		zoom:5,
		streetViewControl:false,
		fullscreenControl:false,
		mapTypeId:"terrain",
	};
	
	map = new google.maps.Map(document.getElementById("googleMap"), mapProp);

	drawRoute ();
		
	setPointsOfInterest ();
} 

function metersToMiles (meters)
{
	return Math.round(parseFloat(meters) / 1609.34 * 10) / 10;
}

function metersToFeet (meters)
{
	return Math.round(parseFloat(meters) * 3.281);
}

function calculate ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			data = JSON.parse(this.responseText);

			let txt = "";
			let day = 1;
			
			for (let d in data)
			{
				let ounces = data[d].accumWeight * 0.035274;
				let pounds = Math.floor (ounces / 16.0);
				ounces = Math.round(ounces % 16.0);

				txt += "<div class='panel panel-default'>";
				txt += "<div class='panel-heading' onclick='positionMapToDay(" + d + ")'>";
				txt += "<div class='grid-container'>";
				txt += "<div>" + "Day " + day + "</div>";
				txt += "<div>" + "Gain/Loss (feet): " + metersToFeet(data[d].gain) + "/" + metersToFeet(data[d].loss) + "</div>";
				txt += "<div>" + "Food: " + pounds + " lb " + ounces  + " oz" + "</div>";
				txt += "<div>" + "" + "</div>";
				txt += "<div>" + "Miles: " + metersToMiles (data[d].distance) + "</div>";
				txt += "</div>";
				txt += "</div>";
					
				txt += "<div>" + timeFormat(data[d].startTime) + ", " + "mile " + metersToMiles (data[d].meters) + ": start" + "</div>";
				
				if (data[d].events.length > 0)
				{
					for (let e in data[d].events)
					{
						txt += "<div>" + timeFormat(data[d].events[e].time) + ", " + "mile " + metersToMiles (data[d].events[e].meters) + ": " + data[d].events[e].type + "</div>";

						// todo: should the marker just have the index to this day and event instead of the POI ID?
						markers.push({poiId: data[d].events[e].poiId, lat: parseFloat(data[d].events[e].lat), lng: parseFloat(data[d].events[e].lng), label:"R"});
					}
				}

				if (d < data.length - 1)
				{
					txt += "<div>" + timeFormat(data[d].endTime) + ", " + "mile " + metersToMiles (data[parseInt(d) + 1].meters) + ": stop " + "</div>";
				}

				txt += "</div>";
				
				markers.push({lat: parseFloat(data[d].lat), lng: parseFloat(data[d].lng), label:"C", day:(day - 1)});
				
				day++;
			}

			document.getElementById ("schedule").innerHTML = txt;

			if (map)
			{
				setPointsOfInterest ();
			}
		}
	}

	xmlhttp.open("GET", "calculate.php?id=" + userHikeId, true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}

function retrieveRoute ()
{
	var xmlhttp = new XMLHttpRequest ();
	xmlhttp.onreadystatechange = function ()
	{
		if (this.readyState == 4 && this.status == 200)
		{
			routeCoords = JSON.parse(this.responseText);
			
			if (map)
			{
				drawRoute ();
			}
		}
	}
	
	xmlhttp.open("GET", "getRoute.php?id=0", true);
	//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}

retrieveRoute ();
calculate ();
