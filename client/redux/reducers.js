import { combineReducers } from 'redux';
import L from 'leaflet';
import {
  SET_VIEW,
  SET_MAP,
  RECEIVE_SCHEDULE,
  RECEIVE_ROUTE,
  RECEIVE_ANCHOR_UPDATES,
  RECEIVE_ANCHOR_UPDATE,
  RECEIVE_ANCHOR,
  SHOW_LOCATION_POPUP,
  REQUEST_HIKE,
} from './actionTypes';
import { VIEW_HIKES } from '../menuEvents';
import TrailMarker from '../Hike/trailMarker/trailMarker';
import { metersToMiles, metersToFeet } from '../utilities';
import HikeManager from './HikeManager';

const hikes = (
  state = new HikeManager(),
) => state;

function selections(
  state = {
    view: VIEW_HIKES,
    params: null,
  },
  action,
) {
  switch (action.type) {
    case SET_VIEW: {
      return {
        ...state,
        view: action.view,
        params: action.params,
      };
    }

    default:
      return state;
  }
}

const wayPointUrl = 'https://maps.google.com/mapfiles/ms/micons/lightblue.png';
const dayMarkerUrl = 'moon_pin.png';

function getBounds(route) {
  return route.reduce((accum, anc) => {
    if (anc.trail) {
      return accum.extend(anc.trail.reduce((a, point) => (
        a.extend(point)
      ), L.latLngBounds(anc)));
    }

    return accum;
  }, L.latLngBounds(route[0]));
}

let waypointLabel = 'A';

const resetWaypointLabel = () => {
  waypointLabel = 'A';
};

const getWaypointLabel = () => {
  const label = waypointLabel;

  // Get the next label. If the current label is Z then
  // start uing lower case letters.
  // TODO: Should switch to using two letters but wider icons will be needed.
  if (waypointLabel === 'Z') {
    waypointLabel = 'a';
  }
  else {
    waypointLabel = String.fromCharCode(waypointLabel.charCodeAt(0) + 1);
  }

  return label;
};

function anchor(
  state = null,
  action,
) {
  switch (action.type) {
    case RECEIVE_ANCHOR:
      return {
        ...action.anchor,
        marker: new TrailMarker(
          wayPointUrl,
          action.anchor.type === 'waypoint' ? getWaypointLabel() : undefined,
        ),
      };

    case RECEIVE_ANCHOR_UPDATE: {
      return {
        ...state,
        ...action.anchor,
      };
    }

    default:
      return state;
  }
}

function map(
  state = {
    map: null,
    route: null,
    dayMarkers: null,
    locationPopup: null,
  },
  action,
) {
  const getElevations = (route) => {
    let distance = 0;

    return (
      route
        .filter((a) => a.trail)
        .flatMap((a) => {
          const elevations = a.trail
            .map((p) => ([
              metersToMiles(distance + p.dist),
              metersToFeet(p.ele !== undefined ? p.ele : 0),
            ]));

          distance += a.trailLength;

          return elevations;
        })
    );
  };

  const processUpdates = (updates, anchors) => (
    updates.map((u) => {
      // Is this update for an existing anchor?
      const a = anchors.find((a2) => a2.id === u.id);

      if (a) {
        return {
          ...a,
          ...u,
        };
      }

      return u;
    })
  );

  switch (action.type) {
    case REQUEST_HIKE:
      return {
        map: null,
        route: null,
        dayMarkers: null,
        locationPopup: null,
      };

    case SET_MAP:
      return {
        ...state,
        map: action.map,
      };

    case RECEIVE_ROUTE: {
      resetWaypointLabel();
      const newRoute = action.route.map((a) => (
        anchor(undefined, { type: RECEIVE_ANCHOR, anchor: a })
      ));

      return {
        ...state,
        route: newRoute,
        elevations: getElevations(newRoute),
        bounds: getBounds(action.route),
      };
    }

    case RECEIVE_ANCHOR_UPDATES: {
      const firstIndex = state.route.findIndex((a) => a.id === action.updates[0].id);
      const lastIndex = state.route.findIndex(
        (a) => a.id === action.updates[action.updates.length - 1].id,
      );

      if (firstIndex !== -1) {
        const newRoute = [
          ...state.route.slice(0, firstIndex),
          ...processUpdates(action.updates, state.route.slice(firstIndex, lastIndex + 1)),
          ...state.route.slice(lastIndex + 1),
        ];

        return {
          ...state,
          route: newRoute,
          elevations: getElevations(newRoute),
        };
      }

      return state;
    }

    case RECEIVE_SCHEDULE:
      return {
        ...state,
        dayMarkers: action.schedule.filter((d, index) => index > 0).map((d, index) => ({
          id: d.id,
          day: index + 1,
          lat: d.lat,
          lng: d.lng,
          marker: new TrailMarker(
            dayMarkerUrl,
          ),
        })),
      };

    case SHOW_LOCATION_POPUP:
      return {
        ...state,
        locationPopup: action.latlng || null,
      };

    default:
      return state;
  }
}

function schedule(
  state = [],
  action,
) {
  switch (action.type) {
    case REQUEST_HIKE:
      return [];

    case RECEIVE_SCHEDULE:
      return action.schedule;

    default:
      return state;
  }
}

const hikeApp = combineReducers({
  selections,
  hikes,
  map,
  schedule,
});

export default hikeApp;
