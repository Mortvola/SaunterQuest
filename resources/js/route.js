<script>
"use strict";

const startPointUrl = "https://maps.google.com/mapfiles/ms/micons/green-dot.png";
const wayPointUrl = "https://maps.google.com/mapfiles/ms/micons/ltblue-dot.png";
const endPointUrl = "https://maps.google.com/mapfiles/ms/micons/red-dot.png";

const routeStrokeWeight = 6;


class Route
{
    constructor (map)
    {
        this.map = map;
        this.bounds = {};
        
        this.startOfTrailMarker = new StartOfTrailMarker (map, startPointUrl);
        this.startOfTrailMarker.setDraggable (true, (marker) => { this.setStart (marker.getPosition ()); });
        
        this.endOfTrailMarker = new EndOfTrailMarker (map, endPointUrl);
        this.endOfTrailMarker.setDraggable (true, (marker) => { this.setEnd (marker.getPosition ()); });
        
        this.waypoints = [];
        
        this.wayPointCM = new ContextMenu ([
            {title:"Edit Waypoint", func: (object, position, context) => { this.editWaypoint(context);} },
            {title:"Remove Waypoint", func: (object, position, context) => { this.removeWaypoint (context); }}
        ]);
        
        this.initialLoad = true;
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
            url: userHikeId + "/route/waypoint",
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
	
    updateWaypoint (marker)
    {
        $.ajax({
            url: userHikeId + "/route/waypoint/" + marker.id + "/position",
            headers:
            {
                "Content-type": "application/json",
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
            },
            type: "PUT",
            data: JSON.stringify({lat: marker.getPosition().lat (), lng: marker.getPosition().lng ()}),
            context: this
        })
        .done (function()
        {
            this.retrieve ();
        });
    }

    editWaypoint (marker)
    {
        // Set the form back to the original state
        $("#waypointForm")[0].reset ();
        $("#waypointForm [data-constraint]").removeAttr('data-id');
        
        // Look for and populate any time constraint fields in the form.
        for (let constraint of marker.timeConstraints)
        {
            var control = $("#waypointForm [data-constraint='" + constraint.type + "']");
            
            control.each (function ()
                {
                    if (this.type == 'checkbox')
                    {
                        this.checked = constraint.time != 0;
                    }
                    else
                    {
                        this.value = constraint.time;
                    }
                });
            
            control.attr('data-id', constraint.id);
        }
        
        $("#waypointForm").off('submit');
        $("#waypointForm").submit(function (event)
        {
            event.preventDefault();
            
            var details = objectifyForm($('#waypointForm').serializeArray ());
            
            details.timeConstraints = [];
            
            $("#waypointForm [data-constraint]").each (function ()
                {
                    var inputType = this.attributes.getNamedItem('type').value;
                    var type = this.attributes.getNamedItem('data-constraint').value;
                    var value = null;
                    var id = null;
                    var idAttr = this.attributes.getNamedItem('data-id');
                    
                    if (idAttr !== null)
                    {
                        id = parseInt(idAttr.value);
                    }
                    
                    if (inputType == 'checkbox')
                    {
                        value = this.checked ? 1 : 0;
                    }
                    else
                    {
                        value = parseInt(this.value);
    
                        if (isNaN(value))
                        {
                            value = null;
                        }
                    }
                    
                    details.timeConstraints.push(
                        {
                            id: id,
                            type: type,
                            time: value
                        });
                });
            
            $.ajax({
                url: userHikeId + "/route/waypoint/" + marker.id + "/details",
                headers:
                {
                    "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
                },
                type: "PUT",
                contentType: "application/json",
                data: JSON.stringify(details),
            })
            .done (function()
            {
                marker.name = details.name;
                marker.timeConstraints = details.timeConstraints;
            });
            
            $("#waypointDialog").modal ('hide');
        });
        $("#waypointDialog").modal ('show');
    }

    removeWaypoint (marker)
    {
        $.ajax({
            url: userHikeId + "/route/waypoint/" + marker.id,
            headers:
            {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
            },
            type: "DELETE",
            context: this
        })
        .done (function()
        {
            var index = this.waypoints.findIndex(function(entry) { return entry.id == marker.id; });
            
            if (index > -1)
            {
                this.waypoints[index].removeMarker ();
                this.waypoints.splice (index, 1);
            }

            this.retrieve ();
        });
    }

    setWaypointOrder (order)
    {
        // prepend the ID of the start waypoint 
        // append the ID of the end waypoint.
        order.splice (0, 0, this.anchors[0].id);
        order.splice (order.length, 0, this.anchors[this.anchors.length - 1].id);
        
        $.ajax({
            url: userHikeId + "/route/waypoint/order",
            headers:
            {
                "Content-type": "application/json",
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr('content'),
            },
            type: "PUT",
            data: JSON.stringify(order),
            context: this
        })
        .done (function()
        {
            this.retrieve ();
        });
    }
    

    setWaypointAsCamp (id)
    {
        var waypoint = this.waypoints.find(function(entry) { return entry.id == id; });
        
        if (waypoint)
        {
            waypoint.setIcon (campUrl);
        }
    }
    
    
    getLength ()
    {
        return this.actualRoute.length;
    }
    
    addWaypointChangedSignal (f)
    {
        this.waypointChanged = f;
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
			this.startOfTrailMarker.setPosition(this.anchors[0]);

			//
			// Add end of trail marker
			//
			this.endOfTrailMarker.setPosition(this.anchors[this.anchors.length - 1]);
		}
		
		if (this.anchors.length > 1)
		{
			this.load ();
			
			retrieveTrailConditions ();

			if (this.map)
			{
				this.draw ();

				if (this.initialLoad)
				{
	                this.map.fitBounds(this.bounds);
	                this.initialLoad = false;
				}
			}
			
			getAndLoadElevationData (0, this.actualRoute.length, this.actualRoute);
		}
	}
	
