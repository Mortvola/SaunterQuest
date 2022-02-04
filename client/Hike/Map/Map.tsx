import React, {
  useState, useRef, useEffect, useCallback, FC,
} from 'react';
import 'leaflet.markercluster';
import {
  TileLayer, useMap, Popup, LayersControl, useMapEvents,
  Marker as LeafletMarker,
} from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import ContextMenu, { MenuItem, showContextMenu, setMainContextMenu } from '@mortvola/leaflet-context-menu';
import { runInAction } from 'mobx';
import Route from './Route';
import { useGotoLocationDialog } from '../GotoLocationDialog';
import Graticule from '../Graticule';
import Hike from '../../state/Hike';
import Marker from './Marker';
import Gpx from '../Gpx';
import useMediaQuery from '../../MediaQuery';
import MapDrawer from './MapDrawer';
import ElevationChart from '../Elevation/ElevationChart';
import DragToggleControl from './DragToggle';
import { PoiSelections } from './More/PoiSelector';
import MoreControl from './More/MoreControl';
import PleaseWait from '../../Hikes/PleaseWait';
import styles from './Map.module.css';
import { useStores } from '../../state/store';
import SelectedMarkers from './SelectedMarkers/Markers';
import Poi from './PointsOfInterest/Poi';

type Props = {
  tileServerUrl: string;
  pathFinderUrl: string;
  hike: Hike,
  locationPopup?: L.LatLng | null,
};

const Map: FC<Props> = ({
  tileServerUrl,
  pathFinderUrl,
  hike,
  locationPopup,
}) => {
  const { uiState } = useStores();
  const leafletMap = useMap();
  const terrainLayer = useRef(null);
  const detailLayer = useRef(null);
  const [GotoLocationDialog, showGotoLocationDialog] = useGotoLocationDialog();
  const { isMobile } = useMediaQuery();
  const [draggingLocked, setDraggingLocked] = useState<boolean>(false);
  const [poiSelections, setPoiSelections] = useState<PoiSelections>({
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

  const handlePoiSelectionChange = (value: PoiSelections) => {
    setPoiSelections(value);
  };

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (hike.route.bounds
      && !initialized
    ) {
      try {
        leafletMap.fitBounds(hike.route.bounds);
        const z = leafletMap.getZoom();
        if (z > 13) {
          leafletMap.setZoom(13);
        }
        setInitialized(true);
        leafletMap.fireEvent('moveend');
      }
      catch (error) {
        console.log(error);
      }
    }
  }, [initialized, leafletMap, hike.route.bounds]);

  useEffect(() => {
    if (hike.map) {
      hike.map.setLeafletMap(leafletMap);
    }
  }, [hike.map, leafletMap]);

  const dropWaypoint = (event: L.LeafletMouseEvent) => {
    hike.route.addEndWaypoint(event.latlng);
  };

  const makeContextMenu = useCallback((position: L.LatLng): MenuItem[] => {
    const findSteepestPoint = () => {
      const steepestPoint = hike.route.findSteepestPoint();
    };

    const mapMenuItems: MenuItem[] = [];

    if (hike.route.anchors.length === 0) {
      mapMenuItems.push({
        label: 'Add Waypoint', callback: (latlng: L.LatLng) => hike.route.addStartWaypoint(latlng),
      });
    }
    else if (hike.route.anchors.length === 1) {
      mapMenuItems.splice(
        mapMenuItems.length, 0,
        { label: 'Prepend Waypoint', callback: (latlng: L.LatLng) => hike.route.addStartWaypoint(latlng) },
        { label: 'Append Waypoint', callback: (latlng: L.LatLng) => hike.route.addEndWaypoint(latlng) },
      );
    }
    else {
      mapMenuItems.splice(
        mapMenuItems.length, 0,
        { label: 'Prepend Waypoint', callback: (latlng: L.LatLng) => hike.route.addStartWaypoint(latlng) },
        { label: 'Insert Waypoint', callback: (latlng: L.LatLng) => hike.route.addWaypoint(latlng) },
        { label: 'Append Waypoint', callback: (latlng: L.LatLng) => hike.route.addEndWaypoint(latlng) },
      );
    }

    mapMenuItems.splice(
      mapMenuItems.length, 0,
      { type: 'separator', label: '', callback: () => null },
      { label: 'Add Camp', callback: (latlng: L.LatLng) => hike.addCamp(latlng) },
      { label: 'Add Water', callback: (latlng: L.LatLng) => hike.addWater(latlng) },
      { label: 'Add Resupply', callback: (latlng: L.LatLng) => hike.addResupply(latlng) },
      { label: 'Go to Location...', callback: showGotoLocationDialog },
      { label: 'Find Steepest Point', callback: findSteepestPoint },
    );

    return mapMenuItems;
  }, [hike, showGotoLocationDialog]);

  setMainContextMenu(makeContextMenu);

  const handleLocationPopupClose = () => {
    if (hike.map === null) {
      throw new Error('map in hike is null');
    }

    hike.map.showLocationPopup(null);
  };

  const handleMapClick: L.LeafletMouseEventHandlerFn = (e) => {
    hike.map.setTemporaryMarkerLocation(e.latlng);
    hike.map.clearSelectedMarkers();
  };

  const showIn3D: React.MouseEventHandler = () => {
    uiState.showIn3D(hike.map.temporaryMarkerLocation);
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
            hike.map.temporaryMarkerLocation
              ? (
                <div>
                  <div>{`lat,lng: ${hike.map.temporaryMarkerLocation.lat}, ${hike.map.temporaryMarkerLocation.lng}`}</div>
                  <button type="button" onClick={showIn3D}>View</button>
                </div>
              )
              : null
          }
          <SelectedMarkers markers={hike.map.selectedMarkers} />
          <ElevationChart hike={hike} />
        </div>
      </MapDrawer>
      <Route route={hike.route} />
      <Gpx />
      {
        hike.elevationMarkerPos
          ? (
            <LeafletMarker
              position={hike.elevationMarkerPos}
              icon={hike.elevationMarkerIcon}
            />
          )
          : null
      }
      <Poi selections={poiSelections} />
      {
        hike.map.markers.map((m) => (
          <Marker
            key={`${m.getTypeString()}-${m.id}`}
            marker={m}
            draggingLocked={draggingLocked}
            selections={poiSelections}
          />
        ))
      }
      <GotoLocationDialog leafletMap={leafletMap} hike={hike} />
      {
        locationPopup
          ? (
            <Popup onClose={handleLocationPopupClose} position={locationPopup}>
              { `${locationPopup.lat}, ${locationPopup.lng}`}
            </Popup>
          )
          : null
      }
      {
        hike.map.temporaryMarkerLocation
          ? (
            <LeafletMarker position={hike.map.temporaryMarkerLocation} />
          )
          : null
      }
      <PleaseWait show={hike.map.getWaiting()} />
    </>
  );
};

Map.defaultProps = {
  locationPopup: null,
};

export default observer(Map);
