import { makeAutoObservable } from 'mobx';

class HikerProfile {
  constructor(props) {
    makeAutoObservable(this);

    this.setProfile(props);
  }

  setProfile(props) {
    if (props) {
      Object.keys(props).forEach((key) => {
        this[key] = props[key];
      });
    }
  }
}

export default HikerProfile;
