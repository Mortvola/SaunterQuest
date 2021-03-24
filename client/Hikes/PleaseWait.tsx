import React, { ReactElement } from 'react';

type PropsType = {
  show: boolean;
}

const PleaseWait = ({
  show,
}: PropsType): ReactElement | null => {
  if (show) {
    return (
      <div className="map-please-wait">
        <div className="map-please-wait-spinner" />
      </div>
    );
  }

  return null;
};

export default PleaseWait;
