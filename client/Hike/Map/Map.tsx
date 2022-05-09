import React, {
  useState, useRef, useEffect, useCallback, FC,
} from 'react';
import 'leaflet.markercluster';
import {
  TileLayer, useMap, Popup, LayersControl, useMapEvents,
  Marker as LeafletMarker,
  Polyline,
  Pane,
} from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import ContextMenu, { MenuItem, showContextMenu, setMainContextMenu } from '@mortvola/leaflet-context-menu';
import Route from './Route';
import { useGotoLocationDialog } from '../GotoLocationDialog';
import Graticule from '../Graticule';
import Hike from '../state/Hike';
import Marker from './Marker';
import useMediaQuery from '../../MediaQuery';
import MapDrawer from './MapDrawer';
import ElevationChart from '../Elevation/ElevationChart';
import DragToggleControl from './DragToggle';
import { PoiSelections } from './More/PoiSelector';
import MoreControl from './More/MoreControl';
import PleaseWait from '../../Hikes/PleaseWait';
import styles from './Map.module.css';
import { useStores } from '../state/store';
import SelectedMarkers from './SelectedMarkers/Markers';
import Poi from './PointsOfInterest/Poi';

type Props = {
  tileServerUrl: string;
  hike: Hike,
  locationPopup?: L.LatLng | null,
};

