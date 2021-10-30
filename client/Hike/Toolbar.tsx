import React, { ReactElement } from 'react';
import { useStores } from '../state/store';
import EditableText from '../Hikes/EditableText';
import UploadFileButton from './UploadFileButton';
import Hike from '../state/Hike';
import POIToggle from './POIToggle';
import useMediaQuery from '../MediaQuery';
import styles from './Toolbar.module.css';

type PropsType = {
  hike: Hike,
}

const Toolbar = ({
  hike,
}: PropsType): ReactElement | null => {
  const { gpx } = useStores();
  const { addMediaClass } = useMediaQuery();

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;

    if (files && files.length > 0) {
      gpx.loadGpxData(files[0]);
    }
  };

  return (
    <div className={addMediaClass(styles.toolbar)}>
      <EditableText
        defaultValue={hike.name}
        url={hike.id.toString()}
        prop="name"
      />
      <div className="blog-controls">
        <POIToggle type="day" />
        <POIToggle type="waypoint" />
        <POIToggle type="water" />
        <POIToggle type="campsite" />
        <POIToggle type="resupply" />
      </div>
    </div>
  );
};

export default Toolbar;
