import { makeAutoObservable, runInAction } from 'mobx';
import GearConfigurationItem from './GearConfigurationItem';
import GearItem from './GearItem';
import { Store } from './store';
import { httpDelete, postJSON, putJSON } from './Transports';
import { GearConfigItemProps, GearConfigProps } from './Types';

class GearConfiguration {
  id: number;

  name: string;

  wornWeight: number;

  packWeight: number;

  consumableWeight: number;

  items: Array<GearConfigurationItem> = [];

  store: Store;

  constructor(props: GearConfigProps, store: Store) {
    this.id = props.id;
    this.name = props.name;
    this.wornWeight = props.wornWeight ?? 0;
    this.packWeight = props.packWeight ?? 0;
    this.consumableWeight = props.consumableWeight ?? 0;
    this.store = store;

    makeAutoObservable(this);
  }

  sortItems = (): void => {
    runInAction(() => {
      switch (this.store.uiState.gearConfigSort) {
        case 'System':
          this.items.sort((a, b) => {
            const comparison = a.gearItem.system.localeCompare(b.gearItem.system);

            if (comparison === 0) {
              return a.gearItem.name.localeCompare(b.gearItem.name);
            }

            return comparison;
          });
          break;

        case 'Name':
          this.items.sort((a, b) => a.gearItem.name.localeCompare(b.gearItem.name));
          break;

        case 'Weight':
          this.items.sort((a, b) => a.totalGrams() - b.totalGrams());
          break;

        default:
          break;
      }
    });
  }

  private weight = (): { wornWeight: number, packWeight: number, consumableWeight: number } => {
    if (this.items.length > 0) {
      let wornWeight = 0;
      let packWeight = 0;
      let consumableWeight = 0;

      this.items.forEach((item) => {
        const weight = item.totalGrams();
        if (item.worn) {
          wornWeight += weight;
        }
        else if (item.gearItem.consumable) {
          consumableWeight += weight;
        }
        else {
          packWeight += weight;
        }
      });

      return { wornWeight, packWeight, consumableWeight };
    }

    return {
      wornWeight: this.wornWeight,
      packWeight: this.packWeight,
      consumableWeight: this.consumableWeight,
    };
  }

  getItems = async (): Promise<void> => {
    const response = await fetch(`/gear/configuration/${this.id}/items`);

    if (response.ok) {
      const body: Array<GearConfigItemProps> = await response.json();

      runInAction(() => {
        this.items = body.map((ci) => (
          new GearConfigurationItem(ci, this, this.store)
        ));

        this.sortItems();
      });
    }
  }

  addItem = async (item: GearItem): Promise<void> => {
    const response = await postJSON(`/gear/configuration/${this.id}/item`, {
      gearConfigurationId: this.id,
      gearItemId: item.id,
      quantity: 1,
      worn: false,
    });

    if (response.ok) {
      const body = await response.json();

      runInAction(() => {
        this.items.push(new GearConfigurationItem(body, this, this.store));
        this.sortItems();
      });
    }
  }

  deleteItem = async (item: GearConfigurationItem): Promise<void> => {
    const response = await httpDelete(`/gear/configuration/${this.id}/item/${item.id}`);

    if (response.ok) {
      runInAction(() => {
        const index = this.items.findIndex((i) => i === item);

        if (index !== -1) {
          this.items.splice(index, 1);
        }
      });
    }
  }

  update = async (name: string): Promise<void> => {
    const response = await putJSON(`/gear/configuration/${this.id}`, { name });

    if (response.ok) {
      runInAction(() => {
        this.name = name;
      });
    }
  }
}

export default GearConfiguration;