const Map: FC<Props> = observer(({
  tileServerUrl,
  hike,
  locationPopup = null,
}) => {
  const { uiState } = useStores();
  const leafletMap = useMap();
  const terrainLayer = useRef(null);
  const detailLayer = useRef(null);
  const [GotoLocationDialog, showGotoLocationDialog] = useGotoLocationDialog();
  const { isMobile } = useMediaQuery();
  const [draggingLocked, setDraggingLocked] = useState<boolean>(false);
  const [poiSelections, setPoiSelections] = useState<PoiSelections>(() => {
    const poi = window.localStorage.getItem('poi');

    if (poi) {
      return JSON.parse(poi);
    }

    return ({
      waypoints: true,
      campsites: true,
      rvSites: true,
      water: true,
      resupply: true,
      day: true,
      postOffices: true,
      cities: true,
      photos: true,
    });
  });

  const hikeLeg = hike.currentLeg;

  const handlePoiSelectionChange = (value: PoiSelections) => {
    setPoiSelections(value);

    window.localStorage.setItem('poi', JSON.stringify(value));
  };

  useEffect(() => {
    if (hikeLeg && hikeLeg.map) {
      hikeLeg.map.setLeafletMap(leafletMap);
    }
  }, [hikeLeg, leafletMap]);

  const dropWaypoint = (event: L.LeafletMouseEvent) => {
    if (hikeLeg) {
      hikeLeg.route.addEndWaypoint(event.latlng);
    }
  };

  const makeContextMenu = useCallback((): MenuItem[] => {
    const mapMenuItems: MenuItem[] = [];

    if (hikeLeg && hikeLeg.route.anchors.length === 0) {
      mapMenuItems.push({
        label: 'Add Waypoint', callback: (latlng: L.LatLng) => hikeLeg.route.addStartWaypoint(latlng),
      });
    }
    else if (hikeLeg && hikeLeg.route.anchors.length === 1) {
      mapMenuItems.splice(
        mapMenuItems.length,
        0,
        { label: 'Prepend Waypoint', callback: (latlng: L.LatLng) => hikeLeg.route.addStartWaypoint(latlng) },
        { label: 'Append Waypoint', callback: (latlng: L.LatLng) => hikeLeg.route.addEndWaypoint(latlng) },
      );
    }
    else {
      mapMenuItems.splice(
        mapMenuItems.length,
        0,
        {
          label: 'Prepend Waypoint',
          callback: (latlng: L.LatLng) => {
            if (hikeLeg) {
              hikeLeg.route.addStartWaypoint(latlng);
            }
          },
        },
        {
          label: 'Insert Waypoint',
          callback: (latlng: L.LatLng) => {
            if (hikeLeg) {
              hikeLeg.route.addWaypoint(latlng);
            }
          },
        },
        {
          label: 'Append Waypoint',
          callback: (latlng: L.LatLng) => {
            if (hikeLeg) {
              hikeLeg.route.addEndWaypoint(latlng);
            }
          },
        },
      );
    }

    mapMenuItems.splice(
      mapMenuItems.length,
      0,
      { type: 'separator', label: '', callback: () => null },
      { label: 'Add Camp', callback: (latlng: L.LatLng) => hike.addCamp(latlng) },
      { label: 'Add Water', callback: (latlng: L.LatLng) => hike.addWater(latlng) },
      { label: 'Add Resupply', callback: (latlng: L.LatLng) => hike.addResupply(latlng) },
      { label: 'Go to Location...', callback: showGotoLocationDialog },
    );

    return mapMenuItems;
  }, [hikeLeg, hike, showGotoLocationDialog]);

  setMainContextMenu(makeContextMenu);

  const handleMapClick: L.LeafletMouseEventHandlerFn = (e) => {
    if (hikeLeg) {
      hikeLeg.map.setTemporaryMarkerLocation(e.latlng);
      hikeLeg.map.clearSelectedMarkers();
    }
  };

  const showIn3D: React.MouseEventHandler = () => {
    if (hikeLeg) {
      uiState.showIn3D(hikeLeg.map.temporaryMarkerLocation);
    }
  };

  useMapEvents({
    click: handleMapClick,
    contextmenu: (e: L.LeafletMouseEvent) => {
      if (isMobile) {
        if (!draggingLocked) {
          dropWaypoint(e);
        }
      }
      else {
        showContextMenu()(e);
      }
    },
  });

  const handleElevationMarkerChange = (latlng: L.LatLng | null) => {
    if (hikeLeg) {
      hikeLeg.setElevationMarker(latlng);
    }
  };

  if (hikeLeg === null) {
    return null;
    // throw new Error('hikeLeg is null');
  }

  return (
    <>
      <LayersControl position="topleft">
        <LayersControl.Overlay checked name="Terrain">
          <TileLayer
            url={`${tileServerUrl}/tile/terrain/{z}/{x}/{y}`}
            zIndex={1}
            ref={terrainLayer}
          />
        </LayersControl.Overlay>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url={`${tileServerUrl}/tile/detail/{z}/{x}/{y}`}
          zIndex={2}
          ref={detailLayer}
        />
        <LayersControl.Overlay checked name="Graticule">
          <Graticule />
        </LayersControl.Overlay>
      </LayersControl>
      <DragToggleControl position="topright" defaultValue={draggingLocked} onLockToggle={setDraggingLocked} />
      <MoreControl
        position="topleft"
        onChange={handlePoiSelectionChange}
        selections={poiSelections}
        hike={hike}
      />
      <ContextMenu />
      <MapDrawer>
        <div className={styles.drawerContents}>
          {
            hikeLeg.map.temporaryMarkerLocation
              ? (
                <div>
                  <div>{`lat,lng: ${hikeLeg.map.temporaryMarkerLocation.lat}, ${hikeLeg.map.temporaryMarkerLocation.lng}`}</div>
                  <button type="button" onClick={showIn3D}>View</button>
                </div>
              )
              : null
          }
          <SelectedMarkers markers={hikeLeg.map.selectedMarkers} />
          {
            hikeLeg
              ? (
                <ElevationChart
                  elevations={hikeLeg.route.elevations}
                  onElevationMarkerChange={handleElevationMarkerChange}
                />
              )
              : null
          }
        </div>
      </MapDrawer>
      {
        hikeLeg
          ? <Route route={hikeLeg.route} />
          : null
      }
      <Pane name="routeGroupTrail" style={{ zIndex: 250 }}>
        {
          hike.routeGroupTrail
            ? <Polyline positions={hike.routeGroupTrail} color="red" />
            : null
        }
      </Pane>
      {
        hikeLeg && hikeLeg.elevationMarkerPos
          ? (
            <LeafletMarker
              position={hikeLeg.elevationMarkerPos}
              icon={hike.elevationMarkerIcon}
            />
          )
          : null
      }
      <Poi hike={hike} selections={poiSelections} />
      {
        hikeLeg.map.markers.map((m) => (
          <Marker
            key={`${m.getTypeString()}-${m.id}`}
            marker={m}
            hikeLeg={hikeLeg}
            draggingLocked={draggingLocked}
            selections={poiSelections}
          />
        ))
      }
      <GotoLocationDialog leafletMap={leafletMap} map={hikeLeg.map} />
      {
        locationPopup
          ? (
            <Popup position={locationPopup}>
              { `${locationPopup.lat}, ${locationPopup.lng}`}
            </Popup>
          )
          : null
      }
      {
        hikeLeg.map.temporaryMarkerLocation
          ? (
            <LeafletMarker position={hikeLeg.map.temporaryMarkerLocation} />
          )
          : null
      }
      <PleaseWait show={hikeLeg.map.getWaiting()} />
    </>
  );
});

Map.displayName = 'Map';

export default Map;
