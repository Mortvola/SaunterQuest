import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import EditableText from '../Hikes/EditableText';
import IconButton from '../IconButton';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import { useStores } from '../state/store';
import { gramsToPoundsAndOunces } from '../utilities';

const Configuration = ({
  configuration,
}) => {
  const { uiState } = useStores();
  // const [totalPackWeight, setTotalPackWeight] = useState(configuration.packWeight);
  // const [totalWornWeight, setTotalWornWeight] = useState(configuration.wornWeight);
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this configuration?',
    () => {
      fetch(`/gear/configuration/${configuration.id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      })
        .then((response) => {
          if (response.ok) {
            // $(this).parents('.card').remove();
          }
        });
    },
  );

  const handleClick = () => {
    runInAction(() => {
      if (uiState.selectedGearConfiguration === configuration) {
        uiState.selectedGearConfiguration = null;
      }
      else {
        uiState.selectedGearConfiguration = configuration;
      }
    });
  };

  let className = 'gear-configuration bpp-shadow';
  if (uiState.selectedGearConfiguration === configuration) {
    className += ' selected';
  }

  const weight = configuration.weight();

  return (
    <div className={className} onClick={handleClick}>
      <EditableText
        className="config-title"
        url={`/gear/configuration/${configuration.id}`}
        prop="name"
        style={{ display: 'inline-block', gridArea: 'title' }}
        defaultValue={configuration.name}
      />
      <IconButton className="gear-configuration-delete" icon="trash-alt" onClick={handleDeleteClick} />
      <div className="config-weight pack">
        <div>Pack Weight:</div>
        <div>
          {
            gramsToPoundsAndOunces(weight.packWeight)
          }
        </div>
      </div>
      <div className="config-weight worn">
        <div>Worn Weight:</div>
        <div>
          {
            gramsToPoundsAndOunces(weight.wornWeight)
          }
        </div>
      </div>
      <div className="config-weight consumable">
        <div>Consumable Weight:</div>
        <div>
          {
            gramsToPoundsAndOunces(weight.consumableWeight)
          }
        </div>
      </div>
      <DeleteConfirmation />
    </div>
  );

  // if (configuration.gear_configuration_items
  //     && configuration.gear_configuration_items.length > 0) {
  //     configuration.gear_configuration_items.forEach((configItem) => {
  //         let gearItemId;

  //         if (configItem.gear_item) {
  //             gearItemId = configItem.gear_item.id;
  //         }

  //         const row = newGearConfigItemRow(configuration.id, configItem.id, gearItemId);

  //         setNamedValues(row, configItem);

  //         if (configItem.gear_item) {
  //             setNamedValues(row, configItem.gear_item);

  //             row.find('.uofm-text').text(configItem.gear_item.unitOfMeasure);
  //         }

  //         const weight = row.computeWeight();

  //         if (configItem.worn) {
  //             totalWornWeight += weight;
  //         }
  //         else {
  //             totalPackWeight += weight;
  //         }

  //         gearItem.after(row);
  //     });
  // }
  // else {
  //     const nextRow = newGearConfigItemRow(configuration.id);
  //     gearItem.after(nextRow);
  // }

  // collapse.droppable(
  //     {
  //         accept: '.gear-item',
  //         drop(event, ui) {
  //             const row = newGearConfigItemRow(
  //                configuration.id, undefined, ui.helper.data('id')
  //             );
  //             const record = getNamedValues(ui.helper);

  //             setNamedValues(row, record);

  //             gearItem.after(row);
  //             event.stopPropagation();

  //             row.delayedSave();
  //         },
  //     },
  // );

  // collapse.on('sortreceive');

  // $('#gear-kits').append(card);

  // return card;
};

Configuration.propTypes = {
  configuration: PropTypes.shape().isRequired,
};

Configuration.defaultProps = {
};

export default observer(Configuration);
