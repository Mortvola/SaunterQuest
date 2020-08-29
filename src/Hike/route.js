import RouteHighlighter from './routeHighlighter';
import { getAndLoadElevationData, setElevationMinMax } from './elevationChart';
import { retrieveTrailConditions } from './trailCondition';
import { getRoute } from './tempstore';
import StartOfTrailMarker from './trailMarker/StartOfTrailMarker';
import EndOfTrailMarker from './trailMarker/EndOfTrailMarker';
import TrailMarker from './trailMarker/trailMarker';
import { metersToFeet, metersToMiles, formatTime } from '../utilities';
import store from '../redux/store';
import { routeUpdated } from '../redux/actions';

const startPointUrl = 'https://maps.google.com/mapfiles/ms/micons/green-dot.png';
const wayPointUrl = 'https://maps.google.com/mapfiles/ms/micons/lightblue.png';
const endPointUrl = 'https://maps.google.com/mapfiles/ms/micons/red-dot.png';
const elevationUrl = 'https://maps.google.com/mapfiles/ms/micons/yellow-dot.png';

const routeStrokeWeight = 6;

const touchDevice = window.matchMedia('(pointer: coarse)').matches;

let routeHighlighter;

function stopRouteMeasurement() {
    routeHighlighter.end();
    routeHighlighter = null;

    $('#distanceWindow').hide();

    getAndLoadElevationData(0, getRoute().getLength());
}

function startRouteMeasurement(event) {
    routeHighlighter = new RouteHighlighter(getRoute(), event.latlng, measureMarkerSet);

    $('#distanceWindowClose').off('click');
    $('#distanceWindowClose').click(() => {
        stopRouteMeasurement();
    });

    $('#distanceWindow').show();
}


class Route {
    constructor(map) {
        this.map = map;
        this.hikeId = sessionStorage.getItem('hikeId');

        this.startOfTrailMarker = new StartOfTrailMarker(map, startPointUrl);

        if (!touchDevice) {
            this.startOfTrailMarker.setDraggable(true, (marker) => {
                this.setStart(marker.getPosition());
            });
        }

        this.endOfTrailMarker = new EndOfTrailMarker(map, endPointUrl);

        if (!touchDevice) {
            this.endOfTrailMarker.setDraggable(true, (marker) => {
                this.setEnd(marker.getPosition());
            });
        }

        this.waypoints = [];

        this.initialLoad = true;

        this.elevationMarker = new TrailMarker(this.map, elevationUrl);

        $(document).on('elevationSelected', (event) => {
            const position = this.actualRoute[event.detail.routeIndex];

            this.elevationMarker.setPosition(position);
        });

        $(document).on('elevationUnselected', (event) => {
            this.elevationMarker.removeMarker();
        });
    }

    setStart(position) {
        $('#pleaseWait').show();

        $.ajax({
            url: `${this.hikeId}/route/startPoint`,
            headers:
            {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Content-type': 'application/json',
            },
            type: 'PUT',
            data: JSON.stringify({ lat: position.lat, lng: position.lng }),
            context: this,
        })
            .done(function (updates) {
                if (updates === undefined) {
                    this.retrieve();
                }
                else {
                    this.applyUpdates(updates);
                    this.startOfTrailMarker.setPosition(this.anchors[0]);
                }
            })
            .always(() => {
                $('#pleaseWait').hide();
            });
    }

    setEnd(position) {
        $('#pleaseWait').show();

        $.ajax({
            url: `${this.hikeId}/route/endPoint`,
            headers:
            {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Content-type': 'application/json',
            },
            type: 'PUT',
            data: JSON.stringify({ lat: position.lat, lng: position.lng }),
            context: this,
        })
        .done(function (updates) {
                if (updates === undefined) {
                    this.retrieve();
                }
                else {
                    this.applyUpdates(updates);
                    this.endOfTrailMarker.setPosition(this.anchors[this.anchors.length - 1]);
                }
        })
            .always(() => {
                $('#pleaseWait').hide();
            });
    }

