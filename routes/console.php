<?php

use Illuminate\Foundation\Inspiring;
use App\Trail;

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
