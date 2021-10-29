import { useLeafletContext } from '@react-leaflet/core';
import L, { DomEvent } from 'leaflet';
import { FC, useEffect } from 'react';
import styles from './DragToggle.module.css';

type OnToggleCallback = (locked: boolean) => void;

class DragToggle extends L.Control {
  locked = false;

  container: HTMLDivElement | null = null;

  #onToggle: OnToggleCallback;

  constructor(props: L.ControlOptions, defaultValue: boolean, onToggle: OnToggleCallback) {
    super(props);

    this.locked = defaultValue;
    this.#onToggle = onToggle;
  }

  // eslint-disable-next-line class-methods-use-this
  onAdd(map: L.Map) {
    this.container = L.DomUtil.create(
      'div',
      this.#getStyle(styles.dragToggle),
      map.getContainer(),
    );

    DomEvent.disableClickPropagation(this.container);
    DomEvent.on(this.container, 'click', L.DomEvent.stop);
    DomEvent.on(this.container, 'click', this.#toggle, this);

    DomEvent.on(this.container, 'mousedown', L.DomEvent.stopPropagation);

    return this.container;
  }

  // eslint-disable-next-line class-methods-use-this
  onRemove() {
    // Nothing to do here
  }

  #toggle() {
    this.locked = !this.locked;

    if (this.container) {
      const classes = this.container.getAttribute('class');
      this.container.setAttribute('class', this.#getStyle(classes));
    }

    this.#onToggle(this.locked);
  }

  #getStyle(classes: string | null): string {
    let newClasses = classes ?? '';

    if (this.locked) {
      newClasses = newClasses.replace(styles.unlocked, '');
    }
    else if (!newClasses.includes(styles.unlocked)) {
      newClasses += ` ${styles.unlocked}`;
    }

    return newClasses;
  }
}

let dragToggle: DragToggle | null = null;

type PropsType = {
  defaultValue?: boolean,
  onLockToggle: OnToggleCallback,
}

const DragToggleControl:FC<L.ControlOptions & PropsType> = ({
  defaultValue = false,
  onLockToggle,
  ...props
}) => {
  const context = useLeafletContext();

  useEffect(() => {
    if (!dragToggle) {
      dragToggle = new DragToggle(props, defaultValue, onLockToggle);
      dragToggle.addTo(context.map);
    }
  });

  return null;
};

export default DragToggleControl;