    addStartWaypoint(position) {
        $('#pleaseWait').show();

        $.post({
            url: `${this.hikeId}/route/startPoint`,
            headers:
            {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Content-type': 'application/json',
            },
            data: JSON.stringify({ lat: position.lat, lng: position.lng }),
            context: this,
        })
            .done(function (updates) {
                if (updates === undefined) {
                    this.retrieve();
                }
                else {
                    this.applyUpdates(updates);
                }
            })
            .always(() => {
                $('#pleaseWait').hide();
            });
    }

    addEndWaypoint(position) {
        $('#pleaseWait').show();

        $.post({
            url: `${this.hikeId}/route/endPoint`,
            headers:
            {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Content-type': 'application/json',
            },
            data: JSON.stringify({ lat: position.lat, lng: position.lng }),
            context: this,
        })
            .done(function (updates) {
                if (updates === undefined) {
                    this.retrieve();
                }
                else {
                    this.applyUpdates(updates);
                }
            })
            .always(() => {
                $('#pleaseWait').hide();
            });
    }

    addWaypoint(position) {
        $('#pleaseWait').show();

        $.post({
            url: `${this.hikeId}/route/waypoint`,
            headers:
            {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Content-type': 'application/json',
            },
            data: JSON.stringify({ lat: position.lat, lng: position.lng }),
            context: this,
        })
            .done(function (updates) {
                if (updates === undefined) {
                    this.retrieve();
                }
                else {
                    this.applyUpdates(updates);
                }
            })
            .always(() => {
                $('#pleaseWait').hide();
            });
    }

    updateWaypoint(marker) {
        $('#pleaseWait').show();

        $.ajax({
            url: `${this.hikeId}/route/waypoint/${marker.id}/position`,
            headers:
            {
                'Content-type': 'application/json',
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            },
            type: 'PUT',
            data: JSON.stringify(marker.getPosition()),
            context: this,
        })
            .done(function (updates) {
                if (updates === undefined) {
                    this.retrieve();
                }
                else {
                    this.applyUpdates(updates);
                }
            })
            .always(() => {
                $('#pleaseWait').hide();
            });
    }

    removeWaypoint(marker) {
        $('#pleaseWait').show();

        $.ajax({
            url: `${this.hikeId}/route/waypoint/${marker.id}`,
            headers:
            {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            },
            type: 'DELETE',
            context: this,
        })
            .done(function (updates) {
                const index = this.waypoints.findIndex((entry) => entry.id == marker.id);

                if (index > -1) {
                    this.waypoints[index].removeMarker();
                    this.waypoints.splice(index, 1);
                }

                if (updates === undefined) {
                    this.retrieve();
                }
                else {
                    this.applyUpdates(updates);
                }
            })
            .always(() => {
                $('#pleaseWait').hide();
            });
    }

