<?php

// Initialize the session
session_start();

// Processing form data when form is submitted
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true)
{
	$segments = file_get_contents("CDT.json");
	
	echo $segments;
}

?>
