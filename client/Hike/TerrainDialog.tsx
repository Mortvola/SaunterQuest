/* eslint-disable react/require-default-props */
import React, { useState, useEffect, ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import useModal, { ModalProps, UseModalType } from '@mortvola/usemodal';
import { LatLng } from '../state/Types';
import Terrain, { Points } from './Terrain';

type PropsType = {
  latLng?: LatLng | null,
  tileServerUrl: string,
  pathFinderUrl: string,
}

const tile2lng = (x: number, z: number) => (
  (x / (2 ** z)) * 360 - 180
);

const tile2lat = (y: number, z: number) => {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return ((180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
};

const lng2tile = (lon:number, zoom: number) => (
  Math.floor(((lon + 180) / 360) * 2 ** zoom)
);

const lat2tile = (lat: number, zoom: number) => (
  Math.floor(
    ((1 - Math.log(Math.tan(lat * (Math.PI / 180)) + 1 / Math.cos(lat * (Math.PI / 180))) / Math.PI)
      / 2) * 2 ** zoom,
  )
);

const TerrainDialog = ({
  show,
  onHide,
  latLng,
  tileServerUrl,
  pathFinderUrl,
}: PropsType & ModalProps): ReactElement => {
  const [terrain, setTerrain] = useState<Points | null>(null);
  const [location, setLocation] = useState<{ x: number, y: number, zoom: number } | null>(null);

  useEffect(() => {
    (async () => {
      if (latLng) {
        const zoom = 16;
        const x = lng2tile(latLng.lng, zoom);
        const y = lat2tile(latLng.lat, zoom);

        const response = await fetch(`${pathFinderUrl}/elevation/tile/${zoom}/${x}/${y}`, {
          headers: {
            'access-control-allow-origins': '*',
          },
        });

        if (response.ok) {
          const body = await response.json();
          setTerrain(body);

          setLocation({ x, y, zoom });
        }
        else {
          throw new Error('invalid response');
        }
      }
    })();
  }, [latLng, pathFinderUrl, tileServerUrl]);

  return (
    <Modal show={show} onHide={onHide} backdrop="static" role="dialog" size="lg" contentClassName="terrain-content">
      <Modal.Header closeButton>
        3D View
      </Modal.Header>
      <Modal.Body>
        {
          terrain && location
            ? <Terrain terrain={terrain} location={location} tileServerUrl={tileServerUrl} />
            : null
        }
      </Modal.Body>
    </Modal>
  );
};

export const useTerrainDialog = (): UseModalType<PropsType> => (
  useModal<PropsType>(TerrainDialog)
);

export default TerrainDialog;
