<?php

require_once "checkLogin.php";

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Create Food Item</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.css">
    <style type="text/css">
        body{ font: 14px sans-serif; }
        input.grams { max-width:100px; }
        .sub-nutrient-label { text-indent:50px;font-weight:normal; }
		hr {
		       display: block;
		       position: relative;
		       padding: 0;
		       margin: 8px auto;
		       height: 1px;
		       width: 100%;
		       max-height: 0;
		       font-size: 1px;
		       line-height: 0;
		       clear: both;
		       border: none;
		       border-top: 2px solid #000000;
		       border-bottom: 2px solid #000000;
		    }
    </style>
</head>
<body>
    <div class="page-header" style="text-align: center;">
        <h1>Create Food Item</h1>
    </div>
    <div class="container-fluid">
    	<div class="row">
        	<div class="col-md-1">
        	</div>
        	<div class="col-md-3">
			    <form class="form-inline" action="" method="post">
			
			        <label>Manufacturer:</label>
			        <input type="text" class='form-control' name="manufacturer" required="required"/>
			    	<br/>
			
			        <label>Name:</label>
			        <input type="text" class='form-control' name="name" required="required"/>
			    	<br/>
			
			        <label>Serving Description:</label>
			        <input type="text" class='form-control' name="servingDescription" required="required"/>
			    	<br/>
			
			        <label>Grams per Serving:</label>
			        <input type="number" class='form-control grams' name="gramsServingSize" required="required"/>
			    	<br/>
			
					<hr>
					
			        <label>Calories:</label>
			        <input type="number" class='form-control' name="calories" required="required"/>
			    	<br/>
			    	
			    	<hr>
			    	
			        <label>Total Fat:</label>
			        <input type="number" class='form-control grams' name="totalFat" required="required"/>
			    	<br/>
			    	
			        <label class='sub-nutrient-label'>Saturated Fat:</label>
			        <input type="number" class='form-control grams' name="saturatedFat"/>
			    	<br/>
			    	
			        <label class='sub-nutrient-label'>Trans Fat:</label>
			        <input type="number" class='form-control grams' name="transFat"/>
			    	<br/>
			    	
			        <label>Cholesterol:</label>
			        <input type="number" class='form-control grams' name="cholesterol"/>
			    	<br/>
			    	
			        <label>Sodium:</label>
			        <input type="number" class='form-control grams' name="sodium"/>
			    	<br/>
			    	
			        <label>Total Carbohydrates:</label>
			        <input type="number" class='form-control grams' name="totalCarbohydrates" required="required"/>
			    	<br/>
			    	
			        <label class='sub-nutrient-label'>Dietary Fiber:</label>
			        <input type="number" class='form-control grams' name="dietaryFiber"/>
			    	<br/>
			    	
			        <label class='sub-nutrient-label'>Sugars:</label>
			        <input type="number" class='form-control grams' name="sugars"/>
			    	<br/>
			    	
			        <label>Protein:</label>
			        <input type="number" class='form-control grams' name="protein" required="required"/>
			    	<br/>
			    	
			    	<hr>
			    	
			        <input type="submit" value=" Submit " name="submit"/>
			        <br/>
			    </form>
		    </div>
		    <div class="col-md-8">
		    </div>
	    </div>
	</div>
    <?php
    if(isset($_POST["submit"]))
    {
        // Include config file
        require_once "config.php";
        
        try
        {
            $sql = "INSERT INTO foodItem (creationDate, modificationDate, manufacturer, name, calories, gramsServingSize,
										  totalFat, saturatedFat, transFat, cholesterol, sodium, totalCarbohydrates,
										  dietaryFiber, sugars, protein)
            		VALUES (now(), now(), :manufacturer, :name, :calories, :gramsServingSize,
							:totalFat, :saturatedFat, :transFat, :cholesterol,
							:sodium, :totalCarbohydrates, :dietaryFiber,
							:sugars, :protein)";
        
            if ($stmt = $pdo->prepare($sql))
            {
	            $stmt->bindParam(":manufacturer", $paramManufacturer, PDO::PARAM_STR);
	            $stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
	            $stmt->bindParam(":calories", $paramCalories, PDO::PARAM_INT);
	            $stmt->bindParam(":gramsServingSize", $paramGramsServingSize, PDO::PARAM_INT);
	            $stmt->bindParam(":totalFat", $paramTotalFat, PDO::PARAM_INT);
	            $stmt->bindParam(":saturatedFat", $paramSaturatedFat, PDO::PARAM_INT);
	            $stmt->bindParam(":transFat", $paramTransFat, PDO::PARAM_INT);
	            $stmt->bindParam(":cholesterol", $paramCholesterol, PDO::PARAM_INT);
	            $stmt->bindParam(":sodium", $paramSodium, PDO::PARAM_INT);
	            $stmt->bindParam(":totalCarbohydrates", $paramTotalCarbohydrates, PDO::PARAM_INT);
	            $stmt->bindParam(":dietaryFiber", $paramDietaryFiber, PDO::PARAM_INT);
	            $stmt->bindParam(":sugars", $paramSugars, PDO::PARAM_INT);
	            $stmt->bindParam(":protein", $paramProtein, PDO::PARAM_INT);
	            
 	            $paramManufacturer = $_POST["manufacturer"];
 	            $paramName = $_POST["name"];
 	            $paramCalories = $_POST["calories"];
 	            $paramGramsServingSize = $_POST["gramsServingSize"];
 	            
 	            $paramTotalFat = $_POST["totalFat"];
 	            
 	            if ($_POST["saturatedFat"] != "")
 	            {
	 	            $paramSaturatedFat = $_POST["saturatedFat"];
 	            }
 	            
 	            if ($_POST["transFat"] != "")
 	            {
 	            	$paramTransFat = $_POST["transFat"];
 	            }
 	            
 	            if ($_POST["cholesterol"] != "")
 	            {
 	            	$paramCholesterol = $_POST["cholesterol"];
 	            }
 	            
 	            if ($_POST["sodium"] != "")
 	            {
 	            	$paramSodium = $_POST["sodium"];
 	            }
 	            
 	            $paramTotalCarbohydrates = $_POST["totalCarbohydrates"];
 	            
 	            if ($_POST["dietaryFiber"] != "")
 	            {
 	            	$paramDietaryFiber = $_POST["dietaryFiber"];
 	            }
 	            
 	            if ($_POST["sugars"] != "")
 	            {
 	            	$paramSugars = $_POST["sugars"];
 	            }
 	            
            	$paramProtein = $_POST["protein"];
            
           		$stmt->execute();
           		
           		$foodItemId = $pdo->lastInsertId ("foodItemId");
           		
           		unset($stmt);
           		
           		if ($foodItemId)
           		{
           			$sql = "INSERT INTO foodItemServingSize (creationDate, modificationDate, foodItemId, description, grams)
							VALUES (now(), now(), :foodItemId, :description, :grams)";
           			
           			if ($stmt = $pdo->prepare($sql))
           			{
           				$stmt->bindParam(":foodItemId", $paramFoodItemId, PDO::PARAM_INT);
           				$stmt->bindParam(":description", $paramDescription, PDO::PARAM_STR);
           				$stmt->bindParam(":grams", $paramGrams, PDO::PARAM_INT);
           				
           				$paramFoodItemId = $foodItemId;
           				$paramDescription = $_POST["servingDescription"];
           				$paramGrams = $_POST["gramsServingSize"];
           				
           				$stmt->execute ();
           				
           				unset($stmt);
           			}
           		}
            }
           
            unset($pdo);
        }
        catch(PDOException $e)
        {
        	http_response_code (500);
        	echo $e->getMessage();
        }
    }
    ?>
</body>
</html>
