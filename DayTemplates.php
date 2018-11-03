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
	    	$stmt = $pdo->prepare("select dt.dayTemplateId AS dayTemplateId, dt.name AS name, sum(fi.calories)AS calories, sum(fi.weight) as weight, sum(fi.price) as price from dayTemplate dt join dayTemplateFoodItem dtfi on dtfi.dayTemplateId = dt.dayTemplateId join foodItem fi on fi.foodItemId = dtfi.foodItemId where userId = :userId group by dt.name, dt.dayTemplateId");
	        
	    	if ($stmt)
	        {
	        	$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
	        	$paramUserId = $_SESSION["userId"];
	        	
	        	$stmt->execute ();
		        
		        $output = $stmt->fetchAll (PDO::FETCH_ASSOC);

		        foreach ($output as $row)
		        {
 		        	echo "<tr>";
 		        	echo "<td>";
 		        	echo "<a class='btn btn-sm' href='/addfoodtomeal.php?id=", $row["dayTemplateId"], "'><span class='glyphicon glyphicon-pencil'></span></a>";
 		        	echo "<a class='btn btn-sm'><span class='glyphicon glyphicon-trash'></span></a>";
 		        	echo $row["name"], "</td>";
 		        	//echo "<td><a href='/addfoodtomeal.php?id=", $row["dayTemplateId"], "'>", $row["name"], "</a></td>";
 		        	echo "<td>", $row["calories"], "</td>";
 		        	echo "<td>", $row["fat"], "</td>";
 		        	echo "<td>", $row["carbs"], "</td>";
 		        	echo "<td>", $row["protein"], "</td>";
 		        	echo "<td>", $row["weight"], "</td>";
 		        	echo "<td>", $row["price"], "</td>";
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
</body>
</html>
