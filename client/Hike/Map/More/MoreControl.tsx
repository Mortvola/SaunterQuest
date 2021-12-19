/* eslint-disable jsx-a11y/label-has-associated-control */
import L, { DomEvent } from 'leaflet';
import React, {
  FC, useEffect, useState,
} from 'react';
import { useMap } from 'react-leaflet';
import ExifParser from 'exif-parser';
import Http from '@mortvola/http';
import LeafletControl from '../LeafletControl';
import MoreItem from './MoreItem';
import PoiSelector, { PoiSelections, OnSelectionCallback } from './PoiSelector';
import styles from './MoreControl.module.css';
import { useHikeDialog } from '../../HikeSettingsDialog';
import { HikeInterface } from '../../../state/Types';
import Checkbox from './Checkbox';
import UploadFileButton from '../../UploadFileButton';

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
    const handleClickEvent = (event: L.LeafletEvent) => {
      collapse();
      DomEvent.stop(event);
    };

    map.on('click', handleClickEvent);

    return () => {
      map.off('click', handleClickEvent);
    };
  }, [map]);

  const handleFileSelection: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const toBinaryString = (bytes: Uint8Array) => {
      let result = '';
      for (let i = 0; i < bytes.length; i += 1) {
        result += String.fromCharCode(bytes[i]);
      }

      return result;
    };

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && e.target.result !== null && typeof e.target.result !== 'string') {
          const exifParser = ExifParser.create(e.target.result);
          const result = exifParser.parse();
          const tmp = new Uint8Array(e.target.result);
          const encodedPicture = btoa(toBinaryString(tmp));

          const response = await Http.post(`/api/hike/${hike.id}/photo-upload`, {
            lat: result.tags.GPSLatitude,
            lng: result.tags.GPSLongitude,
            data: encodedPicture,
          });

          if (response.ok) {
            hike.map.setTemporaryMarkerLocation(
              new L.LatLng(result.tags.GPSLatitude, result.tags.GPSLongitude),
            );
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

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
                  <UploadFileButton
                    onFileSelection={handleFileSelection}
                    label="Upload Photo"
                  />
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
