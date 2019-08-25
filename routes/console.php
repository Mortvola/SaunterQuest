<?php

use Illuminate\Foundation\Inspiring;
use App\Trail;
use App\Route;
use App\Schedule;

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


Artisan::command('userSchedule:get {userId} {userHikeId}', function ($userId, $userHikeId) {
    $this->info(Schedule::get($userId, $userHikeId));
})->describe('Gets the sechedule for the route specified by the provided userId and userHikeId');