    applyUpdates(updates) {
        let retrieveRoute = false;

        updates.forEach((update) => {
            if (update.length === 1) {
                const firstPointToReplace = 0;
                const startDistance = 0;
                const numberOfPointsToReplace = 1;

                let route = [];
                for (const anchor of update) {
                    Route.addPointsToArray(anchor, route);
                    anchor.actualRouteIndex += firstPointToReplace;
                    anchor.dist += startDistance;

                    if (Route.anchorIsWaypoint(anchor)) {
                        this.updateOrAddWaypoint(anchor);
                    }
                }

                if (this.actualRoute === undefined) {
                    this.actualRoute = [];
                }

                if (this.actualPolyline === undefined) {
                    this.newPolyline();
                }

                // Update the polyline
                const path = this.actualRoutePolyline.getLatLngs();

                for (let p = 0; p < Math.min(route.length, numberOfPointsToReplace); p++) {
                    path[p + firstPointToReplace] = route[p];
                    this.actualRoute[p + firstPointToReplace] = route[p];
                    this.actualRoute[p + firstPointToReplace].dist += startDistance;
                }

                this.actualRoutePolyline.setLatLngs(path);
                this.anchors.splice(0, 1, ...update);
            }
            else if (update[0].id === -1) {
                if (update[1].id === -1) {
                    // All anchors, waypoints and trail are removed
                    this.anchors = [];
                    this.waypoints = [];

                    if (this.actualRoute) {
                        this.actualRoute = undefined;
                    }

                    this.newPolyline();
                }
                else {
                    const lastIndex = this.anchors.findIndex((entry) => entry.id == update[1].id);

                    const lastPointToReplace = this.anchors[lastIndex].actualRouteIndex;

                    update[1].actualRouteIndex = 0;
                    update[1].dist = 0;
                    this.updateOrAddWaypoint(update[1]);

                    update[1].trail = this.anchors[lastIndex].trail;

                    // Update the polyline
                    const path = this.actualRoutePolyline.getLatLngs();

                    // The anchor is the first anchor. Make sure there is no trail
                    // before it.
                    for (let p = 0; p < lastPointToReplace; p++) {
                        // Since we are removing elements there is no need to
                        // walk the array, just keeping removing the same index
                        path.splice(0, 1);
                        this.actualRoute.splice(0, 1);
                    }

                    this.actualRoute[0].dist = 0;

                    // Update all of the actualRouteIndex and distance data members in the anchors beyond
                    // the point of update.
                    const indexDelta = this.anchors[lastIndex].actualRouteIndex;
                    const distDelta = this.anchors[lastIndex].dist;
                    for (let i = lastIndex; i < this.anchors.length; i++) {
                        this.anchors[i].actualRouteIndex -= indexDelta;
                        this.anchors[i].dist -= distDelta;
                    }

                    this.actualRoutePolyline.setLatLngs(path);
                    this.anchors.splice(0, lastIndex + 1, update[1]);
                }
            }
            else if (update[1].id === -1) {
                const firstIndex = this.anchors.findIndex((entry) => entry.id == update[0].id);
                const lastIndex = this.anchors.length - 1;

                var firstPointToReplace = this.anchors[firstIndex].actualRouteIndex;

                update[0].actualRouteIndex = firstPointToReplace;
                update[0].dist = this.anchors[firstIndex].dist;
                this.updateOrAddWaypoint(update[0]);

                // Update the polyline
                const path = this.actualRoutePolyline.getLatLngs();

                // The anchor is the last anchor. Make sure there is no trail
                // after it.
                for (let p = firstPointToReplace + 1; p < this.actualRoute.length;) {
                    // Since we are removing elements there is no need to
                    // walk the array, just keeping removing the same index
                    path.splice(firstPointToReplace + 1, 1);
                    this.actualRoute.splice(firstPointToReplace + 1, 1);
                }

                this.actualRoutePolyline.setLatLngs(path);
                this.anchors.splice(firstIndex, lastIndex - firstIndex + 1, update[0]);
            }
            else {
                // Find the anchor in the array of anchors that
                // corresponds to the first anchor in this update
                const firstIndex = this.anchors.findIndex((entry) => entry.id == update[0].id);

                if (firstIndex > -1) {
                    // Find the anchor in the array that corresponds to the
                    // last anchor in this update
                    var lastIndex = this.anchors.findIndex((entry) => entry.id == update[update.length - 1].id);

                    if (lastIndex > -1) {
                        // The first and last anchors were found. Replace the anchors in the array of anchors
                        // with this update.

                        var route = [];
                        var firstPointToReplace = this.anchors[firstIndex].actualRouteIndex;
                        const numberOfPointsToReplace = this.anchors[lastIndex].actualRouteIndex - firstPointToReplace + 1;
                        var startDistance = this.anchors[firstIndex].dist;

                        for (const anchor of update) {
                            Route.addPointsToArray(anchor, route);
                            anchor.actualRouteIndex += firstPointToReplace;
                            anchor.dist += startDistance;

                            if (Route.anchorIsWaypoint(anchor)) {
                                this.updateOrAddWaypoint(anchor);
                            }
                        }

                        // The last anchor in the update needs to adopt the trail from the anchor that will be replaced.
                        update[update.length - 1].trail = this.anchors[lastIndex].trail;

                        // Update the polyline
                        const path = this.actualRoutePolyline.getLatLngs();

                        for (let p = 0; p < Math.min(route.length, numberOfPointsToReplace); p++) {
                            path[p + firstPointToReplace] = route[p];
                            this.actualRoute[p + firstPointToReplace] = route[p];
                            this.actualRoute[p + firstPointToReplace].dist += startDistance;
                        }

                        if (numberOfPointsToReplace > route.length) {
                            for (let p = route.length; p < numberOfPointsToReplace; p++) {
                                // Since we are removing elements there is no need to
                                // walk the array, just keeping removing the same index
                                path.splice(route.length + firstPointToReplace, 1);
                                this.actualRoute.splice(route.length + firstPointToReplace, 1);
                            }
                        }
                        else if (route.length > numberOfPointsToReplace) {
                            for (let p = numberOfPointsToReplace; p < route.length; p++) {
                                path.splice(p + firstPointToReplace, 0, route[p]);
                                this.actualRoute.splice(p + firstPointToReplace, 0, route[p]);
                                this.actualRoute[p + firstPointToReplace].dist += startDistance;
                            }
                        }

                        // Update all of the actualRouteIndex and distance data members in the anchors beyond
                        // the point of update.
                        var indexDelta = route.length - numberOfPointsToReplace;
                        var distDelta = update[update.length - 1].dist - this.anchors[lastIndex].dist;
                        for (let i = lastIndex; i < this.anchors.length; i++) {
                            this.anchors[i].actualRouteIndex += indexDelta;
                            this.anchors[i].dist += distDelta;
                        }

                        // Update all of the actual route point distances beyond this update.
                        for (let p = this.anchors[lastIndex].actualRouteIndex + 1; p < this.actualRoute.length; p++) {
                            this.actualRoute[p].dist += distDelta;
                        }

                        this.actualRoutePolyline.setLatLngs(path);
                        this.anchors.splice(firstIndex, lastIndex - firstIndex + 1, ...update);
                    }
                    else {
                        // Only the first anchor was found. Insert the anchors to the end of the array of anchors
                        // with this update.

                        var route = [];
                        var firstPointToReplace = this.anchors[firstIndex].actualRouteIndex;
                        var startDistance = this.anchors[firstIndex].dist;

                        for (const anchor of update) {
                            Route.addPointsToArray(anchor, route);
                            anchor.actualRouteIndex += firstPointToReplace;
                            anchor.dist += startDistance;

                            if (Route.anchorIsWaypoint(anchor)) {
                                this.updateOrAddWaypoint(anchor);
                            }
                        }

                        // Update the polyline
                        if (this.actualRoutePolyline === undefined) {
                            this.newPolyline();
                        }

                        const path = this.actualRoutePolyline.getLatLngs();

                        for (let p = 1; p < route.length; p++) {
                            path.splice(p + firstPointToReplace, 0, route[p]);
                            this.actualRoute.splice(p + firstPointToReplace, 0, route[p]);
                            this.actualRoute[p + firstPointToReplace].dist += startDistance;
                        }

                        this.actualRoutePolyline.setLatLngs(path);
                        this.anchors.splice(firstIndex, 1, ...update);
                    }
                }
                else {
                    // Find the anchor in the array that corresponds to the
                    // last anchor in this update (it should be zero).
                    var lastIndex = this.anchors.findIndex((entry) => entry.id == update[update.length - 1].id);

                    if (lastIndex === 0) {
                        // The last anchor was found. Insert the anchors to the beginning of the array of anchors
                        // with this update.

                        var route = [];

                        for (const anchor of update) {
                            Route.addPointsToArray(anchor, route);

                            if (Route.anchorIsWaypoint(anchor)) {
                                this.updateOrPrependWaypoint(anchor);
                            }
                        }

                        // The last anchor in the update needs to adopt the trail from the anchor that will be replaced.
                        update[update.length - 1].trail = this.anchors[lastIndex].trail;

                        // Update (or add) the polyline
                        if (this.actualRoutePolyline === undefined) {
                            this.newPolyline();
                        }

                        const path = this.actualRoutePolyline.getLatLngs();

                        for (let p = 0; p < route.length - 1; p++) {
                            path.splice(p, 0, route[p]);
                            this.actualRoute.splice(p, 0, route[p]);
                        }

                        // Update all of the actualRouteIndex and distance data members in the anchors beyond
                        // the point of update.
                        var indexDelta = route.length - 1;
                        var distDelta = update[update.length - 1].dist;
                        for (let i = 0; i < this.anchors.length; i++) {
                            this.anchors[i].actualRouteIndex += indexDelta;
                            this.anchors[i].dist += distDelta;
                        }

                        // Update all of the actual route point distances beyond this update.
                        for (let p = this.anchors[0].actualRouteIndex; p < this.actualRoute.length; p++) {
                            this.actualRoute[p].dist += distDelta;
                        }

                        this.actualRoutePolyline.setLatLngs(path);
                        this.anchors.splice(0, 1, ...update);
                    }
                    else {
                        retrieveRoute = true;
                        // break;
                    }
                }
            }
        }, this);

        if (retrieveRoute) {
            this.retrieve();
        }
        else {
            // Renumber waypoints
            this.relabelWaypoints();

            store.dispatch(routeUpdated());
        }
    }

