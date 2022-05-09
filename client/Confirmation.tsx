import React, { ReactElement, ReactNode, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

type ConfirmType = 'YesNo' | 'Delete';

type Props = {
  type: ConfirmType,
  onConfirm: () => void;
  children: ReactNode;
}

const Confirmation = ({
  type,
  onConfirm,
  onHide,
  show,
  children,
}: Props & ConfirmProps): ReactElement => (
  <Modal onHide={onHide} show={show}>
    <Modal.Header closeButton>
      <Modal.Title>
        {
          type === 'Delete'
            ? 'Delete Confirmation'
            : 'Confirmation'
        }
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>{children}</p>
    </Modal.Body>
    <Modal.Footer>
      {
        type === 'Delete'
          ? (
            <>
              <Button variant="secondary" onClick={onHide}>Cancel</Button>
              <Button variant="danger" onClick={onConfirm}>Delete</Button>
            </>
          )
          : (
            <>
              <Button variant="secondary" onClick={onHide}>No</Button>
              <Button onClick={onConfirm}>Yes</Button>
            </>
          )
      }
    </Modal.Footer>
  </Modal>
);

type HandleConfirmClick = (() => void);
type OnConfirm = (() => void);

type ConfirmProps = {
  show: boolean;
  onHide: () => void;
}

function useConfirmation<T>(
  type: ConfirmType,
  children: ReactNode,
  onConfirm: OnConfirm,
): [(props: T) => ReactElement | null, HandleConfirmClick] {
  const [confirm, setConfirm] = useState(false);

  const handleConfirmClick = () => {
    setConfirm(true);
  };

  const handleHide = () => {
    setConfirm(false);
  };

  const handleConfirm = () => {
    onConfirm();
    handleHide();
  };

  const createConfirmation = () => (
    <Confirmation
      type={type}
      show={confirm}
      onHide={handleHide}
      onConfirm={handleConfirm}
    >
      {children}
    </Confirmation>
  );

  return [
    createConfirmation,
    handleConfirmClick,
  ];
}

export default Confirmation;
export { useConfirmation };
