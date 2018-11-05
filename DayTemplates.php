<?php
// Initialize the session
session_start();
 
// Check if the user is logged in, if not then redirect him to login page
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true)
{
    header("location: login.php");
    exit;
}
?>
 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Meal Plans</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
</head>
<body>
    <div class="page-header" style="text-align:center;">
        <h1>Daily Meal Plans</h1>
    </div>
    <nav class="navbar navbar-default">
        <div class="container-fluid">
            <ul class="nav navbar-nav">
                <li class="nav-item"><a class="nav-link" href="/welcome.php">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Daily View</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Segment View</a></li>
                <li class="nav-item"><a class="nav-link" href="/CreateFoodItem.php">Create Food Item</a></li>
                <li class="nav-item active"><a class="nav-link">Daily Meal Plans</a></li>
            </ul>
        </div>
    </nav>
    
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-12">
		 	<a class="btn" href="/addfoodtomeal.php">Create a day's meal plan</a>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
    <table class='table table-striped table-condensed'>
    <thead>
    	<th>Name</th><th>Calories</th><th>Fat</th><th>Carbs</th><th>Protein</th><th>Weight</th><th>Cost</th>
    </thead>
    <tbody>
 	<?php
	    // Include config file
	    require_once "config.php";
	    
	    try
	    {
	    	$stmt = $pdo->prepare("select dt.dayTemplateId AS dayTemplateId,
		    	dt.name AS name,
		    	floor(sum(fi.calories * dtfi.numberOfServings * (fiss.grams / fi.gramsServingSize)) + 0.5) AS calories,
		    	floor(sum(fi.totalFat * dtfi.numberOfServings * (fiss.grams / fi.gramsServingSize)) + 0.5) AS fats,
		    	floor(sum(fi.totalCarbohydrates * dtfi.numberOfServings * (fiss.grams / fi.gramsServingSize)) + 0.5) AS carbs,
		    	floor(sum(fi.protein * dtfi.numberOfServings * (fiss.grams / fi.gramsServingSize)) + 0.5) AS protein,
		    	suM(dtfi.numberOfServings * fiss.grams) as weight
		    	from dayTemplate dt
		    	join dayTemplateFoodItem dtfi on dtfi.dayTemplateId = dt.dayTemplateId
		    	join foodItem fi on fi.foodItemId = dtfi.foodItemId
		    	join foodItemServingSize fiss on fiss.foodItemId = fi.foodItemId and fiss.foodItemServingSizeId = dtfi.foodItemServingSizeId
		    	where userId = :userId
		    	group by dt.name, dt.dayTemplateId");
	    	
	    	
	    	if ($stmt)
	        {
	        	$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
	        	$paramUserId = $_SESSION["userId"];
	        	
	        	$stmt->execute ();
		        
		        $output = $stmt->fetchAll (PDO::FETCH_ASSOC);

		        foreach ($output as $row)
		        {
 		        	echo "<tr id='mealPlan_", $row["dayTemplateId"], "'>";
 		        	echo "<td>";
 		        	echo "<a class='btn btn-sm' href='/addfoodtomeal.php?id=", $row["dayTemplateId"], "'><span class='glyphicon glyphicon-pencil'></span></a>";
 		        	echo "<a class='btn btn-sm' onclick='deleteMealPlan(", $row["dayTemplateId"], ")'><span class='glyphicon glyphicon-trash'></span></a>";
 		        	
 		        	if ($row["name"] == "")
 		        	{
 		        		echo "Meal Plan #", $row["dayTemplateId"];
 		        	}
 		        	else
 		        	{
	 		        	echo $row["name"];
 		        	}
	 		        echo "</td>";
 		        	//echo "<td><a href='/addfoodtomeal.php?id=", $row["dayTemplateId"], "'>", $row["name"], "</a></td>";
 		        	echo "<td>", $row["calories"], "</td>";
 		        	echo "<td>", $row["fats"], "</td>";
 		        	echo "<td>", $row["carbs"], "</td>";
 		        	echo "<td>", $row["protein"], "</td>";
 		        	echo "<td>", $row["weight"], "</td>";
 		        	//echo "<td>", $row["price"], "</td>";
 		        	echo "</tr>";
		        }
		        
		        unset($stmt);
	        }
	    }
	    catch(PDOException $e)
	    {
	        echo $e->getMessage();
	    }
	    
	    unset($pdo);
	?>
    </tbody>
    </table>
	</div>
	</div>
	</div>
	
	<script>
		function deleteMealPlan (mealPlanId)
		{
			var xmlhttp = new XMLHttpRequest ();
			xmlhttp.onreadystatechange = function ()
			{
				if (this.readyState == 4 && this.status == 200)
				{
		 			let mealPlanRow = document.getElementById("mealPlan_" + mealPlanId);
		 			mealPlanRow.parentElement.removeChild(mealPlanRow);
				}
			}
			
			xmlhttp.open("POST", "DeleteMealPlan.php", true);
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send("mealPlanId=" + mealPlanId);
		}
	</script>
</body>
</html>
