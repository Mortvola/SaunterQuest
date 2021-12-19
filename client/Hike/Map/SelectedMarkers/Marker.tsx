import React from 'react';
import L from 'leaflet';
import IconButton from '../../../IconButton';
import { useStores } from '../../../state/store';
import { PointOfInterestInterface } from '../../../state/Types';
import styles from './Marker.module.css';

type PropsType = {
  marker: PointOfInterestInterface,
}

const Marker: React.FC<PropsType> = ({ marker }) => {
  const { uiState } = useStores();
  const handleClick = () => {
    marker.marker.delete();
  };

  const icon = marker.getIcon();

  const showIn3D: React.MouseEventHandler = () => {
    uiState.showIn3D(new L.LatLng(marker.marker.latLng.lat, marker.marker.latLng.lng));
  };

  return (
    <div className={styles.attribute}>
      {
        icon
          ? <img src={icon} alt={marker.getTypeString()} />
          : <div />
      }
      <div>
        <div>{marker.name}</div>
        <div>{`lat,lng: ${marker.marker.latLng.lat}, ${marker.marker.latLng.lng}`}</div>
      </div>
      <button type="button" onClick={showIn3D}>Show in 3D</button>
      {
        marker.marker.deletable
          ? <IconButton icon="trash" onClick={handleClick} />
          : null
      }
    </div>
  );
};

export default Marker;
