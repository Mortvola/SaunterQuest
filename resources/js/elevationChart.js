<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
<script type="text/javascript">
"use strict";

google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(initializeCharts);

var chartsInitialized = false;
var elevation;

var elevationData = [];
var elevationMin = 0;
var elevationMax = 11000;
var elevationDataTable;
var elevationChart;

function initializeCharts ()
{
    createCharts ();
    loadData ();
}

function loadData ()
{
    if (chartsInitialized)
    {
        elevationDataTable = google.visualization.arrayToDataTable (elevationData);

        drawCharts ();
    }
}

function createCharts ()
{
    elevationChart = new google.visualization.LineChart(document.getElementById('elevation_chart_div'));
    chartsInitialized = true;
    
    google.visualization.events.addListener(elevationChart, 'select',
        function ()
        {
            let objects = elevationChart.getSelection ();

            // If there are no objects in the array then there is no selection.
            if (objects.length == 0)
            {
                document.dispatchEvent(new Event('elevationUnselected'));
            }
            else
            {
                // There should only be one entry in the objects array
                // for this type of chart so just access the first one
                // in the array.
                document.dispatchEvent(new CustomEvent('elevationSelected', {detail: {routeIndex: objects[0].row}}));
            }
        });
}

function drawCharts ()
{
    var elevationOptions = {
        title: 'Elevation',
        legend: {position: 'none'},
        chartArea: {width:'90%'},
        vAxis: {viewWindowMode: 'pretty'},
        vAxis: {viewWindow: {min: elevationMin, max: elevationMax}}
    };

    elevationChart.draw(elevationDataTable, elevationOptions);
}

function getAndLoadElevationData (s, e)
{
    elevationData = [];
    
    elevationData.push([{label: 'Distance', type: 'number'}, {label: 'Elevation', type: 'number'}]);
    
    route.getElevations (elevationData,s, e);
    
    loadData ();
}


$().ready (function ()
    {
        $(document).on('routeUpdated', function ()
            {
                getAndLoadElevationData (0, route.getLength ());
            });
    
        $(window).resize(function()
            {
                if (this.resizeTO)
                {
                    clearTimeout(this.resizeTO);
                }
                
                this.resizeTO = setTimeout(function()
                    {
                        $(this).trigger('resizeEnd');
                        $(this).resizeTO = undefined;
                    }, 500);
            });
        
        $(window).on('resizeEnd', function()
            {
                drawCharts();
            });
    });

</script>
