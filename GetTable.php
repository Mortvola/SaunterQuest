<?php

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	// Include config file
	require_once "config.php";
	
	try
	{
		$statement = $pdo->prepare("select foodItemId, name, weight, calories, price from foodItem");
		
		$statement->execute ();
		
		$output = $statement->fetchAll (PDO::FETCH_ASSOC);
		
		echo json_encode($output);
	}
	catch(PDOException $e)
	{
		echo $e->getMessage();
	}
	
	$pdo = null;
}
?>
