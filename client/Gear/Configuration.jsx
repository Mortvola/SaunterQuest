import React from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { Field, Form, Formik } from 'formik';
import IconButton from '../IconButton';
import { useDeleteConfirmation } from '../DeleteConfirmation';
import { useStores } from '../Planner/state/store';
import { gramsToPoundsAndOunces } from '../utilities';
import AutoSubmit from './AutoSubmit';

const Configuration = ({
  configuration,
}) => {
  const { uiState } = useStores();
  // const [totalPackWeight, setTotalPackWeight] = useState(configuration.packWeight);
  // const [totalWornWeight, setTotalWornWeight] = useState(configuration.wornWeight);
  const [DeleteConfirmation, handleDeleteClick] = useDeleteConfirmation(
    'Are you sure you want to delete this configuration?',
    () => {
      configuration.delete();
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

  const handleSubmit = async (values) => {
    configuration.update(values.name);
  };

  const weight = configuration.weight();

  return (
    <Formik
      initialValues={{
        name: configuration.name,
      }}
      onSubmit={handleSubmit}
    >
      <Form>
        <div className={className} onClick={handleClick}>
          <div className="gear-config-group" style={{ gridArea: 'title', marginBottom: '1rem' }}>
            <label className="gear-config-label">Name</label>
            <Field
              type="text"
              className="config-title"
              name="name"
            />
          </div>
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
        <AutoSubmit />
      </Form>
    </Formik>
  );
};

Configuration.propTypes = {
  configuration: PropTypes.shape().isRequired,
};

Configuration.defaultProps = {
};

export default observer(Configuration);
