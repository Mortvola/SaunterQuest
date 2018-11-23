<?php
// Initialize the session
session_start();
 
// Check if the user is logged in, if not then redirect him to login page
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
	header("location: login.php");
	exit;
}

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
	<title>Welcome</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
	<script src="/jquery-3.3.1.min.js"></script>
	<script src="/bootstrap.min.js"></script>
	<style type="text/css">
		body{ font: 14px sans-serif; }
		.grid-container
		{
		  display: grid;
		  grid-template-columns: auto auto auto;
		  justify-content: space-between;
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

	<!-- Modal -->
	<div class="modal fade" id="locationModal" role="dialog">
		<div class="modal-dialog">
		
			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header">
					<button type="button" class="close" data-dismiss="modal">&times;</button>
					<h4 class="modal-title">Location</h4>
				</div>
				<div class="modal-body">
					<p id=locationInfo></p>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				</div>
			</div>
			
		</div>
	</div> <!--  Modal -->

	<div class="container-fluid" style="position:absolute;top:0;left:0;bottom:0;right:0;padding:0">
		<div class="col-md-8" style="padding:0;height:100%">
			<div id="googleMap" style="width:100%;height:100%"></div>
		</div>
		<div class="col-md-4" style="height:100%;padding:0px 5px 0px 5px">
			<div style="display:grid;height:100%">
				<nav>
					<ul class="nav nav-tabs" role="tablist">
						<li role="presentation" class="active"><a href="#">Itinerary</a></li>
						<li role="presentation"><a href="#">Hiker Profiles</a></li>
						<li role="presentation"><a href="#">Equipment</a></li>
						<li role="presentation"><a href="#">Trail Conditions</a></li>
					</ul>
				</nav>
				<div id="schedule" style="overflow:scroll;width:100%;height:100%;">
				</div>
			</div>
		</div>
	</div>
	
	<script>
		var userHikeId = <?php echo $userHikeId ?>;
	</script>
	<script	src="/editHike.js"></script>
	
	<script async defer
	 src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB16_kVJjm2plHSOkrxZDC4etbpp6vW8kU&callback=myMap&libraries=geometry">
	</script>
</body>
</html>