	load ()
	{
		this.actualRoute = [];

		var newWaypoints = [];
		
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

				if (r > 0 && this.anchors[r].lat == this.anchors[r - 1].lat && this.anchors[r].lng == this.anchors[r - 1].lng)
				{
					console.log ("same coordinate");
				}
				
				this.actualRoute.push({lat: this.anchors[r].lat, lng: this.anchors[r].lng, dist: this.anchors[r].dist, ele: this.anchors[r].ele});
				this.anchors[r].actualRouteIndex = this.actualRoute.length - 1;
				
				if (this.anchors[r].type !== undefined && this.anchors[r].type == "waypoint")
				{
				    var waypoint = undefined;
				    
				    if (this.waypoints.length > 0)
				    {
				        var waypointIndex = this.waypoints.findIndex( (w) => { return w.id == this.anchors[r].id; });
				        
				        if (waypointIndex > -1)
				        {
	                        waypoint = this.waypoints.splice (waypointIndex, 1)[0];
				        }
				    }
				    
				    if (waypoint === undefined)
				    {
	                    waypoint = new TrailMarker (this.map, wayPointUrl);
	                    waypoint.id = this.anchors[r].id;
	                    waypoint.setDraggable (true, (marker) => { this.updateWaypoint (marker); });
	                    waypoint.setContextMenu(this.wayPointCM);
	                    waypoint.timeConstraints = this.anchors[r].time_constraints;
				    }
				    
					waypoint.setPosition(this.anchors[r]);
					
					newWaypoints.push(waypoint);
				}
				
				if (this.anchors[r].trail != undefined && this.anchors[r].trail.length > 1)
				{
					if (this.anchors[r].lat == this.anchors[r].trail[0].lat && this.anchors[r].lng == this.anchors[r].trail[0].point.lng)
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
		
		for (let w of this.waypoints)
		{
		    w.removeMarker();
		}
		
		this.waypoints = newWaypoints;
		this.waypointChanged(this.waypoints);
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
