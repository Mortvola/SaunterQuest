import React, {
  useState, useRef, ReactElement, useEffect, useCallback,
} from 'react';
import {
  TileLayer,
  useMap,
  Popup,
  LayersControl,
  useMapEvents,
  Marker as LeafletMarker,
} from 'react-leaflet';
import { observer } from 'mobx-react-lite';
import useContextMenu, { MenuItemTypes } from '@mortvola/leaflet-context-menu';
import Route from './Route';
import { useGotoLocationDialog } from './GotoLocationDialog';
import { useTerrainDialog } from './TerrainDialog';
import Graticule from './Graticule';
import Hike from '../state/Hike';
import { LatLng } from '../state/Types';
import Marker from './Marker';
import Gpx from './Gpx';

type Props = {
  tileServerUrl: string;
  hike: Hike,
  locationPopup?: LatLng | null,
};

const Map = ({
  tileServerUrl,
  hike,
  locationPopup,
}: Props): ReactElement => {
  const leafletMap = useMap();
  const terrainLayer = useRef(null);
  const detailLayer = useRef(null);
  const [GotoLocationDialog, showGotoLocationDialog] = useGotoLocationDialog();
  const [TerrainDialog, showTerrainDialog] = useTerrainDialog();
  const [latLng, setLatLng] = useState<LatLng | null>(null);

  useEffect(() => {
    if (hike.map) {
      hike.map.setLeafletMap(leafletMap);
    }
  }, [hike.map, leafletMap]);

  const makeContextMenu = useCallback((event: L.LeafletMouseEvent) => {
    const findSteepestPoint = () => {
      const steepestPoint = hike.route.findSteepestPoint();
      console.log(JSON.stringify(steepestPoint));
    };

    const mapMenuItems: Array<MenuItemTypes> = [];

    if (hike.route.anchors.length === 0) {
      mapMenuItems.push({
        label: 'Add Waypoint', callback: ({ latlng }: L.LeafletMouseEvent) => hike.route.addStartWaypoint(latlng),
      });
    }
    else if (hike.route.anchors.length === 1) {
      mapMenuItems.splice(
        mapMenuItems.length, 0,
        { label: 'Prepend Waypoint', callback: ({ latlng }: L.LeafletMouseEvent) => hike.route.addStartWaypoint(latlng) },
        { label: 'Append Waypoint', callback: ({ latlng }: L.LeafletMouseEvent) => hike.route.addEndWaypoint(latlng) },
      );
    }
    else {
      mapMenuItems.splice(
        mapMenuItems.length, 0,
        { label: 'Prepend Waypoint', callback: ({ latlng }: L.LeafletMouseEvent) => hike.route.addStartWaypoint(latlng) },
        { label: 'Insert Waypoint', callback: ({ latlng }: L.LeafletMouseEvent) => hike.route.addWaypoint(latlng) },
        { label: 'Append Waypoint', callback: ({ latlng }: L.LeafletMouseEvent) => hike.route.addEndWaypoint(latlng) },
      );
    }

    mapMenuItems.splice(
      mapMenuItems.length, 0,
      { type: 'separator' },
      { label: 'Add Camp', callback: ({ latlng }: L.LeafletMouseEvent) => hike.addCamp(latlng) },
      { label: 'Add Water', callback: ({ latlng }: L.LeafletMouseEvent) => hike.addWater(latlng) },
      { label: 'Add Resupply', callback: ({ latlng }: L.LeafletMouseEvent) => hike.addResupply(latlng) },
      {
        label: 'Show Location in 3D',
        callback: (e: L.LeafletMouseEvent) => {
          setLatLng(e.latlng);
          showTerrainDialog();
        },
      },
      { label: 'Go to Location...', callback: showGotoLocationDialog },
      { label: 'Find Steepest Point', callback: findSteepestPoint },
    );

    return mapMenuItems;
  }, [hike, showGotoLocationDialog, showTerrainDialog]);

  const [ContextMenu, showContextMenu] = useContextMenu('main', makeContextMenu);

  const handleLocationPopupClose = () => {
    if (hike.map === null) {
      throw new Error('map in hike is null');
    }

    hike.map.showLocationPopup(null);
  };

  useMapEvents({
    contextmenu: showContextMenu,
  });

  return (
    <>
      <LayersControl position="topleft">
        <ContextMenu />
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
      <Route route={hike.route} />
      {
        hike.map.markers.map((m) => (
          <Marker key={`${m.latLng.lat},${m.latLng.lng}`} marker={m} />
        ))
      }
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
      <TerrainDialog latLng={latLng} />
    </>
  );
};

Map.defaultProps = {
  locationPopup: null,
};

export default observer(Map);
