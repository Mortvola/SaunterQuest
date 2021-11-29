import React, {
  useState, useRef, useEffect, useCallback, FC,
} from 'react';
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
import { LatLng } from '../../state/Types';
import Marker from './Marker';
import Gpx from '../Gpx';
import Campsites from '../PointsOfInterest/Campsites';
import PostOffices from '../PointsOfInterest/PostOffices';
import Cities from '../PointsOfInterest/Cities';
import useMediaQuery from '../../MediaQuery';
import MapDrawer from './MapDrawer';
import ElevationChart from '../Elevation/ElevationChart';
import DragToggleControl from './DragToggle';
import { PoiSelections } from './More/PoiSelector';
import MoreControl from './More/MoreControl';
import PleaseWait from '../../Hikes/PleaseWait';
import styles from './Map.module.css';
import { useStores } from '../../state/store';
import MarkerCluster from '../MarkerCluster';
import SelectedMarkers from './SelectedMarkers/Markers';

type Props = {
  tileServerUrl: string;
  pathFinderUrl: string;
  hike: Hike,
  locationPopup?: LatLng | null,
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
    water: true,
    resupply: true,
    day: true,
    postOffices: true,
    cities: true,
  });
  const [temporaryMarkerLocation, setTemporaryMarkerLocation] = useState<L.LatLng | null>(null);

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

  const makeContextMenu = useCallback((position: LatLng): MenuItem[] => {
    const findSteepestPoint = () => {
      const steepestPoint = hike.route.findSteepestPoint();
    };

    const mapMenuItems: MenuItem[] = [];

    if (hike.route.anchors.length === 0) {
      mapMenuItems.push({
        label: 'Add Waypoint', callback: (latlng: LatLng) => hike.route.addStartWaypoint(latlng),
      });
    }
    else if (hike.route.anchors.length === 1) {
      mapMenuItems.splice(
        mapMenuItems.length, 0,
        { label: 'Prepend Waypoint', callback: (latlng: LatLng) => hike.route.addStartWaypoint(latlng) },
        { label: 'Append Waypoint', callback: (latlng: LatLng) => hike.route.addEndWaypoint(latlng) },
      );
    }
    else {
      mapMenuItems.splice(
        mapMenuItems.length, 0,
        { label: 'Prepend Waypoint', callback: (latlng: LatLng) => hike.route.addStartWaypoint(latlng) },
        { label: 'Insert Waypoint', callback: (latlng: LatLng) => hike.route.addWaypoint(latlng) },
        { label: 'Append Waypoint', callback: (latlng: LatLng) => hike.route.addEndWaypoint(latlng) },
      );
    }

    mapMenuItems.splice(
      mapMenuItems.length, 0,
      { type: 'separator', label: '', callback: () => null },
      { label: 'Add Camp', callback: (latlng: LatLng) => hike.addCamp(latlng) },
      { label: 'Add Water', callback: (latlng: LatLng) => hike.addWater(latlng) },
      { label: 'Add Resupply', callback: (latlng: LatLng) => hike.addResupply(latlng) },
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
    setTemporaryMarkerLocation(e.latlng);
    uiState.setSelectedMarker(null);
  };

  const showIn3D: React.MouseEventHandler = () => {
    runInAction(() => {
      uiState.location3d = temporaryMarkerLocation;
      uiState.show3D = true;
    });
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
            temporaryMarkerLocation
              ? (
                <div>
                  <div>{`lat,lng: ${temporaryMarkerLocation.lat}, ${temporaryMarkerLocation.lng}`}</div>
                  <button type="button" onClick={showIn3D}>Show in 3D</button>
                </div>
              )
              : null
          }
          <SelectedMarkers markers={uiState.selectedMarkers} />
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
      <MarkerCluster>
        <Campsites show={poiSelections.campsites} />
        <PostOffices show={poiSelections.postOffices} />
        <Cities show={poiSelections.cities} />
      </MarkerCluster>
      {
        hike.map.markers.map((m) => (
          <Marker
            key={`${m.latLng.lat},${m.latLng.lng}`}
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
        temporaryMarkerLocation
          ? (
            <LeafletMarker position={temporaryMarkerLocation} />
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
