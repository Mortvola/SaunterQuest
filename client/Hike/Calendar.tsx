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
  type Event = {
    title: string | null,
    start?: Date,
    end?: Date,
    allDay: boolean,
    color: string,
  };

  const events = React.useMemo(() => (
    hikeLegs
      .filter((hl) => hl.startDate !== null)
      .map<Event>((hl) => ({
        title: hl.name,
        start: hl.startDate?.toJSDate(),
        end: hl.startDate?.plus({ days: hl.numberOfDays }).toJSDate(),
        allDay: true,
        color: hl.color,
      }))
  ), [hikeLegs]);

  const eventPropGetter = React.useCallback((event: Event) => ({
    style: {
      backgroundColor: event.color,
    }
  }), []);

  return (
    <ReactCalendar
      localizer={localizer}
      events={events}
      views={[Views.MONTH]}
      style={{ backgroundColor: 'white', ...style }}
      eventPropGetter={eventPropGetter}
    />
  )
});

export default Calendar;
