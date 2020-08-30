import L from 'leaflet';
import Trails from './trails';
import { retrieveResupplyLocations } from './resupplyPlan';
import { retrieveHikerProfiles } from './hikerProfile';
import { getAndLoadElevationData } from './elevationChart';
import { getRoute } from './tempstore';
import { showAddPointOfInterest, retrievePointsOfInterest } from './pointOfInterest';
import store from '../redux/store';
import { addWaypoint, addStartWaypoint, addEndWaypoint } from '../redux/actions';

let trails;

let controlDown = false;

let trailContextMenu;

let editedRoute = [];
let routeContextMenu;
let vertexContextMenu;
// var map;
let startPosition;
let startSegment;
let endPosition;
let endSegment;

class Hike {
}

const hike = new Hike();
hike.id = sessionStorage.getItem('hikeId');

let editPolyLine = {};

const junctionUrl = 'https://maps.google.com/mapfiles/ms/micons/lightblue.png';

function attachInfoWindowMessage(poi, message) {
    poi.message = message;

    return poi.marker.addListener('click', () => {
        if (!controlDown) {
            map.infoWindow.setContent(poi.message);
            map.infoWindow.open(map, poi.marker);
        }
    });
}

function addNote(object, position) {
}

// function editSelection ()
// {
//	if (startPosition != undefined && endPosition != undefined)
//	{
//		updateEditedRoute (startPosition, startSegment, endPosition, endSegment);
//
//		endRouteHighlighting ();
//
//		$("#editRoute").show (250);
//		$("#measureRoute").hide (250);
//	}
// }

function adjustAnchorRouteIndexes(anchorIndex, adjustment) {
    for (let i = anchorIndex; i < anchors.length; i++) {
        anchors[i].actualRouteIndex += adjustment;
    }
}

function removePointsFromRoute(anchor, anchorIndex) {
    if (anchor.trail != undefined) {
        // Delete the points from the actual route
        actualRoute.splice(anchor.actualRouteIndex + 1, anchor.trail.length);

        // Delete the points from the polyline
        const path = actualRoutePolyline.getPath();

        for (let i = anchor.actualRouteIndex + 1; i < anchor.actualRouteIndex + 1 + anchor.trail.length; i++) {
            path.removeAt(anchor.actualRouteIndex + 1);
        }

        // update the anchor indexes into the actual trail now that we deleted some portion of the trail.
        adjustAnchorRouteIndexes(anchorIndex + 1, -anchor.trail.length);

        anchor.trail = undefined;
    }
}

function addPointsToRoute(anchor, anchorIndex, trail) {
    // Add the points from the actual route
    actualRoute.splice(anchor.actualRouteIndex + 1, 0, ...trail);
    anchor.trail = trail;

    // Insert points into the polyline
    const path = actualRoutePolyline.getPath();

    for (let i = 0; i < trail.length; i++) {
        path.insertAt(anchor.actualRouteIndex + 1 + i,
            new google.maps.LatLng(trail[i]));
    }

    // update the anchor indexes into the actual trail now that we added some portion to the trail.
    adjustAnchorRouteIndexes(anchorIndex + 1, trail.length);
}

