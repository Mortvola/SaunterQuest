<?php

require_once "routeFile.php";

$segments = getRouteFromFile ("/var/www/html/data/100049");

echo (json_encode ($segments));

?>
