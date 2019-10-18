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
        .done (function(updates)
        {
            if (updates === undefined)
            {
                this.retrieve ();
            }
            else
            {
                this.applyUpdates (updates);
            }
        });
    }
	
    applyUpdates (updates)
    {
        for (let update of updates)
        {
            // Find the anchor in the array of anchors that 
            // corresponds to the first anchor in this update
            var firstIndex = this.anchors.findIndex(function(entry) { return entry.id == update[0].id; });

            if (firstIndex > -1)
            {
                // Find the anchor in the array that corresponds to the 
                // last anchor in this update
                var lastIndex = this.anchors.findIndex(function(entry) { return entry.id == update[update.length - 1].id; });

                if (lastIndex > -1)
                {
                    // The first and last anchors were found. Replace the anchors in the array of anchors
                    // with this update.
                    
                    var route = [];
                    var firstPointToReplace = this.anchors[firstIndex].actualRouteIndex;
                    var numberOfPointsToReplace = this.anchors[lastIndex].actualRouteIndex - firstPointToReplace + 1;
                    var startDistance = this.anchors[firstIndex].dist;
                    
                    for (let anchor of update)
                    {
                        this.addPointsToArray (anchor, route);
                        anchor.actualRouteIndex += firstPointToReplace;
                        anchor.dist += startDistance;

                        if (this.anchorIsWaypoint (anchor))
                        {
                            this.updateOrAddWaypoint (anchor)
                        }
                    }

                    // The last anchor in the update needs to adopt the trail from the anchor that will be replaced.
                    update[update.length - 1].trail = this.anchors[lastIndex].trail;
                    
                    // Update the polyline
                    var path = this.actualRoutePolyline.getPath ();

                    for (let p  = 0; p < Math.min(route.length, numberOfPointsToReplace); p++)
                    {
                        path.setAt(p + firstPointToReplace, new google.maps.LatLng(route[p]));
                    }
                    
                    if (numberOfPointsToReplace > route.length)
                    {
                        for (let p = route.length; p < numberOfPointsToReplace; p++)
                        {
                            // Since we are removing elements there is no need to 
                            // walk the array, just keeping removing the same index
                            path.removeAt (route.length + firstPointToReplace);
                        }
                    }
                    else if (route.length > numberOfPointsToReplace)
                    {
                        for (let p = numberOfPointsToReplace; p < route.length; p++)
                        {
                            path.insertAt (p + firstPointToReplace, new google.maps.LatLng(route[p]));
                        }
                    }
                    
                    // Update all of the actualRouteIndex and distance data members in the anchors beyond
                    // the point of update.
                    var indexDelta = route.length - numberOfPointsToReplace;
                    var distDelta = update[update.length - 1].dist - this.anchors[lastIndex].dist;
                    for (let i = lastIndex + 1; i < this.anchors.length; i++)
                    {
                        this.anchors[i].actualRouteIndex += indexDelta;
                        this.anchors[i].dist += distDelta;
                        
                        var waypoint = this.getWaypoint (this.anchors[i]);
                        
                        if (waypoint !== undefined)
                        {
                            waypoint.setPosition(this.anchors[i]);
                        }
                    }
                    
                    this.anchors.splice(firstIndex, lastIndex - firstIndex + 1, ...update);
                    
                    //console.log("Number of anchors: " + this.anchors.length)
                    //console.log("Number of points: " + path.length)
                }
                else
                {
                    this.retrieve ();
                }
            }
            else
            {
                this.retrieve ();
            }
        }
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
        .done (function(updates)
        {
            if (updates === undefined)
            {
                this.retrieve ();
            }
            else
            {
                this.applyUpdates (updates);
            }
        });
    }

    editWaypoint (marker)
    {
        // Set the form back to the original state
        $("#waypointForm")[0].reset ();
        $("#waypointForm [data-constraint]").removeAttr('data-id');
        
        $("#waypointForm [name='name']").val(marker.name);
        
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
                    else if (this.type == 'time')
                    {
                        this.value = formatTime(constraint.time);
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
                    else if (inputType == 'time')
                    {
                        value = unformatTime(this.value);
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
        .done (function(updates)
        {
            var index = this.waypoints.findIndex(function(entry) { return entry.id == marker.id; });
            
            if (index > -1)
            {
                this.waypoints[index].removeMarker ();
                this.waypoints.splice (index, 1);
            }

            if (updates === undefined)
            {
                this.retrieve ();
            }
            else
            {
                this.applyUpdates (updates);
            }
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
	
	anchorIsWaypoint (anchor)
	{
	    return anchor.type !== undefined && anchor.type == "waypoint";
	}
	
	getWaypoint (anchor)
	{
        var waypoint = undefined;

        // Check to see if this waypoint already exists in our array of waypoints.
        var waypointIndex = this.waypoints.findIndex( (w) => { return w.id == anchor.id; });

        if (waypointIndex > -1)
        {
            waypoint = this.waypoints[waypointIndex];
        }
        
        return waypoint;
	}
	
	updateOrAddWaypoint (anchor)
	{
        var waypoint = this.getWaypoint (anchor);
        
        if (waypoint === undefined)
        {
            // The waypoint doesn't already exist. Add it to the array of waypoints.
            waypoint = new TrailMarker (this.map, wayPointUrl);
            waypoint.id = anchor.id;
            waypoint.setDraggable (true, (marker) => { this.updateWaypoint (marker); });
            waypoint.setContextMenu(this.wayPointCM);
            
            this.waypoints.push(waypoint);
        }
        
        waypoint.timeConstraints = anchor.time_constraints;
        waypoint.name = anchor.name;
        waypoint.setPosition(anchor);
        
        return waypoint;
	}
	
	addPointsToArray (anchor, route)
	{
        route.push({lat: anchor.lat, lng: anchor.lng, dist: anchor.dist, ele: anchor.ele});
        anchor.actualRouteIndex = route.length - 1;
        
        if (anchor.trail != undefined && anchor.trail.length > 0)
        {
            if (anchor.lat == anchor.trail[0].point.lat && anchor.lng == anchor.trail[0].point.lng)
            {
                console.log ("same coordinate");
            }
            
            for (let t in anchor.trail)
            {
                route.push({lat: anchor.trail[t].point.lat, lng: anchor.trail[t].point.lng, dist: anchor.trail[t].dist, ele: anchor.trail[t].point.ele});
            }
        }
	}
	
	load ()
	{
		this.actualRoute = [];

		for (let w of this.waypoints)
		{
		    w.remove = true;
		}
		
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
				
				if (this.anchorIsWaypoint (this.anchors[r]))
				{
				    var waypoint = this.updateOrAddWaypoint (this.anchors[r])
					
				    waypoint.remove = false;
				}
				
				this.addPointsToArray (this.anchors[r], this.actualRoute);
			}
		}
		
		for (let w of this.waypoints)
		{
		    if (w.remove)
		    {
	            w.removeMarker();
		    }
		}
		
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
