import { makeObservable, observable, runInAction } from 'mobx';
import Http from '@mortvola/http';
import GearConfiguration from './GearConfiguration';
import GearItem from './GearItem';
import { Store } from './store';
import { GearConfigItemProps } from './Types';

class GearConfigurationItem {
  id: number;

  gearItem: GearItem;

  quantity: number;

  worn: boolean;

  configuration: GearConfiguration;

  store: Store;

  constructor(
    props: GearConfigItemProps,
    configuration: GearConfiguration,
    store: Store,
  ) {
    this.id = props.id;
    this.configuration = configuration;
    this.gearItem = new GearItem(props.gearItem, store);
    this.quantity = props.quantity;
    this.worn = props.worn;

    this.store = store;

    makeObservable(this, {
      quantity: observable,
      worn: observable,
      gearItem: observable,
    });
  }

  update = async (props: { worn: boolean, quantity: number }): Promise<void> => {
    const response = await Http.put(`/gear/configuration/${this.configuration.id}/item/${this.id}`, {
      worn: props.worn,
      quantity: props.quantity,
    });

    if (response.ok) {
      const body: GearConfigItemProps = await response.json();

      runInAction(() => {
        this.worn = body.worn;
        this.quantity = body.quantity;
      });
    }
  }

  delete = (): void => {
    this.configuration.deleteItem(this);
  }

  totalGrams = (): number => {
    let totalGrams = this.gearItem.weight * this.quantity;

    switch (this.gearItem.unitOfMeasure) {
      case '':
      case 'oz':
        totalGrams *= 28.3495;
        break;

      case 'lb':
        totalGrams *= 453.592;
        break;

      case 'kg':
        totalGrams *= 1000;
        break;
      default:
        break;
    }

    return totalGrams;
  };
}

export default GearConfigurationItem;