function moveAnchor(index, vertex) {
    const routeUpdate = {
        userHikeId: hike.id, mode: 'update', index: startSegment + index, point: { lat: vertex.lat(), lng: vertex.lng() },
    };

    $.ajax({
        url: `${hike.id}route.php`,
        headers:
        {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            'Content-type': 'application/json',
        },
        type: 'PUT',
        data: JSON.stringify(routeUpdate),
        dataType: 'json',
    })
        .done((responseText) => {
            const updatedVertex = responseText;

            const anchorIndex = startSegment + index;
            const anchor = anchors[anchorIndex];
            let prevAnchor;

            const updatedLatLng = new google.maps.LatLng({ lat: updatedVertex.point.lat, lng: updatedVertex.point.lng });

            if (anchorIndex > 0) {
                prevAnchor = anchors[anchorIndex - 1];
            }

            actualRoute[anchor.actualRouteIndex].lat = updatedVertex.point.lat;
            actualRoute[anchor.actualRouteIndex].lng = updatedVertex.point.lng;
            actualRoute[anchor.actualRouteIndex].ele = updatedVertex.point.ele;
            actualRoute[anchor.actualRouteIndex].dist = updatedVertex.point.dist;

            anchor.lat = updatedVertex.point.lat;
            anchor.lng = updatedVertex.point.lng;
            anchor.ele = updatedVertex.point.ele;
            anchor.dist = updatedVertex.point.dist;

            editedRoute[index].lat = updatedVertex.point.lat;
            editedRoute[index].lng = updatedVertex.point.lng;

            let path = editPolyLine.getPath();
            updatedLatLng.moved = true;
            path.setAt(index, updatedLatLng);

            // Set the vertex that moved
            path = actualRoutePolyline.getPath();
            path.setAt(anchor.actualRouteIndex, updatedLatLng);

            if (prevAnchor !== undefined) {
                if (prevAnchor.trail !== undefined) {
                    removePointsFromRoute(prevAnchor, anchorIndex - 1);
                }

                if (updatedVertex.previousTrail !== undefined) {
                    addPointsToRoute(prevAnchor, anchorIndex - 1, updatedVertex.previousTrail);
                }
            }

            if (anchor.trail !== undefined) {
                removePointsFromRoute(anchor, anchorIndex);
            }

            if (updatedVertex.nextTrail != undefined) {
                addPointsToRoute(anchor, anchorIndex, updatedVertex.nextTrail);
            }

            if (anchorIndex === 0) {
                startOfTrailMarker.setPosition(updatedVertex.point);
            }
            else if (anchorIndex === anchors.length - 1) {
                endOfTrailMarker.setPosition(updatedVertex.point);
            }
        });
}

function insertAnchor(index, vertex) {
    const routeUpdate = {
        userHikeId: hike.id, mode: 'insert', index: startSegment + index, point: { lat: vertex.lat(), lng: vertex.lng() },
    };

    $.ajax({
        url: `${hike.id}route.php`,
        headers:
        {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            'Content-type': 'application/json',
        },
        type: 'PUT',
        data: JSON.stringify(routeUpdate),
        dataType: 'json',
    })
        .done((responseText) => {
            const updatedVertex = responseText;

            const anchorIndex = startSegment + index;
            const prevAnchor = anchors[anchorIndex - 1];

            removePointsFromRoute(prevAnchor, anchorIndex - 1);

            if (updatedVertex.previousTrail != undefined) {
                addPointsToRoute(prevAnchor, anchorIndex - 1, updatedVertex.previousTrail);
            }

            actualRoute.splice(anchors[anchorIndex].actualRouteIndex, 0, { lat: updatedVertex.point.lat, lng: updatedVertex.point.lng });
            actualRoute[anchors[anchorIndex].actualRouteIndex].ele = updatedVertex.point.ele;
            actualRoute[anchors[anchorIndex].actualRouteIndex].dist = updatedVertex.point.dist;

            anchors.splice(anchorIndex, 0, { lat: updatedVertex.point.lat, lng: updatedVertex.point.lng, actualRouteIndex: anchors[anchorIndex].actualRouteIndex });
            anchors[anchorIndex].ele = updatedVertex.point.ele;
            anchors[anchorIndex].dist = updatedVertex.point.dist;

            editedRoute[index].lat = updatedVertex.point.lat;
            editedRoute[index].lng = updatedVertex.point.lng;

            // Insert the vertex into the actual route polyline.
            path = actualRoutePolyline.getPath();
            path.insertAt(anchors[anchorIndex].actualRouteIndex, new google.maps.LatLng({ lat: updatedVertex.point.lat, lng: updatedVertex.point.lng }));

            var path = editPolyLine.getPath();
            const vertex = new google.maps.LatLng({ lat: editedRoute[index].lat, lng: editedRoute[index].lng });
            vertex.moved = true;
            path.setAt(index, vertex);

            // update the anchor indexes into the actual trail now that we deleted some portion of the trail.
            adjustAnchorRouteIndexes(anchorIndex + 1, 1);

            if (updatedVertex.nextTrail != undefined) {
                addPointsToRoute(anchors[anchorIndex], anchorIndex, updatedVertex.nextTrail);
            }
        });
}

