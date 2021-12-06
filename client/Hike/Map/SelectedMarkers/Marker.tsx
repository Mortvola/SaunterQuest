import React from 'react';
import IconButton from '../../../IconButton';
import { PointOfInterestInterface } from '../../../state/Types';
import styles from './Marker.module.css';

type PropsType = {
  marker: PointOfInterestInterface,
}

const Marker: React.FC<PropsType> = ({ marker }) => {
  const handleClick = () => {
    marker.marker.delete();
  };

  const icon = marker.getIcon();

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
      {
        marker.marker.deletable
          ? <IconButton icon="trash" onClick={handleClick} />
          : null
      }
    </div>
  );
};

export default Marker;
