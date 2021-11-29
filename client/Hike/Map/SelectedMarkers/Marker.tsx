import React from 'react';
import IconButton from '../../../IconButton';
import { MarkerInterface } from '../../../state/Types';
import styles from './Marker.module.css';

type PropsType = {
  marker: MarkerInterface,
}

const Marker: React.FC<PropsType> = ({ marker }) => {
  const handleClick = () => {
    marker.delete();
  };

  const getTypeString = () => {
    switch (marker.type) {
      case 'campsite':
        return 'Campsite';

      case 'day':
        return 'Day';

      case 'finish':
        return 'Finish';

      case 'start':
        return 'Start';

      case 'resupply':
        return 'Resupply';

      case 'water':
        return 'Water';

      case 'waypoint':
        return 'Waypoint';

      case 'city':
        return 'City';

      case 'postoffice':
        return 'Post Office';

      default:
        return 'Unknown';
    }
  };

  return (
    <div className={styles.attribute}>
      <div>{getTypeString()}</div>
      <div>{`lat,lng: ${marker.latLng.lat}, ${marker.latLng.lng}`}</div>
      {
        marker.deletable
          ? <IconButton icon="trash" onClick={handleClick} />
          : null
      }
    </div>
  );
};

export default Marker;