function deletePoints(index, length) {
    const routeUpdate = {
        userHikeId: hike.id, mode: 'delete', index: startSegment + index, length,
    };

    $.ajax({
        url: `${hike.id}route.php`,
        headers:
        {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            'Content-type': 'application/json',
        },
        type: 'PUT',
        data: JSON.stringify(routeUpdate),
        dataType: 'json',
    })
        .done((responseText) => {
            const trail = responseText;

            const anchorIndex = startSegment + index;

            const path = actualRoutePolyline.getPath();

            for (let i = 0; i < length; i++) {
                removePointsFromRoute(anchors[anchorIndex - 1], anchorIndex - 1);
                removePointsFromRoute(anchors[anchorIndex], anchorIndex);

                // Delete the anchor from the actual route and from the actual route polyline
                actualRoute.splice(anchors[anchorIndex].actualRouteIndex, 1);
                // update the anchor indexes into the actual trail now that we deleted some portion of the trail.
                adjustAnchorRouteIndexes(anchorIndex + 1, -1);
                path.removeAt(anchors[anchorIndex].actualRouteIndex);

                anchors.splice(anchorIndex, 1);

                editPolyLine.getPath().removeAt(index);
                editedRoute.splice(index, 1);
            }

            // Add in the points for the specified new trail between the anchors
            if (trail != undefined) {
                addPointsToRoute(anchors[anchorIndex - 1], anchorIndex - 1, trail);
            }
        });
}

// function startRouteEdit (position)
// {
//	setRouteHighlightStartMarker (position, editStartMarkerSet);
//	setRouteHighlightEndMarker (position, editEndMarkerSet);
//
//	startPosition = position;
//	endPosition = position;
//
//	startSegment = findNearestSegment(startPosition);
//	endSegment = Math.min(startSegment + 1, anchors.length - 1);
//
//	$("#editRoute").show (250);
// }

function stopRouteEdit() {
    // endRouteHighlighting ();

    if (editPolyLine != undefined && editPolyLine.setMap != undefined) {
        editPolyLine.setMap(null);
        editPolyLine = null;
    }

    startPosition = undefined;
    endPosition = undefined;

    startSegment = undefined;
    endSegment = undefined;

    $('#editRoute').hide(250);

    //	drawRoute ();
    getAndLoadElevationData(0, actualRoute.length);
}

// function editStartMarkerSet (position, segment)
// {
//	startPosition = new google.maps.LatLng({lat: position.x, lng: position.y});
//	startSegment = segment;
//
//	if (startPosition != undefined && endPosition != undefined)
//	{
//		updateEditedRoute (startPosition, startSegment, endPosition, endSegment);
//	}
// }

// function editEndMarkerSet (position, segment)
// {
//	endPosition = new google.maps.LatLng({lat: position.x, lng: position.y});
//	endSegment = Math.min(segment + 1, anchors.length - 1);
//
//	if (startPosition != undefined && endPosition != undefined)
//	{
//		updateEditedRoute (startPosition, startSegment, endPosition, endSegment);
//	}
// }

function updateEditedRoute(startPosition, startSegment, endPosition, endSegment) {
    //
    // Swap the values if needed.
    //
    if (startSegment > endSegment) {
        endSegment = [startSegment, startSegment = endSegment][0];
        endPosition = [startPosition, startPosition = endPosition][0];
    }

    editedRoute = [];

    let delta = google.maps.geometry.spherical.computeDistanceBetween(
        startPosition,
        new google.maps.LatLng(anchors[startSegment]),
    );

    editedRoute.push({
        lat: startPosition.lat(),
        lng: startPosition.lng(),
        dist: anchors[startSegment].dist + delta,
        ele: (anchors[startSegment + 1].ele - anchors[startSegment].ele) / 2 + anchors[startSegment].ele,
    });

    if (startSegment != endSegment) {
        for (let r = startSegment + 1; r <= endSegment; r++) {
            editedRoute.push(anchors[r]);
        }
    }

    delta = google.maps.geometry.spherical.computeDistanceBetween(
        endPosition,
        new google.maps.LatLng(anchors[endSegment]),
    );

    editedRoute.push({
        lat: endPosition.lat(),
        lng: endPosition.lng(),
        dist: anchors[endSegment].dist + delta,
        ele: (anchors[endSegment + 1].ele - anchors[endSegment].ele) / 2 + anchors[endSegment].ele,
    });

    createEditablePolyline();
}

function actualRouteVertexInserted(index) {
    console.log(`vertex inserted: ${index}`);
}

function printVertex(polyLine, index) {
    const path = polyLine.getPath();
    const vertex = path.getAt(index);

    console.log(`vertex ${index}: (${vertex.lat()}, ${vertex.lng()})`);
}

function actualRouteVertexUpdated(index) {
    console.log(`vertex updated: ${index}`);
    printVertex(actualRoutePolyline, index);
    printVertex(actualRoutePolyline, index - 1);
}

