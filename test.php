<?php

$skipSessionCheck = true;

$_SESSION["loggedin"] = true;
$_SERVER["REQUEST_METHOD"] = "GET";
$_SESSION["userId"] = 1;
$_GET["id"] = 100051;

$userHikeId = 100051;

require_once "resupplyPlan.php"

?>
