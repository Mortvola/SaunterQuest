<?php

use Illuminate\Foundation\Inspiring;
use App\Map;
use App\Trail;
use App\Route;
use App\Schedule;
use App\PointOfInterest;
use App\ResupplyLocation;
use App\HikerProfile;
use App\TrailCondition;
use App\ResupplyPlan;
use App\Export;
use App\Hike;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->describe('Display an inspiring quote');


Artisan::command('trail:get {bounds}', function ($bounds) {
    $this->info(Trail::getTrail($bounds));
})->describe('Gets the trails within the bounds provided (Top Lat, Left Lon, Right Lat, Bottom Lon)');


Artisan::command('userRoute:get {hikeId}', function ($hikeId) {
    $this->info(json_encode((new Route($hikeId))->get()));
})->describe('Gets the route specified by the provided hike ID');


Artisan::command('export:get {userId} {userHikeId} {maxSegmentPoints} {maxDistance}', function ($userId, $userHikeId, $maxSegmentPoints, $maxDistance) {
    $this->info((new Export ($userId, $userHikeId, $maxSegmentPoints, $maxDistance))->get());
})->describe('Exports the plan for the hike specified by the provided userHikeId');


Artisan::command('hikeSchedule:get {userId} {userHikeId}', function ($userId, $userHikeId) {
    $days = (new Schedule ($userId, $userHikeId))->get();
    $this->info(json_encode($days));
})->describe('Gets the sechedule for the route specified by the provided userId and userHikeId');


Artisan::command('pointOfInterest:get {userHikeId}', function ($userHikeId) {
    $this->info(PointOfInterest::get()->where('userHikeId', $userHikeId));
})->describe('Gets the points of interest for the hike specified by the provided userHikeId');


Artisan::command('resupplyLocation:get {userHikeId}', function ($userHikeId) {
    $this->info(ResupplyLocation::get($userHikeId));
})->describe('Gets the resupply locations for the hike specified by the provided userHikeId');


Artisan::command('hikerProfile:get {userHikeId}', function ($userHikeId) {
    $this->info(HikerProfile::where('userHikeId', $userHikeId)->get());
})->describe('Gets the hiker profiles for the hike specified by the provided userHikeId');


Artisan::command('trailCondition:get {userHikeId}', function ($userHikeId) {
    $this->info(TrailCondition::where('userHikeId', $userHikeId)->get());
})->describe('Gets the trail conditions for the hike specified by the provided userHikeId');


Artisan::command('resupplyPlan:get {userId} {userHikeId}', function ($userId, $userHikeId) {
    $this->info(ResupplyPlan::get($userId, $userHikeId));
})->describe('Gets the trail conditions for the hike specified by the provided userId and userHikeId');


Artisan::command('hike:get {userId}', function ($userId) {
    $this->info(Hike::where('userId', $userId)->get ());
})->describe('Gets the hikes for the user specified by the provided userId');


Artisan::command('map:getPathFromPoint {lat} {lng}', function ($lat, $lng) {
    $result = Map::getTrailFromPoint ((object)["lat" => floatval($lat), "lng" => floatval($lng)]);
    $this->info(json_encode($result));
})->describe('Gets the hikes for the user specified by the provided userId');
