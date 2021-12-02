import { useLeafletContext } from '@react-leaflet/core';
import L, { DomEvent } from 'leaflet';
import {
  FC, ReactNode, useEffect, useRef,
} from 'react';
import ReactDom from 'react-dom';
import styles from './LeafletControl.module.css';

class LeafletControl extends L.Control {
  container: HTMLDivElement | null = null;

  onAdd(map: L.Map) {
    if (!this.container) {
      this.container = L.DomUtil.create(
        'div',
        styles.container,
        map.getContainer(),
      );
    }

    DomEvent.disableClickPropagation(this.container);
    DomEvent.on(this.container, 'click', L.DomEvent.stopPropagation);
    DomEvent.on(this.container, 'mousedown', L.DomEvent.stopPropagation);

    return this.container;
  }

  onRemove() {
    if (this.container) {
      DomEvent.off(this.container, 'click', L.DomEvent.stopPropagation);
      DomEvent.off(this.container, 'mousedown', L.DomEvent.stopPropagation);
    }
  }
}

type ControlPortalProps = {
  position: L.ControlPosition,
  children: ReactNode,
};

const ControlPortal:FC<ControlPortalProps> = ({
  position,
  children,
}) => {
  const context = useLeafletContext();
  const leafletControl = useRef<LeafletControl | null>(null);

  useEffect(() => {
    leafletControl.current = new LeafletControl({ position });
    leafletControl.current.addTo(context.map);

    return () => {
      const control = leafletControl.current;
      if (control) {
        control.remove();
        leafletControl.current = null;
      }
    };
  }, [context.map, position]);

  const control = leafletControl.current;
  if (control) {
    const container = control.getContainer();
    if (container) {
      return ReactDom.createPortal(
        children,
        container,
      );
    }
  }

  return null;
};

export default ControlPortal;
