<script>
"use strict";

var startPointUrl = "http://maps.google.com/mapfiles/ms/micons/green-dot.png";
var endPointUrl = "http://maps.google.com/mapfiles/ms/micons/red-dot.png";

class Route
{
	constructor (map)
	{
		this.map = map;
		this.bounds = {};
		this.startOfTrailMarker = new StartOfTrailMarker (map, startPointUrl);
		this.endOfTrailMarker = new EndOfTrailMarker (map, endPointUrl);
	}

	setStart (position)
	{
		var route = this;
		
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				rotue.retrieve ();
			}
		}
		
		var routeUpdate = {userHikeId: userHikeId, mode: "setStart", point: {lat: position.lat (), lng: position.lng ()}};
		
		xmlhttp.open("PUT", "route.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/json");
		xmlhttp.send(JSON.stringify(routeUpdate));
	}


	setEnd (position)
	{
		var route = this;
		
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				route.retrieve ();
			}
		}
		
		var routeUpdate = {userHikeId: userHikeId, mode: "setEnd", point: {lat: position.lat (), lng: position.lng ()}};
		
		xmlhttp.open("PUT", "route.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/json");
		xmlhttp.send(JSON.stringify(routeUpdate));
	}

	retrieve ()
	{
		var route = this;
		
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				route.anchors = JSON.parse(this.responseText);

				if (route.anchors.length > 0)
				{
					//
					// Add start of trail marker
					//
					route.startOfTrailMarker.setPosition(route.anchors[0]);

					//
					// Add end of trail marker
					//
					route.endOfTrailMarker.setPosition(route.anchors[route.anchors.length - 1]);
				}
				
				if (route.anchors.length > 1)
				{
					route.load ();
					
					retrieveTrailConditions ();

					if (route.map)
					{
						route.draw ();
		
						route.map.fitBounds(route.bounds);
					}
					
					getAndLoadElevationData (0, route.actualRoute.length, route.actualRoute);
				}
			}
		}
		
		xmlhttp.open("GET", "route?id=" + userHikeId, true);
		//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send();
	}

	load ()
	{
		this.actualRoute = [];
		
		if (this.anchors.length > 1)
		{
			//
			// Traverse route coords and find the bounds
			// todo: this should be part of the file retrieved
			for (let r in this.anchors)
			{
				if (r == 0)
				{
					this.bounds.east = this.anchors[r].lng;
					this.bounds.west = this.anchors[r].lng;
					this.bounds.north = this.anchors[r].lat;
					this.bounds.south = this.anchors[r].lat;
				}
				else
				{
					if (this.anchors[r].lng > this.bounds.east)
					{
						this.bounds.east = this.anchors[r].lng;
					}

					if (this.anchors[r].lng < this.bounds.west)
					{
						this.bounds.west = this.anchors[r].lng;
					}
					
					if (this.anchors[r].lat > this.bounds.north)
					{
						this.bounds.north = this.anchors[r].lat;
					}

					if (this.anchors[r].lat < this.bounds.south)
					{
						this.bounds.south = this.anchors[r].lat;
					}
				}

				if (r > 0)
				{
					if (this.anchors[r].lat == this.anchors[r - 1].lat && this.anchors[r].lng == this.anchors[r - 1].lng)
					{
						console.log ("same coordinate");
					}
				}
				
				this.actualRoute.push({lat: this.anchors[r].lat, lng: this.anchors[r].lng, dist: this.anchors[r].dist, ele: this.anchors[r].ele});
				this.anchors[r].actualRouteIndex = this.actualRoute.length - 1;
				
				if (this.anchors[r].trail != undefined)
				{
					if (this.anchors[r].lat == this.anchors[r].trail[0].lat && this.anchors[r].lng == this.anchors[r].trail[0].lng)
					{
						console.log ("same coordinate");
					}
					
					for (let t in this.anchors[r].trail)
					{
						this.actualRoute.push({lat: this.anchors[r].trail[t].lat, lng: this.anchors[r].trail[t].lng, dist: this.anchors[r].trail[t].dist, ele: this.anchors[r].trail[t].ele});
					}
				}
			}
		}
	}
	
	
	draw ()
	{
		if (this.actualRoute.length > 1)
		{
			if (this.actualRoutePolyline != undefined)
			{
				this.actualRoutePolyline.setMap(null);
				
				removeContextMenu(this.actualRoutePolyline);
			}
			
			this.actualRoutePolyline = new google.maps.Polyline({
				path: this.actualRoute,
				editable: false,
				geodesic: true,
				strokeColor: '#0000FF',
				strokeOpacity: 1.0,
				strokeWeight: routeStrokeWeight,
				zIndex: 20});

			this.actualRoutePolyline.setMap(this.map);
			
			setContextMenu (this.actualRoutePolyline, routeContextMenu);
		}
	}

}
</script>
