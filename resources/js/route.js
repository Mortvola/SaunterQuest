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
        $("#pleaseWait").show ();
        
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
        .done (function(updates)
        {
            if (updates === undefined)
            {
                this.retrieve ();
            }
            else
            {
                this.applyUpdates (updates);
                this.startOfTrailMarker.setPosition(this.anchors[0]);
            }
        })
        .always (function ()
        {
            
            $("#pleaseWait").hide ();
        });
    }

	setEnd (position)
	{
        $("#pleaseWait").show ();
        
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
	    .done (function(updates)
	    {
            if (updates === undefined)
            {
                this.retrieve ();
            }
            else
            {
                this.applyUpdates (updates);
                this.endOfTrailMarker.setPosition(this.anchors[this.anchors.length - 1]);
            }
	    })
        .always (function ()
        {
            
            $("#pleaseWait").hide ();
        });
	}
	
    addStartWaypoint (position)
    {
        $("#pleaseWait").show ();
        
        $.ajax({
            url: userHikeId + "/route/startPoint",
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
        })
        .always (function ()
        {
            
            $("#pleaseWait").hide ();
        });
    }
    
    addEndWaypoint (position)
    {
        $("#pleaseWait").show ();
        
        $.ajax({
            url: userHikeId + "/route/endPoint",
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
        })
        .always (function ()
        {
            
            $("#pleaseWait").hide ();
        });
    }
    
    addWaypoint (position)
    {
        $("#pleaseWait").show ();
        
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
        })
        .always (function ()
        {
            
            $("#pleaseWait").hide ();
        });
    }
	
    updateWaypoint (marker)
    {
        $("#pleaseWait").show ();
        
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
        })
        .always (function ()
        {
            
            $("#pleaseWait").hide ();
        });
    }

    removeWaypoint (marker)
    {
        $("#pleaseWait").show ();
        
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
        })
        .always (function ()
        {
            $("#pleaseWait").hide ();
        });
    }

    applyUpdates (updates)
    {
        let retrieveRoute = false;
        
        for (let update of updates)
        {
            if (update.length === 1)
            {
                let firstPointToReplace = 0;
                let startDistance = 0;
                let numberOfPointsToReplace = 1;
                
                var route = [];
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

                if (this.actualRoute === undefined)
                {
                    this.actualRoute = [];
                }
                
                if (this.actualPolyline === undefined)
                {
                    this.newPolyline ();
                }
                
                // Update the polyline
                var path = this.actualRoutePolyline.getPath ();

                for (let p  = 0; p < Math.min(route.length, numberOfPointsToReplace); p++)
                {
                    path.setAt(p + firstPointToReplace, new google.maps.LatLng(route[p]));
                    this.actualRoute[p + firstPointToReplace] = route[p];
                    this.actualRoute[p + firstPointToReplace].dist += startDistance;
                }
                
                this.anchors.splice(0, 1, ...update);
            }
            else if (update[0].id === -1)
            {
                if (update[1].id === -1)
                {
                    // All anchors, waypoints and trail are removed
                    this.anchors = [];
                    this.waypoints = [];

                    if (this.actualRoute)
                    {
                        this.actualRoute = undefined;
                    }

                    this.newPolyline ();
                }
                else
                {
                    let lastIndex = this.anchors.findIndex(function(entry) { return entry.id == update[1].id; });
                    
                    var lastPointToReplace = this.anchors[lastIndex].actualRouteIndex;
    
                    update[1].actualRouteIndex = 0;
                    update[1].dist = 0;
                    this.updateOrAddWaypoint(update[1]);
    
                    update[1].trail = this.anchors[lastIndex].trail;
    
                    // Update the polyline
                    var path = this.actualRoutePolyline.getPath ();
    
                    // The anchor is the first anchor. Make sure there is no trail
                    // before it.
                    for (let p = 0; p < lastPointToReplace; p++)
                    {
                        // Since we are removing elements there is no need to 
                        // walk the array, just keeping removing the same index
                        path.removeAt (0);
                        this.actualRoute.splice(0, 1);
                    }
                    
                    this.actualRoute[0].dist = 0;
                    
                    // Update all of the actualRouteIndex and distance data members in the anchors beyond
                    // the point of update.
                    let indexDelta = this.anchors[lastIndex].actualRouteIndex;
                    let distDelta = this.anchors[lastIndex].dist;
                    for (let i = lastIndex; i < this.anchors.length; i++)
                    {
                        this.anchors[i].actualRouteIndex -= indexDelta;
                        this.anchors[i].dist -= distDelta;
                    }
    
                    this.anchors.splice(0, lastIndex + 1, update[1]);
                }
            }
            else if (update[1].id === -1)
            {
                let firstIndex = this.anchors.findIndex(function(entry) { return entry.id == update[0].id; });
                let lastIndex = this.anchors.length - 1;
                
                var firstPointToReplace = this.anchors[firstIndex].actualRouteIndex;

                update[0].actualRouteIndex = firstPointToReplace;
                update[0].dist = this.anchors[firstIndex].dist;
                this.updateOrAddWaypoint(update[0]);

                // Update the polyline
                var path = this.actualRoutePolyline.getPath ();

                // The anchor is the last anchor. Make sure there is no trail
                // after it.
                for (let p = firstPointToReplace + 1; p < this.actualRoute.length;)
                {
                    // Since we are removing elements there is no need to 
                    // walk the array, just keeping removing the same index
                    path.removeAt (firstPointToReplace + 1);
                    this.actualRoute.splice(firstPointToReplace + 1, 1);
                }
                
                this.anchors.splice(firstIndex, lastIndex - firstIndex + 1, update[0]);
            }
            else
            {
                // Find the anchor in the array of anchors that 
                // corresponds to the first anchor in this update
                let firstIndex = this.anchors.findIndex(function(entry) { return entry.id == update[0].id; });
    
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
                            this.actualRoute[p + firstPointToReplace] = route[p];
                            this.actualRoute[p + firstPointToReplace].dist += startDistance;
                        }
                        
                        if (numberOfPointsToReplace > route.length)
                        {
                            for (let p = route.length; p < numberOfPointsToReplace; p++)
                            {
                                // Since we are removing elements there is no need to 
                                // walk the array, just keeping removing the same index
                                path.removeAt (route.length + firstPointToReplace);
                                this.actualRoute.splice(route.length + firstPointToReplace, 1);
                            }
                        }
                        else if (route.length > numberOfPointsToReplace)
                        {
                            for (let p = numberOfPointsToReplace; p < route.length; p++)
                            {
                                path.insertAt (p + firstPointToReplace, new google.maps.LatLng(route[p]));
                                this.actualRoute.splice(p + firstPointToReplace, 0, route[p]);
                                this.actualRoute[p + firstPointToReplace].dist += startDistance;
                            }
                        }
                        
                        // Update all of the actualRouteIndex and distance data members in the anchors beyond
                        // the point of update.
                        var indexDelta = route.length - numberOfPointsToReplace;
                        var distDelta = update[update.length - 1].dist - this.anchors[lastIndex].dist;
                        for (let i = lastIndex; i < this.anchors.length; i++)
                        {
                            this.anchors[i].actualRouteIndex += indexDelta;
                            this.anchors[i].dist += distDelta;
                        }
                        
                        // Update all of the actual route point distances beyond this update.
                        for (let p = this.anchors[lastIndex].actualRouteIndex + 1; p < this.actualRoute.length; p++)
                        {
                            this.actualRoute[p].dist += distDelta;
                        }
                        
                        this.anchors.splice(firstIndex, lastIndex - firstIndex + 1, ...update);
                    }
                    else
                    {
                        // Only the first anchor was found. Insert the anchors to the end of the array of anchors
                        // with this update.
                        
                        var route = [];
                        var firstPointToReplace = this.anchors[firstIndex].actualRouteIndex;
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
                        
                        // Update the polyline
                        if (this.actualRoutePolyline === undefined)
                        {
                            this.newPolyline ();
                        }
                        
                        var path = this.actualRoutePolyline.getPath ();
    
                        for (let p = 1; p < route.length; p++)
                        {
                            path.insertAt (p + firstPointToReplace, new google.maps.LatLng(route[p]));
                            this.actualRoute.splice(p + firstPointToReplace, 0, route[p]);
                            this.actualRoute[p + firstPointToReplace].dist += startDistance;
                        }
                        
                        this.anchors.splice(firstIndex, 1, ...update);
                    }
                }
                else
                {
                    // Find the anchor in the array that corresponds to the 
                    // last anchor in this update (it should be zero).
                    var lastIndex = this.anchors.findIndex(function(entry) { return entry.id == update[update.length - 1].id; });

                    if (lastIndex == 0)
                    {
                        // The last anchor was found. Insert the anchors to the beginning of the array of anchors
                        // with this update.
                        
                        var route = [];
                        
                        for (let anchor of update)
                        {
                            this.addPointsToArray (anchor, route);
    
                            if (this.anchorIsWaypoint (anchor))
                            {
                                this.updateOrPrependWaypoint (anchor)
                            }
                        }
    
                        // The last anchor in the update needs to adopt the trail from the anchor that will be replaced.
                        update[update.length - 1].trail = this.anchors[lastIndex].trail;
                        
                        // Update (or add) the polyline
                        if (this.actualRoutePolyline === undefined)
                        {
                            this.newPolyline ();
                        }
                        
                        var path = this.actualRoutePolyline.getPath ();

                        for (let p = 0; p < route.length - 1; p++)
                        {
                            path.insertAt (p, new google.maps.LatLng(route[p]));
                            this.actualRoute.splice(p, 0, route[p]);
                        }
                        
                        // Update all of the actualRouteIndex and distance data members in the anchors beyond
                        // the point of update.
                        var indexDelta = route.length - 1;
                        var distDelta = update[update.length - 1].dist;
                        for (let i = 0; i < this.anchors.length; i++)
                        {
                            this.anchors[i].actualRouteIndex += indexDelta;
                            this.anchors[i].dist += distDelta;
                        }
                        
                        // Update all of the actual route point distances beyond this update.
                        for (let p = this.anchors[0].actualRouteIndex; p < this.actualRoute.length; p++)
                        {
                            this.actualRoute[p].dist += distDelta;
                        }
                        
                        this.anchors.splice(0, 1, ...update);
                    }
                    else
                    {
                        retrieveRoute = true;
                        break;
                    }
                }
            }
        }
        
        if (retrieveRoute)
        {
            this.retrieve ();
        }
        else
        {
            // Renumber waypoints
            let waypointNumber = 1;
            for (let w of this.waypoints)
            {
                w.setLabel(waypointNumber.toString ());
                waypointNumber++;
            }
            
            document.dispatchEvent(new Event('routeUpdated'));
        }
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

    setWaypointOrder (order)
    {
        $("#pleaseWait").show ();

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
            })
        .always (function ()
            {
                $("#pleaseWait").hide ();
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
        if (this.actualRoute === undefined)
        {
            return 0;
        }

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
            this.anchors = responseText;

            if (this.anchors.length > 0)
            {
                this.load ();
                
                if (this.map)
                {
                    this.draw ();

                    if (this.initialLoad)
                    {
                        this.map.fitBounds(this.bounds);
                        let z = this.map.getZoom ();
                        if (z > 13)
                        {
                            this.map.setZoom(13);
                        }
                    }
                }
                
                if (this.anchors.length > 1)
                {
                    retrieveTrailConditions ();
                }
            }
            
            document.dispatchEvent(new Event('routeUpdated'));
            
            this.initialLoad = false;
        });
    }

    anchorIsWaypoint (anchor)
	{
	    return anchor.type !== undefined && (anchor.type == "waypoint" || anchor.type == "start" || anchor.type == "end");
	}
	
    getWaypointIndex (anchor)
    {
        // Check to see if this waypoint already exists in our array of waypoints.
        return this.waypoints.findIndex( (w) => { return w.id == anchor.id; });
    }
    
	getWaypoint (anchor)
	{
        // Check to see if this waypoint already exists in our array of waypoints.
        let waypointIndex = this.getWaypointIndex (anchor);

        if (waypointIndex > -1)
        {
            return this.waypoints[waypointIndex];
        }
	}

	newWaypoint (anchor)
	{
        // The waypoint doesn't already exist. Add it to the array of waypoints.
        let waypoint = new TrailMarker (this.map, wayPointUrl);
        
        waypoint.id = anchor.id;
        waypoint.setDraggable (true, (marker) => { this.updateWaypoint (marker); });
        waypoint.setContextMenu(this.wayPointCM);
        
        this.updateWaypointInfo (waypoint, anchor);

        return waypoint;
	}
	
	updateWaypointInfo (waypoint, anchor)
	{
        waypoint.timeConstraints = anchor.time_constraints;
        waypoint.name = anchor.name;
        waypoint.setPosition(anchor);
	}
	
	updateOrAddWaypoint (anchor)
	{
        var waypoint = this.getWaypoint (anchor);
        
        if (waypoint === undefined)
        {
            waypoint = this.newWaypoint (anchor);

            this.waypoints.push(waypoint);
            
            return waypoint;
        }

        this.updateWaypointInfo (waypoint, anchor);
        
        return waypoint;
	}
	
    updateOrPrependWaypoint (anchor)
    {
        var waypoint = this.getWaypoint (anchor);
        
        if (waypoint === undefined)
        {
            waypoint = this.newWaypoint (anchor);

            this.waypoints.splice(0, 0, waypoint);
            
            return waypoint;
        }

        this.updateWaypointInfo (waypoint, anchor);
        
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
		
		let waypointIndex = 0;
		
		if (this.anchors.length > 0)
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
				    let oldWaypointIndex = this.getWaypointIndex(this.anchors[r]);
				    
				    if (oldWaypointIndex == -1)
				    {
				        // Waypoint does not exist in the array of waypoitns.
				        // Create one and insert it.
				        let waypoint = this.newWaypoint(this.anchors[r]);
				        
				        this.waypoints.splice(waypointIndex, 0, waypoint);
				    }
				    else
				    {
				        // Waypoint already exists.
				        
				        if (oldWaypointIndex !== waypointIndex)
				        {
				            // Waypoint needs to move position in the array.
				            
				            let waypoint = this.waypoints.splice(oldWaypointIndex, 1)[0];
				            
				            this.waypoints.splice(waypointIndex, 0, waypoint);
				        }

				        this.updateWaypointInfo(this.waypoints[waypointIndex], this.anchors[r]);

				        this.waypoints[waypointIndex].remove = false;
				    }
					
                    waypointIndex++;
				}
				
				this.addPointsToArray (this.anchors[r], this.actualRoute);
			}
		}
		
		let waypointNumber = 1;
		for (let w of this.waypoints)
		{
		    if (w.remove)
		    {
	            w.removeMarker();
		    }
		    else
		    {
		       w.setLabel(waypointNumber.toString ());
		       waypointNumber++;
		    }
		}
	}
	
	newPolyline ()
	{
        if (this.actualRoutePolyline != undefined)
        {
            this.actualRoutePolyline.setMap(null);
            
            removeContextMenu(this.actualRoutePolyline);
        }

        this.actualRoutePolyline = new google.maps.Polyline({
            editable: false,
            geodesic: true,
            strokeColor: '#0000FF',
            strokeOpacity: 1.0,
            strokeWeight: routeStrokeWeight,
            zIndex: 20});

        this.actualRoutePolyline.setMap(this.map);
        
        setContextMenu (this.actualRoutePolyline, routeContextMenu);
	}
	
	draw ()
	{
		if (this.actualRoute.length > 0)
		{
		    this.newPolyline ();
			
			this.actualRoutePolyline.setPath(this.actualRoute);
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
	    if (this.actualRoute !== undefined && this.actualRoute.length > 0)
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
