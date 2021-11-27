import React from 'react';
import IconButton from '../../../IconButton';
import { MarkerAttributeInterface } from '../../../state/Types';
import styles from './MarkerAttribute.module.css';

type PropsType = {
  attribute: MarkerAttributeInterface,
}

const MarkerAttribute: React.FC<PropsType> = ({ attribute }) => {
  const handleClick = () => {
    attribute.delete();
  };

  const getTypeString = () => {
    switch (attribute.type) {
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

      default:
        return 'Unknown';
    }
  };

  return (
    <div className={styles.attribute}>
      <div>{getTypeString()}</div>
      <div>{`lat,lng: ${attribute.latLng.lat}, ${attribute.latLng.lng}`}</div>
      {
        attribute.deletable
          ? <IconButton icon="trash" onClick={handleClick} />
          : null
      }
    </div>
  );
};

export default MarkerAttribute;
