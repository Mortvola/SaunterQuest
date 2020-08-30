import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Chart from 'react-google-charts';

const ElevationChart = ({
    route,
}) => {
    const [elevationData, setElevationData] = useState([]);

    useEffect(() => {
        if (route) {
            const elevations = route.getElevations();

            if (elevations.data.length > 0) {
                setElevationData({
                    ...elevations,
                    data: [
                        [{ label: 'Distance', type: 'number' }, { label: 'Elevation', type: 'number' }],
                        ...elevations.data,
                    ],
                });
            }
        }
    }, [route]);

    return (
        <div className="ele-grid-item">
            <Chart
                chartType="LineChart"
                width="100%"
                height="100%"
                data={elevationData.data}
                options={{
                    legend: { position: 'none' },
                    focusTarget: 'datum',
                    vAxis: {
                        viewWindow: {
                            min: elevationData.min,
                            max: Math.max(elevationData.max, 10),
                        },
                    },
                }}
            />
        </div>
    );
};

ElevationChart.propTypes = {
    route: PropTypes.shape(),
};

ElevationChart.defaultProps = {
    route: null,
};

export default ElevationChart;
