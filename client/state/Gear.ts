import { makeAutoObservable, runInAction, toJS } from 'mobx';
import Http from '@mortvola/http';
import GearConfiguration from './GearConfiguration';
import GearItem from './GearItem';
import { Store } from './store';
import { GearConfigProps, GearItemProps } from './Types';

class Gear {
  inventory: Array<GearItem> = [];

  configurations: Array<GearConfiguration> = [];

  store: Store;

  systems = new Map<string, boolean>();

  constructor(store: Store) {
    this.store = store;

    makeAutoObservable(this);
  }

  requestGearConfigurations = async (): Promise<void> => {
    const response = await Http.get('/gear/configuration');

    if (response.ok) {
      const body: Array<GearConfigProps> = await response.json();

      runInAction(() => {
        this.configurations = body.map((config) => new GearConfiguration(config, this.store));
      });
    }
  }

  addGearConfiguration = async (): Promise<void> => {
    const response = await Http.post('/gear/configuration');

    if (response.ok) {
      const body: GearConfigProps = await response.json();

      this.configurations.push(new GearConfiguration(body, this.store));
    }
  }

  deleteConfiguration = async (configuration: GearConfiguration): Promise<void> => {
    const response = await Http.delete(`/gear/configuration/${configuration.id}`);

    if (response.ok) {
      const index = this.configurations.findIndex((cfg) => cfg.id === configuration.id);

      if (index !== -1) {
        this.configurations.splice(index, 1);
      }
    }
  }

  requestGearInventory = async (): Promise<void> => {
    const response = await Http.get('/gear/item');

    if (response.ok) {
      const body: Array<GearItemProps> = await response.json();

      runInAction(() => {
        this.inventory = body.map((props) => {
          this.systems.set(props.system, true);
          return new GearItem(props, this.store);
        });

        this.inventory.sort((a, b) => a.name.localeCompare(b.name));
      });
    }
  }

  addNewGearInventoryItem = (): GearItem => {
    const item = new GearItem(null, this.store);

    runInAction(() => {
      this.inventory.push(item);
    });

    return item;
  }

  addInventoryItem = async (item: GearItem, values: GearItemProps): Promise<void> => {
    const response = await Http.post('/gear/item', {
      consumable: values.consumable,
      description: values.description,
      name: values.name,
      system: values.system,
      unitOfMeasure: values.unitOfMeasure,
      weight: values.weight,
    });

    if (response.ok) {
      const body: GearItemProps = await response.json();

      runInAction(() => {
        item.id = body.id;
        item.consumable = body.consumable;
        item.description = body.description;
        item.name = body.name;
        item.system = body.system;
        item.unitOfMeasure = values.unitOfMeasure;
        item.weight = values.weight;
      });
    }
  }

  updateInventoryItem = async (item: GearItem, values: GearItemProps): Promise<void> => {
    const response = await Http.put(`/gear/item/${item.id}`, {
      id: item.id,
      consumable: values.consumable,
      description: values.description,
      name: values.name,
      system: values.system,
      unitOfMeasure: values.unitOfMeasure,
      weight: values.weight,
    });

    if (response.ok) {
      const body: GearItemProps = await response.json();

      runInAction(() => {
        item.consumable = body.consumable;
        item.description = body.description;
        item.name = body.name;
        item.system = body.system;
        item.unitOfMeasure = values.unitOfMeasure;
        item.weight = values.weight;
      });
    }
  }

  private removeItem = (item: GearItem): void => {
    const index = this.inventory.findIndex((i) => i === item);

    if (index !== -1) {
      this.inventory.splice(index, 1);
    }
  }

  deleteGearItem = async (item: GearItem): Promise<void> => {
    if (item.id !== null) {
      const response = await Http.delete(`/gear/item/${item.id}`);

      if (response.ok) {
        runInAction(() => {
          this.removeItem(item);
        });
      }
    }
    else {
      runInAction(() => {
        this.removeItem(item);
      });
    }
  }
}

export default Gear;
