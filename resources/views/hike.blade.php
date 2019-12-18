@extends('layouts.app')

@section('content')
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
       integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
       crossorigin=""/>
    <link rel="stylesheet" href="{{ asset('css/leaflet.contextmenu.min.css') }}">

    <style type="text/css">
        body
        {
            font: 14px sans-serif;
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
        }

        .day-card-header
        {
          display: grid;
          grid-template-columns: auto auto auto;
          justify-content: space-between;
        }
        .map-info
        {
            display:none;
            position:absolute;
            top:10%;
            justify-self: center;
            width:200px;
            height:50px;
            background-color:white;
            border-radius:5px;
            box-shadow:0 2px 7px 1px rgba(0,0,0,0.3);
            z-index: 800;
        }
        .map-distance-window
        {
            width:14px;
            height:14px;
            font-size:14px
        }
        .map-please-wait
        {
            display:none;
            position:absolute;
            justify-self: center;
            align-self: center;
            width:100px;
            height:100px;
            background:rgba(255, 255, 255, 1.0);
            border-radius:5px;
            box-shadow:0 2px 7px 1px rgba(0,0,0,0.3);
            z-index: 800;
        }
        .map-please-wait-spinner
        {
            width: 5rem;
            height: 5rem;
            border-width: 10px;
        }
        .waypoint-table-header
        {
            border-bottom-style: solid;
        }
        .waypoint-table-header-cell
        {
            display:inline-block;
            font-weight:700;
        }
        .waypoint-table-cell
        {
            display:inline-block;
        }

        .map-grid-item
        {
            grid-area: map;
            display:grid;
            grid: minmax(0, 1fr) / minmax(0, 1fr);
            width:100%;
            height:100%
        }

        .ele-grid-item
        {
            grid-area: ele;
        }

        .controls-grid-item
        {
            grid-area: controls;
            border-right-style: solid;
            border-right-width: thin;
            height: 100%;
            display:grid;
            grid-template-rows: min-content minmax(0, 1fr);
        }

        .controls-grid-item .tab-content
        {
            height: 100%;
            background-color: #fbfbfb;
        }

        .hike-grid
        {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 3fr);
            grid-template-rows: minmax(0, 3fr) minmax(0, 1fr);
            grid-template-areas:
                "controls map"
                "controls ele"
                ;
            justify-items: stretch;
            align-items: stretch;
            align-content:stretch;
        }

        @media screen and (max-width: 668px)
        {
            .controls-grid-item
            {
                display:none;
            }
            .hike-grid
            {
                display: grid;
                grid-template-columns: minmax(0, 1fr);
                grid-template-rows: minmax(0, 3fr) minmax(0, 1fr);
                grid-template-areas:
                    "map"
                    "ele"
                    ;
                justify-items: stretch;
                align-items: stretch;
                align-content: stretch;
            }
        }

    </style>

	<?php require_once resource_path('js/elevationChart.js'); ?>

    @component('hikerProfileDialog')
    @endcomponent

	@component('addResupplyLocationDialog')
	@endcomponent

	@component('addPointOfInterestDialog')
	@endcomponent

    @component('waypointDialog')
    @endcomponent

	@component('addLingerDialog')
	@endcomponent

	@component('exportTrailDialog')
	@endcomponent

    <div class="hike-grid">
        <div class="map-grid-item">
        	<div id="map" style="width:100%;height:100%"></div>
			<div id="distanceWindow" class="map-info">
				<div>
                	<span>Distance</span>
                	<button id="distanceWindowClose" type="button" class="close map-distance-window">&times;</button>
				</div>
                <div id="distance" style="height:auto;text-align:center;vertical-align:middle"></div>
			</div>
            <div class="map-please-wait" id="pleaseWait">
                <div class="spinner-border text-primary m-2 map-please-wait-spinner" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            </div>
        </div>
    	<div class="ele-grid-item" id="elevation_chart_div">
        </div>
        <div class="controls-grid-item">
                <ul class="nav nav-tabs" role="tablist">
                    <li class="nav-item"><a class="nav-link active" data-toggle="tab" href="#schedule">Schedule</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#trailConditions">Trail Conditions</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#hikerProfiles">Hiker Profiles</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#equipment">Gear</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#resupply" onclick="loadResupply()">Resupply</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#todoList">To-do</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#notes">Notes</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#waypoints">Route</a></li>
                </ul>
                <div class="tab-content" style="overflow-y:scroll;width:100%;height:100%;">
                    <div id="schedule" class="tab-pane fade show active">
                    </div>
                    <div id="hikerProfiles" class="tab-pane fade">
                        <table class="table table-condensed">
                        <thead>
                        <tr>
                        <th style="text-align:right">Start<br/>Day</th>
                        <th style="text-align:right">End<br/>Day</th>
                        <th style="text-align:right">Speed<br/>Factor</th>
                        <th style="text-align:right">Start<br/>Time</th>
                        <th style="text-align:right">End<br/>Time</th>
                        <th style="text-align:right">Break<br/>Duration</th>
                        </tr>
                        </thead>
                        <tbody id="hikerProfilesTable">
                            <tr id="hikerProfileLastRow">
                                <td><a class='btn btn-sm' onclick='addHikerProfile()'><i class='fas fa-plus'></i></a></td>
                            </tr>
                        </table>
                    </div>
                    <div id="equipment" class="tab-pane fade">
                        <table class="table table-condensed">
                        <thead>
                        <tr>
                        <th>Type</th>
                        <th>Brand & Model</th>
                        <th>Max Distance</th>
                        <th>Current Distance</th>
                        </tr>
                        </thead>
                        <tbody>
                            <tr id="gearLastRow">
                                <td><a class='btn btn-sm' onclick='addGear()'><i class='fas fa-plus'></i></span></a></td>
                            </tr>
                        </table>
                    </div>
                    <div id="resupply" class="tab-pane fade">
                    </div>
                    <div id="trailConditions" class="tab-pane fade"> <!-- snow, relaxing hike, no camping, no stealth camping, etc -->
                        <table class="table table-condensed">
                        <thead>
                        <tr>
                        <th>Type</th>
                        <th>Description</th>
                        <th style='text-align:right'>Speed Factor</th>
                        </tr>
                        </thead>
                        <tbody>
                            <tr id="conditionsLastRow">
                                <td><a class='btn btn-sm' onclick='addTrailCondition()'><i class='fas fa-plus'></i></a></td>
                            </tr>
                        </table>
                    </div>
                    <div id="todoList" class="tab-pane fade">
                        <table class="table table-condensed">
                        <thead>
                        <tr>
                        <th>Task</th>
                        <th>Due Date</th>
                        </tr>
                        </thead>
                        <tbody>
                            <tr id="todoLastRow">
                                <td><a class='btn btn-sm' onclick='addTodo()'><i class='fas fa-plus'></i></span></a></td>
                            </tr>
                        </table>
                    </div>

                    <div id="notes" class="tab-pane fade">
                    </div>

                    <div id="waypoints" class="tab-pane fade">
                        <div>Waypoints:</div>
                        <div style="display:flex; flex-direction:column">
                            <div class="waypoint-table-header"><div class="waypoint-table-header-cell" style="width:15%;">Order</div><div class="waypoint-table-header-cell">Name</div></div>
                            <div id='sortable'>
                            </div>
                        </div>
                    </div>
                </div>
        </div>
    </div>

    <script>
    <?php require_once resource_path('js/waypoints.js'); ?>
    </script>

    <script>
        var userHikeId = {{ $hikeId }};
        var userAdmin = {{ Auth::user()->admin ? 'true' : 'false' }};
        var tileServerUrl = "{{ env('TILE_SERVER_URL', '') }}";
        var endOfDayUrl = "{{ asset('moon_pin.png') }}";
        var campUrl = "{{ asset('camp-ltblue-dot.png') }}";
    </script>

    <!-- Make sure you put this AFTER Leaflet's CSS -->
     <script src="https://unpkg.com/leaflet@1.6.0/dist/leaflet.js"
       integrity="sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew=="
       crossorigin=""></script>
    <script src="{{ asset('js/leaflet.contextmenu.min.js') }}"></script>

    <?php require_once resource_path('js/trailMarker.js'); ?>
    <script>
        <?php require_once resource_path('js/route.js'); ?>
    </script>
    <?php require_once resource_path('js/schedule.js'); ?>
    <?php require_once resource_path('js/pointOfInterest.js'); ?>
    <script defer>
        <?php require_once resource_path('js/hike.js'); ?>
        var hike = new Hike;

        hike.id = {{ $hikeId }};
    </script>
    <?php require_once resource_path('js/trails.js'); ?>
    <?php require_once resource_path('js/hikerProfile.js'); ?>
    <?php require_once resource_path('js/resupplyPlan.js'); ?>
    <?php require_once resource_path('js/routeHighlighter.js'); ?>
    <?php require_once resource_path('js/trailCondition.js'); ?>
@endsection
