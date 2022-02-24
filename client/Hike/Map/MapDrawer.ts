/* eslint-disable no-underscore-dangle */
import L, { DomEvent } from 'leaflet';
import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { useMap } from 'react-leaflet';
import styles from './MapDrawer.module.css';

class DrawerHandler extends L.Handler {
  container: HTMLDivElement | null = null;

  handle: HTMLDivElement | null = null;

  open = true;

  constructor(map: L.Map) {
    super(map);

    this.container = L.DomUtil.create('div', styles.drawer, map.getContainer());

    const handleContainer = L.DomUtil.create('div', styles.handleContainer, this.container);
    L.DomUtil.create('div', styles.handle, handleContainer);

    const drawerContainer = L.DomUtil.create('div', styles.drawerContainer, this.container);
    drawerContainer.setAttribute('id', 'leaflet-drawer');

    DomEvent.disableClickPropagation(this.container);
    DomEvent.on(this.container, 'wheel', L.DomEvent.stopPropagation);
    DomEvent.on(this.container, 'mousedown', L.DomEvent.stopPropagation);

    DomEvent.on(handleContainer, 'click', this.close, this);
  }

  // eslint-disable-next-line class-methods-use-this
  addHooks() {
    // no code
  }

  // eslint-disable-next-line class-methods-use-this
  removeHooks() {
    // no code
  }

  close() {
    this.open = !this.open;

    if (!this.open) {
      if (this.container) {
        this.container.setAttribute('class', `${styles.drawer} ${styles.closed}`);
      }
    }
    else if (this.container) {
      this.container.setAttribute('class', styles.drawer);
    }
  }
}

type PropsType = {
  children?: ReactNode,
}

const MapDrawer: React.FC<PropsType> = ({
  children,
}) => {
  const [initialized, setInitialized] = React.useState(false);
  const map = useMap();

  if (!initialized) {
    map.addHandler('drawer', DrawerHandler);
    setInitialized(true);
  }

  const portal = document.querySelector('#leaflet-drawer');
  if (portal) {
    return ReactDOM.createPortal(children, portal);
  }

  return null;
};

export default MapDrawer;