function vertexInserted(index) {
    const path = editPolyLine.getPath();

    const vertex = path.getAt(index);

    editedRoute.splice(index, 0, { lat: vertex.lat(), lng: vertex.lng() });

    insertAnchor(index, vertex);
}

function vertexUpdated(index) {
    const path = editPolyLine.getPath();

    const vertex = path.getAt(index);

    if (vertex.moved != undefined && vertex.moved) {
        vertex.moved = false;
    }
    else {
        moveAnchor(index, vertex);
    }
}

function createEditablePolyline() {
    if (editPolyLine != undefined) {
        if (editPolyLine.setMap != undefined) {
            editPolyLine.setMap(null);
        }

        removeContextMenu(editPolyLine);
    }

    editPolyLine = new google.maps.Polyline({
        path: editedRoute,
        editable: true,
        geodesic: true,
        strokeColor: '#7F7F7F',
        strokeOpacity: 1.0,
        strokeWeight: routeStrokeWeight - 2,
        zIndex: 30,
    });

    google.maps.event.addListener(editPolyLine.getPath(), 'insert_at', vertexInserted);
    google.maps.event.addListener(editPolyLine.getPath(), 'set_at', vertexUpdated);

    editPolyLine.setMap(map);

    setContextMenu(editPolyLine, vertexContextMenu);

//	getAndLoadElevationData (0, editedRoute.length, editedRoute);
}

function deleteVertex(object, vertex) {
    deletePoints(vertex, 1);
}

function clearVertices() {
    if (selectStartSegment > selectEndSegment) {
        selectEndSegment = [selectStartSegment, selectStartSegment = selectEndSegment][0];
    }

    let startAnchor;
    let endAnchor;

    // Find anchors associated with the start and end segments.
    for (const r in anchors) {
        if (startAnchor == undefined && selectStartSegment <= anchors[r].actualRouteIndex) {
            startAnchor = parseInt(r);
        }

        if (endAnchor == undefined && selectEndSegment <= anchors[r].actualRouteIndex) {
            endAnchor = parseInt(r);
        }

        if (startAnchor != undefined && endAnchor != undefined) {
            break;
        }
    }

    deletePoints(startAnchor, endAnchor - startAnchor + 1);

    stopRouteMeasurement();
}

function toggleEdit(object, position) {
    editedRoute = [];

    startSegment = 0;
    endSegment = anchors.length - 1;

    editedRoute.splice(0, 0, ...anchors);

    createEditablePolyline();
}

function sqr(x) {
    return x * x;
}

function distSquared(v, w) {
    return sqr(v.x - w.x) + sqr(v.y - w.y);
}

