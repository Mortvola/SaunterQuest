import React, { useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { observer } from 'mobx-react-lite';
import ConfigurationItem from './ConfigurationItem';
import IconButton from '../IconButton';
import { useStores } from '../state/store';
import { gramsToPoundsAndOunces } from '../utilities';

const ConfigurationItems = () => {
  const { uiState } = useStores();
  const { selectedGearConfiguration: configuration } = uiState;
  const [, dropRef] = useDrop({
    accept: 'gear-item',
    drop(item) {
      if (configuration) {
        configuration.addItem(item);
      }
    },
  });

  useEffect(() => {
    if (configuration) {
      configuration.getItems();
    }
  }, [configuration]);

  const handleClick = () => {
  };

  const handleSortChange = (event) => {
    uiState.gearConfigSort = event.target.value;
    configuration.sortItems();
  };

  const Items = observer(() => {
    if (configuration) {
      if (uiState.gearConfigSort === 'System') {
        let system = null;

        let items = [];

        for (let i = 0; i < configuration.items.length;) {
          system = configuration.items[i].gearItem.system;
          let systemPackWeight = 0;
          let systemWornWeight = 0;
          let systemConsumableWeight = 0;
          const systemItems = [];
          while (
            i < configuration.items.length
            && configuration.items[i].gearItem.system === system
          ) {
            systemItems.push(
              <ConfigurationItem key={configuration.items[i].id} item={configuration.items[i]} />,
            );
            if (configuration.items[i].worn) {
              systemWornWeight += configuration.items[i].totalGrams();
            }
            else if (configuration.items[i].gearItem.consumable) {
              systemConsumableWeight += configuration.items[i].totalGrams();
            }
            else {
              systemPackWeight += configuration.items[i].totalGrams();
            }
            i += 1;
          }

          items.push(
            <div key={system}>
              <div>{system}</div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'small',
                  margin: '0 1rem',
                }}
              >
                <div>
                  {`Pack: ${gramsToPoundsAndOunces(systemPackWeight)}`}
                </div>
                <div>
                  {`Worn: ${gramsToPoundsAndOunces(systemWornWeight)}`}
                </div>
                <div>
                  {`Consumable: ${gramsToPoundsAndOunces(systemConsumableWeight)}`}
                </div>
              </div>
            </div>,
          );
          items = items.concat(systemItems);
        }

        return items;
      }

      return configuration.items.map((i) => (
        <ConfigurationItem key={i.id} item={i} />
      ));
    }

    return null;
  });

  return (
    <div className="gear-config-items">
      <div className="gear-kits-title">
        {
          configuration
            ? (
              <>
                { `Items for ${configuration.name}` }
                <IconButton
                  icon="plus"
                  invert
                  onClick={handleClick}
                  style={{ margin: '0 3px' }}
                />
                <div style={{ margin: '0 3px' }}>
                  Sort By
                  <select
                    value={uiState.gearConfigSort}
                    onChange={handleSortChange}
                    style={{ margin: '0 4px' }}
                  >
                    <option>Name</option>
                    <option>System</option>
                    <option>Weight</option>
                  </select>
                </div>
              </>
            )
            : 'No configuration selected'
        }
      </div>
      <div ref={dropRef} className="gear-configuration-items">
        <Items />
      </div>
    </div>
  );
};

export default observer(ConfigurationItems);
