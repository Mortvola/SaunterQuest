import Http from '@mortvola/http';
import { DateTime } from 'luxon';
import { BlackoutDatesProps } from '../../../common/ResponseTypes';
import { BlackoutDatesInterface } from './Types';

class BlackoutDates implements BlackoutDatesInterface {
  id: number;

  name: string;

  start: DateTime;

  end: DateTime;

  constructor(props: BlackoutDatesProps) {
    this.id = props.id;
    this.name = props.name;
    this.start = DateTime.fromISO(props.start);
    this.end = DateTime.fromISO(props.end);
  }

  async update(name: string, start: DateTime, end: DateTime) {
    type BlackoutDatesRequest = {
      name: string,
      start: string,
      end: string,
    };

    const response = await Http.patch<BlackoutDatesRequest, BlackoutDatesProps>(`/api/blackout-dates/${this.id}`, {
      name,
      start: start.toISODate(),
      end: end.toISODate(),
    });

    if (response.ok) {
      const body = await response.body();

      this.name = body.name;
      this.start = DateTime.fromISO(body.start);
      this.end = DateTime.fromISO(body.end);
    }
  }
}

export default BlackoutDates;
