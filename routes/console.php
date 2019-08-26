<?php

use Illuminate\Foundation\Inspiring;
use App\Trail;
use App\Route;
use App\Schedule;
use App\PointOfInterest;
use App\ResupplyLocation;
use App\HikerProfile;
use App\TrailCondition;
use App\ResupplyPlan;

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


Artisan::command('userRoute:get {userHikeId}', function ($userHikeId) {
    $this->info(Route::get($userHikeId));
})->describe('Gets the route specified by the provided userHikeId');


Artisan::command('hikeSchedule:get {userId} {userHikeId}', function ($userId, $userHikeId) {
    $schedule = Schedule::get($userId, $userHikeId);
    $this->info($schedule);
})->describe('Gets the sechedule for the route specified by the provided userId and userHikeId');


Artisan::command('pointOfInterest:get {userHikeId}', function ($userHikeId) {
    $this->info(PointOfInterest::get($userHikeId));
})->describe('Gets the points of interest for the hike specified by the provided userHikeId');


Artisan::command('resupplyLocation:get {userHikeId}', function ($userHikeId) {
    $this->info(ResupplyLocation::get($userHikeId));
})->describe('Gets the resupply locations for the hike specified by the provided userHikeId');


Artisan::command('hikerProfile:get {userId} {userHikeId}', function ($userId, $userHikeId) {
    $this->info(HikerProfile::get($userId, $userHikeId));
})->describe('Gets the hiker profiles for the hike specified by the provided userId and userHikeId');


Artisan::command('trailCondition:get {userId} {userHikeId}', function ($userId, $userHikeId) {
    $this->info(TrailCondition::get($userId, $userHikeId));
})->describe('Gets the trail conditions for the hike specified by the provided userId and userHikeId');


Artisan::command('resupplyPlan:get {userId} {userHikeId}', function ($userId, $userHikeId) {
    $this->info(ResupplyPlan::get($userId, $userHikeId));
})->describe('Gets the trail conditions for the hike specified by the provided userId and userHikeId');