    relabelWaypoints() {
        let waypointLabel = 'A';
        for (const w of this.waypoints) {
            if (w.remove) {
                w.removeMarker();
            }
            else {
                w.setLabel(waypointLabel);

                // Get the next label. If the current label is Z then
                // start uing lower case letters.
                // TODO: Should switch to using two letters but wider icons will be needed.
                if (waypointLabel === 'Z') {
                    waypointLabel = 'a';
                }
                else {
                    waypointLabel = String.fromCharCode(waypointLabel.charCodeAt(0) + 1);
                }
            }
        }
    }

    editWaypoint(marker) {
        // Set the form back to the original state
        $('#waypointForm')[0].reset();
        $('#waypointForm [data-constraint]').removeAttr('data-id');

        $("#waypointForm [name='name']").val(marker.name);

        // Look for and populate any time constraint fields in the form.
        marker.timeConstraints.forEach((constraint) => {
            const control = $(`#waypointForm [data-constraint='${constraint.type}']`);

            control.each(function () {
                if (this.type === 'checkbox') {
                    this.checked = constraint.time != 0;
                }
                else if (this.type === 'time') {
                    this.value = null;

                    if (constraint.time !== null) {
                        this.value = formatTime(constraint.time);
                    }
                }
                else {
                    this.value = constraint.time;
                }
            });

            control.attr('data-id', constraint.id);
        });

        $('#waypointForm').off('submit');
        $('#waypointForm').submit((event) => {
            event.preventDefault();

            const details = objectifyForm($('#waypointForm').serializeArray());

            details.timeConstraints = [];

            $('#waypointForm [data-constraint]').each(function () {
                const inputType = this.attributes.getNamedItem('type').value;
                const type = this.attributes.getNamedItem('data-constraint').value;
                let value = null;
                let id = null;
                const idAttr = this.attributes.getNamedItem('data-id');

                if (idAttr !== null) {
                    id = parseInt(idAttr.value, 10);
                }

                if (inputType === 'checkbox') {
                    value = this.checked ? 1 : 0;
                }
                else {
                    if (inputType === 'time') {
                        value = unformatTime(this.value);
                    }
                    else {
                        value = parseInt(this.value, 10);
                    }

                    if (isNaN(value)) {
                        value = null;
                    }
                }

                details.timeConstraints.push(
                    {
                        id,
                        type,
                        time: value,
                    },
                );
            });

            $.ajax({
                url: `${this.hikeId}/route/waypoint/${marker.id}/details`,
                headers:
                {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                },
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(details),
            })
                .done(() => {
                    marker.name = details.name;
                    marker.timeConstraints = details.timeConstraints;
                });

            $('#waypointDialog').modal('hide');
        });
        $('#waypointDialog').modal('show');
    }

