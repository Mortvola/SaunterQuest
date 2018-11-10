<?php
// Initialize the session
session_start();
 
// Check if the user is logged in, if not then redirect him to login page
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    header("location: login.php");
    exit;
}
?>
 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Welcome</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
    <style type="text/css">
        body{ font: 14px sans-serif; }
    </style>
</head>
<body>
    <div class="page-header" style=" text-align: center;">
        <h1>Backpacker's Planner</h1>
    </div>
    <p  style="text-align: center;">
        <a href="reset-password.php" class="btn btn-warning">Reset Your Password</a>
        <a href="logout.php" class="btn btn-danger">Sign Out of Your Account</a>
    </p>
    <nav class="navbar navbar-default">
        <div class="container-fluid">
            <ul class="nav navbar-nav">
                <li class="nav-item active"><a class="nav-link">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Daily View</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Segment View</a></li>
                <li class="nav-item"><a class="nav-link" href="/CreateFoodItem.php">Create Food Item</a></li>
                <li class="nav-item"><a class="nav-link" href="/DayTemplates.php">Daily Meal Plans</a></li>
            </ul>
        </div>
    </nav>
    <div>
	    <button type="button" onclick="calculate()">Calculate</button>
	    <div class="container-fluid">
	        <div class="col-md-2">
	        </div>
	        <div class="col-md-8">
			    <table class="table table-condensed">
				    <thead><th>Day</th><th>Mile</th><th>Start Time</th><th>End Time</th><th>Food Weight</th><th>Notes</th></thead>
				    <tbody id="schedule"></tbody>
			    </table>
		    </div>
	        <div class="col-md-2">
	        </div>
	    </div>
    </div>
    <script>
    "use strict";
    
		function calculate ()
		{
			var xmlhttp = new XMLHttpRequest ();
			xmlhttp.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
  					let data = JSON.parse(this.responseText);

  					let txt = "";
  					let day = 0;
  					
  					for (let d in data)
  					{
  	  					let ounces = data[d].accumWeight * 0.035274;
  	  					let pounds = Math.floor (ounces / 16.0);
  	  					ounces = Math.round(ounces % 16.0);
  	  	  					
  	  					txt += "<tr>"
  	  	  					+ "<td>" + day + "</td>"
  	  	  					+ "<td>" + data[d].mile + "</td>"
  	  	  					+ "<td>" + data[d].startTime + "</td>"
  	  	  					+ "<td>" + data[d].endTime + "</td>"
  	  	  					+ "<td>" + pounds + " lb " + ounces  + "oz</td>"
  	  	  					+ "<td>" + data[d].notes  + "</td>"
  	  	  					+ "</tr>\n";

  	  					day++;
  					}

					document.getElementById ("schedule").innerHTML = txt;
 				}
			}

			xmlhttp.open("GET", "calculate.php?id=" + <?php echo $_SESSION["userId"]?>, true);
			//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send();
		}
		
    </script>
</body>
</html>
