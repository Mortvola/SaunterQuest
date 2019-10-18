<?php
use App\Map;
use App\Route;
use App\Elevation;

require_once "coordinates.php";



function getHikeFolder ($userHikeId)
{
    return base_path("data/" . $userHikeId . "/");
}