    setWaypointOrder(order) {
        $('#pleaseWait').show();

        $.ajax({
            url: `${this.hikeId}/route/waypoint/order`,
            headers:
            {
                'Content-type': 'application/json',
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
            },
            type: 'PUT',
            data: JSON.stringify(order),
            context: this,
        })
            .done(function () {
                this.retrieve();
            })
            .always(() => {
                $('#pleaseWait').hide();
            });
    }

    setWaypointAsCamp(id) {
        const waypoint = this.waypoints.find((entry) => entry.id == id);

        if (waypoint) {
            waypoint.setIcon(campUrl);
        }
    }

    getLength() {
        if (this.actualRoute === undefined) {
            return 0;
        }

        return this.actualRoute.length;
    }

    setAnchors(anchors) {
        this.anchors = anchors;

        if (this.anchors.length > 0) {
            this.load();

            if (this.map) {
                this.draw();

                if (this.initialLoad) {
                    this.map.fitBounds(this.actualRoutePolyline.getBounds());
                    const z = this.map.getZoom();
                    if (z > 13) {
                        this.map.setZoom(13);
                    }
                }
            }

            if (this.anchors.length > 1) {
                retrieveTrailConditions();
            }
        }
        else if (this.map) {
            if (this.initialLoad) {
                this.map.setView([41.35, -96.0], 5);
            }
        }

        store.dispatch(routeUpdated());

        this.initialLoad = false;
    }

