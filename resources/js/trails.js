<script>
"use strict"

const zoomDisplayThreshold = 11;

function rectContainsRect (outer, inner)
{
	return outer.contains (inner.getNorthEast ()) && outer.contains (inner.getSouthWest ());
}


class Trails
{
	constructor (map)
	{
		this.map = map;
		this.tiles = [];
		this.mapDragging = false;
		this.zoom =  this.map.getZoom ();

		var trails = this;
		
		this.map.addListener ("dragstart", function () { trails.mapDragging = true;})
		this.map.addListener ("dragend", function () { trails.mapDragging = false; trails.update (); });
		this.map.addListener ("bounds_changed", function () { if (!trails.mapDragging) { trails.update (); }})
	}

	retrieveTileList (bounds)
	{
		var trails = this;
		
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				let tileList = JSON.parse(this.responseText);
				trails.processTileList (tileList);
			}
		}
		
		xmlhttp.open("GET", "tileList?b=" + bounds.toUrlValue(), true);
		xmlhttp.send();
	}
	
	retrieveTile (tileName)
	{
		var trails = this;
		
		var xmlhttp = new XMLHttpRequest ();
		xmlhttp.onreadystatechange = function ()
		{
			if (this.readyState == 4 && this.status == 200)
			{
				let tile = JSON.parse(this.responseText);
				trails.processTile (tile);
			}
		}
		
		xmlhttp.open("GET", "tile?n=" + tileName, true);
		xmlhttp.send();
	}

	processTileList (tileList)
	{
		for (let i = 0; i < this.tiles.length; i++)
		{
			this.tiles[i].found = false;
		}
		
		for (let i = 0; i < this.tiles.length; i++)
		{
			for (let t = 0; t < tileList.tiles.length; t++)
			{
				if (tileList.tiles[t] == this.tiles[i].name)
				{
					this.tiles[i].found = true;
					tileList.tiles.splice(t, 1);
					break;
				}
			}
		}
		
		// Now go through our current list of tiles and remove
		// any that were not found in the response.
		for (let i = 0; i < this.tiles.length;)
		{
			if (!this.tiles[i].found)
			{
				this.releaseTile (this.tiles[i]);
				
				this.tiles.splice(i, 1);
			}
			else
			{
				i++;
			}
		}

		// Add the remaining list to the tiles and 
		// send a request for each one.
		for (let t = 0; t < tileList.tiles.length; t++)
		{
			this.tiles.push({name: tileList.tiles[t]});
			
			this.retrieveTile (tileList.tiles[t]);
		}

		this.currentTileBounds = new google.maps.LatLngBounds(
			{lat: tileList.bounds[0], lng: tileList.bounds[1]},
			{lat: tileList.bounds[2], lng: tileList.bounds[3]});
	}
	
	processTile (tile)
	{
		// See if we already have this tile in the tile list.
		// If we do, then show the tile, otherwise, disregard it.
		for (let i = 0; i < this.tiles.length; i++)
		{
			if (tile.name == this.tiles[i].name)
			{
				if (this.tiles[i].trails == undefined)
				{
					this.tiles[i].trails = tile.trails;
				}

				this.showTile (this.tiles[i]);
				
				break;
			}
		}
	}
	
	releaseTile (tile)
	{
		for (let p in tile.polyLines)
		{
			removeContextMenu(tile.polyLines[p]);
			tile.polyLines[p].setMap(null);
		}
	}
	
	hide ()
	{
		for (let t in this.tiles)
		{
			for (let p in this.tiles[t].polyLines)
			{
				this.tiles[t].polyLines[p].setMap(null);
			}
		}
	}
	
	show ()
	{
		for (let t in this.tiles)
		{
			this.showTile (this.tiles[t]);
		}
	}

	showTile (tile)
	{
		if (tile.polyLines != undefined && tile.polyLines.length > 0)
		{
			for (let p in tile.polyLines)
			{
				tile.polyLines[p].setMap(this.map);
			}
		}
		else
		{
			this.drawTile (tile);
		}
	}
	
	drawTile (tile)
	{
		if (this.displayableZoomLevel(this.zoom))
		{
			for (let t in tile.trails)
			{
				var color;
				
				if (tile.trails[t].type == "trail")
				{
					color = '#704513'
				}
				else if (tile.trails[t].type == "road")
				{
					color = "#404040";
				}
				else
				{
					color = "#FF0000";
				}
	
				for (let r in tile.trails[t].routes)
				{
					let polyLine = new google.maps.Polyline({
						path: tile.trails[t].routes[r].route,
						editable: false,
						geodesic: true,
						strokeColor: color,
						strokeOpacity: 1.0,
						strokeWeight: this.currentTrailWeight,
						zIndex: 15});
			
					polyLine.setMap(this.map);
					
					setContextMenu (polyLine, trailContextMenu);
					
					if (tile.polyLines == undefined)
					{
						tile.polyLines = [];
					}
					
					tile.polyLines.push(polyLine);
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

	displayableZoomLevel (zoom)
	{
		return zoom >= zoomDisplayThreshold;
	}
	
	update ()
	{
		var zoom = this.map.getZoom ();
		
		if (!this.displayableZoomLevel(zoom))
		{
			if (this.displayableZoomLevel(this.zoom))
			{
				// We are zoomed too far out. Hide the trails.
				this.hide ();
			}
		}
		else
		{
			if (!this.displayableZoomLevel(this.zoom))
			{
				this.show ();
			}
			
			var bounds = this.map.getBounds ();

			if (this.currentTileBounds == undefined || !rectContainsRect (this.currentTileBounds, bounds))
			{
				this.retrieveTileList (bounds);
			}
		}
		
		this.zoom = zoom;

		if (this.tiles.length > 0)
		{
			// If the trail line weights have changed due to zooming then
			// iterate through the trails and apply the new weight.
			var weight = this.getTrailWeight ();
			
			if (weight != this.currentTrailWeight)
			{
				this.currentTrailWeight = weight;
				
				var options = {strokeWeight: this.currentTrailWeight};
		
				for (let t in this.tiles)
				{
					for (let p in this.tiles[t].polyLines)
					{
						this.tiles[t].polyLines[p].setOptions (options);
					}
				}
			}
		}
	}

}

</script>