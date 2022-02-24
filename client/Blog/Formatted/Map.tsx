import React from 'react';
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet';
import Graticule from '../../Hike/Graticule';
import Route from '../../Hike/Map/Route';
import { HikeLegInterface } from '../../state/Types';
import styles from './Map.module.css';

type PropsType = {
  tileServerUrl: string,
  hikeLeg: HikeLegInterface,
}

const Map: React.FC<PropsType> = ({ tileServerUrl, hikeLeg }) => (
  <MapContainer
    minZoom={4}
    maxZoom={16}
    center={[40, -90]}
    zoom={5}
    className={styles.map}
    whenCreated={
      (map) => {
        if (hikeLeg.route.bounds) {
          map.fitBounds(hikeLeg.route.bounds);
        }
      }
    }
  >
    <LayersControl position="topleft">
      <LayersControl.Overlay checked name="Terrain">
        <TileLayer
          url={`${tileServerUrl}/tile/terrain/{z}/{x}/{y}`}
          zIndex={1}
        />
      </LayersControl.Overlay>
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url={`${tileServerUrl}/tile/detail/{z}/{x}/{y}`}
        zIndex={2}
      />
      <LayersControl.Overlay checked name="Graticule">
        <Graticule />
      </LayersControl.Overlay>
    </LayersControl>
    {
      hikeLeg
        ? <Route route={hikeLeg.route} />
        : null
    }
  </MapContainer>
);

export default Map;
