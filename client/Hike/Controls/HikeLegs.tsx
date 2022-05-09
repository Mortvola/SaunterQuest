import { observer } from 'mobx-react-lite';
import React from 'react';
import { Button } from 'react-bootstrap';
import Select, { OptionProps } from 'react-select';
import { useDeleteConfirmation } from '../../DeleteConfirmation';
import IconButton from '../../IconButton';
import { HikeInterface, HikeLegInterface } from '../state/Types';
import { useHikeLegDialog } from './HikeLegDialog';
import styles from './HikeLegs.module.css';

type OptionValue = {
  value: number,
  label: string,
  leg: HikeLegInterface,
};

const CustomOption = ({ innerProps, isDisabled, data }: OptionProps<OptionValue, false>) => (
  !isDisabled
    ? (
      <div {...innerProps} className={styles.optionWrapper}>
        <div className={styles.optionColor} style={{ backgroundColor: data.leg.color }} />
        <div>
          <div>{data.label}</div>
          <div className={styles.date}>
            {
              data.leg.startDate === null
                ? 'No start date specified'
                : `From ${data.leg.startDate.toISODate()} to ${data.leg.startDate.plus({ days: data.leg.numberOfDays }).toISODate()}`
            }
          </div>
        </div>
      </div>
    )
    : null
);

type PropsType = {
  hike: HikeInterface,
}

const HikeLegs: React.FC<PropsType> = observer(({ hike }) => {
  const [HikeLegDialog, showHikeLegDialog] = useHikeLegDialog();
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this leg?',
    () => {
      if (hike.currentLeg === null) {
        throw new Error('currentLeg is null');
      }

      hike.deleteLeg(hike.currentLeg);
    },
  );

  const handleAddLegClick: React.MouseEventHandler = () => {
    hike.addLeg();
  };

  const handleEditClick = () => {
    showHikeLegDialog();
  };

  const handleLegChange = (item: OptionValue | null) => {
    if (item !== null) {
      hike.setCurrentLeg(item.value);
    }
    else {
      hike.setCurrentLeg(null);
    }
  };

  const options: OptionValue[] = hike.hikeLegs.map((hl) => ({
    value: hl.id,
    label: hl.name ?? hl.id.toString(),
    leg: hl,
  }));

  return (
    <div>
      <Button onClick={handleAddLegClick}>Add Leg</Button>
      <div className={styles.leg}>
        <Select<OptionValue, false>
          onChange={handleLegChange}
          options={options}
          value={
            hike.currentLeg === null
              ? null
              : ({
                value: hike.currentLeg.id,
                label: hike.currentLeg.name ?? hike.currentLeg.id.toString(),
                leg: hike.currentLeg,
              })
          }
          components={{
            Option: CustomOption,
          }}
        />
        <IconButton icon="pencil" onClick={handleEditClick} />
        <IconButton icon="trash" onClick={handleDeleteClick} />
      </div>
      {
        hike.currentLeg
          ? <HikeLegDialog hikeLeg={hike.currentLeg} />
          : null
      }
      <DeleteConfirmation />
    </div>
  );
});

export default HikeLegs;
