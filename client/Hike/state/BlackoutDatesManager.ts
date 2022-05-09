import Http from '@mortvola/http';
import { DateTime } from 'luxon';
import { makeAutoObservable } from 'mobx';
import { BlackoutDatesProps } from '../../../common/ResponseTypes';
import BlackoutDates from './BlackoutDates';
import { BlackoutDatesInterface, BlackoutDatesManagerInterface } from './Types';

class BlackoutDatesManager implements BlackoutDatesManagerInterface {
  hikeId: number;

  blackoutDates: BlackoutDates[] = [];

  constructor(hikeId: number) {
    this.hikeId = hikeId;

    makeAutoObservable(this);
  }

  async load(): Promise<void> {
    const response = await Http.get<BlackoutDatesProps[]>(`/api/hike/${this.hikeId}/blackout-dates`);

    if (response.ok) {
      const body = await response.body();

      this.blackoutDates = body.map((b) => new BlackoutDates(b));
    }
  }

  async addBlackoutDates(name: string, start: DateTime, end: DateTime): Promise<void> {
    type BlackoutDates = {
      name: string,
      start: string,
      end: string,
    };

    const response = await Http.post<BlackoutDates, BlackoutDatesProps>(
      `/api/hike/${this.hikeId}/blackout-dates`,
      {
        name,
        start: start.toISODate(),
        end: end.toISODate(),
      },
    );

    if (response.ok) {
      const body = await response.body();

      this.blackoutDates = [
        ...this.blackoutDates,
        new BlackoutDates(body),
      ];
    }
  }

  async deleteBlackoutDates(blackoutDates: BlackoutDatesInterface): Promise<void> {
    const response = await Http.delete(`/api/blackout-dates/${blackoutDates.id}`);

    if (response.ok) {
      const index = this.blackoutDates.findIndex((b) => b.id === blackoutDates.id);

      if (index !== -1) {
        this.blackoutDates = [
          ...this.blackoutDates.slice(0, index),
          ...this.blackoutDates.slice(index + 1),
        ];
      }
    }
  }
}

export default BlackoutDatesManager;
