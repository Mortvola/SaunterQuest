import React from 'react';
import { observer } from 'mobx-react-lite';
import Select, { OptionProps } from 'react-select';
import { HikeInterface, HikeLegInterface } from '../state/Types';
import styles from './HikeLegSelect.module.css';

export type OptionValue = {
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
  value?: number,
  onChange: (id: number | null) => void,
}

const HikeLegSelect: React.FC<PropsType> = observer(({ hike, value, onChange }) => {
  const options: OptionValue[] = React.useMemo(() => (hike.hikeLegs.map((hl) => ({
    value: hl.id,
    label: hl.name ?? hl.id.toString(),
    leg: hl,
  }))), [hike.hikeLegs]);

  const hikeLeg = React.useMemo(() => (
    hike.hikeLegs.find((leg) => leg.id === value)
  ), [hike.hikeLegs, value]);

  const handleLegChange = (item: OptionValue | null) => {
    onChange(item?.value ?? null);
  };

  return (
    <Select<OptionValue, false>
      onChange={handleLegChange}
      options={options}
      value={
        hikeLeg === undefined
          ? undefined
          : ({
            value: hikeLeg.id,
            label: hikeLeg.name ?? hikeLeg.id.toString(),
            leg: hikeLeg,
          })
      }
      components={{
        Option: CustomOption,
      }}
    />
  );
});

export default HikeLegSelect;
