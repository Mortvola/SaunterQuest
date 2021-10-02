/* eslint-disable react/require-default-props */
import React, { useState, useEffect, ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import useModal, { ModalProps, UseModalType } from '@mortvola/usemodal';
import { LatLng } from '../state/Types';
import Terrain from './Terrain';
import { Points } from '../ResponseTypes';

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

type PropsType = {
  latLng: LatLng,
  tileServerUrl: string,
  pathFinderUrl: string,
}

const TerrainDialog = ({
  show,
  onHide,
  latLng,
  tileServerUrl,
  pathFinderUrl,
}: PropsType & ModalProps): ReactElement => {
  const [terrain, setTerrain] = useState<Points | null>(null);
  const [elevation, setElevation] = useState<{ ele: number } | null>(null);

  const zoom = 13;
  const x = lng2tile(latLng.lng, zoom);
  const y = lat2tile(latLng.lat, zoom);

  const location = { x, y, zoom };

  useEffect(() => {
    (async () => {
      if (latLng) {
        {
          const response = await fetch(`${pathFinderUrl}/elevation/tile/${zoom}/${x}/${y}`, {
            headers: {
              'access-control-allow-origins': '*',
            },
          });

          if (response.ok) {
            const body = await response.json();
            setTerrain(body);
          }
          else {
            throw new Error('invalid response');
          }
        }

        {
          const response = await fetch(`${pathFinderUrl}/elevation/point?lat=${latLng.lat}&lng=${latLng.lng}`);

          if (response.ok) {
            const body = await response.json();
            setElevation(body);
          }
          else {
            throw new Error('invalid response');
          }
        }
      }
    })();
  }, [latLng, pathFinderUrl, tileServerUrl, x, y]);

  return (
    <Modal show={show} onHide={onHide} backdrop="static" role="dialog" size="lg" contentClassName="terrain-content">
      <Modal.Header closeButton>
        3D View
      </Modal.Header>
      <Modal.Body>
        {
          terrain && elevation !== null
            ? (
              <Terrain
                position={latLng}
                elevation={elevation.ele}
                terrain={terrain}
                location={location}
                tileServerUrl={tileServerUrl}
              />
            )
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
