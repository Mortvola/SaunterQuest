@extends('layouts.app')

@section('content')
    <style type="text/css">
        body{ font: 14px sans-serif; }
        .grid-container
        {
          display: grid;
          grid-template-columns: auto auto auto;
          justify-content: space-between;
        }
    </style>

	<?php require_once resource_path('js/elevationChart.js'); ?>

    @component('hikerProfileDialog')
    @endcomponent

	@component('addResupplyLocationDialog')
	@endcomponent

	@component('addPointOfInterestDialog')
	@endcomponent

	@component('addLingerDialog')
	@endcomponent
	
	@component('exportTrailDialog')
	@endcomponent

    <div class="row no-gutters" style="flex-wrap:nowrap;height:100%">
        <div class="col-md-8">
            <div id='editTrailConditions' style='display:none'>
                <form id='trailConditionForm'>
                    <div class="grid-container">
                        <div>
                        <label>Type:</label>
                        <select class="form-control" name='type'>
                            <option value=0>No Camping</option>
                            <option value=1>No Stealth Camping</option>
                            <option value=2>Other</option>
                        </select>
                        </div>
    
                        <div>
                        <label>Description:</label>
                        <input type="text" class='form-control' name='description'/>
                        </div>
    
                        <div>
                        <label>Speed Factor:</label>
                        <input type="number" class='form-control' name='speedFactor' value='100'/>
                        </div>
                    </div>
                </form>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick='cancelEditTrailConditions()'>Cancel</button>
                    <button id='trailConditionSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
                </div>
            </div>
            <div id='measureRoute' style='display:none'>
                <form id='measureRouteForm'>
                    <div class="grid-container">
                        <div>
                            <p>Distance: <span id='distance'></span></p>
                        </div>
                    </div>
                </form>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick='clearVertices()'>Clear Vertices</button>
                    <button type="button" class="btn" onclick='stopRouteMeasurement()'>Close</button>
                </div>
            </div>
            <div id='editRoute' style='display:none'>
                <form id='editRouteForm'>
                    <div class="grid-container">
                        <div>
                            <p>Distance: <span id='distance'></span></p>
                        </div>
                    </div>
                </form>
                <div class="modal-footer">
                    <button type="button" class="btn" onclick='clearVertices()'>Clear Vertices</button>
                    <button type="button" class="btn" onclick='stopRouteEdit()'>Close</button>
                </div>
            </div>
            <div class="row no-gutters flex-column" style="height:100%">
            	<div class="col">
	            	<div id="googleMap" style="width:100%;height:100%"></div>
	            </div>
            	<div class="col" style="flex-grow:0">
                    <div id="elevation_chart_div" style="width:100%;height:250px"></div>
                </div>
            </div>
        </div>
        <div class="col-md-4">
            <div style="display:grid;align-content:start;grid-template-rows: auto auto;height:100%">
                <ul class="nav nav-tabs" role="tablist">
                    <li class="nav-item"><a class="nav-link active" data-toggle="tab" href="#schedule">Schedule</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#trailConditions">Trail Conditions</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#hikerProfiles">Hiker Profiles</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#equipment">Gear</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#resupply" onclick="loadResupply()">Resupply</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#todoList">To-do</a></li>
                    <li class="nav-item"><a class="nav-link" data-toggle="tab" href="#notes">Notes</a></li>
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
                                <td><a class='btn btn-sm' onclick='addHikerProfile()'><span class='glyphicon glyphicon-plus'></span></a></td>
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
                                <td><a class='btn btn-sm' onclick='addGear()'><span class='glyphicon glyphicon-plus'></span></a></td>
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
                                <td><a class='btn btn-sm' onclick='addTrailCondition()'><span class='glyphicon glyphicon-plus'></span></a></td>
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
                                <td><a class='btn btn-sm' onclick='addTodo()'><span class='glyphicon glyphicon-plus'></span></a></td>
                            </tr>
                        </table>
                    </div>
                    <div id="notes" class="tab-pane fade">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        var userHikeId = {{ $_GET["id"] }};
    </script>

    <?php require_once resource_path('js/contextMenu.js'); ?>
    <?php require_once resource_path('js/pointOfInterest.js'); ?>
    <?php require_once resource_path('js/editHike.js'); ?>
    <?php require_once resource_path('js/hikerProfile.js'); ?>
    <?php require_once resource_path('js/resupplyPlan.js'); ?>
    <?php require_once resource_path('js/routeHighlighting.js'); ?>
    <?php require_once resource_path('js/trailCondition.js'); ?>

    <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB16_kVJjm2plHSOkrxZDC4etbpp6vW8kU&callback=myMap&libraries=geometry"></script>
@endsection
