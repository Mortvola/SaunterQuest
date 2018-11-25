<?php

// Initialize the session
session_start();

// Processing form data when form is submitted
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true)
{
	header("location: /login.php");
	
	exit;
}

?>
