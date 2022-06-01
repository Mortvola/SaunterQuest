import React from 'react';
import {
  LayersControl, MapContainer, Pane, Polyline, TileLayer,
} from 'react-leaflet';
import L from 'leaflet';
import Graticule from '../Hike/Graticule';
import Route from '../Hike/Map/Route';
import { HikeLegInterface } from '../Hike/state/Types';
import styles from './Map.module.css';
import Markers from './Markers';

type PropsType = {
  tileServerUrl: string,
  hikeLeg: HikeLegInterface,
  onLoaded: () => void,
}

const Map: React.FC<PropsType> = ({ tileServerUrl, hikeLeg, onLoaded }) => {
  const [routeGroupTrail, setRouteGroupTrail] = React.useState<L.LatLng[][] | null>(null);

  React.useEffect(() => {
    (async () => {
      const rg = await hikeLeg.requestRouteGroup();

      setRouteGroupTrail(rg);
    })();
  }, [hikeLeg]);

  return (
    <MapContainer
      minZoom={4}
      maxZoom={16}
      center={[40, -90]}
      zoom={5}
      className={styles.map}
      dragging={!L.Browser.mobile}
      scrollWheelZoom={false}
      whenReady={
        () => {
          onLoaded();
        }
      }
    >
      <LayersControl position="topleft">
        <LayersControl.Overlay checked name="Terrain">
          <TileLayer
            url={`${tileServerUrl}/tile/terrain/{z}/{x}/{y}`}
            subdomains={['tiles1', 'tiles2', 'tiles3']}
            zIndex={1}
          />
        </LayersControl.Overlay>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url={`${tileServerUrl}/tile/detail/{z}/{x}/{y}`}
          subdomains={['tiles1', 'tiles2', 'tiles3']}
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
      <Pane name="routeGroupTrail" style={{ zIndex: 250 }}>
        {
          routeGroupTrail
            ? <Polyline positions={routeGroupTrail} color="red" />
            : null
        }
      </Pane>
      <Markers hikeLeg={hikeLeg} />
    </MapContainer>
  );
};

export default Map;
