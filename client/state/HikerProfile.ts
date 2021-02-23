import { makeAutoObservable } from 'mobx';

interface ProfileProps {
  id: number;
}

class HikerProfile {
  id: number;

  constructor(props: ProfileProps) {
    this.id = props.id;

    makeAutoObservable(this);
  }
}

export default HikerProfile;
