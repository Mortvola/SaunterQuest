<?php

require_once "routeFile.php";

$segments = getRouteFromFile ("/var/www/html/data/100051");

echo (json_encode ($segments));

?>
