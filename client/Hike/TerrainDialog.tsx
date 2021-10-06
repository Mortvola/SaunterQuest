/* eslint-disable react/require-default-props */
import React, { ReactElement } from 'react';
import { Modal } from 'react-bootstrap';
import { makeUseModal, ModalProps } from '@mortvola/usemodal';
import { LatLng } from '../state/Types';
import Terrain from './Terrain';

type PropsType = {
  latLng: LatLng,
  tileServerUrl: string,
  pathFinderUrl: string,
}

const TerrainDialog = ({
  latLng,
  tileServerUrl,
  pathFinderUrl,
}: PropsType & ModalProps): ReactElement => (
  <>
    <Modal.Header closeButton>
      3D View
    </Modal.Header>
    <Modal.Body>
      <Terrain
        position={latLng}
        tileServerUrl={tileServerUrl}
        pathFinderUrl={pathFinderUrl}
      />
    </Modal.Body>
  </>
);

export const useTerrainDialog = makeUseModal<PropsType>(
  TerrainDialog,
  {
    size: 'lg',
    scrollable: false,
    backdrop: 'static',
  },
);

export default TerrainDialog;