    retrieve() {
        fetch(`${this.hikeId}/route`)
            .then(async (response) => {
                if (response.ok) {
                    this.setAnchors(await response.json());
                }
            });
    }

    static anchorIsWaypoint(anchor) {
        return (
            anchor.type !== undefined
            && (anchor.type === 'waypoint' || anchor.type === 'start' || anchor.type === 'end')
        );
    }

    getWaypointIndex(anchor) {
        // Check to see if this waypoint already exists in our array of waypoints.
        return this.waypoints.findIndex((w) => w.id === anchor.id);
    }

    getWaypoint(anchor) {
        // Check to see if this waypoint already exists in our array of waypoints.
        const waypointIndex = this.getWaypointIndex(anchor);

        if (waypointIndex > -1) {
            return this.waypoints[waypointIndex];
        }

        return null;
    }

    newWaypoint(anchor) {
        // The waypoint doesn't already exist. Add it to the array of waypoints.
        const waypoint = new TrailMarker(this.map, wayPointUrl);

        waypoint.id = anchor.id;

        if (!touchDevice) {
            waypoint.setDraggable(true, (marker) => {
                this.updateWaypoint(marker);
            });
        }

        const route = this;

        const wayPointCM = [
            {
                text: 'Edit Waypoint',
                index: 0,
                callback(event) {
                    route.editWaypoint(waypoint);
                },
            },
            {
                text: 'Remove Waypoint',
                index: 1,
                callback(event) {
                    route.removeWaypoint(waypoint);
                },
            },
            { separator: true, index: 2 },
        ];

        waypoint.setContextMenu(wayPointCM);

        Route.updateWaypointInfo(waypoint, anchor);

        waypoint.setInfoMessageCallback(
            () => {
                if (waypoint.name !== undefined && waypoint.name !== null && waypoint.name !== '') {
                    return `<div>Name: ${waypoint.name}</div>`;
                }

                return '';
            },
        );

        return waypoint;
    }

    static updateWaypointInfo(waypoint, anchor) {
        waypoint.timeConstraints = anchor.time_constraints;
        waypoint.name = anchor.name;
        waypoint.setPosition(anchor);
    }

