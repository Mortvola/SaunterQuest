import { observer } from 'mobx-react-lite';
import React from 'react';
import ElevationChart from '../../Hike/Elevation/ElevationChart';
import { BlogSectionInterface, HikeLegInterface } from '../../state/Types';

type PropsType = {
  section: BlogSectionInterface,
  hikeLeg: HikeLegInterface | null,
}

const Elevation: React.FC<PropsType> = observer(({ hikeLeg }) => (
  hikeLeg
    ? <ElevationChart elevations={hikeLeg.route.elevations} />
    : null
));

export default Elevation;
