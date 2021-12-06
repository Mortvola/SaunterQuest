import React from 'react';
import Checkbox from './Checkbox';
import styles from './PoiSelector.module.css';

export type PoiSelections = {
  waypoints: boolean,
  campsites: boolean,
  rvSites: boolean,
  water: boolean,
  resupply: boolean,
  day: boolean,
  postOffices: boolean,
  cities: boolean,
}

export type OnSelectionCallback = (selections: PoiSelections) => void;

type SelectListProps = {
  selections: PoiSelections,
  onChange: OnSelectionCallback,
}

const PoiSelector: React.FC<SelectListProps> = ({
  selections,
  onChange,
}) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange({ ...selections, [event.target.name]: event.target.checked });
  };

  const stopPropagation: React.MouseEventHandler = (event) => {
    event.stopPropagation();
  };

  return (
    <div className={styles.selector} onClick={stopPropagation}>
      <Checkbox name="waypoints" label="Waypoints" checked={selections.waypoints} onChange={handleChange} />
      <Checkbox name="campsites" label="Campsites" checked={selections.campsites} onChange={handleChange} />
      <Checkbox name="rvSites" label="RV Sites" checked={selections.rvSites} onChange={handleChange} />
      <Checkbox name="water" label="Water" checked={selections.water} onChange={handleChange} />
      <Checkbox name="resupply" label="Resupply" checked={selections.resupply} onChange={handleChange} />
      <Checkbox name="day" label="Day" checked={selections.day} onChange={handleChange} />
      <Checkbox name="postOffices" label="Post Offices" checked={selections.postOffices} onChange={handleChange} />
      <Checkbox name="cities" label="Cities" checked={selections.cities} onChange={handleChange} />
    </div>
  );
};

export default PoiSelector;