    updateOrAddWaypoint(anchor) {
        let waypoint = this.getWaypoint(anchor);

        if (waypoint === undefined) {
            waypoint = this.newWaypoint(anchor);

            this.waypoints.push(waypoint);

            return waypoint;
        }

        Route.updateWaypointInfo(waypoint, anchor);

        return waypoint;
    }

    updateOrPrependWaypoint(anchor) {
        let waypoint = this.getWaypoint(anchor);

        if (waypoint === undefined) {
            waypoint = this.newWaypoint(anchor);

            this.waypoints.splice(0, 0, waypoint);

            return waypoint;
        }

        Route.updateWaypointInfo(waypoint, anchor);

        return waypoint;
    }

    static addPointsToArray(anchor, route) {
        route.push({
            lat: anchor.lat, lng: anchor.lng, dist: anchor.dist, ele: anchor.ele,
        });
        anchor.actualRouteIndex = route.length - 1;

        if (anchor.trail && anchor.trail.length > 0) {
            if (anchor.lat === anchor.trail[0].point.lat
                && anchor.lng === anchor.trail[0].point.lng) {
                console.log('same coordinate');
            }

            anchor.trail.forEach((t) => {
                route.push({
                    lat: t.point.lat,
                    lng: t.point.lng,
                    dist: t.dist,
                    ele: t.point.ele,
                });
            });
        }
    }

    load() {
        this.actualRoute = [];

        for (const w of this.waypoints) {
            w.remove = true;
        }

        let waypointIndex = 0;

        if (this.anchors && this.anchors.length > 0) {
            //
            // Traverse route coords and find the bounds
            // todo: this should be part of the file retrieved
            this.anchors.forEach((_anchor, r) => {
                if (r > 0
                    && this.anchors[r].lat === this.anchors[r - 1].lat
                    && this.anchors[r].lng === this.anchors[r - 1].lng) {
                    console.log('same coordinate');
                }

                if (Route.anchorIsWaypoint(this.anchors[r])) {
                    const oldWaypointIndex = this.getWaypointIndex(this.anchors[r]);

                    if (oldWaypointIndex === -1) {
                        // Waypoint does not exist in the array of waypoitns.
                        // Create one and insert it.
                        const waypoint = this.newWaypoint(this.anchors[r]);

                        this.waypoints.splice(waypointIndex, 0, waypoint);
                    }
                    else {
                        // Waypoint already exists.

                        if (oldWaypointIndex !== waypointIndex) {
                            // Waypoint needs to move position in the array.

                            const waypoint = this.waypoints.splice(oldWaypointIndex, 1)[0];

                            this.waypoints.splice(waypointIndex, 0, waypoint);
                        }

                        Route.updateWaypointInfo(this.waypoints[waypointIndex], this.anchors[r]);

                        this.waypoints[waypointIndex].remove = false;
                    }

                    waypointIndex += 1;
                }

                Route.addPointsToArray(this.anchors[r], this.actualRoute);
            }, this);
        }

        this.relabelWaypoints();
    }

    newPolyline() {
        if (this.actualRoutePolyline !== undefined) {
            this.actualRoutePolyline.remove();
        }

        this.actualRoutePolyline = new L.polyline([], {
            color: '#0000FF',
            opacity: 1.0,
            weight: routeStrokeWeight,
            zIndex: 20,
        });

        this.actualRoutePolyline.addTo(this.map);

        this.setContextMenu(null);
    }

    draw() {
        if (this.actualRoute.length > 0) {
            this.newPolyline();

            this.actualRoutePolyline.setLatLngs(this.actualRoute);
        }
    }

    setContextMenu(menu) {
        if (menu === null) {
            const routeMenuItems = [
                { text: 'Measure route section', index: 0, callback: startRouteMeasurement },
                { separator: true, index: 1 },
            ];

            // this.actualRoutePolyline.bindContextMenu({
            //     contextmenu: true,
            //     contextmenuItems: routeMenuItems
            // });
        }
        else {
            setContextMenu(this.actualRoutePolyline, menu);
        }
    }

