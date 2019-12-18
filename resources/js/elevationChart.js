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
