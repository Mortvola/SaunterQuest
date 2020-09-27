const zoomDisplayThreshold = 10;
const maxDetailedTiles = 16;

const nodeUrl = 'https://maps.google.com/mapfiles/ms/micons/yellow-dot.png';

class Trails {
    constructor(map) {
        this.map = map;
        this.tiles = [];
        this.mapDragging = false;

        this.zoom = this.map.getZoom();

        const trails = this;

        //		this.map.addListener ("dragstart", function () { trails.mapDragging = true;})
        //		this.map.addListener ("dragend", function () { trails.mapDragging = false; trails.update (); });
        //		this.map.addListener ("bounds_changed", function () { if (!trails.mapDragging) { trails.update (); }})
    }

    retrieveTileList() {
        const trails = this;

        const xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                const tileList = JSON.parse(this.responseText);
                trails.processTileListResponse(tileList);
            }
        };

        const bounds = this.map.getBounds();

        xmlhttp.open('GET', `tileList?b=${ bounds.toUrlValue()}`, true);
        xmlhttp.send();
    }

    retrieveTile(tileName) {
        const trails = this;

        const xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                const tile = JSON.parse(this.responseText);
                trails.processTileResponse(tile);
            }
        };

        xmlhttp.open('GET', `tile?n=${ tileName}`, true);
        xmlhttp.send();
    }

    processTileListResponse(tileList) {
        // Iterate through the existing list and determine
        // if each tile is in the new tile list. If it is
        // found the remove the entry from the new list.
        // If it is not found then mark the tile as not
        // used. This allows the data to stay around
        // and avoid re-retrieving from the server
        // in case we go back to the tile before it
        // is discarded.
        for (let i = 0; i < this.tiles.length;) {
            let found = false;

            for (let t = 0; t < tileList.tiles.length; t++) {
                if (tileList.tiles[t].name == this.tiles[i].name) {
                    found = true;
                    tileList.tiles.splice(t, 1);

                    if (!this.tiles[i].used) {
                        this.showTile(this.tiles[i]);
                    }

                    break;
                }
            }

            this.tiles[i].used = found;

            i++;
        }

        // Add the remaining from the new list to the
        // old list of tiles and show each one. If there
        // is no data to show then it will be retrieved
        // from the server.
        for (let t = 0; t < tileList.tiles.length; t++) {
            this.tiles.push({
                name: tileList.tiles[t].name,
                bounds: new google.maps.LatLngBounds(
                    { lat: tileList.tiles[t].bounds[0], lng: tileList.tiles[t].bounds[1] },
                    { lat: tileList.tiles[t].bounds[2], lng: tileList.tiles[t].bounds[3] },
                ),
                used: true,
            });

            this.showTile(this.tiles[this.tiles.length - 1]);
        }
    }

    processTileResponse(tile) {
        // See if we already have this tile in the tile list.
        // If we do, then show the tile, otherwise, disregard it.
        for (let i = 0; i < this.tiles.length; i++) {
            if (tile.name == this.tiles[i].name) {
                if (this.tiles[i].trails == undefined) {
                    this.tiles[i].trails = tile.trails;
                }

                if (this.tiles[i].graph == undefined) {
                    this.tiles[i].graph = tile.graph;
                }

                this.showTile(this.tiles[i]);

                break;
            }
        }

        // If we are displaying detailed trail information then
        // ensure there are no more than maxDetailedTiles in the
        // list. If there are more, then release the ones that
        // are not currently used.
        if (this.displayableZoomLevel(this.zoom)
		 && this.tiles.length > maxDetailedTiles) {
            for (let i = 0; i < this.tiles.length;) {
                if (!this.tiles[i].used) {
                    this.releaseTile(this.tiles[i]);
                    this.tiles.splice(i, 1);
                }
                else {
                    i++;
                }
            }
        }
    }

    releaseTile(tile) {
        if (tile.polyLines != undefined) {
            for (const p in tile.polyLines) {
                removeContextMenu(tile.polyLines[p]);
                tile.polyLines[p].setMap(null);
            }
        }

        if (tile.markers != undefined) {
            for (const m of tile.markers) {
                m.setMap(null);
            }
        }

        if (tile.polyBounds) {
            tile.polyBounds.setMap(null);
        }
    }

    hide() {
        for (const t in this.tiles) {
            this.hideTile(this.tiles[t]);
        }
    }

    show() {
        for (const t in this.tiles) {
            this.showTile(this.tiles[t]);
        }
    }

    hideTile(tile) {
        if (tile.polyLines) {
            for (const p in tile.polyLines) {
                tile.polyLines[p].setVisible(false);
            }
        }

        if (tile.markers != undefined) {
            for (const m of tile.markers) {
                m.setVisible(false);
            }
        }

        if (tile.polyBounds) {
            tile.polyBounds.setVisible(false);
        }
    }

    showTile(tile) {
        // Show the tile if it at least overlaps the viewable area
        const bounds = this.map.getBounds();

        if (bounds.intersects(tile.bounds)) {
            if (this.displayableZoomLevel(this.zoom)) {
                if (tile.polyLines != undefined && tile.polyLines.length > 0) {
                    for (const p in tile.polyLines) {
                        tile.polyLines[p].setVisible(true);
                    }

                    if (tile.markers != undefined) {
                        for (const m of tile.markers) {
                            m.setVisible(true);
                        }
                    }
                }
                else if (tile.trails) {
                    //					this.generatePolyLines (tile);
                    //					this.generateNodes (tile);
                }
                else {
                    this.retrieveTile(tile.name);
                }

                if (tile.polyBounds) {
                    tile.polyBounds.setVisible(false);
                }
            }
            else {
                if (tile.polyLines) {
                    for (const p in tile.polyLines) {
                        removeContextMenu(tile.polyLines[p]);
                        tile.polyLines[p].setVisible(false);
                    }
                }

                if (tile.markers != undefined) {
                    for (const m of tile.markers) {
                        m.setVisible(false);
                    }
                }

                if (tile.polyBounds != undefined) {
                    tile.polyBounds.setVisible(true);
                }
                else {
                    tile.polyBounds = new google.maps.Rectangle({
                        bounds: tile.bounds,
                        fillColor: '#000000',
                        fillOpacity: 0.10,
                        strokeOpacity: 0.0,
                        map: this.map,
                    });
                }
            }
        }
    }

    generatePolyLines(tile) {
        for (const t in tile.trails) {
            var color;

            if (tile.trails[t].type == 'trail') {
                color = '#704513';
            }
            else if (tile.trails[t].type == 'road') {
                color = '#404040';
            }
            else {
                color = '#FF0000';
            }

            for (const r in tile.trails[t].paths) {
                const polyLine = new google.maps.Polyline({
                    path: tile.trails[t].paths[r].points,
                    editable: false,
                    geodesic: true,
                    strokeColor: color,
                    strokeOpacity: 1.0,
                    strokeWeight: this.currentTrailWeight,
                    zIndex: 15,
                });

                polyLine.setMap(this.map);

                polyLine.set('trail', { tile, trail: t, path: r });

                setContextMenu(polyLine, trailContextMenu);

                if (tile.polyLines == undefined) {
                    tile.polyLines = [];
                }

                tile.polyLines.push(polyLine);
            }
        }
    }

    generateNodes(tile) {
        if (tile.graph !== undefined) {
            for (const node of tile.graph.nodes) {
                const marker = new google.maps.Marker({
                    position: node,
                    map: this.map,
                    icon: {
                        url: nodeUrl,
                    },
                });

                if (tile.markers == undefined) {
                    tile.markers = [];
                }

                tile.markers.push(marker);
            }
        }
    }

    getTrailWeight() {
        let zoom = this.map.getView().getZoom();

        if (zoom >= 17) {
            return 8;
        }
        if (zoom >= 16) {
            return 6;
        }

        return 4;
    }

    displayableZoomLevel(zoom) {
        return zoom >= zoomDisplayThreshold;
    }

    update() {
        const zoom = this.map.getView().getZoom();
        const zoomDetailChanged = this.displayableZoomLevel(zoom) != this.displayableZoomLevel(this.zoom);

        this.zoom = zoom;

        if (zoomDetailChanged) {
            this.show();
        }
        /*
		this.retrieveTileList ();

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
		*/
    }
}

export default Trails;
