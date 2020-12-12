import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import useModal from '../Modal';
import Terrain from './Terrain';

const TerrainDialog = ({
  show,
  onHide,
  latLng,
}) => {
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

TerrainDialog.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  latLng: PropTypes.shape(),
};

TerrainDialog.defaultProps = {
  latLng: null,
};

const useTerrainDialog = () => (
  useModal(TerrainDialog)
);

export default TerrainDialog;
export { useTerrainDialog };
