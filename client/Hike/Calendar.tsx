import React from 'react';
import { observer } from 'mobx-react-lite';
import { Calendar as ReactCalendar, luxonLocalizer, Views } from 'react-big-calendar';
import { HikeInterface, HikeLegInterface } from './state/Types';
import { DateTime } from 'luxon';

const localizer = luxonLocalizer(DateTime);

type PropsType = {
  hike: HikeInterface,
  style?: React.CSSProperties,
}

const Calendar: React.FC<PropsType> = observer(({
  hike,
  style,
}) => {
  type Event = {
    title: string | null,
    start?: Date,
    end?: Date,
    allDay: boolean,
    color: string,
    leg: HikeLegInterface,
  };

  const events = React.useMemo(() => (
    hike.hikeLegs
      .filter((hl) => hl.startDate !== null)
      .map<Event>((hl) => ({
        title: hl.name,
        start: hl.startDate?.toJSDate(),
        end: hl.startDate?.plus({ days: hl.numberOfDays }).toJSDate(),
        allDay: true,
        color: hl.color,
        leg: hl,
      }))
  ), [hike.hikeLegs]);

  const selected = React.useMemo(() => (
    events.find((e) => e.leg === hike.currentLeg)
  ), [hike.currentLeg]);

  const eventPropGetter = React.useCallback((
    event: Event,
    start: Date,
    end: Date,
    isSelected: boolean,
  ) => ({
    style: {
      backgroundColor: event.color,
      border: isSelected ? '2px black solid' : 'none',
      padding: isSelected ? '2px' : '4px',
    }
  }), []);

  const handleEventSelect = (event: Event) => {
    hike.setCurrentLeg(event.leg.id)
  };

  return (
    <ReactCalendar
      localizer={localizer}
      events={events}
      views={[Views.MONTH]}
      style={{ backgroundColor: 'white', ...style }}
      eventPropGetter={eventPropGetter}
      onSelectEvent={handleEventSelect}
      selected={selected}
    />
  )
});

export default Calendar;
