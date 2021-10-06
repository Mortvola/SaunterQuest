import { makeAutoObservable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import { BaseHikeProps } from './Types';

class HikeItem {
  id: number;

  name: string;

  requesting = false;

  duration: number | null = null;

  distance: number | null = null;

  constructor(props: BaseHikeProps) {
    this.id = props.id;

    this.name = props.name;

    this.requestDetails();

    makeAutoObservable(this);
  }

  requestDetails = async (): Promise<void> => {
    this.setRequesting(true);
    const response = await Http.get(`/api/hike/${this.id}/details`);

    if (response.ok) {
      const details = await response.json();

      runInAction(() => {
        this.duration = details.duration;
        this.distance = details.distance;
        this.setRequesting(false);
      });
    }
  }

  setRequesting = (requesting: boolean): void => {
    this.requesting = requesting;
  }
}

export default HikeItem;