function nearestPointOnSegment(p, v, w) {
    // Check to see if the line segment is really just a point. If so, return the distance between
    // the point and one of the points of the line segment.
    const l2 = distSquared(v, w);
    if (l2 == 0) {
        return v;
    }

    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    return { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
}

function distToSegmentSquared(p, v, w) {
    const l = nearestPointOnSegment(p, v, w);

    return distSquared(p, l);
}

function distToSegment(p, v, w) {
    return Math.sqrt(distToSegmentSquared(p, v, w));
}

function displayLocationPopup(map, latLng, elevation) {
    const info = $('<div></div>');

    $('<div></div')
        .text(`Lat: ${latLng.lat}`)
        .appendTo(info);

    $('<div></div>')
        .text(` Lng: ${latLng.lng}`)
        .appendTo(info);

    +'</div><div>Elevation: ';

    if (elevation === undefined || elevation === null) {
        $('<div></div>')
            .text('Elevation: not available')
            .appendTo(info);
    }
    else {
        $('<div></div>')
            .text(`Elevation: ${metersToFeet(elevation)}`)
            .appendTo(info);
    }

    map.openPopup(info[0], latLng);
}

function displayLocation(event) {
    $.getJSON({
        url: `/elevation/point?lat=${event.latlng.lat}&lng=${event.latlng.lng}`,
        context: this,
    })
        .done(function (elevation) {
            displayLocationPopup(this, event.latlng, elevation);
        });
}

function gotoLocation(event) {
//    let latLng = {lat: 36.794915999823, lng: -118.993424 };
    const latLng = { lat: 36.823209999827, lng: -119.011145 };

    this.panTo(latLng);

    displayLocationPopup(this, latLng);
}

function downloadElevations(object, position) {
    $.ajax({
        url: '/elevation/file',
        headers:
        {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
        },
        contentType: 'application/json',
        type: 'PUT',
        data: JSON.stringify({ lat: position.lat(), lng: position.lng() }),
    });
}

function displayTrailInfo(object, position) {
    const trailInfo = object.get('trail');

    map.infoWindow.setContent(
        `<div>Name:${trailInfo.tile.trails[trailInfo.trail].name}</div>`
		+ `<div>CN:${trailInfo.tile.trails[trailInfo.trail].cn}</div>`
		+ `<div>Type:${trailInfo.tile.trails[trailInfo.trail].type}</div>`,
    );
    map.infoWindow.setPosition(position);
    map.infoWindow.open(map);
}

function setStartLocation(object, position) {
    getRoute().setStart(position);
}

function setEndLocation(object, position) {
    getRoute().setEnd(position);
}

let intersections = [];

function showIntersections(event) {
    const bounds = this.getBounds();

    $.getJSON({
        url: `/map/intersections?b=${bounds.toBBoxString()}`,
        context: this,
    })
        .done(function (responseText) {
            for (const i of intersections) {
                i.remove();
            }

            intersections = [];

            const coords = responseText;

            for (const c of coords) {
                const { coordinate } = c;

                const marker = new L.Marker([coordinate.coordinates[1], coordinate.coordinates[0]], {
                    icon: L.icon(
                        {
                            iconUrl: nodeUrl,
                            iconAnchor: L.point(16, 32),
                            popupAnchor: L.point(0, -32),
                            tooltipAnchor: L.point(0, -32),
                        },
                    ),
                }).addTo(this);

                intersections.push(marker);
            }
        });
}

function highlightNearestTrail(event) {
    $.getJSON({
        url: `/map/nearestTrail?lat=${event.latlng.lat}&lng=${event.latlng.lng}`,
        context: this,
    })
        .done(function (responseText) {
            const points = [];
            for (const p of responseText) {
                points.push([p.point.lat, p.point.lng]);
            }

            const polyLine = L.polyline(points, {
                color: '#FF0000',
                opacity: 0.5,
                weight: routeStrokeWeight + 2 * routeHighlightStrokePadding,
                zIndex: 10,
            })
                .addTo(this);
        });
}

function showNearestGraph(event) {
    $.getJSON({
        url: `/map/nearestGraph?lat=${event.latlng.lat}&lng=${event.latlng.lng}`,
        context: this,
    })
        .done(function (graph) {
            for (const e of graph.edges) {
                if (e.start_node && e.end_node && graph.nodes[e.start_node] && graph.nodes[e.end_node]) {
                    const line = [
                        [graph.nodes[e.start_node].point.lat, graph.nodes[e.start_node].point.lng],
                        [graph.nodes[e.end_node].point.lat, graph.nodes[e.end_node].point.lng],
                    ];

                    const polyLine = L.polyline(
                        line,
                        {
                            color: '#FF0000',
                            opacity: 0.5,
                            weight: 2,
                        },
                    ).addTo(this);

                    const popup = $('<div></div>');

                    $('<div></div>')
                        .text(`Edge ID: ${e.id}`)
                        .appendTo(popup);

                    $('<div></div>')
                        .text(`Forward Cost: ${e.forward_cost}`)
                        .appendTo(popup);

                    $('<div></div>')
                        .text(`Backward Cost: ${e.backward_cost}`)
                        .appendTo(popup);

                    polyLine.bindPopup(popup[0]);
                }
            }
        });
}

function whatIsHere(event) {
    $.getJSON({
        url: `/map/whatishere?lat=${event.latlng.lat}&lng=${event.latlng.lng}`,
        context: this,
    })
        .done(function (result) {
            console.log(result);

            const info = $('<div></div>');

            $('<div></div')
                .text(`Lat: ${result.point.lat}`)
                .appendTo(info);

            $('<div></div>')
                .text(` Lng: ${result.point.lng}`)
                .appendTo(info);

            +'</div><div>Elevation: ';

            if (elevation === undefined || elevation === null) {
                $('<div></div>')
                    .text('Elevation: not available')
                    .appendTo(info);
            }
            else {
                $('<div></div>')
                    .text(`Elevation: ${metersToFeet(elevation)}`)
                    .appendTo(info);
            }

            $('<div></div>')
                .text(`Line ID: ${result.line_id}`)
                .appendTo(info);

            this.openPopup(info[0], result.point);
        });
}

function mapInitialize() {
    window.onkeydown = function (e) {
        controlDown = ((e.keyIdentifier === 'Control') || (e.ctrlKey === true));
    };

    window.onkeyup = function (e) {
        if ((e.keyIdentifier === 'Control') || (e.ctrlKey === true)) {
            controlDown = false;
        }
    };

    const waypointMenuItems = [
        { text: 'Prepend Waypoint', callback: (event) => store.dispatch(addStartWaypoint(event.latlng)) },
        { text: 'Insert Waypoint', callback: (event) => store.dispatch(addWaypoint(event.latlng)) },
        { text: 'Append Waypoint', callback: (event) => store.dispatch(addEndWaypoint(event.latlng)) },
        { separator: true },
    ];

    const mapMenuItems = [
        { text: 'Display Location', callback: displayLocation },
        { text: 'Go to Location...', callback: gotoLocation },
    ];

    mapMenuItems.splice(0, 0, ...waypointMenuItems);

    if (sessionStorage.getItem('userAdmin')) {
        const adminMenuItems = [
            { separator: true },
            { text: 'Add Point of Interest', callback: showAddPointOfInterest, admin: true },
            { text: 'Add Note', callback: addNote, admin: true },
            { text: 'Create Resupply Location', callback: addResupplyLocation, admin: true },
            { text: 'Download Elevations', callback: downloadElevations, admin: true },
            { text: 'Show Intersections', callback: showIntersections, admin: true },
            { text: 'Higlight Nearest Trail', callback: highlightNearestTrail, admin: true },
            { text: 'Show Nearest Graph', callback: showNearestGraph, admin: true },
            { text: 'What is here?', callback: whatIsHere },
        ];

        mapMenuItems.splice(mapMenuItems.length, 0, ...adminMenuItems);
    }

    const trailMenuItems = [
        { text: 'Display Location', callback: displayLocation },
        { text: 'Add Point of Interest', callback: showAddPointOfInterest, admin: true },
        { text: 'Create Resupply Location', callback: addResupplyLocation, admin: true },
        { text: 'Trail Information', callback: displayTrailInfo, admin: true },
    ];

    trailMenuItems.splice(0, 0, ...waypointMenuItems);

    /*
	trailContextMenu = new ContextMenu (trailMenuItems);

	pointOfInterestCM = new ContextMenu ([
		{title:"Edit Point of Interest", func:editPointOfInterest},
		{title:"Remove Point of Interest", func:removePointOfInterest}]);

	resupplyLocationCM = new ContextMenu ([
		{title:"Resupply from this location", func:resupplyFromLocation},
		{title:"Edit Resupply Location", func:editResupplyLocation},
		{title:"Delete Resupply Location", func:deleteResupplyLocation}]);
    */

    /*
	routeContextMenu = new ContextMenu (routeMenuItems);

	vertexContextMenu = new ContextMenu ([
		{title:"Delete", func:deleteVertex}]);

	setContextMenu (map, mapContextMenu);
    */

    const map = L.map('map',
        {
            contextmenu: true,
            contextmenuItems: mapMenuItems,
            maxZoom: 16,
            minZoom: 4,
        });

    const terrainLayer = L.tileLayer(`${sessionStorage.getItem('tileServerUrl')}/terrain/{z}/{x}/{y}`, {
        updateWhenZooming: true,
    });

    const detailLayer = L.tileLayer(
        `${sessionStorage.getItem('tileServerUrl')}/tile/{z}/{x}/{y}`, {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
            updateWhenZooming: true,
        },
    );

    L.layerGroup()
        .addLayer(terrainLayer)
        .addLayer(detailLayer)
        .addTo(map);

    /*
    map.on('locationfound', function (e)
        {
            var radius = e.accuracy;

            L.marker(e.latlng).addTo(map)
                .bindPopup("You are within " + radius + " meters from this point").openPopup();

            L.circle(e.latlng, radius).addTo(map);
        });

        map.on('locationerror', function (e) {
            alert(e.message);
        });

    map.locate({setView: true, maxZoom: 16});
*/

    trails = new Trails(map);

    retrievePointsOfInterest();
    retrieveResupplyLocations();
    retrieveHikerProfiles(); // todo: only do this when visiting the tab of hiker profiles

    return map;
}

export { mapInitialize, trails };
