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
        
        try
        {
        	$stmt = "DELETE FROM userHike WHERE userHikeId = :userHikeId";
        
        	if($stmt = $pdo->prepare($stmt))
	        {
	        	$stmt->bindParam(":userHikeId", $paramUserHikeId, PDO::PARAM_INT);
	        	
	        	$paramUserHikeId = $_POST["id"];
	        	
	        	$stmt->execute ();
	        	
	        	unset($stmt);
	        }
        }
        catch(PDOException $e)
        {
        	echo $e->getMessage();
        }

        // Close connection
        unset($pdo);
	}
}

?>