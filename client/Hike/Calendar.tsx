import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Calendar as ReactCalendar, luxonLocalizer, SlotInfo, Views,
} from 'react-big-calendar';
import { DateTime } from 'luxon';
import { BlackoutDatesInterface, HikeInterface, HikeLegInterface } from './state/Types';
import { useBlackoutDialog } from './BlackoutDialog';

const localizer = luxonLocalizer(DateTime);

type PropsType = {
  hike: HikeInterface,
  style?: React.CSSProperties,
}

const Calendar: React.FC<PropsType> = observer(({
  hike,
  style,
}) => {
  const { blackoutDatesManager } = hike;

  const [dateRange, setDateRange] = React.useState<null | { start: DateTime, end: DateTime }>(null);
  const [BlackoutDialog, showBlackoutDialog] = useBlackoutDialog();
  const [blackoutDates, setBlackoutDates] = React.useState<BlackoutDatesInterface | null>(null);

  type Event = {
    title: string | null,
    start?: Date,
    end?: Date,
    allDay: boolean,
    color: string,
    leg: HikeLegInterface | null,
    type: 'leg' | 'blackout',
    blackoutDates: BlackoutDatesInterface | null,
  };

  const events = React.useMemo(() => {
    const e: Event[] = [];
    hike.hikeLegs.forEach((leg) => {
      if (leg.startType === 'date' && leg.startDate !== null) {
        e.push({
          title: leg.name,
          start: leg.startDate?.toJSDate(),
          end: leg.startDate?.plus({ days: leg.numberOfDays }).toJSDate(),
          allDay: true,
          color: leg.color,
          type: 'leg',
          leg,
          blackoutDates: null,
        });

        let nextLegs: { startDate: DateTime, leg: HikeLegInterface}[] = [];

        const getLegs = (startDate: DateTime, l: HikeLegInterface) => (
          l.nextLegs.map((nl) => {
            let newStartDate = startDate.plus({ days: l.numberOfDays + 1 });
            let newEndDate = newStartDate.plus({ days: nl.numberOfDays - 1 });

            blackoutDatesManager.blackoutDates.forEach((bld) => {
              if (newStartDate <= bld.end && newEndDate >= bld.start) {
                newStartDate = bld.end.plus({ days: 1 });
                newEndDate = newStartDate.plus({ days: nl.numberOfDays - 1 });
              }
            });

            return ({
              startDate: newStartDate,
              leg: nl,
            });
          })
        );

        nextLegs = nextLegs.concat(getLegs(leg.startDate, leg));

        let nextLeg = nextLegs.pop();

        while (nextLeg) {
          e.push({
            title: nextLeg.leg.name,
            start: nextLeg.startDate?.toJSDate(),
            end: nextLeg.startDate?.plus({ days: nextLeg.leg.numberOfDays }).toJSDate(),
            allDay: true,
            color: nextLeg.leg.color,
            type: 'leg',
            leg: nextLeg.leg,
            blackoutDates: null,
          });

          nextLegs = nextLegs.concat(getLegs(nextLeg.startDate, nextLeg.leg));
          nextLeg = nextLegs.pop();
        }
      }
    });

    return [
      ...blackoutDatesManager.blackoutDates.map<Event>((b) => ({
        title: b.name,
        start: b.start.toJSDate(),
        end: b.end.plus({ days: 1 }).toJSDate(),
        allDay: true,
        color: 'black',
        type: 'blackout',
        leg: null,
        blackoutDates: b,
      })),
      ...e,
    ];
  }, [blackoutDatesManager.blackoutDates, hike.hikeLegs]);

  const selected = React.useMemo(() => (
    events.find((e) => e.leg === hike.currentLeg)
  ), [events, hike.currentLeg]);

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
    },
  }), []);

  const handleEventSelect = (event: Event) => {
    if (event.type === 'leg' && event.leg !== null) {
      hike.setCurrentLeg(event.leg.id);
    }
    else if (event.type === 'blackout') {
      setBlackoutDates(event.blackoutDates);
      showBlackoutDialog();
    }
  };

  const handleDialogHide = () => {
    setBlackoutDates(null);
  };

  const handleSelectSlot = (slot: SlotInfo) => {
    setDateRange({
      start: DateTime.fromJSDate(slot.start),
      end: DateTime.fromJSDate(slot.end).minus({ days: 1 }),
    });
    showBlackoutDialog();
  };

  return (
    <>
      <ReactCalendar
        localizer={localizer}
        events={events}
        views={[Views.MONTH]}
        style={{ backgroundColor: 'white', ...style }}
        eventPropGetter={eventPropGetter}
        onSelectEvent={handleEventSelect}
        onSelectSlot={handleSelectSlot}
        selected={selected}
        selectable
        showAllEvents
      />
      <BlackoutDialog
        blackoutDatesManager={blackoutDatesManager}
        blackoutDates={blackoutDates ?? undefined}
        start={dateRange?.start}
        end={dateRange?.end}
        onHide={handleDialogHide}
      />
    </>
  );
});

export default Calendar;
