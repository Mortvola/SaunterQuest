<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');

Route::get('/editHike', function () {
    return view('editHike');
})->name('editHike');

Route::get('/trails', 'TrailController@get');

Route::get('/route', 'RouteController@get');

Route::get('/schedule', 'ScheduleController@get');

Route::get('/pointOfInterest', 'PointOfInterestController@get');

Route::get('/resupplyLocation', 'ResupplyLocationController@get');

Route::get('/hikerProfile', 'HikerProfileController@get');

Route::get('/trailCondition', 'TrailConditionController@get');

Route::get('/resupplyPlan', 'ResupplyPlanController@get');