    getNearestPoint(position) {
        const segment = this.getNearestSegment(position);

        const p = nearestPointOnSegment(
            { x: position.lat, y: position.lng },
            { x: this.actualRoute[segment].lat, y: this.actualRoute[segment].lng },
            { x: this.actualRoute[segment + 1].lat, y: this.actualRoute[segment + 1].lng },
        );

        return { lat: p.x, lng: p.y, segment };
    }

    getNearestSegment(position) {
        let closestEdge = -1;

        //
        // There has to be at least two points in the array. Otherwise, we wouldn't have any edges.
        //
        if (this.actualRoute.length > 1) {
            let shortestDistance;

            for (let r = 0; r < this.actualRoute.length - 1; r++) {
                const distance = distToSegmentSquared(
                    { x: position.lng, y: position.lat },
                    { x: this.actualRoute[r].lng, y: this.actualRoute[r].lat },
                    { x: this.actualRoute[r + 1].lng, y: this.actualRoute[r + 1].lat },
                );

                if (r == 0 || distance < shortestDistance) {
                    shortestDistance = distance;
                    closestEdge = r;
                }
            }
        }

        return closestEdge;
    }

    getSection(startPosition, endPosition) {
        let startSegment = startPosition.segment;

        if (startSegment == undefined) {
            startSegment = this.getNearestSegment(startPosition);
        }

        let endSegment = endPosition.segment;

        if (endSegment == undefined) {
            endSegment = this.getNearestSegment(endPosition);
        }

        const polyline = [];

        //
        // Swap the values if needed.
        //
        if (startSegment > endSegment) {
            endSegment = [startSegment, startSegment = endSegment][0];
            endPosition = [startPosition, startPosition = endPosition][0];
        }

        polyline.push({ lat: startPosition.lat, lng: startPosition.lng });

        if (startSegment != endSegment) {
            for (let r = startSegment + 1; r <= endSegment; r++) {
                polyline.push({ lat: this.actualRoute[r].lat, lng: this.actualRoute[r].lng });
            }
        }

        polyline.push({ lat: endPosition.lat, lng: endPosition.lng });

        return polyline;
    }

    getElevations(elevationData, s, e) {
        if (this.actualRoute !== undefined && this.actualRoute.length > 0) {
            let elevationMin = metersToFeet(this.actualRoute[s].ele);
            let elevationMax = elevationMin;

            for (let r = s; r < e; r += 1) {
                if (!isNaN(this.actualRoute[r].ele) && this.actualRoute[r].ele !== null) {
                    elevationData.push([
                        metersToMiles(this.actualRoute[r].dist),
                        metersToFeet(this.actualRoute[r].ele),
                    ]);

                    elevationMin = Math.min(elevationMin, metersToFeet(this.actualRoute[r].ele));
                    elevationMax = Math.max(elevationMax, metersToFeet(this.actualRoute[r].ele));
                }
            }

            setElevationMinMax(elevationMin, elevationMax);
        }
    }

    measure(startPosition, startSegment, endPosition, endSegment) {
        let distance = 0;

        if (startSegment === endSegment) {
            distance = this.map.distance(startPosition, endPosition);
        }
        else {
            //
            // Swap the values if needed.
            //
            if (startSegment > endSegment) {
                endSegment = [startSegment, startSegment = endSegment][0];
                endPosition = [startPosition, startPosition = endPosition][0];
            }

            // Compute the distance between the start point and the start segment (the
            // start point might be in the middle of a segment)
            const startDistance = this.map.distance(
                startPosition, this.actualRoute[startSegment + 1],
            );

            for (let r = startSegment + 1; r < endSegment; r += 1) {
                distance += this.map.distance(this.actualRoute[r], this.actualRoute[r + 1]);
            }

            // Compute the distance between the end segment and the end point (the
            // end point might be int he middle of a segment)
            const endDistance = this.map.distance(this.actualRoute[endSegment], endPosition);

            distance += startDistance + endDistance;
        }

        return distance;
    }
}

export default Route;
