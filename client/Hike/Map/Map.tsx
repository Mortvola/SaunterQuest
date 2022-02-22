import React, {
  useState, useRef, useEffect, useCallback, FC,
} from 'react';
import 'leaflet.markercluster';
import {
  TileLayer, useMap, Popup, LayersControl, useMapEvents,
  Marker as LeafletMarker,
  Polyline,
} from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import ContextMenu, { MenuItem, showContextMenu, setMainContextMenu } from '@mortvola/leaflet-context-menu';
import Route from './Route';
import { useGotoLocationDialog } from '../GotoLocationDialog';
import Graticule from '../Graticule';
import Hike from '../../state/Hike';
import Marker from './Marker';
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
  hike: Hike,
  locationPopup?: L.LatLng | null,
};

const Map: FC<Props> = ({
  tileServerUrl,
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

  const { currentLeg } = hike;

  if (currentLeg === null) {
    throw new Error('currentLeg is null');
  }

  const handlePoiSelectionChange = (value: PoiSelections) => {
    setPoiSelections(value);
  };

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (currentLeg.route.bounds
      && !initialized
    ) {
      try {
        leafletMap.fitBounds(currentLeg.route.bounds);
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
  }, [currentLeg.route.bounds, initialized, leafletMap]);

  useEffect(() => {
    if (currentLeg.map) {
      currentLeg.map.setLeafletMap(leafletMap);
    }
  }, [currentLeg, leafletMap]);

  const dropWaypoint = (event: L.LeafletMouseEvent) => {
    currentLeg.route.addEndWaypoint(event.latlng);
  };

  const makeContextMenu = useCallback((position: L.LatLng): MenuItem[] => {
    const findSteepestPoint = () => {
      const steepestPoint = currentLeg.route.findSteepestPoint();
    };

    const mapMenuItems: MenuItem[] = [];

    if (currentLeg.route.anchors.length === 0) {
      mapMenuItems.push({
        label: 'Add Waypoint', callback: (latlng: L.LatLng) => currentLeg.route.addStartWaypoint(latlng),
      });
    }
    else if (currentLeg.route.anchors.length === 1) {
      mapMenuItems.splice(
        mapMenuItems.length,
        0,
        { label: 'Prepend Waypoint', callback: (latlng: L.LatLng) => currentLeg.route.addStartWaypoint(latlng) },
        { label: 'Append Waypoint', callback: (latlng: L.LatLng) => currentLeg.route.addEndWaypoint(latlng) },
      );
    }
    else {
      mapMenuItems.splice(
        mapMenuItems.length,
        0,
        { label: 'Prepend Waypoint', callback: (latlng: L.LatLng) => currentLeg.route.addStartWaypoint(latlng) },
        { label: 'Insert Waypoint', callback: (latlng: L.LatLng) => currentLeg.route.addWaypoint(latlng) },
        { label: 'Append Waypoint', callback: (latlng: L.LatLng) => currentLeg.route.addEndWaypoint(latlng) },
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
      { label: 'Find Steepest Point', callback: findSteepestPoint },
    );

    return mapMenuItems;
  }, [currentLeg.route, hike, showGotoLocationDialog]);

  setMainContextMenu(makeContextMenu);

  const handleLocationPopupClose = () => {
    if (currentLeg.map === null) {
      throw new Error('map in hike leg is null');
    }

    currentLeg.map.showLocationPopup(null);
  };

  const handleMapClick: L.LeafletMouseEventHandlerFn = (e) => {
    currentLeg.map.setTemporaryMarkerLocation(e.latlng);
    currentLeg.map.clearSelectedMarkers();
  };

  const showIn3D: React.MouseEventHandler = () => {
    uiState.showIn3D(currentLeg.map.temporaryMarkerLocation);
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
    currentLeg.setElevationMarker(latlng);
  };

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
            currentLeg.map.temporaryMarkerLocation
              ? (
                <div>
                  <div>{`lat,lng: ${currentLeg.map.temporaryMarkerLocation.lat}, ${currentLeg.map.temporaryMarkerLocation.lng}`}</div>
                  <button type="button" onClick={showIn3D}>View</button>
                </div>
              )
              : null
          }
          <SelectedMarkers markers={currentLeg.map.selectedMarkers} />
          {
            currentLeg
              ? (
                <ElevationChart
                  elevations={currentLeg.route.elevations}
                  onElevationMarkerChange={handleElevationMarkerChange}
                />
              )
              : null
          }
        </div>
      </MapDrawer>
      {
        currentLeg
          ? <Route route={currentLeg.route} />
          : null
      }
      {
        hike.routeGroupTrail
          ? <Polyline positions={hike.routeGroupTrail} color="red" />
          : null
      }
      {
        currentLeg && currentLeg.elevationMarkerPos
          ? (
            <LeafletMarker
              position={currentLeg.elevationMarkerPos}
              icon={hike.elevationMarkerIcon}
            />
          )
          : null
      }
      <Poi selections={poiSelections} />
      {
        currentLeg.map.markers.map((m) => (
          <Marker
            key={`${m.getTypeString()}-${m.id}`}
            marker={m}
            draggingLocked={draggingLocked}
            selections={poiSelections}
          />
        ))
      }
      <GotoLocationDialog leafletMap={leafletMap} map={currentLeg.map} />
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
        currentLeg.map.temporaryMarkerLocation
          ? (
            <LeafletMarker position={currentLeg.map.temporaryMarkerLocation} />
          )
          : null
      }
      <PleaseWait show={currentLeg.map.getWaiting()} />
    </>
  );
};

Map.defaultProps = {
  locationPopup: null,
};

export default observer(Map);
