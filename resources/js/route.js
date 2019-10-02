<script>
"use strict";

const startPointUrl = "https://maps.google.com/mapfiles/ms/micons/green-dot.png";
const wayPointUrl = "https://maps.google.com/mapfiles/ms/micons/ltblue-dot.png";
const endPointUrl = "https://maps.google.com/mapfiles/ms/micons/red-dot.png";

const routeStrokeWeight = 6;


function editWaypoint (object, position)
{
}

function removeWaypoint (object, position, context)
{
	$.ajax({
        url: userHikeId + "/route/waypoint/" + context.waypoint,
        headers:
        {
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "DELETE"
    })
    .done (function()
    {
    	context.route.deleteWaypoint (context.waypoint);
    	context.route.retrieve ();
    });
}


function setWaypoint (position, id, route)
{
	$.ajax({
        url: userHikeId + "/route/waypoint/" + id,
        headers:
        {
            "Content-type": "application/json",
            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
        },
        type: "PUT",
        data: JSON.stringify({lat: position.lat (), lng: position.lng ()}),
    })
    .done (function()
    {
    	route.retrieve ();
    });
}

function setStart (position, route)
{
    route.setStart (position);
}


function setEnd (position, route)
{
    route.setEnd (position);
}


class Route
{
    constructor (map)
    {
        this.map = map;
        this.bounds = {};
        
        this.startOfTrailMarker = new StartOfTrailMarker (map, startPointUrl);
        var route = this;
        this.startOfTrailMarker.setDraggable (true, function (position) { setStart (position, route); });
        
        this.endOfTrailMarker = new EndOfTrailMarker (map, endPointUrl);
        this.endOfTrailMarker.setDraggable (true, function (position) { setEnd (position, route); });
        
        this.waypoints = [];
        
        this.wayPointCM = new ContextMenu ([
            {title:"Edit Waypoint", func:editWaypoint},
            {title:"Remove Waypoint", func:removeWaypoint}]);
    }

    setStart (position)
    {
        $.ajax({
            url: userHikeId + "/route/startPoint",
            headers:
            {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
                "Content-type": "application/json"
            },
            type: "PUT",
            data: JSON.stringify({lat: position.lat (), lng: position.lng ()}),
            context: this
        })
        .done (function()
        {
    		this.retrieve ();
        });
    }

	setEnd (position)
	{
	    $.ajax({
	        url: userHikeId + "/route/endPoint",
	        headers:
	        {
	            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
	            "Content-type": "application/json"
	        },
	        type: "PUT",
	        data: JSON.stringify({lat: position.lat (), lng: position.lng ()}),
	        context: this
	    })
	    .done (function()
	    {
			this.retrieve ();
	    });
	}
	
	addWaypoint (position)
	{
	    $.ajax({
	        url: userHikeId + "/route/wayPoint",
	        headers:
	        {
	            "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
	            "Content-type": "application/json"
	        },
	        type: "POST",
	        data: JSON.stringify({lat: position.lat (), lng: position.lng ()}),
	        context: this
	    })
	    .done (function()
	    {
			this.retrieve ();
	    });
	}
	
	deleteWaypoint (id)
	{
		var index = this.waypoints.find(function(entry) { entry.id == id; });
		
		if (index > -1)
		{
			this.waypoints[index].removeMarker ();
			this.waypoints.splice (index, 1);
		}
	}
	

	getLength ()
	{
		return this.actualRoute.length;
	}
	
	retrieve ()
	{
	    $.get({
	        url: userHikeId + "/route",
	        dataType: "json",
	        context: this
	    })
	    .done (function(responseText)
	    {
			this.processResponse (responseText);
	    });
	}

	processResponse (responseText)
	{
		this.anchors = responseText;

		if (this.anchors.length > 0)
		{
			//
			// Add start of trail marker
			//
			this.startOfTrailMarker.setPosition(this.anchors[0].point);

			//
			// Add end of trail marker
			//
			this.endOfTrailMarker.setPosition(this.anchors[this.anchors.length - 1].point);
		}
		
		if (this.anchors.length > 1)
		{
			this.load ();
			
			retrieveTrailConditions ();

			if (this.map)
			{
				this.draw ();

				this.map.fitBounds(this.bounds);
			}
			
			getAndLoadElevationData (0, this.actualRoute.length, this.actualRoute);
		}
	}
	
	load ()
	{
		this.actualRoute = [];
		
		for (let wp of this.waypoints)
		{
			wp.removeMarker ();
		}
		
		this.waypoints = [];
		
		if (this.anchors.length > 1)
		{
			//
			// Traverse route coords and find the bounds
			// todo: this should be part of the file retrieved
			for (let r in this.anchors)
			{
				if (r == 0)
				{
					this.bounds.east = this.anchors[r].point.lng;
					this.bounds.west = this.anchors[r].point.lng;
					this.bounds.north = this.anchors[r].point.lat;
					this.bounds.south = this.anchors[r].point.lat;
				}
				else
				{
					if (this.anchors[r].point.lng > this.bounds.east)
					{
						this.bounds.east = this.anchors[r].point.lng;
					}

					if (this.anchors[r].point.lng < this.bounds.west)
					{
						this.bounds.west = this.anchors[r].point.lng;
					}
					
					if (this.anchors[r].point.lat > this.bounds.north)
					{
						this.bounds.north = this.anchors[r].point.lat;
					}

					if (this.anchors[r].point.lat < this.bounds.south)
					{
						this.bounds.south = this.anchors[r].point.lat;
					}
				}

				if (r > 0 && this.anchors[r].point.lat == this.anchors[r - 1].point.lat && this.anchors[r].point.lng == this.anchors[r - 1].point.lng)
				{
					console.log ("same coordinate");
				}
				
				this.actualRoute.push({lat: this.anchors[r].point.lat, lng: this.anchors[r].point.lng, dist: this.anchors[r].dist, ele: this.anchors[r].point.ele});
				this.anchors[r].actualRouteIndex = this.actualRoute.length - 1;
				
				if (this.anchors[r].type !== undefined && this.anchors[r].type == "waypoint")
				{
					var waypoint = new TrailMarker (this.map, wayPointUrl);
					waypoint.setPosition(this.anchors[r].point);
					var route = this;
					var index = this.waypoints.length;
					waypoint.setDraggable (true, function (position) { setWaypoint (position, index, route); });
					waypoint.setContextMenu(this.wayPointCM, {route: this, waypoint: index});
					
					this.waypoints.push(waypoint);
				}
				
				if (this.anchors[r].trail != undefined && this.anchors[r].trail.length > 1)
				{
					if (this.anchors[r].lat == this.anchors[r].trail[0].lat && this.anchors[r].point.lng == this.anchors[r].trail[0].point.lng)
					{
						console.log ("same coordinate");
					}
					
					for (let t in this.anchors[r].trail)
					{
						this.actualRoute.push({lat: this.anchors[r].trail[t].point.lat, lng: this.anchors[r].trail[t].point.lng, dist: this.anchors[r].trail[t].dist, ele: this.anchors[r].trail[t].point.ele});
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
	
	setContextMenu (menu)
	{
		if (menu === null)
		{
			setContextMenu (this.actualRoutePolyline, routeContextMenu);
		}
		else
		{
			setContextMenu (this.actualRoutePolyline, menu);
		}
	}

	getNearestPoint (position)
	{
		let segment = this.getNearestSegment(position);
		
		let p = nearestPointOnSegment (
			{x: position.lat, y: position.lng},
			{x: this.actualRoute[segment].lat, y: this.actualRoute[segment].lng},
			{x: this.actualRoute[segment + 1].lat, y: this.actualRoute[segment + 1].lng});

		return {lat: p.x, lng: p.y, segment: segment};
	}
	
	getNearestSegment (position)
	{
		let closestEdge = -1;

		//
		// There has to be at least two points in the array. Otherwise, we wouldn't have any edges.
		//
		if (this.actualRoute.length > 1)
		{
			let shortestDistance;
			
			for (let r = 0; r < this.actualRoute.length - 1; r++)
			{
				let distance = distToSegmentSquared(
					{x: position.lng, y: position.lat},
					{x: this.actualRoute[r].lng, y: this.actualRoute[r].lat},
					{x: this.actualRoute[r + 1].lng, y: this.actualRoute[r + 1].lat});

				if (r == 0 || distance < shortestDistance)
				{
					shortestDistance = distance;
					closestEdge = r;
				}
			}
		}
			
		return closestEdge;
	}
	
	getSection (startPosition, endPosition)
	{
		let startSegment = startPosition.segment;
		
		if (startSegment == undefined)
		{
			startSegment = this.getNearestSegment(startPosition);
		}
		
		let endSegment = endPosition.segment;
		
		if (endSegment == undefined)
		{
			endSegment = this.getNearestSegment(endPosition);
		}

		let polyline = [];
		
		//
		// Swap the values if needed.
		//
		if (startSegment > endSegment)
		{
			endSegment = [startSegment, startSegment=endSegment][0];
			endPosition = [startPosition, startPosition=endPosition][0];
		}

		polyline.push({lat: startPosition.lat, lng: startPosition.lng});

		if (startSegment != endSegment)
		{
			for (let r = startSegment + 1; r <= endSegment; r++)
			{
				polyline.push({lat: this.actualRoute[r].lat, lng: this.actualRoute[r].lng});
			}
		}
		
		polyline.push({lat: endPosition.lat, lng: endPosition.lng});
		
		return polyline;
	}
	
	getElevations (elevationData, s, e)
	{
		elevationMin = metersToFeet(this.actualRoute[s].ele);
		elevationMax = elevationMin;
		
		for (let r = s; r < e;  r++)
		{
			if (!isNaN(this.actualRoute[r].ele) && this.actualRoute[r].ele !== null)
			{
				elevationData.push([metersToMiles(this.actualRoute[r].dist), metersToFeet(this.actualRoute[r].ele)]);
				
				elevationMin = Math.min(elevationMin, metersToFeet(this.actualRoute[r].ele));
				elevationMax = Math.max(elevationMax, metersToFeet(this.actualRoute[r].ele));
			}
		}
	}
	
	measure (startPosition, startSegment, endPosition, endSegment)
	{
		var distance = 0;
		
		if (startSegment == endSegment)
		{
			distance = google.maps.geometry.spherical.computeDistanceBetween(
				new google.maps.LatLng(startPosition),
				new google.maps.LatLng(endPosition));
		}
		else
		{
			//
			// Swap the values if needed.
			//
			if (startSegment > endSegment)
			{
				endSegment = [startSegment, startSegment=endSegment][0];
				endPosition = [startPosition, startPosition=endPosition][0];
			}
			
			// Compute the distance between the start point and the start segment (the
			// start point might be in the middle of a segment)
			let startDistance = google.maps.geometry.spherical.computeDistanceBetween(
					new google.maps.LatLng(startPosition),
					new google.maps.LatLng(this.actualRoute[startSegment + 1]));		
	
			for (let r = startSegment + 1; r < endSegment; r++)
			{
				distance += google.maps.geometry.spherical.computeDistanceBetween(
					new google.maps.LatLng(this.actualRoute[r]),
					new google.maps.LatLng(this.actualRoute[r + 1]));		
			}
	
			// Compute the distance between the end segment and the end point (the
			// end point might be int he middle of a segment)
			let endDistance = google.maps.geometry.spherical.computeDistanceBetween(
					new google.maps.LatLng(this.actualRoute[endSegment]),
					new google.maps.LatLng(endPosition));
			
			distance += startDistance + endDistance;
		}
		
		return distance;
	}
}
</script>
