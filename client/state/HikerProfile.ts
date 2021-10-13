import { makeAutoObservable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import Hike from './Hike';
import { HikerProfileInterface, ProfileProps } from './Types';

class HikerProfile implements HikerProfileInterface {
  id: number | null;

  startDay: number | null;

  endDay: number | null;

  startTime: number | null;

  endTime: number | null;

  breakDuration: number | null;

  speedFactor: number | null;

  endDayExtension: number | null;

  hike: Hike;

  constructor(props: ProfileProps, hike: Hike) {
    this.id = props.id;
    this.startDay = props.startDay;
    this.endDay = props.endDay;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.breakDuration = props.breakDuration;
    this.speedFactor = props.speedFactor;
    this.endDayExtension = props.endDayExtension;
    this.hike = hike;

    makeAutoObservable(this);
  }

  async update(profile: ProfileProps): Promise<void> {
    type UpdateHikerProfileRequest = {
      breakDuration: number | null,
      speedFactor: number | null,
      endDayExtension: number | null,
      startTime: number | null,
      endTime: number | null,
      startDay: number | null,
      endDay: number | null,
    }

    const response = await Http.put<UpdateHikerProfileRequest, ProfileProps>(`/hike/${this.hike.id}/hiker-profile/${this.id}`, {
      breakDuration: profile.breakDuration,
      speedFactor: profile.speedFactor,
      endDayExtension: profile.endDayExtension,
      startTime: profile.startTime,
      endTime: profile.endTime,
      startDay: profile.startDay,
      endDay: profile.endDay,
    });

    if (response.ok) {
      const body = await response.body();

      runInAction(() => {
        // this.hikerProfiles.push(new HikerProfile(body));
      });
    }
  }
}

export default HikerProfile;
