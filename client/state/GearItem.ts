import { makeAutoObservable } from 'mobx';
import { Store } from './store';
import { GearItemProps } from './Types';

class GearItem {
  id: number | null = null;

  consumable = false;

  description = '';

  name = '';

  system = '';

  unitOfMeasure = 'oz';

  weight = 0;

  store: Store;

  constructor(props: GearItemProps | null, store: Store) {
    if (props !== null) {
      this.id = props.id;
      this.consumable = props.consumable;
      this.description = props.description;
      this.name = props.name;
      this.system = props.system;
      this.unitOfMeasure = props.unitOfMeasure;
      this.weight = props.weight;
    }

    this.store = store;

    makeAutoObservable(this);
  }

  delete = (): void => {
    this.store.gear.deleteGearItem(this);
  }
}

export default GearItem;
