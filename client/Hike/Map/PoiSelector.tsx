/* eslint-disable jsx-a11y/label-has-associated-control */
import { useLeafletContext } from '@react-leaflet/core';
import L, { DomEvent } from 'leaflet';
import React, { FC, useEffect, useState } from 'react';
import ReactDom from 'react-dom';
import { useMap } from 'react-leaflet';
import styles from './PoiSelector.module.css';

class PoiSelector extends L.Control {
  container: HTMLDivElement | null = null;

  // eslint-disable-next-line class-methods-use-this
  onAdd(map: L.Map) {
    if (!this.container) {
      this.container = L.DomUtil.create(
        'div',
        styles.container,
        map.getContainer(),
      );
    }

    DomEvent.disableClickPropagation(this.container);
    DomEvent.on(this.container, 'click', L.DomEvent.stop);
    DomEvent.on(this.container, 'mousedown', L.DomEvent.stopPropagation);

    return this.container;
  }

  // eslint-disable-next-line class-methods-use-this
  onRemove() {
    // Nothing to do here
  }
}

let selector: PoiSelector | null = null;

type PoiItemProps = {
  name?: string,
  label: string,
  checked?: boolean,
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
}

const PoiItem: FC<PoiItemProps> = ({
  name, label, checked = false, onChange,
}) => (
  <label>
    {
      // hack: to get checkbox to re-render I resorted to using
      // a key that mutates based on checked state
    }
    <input key={`${name}-${checked}`} type="checkbox" name={name} checked={checked} onChange={onChange} />
    {label}
  </label>
);

export type PoiSelections = {
  waypoints: boolean,
  campsites: boolean,
  water: boolean,
  resupply: boolean,
  day: boolean,
}

type OnSelectionCallback = (selections: PoiSelections) => void;

type SelectListProps = {
  selections: PoiSelections,
  onChange: OnSelectionCallback,
}

const SelectList: FC<SelectListProps> = ({
  selections,
  onChange,
}) => {
  const map = useMap();
  const [expanded, setExpanded] = useState<boolean>(false);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange({ ...selections, [event.target.name]: event.target.checked });
  };

  const handleExpandClick = () => {
    setExpanded((prev) => !prev);
  };

  const collapse = () => {
    setExpanded(false);
  };

  useEffect(() => {
    map.on('click', collapse);

    return () => {
      map.off('click', collapse);
    };
  }, [map]);

  if (expanded) {
    return (
      <div
        className={styles.selector}
      >
        <PoiItem name="waypoints" label="Waypoints" checked={selections.waypoints} onChange={handleChange} />
        <PoiItem name="campsites" label="Campsites" checked={selections.campsites} onChange={handleChange} />
        <PoiItem name="water" label="Water" checked={selections.water} onChange={handleChange} />
        <PoiItem name="resupply" label="Resupply" checked={selections.resupply} onChange={handleChange} />
        <PoiItem name="day" label="Day" checked={selections.day} onChange={handleChange} />
      </div>
    );
  }

  return (
    <div className={styles.control} onClick={handleExpandClick} />
  );
};

type PropsType = {
  onChange: OnSelectionCallback,
  selections: PoiSelections,
}

const PoiSelectorControl:FC<L.ControlOptions & PropsType> = ({
  onChange,
  selections,
  ...props
}) => {
  const context = useLeafletContext();

  useEffect(() => {
    if (!selector) {
      selector = new PoiSelector(props);
    }

    selector.addTo(context.map);

    return () => {
      if (selector) {
        selector.remove();
      }
    };
  }, [context.map, props]);

  if (selector) {
    const container = selector.getContainer();
    if (container) {
      return ReactDom.createPortal(
        <SelectList selections={selections} onChange={onChange} />,
        container,
      );
    }
  }

  return null;
};

export default PoiSelectorControl;
