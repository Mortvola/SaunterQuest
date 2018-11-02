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
    <title>Daily Templates</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
    <style type="text/css">
        body{ font: 14px sans-serif; text-align: center; }
    </style>
</head>
<body>
    <div class="page-header">
        <h1>Daily Templates</h1>
    </div>
    <nav class="navbar navbar-default">
        <div class="container-fluid">
            <ul class="nav navbar-nav">
                <li class="nav-item"><a class="nav-link" href="/welcome.php">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Daily View</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Segment View</a></li>
                <li class="nav-item"><a class="nav-link" href="/CreateFoodItem.php">Create Food Item</a></li>
                <li class="nav-item active"><a class="nav-link">Day Templates</a></li>
            </ul>
        </div>
    </nav>
    
 	<a class="btn" href="/addfoodtomeal.php">Create Template</a>
 	    
 	<?php
	    // Include config file
	    require_once "config.php";
	    
	    try
	    {
	    	$stmt = $pdo->prepare("select dayTemplateId, name from dayTemplate where userId = :userId");
	        
	    	if ($stmt)
	        {
	        	$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
	        	$paramUserId = $_SESSION["userId"];
	        	
	        	$stmt->execute ();
		        
		        $output = $stmt->fetchAll (PDO::FETCH_ASSOC);

		        echo "<ul>";
		        foreach ($output as $row)
		        {
		        	echo "<li><a href='/addfoodtomeal.php?id=", $row["dayTemplateId"], "'>", $row["name"], "</a></li>\n";
		        }
		        echo "</ul>";
		        
		        unset($stmt);
	        }
	    }
	    catch(PDOException $e)
	    {
	        echo $e->getMessage();
	    }
	    
	    unset($pdo);
	?>
 	    
</body>
</html>
