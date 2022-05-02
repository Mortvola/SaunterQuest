import React from 'react';
import { observer } from 'mobx-react-lite';
import { Calendar as ReactCalendar, luxonLocalizer, Views } from 'react-big-calendar';
import { HikeLegInterface } from './state/Types';
import { DateTime } from 'luxon';

const localizer = luxonLocalizer(DateTime);

type PropsType = {
  hikeLegs: HikeLegInterface[],
  style?: React.CSSProperties,
}

const Calendar: React.FC<PropsType> = observer(({
  hikeLegs,
  style,
}) => {
  const events = React.useMemo(() => (
    hikeLegs
      .filter((hl) => hl.startDate !== null)
      .map((hl) => ({
        title: hl.name,
        start: hl.startDate?.toJSDate(),
        end: hl.startDate?.plus({ days: hl.numberOfDays }).toJSDate(),
        allDay: true,
      }))
  ), [hikeLegs]);

  return (
    <ReactCalendar
      localizer={localizer}
      events={events}
      views={[Views.MONTH]}
      style={{ backgroundColor: 'white', ...style }}
    />
  )
});

export default Calendar;
