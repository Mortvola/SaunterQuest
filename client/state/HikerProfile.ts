import { makeAutoObservable, runInAction } from 'mobx';
import Hike from './Hike';
import { putJSON } from './Transports';
import { ProfileProps } from './Types';

class HikerProfile {
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

  update = async (profile: ProfileProps): Promise<void> => {
    const response = await putJSON(`/hike/${this.hike.id}/hiker-profile/${this.id}`, {
      breakDuration: profile.breakDuration,
      speedFactor: profile.speedFactor,
      endDayExtension: profile.endDayExtension,
      startTime: profile.startTime,
      endTime: profile.endTime,
      startDay: profile.startDay,
      endDay: profile.endDay,
    });

    if (response.ok) {
      const body: ProfileProps = await response.json();

      runInAction(() => {
        // this.hikerProfiles.push(new HikerProfile(body));
      });
    }
  }
}

export default HikerProfile;
