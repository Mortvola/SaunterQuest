/* eslint-disable react/require-default-props */
import React, { useState, useEffect, ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import useModal, { ModalProps, UseModalType } from '@mortvola/usemodal';
import { LatLng } from '../state/Types';
import Terrain from './Terrain';

type PropsType = {
  latLng?: LatLng | null,
}

const TerrainDialog = ({
  show,
  onHide,
  latLng,
}: PropsType & ModalProps): ReactElement => {
  const [terrain, setTerrain] = useState(null);

  useEffect(() => {
    if (latLng) {
      fetch(`http://localhost:8090/elevation/area?lat=${latLng.lat}&lng=${latLng.lng}&dim=80`, {
        headers: {
          'access-control-allow-origins': '*',
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }

          throw new Error('invalid response');
        })
        .then((response) => {
          setTerrain(response);
        });
    }
  }, []);

  return (
    <Modal show={show} onHide={onHide} role="dialog" size="lg" contentClassName="terrain-content">
      <Modal.Header closeButton>
        3D View
      </Modal.Header>
      <Modal.Body>
        <Terrain points={terrain} />
      </Modal.Body>
    </Modal>
  );
};

export const useTerrainDialog = (): UseModalType<PropsType> => (
  useModal<PropsType>(TerrainDialog)
);

export default TerrainDialog;
