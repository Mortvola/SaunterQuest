<?php

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	if($_SERVER["REQUEST_METHOD"] == "POST")
	{
        // Include config file
        require_once "config.php";
       
        $obj = json_decode($_POST["x"], false);
        
        // 
        if (!property_exists($obj, "dayTemplateId"))
        {
        	$sql = "INSERT INTO dayTemplate (creationDate, modificationDate, name, userId) VALUES (now(), now(), :name, :userId)";
         	
         	if($stmt = $pdo->prepare($sql))
         	{
         		$stmt->bindParam(":name", $paramName, PDO::PARAM_STR);
         		$stmt->bindParam(":userId", $paramUserId, PDO::PARAM_INT);
         		
         		$paramName = $obj->name;
         		$paramUserId = $_SESSION["userId"];
         		
         		$stmt->execute ();
         		
         		$obj->dayTemplateId = $pdo->lastInsertId ("dayTemplateId");
         		
         		unset($stmt);
         	}
        }

        if (property_exists($obj, "dayTemplateId"))
        {
        	// Prepare a select statement
	        $sql = "INSERT INTO dayTemplateFoodItem (creationDate, modificationDate, dayTemplateId, foodItemId) VALUES (now(), now(), :dayTemplateId, :itemId)";
        
	        if($stmt = $pdo->prepare($sql))
	        {
	            // Bind variables to the prepared statement as parameters
	            $stmt->bindParam(":itemId", $paramItemId, PDO::PARAM_STR);
	            $stmt->bindParam(":dayTemplateId", $paramDayTemplateId, PDO::PARAM_INT);
	            
	            foreach ($obj->items as $item)
	            {
	                // Set parameters
	                $paramDayTemplateId = $obj->dayTemplateId;
	                $paramItemId = $item->foodItemId;
	                
	                $stmt->execute ();
	            }
	            
	            // Close statement
	            unset($stmt);
	        }
	
	        // Close connection
	        unset($pdo);
        }
	}
}
?>
