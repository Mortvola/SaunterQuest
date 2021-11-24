/* eslint-disable jsx-a11y/label-has-associated-control */
import L from 'leaflet';
import React, {
  FC, useEffect, useState,
} from 'react';
import { useMap } from 'react-leaflet';
import LeafletControl from '../LeafletControl';
import MoreItem from './MoreItem';
import PoiSelector from './PoiSelector';
import styles from './MoreControl.module.css';
import { useHikeDialog } from '../../HikeSettingsDialog';
import { HikeInterface } from '../../../state/Types';
import Checkbox from './Checkbox';

export type PoiSelections = {
  waypoints: boolean,
  campsites: boolean,
  water: boolean,
  resupply: boolean,
  day: boolean,
}

type OnSelectionCallback = (selections: PoiSelections) => void;

type PropsType = {
  hike: HikeInterface,
  selections: PoiSelections,
  onChange: OnSelectionCallback,
  position: L.ControlPosition,
}

const MoreControl: FC<PropsType> = ({
  hike,
  selections,
  onChange,
  position,
}) => {
  const map = useMap();
  const [expanded, setExpanded] = useState<boolean>(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [HikeDialog, showHikeDialog] = useHikeDialog();
  const [steepness, setSteepness] = useState<boolean>(false);

  const handleExpandClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    setExpanded((prev) => !prev);
    event.stopPropagation();
  };

  const toggleExpandedItem = (name: string) => {
    setExpandedItem((prev) => {
      if (prev === name) {
        return null;
      }

      return name;
    });
  };

  const stopPropagation: React.MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation();
  };

  const collapse = () => {
    setExpanded(false);
  };

  const handleSettingsClick = () => {
    showHikeDialog();
    collapse();
  };

  const handleSteepnessChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    if (event.target.checked) {
      hike.route.generateGradeSegments();
    }

    setSteepness(event.target.checked);
  };

  useEffect(() => {
    map.on('click', collapse);

    return () => {
      map.off('click', collapse);
    };
  }, [map]);

  return (
    <>
      <LeafletControl position={position}>
        <div className={styles.control} onClick={handleExpandClick}>
          {
            expanded
              ? (
                <div className={styles.menu} onClick={stopPropagation}>
                  <MoreItem label="Points of Intererest >" expanded={expandedItem === 'poi'} onClick={() => toggleExpandedItem('poi')}>
                    <PoiSelector selections={selections} onChange={onChange} />
                  </MoreItem>
                  <MoreItem label="Settings..." onClick={handleSettingsClick} />
                  <Checkbox name="grade" label="Grade" checked={steepness} onChange={handleSteepnessChange} />
                </div>
              )
              : null
          }
        </div>
      </LeafletControl>
      <HikeDialog hike={hike} />
    </>
  );
};

export default MoreControl;
