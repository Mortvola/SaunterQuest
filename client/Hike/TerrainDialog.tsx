/* eslint-disable react/require-default-props */
import React, { useState, useEffect, ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import useModal, { ModalProps, UseModalType } from '@mortvola/usemodal';
import { LatLng } from '../state/Types';
import Terrain, { Points } from './Terrain';

type PropsType = {
  latLng?: LatLng | null,
}

const TerrainDialog = ({
  show,
  onHide,
  latLng,
}: PropsType & ModalProps): ReactElement => {
  const [terrain, setTerrain] = useState<Points | null>(null);

  useEffect(() => {
    (async () => {
      if (latLng) {
        const response = await fetch(`http://localhost:8090/elevation/area?lat=${latLng.lat}&lng=${latLng.lng}&dim=320`, {
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
    })();
  }, [latLng]);

  return (
    <Modal show={show} onHide={onHide} backdrop="static" role="dialog" size="lg" contentClassName="terrain-content">
      <Modal.Header closeButton>
        3D View
      </Modal.Header>
      <Modal.Body>
        {
          terrain
            ? <Terrain terrain={terrain} />
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
