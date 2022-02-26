import { observer } from 'mobx-react-lite';
import React from 'react';
import ElevationChart from '../Hike/Elevation/ElevationChart';
import { BlogSectionInterface, HikeLegInterface } from '../state/Types';
import styles from './Elevation.module.css';

type PropsType = {
  section: BlogSectionInterface,
  hikeLeg: HikeLegInterface | null,
}

const Elevation: React.FC<PropsType> = observer(({ hikeLeg }) => (
  hikeLeg
    ? (
      <div className={styles.elevationWrapper}>
        <ElevationChart elevations={hikeLeg.route.elevations} />
      </div>
    )
    : null
));

export default Elevation;
