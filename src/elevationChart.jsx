import React from 'react';
import Chart from 'react-google-charts';
import { getRoute } from './tempstore';

// google.charts.load('current', { packages: ['corechart'] });
// google.charts.setOnLoadCallback(initializeCharts);

let chartsInitialized = false;
// let elevation;

let elevationData = [];
let elevationMin = 0;
let elevationMax = 11000;
// let elevationDataTable;
// let elevationChart;
let startIndex = 0;

// function initializeCharts() {
//     createCharts();
//     loadData();
// }

function loadData() {
    if (chartsInitialized) {
        // elevationDataTable = google.visualization.arrayToDataTable(elevationData);

        // drawCharts();
    }
}

// function createCharts() {
//     elevationChart = new google.visualization.LineChart(document.getElementById('elevation_chart_div'));
//     chartsInitialized = true;

//     google.visualization.events.addListener(elevationChart, 'select',
//         () => {
//             const objects = elevationChart.getSelection();

//             // If there are no objects in the array then there is no selection.
//             if (objects.length == 0) {
//                 document.dispatchEvent(new Event('elevationUnselected'));
//             }
//             else {
//                 // There should only be one entry in the objects array
//                 // for this type of chart so just access the first one
//                 // in the array.
//                 document.dispatchEvent(new CustomEvent('elevationSelected', { detail: { routeIndex: startIndex + objects[0].row } }));
//             }
//         });
// }

// function drawCharts() {
//     let elevationOptions = {
//         title: 'Elevation',
//         legend: { position: 'none' },
//         chartArea: { width: '90%' },
//         vAxis: { viewWindowMode: 'pretty' },
//         vAxis: { viewWindow: { min: elevationMin, max: elevationMax } },
//     };

//     elevationChart.draw(elevationDataTable, elevationOptions);
// }

const ElevationChart = () => (
    <div className="ele-grid-item">
        <Chart
            chartType="LineChart"
            width="100%"
            height="100%"
            data={elevationData}
            options={{
                legend: { position: 'none' },
                focusTarget: 'datum',
            }}
        />
    </div>
);

function getAndLoadElevationData(s, e) {
    elevationData = [];

    elevationData.push([{ label: 'Distance', type: 'number' }, { label: 'Elevation', type: 'number' }]);

    startIndex = s;

    getRoute().getElevations(elevationData, s, e);

    loadData();
}

// $().ready(() => {
//     $(window).resize(function () {
//         if (this.resizeTO) {
//             clearTimeout(this.resizeTO);
//         }

//         this.resizeTO = setTimeout(function () {
//             $(this).trigger('resizeEnd');
//             $(this).resizeTO = undefined;
//         }, 500);
//     });

//     $(window).on('resizeEnd', () => {
//         drawCharts();
//     });
// });

const setElevationMinMax = (min, max) => {
    elevationMin = min;
    elevationMax = max;
};

export default ElevationChart;
export { getAndLoadElevationData, setElevationMinMax };
