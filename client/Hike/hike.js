import L from 'leaflet';
import Trails from './trails';
import { retrieveResupplyLocations, addResupplyLocation } from './resupplyPlan';
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

let editPolyLine = {};

const junctionUrl = 'https://maps.google.com/mapfiles/ms/micons/lightblue.png';

function addNote(object, position) {
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
    if (l2 === 0) {
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

function mapInitialize(hikeId, tileServerUrl, extendedMenu) {
    window.onkeydown = function (e) {
        controlDown = ((e.keyIdentifier === 'Control') || (e.ctrlKey === true));
    };

    window.onkeyup = function (e) {
        if ((e.keyIdentifier === 'Control') || (e.ctrlKey === true)) {
            controlDown = false;
        }
    };

    const waypointMenuItems = [
        { text: 'Prepend Waypoint', callback: (event) => store.dispatch(addStartWaypoint(hikeId, event.latlng)) },
        { text: 'Insert Waypoint', callback: (event) => store.dispatch(addWaypoint(hikeId, event.latlng)) },
        { text: 'Append Waypoint', callback: (event) => store.dispatch(addEndWaypoint(hikeId, event.latlng)) },
        { separator: true },
    ];

    const mapMenuItems = [
        { text: 'Display Location', callback: displayLocation },
        { text: 'Go to Location...', callback: gotoLocation },
    ];

    mapMenuItems.splice(0, 0, ...waypointMenuItems);

    if (extendedMenu) {
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

    const terrainLayer = L.tileLayer(`${tileServerUrl}/tile/terrain/{z}/{x}/{y}`, {
        updateWhenZooming: true,
    });

    const detailLayer = L.tileLayer(
        `${tileServerUrl}/tile/detail/{z}/{x}/{y}`, {
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

    retrievePointsOfInterest(hikeId, map);
    retrieveResupplyLocations(hikeId, map);

    return map;
}

export { mapInitialize, trails };
