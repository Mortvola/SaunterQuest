<?php

require_once "checkLogin.php";

// Include config file
require_once "config.php";

$hikeId = $_GET["orig"];
$userHikeId = $_GET["id"];

if ($hikeId)
{
	require_once "cloneHike.php";
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Edit Hike</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
	<script src="/jquery-3.3.1.min.js"></script>
	<script src="/bootstrap.min.js"></script>
	<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
	<script type="text/javascript">
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

// 				var xmlhttp = new XMLHttpRequest ();
// 				xmlhttp.onreadystatechange = function ()
// 				{
// 					if (this.readyState == 4 && this.status == 200)
// 					{
// 						elevation = JSON.parse(this.responseText);

// 						elevationData = new google.visualization.DataTable (elevation);

// 						drawCharts ();
// 					}
// 				};

// 				xmlhttp.open("GET", "retirementCalculate.php?plan=" + currentPlanId, true);
// 				//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
// 				xmlhttp.send();
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
	</script>
	<style type="text/css">
		body{ font: 14px sans-serif; }
		.grid-container
		{
		  display: grid;
		  grid-template-columns: auto auto auto;
		  justify-content: space-between;
		}
		.resupply-grid
		{
			display: grid;
			grid-template-columns: auto auto;
			justify-content: space-between;
		}
		.resupply-grid-item
		{
			overflow:hidden;
			white-space:nowrap;
			text-overflow:ellipsis;
		}
		.context-menu
		{
			position: absolute;
			border: 1px solid #999;
			box-shadow: 1px 3px 3px rgba(0, 0, 0, .3);
			margin-top: -10px;
			margin-left: 10px;
		}
		.context-menu-item
		{
			padding: 3px;
			background: white;
			color: #666;
			font-weight: bold;
			font-family: sans-serif;
			font-size: 12px;
			cursor: pointer;
		}
		.context-menu-item:hover
		{
			background: #eee;
		}
	</style>
</head>
<body>
	<!-- Modal -->
	<div class="modal fade" id="myModal" role="dialog">
		<div class="modal-dialog">

			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal">&times;</button>
					<h4 class="modal-title">Modal Header</h4>
				</div>
				<div class="modal-body">
					<p>Some text in the modal.</p>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				</div>
			</div>

		</div>
	</div> <!--  Modal -->

	<?php require_once "hikerProfile/hikerProfileDialog.php"; ?>

	<!-- Modal -->
	<div class="modal fade" id="addResupplyLocation" role="dialog">
		<div class="modal-dialog">

			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal">&times;</button>
					<h4 class="modal-title">Resupply Location</h4>
				</div>
				<div class="modal-body">
				<form id='resupplyLocationForm'>
					<label>Name:</label>
					<input type="text" class='form-control' name='name'/>
					<br/>

					<label>In Care Of:</label>
					<input type="text" class='form-control' name='inCareOf'/>
					<br/>

					<label>Address 1:</label>
					<input type="text" class='form-control' name='address1'/>
					<br/>

					<label>Address 2:</label>
					<input type="text" class='form-control' name='address2'/>
					<br/>

					<label>City:</label>
					<input type="text" class='form-control' name='city'/>
					<br/>

					<label>State:</label>
					<input type="text" class='form-control' name='state'/>
					<br/>

					<label>Zip Code:</label>
					<input type="text" class='form-control' name='zip'/>
					<br/>
				</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn" data-dismiss="modal">Cancel</button>
					<button id='resupplyLocationSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
				</div>
			</div>

		</div>
	</div> <!--  Modal -->

	<!-- Modal -->
	<div class="modal fade" id="addPointOfInterest" role="dialog">
		<div class="modal-dialog">
			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal">&times;</button>
					<h4 class="modal-title">Point of Interest</h4>
				</div>
				<div class="modal-body">
					<form id='pointOfInterestForm'>
						<label>Name:</label>
						<input type="text" class='form-control' name='name'/>
						<br/>

						<label>Description:</label>
						<input type="text" class='form-control' name='description'/>
						<br/>
						<label>Hang Out (in minutes)</label>
						<input type="text" class='form-control' name='hangOut'/>
						<br />
					</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn" data-dismiss="modal">Cancel</button>
					<button id='pointOfInterestSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
				</div>
			</div>
		</div>
	</div> <!--  Modal -->

	<!-- Modal -->
	<div class="modal fade" id="addLinger" role="dialog">
		<div class="modal-dialog">

			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal">&times;</button>
					<h4 class="modal-title">Add Linger</h4>
				</div>
				<div class="modal-body">
					<form id='lingerForm'>
						<label>Duration (in minutes):</label>
						<input type="text" class='form-control' name='name'/>
						<br/>
					</form>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn" data-dismiss="modal">Cancel</button>
					<button id='lingerSaveButton' type="button" class="btn btn-default" data-dismiss="modal">Save</button>
				</div>
			</div>

		</div>
	</div> <!--  Modal -->

	<!-- Modal -->
	<div class="modal fade" id="modalDialog" role="dialog">
		<div class="modal-dialog">

			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal">&times;</button>
					<h4 id=modalTitle class="modal-title"></h4>
				</div>
				<div class="modal-body">
					<p id=modalBody></p>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				</div>
			</div>

		</div>
	</div> <!--  Modal -->

	<div class="container-fluid" style="position:absolute;top:0;left:0;bottom:0;right:0;padding:0">
		<nav id='sideBar' class='col-md-1' style="background-color:SlateGray;height:100%">
		<ul class='list-unstyled'>
		<li><a class="nav-link" href="/welcome.php" style="color:white">Home</a></li>
		<li><a class="nav-link" href="/DayTemplates.php" style="color:white">Food Plans</a></li>
		</ul>
		</nav>
		<div class="col-md-7" style="display:flex;flex-direction:column;padding:0;height:100%">
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
			<div id="googleMap" style="width:100%;height:100%"></div>
			<div id='elevation' style="height:250px">
				<div id="elevation_chart_div" style="width:100%;height:90%">
				</div>
			</div>
		</div>
		<div class="col-md-4" style="height:100%;padding:0px 5px 0px 5px">
			<div style="display:grid;align-content:start;grid-template-rows: auto auto;height:100%">
				<ul class="nav nav-tabs" role="tablist">
					<li role="presentation" class="active"><a data-toggle="tab" href="#schedule">Schedule</a></li>
					<li role="presentation"><a data-toggle="tab" href="#trailConditions">Trail Conditions</a></li>
					<li role="presentation"><a data-toggle="tab" href="#hikerProfiles">Hiker Profiles</a></li>
					<li role="presentation"><a data-toggle="tab" href="#equipment">Gear</a></li>
					<li role="presentation"><a data-toggle="tab" href="#resupply" onclick="loadResupply()">Resupply</a></li>
					<li role="presentation"><a data-toggle="tab" href="#todoList">To-do</a></li>
					<li role="presentation"><a data-toggle="tab" href="#notes">Notes</a></li>
				</ul>
				<div style="overflow:scroll;width:100%;height:100%;">
					<div class="tab-content">
						<div id="schedule" class="tab-pane fade in active">
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
							<tbody">
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
							<tbody">
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
							<tbody">
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
	</div>

	<script>
		var userHikeId = <?php echo $userHikeId ?>;
	</script>

	<script src="/utilities.js"></script>
	<script src="/contextMenu.js"></script>
	<script src="/pointOfInterest.js"></script>
	<script	src="/editHike.js"></script>
	<script	src="/hikerProfile/hikerProfile.js"></script>
	<script src="/resupplyPlan.js"></script>
	<script src="/routeHighlighting.js"></script>
	<script src="/trailCondition.js"></script>

	<script async defer
	 src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB16_kVJjm2plHSOkrxZDC4etbpp6vW8kU&callback=myMap&libraries=geometry">
	</script>
</body>
</html>
