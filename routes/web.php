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
});

Route::get('/tileList', 'TrailController@getList');
Route::get('/tile', 'TrailController@get');

Route::post('/hike', 'HikeController@post');
Route::delete('/hike', 'HikeController@delete');

Route::get('/route', 'RouteController@get');
Route::put('/route', 'RouteController@put');

Route::get('/schedule', 'ScheduleController@get');

// Point of Interest operations
Route::get('/pointOfInterest', 'PointOfInterestController@get');
Route::post('/pointOfInterest', 'PointOfInterestController@post');
Route::put('/pointOfInterest', 'PointOfInterestController@put');
Route::delete('/pointOfInterest', 'PointOfInterestController@delete');

Route::get('/resupplyLocation', 'ResupplyLocationController@get');

Route::get('/hikerProfile', 'HikerProfileController@get');
Route::post('/hikerProfile', 'HikerProfileController@post');
Route::put('/hikerProfile', 'HikerProfileController@put');
Route::delete('/hikerProfile', 'HikerProfileController@delete');

Route::get('/trailCondition', 'TrailConditionController@get');

Route::get('/resupplyPlan', 'ResupplyPlanController@get');

Route::get('/exportTrail', 'ExportController@get');

Route::get('/elevation', 'ElevationController@get');

