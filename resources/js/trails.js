<script>
"use strict"

function rectContainsRect (outer, inner)
{
	return outer.contains (inner.getNorthEast ()) && outer.contains (inner.getSouthWest ());
}


class Trails
{
	constructor (map)
	{
		this.map = map
		this.trails = [];
		this.trailCoords = {};
		this.mapDragging = false;
		
		var trails = this;
		
		this.map.addListener ("dragstart", function () { trails.mapDragging = true;})
		this.map.addListener ("dragend", function () { trails.mapDragging = false; trails.update (); });
		this.map.addListener ("bounds_changed", function () { if (!trails.mapDragging) { trails.update (); }})
	}

	retrieve ()
	{
		var trails = this;
		
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				trails.processResponse (this.responseText);
			}
		}
		
		if (this.map.getZoom () >= 11)
		{
			var bounds = this.map.getBounds ();
			
			if (this.currentTrailBounds == undefined || !rectContainsRect (this.currentTrailBounds, bounds))
//			 && (requestedTrailBounds == undefined || !rectContainsRect(requestedTrailBounds, bounds))
			{
				var requestedTrailBounds = bounds;
				
				xmlhttp.open("GET", "trails?b=" + requestedTrailBounds.toUrlValue (), true);
				//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xmlhttp.send();
			}
		}
	}

	processResponse (responseText)
	{
		this.release ();
		
		this.trailCoords = JSON.parse(responseText);
		
		this.currentTrailBounds = new google.maps.LatLngBounds(
				{lat: this.trailCoords.bounds[0], lng: this.trailCoords.bounds[1]},
				{lat: this.trailCoords.bounds[2], lng: this.trailCoords.bounds[3]});
		
		this.draw ();
		
//		for (let i in trailCoords.intersections)
//		{
//			new google.maps.Marker({
//				position: trailCoords.intersections[i],
//				map: map,
//				icon: {
//					url: junctionUrl
//				},
//			});
//		}
	}

	release ()
	{
		for (let t in this.trails)
		{
			removeContextMenu(this.trails[t]);
			this.trails[t].setMap(null);
		}
		
		this.trails = [];
		this.trailCoords = {};
		this.currentTrailBounds = undefined;
	}
	
	draw ()
	{
		if (this.map && this.trailCoords.trails.length > 0)
		{
			this.currentTrailWeight = this.getTrailWeight ();
			
			for (let t in this.trailCoords.trails)
			{
				for (let r in this.trailCoords.trails[t].routes)
				{
					var color;
					
					if (this.trailCoords.trails[t].type == "trail")
					{
						color = '#704513'
					}
					else if (this.trailCoords.trails[t].type == "road")
					{
						color = "#404040";
					}
					else
					{
						color = "#FF0000";
					}
					
					let trail = new google.maps.Polyline({
						path: this.trailCoords.trails[t].routes[r].route,
						editable: false,
						geodesic: true,
						strokeColor: color,
						strokeOpacity: 1.0,
						strokeWeight: this.currentTrailWeight,
						zIndex: 15});
			
					trail.setMap(this.map);
					
					trail.trailCoordsIndex = parseInt(t);
					
					setContextMenu (trail, trailContextMenu);
					
					this.trails.push(trail);
				}
			}
		}
	}

	getTrailWeight ()
	{
		var zoom = this.map.getZoom ();
		
		if (zoom >= 17)
		{
			return 8;
		}
		else if (zoom >= 16)
		{
			return 6;
		}
		else
		{
			return 4;
		}
	}

	update ()
	{
		var zoom = this.map.getZoom ();
		
		if (zoom < 11)
		{
			// We are zoomed too far out. Release the trails.
			this.release ();
		}
		else
		{
			this.retrieve ();
		}

		if (this.trails.length > 0)
		{
			// If the trail line weights have changed due to zooming then
			// iterate through the trails and apply the new weight.
			var weight = this.getTrailWeight ();
			
			if (weight != this.currentTrailWeight)
			{
				this.currentTrailWeight = weight;
				
				var options = {strokeWeight: this.currentTrailWeight};
		
				for (let t in this.trails)
				{
					this.trails[t].setOptions (options);
				}
			}
		}
	}

}

</script>